-- Migration: Ensure all optimized RPCs are present and correct
-- Date: 2026-02-15 18:00:00

-- 1. get_leaderboard_with_scores (Fixes Empty Leaderboard)
CREATE OR REPLACE FUNCTION "public"."get_leaderboard_with_scores"(
  "p_limit" integer DEFAULT 25, 
  "p_offset" integer DEFAULT 0,
  "p_time_filter" text DEFAULT 'all_time'
)
RETURNS TABLE(
  "user_id" uuid,
  "full_name" text,
  "avatar_url" text,
  "points" integer,
  "current_streak" integer,
  "real_avg_score" numeric,
  "country" text
)
LANGUAGE "plpgsql" STABLE SECURITY DEFINER
SET "search_path" TO '' -- Security: bypass RLS by strictly defining search path, but explicit table refs required
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT 
      up.user_id,
      up.points,
      up.current_streak,
      u.full_name,
      u.avatar_url,
      u.country
    FROM public.user_points up
    JOIN public.users u ON u.id = up.user_id
    WHERE 
      CASE 
        WHEN p_time_filter = 'weekly' THEN up.updated_at >= (now() - interval '7 days')
        WHEN p_time_filter = 'monthly' THEN up.updated_at >= (now() - interval '30 days')
        ELSE true -- all_time
      END
    ORDER BY up.points DESC
    LIMIT p_limit
    OFFSET p_offset
  ),
  user_scores AS (
    SELECT 
      ts.user_id,
      AVG(ts.score) as avg_score
    FROM public.test_sessions ts
    WHERE ts.user_id IN (SELECT r.user_id FROM ranked_users r)
      AND ts.is_completed = true
      AND ts.score IS NOT NULL
    GROUP BY ts.user_id
  )
  SELECT 
    r.user_id,
    r.full_name,
    r.avatar_url,
    r.points,
    COALESCE(r.current_streak, 0) as current_streak,
    COALESCE(ROUND(s.avg_score, 1), 0.0) as real_avg_score,
    COALESCE(r.country, 'Global') as country
  FROM ranked_users r
  LEFT JOIN user_scores s ON s.user_id = r.user_id
  ORDER BY r.points DESC;
END;
$$;

ALTER FUNCTION "public"."get_leaderboard_with_scores"("p_limit" integer, "p_offset" integer, "p_time_filter" text) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."get_leaderboard_with_scores"("p_limit" integer, "p_offset" integer, "p_time_filter" text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_leaderboard_with_scores"("p_limit" integer, "p_offset" integer, "p_time_filter" text) TO "service_role";
GRANT EXECUTE ON FUNCTION "public"."get_leaderboard_with_scores"("p_limit" integer, "p_offset" integer, "p_time_filter" text) TO "anon";


-- 2. get_user_latest_sessions (Fixes Reading Test Cards)
-- Returns the latest session PER PASSAGE (DISTINCT ON passage_id)
CREATE OR REPLACE FUNCTION "public"."get_user_latest_sessions"("p_user_id" "uuid", "p_test_type" "text") 
RETURNS TABLE("passage_id" "uuid", "session_id" "uuid", "is_completed" boolean, "score" numeric, "progress_percentage" integer, "created_at" timestamp with time zone, "completed_at" timestamp with time zone)
LANGUAGE "plpgsql" STABLE SECURITY DEFINER
SET "search_path" TO ''
AS $$
BEGIN
  -- Security check: Requesting user must match the authenticated user
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND auth_id = auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: User cannot access another user''s sessions.';
  END IF;

  RETURN QUERY
  SELECT DISTINCT ON (
    COALESCE(ts.passage_id, (ts.content_data->>'passage_id')::UUID, (ts.content_data->>'id')::UUID)
  )
    COALESCE(ts.passage_id, (ts.content_data->>'passage_id')::UUID, (ts.content_data->>'id')::UUID) as passage_id,
    ts.id as session_id,
    ts.is_completed,
    ts.score,
    CASE 
      WHEN ts.is_completed THEN 100
      ELSE COALESCE(
        CASE 
          WHEN ts.user_responses IS NOT NULL AND jsonb_typeof(ts.user_responses) = 'object' 
          THEN (SELECT COUNT(*) FROM jsonb_object_keys(ts.user_responses))::INT * 100 / NULLIF(COALESCE(
            (ts.content_data->>'total_questions')::INT,
            40
          ), 0)
          WHEN ts.user_responses IS NOT NULL AND jsonb_typeof(ts.user_responses) = 'array'
          THEN jsonb_array_length(ts.user_responses) * 100 / NULLIF(COALESCE(
            (ts.content_data->>'total_questions')::INT,
            40
          ), 0)
          ELSE 0
        END,
        0
      )
    END::integer as progress_percentage,
    ts.created_at,
    ts.completed_at
  FROM public.test_sessions ts
  WHERE ts.user_id = p_user_id 
    -- Use specific test type filtering, handling potential casing issues if needed by LOWER? 
    -- For now, keep exact match to hit index, but frontend sends 'reading'.
    AND ts.test_type = p_test_type
  ORDER BY 
    COALESCE(ts.passage_id, (ts.content_data->>'passage_id')::UUID, (ts.content_data->>'id')::UUID),
    ts.created_at DESC;
END;
$$;

ALTER FUNCTION "public"."get_user_latest_sessions"("p_user_id" "uuid", "p_test_type" "text") OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."get_user_latest_sessions"("p_user_id" "uuid", "p_test_type" "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_user_latest_sessions"("p_user_id" "uuid", "p_test_type" "text") TO "service_role";


-- 3. get_user_usage_stats (Optimization)
CREATE OR REPLACE FUNCTION "public"."get_user_usage_stats"("p_user_id" "uuid") 
RETURNS jsonb
LANGUAGE "plpgsql" STABLE SECURITY DEFINER
SET "search_path" TO ''
AS $$
DECLARE
  v_writing_used INTEGER := 0;
  v_speaking_used INTEGER := 0;
  v_total_vocab INTEGER := 0;
  v_mastered_vocab INTEGER := 0;
  v_test_counts JSONB;
BEGIN
  -- Security check
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND auth_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- AI Usage Stats (Current Month)
  SELECT 
    COALESCE(SUM(CASE WHEN endpoint = 'generateDetailedFeedback' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN endpoint IN ('processSpeakingSession', 'evaluateSpeakingTest') THEN 1 ELSE 0 END), 0)
  INTO v_writing_used, v_speaking_used
  FROM public.ai_api_usage
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', now())
    AND cached = false;

  -- Vocabulary Stats
  SELECT 
    COUNT(*),
    COALESCE(SUM(CASE WHEN mastery_level >= 4 THEN 1 ELSE 0 END), 0)
  INTO v_total_vocab, v_mastered_vocab
  FROM public.vocabulary_items
  WHERE user_id = p_user_id;

  -- Test Session Counts (Completed)
  SELECT jsonb_object_agg(test_type, count)
  INTO v_test_counts
  FROM (
    SELECT test_type, COUNT(*) as count
    FROM public.test_sessions
    WHERE user_id = p_user_id AND is_completed = true
    GROUP BY test_type
  ) t;

  RETURN jsonb_build_object(
    'writingUsed', v_writing_used,
    'speakingUsed', v_speaking_used,
    'totalVocabulary', v_total_vocab,
    'masteredWords', v_mastered_vocab,
    'testCounts', COALESCE(v_test_counts, '{}'::jsonb)
  );
END;
$$;

ALTER FUNCTION "public"."get_user_usage_stats"("p_user_id" "uuid") OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."get_user_usage_stats"("p_user_id" "uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_user_usage_stats"("p_user_id" "uuid") TO "service_role";




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."calculate_question_row_count"("p_type" "text", "p_question_number" integer, "p_gap_fill" "jsonb", "p_table_data" "jsonb", "p_matching_features" "jsonb", "p_matching_data" "jsonb", "p_map_labeling" "jsonb", "p_flowchart" "jsonb", "p_allow_multiple" boolean, "p_question_count" integer, "p_question_text" "text") RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_count INTEGER := 0;
  v_mode text;
  v_json_item jsonb;
  v_json_row jsonb;
  v_cell_text text;
  v_rows jsonb;
BEGIN
  -- Handle Nulls
  p_type := COALESCE(p_type, '');

  -- 1. Gap Fill
  IF p_type = 'gap_fill' THEN
    IF p_gap_fill->>'question_count' IS NOT NULL THEN
       RETURN (p_gap_fill->>'question_count')::INTEGER;
    END IF;
    -- Fallback: Count [gap]
    RETURN (SELECT count(*) FROM regexp_matches(COALESCE(p_gap_fill->>'text', p_gap_fill->>'content', ''), '\[gap\]', 'gi'));
  END IF;

  -- 2. Range types (Sentence, Summary, Short Answer, etc)
  IF p_type IN ('sentence_completion', 'summary_completion', 'note_completion', 'notes_completion', 'flow_chart_completion', 'diagram_completion', 'short_answer') THEN
     IF p_question_number IS NOT NULL THEN
        IF p_gap_fill IS NOT NULL THEN
           IF p_gap_fill->>'gap_count' IS NOT NULL THEN
              RETURN (p_gap_fill->>'gap_count')::INTEGER;
           END IF;
           v_count := (SELECT count(*) FROM regexp_matches(COALESCE(p_gap_fill->>'structured_text', ''), '\[\d+\]', 'g'));
           IF v_count > 1 THEN RETURN v_count; END IF;
        END IF;
        RETURN 1;
     END IF;
     v_count := (SELECT count(*) FROM regexp_matches(COALESCE(p_question_text, ''), '_____', 'g'));
     RETURN GREATEST(v_count, 1);
  END IF;

  -- 3. Table Completion
  IF p_type = 'table_completion' THEN
      IF p_table_data IS NOT NULL THEN
          IF jsonb_typeof(p_table_data->'blanks') = 'array' THEN
             RETURN jsonb_array_length(p_table_data->'blanks');
          END IF;
          IF jsonb_typeof(p_table_data->'blank_positions') = 'array' THEN
             RETURN jsonb_array_length(p_table_data->'blank_positions');
          END IF;
          IF p_table_data->>'blanks_count' IS NOT NULL THEN
             RETURN (p_table_data->>'blanks_count')::int;
          END IF;
          
          v_rows := COALESCE(p_table_data->'table_rows', p_table_data->'rows');
          IF jsonb_typeof(v_rows) = 'array' THEN
             v_count := 0;
             FOR v_json_row IN SELECT * FROM jsonb_array_elements(v_rows)
             LOOP
                IF jsonb_typeof(v_json_row) = 'array' THEN
                   FOR v_json_item IN SELECT * FROM jsonb_array_elements(v_json_row)
                   LOOP
                      v_cell_text := v_json_item#>>'{}';
                      IF v_cell_text ~* '\[gap\]|__BLANK__|__BLANK_\d+__' THEN
                          v_count := v_count + (SELECT count(*) FROM regexp_matches(v_cell_text, '\[gap\]|__BLANK__|__BLANK_\d+__', 'gi'));
                      ELSIF TRIM(v_cell_text) = '' THEN
                          v_count := v_count + 1;
                      END IF;
                   END LOOP;
                END IF;
             END LOOP;
             IF v_count > 0 THEN RETURN v_count; END IF;
          END IF;
      END IF;
      RETURN 1;
  END IF;

  -- 4. Matching Headings
  IF p_type = 'matching_headings' THEN
      IF p_matching_data IS NOT NULL THEN
        IF jsonb_typeof(p_matching_data->'paragraphs') = 'array' THEN
            RETURN jsonb_array_length(p_matching_data->'paragraphs');
        END IF;
      END IF;
      IF p_matching_features IS NOT NULL THEN
         IF jsonb_typeof(p_matching_features->'questions') = 'array' THEN
            RETURN jsonb_array_length(p_matching_features->'questions');
         END IF;
      END IF;
      RETURN 1;
  END IF;

  -- 5. Matching Features
  IF p_type = 'matching_features' THEN
      IF p_matching_features IS NOT NULL THEN
          v_mode := p_matching_features->>'mode';
          IF v_mode = 'paragraph' AND jsonb_typeof(p_matching_features->'answers') = 'object' THEN
              RETURN (SELECT count(*) FROM jsonb_object_keys(p_matching_features->'answers'));
          END IF;
          IF jsonb_typeof(p_matching_features->'questions') = 'array' THEN
              RETURN jsonb_array_length(p_matching_features->'questions');
          END IF;
          IF jsonb_typeof(p_matching_features->'answers') = 'object' THEN
             v_count := (SELECT count(*) FROM jsonb_object_keys(p_matching_features->'answers'));
             IF v_count > 0 THEN RETURN v_count; END IF;
          END IF;
      END IF;
      IF p_matching_data IS NOT NULL THEN
         IF jsonb_typeof(p_matching_data->'questions') = 'array' THEN
             RETURN jsonb_array_length(p_matching_data->'questions');
         END IF;
      END IF;
      RETURN 1;
  END IF;

  -- 6. Flowchart / Diagram
  IF p_type IN ('flow_chart_completion', 'flowchart', 'diagram_label_completion', 'diagram_completion') THEN
     IF p_flowchart IS NOT NULL THEN
        IF jsonb_typeof(p_flowchart->'steps') = 'array' THEN
             v_count := 0;
             FOR v_json_item IN SELECT * FROM jsonb_array_elements(p_flowchart->'steps')
             LOOP
                v_cell_text := v_json_item->>'text';
                v_count := v_count + (SELECT count(*) FROM regexp_matches(COALESCE(v_cell_text, ''), '\[gap\]', 'gi'));
             END LOOP;
             IF v_count > 0 THEN RETURN v_count; END IF;
             RETURN 1; 
        END IF;
     END IF;
  END IF;

  -- 7. Map Labeling
  IF p_type = 'map_labeling' THEN
     IF p_map_labeling IS NOT NULL THEN
         IF jsonb_typeof(p_map_labeling->'questions') = 'array' THEN
            RETURN jsonb_array_length(p_map_labeling->'questions');
         END IF;
          IF jsonb_typeof(p_map_labeling->'items') = 'array' THEN
            RETURN jsonb_array_length(p_map_labeling->'items');
         END IF;
     END IF;
  END IF;
  
  -- 8. Multiple Choice Multi
  IF p_type = 'multiple_choice' AND p_allow_multiple AND p_question_count > 1 THEN
     RETURN p_question_count;
  END IF;

  RETURN 1;
END;
$$;


ALTER FUNCTION "public"."calculate_question_row_count"("p_type" "text", "p_question_number" integer, "p_gap_fill" "jsonb", "p_table_data" "jsonb", "p_matching_features" "jsonb", "p_matching_data" "jsonb", "p_map_labeling" "jsonb", "p_flowchart" "jsonb", "p_allow_multiple" boolean, "p_question_count" integer, "p_question_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_total_questions"("content_json" "jsonb") RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
DECLARE
    total INT := 0;
    section JSONB;
    grp JSONB;
BEGIN
    IF content_json IS NULL OR content_json = 'null'::jsonb THEN
        RETURN 0;
    END IF;

    IF jsonb_typeof(content_json) = 'array' THEN
        FOR section IN SELECT * FROM jsonb_array_elements(content_json)
        LOOP
            IF section ? 'question_groups' AND jsonb_typeof(section->'question_groups') = 'array' THEN
                FOR grp IN SELECT * FROM jsonb_array_elements(section->'question_groups')
                LOOP
                    IF grp ? 'questions' AND jsonb_typeof(grp->'questions') = 'array' THEN
                        total := total + jsonb_array_length(grp->'questions');
                    ELSIF grp ? 'type' THEN
                         total := total + 1;
                    END IF;
                END LOOP;
            END IF;
        END LOOP;
    END IF;

    RETURN total;
EXCEPTION WHEN OTHERS THEN
    RETURN 0;
END;
$$;


ALTER FUNCTION "public"."calculate_total_questions"("content_json" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_rate_limit"("p_user_id" "uuid", "p_tier" "text") RETURNS TABLE("allowed" boolean, "daily_remaining" integer, "monthly_remaining" integer, "daily_used" integer, "monthly_used" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_daily_limit INTEGER;
  v_monthly_limit INTEGER;
  v_daily_used INTEGER;
  v_monthly_used INTEGER;
  v_bonus_writing INTEGER;
  v_bonus_speaking INTEGER;
  v_bonus_expiry TIMESTAMPTZ;
BEGIN
  -- Get core tier limits from tier_rate_limits table
  SELECT trl.daily_limit, trl.monthly_limit
  INTO v_daily_limit, v_monthly_limit
  FROM public.tier_rate_limits trl
  WHERE trl.tier = p_tier;
  
  -- Default to free tier if not found
  IF v_daily_limit IS NULL THEN
    SELECT trl.daily_limit, trl.monthly_limit
    INTO v_daily_limit, v_monthly_limit
    FROM public.tier_rate_limits trl
    WHERE trl.tier = 'free';
  END IF;

  -- Add referral bonus credits if currently active
  SELECT bonus_writing_credits, bonus_speaking_credits, referral_bonus_expires_at
  INTO v_bonus_writing, v_bonus_speaking, v_bonus_expiry
  FROM public.users
  WHERE id = p_user_id;

  IF v_bonus_expiry IS NOT NULL AND v_bonus_expiry > pg_catalog.now() THEN
    -- Add all active bonus credits to the monthly quota
    v_monthly_limit := v_monthly_limit + pg_catalog.COALESCE(v_bonus_writing, 0) + pg_catalog.COALESCE(v_bonus_speaking, 0);
  END IF;
  
  -- Get current usage for the current user
  v_daily_used := public.get_user_daily_usage(p_user_id);
  v_monthly_used := public.get_user_monthly_usage(p_user_id);
  
  RETURN QUERY SELECT
    (v_daily_used < v_daily_limit AND v_monthly_used < v_monthly_limit),
    (v_daily_limit - v_daily_used),
    (v_monthly_limit - v_monthly_used),
    v_daily_used,
    v_monthly_used;
END;
$$;


ALTER FUNCTION "public"."check_user_rate_limit"("p_user_id" "uuid", "p_tier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_referral_rewards"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_referral_count INTEGER;
    v_tier RECORD;
    v_total_days INTEGER := 0;
    v_total_writing INTEGER := 0;
    v_total_speaking INTEGER := 0;
    v_new_expiry TIMESTAMPTZ;
    v_claimed_tiers UUID[] := ARRAY[]::UUID[];
BEGIN
    -- Get count of successful referrals
    SELECT COUNT(*) INTO v_referral_count
    FROM user_referrals
    WHERE referrer_id = p_user_id;

    IF v_referral_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No referrals found');
    END IF;

    -- Find all eligible tiers that haven't been claimed
    FOR v_tier IN 
        SELECT rrt.*
        FROM referral_reward_tiers rrt
        WHERE rrt.referrals_required <= v_referral_count
        AND rrt.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM user_referral_rewards urr
            WHERE urr.user_id = p_user_id
            AND urr.tier_id = rrt.id
        )
        ORDER BY rrt.referrals_required ASC
    LOOP
        -- Record the claimed reward
        INSERT INTO user_referral_rewards (user_id, tier_id, extra_days_granted, writing_credits_granted, speaking_credits_granted)
        VALUES (p_user_id, v_tier.id, v_tier.extra_days, v_tier.writing_credits, v_tier.speaking_credits);

        v_total_days := v_total_days + v_tier.extra_days;
        v_total_writing := v_total_writing + v_tier.writing_credits;
        v_total_speaking := v_total_speaking + v_tier.speaking_credits;
        v_claimed_tiers := array_append(v_claimed_tiers, v_tier.id);
    END LOOP;

    IF array_length(v_claimed_tiers, 1) IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No new rewards to claim');
    END IF;

    -- Calculate new bonus expiry
    SELECT GREATEST(referral_bonus_expires_at, now()) + (v_total_days || ' days')::INTERVAL
    INTO v_new_expiry
    FROM users
    WHERE id = p_user_id;

    IF v_new_expiry IS NULL THEN
        v_new_expiry := now() + (v_total_days || ' days')::INTERVAL;
    END IF;

    -- Update user's bonus credits and expiry
    UPDATE users
    SET 
        referral_bonus_expires_at = v_new_expiry,
        bonus_writing_credits = COALESCE(bonus_writing_credits, 0) + v_total_writing,
        bonus_speaking_credits = COALESCE(bonus_speaking_credits, 0) + v_total_speaking,
        updated_at = now()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'days_granted', v_total_days,
        'writing_credits_granted', v_total_writing,
        'speaking_credits_granted', v_total_speaking,
        'new_expires_at', v_new_expiry,
        'tiers_claimed', array_length(v_claimed_tiers, 1)
    );
END;
$$;


ALTER FUNCTION "public"."claim_referral_rewards"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clear_promo_discount"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_user_id uuid;
  v_old_code text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not logged in';
  END IF;

  SELECT promo_discount->>'code'
  INTO v_old_code
  FROM public.users
  WHERE auth_id = v_user_id;

  IF v_old_code IS NULL THEN
    RAISE EXCEPTION 'No active promo code to remove';
  END IF;

  UPDATE public.users
  SET promo_discount = NULL, updated_at = now()
  WHERE auth_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'removed_code', v_old_code
  );
END;
$$;


ALTER FUNCTION "public"."clear_promo_discount"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_inactive_users"("days_inactive" integer DEFAULT 30, "subscription_filter" "text" DEFAULT NULL::"text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  total_count INT;
BEGIN
  -- Admin check
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = (SELECT auth.uid()) AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT COUNT(*)::INT INTO total_count
  FROM users u
  WHERE COALESCE(u.last_active, u.created_at) < NOW() - (days_inactive || ' days')::INTERVAL
    AND u.role != 'admin'
    AND (subscription_filter IS NULL OR u.subscription_tier = subscription_filter);

  RETURN total_count;
END;
$$;


ALTER FUNCTION "public"."count_inactive_users"("days_inactive" integer, "subscription_filter" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_admin_user_complete"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'hex.ron07@gmail.com') THEN
    INSERT INTO public.users (
      email,
      full_name,
      role,
      subscription_tier,
      created_at,
      updated_at
    ) VALUES (
      'hex.ron07@gmail.com',
      'Admin User',
      'admin',
      'premium',
      NOW(),
      NOW()
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."create_admin_user_complete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_get_passages"() RETURNS TABLE("id" "uuid", "title" "text", "test_type" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT id, title, test_type FROM public.passages LIMIT 20;
$$;


ALTER FUNCTION "public"."debug_get_passages"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_question_count"("target_passage_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("passage_exists" boolean, "total_questions" bigint, "passage_questions" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM public.passages WHERE id = COALESCE(target_passage_id, '00000000-0000-0000-0000-000000000000'::uuid)) as passage_exists,
    (SELECT COUNT(*)::BIGINT FROM public.questions) as total_questions,
    (SELECT COUNT(*)::BIGINT FROM public.questions WHERE passage_id = COALESCE(target_passage_id, passage_id)) as passage_questions;
END;
$$;


ALTER FUNCTION "public"."debug_question_count"("target_passage_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_resource"("resource_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Simply delete the resource directly (SECURITY DEFINER bypasses RLS)
  DELETE FROM public.resources WHERE id = resource_id;
  
  -- Raise exception if nothing was deleted
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Resource not found with id: %', resource_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."delete_resource"("resource_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_vocab_item_v2"("item_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  current_user_profile_id UUID;
  deleted_row_count INT;
BEGIN
  -- 1. Get the current user's profile ID
  -- We trust public.users to have the mapping.
  SELECT id INTO current_user_profile_id
  FROM public.users
  WHERE auth_id = auth.uid();

  -- 2. If no profile found, we cannot verify ownership via user_id (FK to users).
  -- BUT, if created_by stores auth_id directly in some legacy cases, we might check that?
  -- For now, let's assume we need a profile.
  IF current_user_profile_id IS NULL THEN
    -- Try to find if user_id matches auth.uid() directly (if the schema was loose)
    -- This is a fallback/hack just in case
    DELETE FROM public.vocabulary_items
    WHERE id = item_id
    AND (
       -- If user_id holds auth_id (unlikely but possible in bad data)
       user_id = auth.uid() 
       OR created_by = auth.uid()
    );
     GET DIAGNOSTICS deleted_row_count = ROW_COUNT;
     IF deleted_row_count > 0 THEN
        RETURN TRUE;
     END IF;

    RAISE EXCEPTION 'User profile not found and direct auth_id match failed';
  END IF;

  -- 3. Perform the standard delete
  DELETE FROM public.vocabulary_items
  WHERE id = item_id
  AND (
    user_id = current_user_profile_id OR 
    created_by = current_user_profile_id
  );

  GET DIAGNOSTICS deleted_row_count = ROW_COUNT;

  IF deleted_row_count > 0 THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;


ALTER FUNCTION "public"."delete_vocab_item_v2"("item_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_vocabulary_item"("item_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  current_user_profile_id UUID;
  deleted_row_count INT;
BEGIN
  -- Get the current user's profile ID
  SELECT id INTO current_user_profile_id
  FROM public.users
  WHERE auth_id = auth.uid();

  IF current_user_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Perform the delete, checking ownership explicitly
  DELETE FROM public.vocabulary_items
  WHERE id = item_id
  AND (
    user_id = current_user_profile_id OR 
    created_by = current_user_profile_id
  );

  GET DIAGNOSTICS deleted_row_count = ROW_COUNT;

  -- Return true if we actually deleted something
  IF deleted_row_count > 0 THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;


ALTER FUNCTION "public"."delete_vocabulary_item"("item_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."exec_sql"("sql" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  EXECUTE sql;
END;
$$;


ALTER FUNCTION "public"."exec_sql"("sql" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."export_user_data"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID;
  v_user_data JSONB;
  v_test_sessions JSONB;
  v_consent_history JSONB;
  v_vocabulary JSONB;
  v_achievements JSONB;
BEGIN
  -- Get current user's profile ID
  SELECT id INTO v_user_id
  FROM users
  WHERE auth_id = (SELECT auth.uid());
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Get user profile data
  SELECT to_jsonb(u.*) - 'id' - 'auth_id' INTO v_user_data
  FROM users u
  WHERE u.id = v_user_id;
  
  -- Get test sessions (Fixed duration column by calculating it)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'test_type', ts.test_type,
      'score', ts.score,
      'duration_seconds', EXTRACT(EPOCH FROM (ts.completed_at - ts.created_at)),
      'completed_at', ts.completed_at,
      'created_at', ts.created_at
    )
  ), '[]'::jsonb) INTO v_test_sessions
  FROM test_sessions ts
  WHERE ts.user_id = v_user_id;
  
  -- Get consent history
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'consent_type', ch.consent_type,
      'consented', ch.consented,
      'consent_version', ch.consent_version,
      'created_at', ch.created_at
    )
  ), '[]'::jsonb) INTO v_consent_history
  FROM consent_history ch
  WHERE ch.user_id = v_user_id;
  
  -- Get vocabulary items (if table exists)
  BEGIN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'word', vi.word,
        'definition', vi.definition,
        'mastery_level', vi.mastery_level,
        'created_at', vi.created_at
      )
    ), '[]'::jsonb) INTO v_vocabulary
    FROM vocabulary_items vi
    WHERE vi.user_id = v_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_vocabulary := '[]'::jsonb;
  END;
  
  -- Get achievements (use unlocked_at instead of earned_at)
  BEGIN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'achievement_id', ua.achievement_id,
        'unlocked_at', ua.unlocked_at
      )
    ), '[]'::jsonb) INTO v_achievements
    FROM user_achievements ua
    WHERE ua.user_id = v_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_achievements := '[]'::jsonb;
  END;
  
  -- Return complete data export
  RETURN jsonb_build_object(
    'success', true,
    'export_date', NOW(),
    'data_version', '1.0',
    'profile', v_user_data,
    'test_sessions', v_test_sessions,
    'consent_history', v_consent_history,
    'vocabulary', v_vocabulary,
    'achievements', v_achievements
  );
END;
$$;


ALTER FUNCTION "public"."export_user_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_referral_code"("p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    -- Check if user already has a code
    SELECT referral_code INTO v_code FROM users WHERE id = p_user_id;
    IF v_code IS NOT NULL THEN
        RETURN v_code;
    END IF;

    -- Generate unique code
    LOOP
        v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
        SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = v_code) INTO v_exists;
        EXIT WHEN NOT v_exists;
    END LOOP;

    -- Save code to user
    UPDATE users SET referral_code = v_code WHERE id = p_user_id;
    
    RETURN v_code;
END;
$$;


ALTER FUNCTION "public"."generate_referral_code"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_dashboard_stats"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
DECLARE
    v_total_users bigint;
    v_premium_users bigint;
    v_total_questions bigint;
    v_total_passages bigint;
    v_completed_tests bigint;
    v_avg_score numeric;
    v_revenue numeric;
    v_users_last_30_days json;
    v_score_distribution json;
    v_recent_signups json;
BEGIN
    -- Check if user is admin (simple check, calling code should also verify)
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = (select auth.uid()) 
        AND (role = 'admin' OR is_super_admin = true)
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Basic Counts
    SELECT count(*) INTO v_total_users FROM public.users;
    
    SELECT count(*) INTO v_premium_users 
    FROM public.users 
    WHERE subscription_tier IN ('pro', 'premium');
    
    SELECT count(*) INTO v_total_questions FROM public.questions;
    
    SELECT count(*) INTO v_total_passages FROM public.passages WHERE is_active = true;
    
    SELECT count(*) INTO v_completed_tests 
    FROM public.test_sessions 
    WHERE is_completed = true;
    
    SELECT COALESCE(AVG(score), 0) INTO v_avg_score 
    FROM public.test_sessions 
    WHERE is_completed = true AND score IS NOT NULL;

    -- Calculated/Simulated Revenue
    -- Assuming $29.99 for premium/pro for simplicity based on existing frontend logic
    v_revenue := v_premium_users * 29.99;

    -- User Growth (Last 30 days)
    SELECT json_agg(t) INTO v_users_last_30_days
    FROM (
        SELECT 
            to_char(date_trunc('day', created_at), 'Mon DD') as date,
            count(*) as users
        FROM public.users
        WHERE created_at >= (now() - interval '30 days')
        GROUP BY 1, date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at)
    ) t;

    -- Score Distribution
    SELECT json_agg(t) INTO v_score_distribution
    FROM (
        SELECT 
            CASE 
                WHEN score BETWEEN 0 AND 4.5 THEN '0-4.5'
                WHEN score BETWEEN 5.0 AND 6.0 THEN '5.0-6.0'
                WHEN score BETWEEN 6.5 AND 7.0 THEN '6.5-7.0'
                WHEN score BETWEEN 7.5 AND 8.0 THEN '7.5-8.0'
                WHEN score >= 8.5 THEN '8.5+'
                ELSE 'Unknown'
            END as range,
            count(*) as count,
            100 as "fullMark"
        FROM public.test_sessions
        WHERE is_completed = true AND score IS NOT NULL
        GROUP BY 1
        ORDER BY 1
    ) t;

    -- Recent Signups (Last 5)
    SELECT json_agg(t) INTO v_recent_signups
    FROM (
        SELECT id, full_name, email, created_at, subscription_tier, avatar_url
        FROM public.users
        ORDER BY created_at DESC
        LIMIT 5
    ) t;

    RETURN json_build_object(
        'totalUsers', v_total_users,
        'premiumUsers', v_premium_users,
        'totalQuestions', v_total_questions,
        'totalPassages', v_total_passages,
        'completedTests', v_completed_tests,
        'avgScore', round(v_avg_score, 1),
        'totalRevenue', v_revenue,
        'userGrowthData', COALESCE(v_users_last_30_days, '[]'::json),
        'scoreDistribution', COALESCE(v_score_distribution, '[]'::json),
        'recentSignups', COALESCE(v_recent_signups, '[]'::json)
    );
END;
$_$;


ALTER FUNCTION "public"."get_admin_dashboard_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ai_usage_aggs"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_total_calls bigint;
    v_cached_calls bigint;
    v_total_tokens bigint;
    v_unique_users bigint;
BEGIN
    -- Check Admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = (select auth.uid()) 
        AND (role = 'admin' OR is_super_admin = true)
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT 
        count(*),
        sum(CASE WHEN cached THEN 1 ELSE 0 END),
        sum(tokens_used),
        count(DISTINCT user_id)
    INTO 
        v_total_calls,
        v_cached_calls,
        v_total_tokens,
        v_unique_users
    FROM public.ai_api_usage;

    RETURN json_build_object(
        'totalApiCalls', COALESCE(v_total_calls, 0),
        'totalCachedCalls', COALESCE(v_cached_calls, 0),
        'totalTokens', COALESCE(v_total_tokens, 0),
        'uniqueUsers', COALESCE(v_unique_users, 0)
    );
END;
$$;


ALTER FUNCTION "public"."get_ai_usage_aggs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ai_usage_stats_paginated"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_sort_field" "text" DEFAULT 'total_calls'::"text", "p_sort_dir" "text" DEFAULT 'desc'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_offset integer;
    v_total_users bigint;
    v_users_data json;
BEGIN
    -- Check Admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = (select auth.uid()) 
        AND (role = 'admin' OR is_super_admin = true)
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_offset := (p_page - 1) * p_page_size;

    -- 1. Aggregate per user first
    WITH per_user_endpoint AS (
        SELECT 
            user_id,
            endpoint,
            count(*) as usage_count
        FROM public.ai_api_usage
        GROUP BY user_id, endpoint
    ),
    user_aggs AS (
        SELECT 
            u.id as user_id,
            u.full_name,
            u.email,
            u.avatar_url,
            (SELECT count(*) FROM public.ai_api_usage WHERE user_id = u.id) as total_calls,
            (SELECT count(*) FROM public.ai_api_usage WHERE user_id = u.id AND cached = true) as cached_calls,
            (SELECT sum(COALESCE(tokens_used, 0)) FROM public.ai_api_usage WHERE user_id = u.id) as total_tokens,
            (SELECT max(created_at) FROM public.ai_api_usage WHERE user_id = u.id) as last_activity,
            (SELECT sum(COALESCE(tokens_used, 0)) * 0.0000002 FROM public.ai_api_usage WHERE user_id = u.id) as estimated_cost,
            (
                SELECT json_object_agg(endpoint, usage_count)
                FROM per_user_endpoint
                WHERE user_id = u.id
            ) as endpoints
        FROM public.users u
        WHERE EXISTS (SELECT 1 FROM public.ai_api_usage WHERE user_id = u.id) -- Only fetch users with usage
    ),
    sorted_users AS (
        SELECT *, count(*) OVER() as full_count
        FROM user_aggs
        ORDER BY 
            CASE WHEN p_sort_dir = 'asc' THEN
                CASE 
                    WHEN p_sort_field = 'totalCalls' THEN total_calls
                    WHEN p_sort_field = 'totalTokens' THEN total_tokens
                    ELSE total_calls
                END
            END ASC,
            CASE WHEN p_sort_dir = 'desc' THEN
                CASE 
                    WHEN p_sort_field = 'totalCalls' THEN total_calls
                    WHEN p_sort_field = 'totalTokens' THEN total_tokens
                    ELSE total_calls
                END
            END DESC NULLS LAST
        LIMIT p_page_size OFFSET v_offset
    )
    SELECT json_agg(row_to_json(sorted_users.*)), max(full_count)
    INTO v_users_data, v_total_users
    FROM sorted_users;

    RETURN json_build_object(
        'data', COALESCE(v_users_data, '[]'::json),
        'total', COALESCE(v_total_users, 0),
        'page', p_page,
        'pageSize', p_page_size
    );
END;
$$;


ALTER FUNCTION "public"."get_ai_usage_stats_paginated"("p_page" integer, "p_page_size" integer, "p_sort_field" "text", "p_sort_dir" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_cambridge_tests"("p_limit" integer DEFAULT 4) RETURNS TABLE("id" "uuid", "title" "text", "test_type" "text", "cambridge_year" integer, "cambridge_test_number" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    SELECT 
        id,
        title,
        test_type,
        cambridge_year,
        cambridge_test_number
    FROM public.passages
    WHERE is_official_cambridge = true AND is_active = true
    ORDER BY cambridge_year DESC, cambridge_test_number ASC
    LIMIT p_limit;
$$;


ALTER FUNCTION "public"."get_cambridge_tests"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_profile_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_current_profile_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    result JSON;
    v_total_tests INTEGER;
    v_avg_score NUMERIC;
    v_today_minutes INTEGER;
    v_today_tests INTEGER;
    v_streak INTEGER;
    v_module_averages JSON;
    v_weekly_data JSON;
    v_daily_activity JSON;
BEGIN
    -- Get basic stats from test sessions
    SELECT 
        COUNT(*),
        COALESCE(AVG(score), 0)
    INTO v_total_tests, v_avg_score
    FROM test_sessions 
    WHERE user_id = p_user_id 
      AND is_completed = true 
      AND score IS NOT NULL;

    -- Get today's stats (including both tests and learning activities)
    SELECT 
        COALESCE(SUM(duration), 0)::INTEGER,
        COUNT(*)::INTEGER
    INTO v_today_minutes, v_today_tests
    FROM (
        SELECT duration_minutes as duration FROM test_sessions 
        WHERE user_id = p_user_id AND is_completed = true AND completed_at::date = CURRENT_DATE
        UNION ALL
        SELECT estimated_minutes as duration FROM learning_path_activities 
        WHERE user_id = p_user_id AND is_completed = true AND completed_at::date = CURRENT_DATE
    ) today_combined;

    -- Calculate streak (consecutive days with activity)
    WITH daily_practice AS (
        SELECT DISTINCT practice_date
        FROM (
            SELECT completed_at::date as practice_date FROM test_sessions WHERE user_id = p_user_id AND is_completed = true
            UNION ALL
            SELECT completed_at::date as practice_date FROM learning_path_activities WHERE user_id = p_user_id AND is_completed = true
        ) combined
        ORDER BY practice_date DESC
    ),
    streak_calc AS (
        SELECT 
            practice_date,
            practice_date - (ROW_NUMBER() OVER (ORDER BY practice_date DESC))::integer AS grp
        FROM daily_practice
        WHERE practice_date >= CURRENT_DATE - INTERVAL '60 days'
    )
    SELECT COALESCE(COUNT(*), 0)::INTEGER INTO v_streak
    FROM streak_calc
    WHERE grp = (SELECT grp FROM streak_calc WHERE practice_date = CURRENT_DATE LIMIT 1);
    
    -- Handle case where no test today (check if yesterday had test)
    IF v_streak = 0 THEN
        WITH daily_practice AS (
            SELECT DISTINCT practice_date
            FROM (
                SELECT completed_at::date as practice_date FROM test_sessions WHERE user_id = p_user_id AND is_completed = true
                UNION ALL
                SELECT completed_at::date as practice_date FROM learning_path_activities WHERE user_id = p_user_id AND is_completed = true
            ) combined
            ORDER BY practice_date DESC
        ),
        streak_calc AS (
            SELECT 
                practice_date,
                practice_date - (ROW_NUMBER() OVER (ORDER BY practice_date DESC))::integer AS grp
            FROM daily_practice
            WHERE practice_date >= CURRENT_DATE - INTERVAL '60 days'
        )
        SELECT COALESCE(COUNT(*), 0)::INTEGER INTO v_streak
        FROM streak_calc
        WHERE grp = (SELECT grp FROM streak_calc WHERE practice_date = CURRENT_DATE - INTERVAL '1 day' LIMIT 1);
    END IF;

    -- Module averages
    SELECT json_object_agg(test_type, avg_score)
    INTO v_module_averages
    FROM (
        SELECT 
            LOWER(test_type) as test_type,
            AVG(score) as avg_score
        FROM test_sessions
        WHERE user_id = p_user_id 
          AND is_completed = true 
          AND score IS NOT NULL
          AND test_type IS NOT NULL
        GROUP BY LOWER(test_type)
    ) module_stats;

    -- Weekly data (last 7 days)
    SELECT json_agg(day_data ORDER BY day_date)
    INTO v_weekly_data
    FROM (
        SELECT 
            d.day_date,
            json_build_object(
                'day', TO_CHAR(d.day_date, 'Dy'),
                'tests', COALESCE(COUNT(combined.completed_at), 0)
            ) as day_data
        FROM generate_series(
            CURRENT_DATE - INTERVAL '6 days', 
            CURRENT_DATE, 
            INTERVAL '1 day'
        ) AS d(day_date)
        LEFT JOIN (
            SELECT completed_at, user_id FROM test_sessions WHERE is_completed = true
            UNION ALL
            SELECT completed_at, user_id FROM learning_path_activities WHERE is_completed = true
        ) combined 
            ON combined.completed_at::date = d.day_date 
            AND combined.user_id = p_user_id
        GROUP BY d.day_date
    ) weekly;

    -- Daily activity (heatmap uses YYYY-MM-DD for stability)
    SELECT json_object_agg(activity_date, total_count)
    INTO v_daily_activity
    FROM (
        SELECT 
            completed_at::date::text as activity_date,
            COUNT(*) as total_count
        FROM (
            SELECT completed_at FROM test_sessions WHERE user_id = p_user_id AND is_completed = true
            UNION ALL
            SELECT completed_at FROM learning_path_activities WHERE user_id = p_user_id AND is_completed = true
        ) combined
        WHERE completed_at >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY completed_at::date
    ) activity;

    -- Build result
    result := json_build_object(
        'totalTests', v_total_tests,
        'avgScore', ROUND(v_avg_score::numeric, 1),
        'todayMinutes', v_today_minutes,
        'todayTests', v_today_tests,
        'streak', COALESCE(v_streak, 0),
        'moduleAverages', COALESCE(v_module_averages, '{}'::json),
        'weeklyProgress', COALESCE(v_weekly_data, '[]'::json),
        'dailyActivity', COALESCE(v_daily_activity, '{}'::json)
    );

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_due_vocabulary"("p_user_id" "uuid", "p_limit" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "word" "text", "definition" "text", "example" "text", "mastery_level" integer, "next_review_date" timestamp with time zone, "last_reviewed" timestamp with time zone, "source" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    SELECT 
        id,
        word,
        definition,
        example,
        mastery_level,
        next_review_date,
        last_reviewed,
        source
    FROM public.vocabulary_items
    WHERE user_id = p_user_id
      AND (next_review_date IS NULL OR next_review_date <= NOW())
    ORDER BY next_review_date ASC NULLS FIRST
    LIMIT p_limit;
$$;


ALTER FUNCTION "public"."get_due_vocabulary"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_inactive_users"("days_inactive" integer DEFAULT 30, "page_limit" integer DEFAULT 50, "page_offset" integer DEFAULT 0, "subscription_filter" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "auth_id" "uuid", "email" "text", "full_name" "text", "subscription_tier" "text", "last_active" timestamp with time zone, "created_at" timestamp with time zone, "inactive_days" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Admin check via auth context
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = (SELECT auth.uid()) AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.auth_id,
    u.email,
    u.full_name,
    u.subscription_tier,
    u.last_active,
    u.created_at,
    EXTRACT(DAY FROM NOW() - COALESCE(u.last_active, u.created_at))::INT as inactive_days
  FROM users u
  WHERE COALESCE(u.last_active, u.created_at) < NOW() - (days_inactive || ' days')::INTERVAL
    AND u.role != 'admin' -- Don't show admin accounts
    AND (subscription_filter IS NULL OR u.subscription_tier = subscription_filter)
  ORDER BY u.last_active ASC NULLS FIRST
  LIMIT page_limit OFFSET page_offset;
END;
$$;


ALTER FUNCTION "public"."get_inactive_users"("days_inactive" integer, "page_limit" integer, "page_offset" integer, "subscription_filter" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_learning_path_data"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSON;
    v_path_record RECORD;
    v_activities JSON;
    v_module_averages JSON;
    v_module_trends JSON;
    v_skill_proficiencies JSON;
    v_sessions JSON;
    v_total_tests INTEGER;
BEGIN
    -- 1. Get latest learning path
    SELECT id, path_data, activities_completed, created_at
    INTO v_path_record
    FROM learning_paths
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- 2. Get activities for the learning path (if exists)
    IF v_path_record.id IS NOT NULL THEN
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', id,
                'activity_key', activity_key,
                'scheduled_day', scheduled_day,
                'is_completed', is_completed,
                'completed_at', completed_at,
                'outcome_score', outcome_score,
                'outcome_data', outcome_data,
                'title', title,
                'module', module,
                'estimated_minutes', estimated_minutes,
                'priority', priority,
                'activity_type', activity_type,
                'skill_targets', skill_targets
            )
        ), '[]'::json)
        INTO v_activities
        FROM learning_path_activities
        WHERE learning_path_id = v_path_record.id;
    ELSE
        v_activities := '[]'::json;
    END IF;
    
    -- 3. Get recent test sessions and calculate module averages/trends
    WITH recent_sessions AS (
        SELECT 
            id,
            test_type,
            score,
            completed_at,
            ROW_NUMBER() OVER (PARTITION BY test_type ORDER BY completed_at DESC) as rn
        FROM test_sessions
        WHERE user_id = p_user_id
          AND is_completed = true
          AND score IS NOT NULL
        ORDER BY completed_at DESC
        LIMIT 40
    ),
    module_stats AS (
        SELECT 
            test_type,
            AVG(score) as avg_score,
            MAX(CASE WHEN rn = 1 THEN score END) as latest_score,
            MAX(CASE WHEN rn = 2 THEN score END) as prev_score
        FROM recent_sessions
        GROUP BY test_type
    )
    SELECT 
        COALESCE(json_object_agg(test_type, ROUND(avg_score::numeric, 2)), '{}'::json),
        COALESCE(json_object_agg(
            test_type,
            CASE 
                WHEN latest_score > prev_score THEN 'up'
                WHEN latest_score < prev_score THEN 'down'
                ELSE 'stable'
            END
        ), '{}'::json)
    INTO v_module_averages, v_module_trends
    FROM module_stats
    WHERE avg_score IS NOT NULL;
    
    -- Get total test count
    SELECT COUNT(*)
    INTO v_total_tests
    FROM test_sessions
    WHERE user_id = p_user_id AND is_completed = true;
    
    -- Get sessions for skill trend calculation (last 40)
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', id,
            'test_type', test_type,
            'score', score,
            'skill_scores', skill_scores,
            'completed_at', completed_at
        )
    ), '[]'::json)
    INTO v_sessions
    FROM (
        SELECT id, test_type, score, skill_scores, completed_at
        FROM test_sessions
        WHERE user_id = p_user_id AND is_completed = true
        ORDER BY completed_at DESC
        LIMIT 40
    ) s;
    
    -- 4. Get skill proficiencies (top 100 by lowest mastery)
    SELECT COALESCE(json_agg(
        json_build_object(
            'skill_code', skill_code,
            'module', module,
            'mastery_probability', mastery_probability,
            'confidence_level', confidence_level,
            'practice_count', practice_count,
            'correct_count', correct_count,
            'last_practiced_at', last_practiced_at,
            'next_review_at', next_review_at
        )
    ), '[]'::json)
    INTO v_skill_proficiencies
    FROM (
        SELECT *
        FROM skill_proficiency
        WHERE user_id = p_user_id
        ORDER BY mastery_probability ASC
        LIMIT 100
    ) sp;
    
    -- Build final result
    v_result := json_build_object(
        'learningPath', CASE 
            WHEN v_path_record.id IS NOT NULL THEN
                json_build_object(
                    'id', v_path_record.id,
                    'path_data', v_path_record.path_data,
                    'activities_completed', v_path_record.activities_completed,
                    'created_at', v_path_record.created_at
                )
            ELSE NULL
        END,
        'activities', v_activities,
        'stats', json_build_object(
            'moduleAverages', COALESCE(v_module_averages, '{}'::json),
            'moduleTrends', COALESCE(v_module_trends, '{}'::json),
            'totalTests', COALESCE(v_total_tests, 0),
            'sessions', v_sessions
        ),
        'skillProficiencies', v_skill_proficiencies
    );
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_learning_path_data"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_learning_path_data"("p_user_id" "uuid") IS 'Combined RPC that fetches learning path, activities, stats, and skill proficiencies in a single call. 
Reduces round-trips from 4 to 1 for the Learning Path page.';



CREATE OR REPLACE FUNCTION "public"."get_my_public_user_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT id FROM public.users WHERE auth_id = (SELECT auth.uid());
$$;


ALTER FUNCTION "public"."get_my_public_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_user_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN (SELECT id FROM public.users WHERE auth_id = auth.uid());
END;
$$;


ALTER FUNCTION "public"."get_my_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recent_sessions"("p_user_id" "uuid", "p_limit" integer DEFAULT 8) RETURNS TABLE("id" "uuid", "passage_id" "uuid", "passage_title" "text", "test_type" "text", "score" numeric, "completed_at" timestamp with time zone, "duration_minutes" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    SELECT 
        ts.id,
        ts.passage_id,
        p.title as passage_title,
        ts.test_type,
        ts.score,
        ts.completed_at,
        ts.duration_minutes
    FROM public.test_sessions ts
    LEFT JOIN public.passages p ON p.id = ts.passage_id
    WHERE ts.user_id = p_user_id 
      AND ts.is_completed = true 
      AND ts.score IS NOT NULL
    ORDER BY ts.completed_at DESC
    LIMIT p_limit;
$$;


ALTER FUNCTION "public"."get_recent_sessions"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_revenue_analytics"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_total_revenue numeric;
    v_monthly_revenue json;
    v_revenue_by_tier json;
    v_recent_transactions json;
    v_active_subscribers bigint;
    v_pro_count bigint;
    v_premium_count bigint;
    v_arpu numeric;
    v_stripe_revenue numeric;
    v_manual_revenue numeric;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = (select auth.uid()) 
        AND (role = 'admin' OR is_super_admin = true)
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Total revenue from billing_history
    SELECT COALESCE(SUM(amount), 0) INTO v_total_revenue 
    FROM public.billing_history
    WHERE status = 'paid';

    -- Stripe vs Manual revenue breakdown
    SELECT COALESCE(SUM(amount), 0) INTO v_stripe_revenue 
    FROM public.billing_history
    WHERE status = 'paid' AND payment_method = 'stripe';

    SELECT COALESCE(SUM(amount), 0) INTO v_manual_revenue 
    FROM public.billing_history
    WHERE status = 'paid' AND payment_method != 'stripe';

    -- Monthly revenue (last 6 months)
    SELECT json_agg(t) INTO v_monthly_revenue
    FROM (
        SELECT 
            to_char(date_trunc('month', created_at), 'Mon YYYY') as month,
            to_char(date_trunc('month', created_at), 'Mon') as label,
            SUM(amount) as revenue,
            COUNT(*) as transactions
        FROM public.billing_history
        WHERE status = 'paid' 
          AND created_at >= (now() - interval '6 months')
        GROUP BY date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at)
    ) t;

    -- Revenue by tier
    SELECT json_agg(t) INTO v_revenue_by_tier
    FROM (
        SELECT 
            tier,
            SUM(amount) as revenue,
            COUNT(*) as count
        FROM public.billing_history
        WHERE status = 'paid'
        GROUP BY tier
    ) t;

    -- Recent transactions (last 10)
    SELECT json_agg(t) INTO v_recent_transactions
    FROM (
        SELECT 
            bh.id,
            bh.amount,
            bh.currency,
            bh.tier,
            bh.billing_interval,
            bh.payment_method,
            bh.created_at,
            u.full_name,
            u.email,
            u.avatar_url
        FROM public.billing_history bh
        LEFT JOIN public.users u ON u.auth_id = bh.auth_id
        WHERE bh.status = 'paid'
        ORDER BY bh.created_at DESC
        LIMIT 10
    ) t;

    -- Active subscriber counts
    SELECT COUNT(*) INTO v_active_subscribers
    FROM public.users 
    WHERE subscription_tier IN ('pro', 'premium');

    SELECT COUNT(*) INTO v_pro_count
    FROM public.users 
    WHERE subscription_tier = 'pro';

    SELECT COUNT(*) INTO v_premium_count
    FROM public.users 
    WHERE subscription_tier = 'premium';

    -- ARPU calculation
    IF v_active_subscribers > 0 THEN
        v_arpu := ROUND(v_total_revenue / v_active_subscribers, 2);
    ELSE
        v_arpu := 0;
    END IF;

    RETURN json_build_object(
        'totalRevenue', v_total_revenue,
        'stripeRevenue', v_stripe_revenue,
        'manualRevenue', v_manual_revenue,
        'monthlyRevenue', COALESCE(v_monthly_revenue, '[]'::json),
        'revenueByTier', COALESCE(v_revenue_by_tier, '[]'::json),
        'recentTransactions', COALESCE(v_recent_transactions, '[]'::json),
        'activeSubscribers', v_active_subscribers,
        'proCount', v_pro_count,
        'premiumCount', v_premium_count,
        'arpu', v_arpu,
        'ltv', ROUND(v_arpu * 12, 2)
    );
END;
$$;


ALTER FUNCTION "public"."get_revenue_analytics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_session_counts"("p_ids" "uuid"[]) RETURNS TABLE("passage_id" "uuid", "count" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select passage_id, count(*)
  from test_sessions
  where passage_id = any(p_ids)
  group by passage_id;
$$;


ALTER FUNCTION "public"."get_session_counts"("p_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_system_stats"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    error_count_24h integer;
    warning_count_24h integer;
    db_size text;
    active_connections integer;
begin
    -- Get error counts for last 24h
    select count(*) into error_count_24h
    from public.system_health_logs
    where level = 'error'
    and created_at > now() - interval '24 hours';

    select count(*) into warning_count_24h
    from public.system_health_logs
    where level = 'warning'
    and created_at > now() - interval '24 hours';

    -- Get DB size (approximate)
    select pg_catalog.pg_size_pretty(pg_catalog.pg_database_size(pg_catalog.current_database())) into db_size;

    -- Get active connections count
    select count(*) into active_connections
    from pg_catalog.pg_stat_activity;
    -- Note: simplified the pg_stat_activity query for compatibility
    
    -- If pg_stat_activity is restricted, just return null or a dummy value
    -- In Supabase hosted, this might be restricted. We handle graceful fallback in frontend.
    
    return jsonb_build_object(
        'error_count_24h', error_count_24h,
        'warning_count_24h', warning_count_24h,
        'db_size', db_size,
        'active_connections', active_connections
    );
end;
$$;


ALTER FUNCTION "public"."get_system_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_test_taken_counts"("type_filter" "text") RETURNS TABLE("passage_id" "uuid", "taken_count" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT 
    passage_id,
    COUNT(*) as taken_count
  FROM public.test_sessions
  WHERE test_type = type_filter 
    AND is_completed = true
    AND passage_id IS NOT NULL
  GROUP BY passage_id;
$$;


ALTER FUNCTION "public"."get_test_taken_counts"("type_filter" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tier_rate_limits"("p_tier" "text") RETURNS TABLE("daily_limit" integer, "monthly_limit" integer, "burst_limit" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT trl.daily_limit, trl.monthly_limit, trl.burst_limit
  FROM public.tier_rate_limits trl
  WHERE trl.tier = p_tier;
  
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT trl.daily_limit, trl.monthly_limit, trl.burst_limit
    FROM public.tier_rate_limits trl
    WHERE trl.tier = 'free';
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_tier_rate_limits"("p_tier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_daily_usage"("p_user_id" "uuid", "p_endpoint" "text" DEFAULT NULL::"text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*)::INTEGER INTO v_count
  FROM public.ai_api_usage
  WHERE user_id = p_user_id
    AND (p_endpoint IS NULL OR endpoint = p_endpoint)
    AND created_at >= current_date
    AND cached = FALSE;
  
  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_user_daily_usage"("p_user_id" "uuid", "p_endpoint" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_latest_sessions"("p_user_id" "uuid", "p_test_type" "text") RETURNS TABLE("passage_id" "uuid", "session_id" "uuid", "is_completed" boolean, "score" numeric, "progress_percentage" integer, "created_at" timestamp with time zone, "completed_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
    END as progress_percentage,
    ts.created_at,
    ts.completed_at
  FROM public.test_sessions ts
  WHERE ts.user_id = p_user_id 
    AND ts.test_type = p_test_type
  ORDER BY 
    COALESCE(ts.passage_id, (ts.content_data->>'passage_id')::UUID, (ts.content_data->>'id')::UUID),
    ts.created_at DESC
$$;


ALTER FUNCTION "public"."get_user_latest_sessions"("p_user_id" "uuid", "p_test_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_monthly_usage"("p_user_id" "uuid", "p_endpoint" "text" DEFAULT NULL::"text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*)::INTEGER INTO v_count
  FROM public.ai_api_usage
  WHERE user_id = p_user_id
    AND (p_endpoint IS NULL OR endpoint = p_endpoint)
    AND created_at >= date_trunc('month', current_date)
    AND cached = FALSE;
  
  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_user_monthly_usage"("p_user_id" "uuid", "p_endpoint" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_referral_stats"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_referral_code TEXT;
    v_referral_count INTEGER;
    v_next_tier RECORD;
    v_claimed_rewards JSONB;
    v_bonus_expiry TIMESTAMPTZ;
    v_bonus_writing INTEGER;
    v_bonus_speaking INTEGER;
BEGIN
    -- Get user's referral info
    SELECT referral_code, referral_bonus_expires_at, bonus_writing_credits, bonus_speaking_credits
    INTO v_referral_code, v_bonus_expiry, v_bonus_writing, v_bonus_speaking
    FROM users
    WHERE id = p_user_id;

    -- Generate code if doesn't exist
    IF v_referral_code IS NULL THEN
        v_referral_code := generate_referral_code(p_user_id);
    END IF;

    -- Get referral count
    SELECT COUNT(*) INTO v_referral_count
    FROM user_referrals
    WHERE referrer_id = p_user_id;

    -- Get next unclaimed tier
    SELECT * INTO v_next_tier
    FROM referral_reward_tiers rrt
    WHERE rrt.is_active = true
    AND NOT EXISTS (
        SELECT 1 FROM user_referral_rewards urr
        WHERE urr.user_id = p_user_id
        AND urr.tier_id = rrt.id
    )
    ORDER BY rrt.referrals_required ASC
    LIMIT 1;

    -- Get claimed rewards summary
    SELECT jsonb_agg(jsonb_build_object(
        'tier_id', urr.tier_id,
        'days', urr.extra_days_granted,
        'writing', urr.writing_credits_granted,
        'speaking', urr.speaking_credits_granted,
        'claimed_at', urr.claimed_at,
        'referrals_required', rrt.referrals_required
    ))
    INTO v_claimed_rewards
    FROM user_referral_rewards urr
    JOIN referral_reward_tiers rrt ON rrt.id = urr.tier_id
    WHERE urr.user_id = p_user_id;

    RETURN jsonb_build_object(
        'referral_code', v_referral_code,
        'referral_count', v_referral_count,
        'bonus_expires_at', v_bonus_expiry,
        'bonus_writing_credits', COALESCE(v_bonus_writing, 0),
        'bonus_speaking_credits', COALESCE(v_bonus_speaking, 0),
        'next_tier', CASE WHEN v_next_tier IS NULL THEN NULL ELSE jsonb_build_object(
            'referrals_required', v_next_tier.referrals_required,
            'extra_days', v_next_tier.extra_days,
            'writing_credits', v_next_tier.writing_credits,
            'speaking_credits', v_next_tier.speaking_credits
        ) END,
        'claimed_rewards', COALESCE(v_claimed_rewards, '[]'::jsonb)
    );
END;
$$;


ALTER FUNCTION "public"."get_user_referral_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_weak_skills"("p_user_id" "uuid", "p_limit" integer DEFAULT 5) RETURNS TABLE("skill_code" "text", "module" "text", "mastery_probability" double precision, "practice_count" integer, "days_since_practice" integer, "priority_score" double precision)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.skill_code,
    sp.module,
    sp.mastery_probability,
    sp.practice_count,
    COALESCE(EXTRACT(DAY FROM NOW() - sp.last_practiced_at)::INT, 999) as days_since_practice,
    -- Priority score: lower mastery + longer time since practice = higher priority
    (1 - sp.mastery_probability) * 0.6 + 
    LEAST(COALESCE(EXTRACT(DAY FROM NOW() - sp.last_practiced_at), 30) / 30.0, 1.0) * 0.4 as priority_score
  FROM skill_proficiency sp
  WHERE sp.user_id = p_user_id
  ORDER BY priority_score DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_user_weak_skills"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_vocabulary_stats"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalWords', COALESCE(COUNT(*), 0),
        'masteredWords', COALESCE(SUM(CASE WHEN (mastery_level IS NOT NULL AND mastery_level >= 4) THEN 1 ELSE 0 END), 0),
        'dueForReviewCount', COALESCE(SUM(CASE WHEN (next_review_date IS NULL OR next_review_date <= NOW()) THEN 1 ELSE 0 END), 0)
    )
    INTO result
    FROM public.vocabulary_items
    WHERE user_id = p_user_id;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_vocabulary_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_writing_session_with_task"("p_session_id" "uuid" DEFAULT NULL::"uuid", "p_task_id" "text" DEFAULT NULL::"text", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_session RECORD;
  v_task RECORD;
  v_effective_task_id TEXT;

BEGIN
  -- If session_id is provided, load session first to get task_id
  IF p_session_id IS NOT NULL THEN
    SELECT * INTO v_session
    FROM test_sessions
    WHERE id = p_session_id
      AND (p_user_id IS NULL OR user_id = p_user_id)
    LIMIT 1;
    
    IF v_session IS NOT NULL THEN
      -- Extract task_id from session
      v_effective_task_id := COALESCE(
        v_session.passage_id::TEXT,
        v_session.content_data->>'id',
        v_session.content_data->>'passage_id',
        p_task_id
      );
    END IF;
  ELSE
    v_effective_task_id := p_task_id;
  END IF;
  
  -- Must have a task_id at this point
  IF v_effective_task_id IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'No task ID provided or found in session',
      'session', NULL,
      'task', NULL
    );
  END IF;
  
  -- Load task data
  SELECT * INTO v_task
  FROM passages
  WHERE id = v_effective_task_id::UUID
    AND is_active = TRUE
  LIMIT 1;
  
  IF v_task IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Task not found or inactive',
      'session', CASE WHEN v_session IS NOT NULL THEN row_to_json(v_session)::JSONB ELSE NULL END,
      'task', NULL
    );
  END IF;
  
  -- If no session loaded yet, try to find existing session by task_id
  IF v_session IS NULL AND p_user_id IS NOT NULL AND p_session_id IS NULL THEN
    SELECT * INTO v_session
    FROM test_sessions
    WHERE user_id = p_user_id
      AND test_type = 'writing'
      AND (
        passage_id::TEXT = v_effective_task_id
        OR content_data->>'id' = v_effective_task_id
      )
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  -- Build result
  RETURN jsonb_build_object(
    'error', NULL,
    'session', CASE WHEN v_session IS NOT NULL THEN row_to_json(v_session)::JSONB ELSE NULL END,
    'task', row_to_json(v_task)::JSONB
  );
END;
$$;


ALTER FUNCTION "public"."get_writing_session_with_task"("p_session_id" "uuid", "p_task_id" "text", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_writing_session_with_task"("p_session_id" "uuid", "p_task_id" "text", "p_user_id" "uuid") IS 'Fetches writing session and task data in a single query. Use for optimized initialization.';



CREATE OR REPLACE FUNCTION "public"."handle_new_user_points"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.user_points (user_id, points, level)
  VALUES (NEW.id, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_points"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_payment_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF (OLD.status = 'pending' AND NEW.status = 'approved') THEN
        UPDATE public.users
        SET 
            subscription_tier = NEW.tier,
            updated_at = NOW()
        WHERE auth_id = NEW.auth_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_payment_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_stripe_checkout_completed"("p_event_id" "text", "p_auth_id" "uuid", "p_user_id" "uuid", "p_tier" "text", "p_interval" "text", "p_amount" numeric, "p_currency" "text", "p_session_id" "text", "p_subscription_id" "text", "p_end_date" timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_email TEXT;
BEGIN
    -- 1. Idempotency Check
    IF EXISTS (SELECT 1 FROM stripe_events WHERE id = p_event_id) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Event already processed');
    END IF;

    -- 2. Get user email
    SELECT email INTO v_user_email FROM users WHERE auth_id = p_auth_id;

    -- 3. Update User Table
    UPDATE users
    SET 
        subscription_tier = p_tier,
        billing_interval = p_interval,
        stripe_subscription_id = p_subscription_id,
        subscription_start_date = NOW(),
        subscription_end_date = p_end_date,
        cancel_at_period_end = FALSE,
        updated_at = NOW()
    WHERE auth_id = p_auth_id;

    -- 4. Record in payment_requests (for Admin Panel visibility)
    INSERT INTO payment_requests (
        auth_id,
        tier,
        interval,
        amount,
        currency,
        payment_method,
        transaction_id,
        sender_phone,
        status,
        admin_notes,
        created_at,
        updated_at
    ) VALUES (
        p_auth_id,
        p_tier,
        p_interval,
        p_amount,
        p_currency,
        'stripe',
        p_session_id,
        'N/A', -- Stripe doesn't use sender phone in this context
        'approved',
        'Stripe Checkout Session: ' || p_session_id,
        NOW(),
        NOW()
    );

    -- 5. Mark event as processed
    INSERT INTO stripe_events (id, type) VALUES (p_event_id, 'checkout.session.completed');

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."handle_stripe_checkout_completed"("p_event_id" "text", "p_auth_id" "uuid", "p_user_id" "uuid", "p_tier" "text", "p_interval" "text", "p_amount" numeric, "p_currency" "text", "p_session_id" "text", "p_subscription_id" "text", "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_stripe_event"("p_event_id" "text", "p_event_type" "text", "p_auth_id" "uuid", "p_user_id" "uuid", "p_tier" "text", "p_interval" "text", "p_amount" numeric, "p_currency" "text", "p_transaction_id" "text", "p_subscription_id" "text", "p_end_date" timestamp with time zone, "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_error TEXT;
    v_row_count INTEGER;
BEGIN
    -- 1. Idempotency check for the specific event
    IF EXISTS (SELECT 1 FROM stripe_events WHERE id = p_event_id) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Event already processed');
    END IF;

    -- 2. Update User Table (including amount/currency columns)
    -- First attempt: Update by auth_id
    IF p_auth_id IS NOT NULL THEN
        UPDATE users
        SET 
            subscription_tier = p_tier,
            billing_interval = p_interval,
            stripe_subscription_id = p_subscription_id,
            subscription_start_date = CASE WHEN p_event_type IN ('checkout.session.completed', 'invoice.paid') THEN NOW() ELSE subscription_start_date END,
            subscription_end_date = p_end_date,
            subscription_amount = p_amount,
            subscription_currency = COALESCE(p_currency, 'USD'),
            cancel_at_period_end = FALSE,
            updated_at = NOW()
        WHERE auth_id = p_auth_id;
        
        GET DIAGNOSTICS v_row_count = ROW_COUNT;
    ELSE
        v_row_count := 0;
    END IF;

    -- Fallback: If auth_id update affected 0 rows, try updating by user id
    IF v_row_count = 0 AND p_user_id IS NOT NULL THEN
        UPDATE users
        SET 
            subscription_tier = p_tier,
            billing_interval = p_interval,
            stripe_subscription_id = p_subscription_id,
            subscription_start_date = CASE WHEN p_event_type IN ('checkout.session.completed', 'invoice.paid') THEN NOW() ELSE subscription_start_date END,
            subscription_end_date = p_end_date,
            subscription_amount = p_amount,
            subscription_currency = COALESCE(p_currency, 'USD'),
            cancel_at_period_end = FALSE,
            updated_at = NOW()
        WHERE id = p_user_id;
        
        GET DIAGNOSTICS v_row_count = ROW_COUNT;
    END IF;

    -- Log if no rows were updated (for debugging)
    IF v_row_count = 0 THEN
        RAISE WARNING '[handle_stripe_event] No user updated for event %, auth_id=%, user_id=%', p_event_id, p_auth_id, p_user_id;
    END IF;

    -- 3. Record in billing_history and payment_requests (idempotent via ON CONFLICT)
    IF p_event_type IN ('checkout.session.completed', 'invoice.paid') THEN
        
        -- Insert into billing_history
        INSERT INTO billing_history (
            user_id,
            auth_id,
            amount,
            currency,
            payment_method,
            transaction_id,
            status,
            tier,
            billing_interval,
            stripe_invoice_id
        ) VALUES (
            p_user_id,
            p_auth_id,
            p_amount,
            p_currency,
            'stripe',
            p_transaction_id,
            'paid',
            p_tier,
            p_interval,
            CASE WHEN p_event_type = 'invoice.paid' THEN p_transaction_id ELSE NULL END
        ) ON CONFLICT (transaction_id) DO NOTHING;

        -- Insert into payment_requests for compatibility with existing admin panel
        INSERT INTO payment_requests (
            auth_id,
            tier,
            interval,
            amount,
            currency,
            payment_method,
            transaction_id,
            sender_phone,
            status,
            admin_notes
        ) VALUES (
            p_auth_id,
            p_tier,
            p_interval,
            p_amount,
            p_currency,
            'stripe',
            p_transaction_id,
            'Stripe',
            'approved',
            'Processed via ' || p_event_type
        ) ON CONFLICT (transaction_id) DO NOTHING;
    END IF;

    -- 4. Mark event as processed
    INSERT INTO stripe_events (id, type, status, metadata)
    VALUES (p_event_id, p_event_type, 'processed', p_metadata)
    ON CONFLICT (id) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'rows_updated', v_row_count);

EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    
    INSERT INTO stripe_events (id, type, status, error_message, metadata)
    VALUES (p_event_id, p_event_type, 'failed', v_error, p_metadata)
    ON CONFLICT (id) DO UPDATE SET status = 'failed', error_message = v_error;
    
    RETURN jsonb_build_object('success', false, 'error', v_error);
END;
$$;


ALTER FUNCTION "public"."handle_stripe_event"("p_event_id" "text", "p_event_type" "text", "p_auth_id" "uuid", "p_user_id" "uuid", "p_tier" "text", "p_interval" "text", "p_amount" numeric, "p_currency" "text", "p_transaction_id" "text", "p_subscription_id" "text", "p_end_date" timestamp with time zone, "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_resource_view"("resource_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    UPDATE public.resources
    SET view_count = view_count + 1
    WHERE id = resource_id AND is_published = true;
END;
$$;


ALTER FUNCTION "public"."increment_resource_view"("resource_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_question"("p_passage_id" "uuid", "p_question_text" "text", "p_type" "text", "p_question_number" integer DEFAULT NULL::integer, "p_section" integer DEFAULT NULL::integer, "p_group_instructions" "text" DEFAULT NULL::"text", "p_options" "jsonb" DEFAULT NULL::"jsonb", "p_correct_answer" "text" DEFAULT NULL::"text", "p_gap_fill" "jsonb" DEFAULT NULL::"jsonb", "p_table_data" "jsonb" DEFAULT NULL::"jsonb", "p_flowchart" "jsonb" DEFAULT NULL::"jsonb", "p_map_labeling" "jsonb" DEFAULT NULL::"jsonb", "p_matching_features" "jsonb" DEFAULT NULL::"jsonb", "p_static_text" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.questions (
    passage_id,
    question_text,
    type,
    question_number,
    section,
    group_instructions,
    options,
    correct_answer,
    gap_fill,
    table_data,
    flowchart,
    map_labeling,
    matching_features,
    static_text
  ) VALUES (
    p_passage_id,
    p_question_text,
    p_type,
    p_question_number,
    p_section,
    p_group_instructions,
    p_options,
    p_correct_answer,
    p_gap_fill,
    p_table_data,
    p_flowchart,
    p_map_labeling,
    p_matching_features,
    p_static_text
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;


ALTER FUNCTION "public"."insert_question"("p_passage_id" "uuid", "p_question_text" "text", "p_type" "text", "p_question_number" integer, "p_section" integer, "p_group_instructions" "text", "p_options" "jsonb", "p_correct_answer" "text", "p_gap_fill" "jsonb", "p_table_data" "jsonb", "p_flowchart" "jsonb", "p_map_labeling" "jsonb", "p_matching_features" "jsonb", "p_static_text" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    -- Check specific admin email from JWT directly
    (auth.jwt() ->> 'email' = 'hex.ron07@gmail.com')
    OR
    -- Check role in public.users table
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR is_super_admin = true)
    );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_current_user_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = auth.uid()
    AND (role = 'admin' OR is_super_admin = true)
  );
$$;


ALTER FUNCTION "public"."is_current_user_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = (SELECT auth.uid())
    AND is_super_admin = true
  );
END;
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_vocab_owner"("owner_id" "uuid", "creator_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE (id = owner_id OR id = creator_id)
    AND auth_id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."is_vocab_owner"("owner_id" "uuid", "creator_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."link_auth_user_to_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  -- Update the users table with the auth_id when a user signs up
  UPDATE public.users 
  SET auth_id = NEW.id, updated_at = NOW()
  WHERE email = NEW.email AND auth_id IS NULL;
  
  -- If no existing user found, create a new one
  IF NOT FOUND AND NEW.email != 'hex.ron07@gmail.com' THEN
    INSERT INTO public.users (auth_id, email, full_name, created_at, updated_at)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), NOW(), NOW());
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in link_auth_user_to_profile: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."link_auth_user_to_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_referral"("p_new_user_id" "uuid", "p_referral_code" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_referrer_id UUID;
    v_referrer_code TEXT;
BEGIN
    IF p_referral_code IS NULL OR p_referral_code = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'No referral code provided');
    END IF;

    -- Find referrer by code
    SELECT id, referral_code INTO v_referrer_id, v_referrer_code
    FROM users
    WHERE referral_code = upper(trim(p_referral_code));

    IF v_referrer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
    END IF;

    -- Can't refer yourself
    IF v_referrer_id = p_new_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own referral code');
    END IF;

    -- Check if already referred
    IF EXISTS(SELECT 1 FROM user_referrals WHERE referred_id = p_new_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'User already referred');
    END IF;

    -- Create referral record
    INSERT INTO user_referrals (referrer_id, referred_id)
    VALUES (v_referrer_id, p_new_user_id);

    -- Update referred user's referred_by
    UPDATE users SET referred_by = v_referrer_id WHERE id = p_new_user_id;

    RETURN jsonb_build_object('success', true, 'referrer_id', v_referrer_id);
END;
$$;


ALTER FUNCTION "public"."process_referral"("p_new_user_id" "uuid", "p_referral_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."redeem_promo_code"("code_lookup" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_user_id UUID;
  v_promo RECORD;
  v_already_used BOOLEAN;
BEGIN
  -- Get current authenticated user's ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not logged in');
  END IF;

  -- Find and validate promo code
  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE upper(code) = upper(code_lookup)
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > now())
    AND (max_uses IS NULL OR current_uses < max_uses);

  IF v_promo IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired promo code');
  END IF;

  -- Check if user already used this specific promo code
  SELECT (v_promo.id::text = ANY(COALESCE(used_promo_codes, ARRAY[]::text[])))
  INTO v_already_used
  FROM public.users
  WHERE auth_id = v_user_id;

  IF COALESCE(v_already_used, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already used this promo code');
  END IF;

  -- Apply Redemption Logic based on Promo Type
  IF v_promo.grants_subscription IS NOT NULL THEN
    -- Subscription Grant Mode
    UPDATE public.users
    SET 
      subscription_tier = v_promo.grants_subscription,
      promo_discount = NULL,
      used_promo_codes = array_append(COALESCE(used_promo_codes, ARRAY[]::text[]), v_promo.id::text),
      updated_at = now()
    WHERE auth_id = v_user_id;

    UPDATE public.promo_codes
    SET current_uses = COALESCE(current_uses, 0) + 1
    WHERE id = v_promo.id;

    RETURN jsonb_build_object(
      'success', true,
      'type', 'grant',
      'subscription', v_promo.grants_subscription,
      'message', 'Subscription ' || initcap(v_promo.grants_subscription) || ' activated successfully!'
    );
  ELSE
    -- Standard Discount Mode
    UPDATE public.users
    SET 
      promo_discount = jsonb_build_object(
        'code', v_promo.code,
        'discount_type', v_promo.discount_type,
        'discount_value', v_promo.discount_value,
        'applied_date', now()
      ),
      used_promo_codes = array_append(COALESCE(used_promo_codes, ARRAY[]::text[]), v_promo.id::text),
      updated_at = now()
    WHERE auth_id = v_user_id;

    UPDATE public.promo_codes
    SET current_uses = COALESCE(current_uses, 0) + 1
    WHERE id = v_promo.id;

    RETURN jsonb_build_object(
      'success', true,
      'type', 'discount',
      'discount_type', v_promo.discount_type,
      'discount_value', v_promo.discount_value,
      'code', v_promo.code,
      'message', 'Discount applied successfully!'
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."redeem_promo_code"("code_lookup" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."redeem_subscription_promo"("p_code" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN public.redeem_promo_code(p_code);
END;
$$;


ALTER FUNCTION "public"."redeem_subscription_promo"("p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_passage_total_questions"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_passage_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
     v_passage_id := OLD.passage_id;
  ELSE
     v_passage_id := NEW.passage_id;
  END IF;

  IF v_passage_id IS NOT NULL THEN
     UPDATE public.passages
     SET total_questions = (
       SELECT COALESCE(SUM(question_count), 0)
       FROM public.questions
       WHERE passage_id = v_passage_id
     )
     WHERE id = v_passage_id;
  END IF;

  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."sync_passage_total_questions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_passage_questions_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (NEW.content::text IS DISTINCT FROM OLD.content::text) THEN
        BEGIN
            NEW.total_questions := public.calculate_total_questions(NEW.content::jsonb);
        EXCEPTION WHEN OTHERS THEN
            NEW.total_questions := 0;
        END;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_passage_questions_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_resources_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_resources_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_single_question_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
   NEW.question_count := public.calculate_question_row_count(
      COALESCE(NEW.type, ''),
      NEW.question_number,
      NEW.gap_fill,
      NEW.table_data,
      NEW.matching_features,
      NEW.matching_data,
      NEW.map_labeling,
      NEW.flowchart,
      COALESCE(NEW.allow_multiple, false),
      COALESCE(NEW.question_count, 1),
      NEW.question_text
   );
   RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_single_question_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_skill_proficiency_from_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_skill_code TEXT;
  v_total INT;
  v_correct INT;
  v_accuracy FLOAT;
  v_lr FLOAT;
  v_old_mastery FLOAT;
  v_old_conf FLOAT;
  v_new_mastery FLOAT;
  v_new_conf FLOAT;
  v_module TEXT;
  v_interval_days INT;
BEGIN
  IF NEW.is_completed = true AND (OLD IS NULL OR OLD.is_completed = false) THEN
    IF NEW.skill_targets IS NULL OR array_length(NEW.skill_targets, 1) IS NULL THEN
      RETURN NEW;
    END IF;

    v_total := COALESCE((NEW.outcome_data->>'total')::INT, 0);
    v_correct := COALESCE((NEW.outcome_data->>'correct')::INT, 0);

    IF v_total <= 0 THEN
      RETURN NEW;
    END IF;

    v_accuracy := LEAST(GREATEST(v_correct::FLOAT / v_total::FLOAT, 0), 1);
    v_lr := LEAST(GREATEST(v_total::FLOAT / 40.0, 0.05), 0.35);

    FOREACH v_skill_code IN ARRAY NEW.skill_targets
    LOOP
      v_module := split_part(v_skill_code, '_', 1);
      IF v_module NOT IN ('reading', 'writing', 'listening', 'speaking', 'vocabulary', 'grammar') THEN
        v_module := COALESCE(NEW.module, 'reading');
      END IF;

      SELECT mastery_probability, confidence_level
      INTO v_old_mastery, v_old_conf
      FROM skill_proficiency
      WHERE user_id = NEW.user_id AND skill_code = v_skill_code;

      IF FOUND THEN
        v_old_mastery := COALESCE(v_old_mastery, 0.5);
        v_old_conf := COALESCE(v_old_conf, 0.0);

        v_new_mastery := LEAST(GREATEST((v_old_mastery * (1 - v_lr)) + (v_accuracy * v_lr), 0.01), 0.99);
        v_new_conf := LEAST(v_old_conf + LEAST(0.04 + (v_total::FLOAT / 250.0), 0.18), 1.0);

        v_interval_days := CASE
          WHEN v_accuracy < 0.5 THEN 1
          ELSE 1 + FLOOR(v_new_mastery * 10) + FLOOR(v_new_conf * 4)
        END;

        UPDATE skill_proficiency
        SET
          module = v_module,
          mastery_probability = v_new_mastery,
          confidence_level = v_new_conf,
          practice_count = practice_count + v_total,
          correct_count = correct_count + v_correct,
          last_practiced_at = NOW(),
          next_review_at = NOW() + (v_interval_days::TEXT || ' days')::INTERVAL,
          streak_count = CASE
            WHEN last_practiced_at >= NOW() - INTERVAL '2 days' THEN streak_count + 1
            ELSE 1
          END,
          updated_at = NOW()
        WHERE user_id = NEW.user_id AND skill_code = v_skill_code;
      ELSE
        v_new_mastery := LEAST(GREATEST((0.5 * (1 - v_lr)) + (v_accuracy * v_lr), 0.01), 0.99);
        v_new_conf := LEAST(0.12 + (v_total::FLOAT / 200.0), 1.0);

        v_interval_days := CASE
          WHEN v_accuracy < 0.5 THEN 1
          ELSE 1 + FLOOR(v_new_mastery * 10) + FLOOR(v_new_conf * 4)
        END;

        INSERT INTO skill_proficiency (
          user_id,
          skill_code,
          module,
          mastery_probability,
          confidence_level,
          practice_count,
          correct_count,
          last_practiced_at,
          next_review_at
        ) VALUES (
          NEW.user_id,
          v_skill_code,
          v_module,
          v_new_mastery,
          v_new_conf,
          v_total,
          v_correct,
          NOW(),
          NOW() + (v_interval_days::TEXT || ' days')::INTERVAL
        )
        ON CONFLICT (user_id, skill_code) DO UPDATE SET
          module = EXCLUDED.module,
          mastery_probability = EXCLUDED.mastery_probability,
          confidence_level = EXCLUDED.confidence_level,
          practice_count = skill_proficiency.practice_count + EXCLUDED.practice_count,
          correct_count = skill_proficiency.correct_count + EXCLUDED.correct_count,
          last_practiced_at = EXCLUDED.last_practiced_at,
          next_review_at = EXCLUDED.next_review_at,
          updated_at = NOW();
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_skill_proficiency_from_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_skill_proficiency_from_test"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_type_stats JSONB;
  v_skill_record RECORD;
  v_total INT;
  v_correct INT;
  v_accuracy FLOAT;
  v_lr FLOAT;
  v_skill_code TEXT;
  v_old_mastery FLOAT;
  v_old_conf FLOAT;
  v_new_mastery FLOAT;
  v_new_conf FLOAT;
  v_interval_days INT;
BEGIN
  IF NEW.is_completed = true AND (OLD IS NULL OR OLD.is_completed = false) THEN
    v_type_stats := COALESCE(NEW.content_data->'typeStats', '{}'::JSONB);

    FOR v_skill_record IN SELECT * FROM jsonb_each(v_type_stats)
    LOOP
      v_skill_code := NEW.test_type || '_' || REPLACE(v_skill_record.key, ' ', '_');
      v_total := COALESCE((v_skill_record.value->>'total')::INT, 0);
      v_correct := COALESCE((v_skill_record.value->>'correct')::INT, 0);

      IF v_total <= 0 THEN
        CONTINUE;
      END IF;

      v_accuracy := LEAST(GREATEST(v_correct::FLOAT / v_total::FLOAT, 0), 1);
      v_lr := LEAST(GREATEST(v_total::FLOAT / 40.0, 0.05), 0.35);

      SELECT mastery_probability, confidence_level
      INTO v_old_mastery, v_old_conf
      FROM skill_proficiency
      WHERE user_id = NEW.user_id AND skill_code = v_skill_code;

      IF FOUND THEN
        v_old_mastery := COALESCE(v_old_mastery, 0.5);
        v_old_conf := COALESCE(v_old_conf, 0.0);

        v_new_mastery := LEAST(GREATEST((v_old_mastery * (1 - v_lr)) + (v_accuracy * v_lr), 0.01), 0.99);
        v_new_conf := LEAST(v_old_conf + LEAST(0.05 + (v_total::FLOAT / 200.0), 0.2), 1.0);

        v_interval_days := CASE
          WHEN v_accuracy < 0.5 THEN 1
          ELSE 1 + FLOOR(v_new_mastery * 10) + FLOOR(v_new_conf * 4)
        END;

        UPDATE skill_proficiency
        SET
          mastery_probability = v_new_mastery,
          confidence_level = v_new_conf,
          practice_count = practice_count + v_total,
          correct_count = correct_count + v_correct,
          last_practiced_at = NOW(),
          next_review_at = NOW() + (v_interval_days::TEXT || ' days')::INTERVAL,
          streak_count = CASE
            WHEN last_practiced_at >= NOW() - INTERVAL '2 days' THEN streak_count + 1
            ELSE 1
          END,
          updated_at = NOW()
        WHERE user_id = NEW.user_id AND skill_code = v_skill_code;
      ELSE
        v_new_mastery := LEAST(GREATEST((0.5 * (1 - v_lr)) + (v_accuracy * v_lr), 0.01), 0.99);
        v_new_conf := LEAST(0.15 + (v_total::FLOAT / 150.0), 1.0);

        v_interval_days := CASE
          WHEN v_accuracy < 0.5 THEN 1
          ELSE 1 + FLOOR(v_new_mastery * 10) + FLOOR(v_new_conf * 4)
        END;

        INSERT INTO skill_proficiency (
          user_id,
          skill_code,
          module,
          mastery_probability,
          confidence_level,
          practice_count,
          correct_count,
          last_practiced_at,
          next_review_at
        ) VALUES (
          NEW.user_id,
          v_skill_code,
          NEW.test_type,
          v_new_mastery,
          v_new_conf,
          v_total,
          v_correct,
          NOW(),
          NOW() + (v_interval_days::TEXT || ' days')::INTERVAL
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_skill_proficiency_from_test"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_study_streak"("p_user_id" "uuid") RETURNS TABLE("current_streak" integer, "longest_streak" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_last_study_date DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
    v_today DATE := CURRENT_DATE;
BEGIN
    SELECT u.last_study_date, u.current_streak, u.longest_streak
    INTO v_last_study_date, v_current_streak, v_longest_streak
    FROM users u WHERE u.id = p_user_id;
    
    IF v_last_study_date IS NULL THEN
        -- First study ever
        v_current_streak := 1;
    ELSIF v_last_study_date = v_today THEN
        -- Already studied today, no change
        NULL;
    ELSIF v_last_study_date = v_today - 1 THEN
        -- Studied yesterday, increment streak
        v_current_streak := COALESCE(v_current_streak, 0) + 1;
    ELSE
        -- Streak broken, start fresh
        v_current_streak := 1;
    END IF;
    
    -- Update longest streak if current exceeds it
    IF v_current_streak > COALESCE(v_longest_streak, 0) THEN
        v_longest_streak := v_current_streak;
    END IF;
    
    -- Update user record
    UPDATE users SET
        current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_study_date = v_today
    WHERE id = p_user_id;
    
    RETURN QUERY SELECT v_current_streak, v_longest_streak;
END;
$$;


ALTER FUNCTION "public"."update_study_streak"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_consent"("p_consent_analytics" boolean, "p_consent_marketing" boolean, "p_consent_functional" boolean, "p_ccpa_do_not_sell" boolean DEFAULT NULL::boolean, "p_ip_address" "text" DEFAULT NULL::"text", "p_user_agent" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID;
  v_consent_version TEXT := '1.0';
BEGIN
  -- Get current user's profile ID
  SELECT id INTO v_user_id
  FROM users
  WHERE auth_id = (SELECT auth.uid());
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Insert history records for each consent change
  INSERT INTO consent_history (user_id, consent_type, consented, consent_version, ip_address, user_agent)
  VALUES 
    (v_user_id, 'analytics', p_consent_analytics, v_consent_version, p_ip_address, p_user_agent),
    (v_user_id, 'marketing', p_consent_marketing, v_consent_version, p_ip_address, p_user_agent),
    (v_user_id, 'functional', p_consent_functional, v_consent_version, p_ip_address, p_user_agent);
  
  -- Insert CCPA history if provided
  IF p_ccpa_do_not_sell IS NOT NULL THEN
    INSERT INTO consent_history (user_id, consent_type, consented, consent_version, ip_address, user_agent)
    VALUES (v_user_id, 'ccpa_do_not_sell', p_ccpa_do_not_sell, v_consent_version, p_ip_address, p_user_agent);
  END IF;
  
  -- Update user record
  UPDATE users
  SET 
    consent_analytics = p_consent_analytics,
    consent_marketing = p_consent_marketing,
    consent_functional = p_consent_functional,
    consent_timestamp = NOW(),
    consent_version = v_consent_version,
    ccpa_do_not_sell = COALESCE(p_ccpa_do_not_sell, ccpa_do_not_sell),
    ccpa_opted_out_at = CASE WHEN p_ccpa_do_not_sell = true THEN NOW() ELSE ccpa_opted_out_at END,
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Consent preferences updated successfully'
  );
END;
$$;


ALTER FUNCTION "public"."update_user_consent"("p_consent_analytics" boolean, "p_consent_marketing" boolean, "p_consent_functional" boolean, "p_ccpa_do_not_sell" boolean, "p_ip_address" "text", "p_user_agent" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_last_active"("user_auth_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE users 
  SET last_active = NOW(), updated_at = NOW()
  WHERE auth_id = user_auth_id;
END;
$$;


ALTER FUNCTION "public"."update_user_last_active"("user_auth_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_user_profile"("p_auth_id" "uuid", "p_email" "text", "p_updates" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    -- First, try to find user by auth_id
    SELECT id INTO v_user_id
    FROM users
    WHERE auth_id = p_auth_id;

    IF v_user_id IS NOT NULL THEN
        -- User found by auth_id, update the record
        UPDATE users
        SET 
            full_name = COALESCE((p_updates->>'full_name')::TEXT, full_name),
            avatar_url = COALESCE((p_updates->>'avatar_url')::TEXT, avatar_url),
            exam_type = COALESCE((p_updates->>'exam_type')::TEXT, exam_type),
            target_band_score = COALESCE((p_updates->>'target_band_score')::NUMERIC(2,1), target_band_score),
            test_date = COALESCE((p_updates->>'test_date')::DATE, test_date),
            study_hours_goal = COALESCE((p_updates->>'study_hours_goal')::NUMERIC, study_hours_goal),
            weak_area = COALESCE((p_updates->>'weak_area')::TEXT, weak_area),
            onboarding_completed = COALESCE((p_updates->>'onboarding_completed')::BOOLEAN, onboarding_completed),
            updated_at = NOW()
        WHERE id = v_user_id
        RETURNING to_jsonb(users.*) INTO v_result;
        
        RETURN v_result;
    END IF;

    -- If not found by auth_id, try to find by email
    SELECT id INTO v_user_id
    FROM users
    WHERE email = p_email;

    IF v_user_id IS NOT NULL THEN
        -- User found by email but different auth_id
        -- Update the auth_id to the current one and apply updates
        UPDATE users
        SET 
            auth_id = p_auth_id,
            full_name = COALESCE((p_updates->>'full_name')::TEXT, full_name),
            avatar_url = COALESCE((p_updates->>'avatar_url')::TEXT, avatar_url),
            exam_type = COALESCE((p_updates->>'exam_type')::TEXT, exam_type),
            target_band_score = COALESCE((p_updates->>'target_band_score')::NUMERIC(2,1), target_band_score),
            test_date = COALESCE((p_updates->>'test_date')::DATE, test_date),
            study_hours_goal = COALESCE((p_updates->>'study_hours_goal')::NUMERIC, study_hours_goal),
            weak_area = COALESCE((p_updates->>'weak_area')::TEXT, weak_area),
            onboarding_completed = COALESCE((p_updates->>'onboarding_completed')::BOOLEAN, onboarding_completed),
            updated_at = NOW()
        WHERE id = v_user_id
        RETURNING to_jsonb(users.*) INTO v_result;
        
        RETURN v_result;
    END IF;

    -- User not found, create new record
    INSERT INTO users (
        auth_id,
        email,
        full_name,
        avatar_url,
        exam_type,
        role,
        subscription_tier,
        target_band_score,
        test_date,
        study_hours_goal,
        weak_area,
        onboarding_completed,
        created_at,
        updated_at
    )
    VALUES (
        p_auth_id,
        p_email,
        COALESCE((p_updates->>'full_name')::TEXT, p_email),
        (p_updates->>'avatar_url')::TEXT,
        COALESCE((p_updates->>'exam_type')::TEXT, 'academic'),
        'user',
        'free',
        (p_updates->>'target_band_score')::NUMERIC(2,1),
        (p_updates->>'test_date')::DATE,
        COALESCE((p_updates->>'study_hours_goal')::NUMERIC, 0.75),
        (p_updates->>'weak_area')::TEXT,
        COALESCE((p_updates->>'onboarding_completed')::BOOLEAN, FALSE),
        NOW(),
        NOW()
    )
    RETURNING to_jsonb(users.*) INTO v_result;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."upsert_user_profile"("p_auth_id" "uuid", "p_email" "text", "p_updates" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."upsert_user_profile"("p_auth_id" "uuid", "p_email" "text", "p_updates" "jsonb") IS 'Atomically upsert user profile with proper conflict handling. Tries auth_id first, then email, then creates new.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "criteria" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category" "text",
    "badge_color" "text",
    "is_active" boolean DEFAULT true,
    "icon" "text",
    "points" integer DEFAULT 0
);


ALTER TABLE "public"."achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_api_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "endpoint" "text" NOT NULL,
    "tokens_used" integer DEFAULT 0,
    "cached" boolean DEFAULT false,
    "request_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."ai_api_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_feedback_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "input_hash" "text" NOT NULL,
    "feedback_json" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "expires_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", ("now"() + '30 days'::interval)) NOT NULL
);


ALTER TABLE "public"."ai_feedback_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_data" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "data_type" "text" NOT NULL,
    "value" "jsonb",
    "recorded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "auth_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" NOT NULL,
    "payment_method" "text" NOT NULL,
    "transaction_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "tier" "text" NOT NULL,
    "billing_interval" "text",
    "stripe_invoice_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."billing_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consent_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "consent_type" "text" NOT NULL,
    "consented" boolean NOT NULL,
    "consent_version" "text" NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."consent_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_focus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "focus_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "primary_activity_id" "uuid",
    "primary_skill" "text",
    "primary_module" "text",
    "ai_reason" "text",
    "is_completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_focus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."learning_path_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "learning_path_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "activity_key" "text" NOT NULL,
    "activity_type" "text" NOT NULL,
    "module" "text",
    "title" "text" NOT NULL,
    "description" "text",
    "skill_targets" "text"[],
    "scheduled_day" "text",
    "scheduled_date" "date",
    "estimated_minutes" integer DEFAULT 30,
    "priority" "text" DEFAULT 'medium'::"text",
    "is_completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "outcome_score" double precision,
    "outcome_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."learning_path_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."learning_paths" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "path_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "activities_completed" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."learning_paths" OWNER TO "postgres";


COMMENT ON COLUMN "public"."learning_paths"."activities_completed" IS 'Tracks which activities have been completed, keyed by date';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'info'::"text",
    "target_audience" "text" DEFAULT 'all'::"text",
    "is_read" boolean DEFAULT false,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "notifications_target_audience_check" CHECK (("target_audience" = ANY (ARRAY['all'::"text", 'free'::"text", 'pro'::"text", 'premium'::"text"]))),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['info'::"text", 'warning'::"text", 'success'::"text", 'error'::"text", 'announcement'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Stores system notifications and announcements that can be targeted to specific user tiers.';



CREATE TABLE IF NOT EXISTS "public"."passages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "test_type" "text" NOT NULL,
    "test_format" "text" NOT NULL,
    "topic" "text" NOT NULL,
    "access_tier" "text" DEFAULT 'free'::"text" NOT NULL,
    "is_official_cambridge" boolean DEFAULT false NOT NULL,
    "cambridge_title" "text",
    "audio_url" "text",
    "transcript" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "question_count" integer DEFAULT 0,
    "cambridge_year" integer,
    "cambridge_test_number" integer,
    "task_type" "text",
    "duration_minutes" integer,
    "total_questions" integer DEFAULT 0
);

ALTER TABLE ONLY "public"."passages" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."passages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_id" "uuid",
    "tier" "text" NOT NULL,
    "interval" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'BDT'::"text",
    "payment_method" "text" NOT NULL,
    "transaction_id" "text" NOT NULL,
    "sender_phone" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_requests_interval_check" CHECK (("interval" = ANY (ARRAY['monthly'::"text", 'quarterly'::"text"]))),
    CONSTRAINT "payment_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "payment_requests_tier_check" CHECK (("tier" = ANY (ARRAY['pro'::"text", 'premium'::"text"])))
);


ALTER TABLE "public"."payment_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promo_codes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" "text" NOT NULL,
    "discount" numeric(5,2),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "applicable_plans" "text"[],
    "discount_type" "text" DEFAULT 'percentage'::"text",
    "discount_value" numeric(10,2) DEFAULT 0,
    "valid_from" "date" DEFAULT "now"(),
    "valid_until" "date",
    "max_uses" integer DEFAULT 100,
    "current_uses" integer DEFAULT 0,
    "grants_subscription" "text",
    "subscription_duration_days" integer DEFAULT 30,
    CONSTRAINT "promo_codes_grants_subscription_check" CHECK ((("grants_subscription" IS NULL) OR ("grants_subscription" = ANY (ARRAY['pro'::"text", 'premium'::"text"]))))
);


ALTER TABLE "public"."promo_codes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."promo_codes"."grants_subscription" IS 'If set, redeeming this promo upgrades user to specified subscription tier';



COMMENT ON COLUMN "public"."promo_codes"."subscription_duration_days" IS 'Number of days the subscription grant is valid for (NULL = permanent)';



CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "passage_id" "uuid",
    "question_text" "text" NOT NULL,
    "type" "text" NOT NULL,
    "options" "jsonb",
    "correct_answer" "text",
    "explanation" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "table_data" "jsonb",
    "group_instructions" "text",
    "map_labeling" "jsonb",
    "matching_features" "jsonb",
    "gap_fill" "jsonb",
    "flowchart" "jsonb",
    "static_text" "jsonb",
    "duration_minutes" integer,
    "part_number" integer,
    "matching_data" "jsonb",
    "section" integer,
    "allow_multiple" boolean DEFAULT false,
    "question_count" integer DEFAULT 1,
    "question_number" integer,
    "mcq_title" "text"
);

ALTER TABLE ONLY "public"."questions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."questions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."questions"."table_data" IS 'JSONB column for table completion data';



COMMENT ON COLUMN "public"."questions"."map_labeling" IS 'JSONB column for map labeling question data';



COMMENT ON COLUMN "public"."questions"."matching_features" IS 'JSONB column for matching features data';



COMMENT ON COLUMN "public"."questions"."gap_fill" IS 'JSONB column for gap fill question data';



COMMENT ON COLUMN "public"."questions"."flowchart" IS 'JSONB column for flowchart question data';



COMMENT ON COLUMN "public"."questions"."static_text" IS 'JSONB column for static text/headers';



COMMENT ON COLUMN "public"."questions"."mcq_title" IS 'Title for a group of MCQ questions, typically displayed above the questions (e.g., "Free activities in the Burnham area")';



CREATE TABLE IF NOT EXISTS "public"."referral_reward_tiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrals_required" integer NOT NULL,
    "extra_days" integer DEFAULT 0,
    "writing_credits" integer DEFAULT 0,
    "speaking_credits" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."referral_reward_tiers" OWNER TO "postgres";


COMMENT ON TABLE "public"."referral_reward_tiers" IS 'Admin-configurable reward tiers for the referral program';



CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "url" "text" NOT NULL,
    "content_type" "text" NOT NULL,
    "thumbnail_url" "text",
    "is_published" boolean DEFAULT false,
    "view_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "content" "text",
    "slug" "text",
    "seo_tags" "text"[],
    "access_tier" "text" DEFAULT 'free'::"text",
    CONSTRAINT "resources_access_tier_check" CHECK (("access_tier" = ANY (ARRAY['free'::"text", 'pro'::"text", 'premium'::"text"]))),
    CONSTRAINT "resources_content_type_check" CHECK (("content_type" = ANY (ARRAY['video'::"text", 'pdf'::"text", 'blog'::"text", 'vocabulary'::"text"])))
);


ALTER TABLE "public"."resources" OWNER TO "postgres";


COMMENT ON TABLE "public"."resources" IS 'Educational resources including videos, PDFs, and blog posts managed by admins';



CREATE TABLE IF NOT EXISTS "public"."skill_proficiency" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "skill_code" "text" NOT NULL,
    "module" "text" NOT NULL,
    "mastery_probability" double precision DEFAULT 0.5,
    "confidence_level" double precision DEFAULT 0.0,
    "practice_count" integer DEFAULT 0,
    "correct_count" integer DEFAULT 0,
    "last_practiced_at" timestamp with time zone,
    "next_review_at" timestamp with time zone,
    "streak_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "skill_proficiency_confidence_level_check" CHECK ((("confidence_level" >= (0)::double precision) AND ("confidence_level" <= (1)::double precision))),
    CONSTRAINT "skill_proficiency_mastery_probability_check" CHECK ((("mastery_probability" >= (0)::double precision) AND ("mastery_probability" <= (1)::double precision)))
);


ALTER TABLE "public"."skill_proficiency" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_events" (
    "id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'processed'::"text",
    "error_message" "text",
    "metadata" "jsonb"
);


ALTER TABLE "public"."stripe_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_health_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "level" "text" NOT NULL,
    "component" "text" NOT NULL,
    "message" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "user_id" "uuid",
    CONSTRAINT "system_health_logs_level_check" CHECK (("level" = ANY (ARRAY['info'::"text", 'warning'::"text", 'error'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."system_health_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."system_settings" IS 'Stores global application settings like maintenance mode, pricing tiers, and announcements.';



CREATE TABLE IF NOT EXISTS "public"."test_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "passage_id" "uuid",
    "test_type" "text" NOT NULL,
    "answers" "jsonb",
    "score" numeric(3,1),
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_completed" boolean DEFAULT false,
    "duration_minutes" integer,
    "module" "text",
    "band_score" numeric(2,1),
    "started_at" timestamp with time zone,
    "test_mode" "text" DEFAULT 'practice'::"text",
    "user_responses" "jsonb" DEFAULT '[]'::"jsonb",
    "content_data" "jsonb",
    CONSTRAINT "check_test_mode" CHECK (("test_mode" = ANY (ARRAY['practice'::"text", 'mock'::"text", 'timed'::"text", 'adaptive'::"text"])))
);


ALTER TABLE "public"."test_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tier_rate_limits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tier" "text" NOT NULL,
    "daily_limit" integer DEFAULT 10 NOT NULL,
    "monthly_limit" integer DEFAULT 100 NOT NULL,
    "burst_limit" integer DEFAULT 5 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_by" "uuid",
    CONSTRAINT "tier_rate_limits_tier_check" CHECK (("tier" = ANY (ARRAY['free'::"text", 'pro'::"text", 'premium'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."tier_rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "achievement_id" "uuid",
    "unlocked_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_points" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "points" integer DEFAULT 0,
    "level" integer DEFAULT 1,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "current_streak" integer DEFAULT 0,
    "longest_streak" integer DEFAULT 0,
    "last_activity_date" "date"
);


ALTER TABLE "public"."user_points" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_referral_rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tier_id" "uuid" NOT NULL,
    "extra_days_granted" integer DEFAULT 0,
    "writing_credits_granted" integer DEFAULT 0,
    "speaking_credits_granted" integer DEFAULT 0,
    "claimed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_referral_rewards" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_referral_rewards" IS 'Records claimed referral rewards per user';



CREATE TABLE IF NOT EXISTS "public"."user_referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referred_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reward_claimed" boolean DEFAULT false,
    "claimed_at" timestamp with time zone
);


ALTER TABLE "public"."user_referrals" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_referrals" IS 'Tracks referral relationships between users';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "auth_id" "uuid",
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "subscription_tier" "text" DEFAULT 'free'::"text" NOT NULL,
    "target_band_score" numeric(2,1),
    "study_hours_goal" integer DEFAULT 10,
    "preferred_study_time" "text",
    "test_date" "date",
    "strengths" "text"[],
    "weaknesses" "text"[],
    "total_study_time" integer DEFAULT 0,
    "last_active" timestamp with time zone,
    "used_promo_codes" "text"[],
    "promo_discount" "jsonb",
    "last_support_request" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "username" "text",
    "weak_area" "text",
    "theme_preference" "text" DEFAULT 'system'::"text",
    "notification_preferences" "jsonb" DEFAULT '{"test_alerts": true, "weekly_reports": false, "study_reminders": true}'::"jsonb",
    "privacy_settings" "jsonb" DEFAULT '{"share_analytics": true, "show_on_leaderboard": true}'::"jsonb",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "phone" "text",
    "bio" "text",
    "exam_type" "text",
    "is_super_admin" boolean DEFAULT false,
    "avatar_url" "text",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "subscription_start_date" timestamp with time zone,
    "consent_analytics" boolean DEFAULT false,
    "consent_marketing" boolean DEFAULT false,
    "consent_functional" boolean DEFAULT true,
    "consent_timestamp" timestamp with time zone,
    "consent_version" "text" DEFAULT '1.0'::"text",
    "ccpa_do_not_sell" boolean DEFAULT false,
    "ccpa_opted_out_at" timestamp with time zone,
    "current_streak" integer DEFAULT 0,
    "last_study_date" "date",
    "longest_streak" integer DEFAULT 0,
    "onboarding_completed" boolean DEFAULT false,
    "last_path_generated_at" timestamp with time zone,
    "current_estimated_band" double precision,
    "days_until_exam" integer,
    "study_streak_days" integer DEFAULT 0,
    "subscription_end_date" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "billing_interval" "text",
    "subscription_amount" numeric(10,2),
    "subscription_currency" "text" DEFAULT 'USD'::"text",
    "referral_code" "text",
    "referred_by" "uuid",
    "referral_bonus_expires_at" timestamp with time zone,
    "bonus_writing_credits" integer DEFAULT 0,
    "bonus_speaking_credits" integer DEFAULT 0,
    CONSTRAINT "username_not_empty" CHECK ((("username" IS NULL) OR ("length"(TRIM(BOTH FROM "username")) > 0)))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users"."stripe_customer_id" IS 'Stripe Customer ID for the user (cus_xxx format)';



COMMENT ON COLUMN "public"."users"."stripe_subscription_id" IS 'Active Stripe Subscription ID (sub_xxx format)';



COMMENT ON COLUMN "public"."users"."subscription_start_date" IS 'When the current subscription started';



COMMENT ON COLUMN "public"."users"."current_streak" IS 'Current study streak in days';



COMMENT ON COLUMN "public"."users"."last_study_date" IS 'Last date user completed study activity';



COMMENT ON COLUMN "public"."users"."longest_streak" IS 'Longest study streak achieved';



COMMENT ON COLUMN "public"."users"."onboarding_completed" IS 'Flag indicating if user has completed the onboarding flow';



COMMENT ON COLUMN "public"."users"."referral_code" IS 'Unique referral code for the user';



COMMENT ON COLUMN "public"."users"."referred_by" IS 'ID of the user who referred this user';



COMMENT ON COLUMN "public"."users"."referral_bonus_expires_at" IS 'When the referral bonus days expire';



COMMENT ON COLUMN "public"."users"."bonus_writing_credits" IS 'Extra writing credits from referral rewards';



COMMENT ON COLUMN "public"."users"."bonus_speaking_credits" IS 'Extra speaking credits from referral rewards';



CREATE TABLE IF NOT EXISTS "public"."vocabulary_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "word" "text" NOT NULL,
    "definition" "text",
    "example" "text",
    "synonyms" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "difficulty_level" "text",
    "example_sentence" "text",
    "source" "text" DEFAULT 'Manual'::"text",
    "times_reviewed" integer DEFAULT 0,
    "mastery_level" integer DEFAULT 0,
    "interval_days" integer DEFAULT 1,
    "ease_factor" numeric DEFAULT 2.5,
    "next_review_date" timestamp with time zone DEFAULT "now"(),
    "last_reviewed" timestamp with time zone,
    "retention_score" double precision DEFAULT 0,
    "created_by" "uuid"
);


ALTER TABLE "public"."vocabulary_items" OWNER TO "postgres";


ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_api_usage"
    ADD CONSTRAINT "ai_api_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_feedback_cache"
    ADD CONSTRAINT "ai_feedback_cache_input_hash_key" UNIQUE ("input_hash");



ALTER TABLE ONLY "public"."ai_feedback_cache"
    ADD CONSTRAINT "ai_feedback_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_data"
    ADD CONSTRAINT "analytics_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_history"
    ADD CONSTRAINT "billing_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_history"
    ADD CONSTRAINT "billing_history_transaction_id_key" UNIQUE ("transaction_id");



ALTER TABLE ONLY "public"."consent_history"
    ADD CONSTRAINT "consent_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_focus"
    ADD CONSTRAINT "daily_focus_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_focus"
    ADD CONSTRAINT "daily_focus_user_id_focus_date_key" UNIQUE ("user_id", "focus_date");



ALTER TABLE ONLY "public"."learning_path_activities"
    ADD CONSTRAINT "learning_path_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."learning_paths"
    ADD CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."passages"
    ADD CONSTRAINT "passages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_requests"
    ADD CONSTRAINT "payment_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_requests"
    ADD CONSTRAINT "payment_requests_transaction_id_key" UNIQUE ("transaction_id");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_reward_tiers"
    ADD CONSTRAINT "referral_reward_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_reward_tiers"
    ADD CONSTRAINT "referral_reward_tiers_referrals_required_key" UNIQUE ("referrals_required");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."skill_proficiency"
    ADD CONSTRAINT "skill_proficiency_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skill_proficiency"
    ADD CONSTRAINT "skill_proficiency_user_id_skill_code_key" UNIQUE ("user_id", "skill_code");



ALTER TABLE ONLY "public"."stripe_events"
    ADD CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_health_logs"
    ADD CONSTRAINT "system_health_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."test_sessions"
    ADD CONSTRAINT "test_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tier_rate_limits"
    ADD CONSTRAINT "tier_rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tier_rate_limits"
    ADD CONSTRAINT "tier_rate_limits_tier_key" UNIQUE ("tier");



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "unique_achievement_name" UNIQUE ("name");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_points"
    ADD CONSTRAINT "user_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_points"
    ADD CONSTRAINT "user_points_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_points"
    ADD CONSTRAINT "user_points_user_id_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_referral_rewards"
    ADD CONSTRAINT "user_referral_rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_referrals"
    ADD CONSTRAINT "user_referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_referrals"
    ADD CONSTRAINT "user_referrals_referrer_id_referred_id_key" UNIQUE ("referrer_id", "referred_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_id_unique" UNIQUE ("auth_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."vocabulary_items"
    ADD CONSTRAINT "vocabulary_items_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_ai_api_usage_created_at" ON "public"."ai_api_usage" USING "btree" ("created_at");



CREATE INDEX "idx_ai_api_usage_endpoint" ON "public"."ai_api_usage" USING "btree" ("endpoint");



CREATE INDEX "idx_ai_api_usage_user_date" ON "public"."ai_api_usage" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_ai_api_usage_user_id" ON "public"."ai_api_usage" USING "btree" ("user_id");



CREATE INDEX "idx_analytics_data_type" ON "public"."analytics_data" USING "btree" ("data_type");



CREATE INDEX "idx_analytics_data_user_id" ON "public"."analytics_data" USING "btree" ("user_id");



CREATE INDEX "idx_consent_history_created_at" ON "public"."consent_history" USING "btree" ("created_at");



CREATE INDEX "idx_consent_history_user_id" ON "public"."consent_history" USING "btree" ("user_id");



CREATE INDEX "idx_daily_focus_user_date" ON "public"."daily_focus" USING "btree" ("user_id", "focus_date");



CREATE INDEX "idx_learning_path_activities_path_id" ON "public"."learning_path_activities" USING "btree" ("learning_path_id");



CREATE INDEX "idx_learning_path_activities_scheduled" ON "public"."learning_path_activities" USING "btree" ("scheduled_date");



CREATE INDEX "idx_learning_path_activities_user_id" ON "public"."learning_path_activities" USING "btree" ("user_id");



CREATE INDEX "idx_learning_paths_user_id" ON "public"."learning_paths" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "idx_notifications_created_by" ON "public"."notifications" USING "btree" ("created_by");



CREATE INDEX "idx_passages_access_tier" ON "public"."passages" USING "btree" ("access_tier");



CREATE INDEX "idx_passages_cambridge" ON "public"."passages" USING "btree" ("is_official_cambridge", "is_active") WHERE ("is_official_cambridge" = true);



CREATE INDEX "idx_passages_is_active" ON "public"."passages" USING "btree" ("is_active");



CREATE INDEX "idx_passages_question_count" ON "public"."passages" USING "btree" ("question_count");



CREATE INDEX "idx_passages_test_type" ON "public"."passages" USING "btree" ("test_type");



CREATE INDEX "idx_payment_requests_auth_id" ON "public"."payment_requests" USING "btree" ("auth_id");



CREATE INDEX "idx_payment_requests_status" ON "public"."payment_requests" USING "btree" ("status");



CREATE INDEX "idx_payment_requests_transaction_id" ON "public"."payment_requests" USING "btree" ("transaction_id");



CREATE INDEX "idx_questions_allow_multiple" ON "public"."questions" USING "btree" ("allow_multiple") WHERE ("allow_multiple" = true);



CREATE INDEX "idx_questions_matching_data" ON "public"."questions" USING "gin" ("matching_data");



CREATE INDEX "idx_questions_passage_id" ON "public"."questions" USING "btree" ("passage_id");



CREATE INDEX "idx_questions_passage_order" ON "public"."questions" USING "btree" ("passage_id", "question_number");



CREATE INDEX "idx_questions_section" ON "public"."questions" USING "btree" ("section");



CREATE INDEX "idx_questions_table_data" ON "public"."questions" USING "gin" ("table_data");



CREATE INDEX "idx_resources_access_tier" ON "public"."resources" USING "btree" ("access_tier");



CREATE INDEX "idx_resources_content_type" ON "public"."resources" USING "btree" ("content_type");



CREATE INDEX "idx_resources_created_at" ON "public"."resources" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_resources_created_by" ON "public"."resources" USING "btree" ("created_by");



CREATE INDEX "idx_resources_is_published" ON "public"."resources" USING "btree" ("is_published");



CREATE INDEX "idx_resources_slug" ON "public"."resources" USING "btree" ("slug");



CREATE INDEX "idx_skill_proficiency_module" ON "public"."skill_proficiency" USING "btree" ("module");



CREATE INDEX "idx_skill_proficiency_next_review" ON "public"."skill_proficiency" USING "btree" ("next_review_at");



CREATE INDEX "idx_skill_proficiency_user_id" ON "public"."skill_proficiency" USING "btree" ("user_id");



CREATE INDEX "idx_system_settings_updated_by" ON "public"."system_settings" USING "btree" ("updated_by");



CREATE INDEX "idx_test_sessions_completed_at" ON "public"."test_sessions" USING "btree" ("completed_at");



CREATE INDEX "idx_test_sessions_created_at" ON "public"."test_sessions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_test_sessions_passage_id" ON "public"."test_sessions" USING "btree" ("passage_id");



CREATE INDEX "idx_test_sessions_test_mode" ON "public"."test_sessions" USING "btree" ("test_mode");



CREATE INDEX "idx_test_sessions_test_type" ON "public"."test_sessions" USING "btree" ("test_type");



COMMENT ON INDEX "public"."idx_test_sessions_test_type" IS 'Optimizes filtering by test type (e.g. Reading, Listening)';



CREATE INDEX "idx_test_sessions_user_completed_at" ON "public"."test_sessions" USING "btree" ("user_id", "is_completed", "completed_at" DESC);



CREATE INDEX "idx_test_sessions_user_id" ON "public"."test_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_test_sessions_user_recent" ON "public"."test_sessions" USING "btree" ("user_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_test_sessions_user_recent" IS 'Optimizes user dashboard queries for recent activity';



CREATE INDEX "idx_test_sessions_user_type_score" ON "public"."test_sessions" USING "btree" ("user_id", "test_type", "score") WHERE ("is_completed" = true);



CREATE INDEX "idx_tier_rate_limits_updated_by" ON "public"."tier_rate_limits" USING "btree" ("updated_by");



CREATE INDEX "idx_user_achievements_achievement_id" ON "public"."user_achievements" USING "btree" ("achievement_id");



CREATE INDEX "idx_user_achievements_user_id" ON "public"."user_achievements" USING "btree" ("user_id");



CREATE INDEX "idx_user_referrals_referred_id" ON "public"."user_referrals" USING "btree" ("referred_id");



CREATE INDEX "idx_user_referrals_referrer_id" ON "public"."user_referrals" USING "btree" ("referrer_id");



CREATE INDEX "idx_users_created_at" ON "public"."users" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_users_last_active" ON "public"."users" USING "btree" ("last_active" DESC);



COMMENT ON INDEX "public"."idx_users_last_active" IS 'Optimizes admin dashboard queries for active user stats';



CREATE INDEX "idx_users_onboarding_completed" ON "public"."users" USING "btree" ("onboarding_completed");



CREATE INDEX "idx_users_referral_code" ON "public"."users" USING "btree" ("referral_code");



CREATE INDEX "idx_users_referred_by" ON "public"."users" USING "btree" ("referred_by");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_users_stripe_customer_id" ON "public"."users" USING "btree" ("stripe_customer_id") WHERE ("stripe_customer_id" IS NOT NULL);



CREATE INDEX "idx_users_stripe_subscription_id" ON "public"."users" USING "btree" ("stripe_subscription_id") WHERE ("stripe_subscription_id" IS NOT NULL);



CREATE INDEX "idx_users_study_hours_goal" ON "public"."users" USING "btree" ("study_hours_goal") WHERE ("study_hours_goal" IS NOT NULL);



CREATE INDEX "idx_users_tier" ON "public"."users" USING "btree" ("subscription_tier");



COMMENT ON INDEX "public"."idx_users_tier" IS 'Optimizes admin filtering for premium users';



CREATE INDEX "idx_users_username" ON "public"."users" USING "btree" ("username");



CREATE INDEX "idx_vocabulary_items_created_by" ON "public"."vocabulary_items" USING "btree" ("created_by");



CREATE INDEX "idx_vocabulary_items_user_id" ON "public"."vocabulary_items" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "on_auth_user_created_points" AFTER INSERT ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user_points"();



CREATE OR REPLACE TRIGGER "on_payment_approval" AFTER UPDATE ON "public"."payment_requests" FOR EACH ROW EXECUTE FUNCTION "public"."handle_payment_approval"();



CREATE OR REPLACE TRIGGER "resources_updated_at_trigger" BEFORE UPDATE ON "public"."resources" FOR EACH ROW EXECUTE FUNCTION "public"."update_resources_updated_at"();



CREATE OR REPLACE TRIGGER "tr_calc_question_count" BEFORE INSERT OR UPDATE ON "public"."questions" FOR EACH ROW EXECUTE FUNCTION "public"."update_single_question_count"();



CREATE OR REPLACE TRIGGER "tr_sync_passage_totals" AFTER INSERT OR DELETE OR UPDATE ON "public"."questions" FOR EACH ROW EXECUTE FUNCTION "public"."sync_passage_total_questions"();



CREATE OR REPLACE TRIGGER "tr_update_passage_questions_count" BEFORE INSERT OR UPDATE ON "public"."passages" FOR EACH ROW EXECUTE FUNCTION "public"."update_passage_questions_count"();



CREATE OR REPLACE TRIGGER "trigger_update_skill_proficiency" AFTER INSERT OR UPDATE ON "public"."test_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_skill_proficiency_from_test"();



CREATE OR REPLACE TRIGGER "trigger_update_skill_proficiency_from_activity" AFTER UPDATE ON "public"."learning_path_activities" FOR EACH ROW EXECUTE FUNCTION "public"."update_skill_proficiency_from_activity"();



ALTER TABLE ONLY "public"."ai_api_usage"
    ADD CONSTRAINT "ai_api_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_data"
    ADD CONSTRAINT "analytics_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."billing_history"
    ADD CONSTRAINT "billing_history_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "public"."users"("auth_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."billing_history"
    ADD CONSTRAINT "billing_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_history"
    ADD CONSTRAINT "consent_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_focus"
    ADD CONSTRAINT "daily_focus_primary_activity_id_fkey" FOREIGN KEY ("primary_activity_id") REFERENCES "public"."learning_path_activities"("id");



ALTER TABLE ONLY "public"."daily_focus"
    ADD CONSTRAINT "daily_focus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_path_activities"
    ADD CONSTRAINT "learning_path_activities_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_paths"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_path_activities"
    ADD CONSTRAINT "learning_path_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_paths"
    ADD CONSTRAINT "learning_paths_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."payment_requests"
    ADD CONSTRAINT "payment_requests_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "public"."users"("auth_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "public"."passages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_reward_tiers"
    ADD CONSTRAINT "referral_reward_tiers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."skill_proficiency"
    ADD CONSTRAINT "skill_proficiency_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_health_logs"
    ADD CONSTRAINT "system_health_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."test_sessions"
    ADD CONSTRAINT "test_sessions_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "public"."passages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_sessions"
    ADD CONSTRAINT "test_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tier_rate_limits"
    ADD CONSTRAINT "tier_rate_limits_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_points"
    ADD CONSTRAINT "user_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_referral_rewards"
    ADD CONSTRAINT "user_referral_rewards_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "public"."referral_reward_tiers"("id");



ALTER TABLE ONLY "public"."user_referral_rewards"
    ADD CONSTRAINT "user_referral_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_referrals"
    ADD CONSTRAINT "user_referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_referrals"
    ADD CONSTRAINT "user_referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."vocabulary_items"
    ADD CONSTRAINT "vocabulary_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."vocabulary_items"
    ADD CONSTRAINT "vocabulary_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete referral tiers" ON "public"."referral_reward_tiers" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can insert referral tiers" ON "public"."referral_reward_tiers" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can read system logs" ON "public"."system_health_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update referral tiers" ON "public"."referral_reward_tiers" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("users"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Anyone can insert system logs" ON "public"."system_health_logs" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" IS NULL) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Anyone can read referral tiers" ON "public"."referral_reward_tiers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read cache" ON "public"."ai_feedback_cache" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Create payment requests" ON "public"."payment_requests" FOR INSERT WITH CHECK (("auth_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Service role can manage events" ON "public"."stripe_events" TO "service_role" USING (true);



CREATE POLICY "Service role full access referrals" ON "public"."user_referrals" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access rewards" ON "public"."user_referral_rewards" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to daily_focus" ON "public"."daily_focus" TO "service_role" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role full access to learning_path_activities" ON "public"."learning_path_activities" TO "service_role" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role full access to skill_proficiency" ON "public"."skill_proficiency" TO "service_role" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role manages feedback cache" ON "public"."ai_feedback_cache" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Update payment requests" ON "public"."payment_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Users and admins can read referrals" ON "public"."user_referrals" FOR SELECT TO "authenticated" USING ((("referrer_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_id" = ( SELECT "auth"."uid"() AS "uid")))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("users"."role" = 'admin'::"text"))))));



CREATE POLICY "Users and admins view consent history" ON "public"."consent_history" FOR SELECT USING ((("user_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_id" = ( SELECT "auth"."uid"() AS "uid")))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("users"."role" = 'admin'::"text"))))));



CREATE POLICY "Users can insert own consent history" ON "public"."consent_history" FOR INSERT WITH CHECK (("user_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can insert own daily focus" ON "public"."daily_focus" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "users"."auth_id"
   FROM "public"."users"
  WHERE ("users"."id" = "daily_focus"."user_id"))));



CREATE POLICY "Users can insert own learning path activities" ON "public"."learning_path_activities" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "users"."auth_id"
   FROM "public"."users"
  WHERE ("users"."id" = "learning_path_activities"."user_id"))));



CREATE POLICY "Users can insert own skill proficiency" ON "public"."skill_proficiency" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "users"."auth_id"
   FROM "public"."users"
  WHERE ("users"."id" = "skill_proficiency"."user_id"))));



CREATE POLICY "Users can read own rewards" ON "public"."user_referral_rewards" FOR SELECT TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update own daily focus" ON "public"."daily_focus" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "users"."auth_id"
   FROM "public"."users"
  WHERE ("users"."id" = "daily_focus"."user_id"))));



CREATE POLICY "Users can update own learning path activities" ON "public"."learning_path_activities" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "users"."auth_id"
   FROM "public"."users"
  WHERE ("users"."id" = "learning_path_activities"."user_id"))));



CREATE POLICY "Users can update own skill proficiency" ON "public"."skill_proficiency" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "users"."auth_id"
   FROM "public"."users"
  WHERE ("users"."id" = "skill_proficiency"."user_id"))));



CREATE POLICY "Users can view own billing history" ON "public"."billing_history" FOR SELECT TO "authenticated" USING (("auth_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own daily focus" ON "public"."daily_focus" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "users"."auth_id"
   FROM "public"."users"
  WHERE ("users"."id" = "daily_focus"."user_id"))));



CREATE POLICY "Users can view own learning path activities" ON "public"."learning_path_activities" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "users"."auth_id"
   FROM "public"."users"
  WHERE ("users"."id" = "learning_path_activities"."user_id"))));



CREATE POLICY "Users can view own skill proficiency" ON "public"."skill_proficiency" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "users"."auth_id"
   FROM "public"."users"
  WHERE ("users"."id" = "skill_proficiency"."user_id"))));



CREATE POLICY "View payment requests" ON "public"."payment_requests" FOR SELECT USING ((("auth_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("users"."role" = 'admin'::"text"))))));



ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "achievements_admin_delete" ON "public"."achievements" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "achievements_admin_insert" ON "public"."achievements" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "achievements_admin_update" ON "public"."achievements" FOR UPDATE TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "achievements_all_policy" ON "public"."user_achievements" TO "authenticated" USING ((("user_id" = ( SELECT "public"."get_my_public_user_id"() AS "get_my_public_user_id")) OR "public"."is_admin"()));



CREATE POLICY "achievements_select_policy" ON "public"."achievements" FOR SELECT USING (true);



ALTER TABLE "public"."ai_api_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_feedback_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_feedback_cache_insert" ON "public"."ai_feedback_cache" FOR INSERT TO "authenticated" WITH CHECK ((("input_hash" IS NOT NULL) AND ("input_hash" <> ''::"text")));



CREATE POLICY "analytics_all_policy" ON "public"."analytics_data" TO "authenticated" USING ((("user_id" = ( SELECT "public"."get_my_public_user_id"() AS "get_my_public_user_id")) OR "public"."is_admin"()));



ALTER TABLE "public"."analytics_data" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "api_usage_delete_policy" ON "public"."ai_api_usage" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "api_usage_modify_policy" ON "public"."ai_api_usage" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "api_usage_select_policy" ON "public"."ai_api_usage" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"()));



CREATE POLICY "api_usage_update_policy" ON "public"."ai_api_usage" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."billing_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consent_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_focus" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."learning_path_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."learning_paths" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_admin_delete" ON "public"."notifications" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "notifications_admin_insert" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "notifications_admin_update" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "notifications_select_policy" ON "public"."notifications" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."passages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "passages_delete_policy" ON "public"."passages" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "passages_insert_policy" ON "public"."passages" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "passages_select_policy" ON "public"."passages" FOR SELECT TO "authenticated" USING ((("is_active" = true) OR "public"."is_admin"()));



CREATE POLICY "passages_update_policy" ON "public"."passages" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "paths_all_policy" ON "public"."learning_paths" TO "authenticated" USING ((("user_id" = ( SELECT "public"."get_my_public_user_id"() AS "get_my_public_user_id")) OR "public"."is_admin"()));



ALTER TABLE "public"."payment_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "points_all_policy" ON "public"."user_points" TO "authenticated" USING ((("user_id" = ( SELECT "public"."get_my_public_user_id"() AS "get_my_public_user_id")) OR "public"."is_admin"()));



ALTER TABLE "public"."promo_codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "promo_codes_all_policy" ON "public"."promo_codes" TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "questions_delete_policy" ON "public"."questions" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "questions_insert_policy" ON "public"."questions" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "questions_select_policy" ON "public"."questions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "questions_update_policy" ON "public"."questions" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "rate_limits_delete_policy" ON "public"."tier_rate_limits" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "rate_limits_insert_policy" ON "public"."tier_rate_limits" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "rate_limits_select_policy" ON "public"."tier_rate_limits" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "rate_limits_update_policy" ON "public"."tier_rate_limits" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."referral_reward_tiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "resources_anon_read" ON "public"."resources" FOR SELECT TO "anon" USING (("is_published" = true));



CREATE POLICY "resources_delete_policy" ON "public"."resources" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "resources_insert_policy" ON "public"."resources" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "resources_select_policy" ON "public"."resources" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "resources_update_policy" ON "public"."resources" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "sessions_all_policy" ON "public"."test_sessions" TO "authenticated" USING ((("user_id" = ( SELECT "public"."get_my_public_user_id"() AS "get_my_public_user_id")) OR "public"."is_admin"()));



ALTER TABLE "public"."skill_proficiency" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_health_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "system_settings_admin_delete" ON "public"."system_settings" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "system_settings_admin_insert" ON "public"."system_settings" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "system_settings_admin_update" ON "public"."system_settings" FOR UPDATE TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "system_settings_select_policy" ON "public"."system_settings" FOR SELECT USING (true);



ALTER TABLE "public"."test_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tier_rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_referral_rewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_delete_policy" ON "public"."users" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "users_insert_policy" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK ((("auth_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"()));



CREATE POLICY "users_select_policy" ON "public"."users" FOR SELECT TO "authenticated" USING ((("auth_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"()));



CREATE POLICY "users_update_policy" ON "public"."users" FOR UPDATE TO "authenticated" USING ((("auth_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"()));



CREATE POLICY "vocab_all_policy" ON "public"."vocabulary_items" TO "authenticated" USING ((("user_id" = ( SELECT "public"."get_my_public_user_id"() AS "get_my_public_user_id")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"()));



ALTER TABLE "public"."vocabulary_items" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





























































































































































































GRANT ALL ON FUNCTION "public"."calculate_question_row_count"("p_type" "text", "p_question_number" integer, "p_gap_fill" "jsonb", "p_table_data" "jsonb", "p_matching_features" "jsonb", "p_matching_data" "jsonb", "p_map_labeling" "jsonb", "p_flowchart" "jsonb", "p_allow_multiple" boolean, "p_question_count" integer, "p_question_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_question_row_count"("p_type" "text", "p_question_number" integer, "p_gap_fill" "jsonb", "p_table_data" "jsonb", "p_matching_features" "jsonb", "p_matching_data" "jsonb", "p_map_labeling" "jsonb", "p_flowchart" "jsonb", "p_allow_multiple" boolean, "p_question_count" integer, "p_question_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_question_row_count"("p_type" "text", "p_question_number" integer, "p_gap_fill" "jsonb", "p_table_data" "jsonb", "p_matching_features" "jsonb", "p_matching_data" "jsonb", "p_map_labeling" "jsonb", "p_flowchart" "jsonb", "p_allow_multiple" boolean, "p_question_count" integer, "p_question_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_total_questions"("content_json" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_total_questions"("content_json" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_total_questions"("content_json" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_rate_limit"("p_user_id" "uuid", "p_tier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_rate_limit"("p_user_id" "uuid", "p_tier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_rate_limit"("p_user_id" "uuid", "p_tier" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_referral_rewards"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."claim_referral_rewards"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_referral_rewards"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_promo_discount"() TO "anon";
GRANT ALL ON FUNCTION "public"."clear_promo_discount"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_promo_discount"() TO "service_role";



GRANT ALL ON FUNCTION "public"."count_inactive_users"("days_inactive" integer, "subscription_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."count_inactive_users"("days_inactive" integer, "subscription_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_inactive_users"("days_inactive" integer, "subscription_filter" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_admin_user_complete"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_admin_user_complete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_admin_user_complete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_get_passages"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_get_passages"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_get_passages"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_question_count"("target_passage_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."debug_question_count"("target_passage_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_question_count"("target_passage_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_resource"("resource_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_resource"("resource_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_resource"("resource_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_vocab_item_v2"("item_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_vocab_item_v2"("item_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_vocab_item_v2"("item_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_vocabulary_item"("item_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_vocabulary_item"("item_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_vocabulary_item"("item_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."exec_sql"("sql" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."exec_sql"("sql" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."exec_sql"("sql" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."export_user_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."export_user_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."export_user_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_referral_code"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_referral_code"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_referral_code"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_dashboard_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_dashboard_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_dashboard_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ai_usage_aggs"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_ai_usage_aggs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ai_usage_aggs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ai_usage_stats_paginated"("p_page" integer, "p_page_size" integer, "p_sort_field" "text", "p_sort_dir" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ai_usage_stats_paginated"("p_page" integer, "p_page_size" integer, "p_sort_field" "text", "p_sort_dir" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ai_usage_stats_paginated"("p_page" integer, "p_page_size" integer, "p_sort_field" "text", "p_sort_dir" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cambridge_tests"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_cambridge_tests"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cambridge_tests"("p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_profile_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_profile_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_profile_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_due_vocabulary"("p_user_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_due_vocabulary"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_due_vocabulary"("p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inactive_users"("days_inactive" integer, "page_limit" integer, "page_offset" integer, "subscription_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_inactive_users"("days_inactive" integer, "page_limit" integer, "page_offset" integer, "subscription_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inactive_users"("days_inactive" integer, "page_limit" integer, "page_offset" integer, "subscription_filter" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_learning_path_data"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_learning_path_data"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_learning_path_data"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_public_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_public_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_public_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recent_sessions"("p_user_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recent_sessions"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_sessions"("p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_revenue_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_revenue_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_revenue_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_session_counts"("p_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_session_counts"("p_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_session_counts"("p_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_system_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_system_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_system_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_test_taken_counts"("type_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_test_taken_counts"("type_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_test_taken_counts"("type_filter" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tier_rate_limits"("p_tier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_tier_rate_limits"("p_tier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tier_rate_limits"("p_tier" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_daily_usage"("p_user_id" "uuid", "p_endpoint" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_daily_usage"("p_user_id" "uuid", "p_endpoint" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_daily_usage"("p_user_id" "uuid", "p_endpoint" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_latest_sessions"("p_user_id" "uuid", "p_test_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_latest_sessions"("p_user_id" "uuid", "p_test_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_latest_sessions"("p_user_id" "uuid", "p_test_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_monthly_usage"("p_user_id" "uuid", "p_endpoint" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_monthly_usage"("p_user_id" "uuid", "p_endpoint" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_monthly_usage"("p_user_id" "uuid", "p_endpoint" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_referral_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_referral_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_referral_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_weak_skills"("p_user_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_weak_skills"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_weak_skills"("p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vocabulary_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_vocabulary_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vocabulary_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_writing_session_with_task"("p_session_id" "uuid", "p_task_id" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_writing_session_with_task"("p_session_id" "uuid", "p_task_id" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_writing_session_with_task"("p_session_id" "uuid", "p_task_id" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_points"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_points"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_points"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_payment_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_payment_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_payment_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_stripe_checkout_completed"("p_event_id" "text", "p_auth_id" "uuid", "p_user_id" "uuid", "p_tier" "text", "p_interval" "text", "p_amount" numeric, "p_currency" "text", "p_session_id" "text", "p_subscription_id" "text", "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."handle_stripe_checkout_completed"("p_event_id" "text", "p_auth_id" "uuid", "p_user_id" "uuid", "p_tier" "text", "p_interval" "text", "p_amount" numeric, "p_currency" "text", "p_session_id" "text", "p_subscription_id" "text", "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_stripe_checkout_completed"("p_event_id" "text", "p_auth_id" "uuid", "p_user_id" "uuid", "p_tier" "text", "p_interval" "text", "p_amount" numeric, "p_currency" "text", "p_session_id" "text", "p_subscription_id" "text", "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_stripe_event"("p_event_id" "text", "p_event_type" "text", "p_auth_id" "uuid", "p_user_id" "uuid", "p_tier" "text", "p_interval" "text", "p_amount" numeric, "p_currency" "text", "p_transaction_id" "text", "p_subscription_id" "text", "p_end_date" timestamp with time zone, "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_stripe_event"("p_event_id" "text", "p_event_type" "text", "p_auth_id" "uuid", "p_user_id" "uuid", "p_tier" "text", "p_interval" "text", "p_amount" numeric, "p_currency" "text", "p_transaction_id" "text", "p_subscription_id" "text", "p_end_date" timestamp with time zone, "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_stripe_event"("p_event_id" "text", "p_event_type" "text", "p_auth_id" "uuid", "p_user_id" "uuid", "p_tier" "text", "p_interval" "text", "p_amount" numeric, "p_currency" "text", "p_transaction_id" "text", "p_subscription_id" "text", "p_end_date" timestamp with time zone, "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_resource_view"("resource_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_resource_view"("resource_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_resource_view"("resource_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_question"("p_passage_id" "uuid", "p_question_text" "text", "p_type" "text", "p_question_number" integer, "p_section" integer, "p_group_instructions" "text", "p_options" "jsonb", "p_correct_answer" "text", "p_gap_fill" "jsonb", "p_table_data" "jsonb", "p_flowchart" "jsonb", "p_map_labeling" "jsonb", "p_matching_features" "jsonb", "p_static_text" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_question"("p_passage_id" "uuid", "p_question_text" "text", "p_type" "text", "p_question_number" integer, "p_section" integer, "p_group_instructions" "text", "p_options" "jsonb", "p_correct_answer" "text", "p_gap_fill" "jsonb", "p_table_data" "jsonb", "p_flowchart" "jsonb", "p_map_labeling" "jsonb", "p_matching_features" "jsonb", "p_static_text" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_question"("p_passage_id" "uuid", "p_question_text" "text", "p_type" "text", "p_question_number" integer, "p_section" integer, "p_group_instructions" "text", "p_options" "jsonb", "p_correct_answer" "text", "p_gap_fill" "jsonb", "p_table_data" "jsonb", "p_flowchart" "jsonb", "p_map_labeling" "jsonb", "p_matching_features" "jsonb", "p_static_text" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_current_user_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_current_user_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_current_user_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_vocab_owner"("owner_id" "uuid", "creator_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_vocab_owner"("owner_id" "uuid", "creator_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_vocab_owner"("owner_id" "uuid", "creator_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."link_auth_user_to_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."link_auth_user_to_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."link_auth_user_to_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_referral"("p_new_user_id" "uuid", "p_referral_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_referral"("p_new_user_id" "uuid", "p_referral_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_referral"("p_new_user_id" "uuid", "p_referral_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."redeem_promo_code"("code_lookup" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."redeem_promo_code"("code_lookup" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."redeem_promo_code"("code_lookup" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."redeem_subscription_promo"("p_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."redeem_subscription_promo"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."redeem_subscription_promo"("p_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_passage_total_questions"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_passage_total_questions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_passage_total_questions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_passage_questions_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_passage_questions_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_passage_questions_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_resources_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_resources_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_resources_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_single_question_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_single_question_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_single_question_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_skill_proficiency_from_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_skill_proficiency_from_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_skill_proficiency_from_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_skill_proficiency_from_test"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_skill_proficiency_from_test"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_skill_proficiency_from_test"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_study_streak"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_study_streak"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_study_streak"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_consent"("p_consent_analytics" boolean, "p_consent_marketing" boolean, "p_consent_functional" boolean, "p_ccpa_do_not_sell" boolean, "p_ip_address" "text", "p_user_agent" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_consent"("p_consent_analytics" boolean, "p_consent_marketing" boolean, "p_consent_functional" boolean, "p_ccpa_do_not_sell" boolean, "p_ip_address" "text", "p_user_agent" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_consent"("p_consent_analytics" boolean, "p_consent_marketing" boolean, "p_consent_functional" boolean, "p_ccpa_do_not_sell" boolean, "p_ip_address" "text", "p_user_agent" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_last_active"("user_auth_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_last_active"("user_auth_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_last_active"("user_auth_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_user_profile"("p_auth_id" "uuid", "p_email" "text", "p_updates" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_user_profile"("p_auth_id" "uuid", "p_email" "text", "p_updates" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_user_profile"("p_auth_id" "uuid", "p_email" "text", "p_updates" "jsonb") TO "service_role";
























GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";



GRANT ALL ON TABLE "public"."ai_api_usage" TO "anon";
GRANT ALL ON TABLE "public"."ai_api_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_api_usage" TO "service_role";



GRANT ALL ON TABLE "public"."ai_feedback_cache" TO "anon";
GRANT ALL ON TABLE "public"."ai_feedback_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_feedback_cache" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_data" TO "anon";
GRANT ALL ON TABLE "public"."analytics_data" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_data" TO "service_role";



GRANT ALL ON TABLE "public"."billing_history" TO "anon";
GRANT ALL ON TABLE "public"."billing_history" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_history" TO "service_role";



GRANT ALL ON TABLE "public"."consent_history" TO "anon";
GRANT ALL ON TABLE "public"."consent_history" TO "authenticated";
GRANT ALL ON TABLE "public"."consent_history" TO "service_role";



GRANT ALL ON TABLE "public"."daily_focus" TO "anon";
GRANT ALL ON TABLE "public"."daily_focus" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_focus" TO "service_role";



GRANT ALL ON TABLE "public"."learning_path_activities" TO "anon";
GRANT ALL ON TABLE "public"."learning_path_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."learning_path_activities" TO "service_role";



GRANT ALL ON TABLE "public"."learning_paths" TO "anon";
GRANT ALL ON TABLE "public"."learning_paths" TO "authenticated";
GRANT ALL ON TABLE "public"."learning_paths" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."passages" TO "anon";
GRANT ALL ON TABLE "public"."passages" TO "authenticated";
GRANT ALL ON TABLE "public"."passages" TO "service_role";



GRANT ALL ON TABLE "public"."payment_requests" TO "anon";
GRANT ALL ON TABLE "public"."payment_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_requests" TO "service_role";



GRANT ALL ON TABLE "public"."promo_codes" TO "anon";
GRANT ALL ON TABLE "public"."promo_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_codes" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON TABLE "public"."referral_reward_tiers" TO "anon";
GRANT ALL ON TABLE "public"."referral_reward_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_reward_tiers" TO "service_role";



GRANT ALL ON TABLE "public"."resources" TO "anon";
GRANT ALL ON TABLE "public"."resources" TO "authenticated";
GRANT ALL ON TABLE "public"."resources" TO "service_role";



GRANT ALL ON TABLE "public"."skill_proficiency" TO "anon";
GRANT ALL ON TABLE "public"."skill_proficiency" TO "authenticated";
GRANT ALL ON TABLE "public"."skill_proficiency" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_events" TO "anon";
GRANT ALL ON TABLE "public"."stripe_events" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_events" TO "service_role";



GRANT ALL ON TABLE "public"."system_health_logs" TO "anon";
GRANT ALL ON TABLE "public"."system_health_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."system_health_logs" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."test_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."test_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."tier_rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."tier_rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."tier_rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."user_achievements" TO "anon";
GRANT ALL ON TABLE "public"."user_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."user_points" TO "anon";
GRANT ALL ON TABLE "public"."user_points" TO "authenticated";
GRANT ALL ON TABLE "public"."user_points" TO "service_role";



GRANT ALL ON TABLE "public"."user_referral_rewards" TO "anon";
GRANT ALL ON TABLE "public"."user_referral_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."user_referral_rewards" TO "service_role";



GRANT ALL ON TABLE "public"."user_referrals" TO "anon";
GRANT ALL ON TABLE "public"."user_referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."user_referrals" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT SELECT("subscription_end_date") ON TABLE "public"."users" TO "authenticated";



GRANT SELECT("cancel_at_period_end") ON TABLE "public"."users" TO "authenticated";



GRANT ALL ON TABLE "public"."vocabulary_items" TO "anon";
GRANT ALL ON TABLE "public"."vocabulary_items" TO "authenticated";
GRANT ALL ON TABLE "public"."vocabulary_items" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































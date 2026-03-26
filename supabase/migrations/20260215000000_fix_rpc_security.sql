-- ============================================================================
-- Migration: Fix RPC Security (P0) + SQL Performance (P1)
-- 
-- 1. Replaces p_user_id parameter with internal auth.uid() lookup
-- 2. Revokes anon EXECUTE grants on sensitive RPCs
-- 3. Pushes user_id filter inside UNION subqueries (perf)
-- 4. Replaces completed_at::date with timestamp range comparisons (perf)
-- 5. Adds composite index on learning_path_activities (perf)
-- ============================================================================

-- ============================================================================
-- 1. get_dashboard_stats – DROP old, CREATE new without p_user_id
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_dashboard_stats(uuid);

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id UUID;
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
    -- Resolve user from auth context
    SELECT id INTO v_user_id FROM public.users WHERE auth_id = auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated or user not found';
    END IF;

    -- Get basic stats from test sessions
    SELECT 
        COUNT(*),
        COALESCE(AVG(score), 0)
    INTO v_total_tests, v_avg_score
    FROM test_sessions 
    WHERE user_id = v_user_id 
      AND is_completed = true 
      AND score IS NOT NULL;

    -- Get today's stats (timestamp range instead of ::date cast)
    SELECT 
        COALESCE(SUM(duration), 0)::INTEGER,
        COUNT(*)::INTEGER
    INTO v_today_minutes, v_today_tests
    FROM (
        SELECT duration_minutes as duration FROM test_sessions 
        WHERE user_id = v_user_id AND is_completed = true 
          AND completed_at >= CURRENT_DATE AND completed_at < CURRENT_DATE + INTERVAL '1 day'
        UNION ALL
        SELECT estimated_minutes as duration FROM learning_path_activities 
        WHERE user_id = v_user_id AND is_completed = true 
          AND completed_at >= CURRENT_DATE AND completed_at < CURRENT_DATE + INTERVAL '1 day'
    ) today_combined;

    -- Calculate streak (consecutive days with activity)
    WITH daily_practice AS (
        SELECT DISTINCT practice_date
        FROM (
            SELECT completed_at::date as practice_date FROM test_sessions WHERE user_id = v_user_id AND is_completed = true
            UNION ALL
            SELECT completed_at::date as practice_date FROM learning_path_activities WHERE user_id = v_user_id AND is_completed = true
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
                SELECT completed_at::date as practice_date FROM test_sessions WHERE user_id = v_user_id AND is_completed = true
                UNION ALL
                SELECT completed_at::date as practice_date FROM learning_path_activities WHERE user_id = v_user_id AND is_completed = true
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
        WHERE user_id = v_user_id 
          AND is_completed = true 
          AND score IS NOT NULL
          AND test_type IS NOT NULL
        GROUP BY LOWER(test_type)
    ) module_stats;

    -- Weekly data (last 7 days) – filter pushed inside each UNION branch
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
            SELECT completed_at FROM test_sessions 
            WHERE user_id = v_user_id AND is_completed = true
              AND completed_at >= CURRENT_DATE - INTERVAL '6 days'
            UNION ALL
            SELECT completed_at FROM learning_path_activities 
            WHERE user_id = v_user_id AND is_completed = true
              AND completed_at >= CURRENT_DATE - INTERVAL '6 days'
        ) combined 
            ON combined.completed_at >= d.day_date 
            AND combined.completed_at < d.day_date + INTERVAL '1 day'
        GROUP BY d.day_date
    ) weekly;

    -- Daily activity (heatmap)
    SELECT json_object_agg(activity_date, total_count)
    INTO v_daily_activity
    FROM (
        SELECT 
            completed_at::date::text as activity_date,
            COUNT(*) as total_count
        FROM (
            SELECT completed_at FROM test_sessions WHERE user_id = v_user_id AND is_completed = true
            UNION ALL
            SELECT completed_at FROM learning_path_activities WHERE user_id = v_user_id AND is_completed = true
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

ALTER FUNCTION public.get_dashboard_stats() OWNER TO postgres;

-- ============================================================================
-- 2. get_recent_sessions – DROP old, CREATE new without p_user_id
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_recent_sessions(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_recent_sessions(p_limit integer DEFAULT 8)
RETURNS TABLE(
    id uuid, 
    passage_id uuid, 
    passage_title text, 
    test_type text, 
    score numeric, 
    completed_at timestamp with time zone, 
    duration_minutes integer
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT u.id INTO v_user_id FROM public.users u WHERE u.auth_id = auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated or user not found';
    END IF;

    RETURN QUERY
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
    WHERE ts.user_id = v_user_id 
      AND ts.is_completed = true 
      AND ts.score IS NOT NULL
    ORDER BY ts.completed_at DESC
    LIMIT p_limit;
END;
$$;

ALTER FUNCTION public.get_recent_sessions(integer) OWNER TO postgres;

-- ============================================================================
-- 3. get_learning_path_data – DROP old, CREATE new without p_user_id
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_learning_path_data(uuid);

CREATE OR REPLACE FUNCTION public.get_learning_path_data()
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id UUID;
    v_result JSON;
    v_path_record RECORD;
    v_activities JSON;
    v_module_averages JSON;
    v_module_trends JSON;
    v_skill_proficiencies JSON;
    v_sessions JSON;
    v_total_tests INTEGER;
BEGIN
    -- Resolve user from auth context
    SELECT id INTO v_user_id FROM public.users WHERE auth_id = auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated or user not found';
    END IF;

    -- 1. Get latest learning path
    SELECT id, path_data, activities_completed, created_at
    INTO v_path_record
    FROM learning_paths
    WHERE user_id = v_user_id
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
            ts.id,
            ts.test_type,
            ts.score,
            ts.completed_at,
            ROW_NUMBER() OVER (PARTITION BY ts.test_type ORDER BY ts.completed_at DESC) as rn
        FROM test_sessions ts
        WHERE ts.user_id = v_user_id
          AND ts.is_completed = true
          AND ts.score IS NOT NULL
        ORDER BY ts.completed_at DESC
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
    WHERE user_id = v_user_id AND is_completed = true;
    
    -- Get sessions for skill trend calculation (last 40)
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', s.id,
            'test_type', s.test_type,
            'score', s.score,
            'completed_at', s.completed_at
        )
    ), '[]'::json)
    INTO v_sessions
    FROM (
        SELECT ts.id, ts.test_type, ts.score, ts.completed_at
        FROM test_sessions ts
        WHERE ts.user_id = v_user_id AND ts.is_completed = true
        ORDER BY ts.completed_at DESC
        LIMIT 40
    ) s;
    
    -- 4. Get skill proficiencies (top 100 by lowest mastery)
    SELECT COALESCE(json_agg(
        json_build_object(
            'skill_code', sp.skill_code,
            'module', sp.module,
            'mastery_probability', sp.mastery_probability,
            'confidence_level', sp.confidence_level,
            'practice_count', sp.practice_count,
            'correct_count', sp.correct_count,
            'last_practiced_at', sp.last_practiced_at,
            'next_review_at', sp.next_review_at
        )
    ), '[]'::json)
    INTO v_skill_proficiencies
    FROM (
        SELECT *
        FROM public.skill_proficiency
        WHERE user_id = v_user_id
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

ALTER FUNCTION public.get_learning_path_data() OWNER TO postgres;

COMMENT ON FUNCTION public.get_learning_path_data() IS 'Combined RPC that fetches learning path, activities, stats, and skill proficiencies in a single call. Uses auth.uid() for security.';

-- ============================================================================
-- 4. get_due_vocabulary – DROP old, CREATE new without p_user_id
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_due_vocabulary(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_due_vocabulary(p_limit integer DEFAULT 20)
RETURNS TABLE(
    id uuid, 
    word text, 
    definition text, 
    example text, 
    mastery_level integer, 
    next_review_date timestamp with time zone, 
    last_reviewed timestamp with time zone, 
    source text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT u.id INTO v_user_id FROM public.users u WHERE u.auth_id = auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated or user not found';
    END IF;

    RETURN QUERY
    SELECT 
        vi.id,
        vi.word,
        vi.definition,
        vi.example,
        vi.mastery_level,
        vi.next_review_date,
        vi.last_reviewed,
        vi.source
    FROM public.vocabulary_items vi
    WHERE vi.user_id = v_user_id
      AND (vi.next_review_date IS NULL OR vi.next_review_date <= NOW())
    ORDER BY vi.next_review_date ASC NULLS FIRST
    LIMIT p_limit;
END;
$$;

ALTER FUNCTION public.get_due_vocabulary(integer) OWNER TO postgres;

-- ============================================================================
-- 5. Revoke anon grants, keep authenticated + service_role
-- ============================================================================

-- Revoke anon on the NEW signatures (no p_user_id)
REVOKE ALL ON FUNCTION public.get_dashboard_stats() FROM anon;
REVOKE ALL ON FUNCTION public.get_recent_sessions(integer) FROM anon;
REVOKE ALL ON FUNCTION public.get_learning_path_data() FROM anon;
REVOKE ALL ON FUNCTION public.get_due_vocabulary(integer) FROM anon;

-- Grant to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO service_role;

GRANT EXECUTE ON FUNCTION public.get_recent_sessions(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_sessions(integer) TO service_role;

GRANT EXECUTE ON FUNCTION public.get_learning_path_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_learning_path_data() TO service_role;

GRANT EXECUTE ON FUNCTION public.get_due_vocabulary(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_due_vocabulary(integer) TO service_role;

-- ============================================================================
-- 6. Composite index for performance (P1)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_lpa_user_completed 
ON public.learning_path_activities(user_id, is_completed, completed_at);

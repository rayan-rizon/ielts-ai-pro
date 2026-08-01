-- ============================================================================
-- Exclude walk-away sessions (opened, abandoned within minutes, scored 0) from
-- dashboard band averages and recent-session lists.
--
-- Mirrors the same fix already applied client-side in
-- src/features/analytics/hooks/analyticsCalculations.js (isAbandonedSession):
-- a session only counts as "abandoned" when ALL of the following hold —
--   - score = 0 (never touches a genuine low score)
--   - no correct answers recorded (content_data.correctAnswers/correct)
--   - a known duration under 5 minutes
-- Sessions with unknown duration are left alone rather than guessed at.
-- ============================================================================

-- 1. Best-known duration for a session, mirroring getKnownDurationSeconds().
CREATE OR REPLACE FUNCTION public.get_session_duration_seconds(
    p_test_type TEXT,
    p_actual_duration_seconds INTEGER,
    p_content_data JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_metric NUMERIC;
    v_benchmark_minutes INTEGER;
    v_remaining NUMERIC;
    v_elapsed NUMERIC;
BEGIN
    IF p_actual_duration_seconds IS NOT NULL
       AND p_actual_duration_seconds > 0
       AND p_actual_duration_seconds <= 14400 THEN
        RETURN p_actual_duration_seconds;
    END IF;

    v_metric := NULLIF(p_content_data #>> '{timeMetrics,totalTimeSpent}', '')::NUMERIC;
    IF v_metric IS NOT NULL AND v_metric > 0 AND v_metric <= 14400 THEN
        RETURN v_metric::INTEGER;
    END IF;

    v_benchmark_minutes := CASE LOWER(COALESCE(p_test_type, ''))
        WHEN 'reading' THEN 60
        WHEN 'writing' THEN 60
        WHEN 'listening' THEN 40
        WHEN 'speaking' THEN 15
        ELSE NULL
    END;
    v_remaining := NULLIF(p_content_data ->> 'time_remaining', '')::NUMERIC;
    IF v_benchmark_minutes IS NOT NULL AND v_remaining IS NOT NULL AND v_remaining >= 0 THEN
        v_elapsed := v_benchmark_minutes * 60 - v_remaining;
        IF v_elapsed > 0 AND v_elapsed <= 14400 THEN
            RETURN v_elapsed::INTEGER;
        END IF;
    END IF;

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    -- A malformed content_data value should never break an aggregate query.
    RETURN NULL;
END;
$$;

-- 2. A test the learner opened and walked away from, not a test they sat and
-- failed. See isAbandonedSession() in analyticsCalculations.js for the
-- rationale — this is the same predicate.
CREATE OR REPLACE FUNCTION public.is_abandoned_test_session(
    p_test_type TEXT,
    p_score NUMERIC,
    p_actual_duration_seconds INTEGER,
    p_content_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_correct NUMERIC;
    v_duration INTEGER;
BEGIN
    IF p_score IS NULL OR p_score <> 0 THEN
        RETURN FALSE;
    END IF;

    v_correct := NULLIF(COALESCE(p_content_data ->> 'correctAnswers', p_content_data ->> 'correct'), '')::NUMERIC;
    IF v_correct IS NOT NULL AND v_correct > 0 THEN
        RETURN FALSE;
    END IF;

    v_duration := public.get_session_duration_seconds(p_test_type, p_actual_duration_seconds, p_content_data);
    IF v_duration IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN v_duration < 300;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- 3. get_dashboard_stats — averages now exclude abandoned sessions. totalTests
-- stays a raw activity count (unchanged meaning); two new keys report how many
-- of the scored sessions were excluded, so the UI can be transparent about it.
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
    v_measured_tests INTEGER;
    v_abandoned_tests INTEGER;
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
        COUNT(*) FILTER (WHERE NOT public.is_abandoned_test_session(test_type, score, actual_duration_seconds, content_data)),
        COUNT(*) FILTER (WHERE public.is_abandoned_test_session(test_type, score, actual_duration_seconds, content_data)),
        COALESCE(AVG(score) FILTER (WHERE NOT public.is_abandoned_test_session(test_type, score, actual_duration_seconds, content_data)), 0)
    INTO v_total_tests, v_measured_tests, v_abandoned_tests, v_avg_score
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

    -- Module averages — abandoned sessions excluded (see is_abandoned_test_session)
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
          AND NOT public.is_abandoned_test_session(test_type, score, actual_duration_seconds, content_data)
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
        'measuredTests', v_measured_tests,
        'abandonedTests', v_abandoned_tests,
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

-- 4. get_recent_sessions — walk-aways are no longer meaningful "recent
-- results" to review, so they are filtered out of the list itself. This also
-- fixes the dashboard's Band Trajectory chart and per-module "latest score",
-- both of which read straight from this RPC's output.
CREATE OR REPLACE FUNCTION public.get_recent_sessions(p_limit integer DEFAULT 8)
RETURNS TABLE(id uuid, passage_id uuid, passage_title text, test_type text, score numeric, completed_at timestamp with time zone, duration_minutes integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
      AND NOT public.is_abandoned_test_session(ts.test_type, ts.score, ts.actual_duration_seconds, ts.content_data)
    ORDER BY ts.completed_at DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_session_duration_seconds(TEXT, INTEGER, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_abandoned_test_session(TEXT, NUMERIC, INTEGER, JSONB) TO authenticated, service_role;

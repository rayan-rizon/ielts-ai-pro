-- Emergency rollback: restores the two live definitions captured before release.
-- Keep the private registry and additive admin RPC so newer clients remain compatible.
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_timezone text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID;
    v_saved_timezone TEXT;
    v_timezone TEXT := 'UTC';
    v_local_day DATE;
    v_day_start TIMESTAMPTZ;
    v_day_end TIMESTAMPTZ;
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
    SELECT u.id, NULLIF(u.study_availability ->> 'timezone', '')
    INTO v_user_id, v_saved_timezone
    FROM public.users u
    WHERE u.auth_id = auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated or user not found';
    END IF;

    IF NULLIF(p_timezone, '') IS NOT NULL
       AND EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = p_timezone) THEN
        v_timezone := p_timezone;
    ELSIF v_saved_timezone IS NOT NULL
       AND EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = v_saved_timezone) THEN
        v_timezone := v_saved_timezone;
    END IF;

    v_local_day := (now() AT TIME ZONE v_timezone)::date;
    v_day_start := v_local_day::timestamp AT TIME ZONE v_timezone;
    v_day_end := (v_local_day + 1)::timestamp AT TIME ZONE v_timezone;

    SELECT
        COUNT(*),
        COUNT(*) FILTER (
            WHERE NOT public.is_abandoned_test_session(
                test_type, score, actual_duration_seconds, content_data
            )
        ),
        COUNT(*) FILTER (
            WHERE public.is_abandoned_test_session(
                test_type, score, actual_duration_seconds, content_data
            )
        ),
        COALESCE(AVG(score) FILTER (
            WHERE NOT public.is_abandoned_test_session(
                test_type, score, actual_duration_seconds, content_data
            )
        ), 0)
    INTO v_total_tests, v_measured_tests, v_abandoned_tests, v_avg_score
    FROM public.test_sessions
    WHERE user_id = v_user_id
      AND is_completed = true
      AND score IS NOT NULL;

    -- Only measured elapsed time contributes minutes. A completed test with no
    -- trustworthy timer still counts as a test but contributes no invented time.
    SELECT
        COALESCE(ROUND(SUM(duration_seconds)::numeric / 60.0), 0)::integer,
        COUNT(*)::integer
    INTO v_today_minutes, v_today_tests
    FROM (
        SELECT public.get_session_duration_seconds(
            ts.test_type,
            ts.actual_duration_seconds,
            ts.content_data
        ) AS duration_seconds
        FROM public.test_sessions ts
        WHERE ts.user_id = v_user_id
          AND ts.is_completed = true
          AND ts.completed_at >= v_day_start
          AND ts.completed_at < v_day_end
          AND NOT public.is_abandoned_test_session(
              ts.test_type, ts.score, ts.actual_duration_seconds, ts.content_data
          )
    ) today_tests;

    -- With dates ordered newest-first, adding the row number yields one stable
    -- key for consecutive dates (subtracting it splits every day apart).
    WITH daily_practice AS (
        SELECT DISTINCT practice_date
        FROM (
            SELECT (ts.completed_at AT TIME ZONE v_timezone)::date AS practice_date
            FROM public.test_sessions ts
            WHERE ts.user_id = v_user_id
              AND ts.is_completed = true
              AND NOT public.is_abandoned_test_session(
                  ts.test_type, ts.score, ts.actual_duration_seconds, ts.content_data
              )
            UNION ALL
            SELECT (lpa.completed_at AT TIME ZONE v_timezone)::date AS practice_date
            FROM public.learning_path_activities lpa
            WHERE lpa.user_id = v_user_id
              AND lpa.is_completed = true
              AND lpa.completion_source IS DISTINCT FROM 'test_session'
        ) combined
        WHERE practice_date >= v_local_day - 60
    ),
    streak_calc AS (
        SELECT
            practice_date,
            practice_date + (ROW_NUMBER() OVER (ORDER BY practice_date DESC))::integer AS grp
        FROM daily_practice
    ),
    anchor AS (
        SELECT MAX(practice_date) AS practice_date
        FROM daily_practice
        WHERE practice_date IN (v_local_day, v_local_day - 1)
    )
    SELECT COALESCE(COUNT(*), 0)::integer
    INTO v_streak
    FROM streak_calc
    WHERE grp = (
        SELECT sc.grp
        FROM streak_calc sc
        JOIN anchor a USING (practice_date)
        LIMIT 1
    );

    SELECT json_object_agg(test_type, avg_score)
    INTO v_module_averages
    FROM (
        SELECT LOWER(test_type) AS test_type, AVG(score) AS avg_score
        FROM public.test_sessions
        WHERE user_id = v_user_id
          AND is_completed = true
          AND score IS NOT NULL
          AND test_type IS NOT NULL
          AND NOT public.is_abandoned_test_session(
              test_type, score, actual_duration_seconds, content_data
          )
        GROUP BY LOWER(test_type)
    ) module_stats;

    -- This metric is labelled tests in the UI, so learning-path activities do
    -- not belong in its count.
    SELECT json_agg(day_data ORDER BY day_date)
    INTO v_weekly_data
    FROM (
        SELECT
            d.day_date,
            json_build_object(
                'day', TO_CHAR(d.day_date, 'Dy'),
                'tests', COUNT(ts.id)
            ) AS day_data
        FROM (
            SELECT (v_local_day - offsets.days_ago)::date AS day_date
            FROM generate_series(0, 6) AS offsets(days_ago)
        ) d
        LEFT JOIN public.test_sessions ts
          ON ts.user_id = v_user_id
         AND ts.is_completed = true
         AND ts.completed_at >= (d.day_date::timestamp AT TIME ZONE v_timezone)
         AND ts.completed_at < ((d.day_date + 1)::timestamp AT TIME ZONE v_timezone)
         AND NOT public.is_abandoned_test_session(
             ts.test_type, ts.score, ts.actual_duration_seconds, ts.content_data
         )
        GROUP BY d.day_date
    ) weekly;

    -- The heatmap remains total practice activity (tests plus learning-path
    -- tasks), dated in the learner's timezone.
    SELECT json_object_agg(activity_date, total_count)
    INTO v_daily_activity
    FROM (
        SELECT practice_date::text AS activity_date, COUNT(*) AS total_count
        FROM (
            SELECT (ts.completed_at AT TIME ZONE v_timezone)::date AS practice_date
            FROM public.test_sessions ts
            WHERE ts.user_id = v_user_id
              AND ts.is_completed = true
              AND NOT public.is_abandoned_test_session(
                  ts.test_type, ts.score, ts.actual_duration_seconds, ts.content_data
              )
            UNION ALL
            SELECT (lpa.completed_at AT TIME ZONE v_timezone)::date AS practice_date
            FROM public.learning_path_activities lpa
            WHERE lpa.user_id = v_user_id
              AND lpa.is_completed = true
              AND lpa.completion_source IS DISTINCT FROM 'test_session'
        ) combined
        WHERE practice_date >= v_local_day - 89
        GROUP BY practice_date
    ) activity;

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
        'dailyActivity', COALESCE(v_daily_activity, '{}'::json),
        'timezone', v_timezone
    );

    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_last_active(user_auth_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_now timestamptz := clock_timestamp();
    v_user_id uuid;
BEGIN
    IF auth.uid() IS NULL OR user_auth_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
    END IF;

    UPDATE public.users
    SET last_active = v_now,
        updated_at = v_now
    WHERE auth_id = auth.uid()
    RETURNING id INTO v_user_id;

    -- A session can briefly exist before its public profile is available.
    -- Match the old no-op behavior instead of breaking authentication.
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

END;
$function$
;

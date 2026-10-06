-- ============================================================================
-- Restore the learner dashboard and Grammar Lab functions the baseline expects.
--
-- 20260801143759_fix_learner_dashboard_analytics_accuracy and
-- 20260728150456_grammar_lab_content_v2 are recorded in the squashed baseline,
-- but production still ran the definitions they replaced:
--
--   * get_dashboard_stats grouped days in UTC, and its streak grouped
--     newest-first dates with `date - row_number`, which splits every day apart.
--   * get_recent_sessions returned no elapsed seconds, so the attempt log never
--     showed minutes.
--   * grammar_normalize_answer did not fold curly apostrophes or long dashes,
--     so a phone keyboard's "don’t" would not match an accepted "don't".
--
-- On top of the restored dashboard definitions:
--   * day boundaries use the timezone the browser reports (the same days the
--     heatmap and weekday labels are drawn in), then the saved study timezone,
--     then UTC;
--   * tests opened and walked away from (is_abandoned_test_session) no longer
--     count as practice anywhere on the dashboard, matching the band average,
--     the attempt log and Analytics;
--   * a learning-path task completed by a test is not counted a second time
--     next to that test.
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_dashboard_stats();
DROP FUNCTION IF EXISTS public.get_dashboard_stats(text);

CREATE FUNCTION public.get_dashboard_stats(p_timezone text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

ALTER FUNCTION public.get_dashboard_stats(text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_dashboard_stats(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(text) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.get_recent_sessions(integer);

CREATE FUNCTION public.get_recent_sessions(p_limit integer DEFAULT 8)
RETURNS TABLE(
    id uuid,
    passage_id uuid,
    passage_title text,
    test_type text,
    test_mode text,
    score numeric,
    completed_at timestamptz,
    duration_seconds integer,
    duration_minutes integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT u.id INTO v_user_id
    FROM public.users u
    WHERE u.auth_id = auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated or user not found';
    END IF;

    RETURN QUERY
    SELECT
        ts.id,
        ts.passage_id,
        p.title AS passage_title,
        ts.test_type,
        ts.test_mode,
        ts.score,
        ts.completed_at,
        public.get_session_duration_seconds(
            ts.test_type,
            ts.actual_duration_seconds,
            ts.content_data
        ) AS duration_seconds,
        ts.duration_minutes
    FROM public.test_sessions ts
    LEFT JOIN public.passages p ON p.id = ts.passage_id
    WHERE ts.user_id = v_user_id
      AND ts.is_completed = true
      AND ts.score IS NOT NULL
      AND NOT public.is_abandoned_test_session(
          ts.test_type, ts.score, ts.actual_duration_seconds, ts.content_data
      )
    ORDER BY ts.completed_at DESC
    LIMIT GREATEST(0, LEAST(COALESCE(p_limit, 8), 50));
END;
$$;

ALTER FUNCTION public.get_recent_sessions(integer) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_recent_sessions(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_recent_sessions(integer) TO authenticated, service_role;

create or replace function public.grammar_normalize_answer(p_answer jsonb)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select trim(
    regexp_replace(
      regexp_replace(
        lower(
          replace(
            replace(
              replace(
                replace(coalesce(p_answer #>> '{}', ''), '’', ''''),
                '‘',
                ''''
              ),
              '–',
              '-'
            ),
            '—',
            '-'
          )
        ),
        '[[:space:]]+',
        ' ',
        'g'
      ),
      '[[:space:][:punct:]]+$',
      '',
      'g'
    )
  );
$$;

revoke all on function public.grammar_normalize_answer(jsonb) from public, anon, authenticated;

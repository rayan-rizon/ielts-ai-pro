-- Country is a first-touch, IP-derived signup attribute. These reporting
-- contracts expose only aggregates (plus the country on the existing recent
-- signup rows) and keep the same admin-only boundary as the rest of the admin
-- analytics surface. "Unknown" remains explicit so campaign decisions never
-- mistake partial geo coverage for a complete market picture.

CREATE OR REPLACE FUNCTION public.get_admin_overview_with_signup_sources(p_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_overview jsonb;
    v_recent jsonb;
    v_markets jsonb;
    v_days integer;
    v_since timestamptz;
    v_geo_total bigint;
    v_geo_identified bigint;
    v_geo_countries bigint;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;

    v_days := LEAST(GREATEST(COALESCE(p_days, 7), 1), 90);
    v_since := (date_trunc('day', now() AT TIME ZONE 'Asia/Dhaka')
        - make_interval(days => v_days - 1)) AT TIME ZONE 'Asia/Dhaka';
    v_overview := public.get_admin_overview(v_days);

    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC)
    INTO v_recent
    FROM (
        SELECT id, full_name, email, created_at, subscription_tier,
            onboarding_completed,
            CASE
                WHEN upper(trim(country)) ~ '^[A-Z]{2}$'
                    AND upper(trim(country)) NOT IN ('XX', 'T1')
                    THEN upper(trim(country))
                ELSE 'unknown'
            END AS country,
            COALESCE(NULLIF(signup_channel, ''), 'unknown') AS signup_channel,
            signup_utm_source
        FROM public.users
        WHERE role IS DISTINCT FROM 'admin'
        ORDER BY created_at DESC
        LIMIT 8
    ) t;

    WITH cohort AS (
        SELECT
            u.id,
            CASE
                WHEN upper(trim(u.country)) ~ '^[A-Z]{2}$'
                    AND upper(trim(u.country)) NOT IN ('XX', 'T1')
                    THEN upper(trim(u.country))
                ELSE 'unknown'
            END AS country,
            u.onboarding_completed,
            u.subscription_tier IN ('pro', 'premium') AS is_paying,
            u.last_active >= v_since AS active_in_window,
            EXISTS (
                SELECT 1 FROM public.test_sessions ts WHERE ts.user_id = u.id
            ) AS has_practiced
        FROM public.users u
        WHERE u.role IS DISTINCT FROM 'admin'
          AND u.created_at >= v_since
    ), grouped AS (
        SELECT country,
            count(*) AS signups,
            count(*) FILTER (WHERE onboarding_completed) AS onboarded,
            count(*) FILTER (WHERE has_practiced) AS practiced,
            count(*) FILTER (WHERE is_paying) AS paying,
            count(*) FILTER (WHERE active_in_window) AS active
        FROM cohort
        GROUP BY country
    )
    SELECT jsonb_agg(jsonb_build_object(
        'country', country,
        'signups', signups,
        'share', CASE WHEN total_signups > 0
            THEN round(100.0 * signups / total_signups, 1) ELSE 0 END,
        'onboarded', onboarded,
        'practiced', practiced,
        'paying', paying,
        'active', active,
        'activationRate', CASE WHEN signups > 0
            THEN round(100.0 * onboarded / signups, 1) ELSE 0 END,
        'practiceRate', CASE WHEN signups > 0
            THEN round(100.0 * practiced / signups, 1) ELSE 0 END,
        'paidRate', CASE WHEN signups > 0
            THEN round(100.0 * paying / signups, 1) ELSE 0 END
    ) ORDER BY signups DESC, country)
    INTO v_markets
    FROM (
        SELECT grouped.*, sum(signups) OVER () AS total_signups
        FROM grouped
        ORDER BY signups DESC, country
        LIMIT 8
    ) ranked;

    SELECT
        count(*),
        count(*) FILTER (WHERE upper(trim(country)) ~ '^[A-Z]{2}$'
            AND upper(trim(country)) NOT IN ('XX', 'T1')),
        count(DISTINCT upper(trim(country))) FILTER (
            WHERE upper(trim(country)) ~ '^[A-Z]{2}$'
              AND upper(trim(country)) NOT IN ('XX', 'T1'))
    INTO v_geo_total, v_geo_identified, v_geo_countries
    FROM public.users
    WHERE role IS DISTINCT FROM 'admin'
      AND created_at >= v_since;

    RETURN v_overview || jsonb_build_object(
        'recentSignups', COALESCE(v_recent, '[]'::jsonb),
        'markets', COALESCE(v_markets, '[]'::jsonb),
        'geoSummary', jsonb_build_object(
            'identifiedSignups', v_geo_identified,
            'unknownSignups', v_geo_total - v_geo_identified,
            'coverageRate', CASE WHEN v_geo_total > 0
                THEN round(100.0 * v_geo_identified / v_geo_total, 1) ELSE 0 END,
            'countries', v_geo_countries,
            'basis', 'first_touch_signup_country'));
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_overview_with_signup_sources(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_overview_with_signup_sources(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_analytics_intelligence(p_range text DEFAULT '30d')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_days integer;
    v_since timestamptz;
    v_total_users bigint;
    v_new_users bigint;
    v_active_users bigint;
    v_testers bigint;
    v_sessions bigint;
    v_completed bigint;
    v_repeat_testers bigint;
    v_paying bigint;
    v_onboarded bigint;
    v_started bigint;
    v_new_user_paid bigint;
    v_geo_identified bigint;
    v_geo_countries bigint;
    v_trend jsonb;
    v_recent jsonb;
    v_geography jsonb;
    v_channels jsonb;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;

    v_days := CASE lower(COALESCE(p_range, '30d'))
        WHEN '90d' THEN 90 WHEN '1y' THEN 365 ELSE 30 END;
    v_since := (date_trunc('day', now() AT TIME ZONE 'Asia/Dhaka')
        - make_interval(days => v_days - 1)) AT TIME ZONE 'Asia/Dhaka';

    SELECT count(*),
        count(*) FILTER (WHERE created_at >= v_since),
        count(*) FILTER (WHERE last_active >= v_since),
        count(*) FILTER (WHERE subscription_tier IN ('pro', 'premium'))
    INTO v_total_users, v_new_users, v_active_users, v_paying
    FROM public.users
    WHERE role IS DISTINCT FROM 'admin';

    SELECT count(DISTINCT ts.user_id), count(*),
        count(*) FILTER (WHERE ts.is_completed)
    INTO v_testers, v_sessions, v_completed
    FROM public.test_sessions ts
    JOIN public.users u ON u.id = ts.user_id
    WHERE u.role IS DISTINCT FROM 'admin'
      AND ts.created_at >= v_since;

    SELECT count(*)
    INTO v_repeat_testers
    FROM (
        SELECT ts.user_id
        FROM public.test_sessions ts
        JOIN public.users u ON u.id = ts.user_id
        WHERE u.role IS DISTINCT FROM 'admin'
          AND ts.created_at >= v_since
        GROUP BY ts.user_id
        HAVING count(*) >= 2
    ) repeaters;

    SELECT count(*) FILTER (WHERE u.onboarding_completed),
        count(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM public.test_sessions ts WHERE ts.user_id = u.id)),
        count(*) FILTER (WHERE u.subscription_tier IN ('pro', 'premium')),
        count(*) FILTER (WHERE upper(trim(u.country)) ~ '^[A-Z]{2}$'
            AND upper(trim(u.country)) NOT IN ('XX', 'T1')),
        count(DISTINCT upper(trim(u.country))) FILTER (
            WHERE upper(trim(u.country)) ~ '^[A-Z]{2}$'
              AND upper(trim(u.country)) NOT IN ('XX', 'T1'))
    INTO v_onboarded, v_started, v_new_user_paid, v_geo_identified, v_geo_countries
    FROM public.users u
    WHERE u.role IS DISTINCT FROM 'admin'
      AND u.created_at >= v_since;

    WITH spine AS (
        SELECT generate_series((v_since AT TIME ZONE 'Asia/Dhaka')::date,
            (now() AT TIME ZONE 'Asia/Dhaka')::date, interval '1 day')::date AS day
    ), signups AS (
        SELECT (created_at AT TIME ZONE 'Asia/Dhaka')::date AS day, count(*) AS n
        FROM public.users
        WHERE role IS DISTINCT FROM 'admin' AND created_at >= v_since
        GROUP BY 1
    ), practice AS (
        SELECT (ts.created_at AT TIME ZONE 'Asia/Dhaka')::date AS day,
            count(DISTINCT ts.user_id) AS users,
            count(*) FILTER (WHERE ts.is_completed) AS completions
        FROM public.test_sessions ts
        JOIN public.users u ON u.id = ts.user_id
        WHERE u.role IS DISTINCT FROM 'admin' AND ts.created_at >= v_since
        GROUP BY 1
    )
    SELECT jsonb_agg(jsonb_build_object(
        'date', to_char(spine.day, CASE WHEN v_days = 365 THEN 'Mon YY' ELSE 'Mon DD' END),
        'signups', COALESCE(signups.n, 0),
        'testers', COALESCE(practice.users, 0),
        'completions', COALESCE(practice.completions, 0)) ORDER BY spine.day)
    INTO v_trend
    FROM spine
    LEFT JOIN signups USING (day)
    LEFT JOIN practice USING (day);

    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC)
    INTO v_recent
    FROM (
        SELECT id, full_name, email, created_at, subscription_tier,
            onboarding_completed,
            CASE
                WHEN upper(trim(country)) ~ '^[A-Z]{2}$'
                    AND upper(trim(country)) NOT IN ('XX', 'T1')
                    THEN upper(trim(country))
                ELSE 'unknown'
            END AS country,
            COALESCE(NULLIF(signup_channel, ''), 'unknown') AS signup_channel,
            signup_utm_source
        FROM public.users
        WHERE role IS DISTINCT FROM 'admin'
        ORDER BY created_at DESC
        LIMIT 8
    ) t;

    WITH cohort AS (
        SELECT
            u.id,
            CASE
                WHEN upper(trim(u.country)) ~ '^[A-Z]{2}$'
                    AND upper(trim(u.country)) NOT IN ('XX', 'T1')
                    THEN upper(trim(u.country))
                ELSE 'unknown'
            END AS country,
            COALESCE(NULLIF(u.signup_channel, ''), 'unknown') AS channel,
            u.onboarding_completed,
            u.subscription_tier IN ('pro', 'premium') AS is_paying,
            u.last_active >= v_since AS active_in_window,
            EXISTS (
                SELECT 1 FROM public.test_sessions ts WHERE ts.user_id = u.id
            ) AS has_practiced
        FROM public.users u
        WHERE u.role IS DISTINCT FROM 'admin'
          AND u.created_at >= v_since
    ), grouped AS (
        SELECT country,
            count(*) AS signups,
            count(*) FILTER (WHERE onboarding_completed) AS onboarded,
            count(*) FILTER (WHERE has_practiced) AS practiced,
            count(*) FILTER (WHERE is_paying) AS paying,
            count(*) FILTER (WHERE active_in_window) AS active
        FROM cohort
        GROUP BY country
    )
    SELECT jsonb_agg(jsonb_build_object(
        'country', country,
        'signups', signups,
        'share', CASE WHEN total_signups > 0
            THEN round(100.0 * signups / total_signups, 1) ELSE 0 END,
        'onboarded', onboarded,
        'practiced', practiced,
        'paying', paying,
        'active', active,
        'activationRate', CASE WHEN signups > 0
            THEN round(100.0 * onboarded / signups, 1) ELSE 0 END,
        'practiceRate', CASE WHEN signups > 0
            THEN round(100.0 * practiced / signups, 1) ELSE 0 END,
        'paidRate', CASE WHEN signups > 0
            THEN round(100.0 * paying / signups, 1) ELSE 0 END
    ) ORDER BY signups DESC, country)
    INTO v_geography
    FROM (
        SELECT grouped.*, sum(signups) OVER () AS total_signups
        FROM grouped
        ORDER BY signups DESC, country
        LIMIT 12
    ) ranked;

    WITH cohort AS (
        SELECT
            u.id,
            COALESCE(NULLIF(u.signup_channel, ''), 'unknown') AS channel,
            u.onboarding_completed,
            u.subscription_tier IN ('pro', 'premium') AS is_paying,
            EXISTS (
                SELECT 1 FROM public.test_sessions ts WHERE ts.user_id = u.id
            ) AS has_practiced
        FROM public.users u
        WHERE u.role IS DISTINCT FROM 'admin'
          AND u.created_at >= v_since
    ), grouped AS (
        SELECT channel,
            count(*) AS signups,
            count(*) FILTER (WHERE onboarding_completed) AS onboarded,
            count(*) FILTER (WHERE has_practiced) AS practiced,
            count(*) FILTER (WHERE is_paying) AS paying
        FROM cohort
        GROUP BY channel
    )
    SELECT jsonb_agg(jsonb_build_object(
        'channel', channel,
        'signups', signups,
        'onboarded', onboarded,
        'practiced', practiced,
        'paying', paying,
        'activationRate', CASE WHEN signups > 0
            THEN round(100.0 * onboarded / signups, 1) ELSE 0 END,
        'practiceRate', CASE WHEN signups > 0
            THEN round(100.0 * practiced / signups, 1) ELSE 0 END,
        'paidRate', CASE WHEN signups > 0
            THEN round(100.0 * paying / signups, 1) ELSE 0 END
    ) ORDER BY signups DESC, channel)
    INTO v_channels
    FROM (SELECT * FROM grouped ORDER BY signups DESC, channel LIMIT 8) ranked;

    RETURN jsonb_build_object(
        'windowDays', v_days,
        'totalUsers', v_total_users,
        'newUsers', v_new_users,
        'activeUsers', v_active_users,
        'testers', v_testers,
        'completedTests', v_completed,
        'payingUsers', v_paying,
        'conversionRate', CASE WHEN v_total_users > 0
            THEN round(100.0 * v_paying / v_total_users, 1) ELSE 0 END,
        'activationRate', CASE WHEN v_new_users > 0
            THEN round(100.0 * v_onboarded / v_new_users, 1) ELSE 0 END,
        'engagement', jsonb_build_object(
            'activeRate', CASE WHEN v_total_users > 0
                THEN round(100.0 * v_active_users / v_total_users, 1) ELSE 0 END,
            'practiceSessions', v_sessions,
            'completionRate', CASE WHEN v_sessions > 0
                THEN round(100.0 * v_completed / v_sessions, 1) ELSE 0 END,
            'repeatTesters', v_repeat_testers,
            'repeatRate', CASE WHEN v_testers > 0
                THEN round(100.0 * v_repeat_testers / v_testers, 1) ELSE 0 END,
            'newUserPracticeRate', CASE WHEN v_new_users > 0
                THEN round(100.0 * v_started / v_new_users, 1) ELSE 0 END,
            'newUserPaidRate', CASE WHEN v_new_users > 0
                THEN round(100.0 * v_new_user_paid / v_new_users, 1) ELSE 0 END),
        'geoSummary', jsonb_build_object(
            'identifiedSignups', v_geo_identified,
            'unknownSignups', v_new_users - v_geo_identified,
            'coverageRate', CASE WHEN v_new_users > 0
                THEN round(100.0 * v_geo_identified / v_new_users, 1) ELSE 0 END,
            'countries', v_geo_countries,
            'basis', 'first_touch_signup_country'),
        'funnel', jsonb_build_array(
            jsonb_build_object('label', 'Signed up', 'users', v_new_users),
            jsonb_build_object('label', 'Finished onboarding', 'users', v_onboarded),
            jsonb_build_object('label', 'Started practice', 'users', v_started),
            jsonb_build_object('label', 'Paid', 'users', v_new_user_paid)),
        'trend', COALESCE(v_trend, '[]'::jsonb),
        'recentSignups', COALESCE(v_recent, '[]'::jsonb),
        'geography', COALESCE(v_geography, '[]'::jsonb),
        'acquisitionChannels', COALESCE(v_channels, '[]'::jsonb));
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_analytics_intelligence(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics_intelligence(text) TO authenticated;

COMMENT ON FUNCTION public.get_admin_overview_with_signup_sources(integer) IS
'Admin-only overview enriched with first-touch signup-country market aggregates and explicit geo coverage.';
COMMENT ON FUNCTION public.get_admin_analytics_intelligence(text) IS
'Admin-only acquisition, activation, engagement, channel, and first-touch signup-country intelligence excluding admin profiles.';

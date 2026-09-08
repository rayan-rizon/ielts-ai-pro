-- The overview map shaded only the top eight rows returned for the market
-- list, and the "unknown" bucket consumed one of those slots. On a 90-day
-- window that left most identified countries uncoloured while the header still
-- counted them, so the map disagreed with its own summary. Rank the list over
-- identified countries only, and return every identified country separately so
-- the choropleth can shade the whole footprint.

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
    v_market_map jsonb;
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
    ), scored AS (
        -- Share stays relative to every signup in the window, including the
        -- unknown bucket, so the percentages still add up to the real total.
        SELECT grouped.*, sum(signups) OVER () AS total_signups
        FROM grouped
    ), identified AS (
        SELECT * FROM scored WHERE country <> 'unknown'
    ), top_markets AS (
        SELECT * FROM identified ORDER BY signups DESC, country LIMIT 8
    )
    SELECT
        (SELECT jsonb_agg(jsonb_build_object(
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
        ) ORDER BY signups DESC, country) FROM top_markets),
        (SELECT jsonb_agg(jsonb_build_object(
            'country', country,
            'signups', signups,
            'share', CASE WHEN total_signups > 0
                THEN round(100.0 * signups / total_signups, 1) ELSE 0 END
        ) ORDER BY signups DESC, country) FROM identified)
    INTO v_markets, v_market_map;

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
        'marketMap', COALESCE(v_market_map, '[]'::jsonb),
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

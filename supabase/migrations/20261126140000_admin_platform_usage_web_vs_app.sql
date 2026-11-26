-- Let admins see how many learners use the mobile app vs the web app.
--
-- Nothing in the database previously recorded which client a learner used, so
-- this starts a per-day, per-platform activity log from the first heartbeat
-- after rollout. Earlier activity is never guessed or back-filled.

CREATE TABLE IF NOT EXISTS admin_analytics_private.user_platform_days (
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    activity_day date NOT NULL,
    platform text NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    first_seen_at timestamptz NOT NULL,
    last_seen_at timestamptz NOT NULL,
    PRIMARY KEY (user_id, activity_day, platform),
    CONSTRAINT user_platform_days_seen_order CHECK (first_seen_at <= last_seen_at)
);

CREATE INDEX IF NOT EXISTS user_platform_days_day_platform_idx
    ON admin_analytics_private.user_platform_days (activity_day, platform);

ALTER TABLE admin_analytics_private.user_platform_days ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE admin_analytics_private.user_platform_days
    FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS admin_analytics_private.platform_tracking_state (
    singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
    started_on date NOT NULL
);

ALTER TABLE admin_analytics_private.platform_tracking_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE admin_analytics_private.platform_tracking_state
    FROM PUBLIC, anon, authenticated;

INSERT INTO admin_analytics_private.platform_tracking_state (singleton, started_on)
VALUES (true, (now() AT TIME ZONE 'Asia/Dhaka')::date)
ON CONFLICT (singleton) DO NOTHING;

-- Replace the one-argument version outright: keeping both would make an
-- unnamed-platform call ambiguous. Old web builds that pass only
-- user_auth_id resolve to the default 'web'.
DROP FUNCTION IF EXISTS public.update_user_last_active(uuid);

CREATE OR REPLACE FUNCTION public.update_user_last_active(
    user_auth_id uuid,
    p_platform text DEFAULT 'web'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_now timestamptz := clock_timestamp();
    v_platform text := CASE WHEN p_platform IN ('ios', 'android') THEN p_platform ELSE 'web' END;
    v_user_id uuid;
BEGIN
    IF auth.uid() IS NULL OR user_auth_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
    END IF;

    -- Same throttle as before: bounded churn on users.last_active.
    UPDATE public.users
    SET last_active = v_now, updated_at = v_now
    WHERE auth_id = auth.uid()
      AND (last_active IS NULL
           OR last_active <= v_now - interval '5 minutes'
           OR last_active > v_now
           OR (last_active AT TIME ZONE 'Asia/Dhaka')::date
                IS DISTINCT FROM (v_now AT TIME ZONE 'Asia/Dhaka')::date);

    -- Platform use is recorded independently of that throttle, otherwise a
    -- learner who opens the app minutes after the website would never count.
    SELECT id INTO v_user_id FROM public.users WHERE auth_id = auth.uid();
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO admin_analytics_private.user_platform_days (
        user_id, activity_day, platform, first_seen_at, last_seen_at
    )
    VALUES (
        v_user_id,
        (v_now AT TIME ZONE 'Asia/Dhaka')::date,
        v_platform,
        v_now,
        v_now
    )
    ON CONFLICT (user_id, activity_day, platform) DO UPDATE
    SET last_seen_at = EXCLUDED.last_seen_at
    WHERE admin_analytics_private.user_platform_days.last_seen_at
          <= EXCLUDED.last_seen_at - interval '5 minutes';
END;
$function$;

REVOKE ALL ON FUNCTION public.update_user_last_active(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_user_last_active(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION admin_analytics_private.platform_usage(p_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_days integer;
    v_today date;
    v_since_day date;
    v_since timestamptz;
    v_started_on date;
    v_web bigint;
    v_app bigint;
    v_ios bigint;
    v_android bigint;
    v_both bigint;
    v_today_web bigint;
    v_today_app bigint;
    v_attributed bigint;
    v_active bigint;
BEGIN
    v_days := LEAST(GREATEST(COALESCE(p_days, 7), 1), 90);
    v_today := (now() AT TIME ZONE 'Asia/Dhaka')::date;
    v_since_day := v_today - (v_days - 1);
    v_since := v_since_day::timestamp AT TIME ZONE 'Asia/Dhaka';

    SELECT started_on INTO v_started_on
    FROM admin_analytics_private.platform_tracking_state
    WHERE singleton;

    WITH per_user AS (
        SELECT
            d.user_id,
            bool_or(d.platform = 'web') AS used_web,
            bool_or(d.platform IN ('ios', 'android')) AS used_app,
            bool_or(d.platform = 'ios') AS used_ios,
            bool_or(d.platform = 'android') AS used_android,
            bool_or(d.platform = 'web' AND d.activity_day = v_today) AS web_today,
            bool_or(d.platform IN ('ios', 'android') AND d.activity_day = v_today) AS app_today
        FROM admin_analytics_private.user_platform_days d
        JOIN public.users u ON u.id = d.user_id
        WHERE u.role IS DISTINCT FROM 'admin'
          AND d.activity_day >= v_since_day
        GROUP BY d.user_id
    )
    SELECT
        count(*) FILTER (WHERE used_web),
        count(*) FILTER (WHERE used_app),
        count(*) FILTER (WHERE used_ios),
        count(*) FILTER (WHERE used_android),
        count(*) FILTER (WHERE used_web AND used_app),
        count(*) FILTER (WHERE web_today),
        count(*) FILTER (WHERE app_today),
        count(*)
    INTO v_web, v_app, v_ios, v_android, v_both, v_today_web, v_today_app, v_attributed
    FROM per_user;

    SELECT count(*) INTO v_active
    FROM public.users u
    WHERE u.role IS DISTINCT FROM 'admin'
      AND u.last_active >= v_since;

    RETURN jsonb_build_object(
        'web', v_web,
        'app', v_app,
        'ios', v_ios,
        'android', v_android,
        'both', v_both,
        'webOnly', v_web - v_both,
        'appOnly', v_app - v_both,
        'todayWeb', v_today_web,
        'todayApp', v_today_app,
        'attributed', v_attributed,
        -- Active learners whose client was not reported (old builds, or
        -- activity before tracking began). Shown, never folded into web.
        'unattributed', GREATEST(v_active - v_attributed, 0),
        'trackingStartedOn', v_started_on,
        'windowStart', v_since_day,
        'timezone', 'Asia/Dhaka'
    );
END;
$function$;

REVOKE ALL ON FUNCTION admin_analytics_private.platform_usage(integer)
    FROM PUBLIC, anon, authenticated;

-- Fold the split into the existing active-users read so the admin overview
-- pays no extra round trip: move the original aside and wrap it.
ALTER FUNCTION public.get_admin_active_users(integer)
    SET SCHEMA admin_analytics_private;
ALTER FUNCTION admin_analytics_private.get_admin_active_users(integer)
    RENAME TO active_users_base;
REVOKE ALL ON FUNCTION admin_analytics_private.active_users_base(integer)
    FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_active_users(p_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    RETURN admin_analytics_private.active_users_base(p_days)
        || jsonb_build_object('platform', admin_analytics_private.platform_usage(p_days));
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_active_users(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_active_users(integer) TO authenticated;

COMMENT ON FUNCTION public.get_admin_active_users(integer) IS
    'Admin-only active-user KPI plus unique learners per client (web vs mobile app) from the platform log that starts at platform.trackingStartedOn.';

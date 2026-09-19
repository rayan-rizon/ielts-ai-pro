-- Keep exact daily activity history so Admin Overview can compare unique
-- learners across two completed periods. A single users.last_active timestamp
-- is enough for the current window, but it cannot reconstruct a learner who
-- was active in both the current and previous windows.

CREATE SCHEMA IF NOT EXISTS admin_analytics_private;
REVOKE ALL ON SCHEMA admin_analytics_private FROM PUBLIC, anon, authenticated;

CREATE TABLE admin_analytics_private.user_activity_days (
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    activity_day date NOT NULL,
    first_seen_at timestamptz NOT NULL,
    last_seen_at timestamptz NOT NULL,
    PRIMARY KEY (user_id, activity_day),
    CONSTRAINT user_activity_days_seen_order
        CHECK (first_seen_at <= last_seen_at)
);

ALTER TABLE admin_analytics_private.user_activity_days ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE admin_analytics_private.user_activity_days
    FROM PUBLIC, anon, authenticated;

CREATE TABLE admin_analytics_private.activity_tracking_state (
    singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
    started_on date NOT NULL
);

ALTER TABLE admin_analytics_private.activity_tracking_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE admin_analytics_private.activity_tracking_state
    FROM PUBLIC, anon, authenticated;

INSERT INTO admin_analytics_private.activity_tracking_state (singleton, started_on)
VALUES (true, (now() AT TIME ZONE 'Asia/Dhaka')::date)
ON CONFLICT (singleton) DO NOTHING;

-- Preserve the latest known activity as a useful starting point, while the
-- started_on gate below prevents these sparse backfilled rows from being
-- mistaken for complete historical coverage.
INSERT INTO admin_analytics_private.user_activity_days (
    user_id,
    activity_day,
    first_seen_at,
    last_seen_at
)
SELECT
    id,
    (last_active AT TIME ZONE 'Asia/Dhaka')::date,
    last_active,
    last_active
FROM public.users
WHERE last_active IS NOT NULL
ON CONFLICT (user_id, activity_day) DO UPDATE
SET last_seen_at = GREATEST(
    admin_analytics_private.user_activity_days.last_seen_at,
    EXCLUDED.last_seen_at
);

-- Capture every legitimate last_active write, including older frontend builds
-- that still update public.users directly during a rolling deployment.
CREATE OR REPLACE FUNCTION admin_analytics_private.capture_user_activity_day()
RETURNS trigger
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    IF NEW.last_active IS NULL
       OR NEW.last_active IS NOT DISTINCT FROM OLD.last_active THEN
        RETURN NEW;
    END IF;

    INSERT INTO admin_analytics_private.user_activity_days (
        user_id,
        activity_day,
        first_seen_at,
        last_seen_at
    )
    VALUES (
        NEW.id,
        (NEW.last_active AT TIME ZONE 'Asia/Dhaka')::date,
        NEW.last_active,
        NEW.last_active
    )
    ON CONFLICT (user_id, activity_day) DO UPDATE
    SET last_seen_at = GREATEST(
        admin_analytics_private.user_activity_days.last_seen_at,
        EXCLUDED.last_seen_at
    );

    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION admin_analytics_private.capture_user_activity_day()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS capture_user_activity_day ON public.users;
CREATE TRIGGER capture_user_activity_day
AFTER UPDATE OF last_active ON public.users
FOR EACH ROW
EXECUTE FUNCTION admin_analytics_private.capture_user_activity_day();

-- Replace the legacy caller-controlled SECURITY DEFINER function with an
-- authenticated, ownership-checked write. Updating last_active and the daily
-- history in one transaction keeps the current and historical metrics aligned.
CREATE OR REPLACE FUNCTION public.update_user_last_active(user_auth_id uuid)
RETURNS void
LANGUAGE plpgsql
VOLATILE
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
$function$;

REVOKE ALL ON FUNCTION public.update_user_last_active(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_user_last_active(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_active_users(p_days integer DEFAULT 7)
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
    v_previous_since_day date;
    v_today_start timestamptz;
    v_since timestamptz;
    v_last_30_days timestamptz;
    v_active bigint;
    v_today_active bigint;
    v_last_30_active bigint;
    v_previous_active bigint;
    v_tracking_started_on date;
    v_comparison_ready boolean;
    v_comparison_available_on date;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_days := LEAST(GREATEST(COALESCE(p_days, 7), 1), 90);
    v_today := (now() AT TIME ZONE 'Asia/Dhaka')::date;
    v_since_day := v_today - (v_days - 1);
    v_previous_since_day := v_since_day - v_days;
    v_today_start := v_today::timestamp AT TIME ZONE 'Asia/Dhaka';
    v_since := v_since_day::timestamp AT TIME ZONE 'Asia/Dhaka';
    v_last_30_days := (v_today - 29)::timestamp AT TIME ZONE 'Asia/Dhaka';

    SELECT
        count(*) FILTER (WHERE u.last_active >= v_since),
        count(*) FILTER (WHERE u.last_active >= v_today_start),
        count(*) FILTER (WHERE u.last_active >= v_last_30_days)
    INTO v_active, v_today_active, v_last_30_active
    FROM public.users u
    WHERE u.role IS DISTINCT FROM 'admin';

    SELECT started_on
    INTO v_tracking_started_on
    FROM admin_analytics_private.activity_tracking_state
    WHERE singleton;

    v_comparison_available_on := v_tracking_started_on + (2 * v_days - 1);
    v_comparison_ready := v_today >= v_comparison_available_on;

    IF v_comparison_ready THEN
        SELECT count(DISTINCT activity.user_id)
        INTO v_previous_active
        FROM admin_analytics_private.user_activity_days activity
        JOIN public.users u ON u.id = activity.user_id
        WHERE u.role IS DISTINCT FROM 'admin'
          AND activity.activity_day >= v_previous_since_day
          AND activity.activity_day < v_since_day;
    ELSE
        v_previous_active := NULL;
    END IF;

    RETURN jsonb_build_object(
        'value', v_active,
        'prev', v_previous_active,
        'today', v_today_active,
        'last30Days', v_last_30_active,
        -- Keep these aliases for older frontend builds during rollout.
        'dau', v_today_active,
        'mau', v_last_30_active,
        'stickiness', CASE WHEN v_last_30_active > 0
            THEN round(100.0 * v_today_active / v_last_30_active, 1)
            ELSE 0
        END,
        'comparisonReady', v_comparison_ready,
        'comparisonAvailableOn', v_comparison_available_on,
        'comparisonBasis', 'daily_activity_history',
        'trackingStartedOn', v_tracking_started_on,
        'windowStart', v_since_day,
        'timezone', 'Asia/Dhaka'
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_active_users(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_active_users(integer) TO authenticated;

COMMENT ON FUNCTION public.update_user_last_active(uuid) IS
    'Records the authenticated learner latest activity and one Asia/Dhaka activity row per day.';

COMMENT ON FUNCTION public.get_admin_active_users(integer) IS
    'Admin-only active-user KPI with Bangladesh calendar windows and comparison readiness based on complete daily history.';

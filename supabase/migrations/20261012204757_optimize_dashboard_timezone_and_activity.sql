-- Exact timezone whitelist, enumerated once rather than on every dashboard read.
-- Refresh via a migration after a PostgreSQL/tzdata upgrade. No exposed RPC.
CREATE SCHEMA IF NOT EXISTS dashboard_private;
REVOKE ALL ON SCHEMA dashboard_private FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS dashboard_private.timezone_names (name text PRIMARY KEY);
ALTER TABLE dashboard_private.timezone_names ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE dashboard_private.timezone_names FROM PUBLIC, anon, authenticated;
INSERT INTO dashboard_private.timezone_names(name)
SELECT name FROM pg_catalog.pg_timezone_names ON CONFLICT DO NOTHING;

-- Patch only the two validation lookups; preserve all analytics and ACLs.
-- Fail closed if the function has drifted instead of replacing unrelated changes.
DO $migration$
DECLARE
    definition text := pg_get_functiondef('public.get_dashboard_stats(text)'::regprocedure);
    old_marker text := 'FROM pg_timezone_names WHERE name =';
    new_marker text := 'FROM dashboard_private.timezone_names WHERE name =';
    occurrences integer;
BEGIN
    occurrences := (length(definition) - length(replace(definition, old_marker, ''))) / length(old_marker);
    IF occurrences = 0 AND position(new_marker IN definition) > 0 THEN
        RETURN;
    END IF;
    IF occurrences <> 2 THEN
        RAISE EXCEPTION 'Dashboard timezone validation changed: expected two lookups, found %', occurrences;
    END IF;
    EXECUTE replace(definition, old_marker, new_marker);
END;
$migration$;

-- Bound profile/index/daily-history churn. The first heartbeat after Dhaka
-- midnight is always recorded even if the last heartbeat was seconds ago.
CREATE OR REPLACE FUNCTION public.update_user_last_active(user_auth_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_now timestamptz := clock_timestamp();
BEGIN
    IF auth.uid() IS NULL OR user_auth_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
    END IF;
    UPDATE public.users
    SET last_active = v_now, updated_at = v_now
    WHERE auth_id = auth.uid()
      AND (last_active IS NULL
           OR last_active <= v_now - interval '5 minutes'
           OR last_active > v_now
           OR (last_active AT TIME ZONE 'Asia/Dhaka')::date
                IS DISTINCT FROM (v_now AT TIME ZONE 'Asia/Dhaka')::date);
    -- Existing capture_user_activity_day trigger retains atomic history.
END;
$function$;
REVOKE ALL ON FUNCTION public.update_user_last_active(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_user_last_active(uuid) TO authenticated;

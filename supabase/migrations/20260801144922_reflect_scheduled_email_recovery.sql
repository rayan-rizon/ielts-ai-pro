-- A newly repaired cron job has no run history yet. Represent that evidence as
-- degraded/pending verification rather than a false outage; a queued cron run
-- without an application telemetry row will still be reported as down.

ALTER FUNCTION public.get_platform_health(integer)
    RENAME TO get_platform_health_core_v4;
REVOKE ALL ON FUNCTION public.get_platform_health_core_v4(integer)
    FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_platform_health(p_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_base jsonb;
    v_services jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_base := public.get_platform_health_core_v4(p_hours);

    SELECT COALESCE(jsonb_agg(
        CASE
            WHEN service->>'key' = 'scheduled_automation'
              AND service->'metrics'->>'cronActive' = 'true'
              AND service->'metrics'->'lastCronStatus' = 'null'::jsonb
              AND service->'metrics'->>'lastRunRecorded' = 'false'
            THEN service || jsonb_build_object(
                'status', 'degraded',
                'impact', 'The repaired scheduler is active and passed its authenticated endpoint check; the first scheduled application run is still pending.'
            )
            ELSE service
        END
    ), '[]'::jsonb)
    INTO v_services
    FROM jsonb_array_elements(COALESCE(v_base->'services', '[]'::jsonb)) service;

    v_base := jsonb_set(v_base, '{services}', v_services, true);
    v_base := jsonb_set(v_base, '{contractVersion}', '5'::jsonb, true);
    v_base := jsonb_set(v_base, '{summary}', (
        SELECT COALESCE(jsonb_object_agg(status, n), '{}'::jsonb)
        FROM (
            SELECT service->>'status' AS status, count(*) AS n
            FROM jsonb_array_elements(v_services) service
            GROUP BY service->>'status'
        ) counts
    ), true);

    RETURN v_base;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health(integer) TO authenticated;

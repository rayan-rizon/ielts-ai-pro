-- Make operational health evidence unambiguous.  The prior contract reported
-- zero values for a scheduled application run that had never been recorded,
-- which looked like a successful run just happened.  It also duplicated the
-- standing account-profile data check in the incident feed.

ALTER FUNCTION public.get_platform_health(integer)
    RENAME TO get_platform_health_core_v3;
REVOKE ALL ON FUNCTION public.get_platform_health_core_v3(integer)
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
    v_has_recorded_run boolean;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_base := public.get_platform_health_core_v3(p_hours);
    SELECT EXISTS (SELECT 1 FROM public.scheduled_email_runs)
    INTO v_has_recorded_run;

    SELECT COALESCE(jsonb_agg(
        CASE WHEN service->>'key' = 'scheduled_automation' THEN
            jsonb_set(
                service,
                '{metrics}',
                (service->'metrics') || jsonb_build_object(
                    'lastRunRecorded', v_has_recorded_run,
                    'lastRunAgeHours', CASE WHEN v_has_recorded_run
                        THEN service->'metrics'->'lastRunAgeHours'
                        ELSE 'null'::jsonb END,
                    'lastRunAccepted', CASE WHEN v_has_recorded_run
                        THEN service->'metrics'->'lastRunAccepted'
                        ELSE 'null'::jsonb END,
                    'lastRunFailed', CASE WHEN v_has_recorded_run
                        THEN service->'metrics'->'lastRunFailed'
                        ELSE 'null'::jsonb END
                ),
                true
            )
        ELSE service END
    ), '[]'::jsonb)
    INTO v_services
    FROM jsonb_array_elements(COALESCE(v_base->'services', '[]'::jsonb)) service;

    v_base := jsonb_set(v_base, '{services}', v_services, true);
    v_base := jsonb_set(v_base, '{contractVersion}', '4'::jsonb, true);
    RETURN v_base;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health(integer) TO authenticated;

ALTER FUNCTION public.get_platform_health_incidents(integer, integer)
    RENAME TO get_platform_health_incidents_core_v3;
REVOKE ALL ON FUNCTION public.get_platform_health_incidents_core_v3(integer, integer)
    FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_platform_health_incidents(
    p_hours integer DEFAULT 24,
    p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_core jsonb;
    v_result jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_core := public.get_platform_health_incidents_core_v3(p_hours, p_limit);
    SELECT COALESCE(jsonb_agg(to_jsonb(i) ORDER BY i.last_seen DESC, i.occurrences DESC), '[]'::jsonb)
    INTO v_result
    FROM jsonb_to_recordset(v_core) AS i(
        service text,
        message text,
        occurrences bigint,
        last_seen timestamptz,
        first_seen timestamptz
    )
    WHERE i.service <> 'auth_provisioning';

    RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health_incidents(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health_incidents(integer, integer) TO authenticated;

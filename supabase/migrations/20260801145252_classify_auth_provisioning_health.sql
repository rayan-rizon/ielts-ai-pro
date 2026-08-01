-- Missing profiles affect service health only when the Auth account is
-- established (confirmed or previously signed in). Never-activated historical
-- accounts remain visible as inventory without producing a false outage.

ALTER FUNCTION public.get_platform_health(integer)
    RENAME TO get_platform_health_core_v5;
REVOKE ALL ON FUNCTION public.get_platform_health_core_v5(integer)
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
    v_actionable bigint := 0;
    v_unactivated bigint := 0;
    v_oldest_actionable_hours numeric;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_base := public.get_platform_health_core_v5(p_hours);

    SELECT
        count(*) FILTER (WHERE account.email_confirmed_at IS NOT NULL
            OR account.last_sign_in_at IS NOT NULL),
        count(*) FILTER (WHERE account.email_confirmed_at IS NULL
            AND account.last_sign_in_at IS NULL),
        extract(epoch FROM (now() - min(account.created_at) FILTER (
            WHERE account.email_confirmed_at IS NOT NULL
               OR account.last_sign_in_at IS NOT NULL
        ))) / 3600
    INTO v_actionable, v_unactivated, v_oldest_actionable_hours
    FROM auth.users account
    LEFT JOIN public.users profile ON profile.auth_id = account.id
    WHERE profile.id IS NULL
      AND account.created_at < now() - interval '15 minutes';

    SELECT COALESCE(jsonb_agg(
        CASE WHEN service->>'key' = 'auth_provisioning' THEN
            jsonb_set(
                service || jsonb_build_object(
                    'status', CASE
                        WHEN v_actionable >= 10 THEN 'down'
                        WHEN v_actionable > 0 THEN 'degraded'
                        ELSE 'operational'
                    END,
                    'impact', CASE WHEN v_actionable = 0 THEN
                        'No confirmed or previously signed-in Auth account is missing a learner profile. ' ||
                        v_unactivated || ' unactivated historical account(s) remain available for retention review.'
                    ELSE
                        v_actionable || ' established Auth account(s) have no learner profile and may be unable to use the app.'
                    END
                ),
                '{metrics}',
                (service->'metrics') || jsonb_build_object(
                    'actionableProfileGaps', v_actionable,
                    'unactivatedAccounts', v_unactivated,
                    'oldestActionableHours', CASE
                        WHEN v_oldest_actionable_hours IS NULL THEN 'null'::jsonb
                        ELSE to_jsonb(round(v_oldest_actionable_hours, 1))
                    END
                ),
                true
            )
        ELSE service END
    ), '[]'::jsonb)
    INTO v_services
    FROM jsonb_array_elements(COALESCE(v_base->'services', '[]'::jsonb)) service;

    v_base := jsonb_set(v_base, '{services}', v_services, true);
    v_base := jsonb_set(v_base, '{contractVersion}', '6'::jsonb, true);
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

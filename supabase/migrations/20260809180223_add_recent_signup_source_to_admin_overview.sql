-- Keep the established overview payload intact while enriching only its recent
-- signup rows with the first-touch source already stored on public.users.
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
BEGIN
    v_overview := public.get_admin_overview(p_days);

    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC)
    INTO v_recent
    FROM (
        SELECT id, full_name, email, created_at, subscription_tier, onboarding_completed,
               COALESCE(signup_channel, 'unknown') AS signup_channel,
               signup_utm_source
        FROM public.users
        ORDER BY created_at DESC
        LIMIT 8
    ) t;

    RETURN v_overview || jsonb_build_object(
        'recentSignups', COALESCE(v_recent, '[]'::jsonb)
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_overview_with_signup_sources(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_overview_with_signup_sources(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_overview_with_signup_sources(integer) TO authenticated;

COMMENT ON FUNCTION public.get_admin_overview_with_signup_sources(integer) IS
'Admin overview payload with source-aware recent signup rows.';

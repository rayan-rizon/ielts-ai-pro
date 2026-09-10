-- The deployed Reading Assistant now tries Gemini Flash before GLM. Keep the
-- existing health card's provider label aligned without duplicating telemetry.
ALTER FUNCTION public.get_platform_health(integer)
  RENAME TO get_platform_health_core_v10;
REVOKE ALL ON FUNCTION public.get_platform_health_core_v10(integer)
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
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  v_base := public.get_platform_health_core_v10(p_hours);
  v_base := jsonb_set(
    v_base,
    '{services}',
    COALESCE((
      SELECT jsonb_agg(
        CASE WHEN service->>'key' = 'reading_assistant'
          THEN jsonb_set(service, '{provider}', '"Gemini 2.5 Flash -> GLM 5.3 Flash"'::jsonb)
          ELSE service
        END
      )
      FROM jsonb_array_elements(COALESCE(v_base->'services', '[]'::jsonb)) service
    ), '[]'::jsonb),
    true
  );
  RETURN v_base;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health(integer) TO authenticated;

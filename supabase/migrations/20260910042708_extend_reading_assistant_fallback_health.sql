-- Keep the existing admin health contract, but expose the additional Reading
-- fallback models from the same persisted ai_api_usage rows used by AI Usage.
ALTER FUNCTION public.get_platform_health(integer)
  RENAME TO get_platform_health_core_v11;
REVOKE ALL ON FUNCTION public.get_platform_health_core_v11(integer)
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
  v_hours integer;
  v_since timestamptz;
  v_deepseek bigint;
  v_luna bigint;
  v_gpt_oss bigint;
  v_glm bigint;
  v_fallbacks bigint;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  v_hours := LEAST(GREATEST(COALESCE(p_hours, 24), 1), 24 * 90);
  v_since := now() - make_interval(hours => v_hours);
  v_base := public.get_platform_health_core_v11(v_hours);

  SELECT
    count(*) FILTER (WHERE request_metadata->>'model' = 'deepseek/deepseek-v4-flash-0731'),
    count(*) FILTER (WHERE request_metadata->>'model' = 'openai/gpt-5.6-luna'),
    count(*) FILTER (WHERE request_metadata->>'model' = 'openai/gpt-oss-120b'),
    count(*) FILTER (WHERE request_metadata->>'model' = 'z-ai/glm-5.3-flash'),
    count(*) FILTER (WHERE request_metadata->>'fallbackUsed' = 'true')
  INTO v_deepseek, v_luna, v_gpt_oss, v_glm, v_fallbacks
  FROM public.ai_api_usage
  WHERE endpoint = 'reading-assistant' AND created_at >= v_since;

  v_base := jsonb_set(
    v_base,
    '{services}',
    COALESCE((
      SELECT jsonb_agg(
        CASE WHEN service->>'key' = 'reading_assistant' THEN
          service || jsonb_build_object(
            'provider', 'GPT OSS 120B -> GPT-5.6 Luna -> DeepSeek V4 Flash -> Gemini 2.5 Flash -> GLM 5.3 Flash',
            'metrics', COALESCE(service->'metrics', '{}'::jsonb) || jsonb_build_object(
              'deepseekCalls', v_deepseek,
              'lunaCalls', v_luna,
              'gptOssCalls', v_gpt_oss,
              'glmCalls', v_glm
            ),
            'impact', CASE
              WHEN v_fallbacks > 0 THEN v_fallbacks || ' request(s) used a Reading provider fallback after the primary model did not return a usable result.'
              ELSE COALESCE(service->>'impact', 'Reading assistance requests completed normally.')
            END
          )
        ELSE service END
      )
      FROM jsonb_array_elements(COALESCE(v_base->'services', '[]'::jsonb)) service
    ), '[]'::jsonb),
    true
  );
  v_base := jsonb_set(v_base, '{contractVersion}', '11'::jsonb, true);
  RETURN v_base;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health(integer) TO authenticated;

COMMENT ON FUNCTION public.get_platform_health(integer) IS
'Admin-only operational health from persisted telemetry. Includes Reading Assistant GPT OSS, Luna, DeepSeek, Gemini, and GLM call counts.';

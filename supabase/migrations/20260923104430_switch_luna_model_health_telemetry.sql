-- GPT-6 Luna replaces GPT-5.6 Luna on the active Writing, Reading fallback,
-- and AI Coach fallback routes. Keep historical usage attributed to the same
-- Luna health metric, and show the current model in the Admin health labels.

CREATE OR REPLACE FUNCTION public.get_platform_health_core_v12(p_hours integer DEFAULT 24)
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
  v_wasted numeric;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  v_hours := LEAST(GREATEST(COALESCE(p_hours, 24), 1), 24 * 90);
  v_since := now() - make_interval(hours => v_hours);
  v_base := public.get_platform_health_core_v11(v_hours);

  SELECT
    count(*) FILTER (WHERE request_metadata->>'model' = 'deepseek/deepseek-v4-flash-0731'),
    count(*) FILTER (WHERE request_metadata->>'model' IN ('openai/gpt-5.6-luna', 'openai/gpt-6-luna')),
    count(*) FILTER (WHERE request_metadata->>'model' = 'openai/gpt-oss-120b'),
    count(*) FILTER (WHERE request_metadata->>'model' = 'z-ai/glm-5.3-flash'),
    count(*) FILTER (WHERE request_metadata->>'fallbackUsed' = 'true'),
    COALESCE(sum(
      CASE
        WHEN request_metadata->>'wastedProviderCostUsd'
             ~ '^[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?$'
          THEN (request_metadata->>'wastedProviderCostUsd')::numeric
        ELSE 0
      END
    ), 0)
  INTO v_deepseek, v_luna, v_gpt_oss, v_glm, v_fallbacks, v_wasted
  FROM public.ai_api_usage
  WHERE endpoint = 'reading-assistant' AND created_at >= v_since;

  v_base := jsonb_set(
    v_base,
    '{services}',
    COALESCE((
      SELECT jsonb_agg(
        CASE WHEN service->>'key' = 'reading_assistant' THEN
          service || jsonb_build_object(
            'provider', 'GPT OSS 120B -> GPT-6 Luna -> DeepSeek V4 Flash -> GLM 5.3 Flash',
            'metrics', (COALESCE(service->'metrics', '{}'::jsonb) - 'geminiCalls')
              || jsonb_build_object(
                'deepseekCalls', v_deepseek,
                'lunaCalls', v_luna,
                'gptOssCalls', v_gpt_oss,
                'glmCalls', v_glm,
                'wastedCostUsd', CASE WHEN v_wasted > 0 THEN round(v_wasted, 6) END
              ),
            'impact', CASE
              WHEN v_fallbacks > 0 THEN v_fallbacks || ' request(s) used a Reading provider fallback after the primary model did not return a usable result.'
              ELSE COALESCE(service->>'impact', 'Reading assistance requests completed normally.')
            END
          )
        ELSE service END
        ORDER BY ordinal
      )
      FROM jsonb_array_elements(COALESCE(v_base->'services', '[]'::jsonb))
        WITH ORDINALITY AS rows(service, ordinal)
    ), '[]'::jsonb),
    true
  );
  v_base := jsonb_set(v_base, '{contractVersion}', '11'::jsonb, true);
  RETURN v_base;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health_core_v12(integer)
  FROM PUBLIC, anon, authenticated;

-- The coach health label is appended by the current public wrapper. Keep its
-- existing budget and access logic, then update only the displayed model name.
ALTER FUNCTION public.get_platform_health(integer)
  RENAME TO get_platform_health_core_v14;
REVOKE ALL ON FUNCTION public.get_platform_health_core_v14(integer)
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
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  v_base := public.get_platform_health_core_v14(p_hours);

  SELECT jsonb_agg(
    CASE WHEN service->>'key' = 'personalized_ai_coach' THEN
      jsonb_set(
        service,
        '{provider}',
        to_jsonb(replace(service->>'provider', 'GPT-5.6 Luna', 'GPT-6 Luna')),
        true
      )
    ELSE service END
    ORDER BY ordinal
  )
  INTO v_services
  FROM jsonb_array_elements(COALESCE(v_base->'services', '[]'::jsonb))
    WITH ORDINALITY AS rows(service, ordinal);

  v_base := jsonb_set(v_base, '{services}', COALESCE(v_services, '[]'::jsonb), true);
  RETURN v_base;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_health(integer) TO authenticated;

COMMENT ON FUNCTION public.get_platform_health(integer) IS
'Admin-only operational health with current provider labels and Reading fallback counts that combine historical GPT-5.6 Luna and active GPT-6 Luna usage.';

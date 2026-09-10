-- Reading assistant telemetry is recorded in ai_api_usage so it appears in the
-- existing admin AI Usage views. This wrapper adds a feature-specific health
-- card derived from those same lifecycle rows; it does not probe providers.

ALTER FUNCTION public.get_platform_health(integer)
  RENAME TO get_platform_health_core_v9;
REVOKE ALL ON FUNCTION public.get_platform_health_core_v9(integer)
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
  v_attempts bigint;
  v_errors bigint;
  v_fallbacks bigint;
  v_cached bigint;
  v_glm bigint;
  v_gemini bigint;
  v_latency numeric;
  v_cost numeric;
  v_costed bigint;
  v_rate numeric;
  v_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  v_hours := LEAST(GREATEST(COALESCE(p_hours, 24), 1), 24 * 90);
  v_since := now() - make_interval(hours => v_hours);
  v_base := public.get_platform_health_core_v9(v_hours);

  WITH tracked AS (
    SELECT
      request_metadata,
      cached,
      CASE
        WHEN request_metadata->>'estimatedProviderCostUsd'
             ~ '^[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?$'
          THEN (request_metadata->>'estimatedProviderCostUsd')::numeric
        ELSE NULL
      END AS cost_usd,
      CASE
        WHEN request_metadata->>'latencyMs' ~ '^[0-9]+$'
          THEN (request_metadata->>'latencyMs')::numeric
        ELSE NULL
      END AS latency_ms
    FROM public.ai_api_usage
    WHERE endpoint = 'reading-assistant' AND created_at >= v_since
  )
  SELECT
    count(*) FILTER (WHERE COALESCE(request_metadata->>'reservationStatus', 'completed') <> 'reserved'),
    count(*) FILTER (WHERE request_metadata->>'reservationStatus' = 'failed'),
    count(*) FILTER (WHERE request_metadata->>'fallbackUsed' = 'true'),
    count(*) FILTER (WHERE cached IS TRUE),
    count(*) FILTER (WHERE request_metadata->>'model' = 'z-ai/glm-5.3-flash'),
    count(*) FILTER (WHERE request_metadata->>'model' = 'gemini-2.5-flash'),
    percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms)
      FILTER (WHERE latency_ms IS NOT NULL),
    COALESCE(sum(cost_usd), 0),
    count(*) FILTER (WHERE cost_usd IS NOT NULL)
  INTO v_attempts, v_errors, v_fallbacks, v_cached, v_glm, v_gemini,
       v_latency, v_cost, v_costed
  FROM tracked;

  v_rate := CASE WHEN v_attempts > 0 THEN 100.0 * v_errors / v_attempts ELSE 0 END;
  v_status := CASE
    WHEN v_attempts = 0 THEN 'idle'
    WHEN v_errors >= 3 AND v_rate >= 20 THEN 'down'
    WHEN v_errors > 0 THEN 'degraded'
    ELSE 'operational'
  END;

  v_base := jsonb_set(
    v_base,
    '{services}',
    COALESCE(v_base->'services', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'key', 'reading_assistant',
      'label', 'Reading Assistant',
      'category', 'ai',
      'provider', 'GLM 5.3 Flash -> Gemini 2.5 Flash',
      'status', v_status,
      'source', 'ai_api_usage reading-assistant lifecycle telemetry',
      'metrics', jsonb_build_object(
        'attempts', v_attempts,
        'errors', v_errors,
        'errorRate', round(v_rate, 1),
        'fallbacks', v_fallbacks,
        'cacheHits', v_cached,
        'glmCalls', v_glm,
        'geminiCalls', v_gemini,
        'p95LatencyMs', CASE WHEN v_latency IS NULL THEN NULL ELSE round(v_latency)::integer END,
        'estimatedCostUsd', CASE WHEN v_costed > 0 THEN round(v_cost, 6) END,
        'costedCalls', v_costed
      ),
      'impact', CASE
        WHEN v_attempts = 0 THEN 'No Reading assistance requests in this window; this is not proof of provider health.'
        WHEN v_errors > 0 THEN v_errors || ' Reading assistance request(s) failed without a usable result.'
        WHEN v_fallbacks > 0 THEN v_fallbacks || ' request(s) used Gemini after GLM did not return a usable result.'
        ELSE 'Reading assistance requests completed normally.'
      END
    )),
    true
  );
  v_base := jsonb_set(v_base, '{contractVersion}', '9'::jsonb, true);
  RETURN v_base;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health(integer) TO authenticated;

COMMENT ON FUNCTION public.get_platform_health(integer) IS
'Admin-only operational health from persisted telemetry. Includes Reading Assistant lifecycle, latency, provider fallback, and recorded-cost evidence.';

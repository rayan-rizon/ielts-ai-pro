-- Evidence-based text AI provider health for the admin Health screen.
--
-- This is deliberately telemetry-only: the database never probes a provider
-- with a secret and never exposes secret configuration state. A provider is
-- judged from completed, persisted Edge Function outcomes.

CREATE OR REPLACE FUNCTION public.get_ai_provider_health(p_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_since timestamptz;
    v_hours integer;
    v_attempts bigint;
    v_errors bigint;
    v_fallbacks bigint;
    v_openrouter bigint;
    v_direct_deepseek bigint;
    v_gemini bigint;
    v_unknown bigint;
    v_cost numeric;
    v_rate numeric;
    v_status text;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_hours := LEAST(GREATEST(COALESCE(p_hours, 24), 1), 24 * 90);
    v_since := now() - make_interval(hours => v_hours);

    SELECT
        count(*) FILTER (
            WHERE COALESCE(request_metadata->>'reservationStatus', 'completed') <> 'reserved'
        ),
        count(*) FILTER (
            WHERE request_metadata->>'reservationStatus' = 'failed'
        ),
        count(*) FILTER (
            WHERE request_metadata->>'fallbackUsed' = 'true'
        ),
        count(*) FILTER (
            WHERE request_metadata->>'provider' = 'openrouter-deepseek'
        ),
        count(*) FILTER (
            WHERE request_metadata->>'provider' = 'deepseek'
        ),
        count(*) FILTER (
            WHERE request_metadata->>'provider' = 'gemini'
        ),
        count(*) FILTER (
            WHERE NULLIF(btrim(request_metadata->>'provider'), '') IS NULL
        ),
        COALESCE(sum(
            CASE
                WHEN request_metadata->>'estimatedProviderCostUsd' ~ '^[0-9]+(\.[0-9]+)?$'
                THEN (request_metadata->>'estimatedProviderCostUsd')::numeric
                ELSE 0
            END
        ), 0)
    INTO v_attempts, v_errors, v_fallbacks, v_openrouter, v_direct_deepseek,
         v_gemini, v_unknown, v_cost
    FROM public.ai_api_usage
    WHERE created_at >= v_since
      AND endpoint IN (
          'evaluateGrammarTransfer',
          'generateAdaptiveLearningPath',
          'generateStudyRecommendations',
          'generateDetailedFeedback',
          'generateDetailedSpeakingFeedback',
          'evaluateSpeakingTest'
      );

    v_rate := CASE WHEN v_attempts > 0 THEN 100.0 * v_errors / v_attempts ELSE 0 END;
    v_status := CASE
        WHEN v_attempts = 0 THEN 'idle'
        WHEN v_attempts >= 5 AND v_rate >= 20 THEN 'down'
        WHEN v_errors > 0 OR v_fallbacks > 0 THEN 'degraded'
        ELSE 'operational'
    END;

    RETURN jsonb_build_object(
        'generatedAt', now(),
        'windowHours', v_hours,
        'service', jsonb_build_object(
            'key', 'ai_text_providers',
            'label', 'Text AI Providers',
            'category', 'ai',
            'provider', 'OpenRouter DeepSeek -> Direct DeepSeek -> Gemini',
            'status', v_status,
            'source', 'ai_api_usage provider telemetry',
            'metrics', jsonb_build_object(
                'attempts', v_attempts,
                'errors', v_errors,
                'errorRate', round(v_rate, 1),
                'fallbacks', v_fallbacks,
                'openrouterCalls', v_openrouter,
                'directDeepseekCalls', v_direct_deepseek,
                'geminiCalls', v_gemini,
                'unknownProviderCalls', v_unknown,
                'estimatedCostUsd', round(v_cost, 6)
            ),
            'impact', CASE
                WHEN v_attempts = 0 THEN 'No text AI requests in this window; this is not proof of provider health.'
                WHEN v_errors > 0 THEN v_errors || ' text AI request(s) failed.'
                WHEN v_fallbacks > 0 THEN v_fallbacks || ' request(s) recovered through a fallback provider.'
                ELSE 'Text AI requests completed without fallback.'
            END
        )
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_ai_provider_health(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_ai_provider_health(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_ai_provider_health(integer) TO authenticated;

COMMENT ON FUNCTION public.get_ai_provider_health(integer) IS
'Admin-only telemetry view of text AI provider routing and fallback outcomes; never probes providers or exposes secrets.';

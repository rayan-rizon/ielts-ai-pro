-- Standardize text-provider health around learner outcomes:
-- 1. Direct Google Gemini and Gemini served through OpenRouter are distinct.
-- 2. A recovery is a fallback that completed, never a failed deterministic response.
-- 3. Learner-visible failures remain actionable even when later calls succeed.

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
    v_upstream_failures bigint;
    v_recovered bigint;
    v_fallbacks bigint;
    v_cached bigint;
    v_served bigint;
    v_openrouter_deepseek bigint;
    v_openrouter_luna bigint;
    v_openrouter_gemini bigint;
    v_direct_deepseek bigint;
    v_gemini bigint;
    v_unknown bigint;
    v_cost numeric;
    v_cost_calls bigint;
    v_error_rate numeric;
    v_upstream_rate numeric;
    v_recovery_needs_review boolean;
    v_recovery_is_degraded boolean;
    v_status text;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_hours := LEAST(GREATEST(COALESCE(p_hours, 24), 1), 24 * 90);
    v_since := now() - make_interval(hours => v_hours);

    WITH tracked AS (
        SELECT
            request_metadata,
            COALESCE(request_metadata->>'reservationStatus', 'completed') AS res_status,
            COALESCE(request_metadata->>'cached', 'false') = 'true' AS is_cached,
            CASE
                WHEN NULLIF(btrim(request_metadata->>'provider'), '') IS NOT NULL
                    THEN btrim(request_metadata->>'provider')
                WHEN request_metadata->>'model' ILIKE 'google/gemini-%'
                    THEN 'openrouter-gemini'
                WHEN request_metadata->>'model' ILIKE '%gemini%'
                    THEN 'gemini'
                WHEN request_metadata->>'model' ILIKE 'deepseek/%'
                    THEN 'openrouter-deepseek'
                WHEN request_metadata->>'model' ILIKE '%deepseek%'
                    THEN 'deepseek'
                WHEN request_metadata->>'model' ILIKE 'openai/%luna%'
                    THEN 'openrouter-luna'
                ELSE NULL
            END AS provider,
            CASE
                WHEN request_metadata->>'estimatedProviderCostUsd'
                     ~ '^[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?$'
                THEN (request_metadata->>'estimatedProviderCostUsd')::numeric
                ELSE NULL
            END AS cost_usd
        FROM public.ai_api_usage
        WHERE created_at >= v_since
          AND endpoint IN (
              'evaluateGrammarTransfer',
              'generateAdaptiveLearningPath',
              'generateStudyRecommendations',
              'generateDetailedFeedback',
              'generateDetailedSpeakingFeedback',
              'evaluateSpeakingTest'
          )
    ),
    served_calls AS (
        SELECT * FROM tracked
        WHERE res_status NOT IN ('reserved', 'failed') AND NOT is_cached
    )
    SELECT
        (SELECT count(*) FROM tracked WHERE res_status <> 'reserved'),
        (SELECT count(*) FROM tracked
          WHERE (res_status = 'failed'
                 AND COALESCE(request_metadata->>'deterministicFallback', 'false') <> 'true')
             OR (res_status NOT IN ('reserved', 'failed')
                 AND NOT is_cached
                 AND request_metadata->>'fallbackUsed' = 'true')),
        (SELECT count(*) FROM served_calls
          WHERE request_metadata->>'fallbackUsed' = 'true'),
        (SELECT count(*) FROM tracked
          WHERE res_status = 'failed'
            AND COALESCE(request_metadata->>'deterministicFallback', 'false') <> 'true'),
        (SELECT count(*) FROM tracked WHERE request_metadata->>'fallbackUsed' = 'true'),
        (SELECT count(*) FROM tracked WHERE res_status <> 'reserved' AND is_cached),
        (SELECT count(*) FROM served_calls),
        (SELECT count(*) FROM served_calls WHERE provider = 'openrouter-deepseek'),
        (SELECT count(*) FROM served_calls WHERE provider = 'openrouter-luna'),
        (SELECT count(*) FROM served_calls WHERE provider = 'openrouter-gemini'),
        (SELECT count(*) FROM served_calls WHERE provider = 'deepseek'),
        (SELECT count(*) FROM served_calls WHERE provider = 'gemini'),
        (SELECT count(*) FROM served_calls
          WHERE provider IS NULL OR provider NOT IN
                ('openrouter-deepseek', 'openrouter-luna', 'openrouter-gemini',
                 'deepseek', 'gemini', 'cache')),
        (SELECT COALESCE(sum(cost_usd), 0) FROM tracked WHERE cost_usd IS NOT NULL),
        (SELECT count(*) FROM tracked
          WHERE res_status <> 'reserved' AND NOT is_cached AND cost_usd IS NOT NULL)
    INTO v_attempts, v_upstream_failures, v_recovered, v_errors, v_fallbacks, v_cached,
         v_served, v_openrouter_deepseek, v_openrouter_luna, v_openrouter_gemini,
         v_direct_deepseek, v_gemini, v_unknown, v_cost, v_cost_calls;

    v_error_rate := CASE WHEN v_attempts > 0 THEN 100.0 * v_errors / v_attempts ELSE 0 END;
    v_upstream_rate := CASE WHEN v_attempts > 0 THEN 100.0 * v_upstream_failures / v_attempts ELSE 0 END;

    v_recovery_is_degraded :=
        v_errors = 0 AND v_upstream_failures >= 3 AND v_upstream_rate >= 25;
    v_recovery_needs_review :=
        v_errors = 0 AND v_upstream_failures >= 3 AND v_upstream_rate >= 10
        AND NOT v_recovery_is_degraded;

    v_status := CASE
        WHEN v_attempts = 0 THEN 'idle'
        WHEN v_errors >= 3 AND v_error_rate >= 20 THEN 'down'
        WHEN v_errors > 0 THEN 'degraded'
        WHEN v_recovery_is_degraded THEN 'degraded'
        WHEN v_recovery_needs_review THEN 'attention'
        ELSE 'operational'
    END;

    RETURN jsonb_build_object(
        'generatedAt', now(),
        'windowHours', v_hours,
        'service', jsonb_build_object(
            'key', 'ai_text_providers',
            'label', 'Text AI Providers',
            'category', 'ai',
            'provider', 'OpenRouter (Luna, Gemini, DeepSeek) -> Direct (DeepSeek, Gemini)',
            'status', v_status,
            'source', 'ai_api_usage provider and recovery outcomes',
            'metrics', jsonb_build_object(
                'attempts', v_attempts,
                'errors', v_errors,
                'errorRate', round(v_error_rate, 1),
                'upstreamFailures', v_upstream_failures,
                'upstreamFailureRate', round(v_upstream_rate, 1),
                'recoveredFallbacks', v_recovered,
                'fallbacks', v_fallbacks,
                'cachedResponses', v_cached,
                'servedCalls', v_served,
                'openrouterCalls', v_openrouter_deepseek,
                'openrouterLunaCalls', v_openrouter_luna,
                'openrouterGeminiCalls', v_openrouter_gemini,
                'directDeepseekCalls', v_direct_deepseek,
                'geminiCalls', v_gemini,
                'unknownProviderCalls', v_unknown,
                'estimatedCostUsd', CASE WHEN v_cost_calls > 0 THEN round(v_cost, 6) END,
                'costedCalls', v_cost_calls
            ),
            'impact', CASE
                WHEN v_attempts = 0 THEN
                    'No text AI requests in this window; this is not proof of provider health.'
                WHEN v_errors > 0 THEN
                    v_errors || ' text AI request(s) failed with no usable result for the learner.'
                WHEN v_recovery_is_degraded THEN
                    v_upstream_failures || ' of ' || v_attempts ||
                    ' requests exhausted their provider chain. Learner delivery is currently succeeding, but provider reliability is degraded.'
                WHEN v_recovery_needs_review THEN
                    v_upstream_failures || ' of ' || v_attempts ||
                    ' requests exhausted their provider chain. Learner delivery is currently succeeding, but provider reliability needs review.'
                WHEN v_recovered > 0 THEN
                    v_recovered || ' request(s) recovered automatically through a fallback. No learner was blocked.'
                ELSE
                    'Text AI requests completed without a recorded provider failure.'
            END
        )
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_ai_provider_health(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_provider_health(integer) TO authenticated;

COMMENT ON FUNCTION public.get_ai_provider_health(integer) IS
'Admin-only text AI health. Providers are attributed by serving route; recoveredFallbacks counts completed fallback deliveries; learner-visible failures remain actionable.';

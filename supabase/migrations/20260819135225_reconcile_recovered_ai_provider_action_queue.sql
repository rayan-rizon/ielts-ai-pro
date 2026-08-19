-- Recovered provider events are audit evidence, not an open operational task.
--
-- A rate alone is unstable in a low-traffic window: two recovered events out
-- of seven requests rendered as "Needs action" even though the same payload
-- correctly said no learner was blocked and no action was required. Keep those
-- events in incident history, but require at least three recovered upstream
-- failures before asking an admin to investigate provider reliability.

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
    v_upstream_failures bigint;
    v_recovered bigint;
    v_errors bigint;
    v_fallbacks bigint;
    v_cached bigint;
    v_openrouter_deepseek bigint;
    v_openrouter_luna bigint;
    v_direct_deepseek bigint;
    v_gemini bigint;
    v_unknown bigint;
    v_cost numeric;
    v_error_rate numeric;
    v_upstream_rate numeric;
    v_recovery_needs_review boolean;
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
                WHEN request_metadata->>'model' ILIKE '%gemini%' THEN 'gemini'
                WHEN request_metadata->>'model' ILIKE 'deepseek/%' THEN 'openrouter-deepseek'
                WHEN request_metadata->>'model' ILIKE '%deepseek%' THEN 'deepseek'
                WHEN request_metadata->>'model' ILIKE 'openai/%luna%' THEN 'openrouter-luna'
                ELSE NULL
            END AS provider
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
    provider_calls AS (
        SELECT * FROM tracked WHERE res_status <> 'reserved' AND NOT is_cached
    )
    SELECT
        (SELECT count(*) FROM tracked WHERE res_status <> 'reserved'),
        (SELECT count(*) FROM tracked WHERE res_status = 'failed'),
        (SELECT count(*) FROM tracked
          WHERE res_status = 'failed'
            AND request_metadata->>'deterministicFallback' = 'true'),
        (SELECT count(*) FROM tracked
          WHERE res_status = 'failed'
            AND COALESCE(request_metadata->>'deterministicFallback', 'false') <> 'true'),
        (SELECT count(*) FROM tracked WHERE request_metadata->>'fallbackUsed' = 'true'),
        (SELECT count(*) FROM tracked WHERE res_status <> 'reserved' AND is_cached),
        (SELECT count(*) FROM provider_calls WHERE provider = 'openrouter-deepseek'),
        (SELECT count(*) FROM provider_calls WHERE provider = 'openrouter-luna'),
        (SELECT count(*) FROM provider_calls WHERE provider = 'deepseek'),
        (SELECT count(*) FROM provider_calls WHERE provider = 'gemini'),
        (SELECT count(*) FROM provider_calls
          WHERE provider IS NULL OR provider NOT IN
                ('openrouter-deepseek', 'openrouter-luna', 'deepseek', 'gemini', 'cache')),
        (SELECT COALESCE(sum(
            CASE
                WHEN request_metadata->>'estimatedProviderCostUsd' ~ '^[0-9]+(\.[0-9]+)?$'
                THEN (request_metadata->>'estimatedProviderCostUsd')::numeric
                ELSE 0
            END
         ), 0) FROM tracked)
    INTO v_attempts, v_upstream_failures, v_recovered, v_errors, v_fallbacks, v_cached,
         v_openrouter_deepseek, v_openrouter_luna, v_direct_deepseek, v_gemini,
         v_unknown, v_cost;

    v_error_rate := CASE WHEN v_attempts > 0 THEN 100.0 * v_errors / v_attempts ELSE 0 END;
    v_upstream_rate := CASE WHEN v_attempts > 0 THEN 100.0 * v_upstream_failures / v_attempts ELSE 0 END;
    -- This is deliberately the only recovery-actionability decision. Both the
    -- status and learner-impact copy below consume it, so they cannot disagree.
    v_recovery_needs_review :=
        v_errors = 0 AND v_upstream_failures >= 3 AND v_upstream_rate >= 10;

    v_status := CASE
        WHEN v_attempts = 0 THEN 'idle'
        WHEN v_errors >= 3 AND v_error_rate >= 20 THEN 'down'
        WHEN v_errors > 0 THEN 'degraded'
        WHEN v_upstream_failures >= 3 AND v_upstream_rate >= 25 THEN 'degraded'
        -- A small sample of self-healed requests belongs in incident evidence,
        -- not the action queue. The count gate makes this state actionable.
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
            'provider', 'OpenRouter (Luna, DeepSeek) -> Direct DeepSeek -> Gemini',
            'status', v_status,
            'source', 'ai_api_usage provider and recovery outcomes',
            'metrics', jsonb_build_object(
                'attempts', v_attempts,
                'errors', v_errors,
                'errorRate', round(v_error_rate, 1),
                'upstreamFailures', v_upstream_failures,
                'recoveredFallbacks', v_recovered,
                'fallbacks', v_fallbacks,
                'cachedResponses', v_cached,
                'openrouterCalls', v_openrouter_deepseek,
                'openrouterLunaCalls', v_openrouter_luna,
                'directDeepseekCalls', v_direct_deepseek,
                'geminiCalls', v_gemini,
                'unknownProviderCalls', v_unknown,
                'estimatedCostUsd', round(v_cost, 6)
            ),
            'impact', CASE
                WHEN v_attempts = 0 THEN
                    'No text AI requests in this window; this is not proof of provider health.'
                WHEN v_errors > 0 THEN
                    v_errors || ' text AI request(s) failed with no usable result for the learner.'
                WHEN v_recovery_needs_review THEN
                    v_upstream_failures || ' of ' || v_attempts ||
                    ' requests needed recovery. No learner was blocked, but provider reliability needs review.'
                WHEN v_recovered > 0 OR v_fallbacks > 0 THEN
                    GREATEST(v_recovered, v_fallbacks) ||
                    ' request(s) recovered automatically. No learner was blocked and no action is required.'
                ELSE
                    'Text AI requests completed without a recorded provider failure.'
            END
        )
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_ai_provider_health(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_provider_health(integer) TO authenticated;

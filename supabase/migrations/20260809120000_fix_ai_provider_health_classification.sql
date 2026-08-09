-- Text AI provider health: stop reporting a recovered failure as degradation,
-- and attribute calls to the provider that actually served them.
--
-- Two defects this replaces:
--
-- 1. Status. The old CASE degraded the service on
--    `v_errors > 0 OR v_upstream_failures > 0 OR v_fallbacks > 0`.
--    `v_upstream_failures` counts every failed reservation *including* the ones
--    that recovered, so a single self-healed blip rendered the panel as
--    DEGRADED while the same panel showed 0 errors, a 0% error rate, and an
--    impact line reading "learners were not blocked". A fallback firing is the
--    system working, not the system degrading. Degradation now requires either
--    unrecovered errors or a provider failing often enough to be genuinely
--    unreliable.
--
-- 2. Attribution. Provider buckets matched only 'openrouter-deepseek',
--    'deepseek' and 'gemini' against request_metadata->>'provider'. Several
--    endpoints never wrote that key at all (generateDetailedFeedback writes
--    only `model`, and it routes through OpenRouter Luna, which was not in the
--    list), so every call fell into "unknown provider" — 12 of 12 in
--    production. Provider is now resolved from the explicit key, falling back
--    to inferring it from the recorded model so historical rows attribute too,
--    and cache hits are excluded because they call no provider.

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
            COALESCE(request_metadata->>'cached', 'false') = 'true'       AS is_cached,
            -- Explicit provider wins; otherwise infer from the model string so
            -- rows written before providers were recorded still attribute.
            CASE
                WHEN NULLIF(btrim(request_metadata->>'provider'), '') IS NOT NULL
                    THEN btrim(request_metadata->>'provider')
                WHEN request_metadata->>'model' ILIKE '%gemini%'       THEN 'gemini'
                WHEN request_metadata->>'model' ILIKE 'deepseek/%'     THEN 'openrouter-deepseek'
                WHEN request_metadata->>'model' ILIKE '%deepseek%'     THEN 'deepseek'
                WHEN request_metadata->>'model' ILIKE 'openai/%luna%'  THEN 'openrouter-luna'
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
    -- Provider attribution only covers rows that actually reached a provider:
    -- a reservation still open has not called one, and a cache hit never will.
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

    v_error_rate    := CASE WHEN v_attempts > 0 THEN 100.0 * v_errors / v_attempts ELSE 0 END;
    v_upstream_rate := CASE WHEN v_attempts > 0 THEN 100.0 * v_upstream_failures / v_attempts ELSE 0 END;

    v_status := CASE
        WHEN v_attempts = 0 THEN 'idle'
        -- Unrecovered failures are the only thing a learner actually feels.
        WHEN v_errors >= 3 AND v_error_rate >= 20 THEN 'down'
        WHEN v_errors > 0 THEN 'degraded'
        -- Everything recovered, but a provider failing this often is a real
        -- reliability problem worth surfacing even though nobody was blocked.
        WHEN v_upstream_failures >= 3 AND v_upstream_rate >= 25 THEN 'degraded'
        -- Recovered, and often enough to be worth a look.
        WHEN v_upstream_failures > 0 AND v_upstream_rate >= 10 THEN 'attention'
        -- Recovered and rare. 'attention' renders as "Needs action", which is
        -- false for a self-healed blip — the recovery counts and the impact
        -- line below still carry the detail without raising a flag nobody can
        -- act on.
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
                WHEN v_upstream_failures >= 3 AND v_upstream_rate >= 25 THEN
                    v_upstream_failures || ' of ' || v_attempts ||
                    ' requests needed recovery. Learners were not blocked, but a provider is failing often enough to investigate.'
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

-- Fix three defects in get_ai_provider_health that made the "Text AI Providers"
-- card contradict itself. Observed live: status DEGRADED next to "0% ERROR
-- RATE", the copy "No learner was blocked", "GEMINI CALLS 3" for requests
-- Gemini never served, and "EST. COST $0.000000" over seven real provider calls.
--
-- 1. Status and impact copy disagreed. The function documents
--    v_recovery_needs_review as the single recovery-actionability decision that
--    both consume, but the branch above it (upstream_failures >= 3 AND rate
--    >= 25) shadowed it. Any recovery rate at or above 25% therefore rendered
--    the DEGRADED badge with the "attention" copy. Recovery pressure now has
--    two explicit named gates and status and copy read the same ones, so they
--    cannot drift apart again.
--
-- 2. The provider breakdown counted failures as calls served. On a failed row
--    `provider` records *which provider failed*, not who answered, so three
--    whole-chain failures were displayed as three Gemini calls. Served counts
--    now exclude failed rows; attempts = served + failed + cached, which is a
--    sum an operator can actually check on the card.
--
-- 3. Cost was silently unrecordable. Rows that carry no
--    estimatedProviderCostUsd summed to 0 and rendered as a measured
--    "$0.000000". The function now reports how many calls carried a cost, so
--    the panel can say "not recorded" instead of inventing a zero. The numeric
--    guard also accepts scientific notation, which JSON.stringify emits below
--    1e-6 and the old regex silently dropped.

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
                WHEN request_metadata->>'model' ILIKE '%gemini%' THEN 'gemini'
                WHEN request_metadata->>'model' ILIKE 'deepseek/%' THEN 'openrouter-deepseek'
                WHEN request_metadata->>'model' ILIKE '%deepseek%' THEN 'deepseek'
                WHEN request_metadata->>'model' ILIKE 'openai/%luna%' THEN 'openrouter-luna'
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
    -- Calls that actually produced a result. A failed row's `provider` names
    -- the provider that failed, so counting it here would credit an outage as
    -- service delivered.
    served_calls AS (
        SELECT * FROM tracked
        WHERE res_status NOT IN ('reserved', 'failed') AND NOT is_cached
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
        (SELECT count(*) FROM served_calls),
        (SELECT count(*) FROM served_calls WHERE provider = 'openrouter-deepseek'),
        (SELECT count(*) FROM served_calls WHERE provider = 'openrouter-luna'),
        (SELECT count(*) FROM served_calls WHERE provider = 'deepseek'),
        (SELECT count(*) FROM served_calls WHERE provider = 'gemini'),
        (SELECT count(*) FROM served_calls
          WHERE provider IS NULL OR provider NOT IN
                ('openrouter-deepseek', 'openrouter-luna', 'deepseek', 'gemini', 'cache')),
        (SELECT COALESCE(sum(cost_usd), 0) FROM tracked WHERE cost_usd IS NOT NULL),
        (SELECT count(*) FROM tracked
          WHERE res_status <> 'reserved' AND NOT is_cached AND cost_usd IS NOT NULL)
    INTO v_attempts, v_upstream_failures, v_recovered, v_errors, v_fallbacks, v_cached,
         v_served, v_openrouter_deepseek, v_openrouter_luna, v_direct_deepseek,
         v_gemini, v_unknown, v_cost, v_cost_calls;

    v_error_rate := CASE WHEN v_attempts > 0 THEN 100.0 * v_errors / v_attempts ELSE 0 END;
    v_upstream_rate := CASE WHEN v_attempts > 0 THEN 100.0 * v_upstream_failures / v_attempts ELSE 0 END;

    -- The only two recovery-pressure decisions in this function. Status and the
    -- learner-impact copy below both read these and nothing else, so a badge
    -- can never again carry copy from a different severity.
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
                'upstreamFailureRate', round(v_upstream_rate, 1),
                'recoveredFallbacks', v_recovered,
                'fallbacks', v_fallbacks,
                'cachedResponses', v_cached,
                'servedCalls', v_served,
                'openrouterCalls', v_openrouter_deepseek,
                'openrouterLunaCalls', v_openrouter_luna,
                'directDeepseekCalls', v_direct_deepseek,
                'geminiCalls', v_gemini,
                'unknownProviderCalls', v_unknown,
                -- Null, not zero, when nothing recorded a cost. The panel must
                -- be able to say "not recorded" rather than assert $0.
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
                    ' requests fell through to a deterministic fallback. Learners still got a result, but the AI chain is failing at ' ||
                    round(v_upstream_rate, 1) || '% and is not delivering AI output.'
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

COMMENT ON FUNCTION public.get_ai_provider_health(integer) IS
'Admin-only telemetry view of text AI provider routing and recovery outcomes. Served-call counts exclude failures so the provider breakdown never credits an outage as delivery; estimatedCostUsd is null when no call recorded a cost.';

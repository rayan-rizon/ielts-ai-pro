-- Correct the admin Health contract so service severity matches learner impact.
--
-- Previously the scoring service counted adaptive-learning requests, while the
-- provider service counted the same recovered deterministic fallbacks as hard
-- failures. That produced two red cards for the same nine non-blocking events.
-- Keep provider instability visible, but do not report a learner-facing outage
-- when the application returned its deterministic fallback successfully.

ALTER FUNCTION public.get_platform_health(integer)
    RENAME TO get_platform_health_core_v7;
REVOKE ALL ON FUNCTION public.get_platform_health_core_v7(integer)
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
    v_since timestamptz;
    v_hours integer;
    v_attempts bigint;
    v_errors bigint;
    v_rate numeric;
    v_status text;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_hours := LEAST(GREATEST(COALESCE(p_hours, 24), 1), 24 * 90);
    v_since := now() - make_interval(hours => v_hours);
    v_base := public.get_platform_health_core_v7(v_hours);

    SELECT
        count(*) FILTER (
            WHERE COALESCE(request_metadata->>'reservationStatus', 'completed') <> 'reserved'
        ),
        count(*) FILTER (WHERE request_metadata->>'reservationStatus' = 'failed')
    INTO v_attempts, v_errors
    FROM public.ai_api_usage
    WHERE created_at >= v_since
      AND endpoint IN (
          'evaluateGrammarTransfer',
          'generateDetailedFeedback',
          'generateDetailedSpeakingFeedback',
          'evaluateSpeakingTest'
      );

    v_rate := CASE WHEN v_attempts > 0 THEN 100.0 * v_errors / v_attempts ELSE 0 END;
    v_status := CASE
        WHEN v_attempts = 0 THEN 'idle'
        WHEN v_attempts >= 5 AND v_rate >= 20 THEN 'down'
        WHEN v_errors > 0 THEN 'degraded'
        ELSE 'operational'
    END;

    SELECT COALESCE(jsonb_agg(
        CASE
            WHEN service->>'key' = 'ai_feedback' THEN
                service || jsonb_build_object(
                    'status', v_status,
                    'source', 'ai_api_usage scoring outcomes only',
                    'metrics', jsonb_build_object(
                        'attempts', v_attempts,
                        'errors', v_errors,
                        'errorRate', round(v_rate, 1)
                    ),
                    'impact', CASE
                        WHEN v_attempts = 0 THEN
                            'No learner scoring requests completed in this window; this is not proof of provider health.'
                        WHEN v_errors > 0 THEN
                            v_errors || ' learner scoring request(s) failed.'
                        ELSE
                            'Learner scoring requests completed normally.'
                    END
                )
            WHEN service->>'key' = 'speech_synthesis' THEN
                jsonb_set(
                    service || jsonb_build_object(
                        'label', 'Examiner Voice (new audio)',
                        'source', 'ai_api_usage synthesizeSpeech rows (cache misses only)',
                        'impact', CASE
                            WHEN COALESCE((service->'metrics'->>'attempts')::bigint, 0) = 0 THEN
                                'No new examiner audio was synthesised in this window. Repeated prompts play from cache without recording usage, so this does not mean the examiner voice was silent.'
                            WHEN COALESCE((service->'metrics'->>'errors')::bigint, 0) > 0 THEN
                                (service->'metrics'->>'errors') ||
                                ' synthesis attempt(s) failed and fell back to browser speech. Already-cached prompts are unaffected.'
                            ELSE
                                'Every newly synthesised examiner phrase completed. Cached playback is served without a usage row and is not counted here.'
                        END
                    ),
                    '{metrics}',
                    (service->'metrics') - 'cacheHits',
                    true
                )
            ELSE service
        END
    ), '[]'::jsonb)
    INTO v_services
    FROM jsonb_array_elements(COALESCE(v_base->'services', '[]'::jsonb)) service;

    v_base := jsonb_set(v_base, '{services}', v_services, true);
    v_base := jsonb_set(v_base, '{contractVersion}', '8'::jsonb, true);
    RETURN v_base;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health(integer) TO authenticated;

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
    v_openrouter bigint;
    v_direct_deepseek bigint;
    v_gemini bigint;
    v_unknown bigint;
    v_cost numeric;
    v_error_rate numeric;
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
        count(*) FILTER (WHERE request_metadata->>'reservationStatus' = 'failed'),
        count(*) FILTER (
            WHERE request_metadata->>'reservationStatus' = 'failed'
              AND request_metadata->>'deterministicFallback' = 'true'
        ),
        count(*) FILTER (
            WHERE request_metadata->>'reservationStatus' = 'failed'
              AND COALESCE(request_metadata->>'deterministicFallback', 'false') <> 'true'
        ),
        count(*) FILTER (WHERE request_metadata->>'fallbackUsed' = 'true'),
        count(*) FILTER (WHERE request_metadata->>'provider' = 'openrouter-deepseek'),
        count(*) FILTER (WHERE request_metadata->>'provider' = 'deepseek'),
        count(*) FILTER (WHERE request_metadata->>'provider' = 'gemini'),
        count(*) FILTER (WHERE NULLIF(btrim(request_metadata->>'provider'), '') IS NULL),
        COALESCE(sum(
            CASE
                WHEN request_metadata->>'estimatedProviderCostUsd' ~ '^[0-9]+(\.[0-9]+)?$'
                THEN (request_metadata->>'estimatedProviderCostUsd')::numeric
                ELSE 0
            END
        ), 0)
    INTO v_attempts, v_upstream_failures, v_recovered, v_errors, v_fallbacks,
         v_openrouter, v_direct_deepseek, v_gemini, v_unknown, v_cost
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

    v_error_rate := CASE WHEN v_attempts > 0 THEN 100.0 * v_errors / v_attempts ELSE 0 END;
    v_status := CASE
        WHEN v_attempts = 0 THEN 'idle'
        WHEN v_errors >= 3 AND v_error_rate >= 20 THEN 'down'
        WHEN v_errors > 0 OR v_upstream_failures > 0 OR v_fallbacks > 0 THEN 'degraded'
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
            'source', 'ai_api_usage provider and recovery outcomes',
            'metrics', jsonb_build_object(
                'attempts', v_attempts,
                'errors', v_errors,
                'errorRate', round(v_error_rate, 1),
                'upstreamFailures', v_upstream_failures,
                'recoveredFallbacks', v_recovered,
                'fallbacks', v_fallbacks,
                'openrouterCalls', v_openrouter,
                'directDeepseekCalls', v_direct_deepseek,
                'geminiCalls', v_gemini,
                'unknownProviderCalls', v_unknown,
                'estimatedCostUsd', round(v_cost, 6)
            ),
            'impact', CASE
                WHEN v_attempts = 0 THEN
                    'No text AI requests in this window; this is not proof of provider health.'
                WHEN v_errors > 0 THEN
                    v_errors || ' text AI request(s) failed without a usable fallback.'
                WHEN v_recovered > 0 THEN
                    v_recovered || ' provider failure(s) recovered with a deterministic result; learners were not blocked.'
                WHEN v_fallbacks > 0 THEN
                    v_fallbacks || ' request(s) recovered through a fallback provider.'
                ELSE
                    'Text AI requests completed without a recorded provider failure.'
            END
        )
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_ai_provider_health(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_provider_health(integer) TO authenticated;

-- Rebuild AI incident classification from the source rows. The older wrapper
-- discarded endpoint identity by grouping all text failures as ai_feedback.
ALTER FUNCTION public.get_platform_health_incidents(integer, integer)
    RENAME TO get_platform_health_incidents_core_v4;
REVOKE ALL ON FUNCTION public.get_platform_health_incidents_core_v4(integer, integer)
    FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_platform_health_incidents(
    p_hours integer DEFAULT 24,
    p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_since timestamptz;
    v_core jsonb;
    v_result jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_since := now() - make_interval(hours => LEAST(GREATEST(COALESCE(p_hours, 24), 1), 24 * 90));
    v_core := public.get_platform_health_incidents_core_v4(p_hours, p_limit);

    SELECT COALESCE(jsonb_agg(to_jsonb(i) ORDER BY i.last_seen DESC, i.occurrences DESC), '[]'::jsonb)
    INTO v_result
    FROM (
        SELECT service, left(message, 500) AS message, occurrences, last_seen, first_seen
        FROM jsonb_to_recordset(v_core) AS c(
            service text,
            message text,
            occurrences bigint,
            last_seen timestamptz,
            first_seen timestamptz
        )
        WHERE service <> 'ai_feedback'

        UNION ALL

        SELECT
            CASE
                WHEN endpoint IN ('generateAdaptiveLearningPath', 'generateStudyRecommendations')
                    THEN 'ai_text_providers'
                ELSE 'ai_feedback'
            END,
            left(COALESCE(
                NULLIF(btrim(request_metadata->>'fallbackReason'), ''),
                NULLIF(btrim(request_metadata->>'failureReason'), ''),
                CASE
                    WHEN request_metadata->>'deterministicFallback' = 'true'
                        THEN 'Provider request failed; deterministic fallback returned a usable result'
                    ELSE 'AI request failed without a usable fallback'
                END
            ), 500),
            count(*),
            max(created_at),
            min(created_at)
        FROM public.ai_api_usage
        WHERE created_at >= v_since
          AND request_metadata->>'reservationStatus' = 'failed'
          AND endpoint IN (
              'evaluateGrammarTransfer',
              'generateAdaptiveLearningPath',
              'generateStudyRecommendations',
              'generateDetailedFeedback',
              'generateDetailedSpeakingFeedback',
              'evaluateSpeakingTest'
          )
        GROUP BY 1, 2

        ORDER BY last_seen DESC, occurrences DESC
        LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200)
    ) i;

    RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health_incidents(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health_incidents(integer, integer) TO authenticated;

COMMENT ON FUNCTION public.get_platform_health(integer) IS
'Admin-only evidence-based service health. Scoring excludes adaptive-learning fallbacks and timestamps remain exact timestamptz values.';
COMMENT ON FUNCTION public.get_ai_provider_health(integer) IS
'Admin-only text provider telemetry. Recovered deterministic fallbacks are degraded provider events, not learner-blocking errors.';
COMMENT ON FUNCTION public.get_platform_health_incidents(integer, integer) IS
'Admin-only incident evidence with exact first_seen and last_seen timestamps and corrected AI service ownership.';

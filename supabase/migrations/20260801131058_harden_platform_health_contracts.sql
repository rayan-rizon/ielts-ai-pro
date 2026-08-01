-- Evidence-based platform health contracts.
--
-- Each status is derived from the persisted result of a real learner/admin
-- flow. "Idle" means there was no traffic to judge; it is deliberately not
-- treated as proof that a provider is healthy.

-- Finalization is a single database statement so concurrent idempotent callers
-- cannot lose metadata between a client-side read and update.
CREATE OR REPLACE FUNCTION public.finalize_ai_api_usage(
    p_reservation_id uuid,
    p_tokens_used integer DEFAULT 0,
    p_cached boolean DEFAULT false,
    p_metadata jsonb DEFAULT '{}'::jsonb,
    p_status text DEFAULT 'completed'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $function$
DECLARE
    v_updated bigint;
BEGIN
    IF p_status NOT IN ('completed', 'failed') THEN
        RAISE EXCEPTION 'invalid reservation status' USING ERRCODE = '22023';
    END IF;

    UPDATE public.ai_api_usage
    SET cached = COALESCE(p_cached, false),
        tokens_used = GREATEST(COALESCE(p_tokens_used, 0), 0),
        request_metadata = COALESCE(request_metadata, '{}'::jsonb)
            || COALESCE(p_metadata, '{}'::jsonb)
            || jsonb_build_object(
                'reservationStatus', p_status,
                'finalizedAt', now()
            )
    WHERE id = p_reservation_id
      AND request_metadata->>'reservationStatus' = 'reserved';
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 1 THEN
        RETURN true;
    END IF;

    -- Idempotent retries are successful but must never overwrite or downgrade
    -- an already-settled record.
    RETURN EXISTS (
        SELECT 1 FROM public.ai_api_usage
        WHERE id = p_reservation_id
          AND request_metadata->>'reservationStatus' IN ('completed', 'failed')
    );
END;
$function$;

ALTER FUNCTION public.finalize_ai_api_usage(uuid, integer, boolean, jsonb, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.finalize_ai_api_usage(uuid, integer, boolean, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_ai_api_usage(uuid, integer, boolean, jsonb, text) FROM anon;
REVOKE ALL ON FUNCTION public.finalize_ai_api_usage(uuid, integer, boolean, jsonb, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_ai_api_usage(uuid, integer, boolean, jsonb, text) TO service_role;

CREATE INDEX IF NOT EXISTS idx_ai_api_usage_unsettled_created_at
ON public.ai_api_usage (created_at)
WHERE request_metadata->>'reservationStatus' = 'reserved';

CREATE INDEX IF NOT EXISTS idx_stripe_events_processed_at_status
ON public.stripe_events (processed_at DESC, status);

CREATE OR REPLACE FUNCTION public.get_platform_health(p_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_since timestamptz;
    v_services jsonb := '[]'::jsonb;
    v_hours integer;
    v_status text;
    v_rate numeric;

    v_t_attempts bigint; v_t_errors bigint; v_t_fallbacks bigint; v_t_loss bigint; v_t_p95 numeric;
    v_p_requested bigint; v_p_completed bigint; v_p_errors bigint; v_p_config bigint; v_p_p95 numeric;
    v_s_attempts bigint; v_s_errors bigint; v_s_cached bigint;
    v_a_attempts bigint; v_a_errors bigint; v_a_cached bigint; v_a_pending bigint;
    v_stuck bigint; v_stuck_users bigint; v_oldest_stuck_minutes numeric;
    v_stripe_events bigint; v_stripe_processed bigint; v_stripe_failed bigint;
    v_stripe_paid bigint; v_stripe_amount numeric;
    v_manual_pending bigint; v_manual_paid bigint; v_manual_oldest_hours numeric;
    v_db_size text; v_connections integer; v_max_connections integer; v_connection_pct numeric;
    v_signups bigint; v_active_users bigint; v_sessions bigint; v_logged_errors bigint;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_hours := LEAST(GREATEST(COALESCE(p_hours, 24), 1), 24 * 90);
    v_since := now() - make_interval(hours => v_hours);

    -- Speech-to-text: observe actual persisted transcription outcomes.
    SELECT
        count(*),
        count(*) FILTER (
            WHERE request_metadata->>'reservationStatus' = 'failed'
               OR request_metadata->>'transcriptionFailed' = 'true'
               OR NULLIF(btrim(COALESCE(request_metadata->>'transcriptionError', '')), '') IS NOT NULL
        ),
        count(*) FILTER (WHERE request_metadata->>'transcriptionProvider' = 'gemini-fallback'),
        count(*) FILTER (
            WHERE request_metadata->>'transcriptionProvider' = 'none'
               OR request_metadata->>'transcriptionFailed' = 'true'
        ),
        percentile_cont(0.95) WITHIN GROUP (
            ORDER BY (request_metadata->>'transcriptionLatencyMs')::numeric
        ) FILTER (WHERE jsonb_typeof(request_metadata->'transcriptionLatencyMs') = 'number')
    INTO v_t_attempts, v_t_errors, v_t_fallbacks, v_t_loss, v_t_p95
    FROM public.ai_api_usage
    WHERE created_at >= v_since
      AND endpoint IN ('transcribeAudio', 'processSpeakingSession')
      AND COALESCE(request_metadata->>'reservationStatus', 'completed') <> 'reserved';

    v_rate := CASE WHEN v_t_attempts > 0 THEN 100.0 * v_t_errors / v_t_attempts ELSE 0 END;
    v_status := CASE
        WHEN v_t_attempts = 0 THEN 'idle'
        WHEN v_t_loss >= 3 OR (v_t_attempts >= 5 AND v_rate >= 25) THEN 'down'
        WHEN v_t_errors > 0 OR (v_t_attempts >= 5 AND 100.0 * v_t_fallbacks / v_t_attempts >= 25) THEN 'degraded'
        ELSE 'operational'
    END;
    v_services := v_services || jsonb_build_object(
        'key', 'speech_transcription', 'label', 'Speech-to-Text', 'category', 'ai',
        'provider', 'Cloudflare Whisper -> Gemini fallback', 'status', v_status,
        'source', 'ai_api_usage transcription outcomes',
        'metrics', jsonb_build_object('attempts', v_t_attempts, 'errors', v_t_errors,
            'errorRate', round(v_rate, 1), 'fallbacks', v_t_fallbacks,
            'unrecoverable', v_t_loss, 'p95LatencyMs', round(COALESCE(v_t_p95, 0))),
        'impact', CASE
            WHEN v_t_loss > 0 THEN v_t_loss || ' answer(s) produced no usable transcript.'
            WHEN v_t_errors > 0 THEN v_t_errors || ' transcription attempt(s) reported an error.'
            WHEN v_t_fallbacks > 0 THEN v_t_fallbacks || ' request(s) recovered through Gemini fallback.'
            WHEN v_t_attempts = 0 THEN 'No completed transcription attempts in this window.'
            ELSE 'Completed transcription attempts succeeded without fallback.' END
    );

    -- Pronunciation scoring: requested versus completed is the contract.
    SELECT
        count(*) FILTER (WHERE request_metadata->>'pronunciationRequested' = 'true'),
        count(*) FILTER (WHERE request_metadata->>'pronunciationRequested' = 'true'
                          AND request_metadata->>'pronunciationCompleted' = 'true'),
        count(*) FILTER (WHERE request_metadata->>'pronunciationRequested' = 'true'
                          AND NULLIF(btrim(COALESCE(request_metadata->>'pronunciationError', '')), '') IS NOT NULL),
        count(*) FILTER (WHERE request_metadata->>'pronunciationRequested' = 'true'
                          AND request_metadata->>'pronunciationError' ILIKE '%not configured%'),
        percentile_cont(0.95) WITHIN GROUP (
            ORDER BY (request_metadata->>'pronunciationLatencyMs')::numeric
        ) FILTER (WHERE request_metadata->>'pronunciationRequested' = 'true'
                    AND jsonb_typeof(request_metadata->'pronunciationLatencyMs') = 'number')
    INTO v_p_requested, v_p_completed, v_p_errors, v_p_config, v_p_p95
    FROM public.ai_api_usage
    WHERE created_at >= v_since;

    v_rate := CASE WHEN v_p_requested > 0 THEN 100.0 * v_p_completed / v_p_requested ELSE 0 END;
    v_status := CASE
        WHEN v_p_config > 0 THEN 'unconfigured'
        WHEN v_p_requested = 0 THEN 'idle'
        WHEN v_p_requested >= 3 AND v_rate < 60 THEN 'down'
        WHEN v_p_errors > 0 OR v_rate < 90 THEN 'degraded'
        ELSE 'operational'
    END;
    v_services := v_services || jsonb_build_object(
        'key', 'pronunciation_assessment', 'label', 'Pronunciation Scoring', 'category', 'ai',
        'provider', 'Azure Speech', 'status', v_status,
        'source', 'ai_api_usage pronunciation outcomes',
        'metrics', jsonb_build_object('requested', v_p_requested, 'completed', v_p_completed,
            'completionRate', round(v_rate, 1), 'errors', v_p_errors,
            'credentialErrors', v_p_config, 'p95LatencyMs', round(COALESCE(v_p_p95, 0))),
        'impact', CASE
            WHEN v_p_config > 0 THEN 'Azure Speech configuration was missing or rejected.'
            WHEN v_p_requested = 0 THEN 'No pronunciation scoring was requested in this window.'
            WHEN v_p_requested > v_p_completed THEN (v_p_requested - v_p_completed) || ' request(s) returned no score.'
            ELSE 'Every requested pronunciation assessment completed.' END
    );

    -- Text-to-speech: failures include explicit browser-fallback responses.
    SELECT count(*),
           count(*) FILTER (WHERE request_metadata->>'reservationStatus' = 'failed'
                              OR request_metadata->>'ttsFallback' = 'true'),
           count(*) FILTER (WHERE cached)
    INTO v_s_attempts, v_s_errors, v_s_cached
    FROM public.ai_api_usage
    WHERE created_at >= v_since AND endpoint = 'synthesizeSpeech'
      AND COALESCE(request_metadata->>'reservationStatus', 'completed') <> 'reserved';
    v_rate := CASE WHEN v_s_attempts > 0 THEN 100.0 * v_s_errors / v_s_attempts ELSE 0 END;
    v_status := CASE
        WHEN v_s_attempts = 0 THEN 'idle'
        WHEN v_s_attempts >= 5 AND v_rate >= 25 THEN 'down'
        WHEN v_s_errors > 0 THEN 'degraded'
        ELSE 'operational' END;
    v_services := v_services || jsonb_build_object(
        'key', 'speech_synthesis', 'label', 'Examiner Voice (TTS)', 'category', 'ai',
        'provider', 'Google TTS', 'status', v_status, 'source', 'ai_api_usage TTS outcomes',
        'metrics', jsonb_build_object('attempts', v_s_attempts, 'errors', v_s_errors,
            'errorRate', round(v_rate, 1), 'cacheHits', v_s_cached),
        'impact', CASE WHEN v_s_attempts = 0 THEN 'No completed TTS attempts in this window.'
            WHEN v_s_errors > 0 THEN v_s_errors || ' prompt(s) fell back to browser speech or failed.'
            ELSE 'Examiner audio completed normally.' END
    );

    -- AI scoring: include both reservation-backed and explicit usage rows.
    SELECT count(*) FILTER (WHERE COALESCE(request_metadata->>'reservationStatus', 'completed') <> 'reserved'),
           count(*) FILTER (WHERE request_metadata->>'reservationStatus' = 'failed'),
           count(*) FILTER (WHERE cached),
           count(*) FILTER (WHERE request_metadata->>'reservationStatus' = 'reserved'
                              AND created_at >= now() - interval '1 hour')
    INTO v_a_attempts, v_a_errors, v_a_cached, v_a_pending
    FROM public.ai_api_usage
    WHERE created_at >= v_since
      AND endpoint IN ('generateDetailedFeedback', 'generateDetailedSpeakingFeedback',
          'evaluateSpeakingTest', 'evaluateGrammarTransfer',
          'generateAdaptiveLearningPath', 'generateStudyRecommendations');
    v_rate := CASE WHEN v_a_attempts > 0 THEN 100.0 * v_a_errors / v_a_attempts ELSE 0 END;
    v_status := CASE WHEN v_a_attempts = 0 AND v_a_pending = 0 THEN 'idle'
        WHEN v_a_attempts >= 5 AND v_rate >= 20 THEN 'down'
        WHEN v_a_errors > 0 THEN 'degraded' ELSE 'operational' END;
    v_services := v_services || jsonb_build_object(
        'key', 'ai_feedback', 'label', 'AI Feedback & Scoring', 'category', 'ai',
        'provider', 'Gemini', 'status', v_status, 'source', 'ai_api_usage scoring outcomes',
        'metrics', jsonb_build_object('attempts', v_a_attempts, 'errors', v_a_errors,
            'errorRate', round(v_rate, 1), 'cacheHits', v_a_cached, 'inFlight', v_a_pending),
        'impact', CASE WHEN v_a_attempts = 0 AND v_a_pending = 0 THEN 'No scoring requests in this window.'
            WHEN v_a_errors > 0 THEN v_a_errors || ' scoring request(s) failed.'
            WHEN v_a_pending > 0 THEN v_a_pending || ' scoring request(s) are currently in flight.'
            ELSE 'Scoring requests completed normally.' END
    );

    -- Stuck reservations are an all-time backlog, independent of chart window.
    SELECT count(*), count(DISTINCT user_id),
           extract(epoch FROM (now() - min(created_at))) / 60
    INTO v_stuck, v_stuck_users, v_oldest_stuck_minutes
    FROM public.ai_api_usage
    WHERE request_metadata->>'reservationStatus' = 'reserved'
      AND created_at < now() - interval '1 hour';
    v_status := CASE WHEN v_stuck = 0 THEN 'operational'
        WHEN v_stuck >= 10 OR COALESCE(v_oldest_stuck_minutes, 0) >= 24 * 60 THEN 'down'
        ELSE 'degraded' END;
    v_services := v_services || jsonb_build_object(
        'key', 'ai_quota_reservations', 'label', 'AI Quota Reservations', 'category', 'ai',
        'provider', 'Internal', 'status', v_status, 'source', 'unsettled ai_api_usage reservations',
        'metrics', jsonb_build_object('stuck', v_stuck, 'usersAffected', v_stuck_users,
            'oldestStuckMinutes', round(COALESCE(v_oldest_stuck_minutes, 0))),
        'impact', CASE WHEN v_stuck = 0 THEN 'All quota reservations settled.'
            ELSE v_stuck || ' reservation(s) across ' || v_stuck_users || ' learner(s) remain unsettled.' END
    );

    -- Stripe: only failed event processing is a fault. Non-payment webhook
    -- types legitimately do not create payment rows.
    SELECT count(*),
           count(*) FILTER (WHERE status = 'processed'),
           count(*) FILTER (WHERE status = 'failed')
    INTO v_stripe_events, v_stripe_processed, v_stripe_failed
    FROM public.stripe_events WHERE processed_at >= v_since;
    SELECT count(*), COALESCE(sum(amount), 0)
    INTO v_stripe_paid, v_stripe_amount
    FROM public.payment_requests
    WHERE created_at >= v_since AND lower(payment_method) = 'stripe' AND status = 'approved';
    v_rate := CASE WHEN v_stripe_events > 0 THEN 100.0 * v_stripe_failed / v_stripe_events ELSE 0 END;
    v_status := CASE WHEN v_stripe_events = 0 AND v_stripe_paid = 0 THEN 'idle'
        WHEN v_stripe_events >= 3 AND v_rate >= 25 THEN 'down'
        WHEN v_stripe_failed > 0 THEN 'degraded' ELSE 'operational' END;
    v_services := v_services || jsonb_build_object(
        'key', 'payments_stripe', 'label', 'Card Payments', 'category', 'payments',
        'provider', 'Stripe', 'status', v_status, 'source', 'stripe_events and payment_requests',
        'metrics', jsonb_build_object('webhookEvents', v_stripe_events,
            'processedEvents', v_stripe_processed, 'failedEvents', v_stripe_failed,
            'eventFailureRate', round(v_rate, 1), 'recordedPayments', v_stripe_paid,
            'recordedAmount', v_stripe_amount),
        'impact', CASE WHEN v_stripe_events = 0 AND v_stripe_paid = 0 THEN 'No Stripe activity in this window.'
            WHEN v_stripe_failed > 0 THEN v_stripe_failed || ' Stripe event(s) failed processing.'
            ELSE 'Observed Stripe events processed without recorded failures.' END
    );

    -- Manual payments: backlog is all-time; throughput is window-scoped.
    SELECT count(*) FILTER (WHERE status = 'pending'),
           count(*) FILTER (WHERE status = 'approved' AND lower(payment_method) <> 'stripe'
                              AND created_at >= v_since),
           extract(epoch FROM (now() - min(created_at) FILTER (WHERE status = 'pending'))) / 3600
    INTO v_manual_pending, v_manual_paid, v_manual_oldest_hours
    FROM public.payment_requests;
    v_status := CASE WHEN v_manual_pending = 0 THEN 'operational'
        WHEN COALESCE(v_manual_oldest_hours, 0) > 48 THEN 'down'
        WHEN COALESCE(v_manual_oldest_hours, 0) > 12 THEN 'degraded' ELSE 'attention' END;
    v_services := v_services || jsonb_build_object(
        'key', 'payments_manual', 'label', 'Manual Payments (bKash/Nagad)', 'category', 'payments',
        'provider', 'Admin review', 'status', v_status, 'source', 'payment_requests review queue',
        'metrics', jsonb_build_object('pending', v_manual_pending, 'approvedInWindow', v_manual_paid,
            'oldestPendingHours', round(COALESCE(v_manual_oldest_hours, 0), 1)),
        'impact', CASE WHEN v_manual_pending = 0 THEN 'No payment requests are waiting for review.'
            ELSE v_manual_pending || ' request(s) await review; oldest is ' ||
                 round(COALESCE(v_manual_oldest_hours, 0), 1) || ' hours old.' END
    );

    -- Content readiness requires an active passage, questions, and listening
    -- audio where applicable—not merely an is_active flag.
    v_services := v_services || (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'key', 'content_' || c.test_type,
            'label', initcap(c.test_type) || ' Content', 'category', 'content',
            'provider', 'Test library',
            'status', CASE WHEN c.ready_passages = 0 THEN 'down'
                           WHEN c.broken_passages > 0 OR c.ready_passages < 3 THEN 'degraded'
                           ELSE 'operational' END,
            'source', 'active passages with required questions and audio',
            'metrics', jsonb_build_object('activePassages', c.active_passages,
                'readyPassages', c.ready_passages, 'brokenPassages', c.broken_passages,
                'sessionsInWindow', c.sessions),
            'impact', CASE WHEN c.ready_passages = 0 THEN 'No learner-ready ' || c.test_type || ' tests are available.'
                WHEN c.broken_passages > 0 THEN c.broken_passages || ' active test(s) are missing questions or required audio.'
                ELSE c.ready_passages || ' learner-ready tests are available.' END
        ) ORDER BY c.test_type), '[]'::jsonb)
        FROM (
            SELECT m.test_type,
                count(p.id) FILTER (WHERE p.is_active) AS active_passages,
                count(p.id) FILTER (WHERE p.is_active
                    AND EXISTS (SELECT 1 FROM public.questions q WHERE q.passage_id = p.id)
                    AND (m.test_type <> 'listening' OR NULLIF(btrim(p.audio_url), '') IS NOT NULL)) AS ready_passages,
                count(p.id) FILTER (WHERE p.is_active AND (
                    NOT EXISTS (SELECT 1 FROM public.questions q WHERE q.passage_id = p.id)
                    OR (m.test_type = 'listening' AND NULLIF(btrim(p.audio_url), '') IS NULL))) AS broken_passages,
                (SELECT count(*) FROM public.test_sessions s
                  WHERE s.test_type = m.test_type AND s.created_at >= v_since) AS sessions
            FROM (VALUES ('reading'), ('listening'), ('writing'), ('speaking')) AS m(test_type)
            LEFT JOIN public.passages p ON p.test_type = m.test_type
            GROUP BY m.test_type
        ) c
    );

    -- A successful RPC proves the database is reachable; connection pressure
    -- determines whether it is nominal, degraded, or near exhaustion.
    SELECT pg_catalog.pg_size_pretty(pg_catalog.pg_database_size(pg_catalog.current_database()))
    INTO v_db_size;
    SELECT count(*) INTO v_connections FROM pg_catalog.pg_stat_activity;
    v_max_connections := current_setting('max_connections')::integer;
    v_connection_pct := CASE WHEN v_max_connections > 0 THEN 100.0 * v_connections / v_max_connections ELSE 0 END;
    v_status := CASE WHEN v_connection_pct >= 90 THEN 'down'
        WHEN v_connection_pct >= 70 THEN 'degraded' ELSE 'operational' END;
    v_services := v_services || jsonb_build_object(
        'key', 'database', 'label', 'Database', 'category', 'platform',
        'provider', 'Supabase Postgres', 'status', v_status, 'source', 'pg_stat_activity',
        'metrics', jsonb_build_object('size', v_db_size, 'connections', v_connections,
            'maxConnections', v_max_connections, 'connectionUtilization', round(v_connection_pct, 1)),
        'impact', CASE WHEN v_connection_pct >= 90 THEN 'Connection capacity is nearly exhausted.'
            WHEN v_connection_pct >= 70 THEN 'Connection utilization is elevated.'
            ELSE 'Database reachable; connection utilization is within threshold.' END
    );

    SELECT count(*) INTO v_signups FROM public.users WHERE created_at >= v_since;
    SELECT count(*) INTO v_active_users FROM public.users WHERE last_active >= v_since;
    SELECT count(*) INTO v_sessions FROM public.test_sessions WHERE created_at >= v_since;
    SELECT count(*) INTO v_logged_errors FROM public.system_health_logs
      WHERE created_at >= v_since AND level IN ('error', 'critical');

    RETURN jsonb_build_object(
        'generatedAt', now(), 'windowHours', v_hours, 'contractVersion', 2,
        'services', v_services,
        'activity', jsonb_build_object('signups', v_signups, 'activeUsers', v_active_users,
            'testSessions', v_sessions, 'loggedErrors', v_logged_errors),
        'summary', (SELECT COALESCE(jsonb_object_agg(status, n), '{}'::jsonb)
                    FROM (SELECT s->>'status' status, count(*) n
                          FROM jsonb_array_elements(v_services) s GROUP BY 1) x)
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health(integer) TO authenticated;

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
    v_result jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    v_since := now() - make_interval(hours => LEAST(GREATEST(COALESCE(p_hours, 24), 1), 24 * 90));

    SELECT COALESCE(jsonb_agg(to_jsonb(i) ORDER BY i.last_seen DESC, i.occurrences DESC), '[]'::jsonb)
    INTO v_result
    FROM (
        SELECT service, left(message, 500) AS message, count(*) occurrences,
               max(seen_at) last_seen, min(seen_at) first_seen
        FROM (
            SELECT CASE
                       WHEN endpoint IN ('transcribeAudio', 'processSpeakingSession') THEN 'speech_transcription'
                       WHEN endpoint = 'synthesizeSpeech' THEN 'speech_synthesis'
                       WHEN endpoint IN ('generateDetailedFeedback', 'generateDetailedSpeakingFeedback',
                           'evaluateSpeakingTest', 'evaluateGrammarTransfer',
                           'generateAdaptiveLearningPath', 'generateStudyRecommendations') THEN 'ai_feedback'
                       ELSE 'ai_quota_reservations'
                   END AS service,
                   COALESCE(NULLIF(btrim(request_metadata->>'transcriptionError'), ''),
                            NULLIF(btrim(request_metadata->>'ttsError'), ''),
                            NULLIF(btrim(request_metadata->>'failureReason'), ''),
                            'AI request failed') AS message,
                   created_at AS seen_at
            FROM public.ai_api_usage
            WHERE created_at >= v_since AND request_metadata->>'reservationStatus' = 'failed'

            UNION ALL
            SELECT 'pronunciation_assessment', btrim(request_metadata->>'pronunciationError'), created_at
            FROM public.ai_api_usage
            WHERE created_at >= v_since
              AND NULLIF(btrim(COALESCE(request_metadata->>'pronunciationError', '')), '') IS NOT NULL

            UNION ALL
            SELECT 'payments_stripe', COALESCE(NULLIF(btrim(error_message), ''), 'Stripe event failed'), processed_at
            FROM public.stripe_events
            WHERE processed_at >= v_since AND status = 'failed'

            UNION ALL
            SELECT 'system_log:' || COALESCE(component, 'unknown'), message, created_at
            FROM public.system_health_logs
            WHERE created_at >= v_since AND level IN ('error', 'critical')
        ) events
        WHERE NULLIF(btrim(message), '') IS NOT NULL
        GROUP BY service, left(message, 500)
        ORDER BY max(seen_at) DESC, count(*) DESC
        LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200)
    ) i;
    RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health_incidents(integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_platform_health_incidents(integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health_incidents(integer, integer) TO authenticated;

-- Admin platform health.
--
-- The admin panel previously derived every "is it broken?" signal from
-- public.system_health_logs, which no code path has ever written to, and from
-- two probes that measured the wrong thing (a CORS preflight for "AI health"
-- and a Postgres row count for "Stripe health"). Real per-service failure
-- telemetry already lives in ai_api_usage.request_metadata, so this migration
-- derives service status from that instead. Additive and read-only: it creates
-- new functions and replaces get_revenue_analytics with the same return shape.

-- ---------------------------------------------------------------------------
-- get_platform_health(p_hours)
-- Per-service operational status for every user-facing capability.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_platform_health(p_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_since        timestamptz;
    v_services     jsonb := '[]'::jsonb;
    v_hours        integer;

    -- transcription
    v_t_attempts   bigint;  v_t_errors bigint;  v_t_fallbacks bigint;
    v_t_loss       bigint;  v_t_p95    numeric;
    -- pronunciation
    v_p_requested  bigint;  v_p_completed bigint; v_p_errors bigint;
    v_p_config     bigint;  v_p_p95 numeric;
    -- speech synthesis
    v_s_attempts   bigint;  v_s_errors bigint;
    -- text AI
    v_a_attempts   bigint;  v_a_errors bigint;  v_a_cached bigint;
    -- quota reservations
    v_stuck        bigint;
    -- payments
    v_stripe_paid  bigint;  v_stripe_amount numeric; v_stripe_events bigint;
    v_manual_pend  bigint;  v_manual_oldest_h numeric; v_manual_paid bigint;
    -- platform
    v_signups      bigint;  v_active_users bigint;  v_sessions bigint;
    v_db_size      text;    v_connections integer;
    v_logged_err   bigint;

    v_status       text;
    v_rate         numeric;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_hours := GREATEST(COALESCE(p_hours, 24), 1);
    v_since := now() - make_interval(hours => v_hours);

    -- ── Speech-to-text (Cloudflare Whisper, Gemini fallback) ───────────────
    SELECT
        count(*) FILTER (WHERE endpoint IN ('transcribeAudio', 'processSpeakingSession')),
        count(*) FILTER (WHERE NULLIF(btrim(coalesce(request_metadata->>'transcriptionError', '')), '') IS NOT NULL
                            OR (request_metadata->>'transcriptionFailed') = 'true'),
        count(*) FILTER (WHERE request_metadata->>'transcriptionProvider' = 'gemini-fallback'),
        count(*) FILTER (WHERE request_metadata->>'transcriptionProvider' = 'none'),
        percentile_cont(0.95) WITHIN GROUP (
            ORDER BY (request_metadata->>'transcriptionLatencyMs')::numeric)
            FILTER (WHERE jsonb_typeof(request_metadata->'transcriptionLatencyMs') = 'number')
    INTO v_t_attempts, v_t_errors, v_t_fallbacks, v_t_loss, v_t_p95
    FROM public.ai_api_usage
    WHERE created_at >= v_since;

    v_rate := CASE WHEN v_t_attempts > 0 THEN (v_t_errors::numeric / v_t_attempts) * 100 ELSE 0 END;
    v_status := CASE
        WHEN v_t_attempts = 0 THEN 'idle'
        WHEN v_rate >= 25 OR (v_t_loss > 0 AND v_t_attempts <= 5) THEN 'down'
        WHEN v_rate >= 10 OR v_t_loss > 0 THEN 'degraded'
        ELSE 'operational' END;

    v_services := v_services || jsonb_build_object(
        'key', 'speech_transcription',
        'label', 'Speech-to-Text',
        'category', 'ai',
        'provider', 'Cloudflare Whisper -> Gemini fallback',
        'status', v_status,
        'metrics', jsonb_build_object(
            'attempts', v_t_attempts,
            'errors', v_t_errors,
            'errorRate', round(v_rate, 1),
            'fallbacks', v_t_fallbacks,
            'unrecoverable', v_t_loss,
            'p95LatencyMs', round(coalesce(v_t_p95, 0))),
        'impact', CASE
            WHEN v_t_loss > 0 THEN v_t_loss || ' speaking answer(s) produced no transcript at all - those users got no score.'
            WHEN v_t_fallbacks > 0 THEN v_t_fallbacks || ' request(s) needed the slower Gemini fallback.'
            WHEN v_t_attempts = 0 THEN 'No speaking transcription attempted in this window.'
            ELSE 'Primary provider handling all traffic.' END
    );

    -- ── Pronunciation assessment (Azure Speech) ────────────────────────────
    SELECT
        count(*) FILTER (WHERE (request_metadata->>'pronunciationRequested') = 'true'),
        count(*) FILTER (WHERE (request_metadata->>'pronunciationCompleted') = 'true'),
        count(*) FILTER (WHERE NULLIF(btrim(coalesce(request_metadata->>'pronunciationError', '')), '') IS NOT NULL),
        count(*) FILTER (WHERE request_metadata->>'pronunciationError' ILIKE '%not configured%'),
        percentile_cont(0.95) WITHIN GROUP (
            ORDER BY (request_metadata->>'pronunciationLatencyMs')::numeric)
            FILTER (WHERE jsonb_typeof(request_metadata->'pronunciationLatencyMs') = 'number')
    INTO v_p_requested, v_p_completed, v_p_errors, v_p_config, v_p_p95
    FROM public.ai_api_usage
    WHERE created_at >= v_since;

    v_rate := CASE WHEN v_p_requested > 0 THEN (v_p_completed::numeric / v_p_requested) * 100 ELSE 0 END;
    v_status := CASE
        WHEN v_p_config > 0 THEN 'unconfigured'
        WHEN v_p_requested = 0 THEN 'idle'
        WHEN v_rate < 60 THEN 'down'
        WHEN v_rate < 90 OR v_p_errors > 0 THEN 'degraded'
        ELSE 'operational' END;

    v_services := v_services || jsonb_build_object(
        'key', 'pronunciation_assessment',
        'label', 'Pronunciation Scoring',
        'category', 'ai',
        'provider', 'Azure Speech',
        'status', v_status,
        'metrics', jsonb_build_object(
            'requested', v_p_requested,
            'completed', v_p_completed,
            'completionRate', round(v_rate, 1),
            'errors', v_p_errors,
            'credentialErrors', v_p_config,
            'p95LatencyMs', round(coalesce(v_p_p95, 0))),
        'impact', CASE
            WHEN v_p_config > 0 THEN 'AZURE_SPEECH_KEY / AZURE_SPEECH_REGION missing or rejected - speaking tests silently lose their pronunciation score.'
            WHEN v_p_requested = 0 THEN 'No pronunciation assessment requested in this window.'
            WHEN v_p_requested > v_p_completed THEN (v_p_requested - v_p_completed) || ' request(s) returned no pronunciation score.'
            ELSE 'Scoring every requested attempt.' END
    );

    -- ── Text-to-speech (examiner voice) ────────────────────────────────────
    SELECT
        count(*),
        count(*) FILTER (WHERE request_metadata->>'reservationStatus' = 'failed')
    INTO v_s_attempts, v_s_errors
    FROM public.ai_api_usage
    WHERE created_at >= v_since AND endpoint = 'synthesizeSpeech';

    v_status := CASE
        WHEN v_s_attempts = 0 THEN 'idle'
        WHEN v_s_errors > 0 THEN 'degraded'
        ELSE 'operational' END;

    v_services := v_services || jsonb_build_object(
        'key', 'speech_synthesis',
        'label', 'Examiner Voice (TTS)',
        'category', 'ai',
        'provider', 'Google TTS',
        'status', v_status,
        'metrics', jsonb_build_object('attempts', v_s_attempts, 'errors', v_s_errors),
        'impact', CASE
            WHEN v_s_attempts = 0 THEN 'No speech synthesised in this window.'
            WHEN v_s_errors > 0 THEN 'Some speaking prompts failed to play audio.'
            ELSE 'Examiner audio delivering normally.' END
    );

    -- ── AI feedback / scoring (Gemini) ─────────────────────────────────────
    SELECT
        count(*),
        count(*) FILTER (WHERE request_metadata->>'reservationStatus' = 'failed'),
        count(*) FILTER (WHERE cached IS TRUE)
    INTO v_a_attempts, v_a_errors, v_a_cached
    FROM public.ai_api_usage
    WHERE created_at >= v_since
      AND endpoint IN ('generateDetailedFeedback', 'generateDetailedSpeakingFeedback',
                       'evaluateSpeakingTest', 'evaluateGrammarTransfer',
                       'generateAdaptiveLearningPath', 'generateStudyRecommendations');

    v_rate := CASE WHEN v_a_attempts > 0 THEN (v_a_errors::numeric / v_a_attempts) * 100 ELSE 0 END;
    v_status := CASE
        WHEN v_a_attempts = 0 THEN 'idle'
        WHEN v_rate >= 20 THEN 'down'
        WHEN v_rate > 0 THEN 'degraded'
        ELSE 'operational' END;

    v_services := v_services || jsonb_build_object(
        'key', 'ai_feedback',
        'label', 'AI Feedback & Scoring',
        'category', 'ai',
        'provider', 'Gemini',
        'status', v_status,
        'metrics', jsonb_build_object(
            'attempts', v_a_attempts,
            'errors', v_a_errors,
            'errorRate', round(v_rate, 1),
            'cacheHits', v_a_cached),
        'impact', CASE
            WHEN v_a_attempts = 0 THEN 'No writing/speaking feedback generated in this window.'
            WHEN v_a_errors > 0 THEN v_a_errors || ' feedback request(s) failed - those users saw no band score.'
            ELSE 'Feedback generating normally.' END
    );

    -- ── AI quota reservations ──────────────────────────────────────────────
    -- A reservation left in 'reserved' burned the user's quota for a request
    -- that never finished. These never surface as failures anywhere else.
    SELECT count(*) INTO v_stuck
    FROM public.ai_api_usage
    WHERE created_at >= v_since
      AND request_metadata->>'reservationStatus' = 'reserved'
      AND created_at < now() - interval '1 hour';

    v_status := CASE
        WHEN v_stuck = 0 THEN 'operational'
        WHEN v_stuck >= 10 THEN 'down'
        ELSE 'degraded' END;

    v_services := v_services || jsonb_build_object(
        'key', 'ai_quota_reservations',
        'label', 'AI Quota Reservations',
        'category', 'ai',
        'provider', 'Internal',
        'status', v_status,
        'metrics', jsonb_build_object('stuck', v_stuck),
        'impact', CASE
            WHEN v_stuck = 0 THEN 'All reservations settled.'
            ELSE v_stuck || ' reservation(s) stuck over an hour - quota was consumed but the request never completed.' END
    );

    -- ── Stripe ─────────────────────────────────────────────────────────────
    SELECT count(*), coalesce(sum(amount), 0)
    INTO v_stripe_paid, v_stripe_amount
    FROM public.payment_requests
    WHERE created_at >= v_since AND lower(payment_method) = 'stripe' AND status = 'approved';

    SELECT count(*) INTO v_stripe_events
    FROM public.stripe_events WHERE processed_at >= v_since;

    v_status := CASE
        WHEN v_stripe_events = 0 AND v_stripe_paid = 0 THEN 'idle'
        WHEN v_stripe_events > 0 AND v_stripe_paid = 0 THEN 'degraded'
        ELSE 'operational' END;

    v_services := v_services || jsonb_build_object(
        'key', 'payments_stripe',
        'label', 'Card Payments',
        'category', 'payments',
        'provider', 'Stripe',
        'status', v_status,
        'metrics', jsonb_build_object(
            'webhookEvents', v_stripe_events,
            'recordedPayments', v_stripe_paid,
            'recordedAmount', v_stripe_amount),
        'impact', CASE
            WHEN v_stripe_events = 0 AND v_stripe_paid = 0 THEN 'No Stripe activity in this window.'
            WHEN v_stripe_events > 0 AND v_stripe_paid = 0
                THEN v_stripe_events || ' webhook event(s) processed but no payment row recorded - revenue reporting will under-count.'
            ELSE 'Webhooks and payment records in sync.' END
    );

    -- ── Manual / local payments ────────────────────────────────────────────
    SELECT
        count(*) FILTER (WHERE status = 'pending'),
        count(*) FILTER (WHERE status = 'approved' AND lower(payment_method) <> 'stripe'),
        extract(epoch FROM (now() - min(created_at) FILTER (WHERE status = 'pending'))) / 3600
    INTO v_manual_pend, v_manual_paid, v_manual_oldest_h
    FROM public.payment_requests;

    v_status := CASE
        WHEN v_manual_pend = 0 THEN 'operational'
        WHEN coalesce(v_manual_oldest_h, 0) > 48 THEN 'down'
        WHEN coalesce(v_manual_oldest_h, 0) > 12 THEN 'degraded'
        ELSE 'attention' END;

    v_services := v_services || jsonb_build_object(
        'key', 'payments_manual',
        'label', 'Manual Payments (bKash/Nagad)',
        'category', 'payments',
        'provider', 'Admin review',
        'status', v_status,
        'metrics', jsonb_build_object(
            'pending', v_manual_pend,
            'approvedInWindow', v_manual_paid,
            'oldestPendingHours', round(coalesce(v_manual_oldest_h, 0), 1)),
        'impact', CASE
            WHEN v_manual_pend = 0 THEN 'No payment requests waiting.'
            ELSE v_manual_pend || ' request(s) awaiting approval, oldest ' ||
                 round(coalesce(v_manual_oldest_h, 0)) || 'h - those users have paid but are still on the free tier.' END
    );

    -- ── Content availability per module ────────────────────────────────────
    v_services := v_services || (
        SELECT coalesce(jsonb_agg(
            jsonb_build_object(
                'key', 'content_' || t.test_type,
                'label', initcap(t.test_type) || ' Content',
                'category', 'content',
                'provider', 'Test library',
                'status', CASE WHEN t.active_passages = 0 THEN 'down'
                               WHEN t.active_passages < 3 THEN 'degraded'
                               ELSE 'operational' END,
                'metrics', jsonb_build_object(
                    'activePassages', t.active_passages,
                    'sessionsInWindow', t.sessions),
                'impact', CASE
                    WHEN t.active_passages = 0
                        THEN 'No active ' || t.test_type || ' test - this module is unusable for every learner.'
                    WHEN t.active_passages < 3
                        THEN 'Only ' || t.active_passages || ' active test(s); learners will repeat content.'
                    ELSE t.active_passages || ' active tests available.' END
            ) ORDER BY t.test_type), '[]'::jsonb)
        FROM (
            SELECT
                m.test_type,
                (SELECT count(*) FROM public.passages p
                  WHERE p.is_active AND p.test_type = m.test_type) AS active_passages,
                (SELECT count(*) FROM public.test_sessions s
                  WHERE s.test_type = m.test_type AND s.created_at >= v_since) AS sessions
            FROM (VALUES ('reading'), ('listening'), ('writing'), ('speaking')) AS m(test_type)
        ) t
    );

    -- ── Database ───────────────────────────────────────────────────────────
    SELECT pg_catalog.pg_size_pretty(
             pg_catalog.pg_database_size(pg_catalog.current_database()))
    INTO v_db_size;

    BEGIN
        SELECT count(*) INTO v_connections FROM pg_catalog.pg_stat_activity;
    EXCEPTION WHEN others THEN
        v_connections := -1;
    END;

    v_services := v_services || jsonb_build_object(
        'key', 'database',
        'label', 'Database',
        'category', 'platform',
        'provider', 'Supabase Postgres',
        'status', 'operational',
        'metrics', jsonb_build_object('size', v_db_size, 'connections', v_connections),
        'impact', 'Storage and connection pool nominal.'
    );

    -- ── Platform activity ──────────────────────────────────────────────────
    SELECT count(*) INTO v_signups FROM public.users WHERE created_at >= v_since;
    SELECT count(*) INTO v_active_users FROM public.users WHERE last_active >= v_since;
    SELECT count(*) INTO v_sessions FROM public.test_sessions WHERE created_at >= v_since;
    SELECT count(*) INTO v_logged_err
    FROM public.system_health_logs WHERE created_at >= v_since AND level IN ('error', 'critical');

    RETURN jsonb_build_object(
        'generatedAt',  now(),
        'windowHours',  v_hours,
        'services',     v_services,
        'activity',     jsonb_build_object(
            'signups',      v_signups,
            'activeUsers',  v_active_users,
            'testSessions', v_sessions,
            'loggedErrors', v_logged_err),
        'summary', (
            SELECT jsonb_object_agg(status, n) FROM (
                SELECT s->>'status' AS status, count(*) AS n
                FROM jsonb_array_elements(v_services) s GROUP BY 1
            ) c)
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health(integer) TO authenticated;

COMMENT ON FUNCTION public.get_platform_health(integer) IS
'Admin-only per-service platform status derived from real telemetry in ai_api_usage, payment_requests, stripe_events and passages.';


-- ---------------------------------------------------------------------------
-- get_platform_health_incidents(p_hours, p_limit)
-- The actual provider error strings behind a degraded service.
-- ---------------------------------------------------------------------------
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
    v_since  timestamptz;
    v_result jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_since := now() - make_interval(hours => GREATEST(COALESCE(p_hours, 24), 1));

    SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.occurrences DESC, i.last_seen DESC), '[]'::jsonb)
    INTO v_result
    FROM (
        SELECT
            service,
            message,
            count(*)     AS occurrences,
            max(seen_at) AS last_seen,
            min(seen_at) AS first_seen
        FROM (
            SELECT
                'speech_transcription' AS service,
                btrim(request_metadata->>'transcriptionError') AS message,
                created_at AS seen_at
            FROM public.ai_api_usage
            WHERE created_at >= v_since
              AND NULLIF(btrim(coalesce(request_metadata->>'transcriptionError', '')), '') IS NOT NULL

            UNION ALL

            SELECT
                'pronunciation_assessment',
                btrim(request_metadata->>'pronunciationError'),
                created_at
            FROM public.ai_api_usage
            WHERE created_at >= v_since
              AND NULLIF(btrim(coalesce(request_metadata->>'pronunciationError', '')), '') IS NOT NULL

            UNION ALL

            SELECT
                'system_log:' || coalesce(component, 'unknown'),
                message,
                created_at
            FROM public.system_health_logs
            WHERE created_at >= v_since AND level IN ('error', 'critical')
        ) e
        GROUP BY service, message
        LIMIT GREATEST(COALESCE(p_limit, 50), 1)
    ) i;

    RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health_incidents(integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_platform_health_incidents(integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health_incidents(integer, integer) TO authenticated;


-- ---------------------------------------------------------------------------
-- get_revenue_analytics()
-- Same return shape as before. Previously read only billing_history, which is
-- empty — Stripe payments have been recorded in payment_requests since
-- 20260730200927_record_stripe_payments_in_payment_requests. Now reads both,
-- de-duplicated on transaction_id so a payment present in each is counted once.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_revenue_analytics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_monthly_revenue     json;
    v_revenue_by_tier     json;
    v_recent_transactions json;
    v_active_subscribers  bigint;
    v_pro_count           bigint;
    v_premium_count       bigint;
    v_arpu_usd            numeric;
    v_arpu_bdt            numeric;
    v_stripe_revenue      numeric;
    v_manual_revenue      numeric;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    WITH unified AS (
        SELECT
            bh.id, bh.auth_id, bh.user_id, bh.amount, bh.currency, bh.tier,
            bh.billing_interval, bh.payment_method, bh.transaction_id, bh.created_at
        FROM public.billing_history bh
        WHERE bh.status = 'paid'

        UNION ALL

        SELECT
            pr.id, pr.auth_id, NULL::uuid, pr.amount, pr.currency, pr.tier,
            pr.interval, pr.payment_method, pr.transaction_id, pr.created_at
        FROM public.payment_requests pr
        WHERE pr.status = 'approved'
          AND NOT EXISTS (
              SELECT 1 FROM public.billing_history b
              WHERE b.status = 'paid'
                AND b.transaction_id IS NOT NULL
                AND b.transaction_id = pr.transaction_id
          )
    )
    SELECT
        coalesce(sum(amount) FILTER (WHERE lower(payment_method) = 'stripe'), 0),
        coalesce(sum(amount) FILTER (WHERE lower(payment_method) <> 'stripe'), 0)
    INTO v_stripe_revenue, v_manual_revenue
    FROM unified;

    -- Monthly (last 6 months)
    WITH unified AS (
        SELECT bh.amount, bh.payment_method, bh.created_at
        FROM public.billing_history bh WHERE bh.status = 'paid'
        UNION ALL
        SELECT pr.amount, pr.payment_method, pr.created_at
        FROM public.payment_requests pr
        WHERE pr.status = 'approved'
          AND NOT EXISTS (
              SELECT 1 FROM public.billing_history b
              WHERE b.status = 'paid' AND b.transaction_id IS NOT NULL
                AND b.transaction_id = pr.transaction_id)
    )
    SELECT json_agg(t ORDER BY t.month_start)
    INTO v_monthly_revenue
    FROM (
        SELECT
            date_trunc('month', created_at)                      AS month_start,
            to_char(date_trunc('month', created_at), 'Mon YYYY') AS month,
            to_char(date_trunc('month', created_at), 'Mon')      AS label,
            sum(CASE WHEN lower(payment_method) = 'stripe' THEN amount ELSE 0 END)  AS revenue_usd,
            sum(CASE WHEN lower(payment_method) <> 'stripe' THEN amount ELSE 0 END) AS revenue_bdt,
            count(*)                                             AS transactions
        FROM unified
        WHERE created_at >= (now() - INTERVAL '6 months')
        GROUP BY date_trunc('month', created_at)
    ) t;

    -- By tier
    WITH unified AS (
        SELECT bh.amount, bh.payment_method, bh.tier
        FROM public.billing_history bh WHERE bh.status = 'paid'
        UNION ALL
        SELECT pr.amount, pr.payment_method, pr.tier
        FROM public.payment_requests pr
        WHERE pr.status = 'approved'
          AND NOT EXISTS (
              SELECT 1 FROM public.billing_history b
              WHERE b.status = 'paid' AND b.transaction_id IS NOT NULL
                AND b.transaction_id = pr.transaction_id)
    )
    SELECT json_agg(t)
    INTO v_revenue_by_tier
    FROM (
        SELECT
            tier,
            sum(CASE WHEN lower(payment_method) = 'stripe' THEN amount ELSE 0 END)  AS revenue_usd,
            sum(CASE WHEN lower(payment_method) <> 'stripe' THEN amount ELSE 0 END) AS revenue_bdt,
            count(*) AS count
        FROM unified
        GROUP BY tier
    ) t;

    -- Recent transactions
    WITH unified AS (
        SELECT bh.id, bh.auth_id, bh.user_id, bh.amount, bh.currency, bh.tier,
               bh.billing_interval, bh.payment_method, bh.created_at
        FROM public.billing_history bh WHERE bh.status = 'paid'
        UNION ALL
        SELECT pr.id, pr.auth_id, NULL::uuid, pr.amount, pr.currency, pr.tier,
               pr.interval, pr.payment_method, pr.created_at
        FROM public.payment_requests pr
        WHERE pr.status = 'approved'
          AND NOT EXISTS (
              SELECT 1 FROM public.billing_history b
              WHERE b.status = 'paid' AND b.transaction_id IS NOT NULL
                AND b.transaction_id = pr.transaction_id)
    )
    SELECT json_agg(t)
    INTO v_recent_transactions
    FROM (
        SELECT
            u.id, u.amount, u.currency, u.tier, u.billing_interval,
            u.payment_method, u.created_at,
            coalesce(ua.full_name, ub.full_name)  AS full_name,
            coalesce(ua.email, ub.email)          AS email,
            coalesce(ua.avatar_url, ub.avatar_url) AS avatar_url
        FROM unified u
        LEFT JOIN public.users ua ON ua.auth_id = u.auth_id
        LEFT JOIN public.users ub ON ub.id = u.user_id AND u.auth_id IS NULL
        ORDER BY u.created_at DESC
        LIMIT 10
    ) t;

    SELECT count(*) INTO v_active_subscribers
    FROM public.users WHERE subscription_tier IN ('pro', 'premium');

    SELECT count(*) INTO v_pro_count
    FROM public.users WHERE subscription_tier = 'pro';

    SELECT count(*) INTO v_premium_count
    FROM public.users WHERE subscription_tier = 'premium';

    IF v_active_subscribers > 0 THEN
        v_arpu_usd := round(v_stripe_revenue / v_active_subscribers, 2);
        v_arpu_bdt := round(v_manual_revenue / v_active_subscribers, 2);
    ELSE
        v_arpu_usd := 0;
        v_arpu_bdt := 0;
    END IF;

    RETURN json_build_object(
        'stripeRevenue',      v_stripe_revenue,
        'manualRevenue',      v_manual_revenue,
        'monthlyRevenue',     coalesce(v_monthly_revenue, '[]'::json),
        'revenueByTier',      coalesce(v_revenue_by_tier, '[]'::json),
        'recentTransactions', coalesce(v_recent_transactions, '[]'::json),
        'activeSubscribers',  v_active_subscribers,
        'proCount',           v_pro_count,
        'premiumCount',       v_premium_count,
        'arpuUsd',            v_arpu_usd,
        'arpuBdt',            v_arpu_bdt,
        'ltvUsd',             round(v_arpu_usd * 12, 2),
        'ltvBdt',             round(v_arpu_bdt * 12, 2)
    );
END;
$function$;

-- Admin overview snapshot.
--
-- Replaces the old client-side approach where AdminOverview pulled 10,000 users
-- and 10,000 test_sessions into the browser and aggregated there. Everything is
-- computed in Postgres in one round trip.
--
-- v2 additions over the first cut: weekly cohort retention, repeat/power-user
-- depth, unit economics (AI cost per completed test and per paying user),
-- mock-vs-practice split and hour-of-day volume. The daily trend no longer runs
-- correlated subqueries per generated day — each source table is scanned once
-- and joined onto the date spine. Supporting indexes already exist
-- (idx_users_created_at, idx_users_last_active, idx_test_sessions_created_at).

CREATE OR REPLACE FUNCTION public.get_admin_overview(p_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_days      integer;
    v_since     timestamptz;
    v_prev      timestamptz;

    v_signups bigint; v_signups_prev bigint;
    v_dau bigint; v_wau bigint; v_mau bigint; v_active_prev bigint;
    v_total_users bigint;
    v_pro bigint; v_premium bigint;
    v_rev_usd numeric; v_rev_bdt numeric; v_rev_usd_prev numeric;
    v_ai_cost numeric; v_ai_cost_prev numeric; v_ai_priced bigint; v_ai_total bigint;

    v_f_signed bigint; v_f_onboarded bigint; v_f_started bigint;
    v_f_completed bigint; v_f_paid bigint;

    v_pending_pay bigint; v_pending_oldest numeric;
    v_stuck bigint; v_cancelling bigint; v_expiring bigint; v_eval_failed bigint;

    v_started_users bigint; v_repeat_users bigint; v_power_users bigint;
    v_completed_tests bigint;
    v_mock bigint; v_practice bigint;

    v_trend jsonb; v_modules jsonb; v_recent jsonb; v_actions jsonb := '[]'::jsonb;
    v_retention jsonb; v_hours jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_days  := GREATEST(COALESCE(p_days, 7), 1);
    v_since := now() - make_interval(days => v_days);
    v_prev  := now() - make_interval(days => v_days * 2);

    -- Users: one pass for every user-derived counter.
    SELECT
        count(*),
        count(*) FILTER (WHERE created_at >= v_since),
        count(*) FILTER (WHERE created_at >= v_prev AND created_at < v_since),
        count(*) FILTER (WHERE last_active > now() - interval '1 day'),
        count(*) FILTER (WHERE last_active > now() - interval '7 days'),
        count(*) FILTER (WHERE last_active > now() - interval '30 days'),
        count(*) FILTER (WHERE last_active >= v_prev AND last_active < v_since),
        count(*) FILTER (WHERE subscription_tier = 'pro'),
        count(*) FILTER (WHERE subscription_tier = 'premium'),
        count(*) FILTER (WHERE onboarding_completed),
        count(*) FILTER (WHERE cancel_at_period_end IS TRUE
                           AND subscription_tier IN ('pro','premium')),
        count(*) FILTER (WHERE subscription_tier IN ('pro','premium')
                           AND subscription_end_date IS NOT NULL
                           AND subscription_end_date BETWEEN now() AND now() + interval '7 days')
    INTO v_total_users, v_signups, v_signups_prev, v_dau, v_wau, v_mau,
         v_active_prev, v_pro, v_premium, v_f_onboarded, v_cancelling, v_expiring
    FROM public.users;

    v_f_signed := v_total_users;
    v_f_paid   := v_pro + v_premium;

    -- Sessions: one pass.
    SELECT
        count(DISTINCT user_id),
        count(DISTINCT user_id) FILTER (WHERE is_completed),
        count(*) FILTER (WHERE is_completed),
        count(*) FILTER (WHERE test_mode = 'mock'),
        count(*) FILTER (WHERE test_mode = 'practice'),
        count(*) FILTER (WHERE evaluation_status = 'failed')
    INTO v_f_started, v_f_completed, v_completed_tests, v_mock, v_practice, v_eval_failed
    FROM public.test_sessions;

    SELECT
        count(*),
        count(*) FILTER (WHERE n >= 2),
        count(*) FILTER (WHERE n >= 5)
    INTO v_started_users, v_repeat_users, v_power_users
    FROM (SELECT user_id, count(*) AS n FROM public.test_sessions GROUP BY user_id) s;

    -- Revenue: billing_history plus payment_requests, deduped on transaction_id.
    WITH paid AS (
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
    SELECT
        COALESCE(sum(amount) FILTER (WHERE lower(payment_method) = 'stripe' AND created_at >= v_since), 0),
        COALESCE(sum(amount) FILTER (WHERE lower(payment_method) <> 'stripe' AND created_at >= v_since), 0),
        COALESCE(sum(amount) FILTER (WHERE lower(payment_method) = 'stripe'
                                       AND created_at >= v_prev AND created_at < v_since), 0)
    INTO v_rev_usd, v_rev_bdt, v_rev_usd_prev
    FROM paid;

    -- AI spend: only rows carrying a cost estimate contribute.
    SELECT
        COALESCE(sum((request_metadata->>'estimatedProviderCostUsd')::numeric)
                 FILTER (WHERE jsonb_typeof(request_metadata->'estimatedProviderCostUsd') = 'number'
                           AND created_at >= v_since), 0),
        COALESCE(sum((request_metadata->>'estimatedProviderCostUsd')::numeric)
                 FILTER (WHERE jsonb_typeof(request_metadata->'estimatedProviderCostUsd') = 'number'
                           AND created_at >= v_prev AND created_at < v_since), 0),
        count(*) FILTER (WHERE jsonb_typeof(request_metadata->'estimatedProviderCostUsd') = 'number'
                           AND created_at >= v_since),
        count(*) FILTER (WHERE created_at >= v_since)
    INTO v_ai_cost, v_ai_cost_prev, v_ai_priced, v_ai_total
    FROM public.ai_api_usage;

    -- Action queue.
    SELECT
        count(*) FILTER (WHERE status = 'pending'),
        COALESCE(extract(epoch FROM (now() - min(created_at) FILTER (WHERE status = 'pending'))) / 3600, 0)
    INTO v_pending_pay, v_pending_oldest
    FROM public.payment_requests;

    SELECT count(*) INTO v_stuck
    FROM public.ai_api_usage
    WHERE request_metadata->>'reservationStatus' = 'reserved'
      AND created_at < now() - interval '1 hour'
      AND created_at >= now() - interval '30 days';

    IF v_pending_pay > 0 THEN
        v_actions := v_actions || jsonb_build_object(
            'key','pending_payments','label','Payment requests awaiting approval',
            'count',v_pending_pay,'severity','high',
            'detail','Oldest waiting ' || round(v_pending_oldest) || 'h - these users have paid but are still on the free tier.',
            'tab','payments');
    END IF;
    IF v_stuck > 0 THEN
        v_actions := v_actions || jsonb_build_object(
            'key','stuck_reservations','label','Stuck AI reservations',
            'count',v_stuck,'severity',CASE WHEN v_stuck >= 10 THEN 'high' ELSE 'medium' END,
            'detail','Quota was consumed but the request never completed.','tab','ai-usage');
    END IF;
    IF v_eval_failed > 0 THEN
        v_actions := v_actions || jsonb_build_object(
            'key','eval_failed','label','Test evaluations failed',
            'count',v_eval_failed,'severity','high',
            'detail','Learners finished a test but never received a score.','tab','ai-usage');
    END IF;
    IF v_cancelling > 0 THEN
        v_actions := v_actions || jsonb_build_object(
            'key','cancelling','label','Subscriptions set to cancel',
            'count',v_cancelling,'severity','medium',
            'detail','Will not renew at the end of the current period.','tab','users');
    END IF;
    IF v_expiring > 0 THEN
        v_actions := v_actions || jsonb_build_object(
            'key','expiring','label','Subscriptions expiring within 7 days',
            'count',v_expiring,'severity','low','detail','Renewal or outreach window.','tab','users');
    END IF;

    -- Daily trend: grouped passes joined onto a date spine (no per-day subqueries).
    WITH spine AS (
        SELECT generate_series(date_trunc('day', v_since), date_trunc('day', now()), interval '1 day') AS day
    ),
    su AS (
        SELECT date_trunc('day', created_at) AS day, count(*) AS n
        FROM public.users WHERE created_at >= date_trunc('day', v_since) GROUP BY 1
    ),
    ac AS (
        SELECT date_trunc('day', last_active) AS day, count(*) AS n
        FROM public.users WHERE last_active >= date_trunc('day', v_since) GROUP BY 1
    ),
    se AS (
        SELECT date_trunc('day', created_at) AS day, count(*) AS n
        FROM public.test_sessions WHERE created_at >= date_trunc('day', v_since) GROUP BY 1
    )
    SELECT jsonb_agg(jsonb_build_object(
               'date', to_char(spine.day, 'Mon DD'),
               'signups', COALESCE(su.n, 0),
               'active',  COALESCE(ac.n, 0),
               'sessions',COALESCE(se.n, 0)) ORDER BY spine.day)
    INTO v_trend
    FROM spine
    LEFT JOIN su ON su.day = spine.day
    LEFT JOIN ac ON ac.day = spine.day
    LEFT JOIN se ON se.day = spine.day;

    -- Weekly cohort retention over the last 6 signup weeks.
    WITH cohort AS (
        SELECT id, date_trunc('week', created_at) AS wk
        FROM public.users
        WHERE created_at >= date_trunc('week', now() - interval '5 weeks')
    ),
    act AS (
        SELECT DISTINCT user_id, date_trunc('week', created_at) AS wk
        FROM public.test_sessions
        WHERE created_at >= date_trunc('week', now() - interval '5 weeks')
    ),
    joined AS (
        SELECT c.wk AS cohort_wk,
               c.id,
               (extract(epoch FROM (a.wk - c.wk)) / 604800)::int AS week_offset
        FROM cohort c
        LEFT JOIN act a ON a.user_id = c.id AND a.wk >= c.wk
    )
    SELECT jsonb_agg(jsonb_build_object(
               'cohort', to_char(cohort_wk, 'Mon DD'),
               'size',   size,
               'w0',     w0, 'w1', w1, 'w2', w2, 'w3', w3) ORDER BY cohort_wk)
    INTO v_retention
    FROM (
        SELECT cohort_wk,
               count(DISTINCT id) AS size,
               count(DISTINCT id) FILTER (WHERE week_offset = 0) AS w0,
               count(DISTINCT id) FILTER (WHERE week_offset = 1) AS w1,
               count(DISTINCT id) FILTER (WHERE week_offset = 2) AS w2,
               count(DISTINCT id) FILTER (WHERE week_offset = 3) AS w3
        FROM joined GROUP BY cohort_wk
    ) r;

    -- Session volume by hour of day (UTC).
    WITH hrs AS (SELECT generate_series(0, 23) AS h),
    s AS (
        SELECT extract(hour FROM created_at)::int AS h, count(*) AS n
        FROM public.test_sessions
        WHERE created_at >= now() - interval '30 days' GROUP BY 1
    )
    SELECT jsonb_agg(jsonb_build_object('hour', hrs.h, 'sessions', COALESCE(s.n, 0)) ORDER BY hrs.h)
    INTO v_hours
    FROM hrs LEFT JOIN s ON s.h = hrs.h;

    SELECT jsonb_agg(t ORDER BY t.sessions DESC)
    INTO v_modules
    FROM (
        SELECT initcap(test_type) AS module,
               count(DISTINCT user_id) AS users,
               count(*) AS sessions,
               COALESCE(round(100.0 * count(*) FILTER (WHERE is_completed) / NULLIF(count(*), 0), 1), 0) AS completion
        FROM public.test_sessions WHERE test_type IS NOT NULL GROUP BY test_type
    ) t;

    SELECT jsonb_agg(t)
    INTO v_recent
    FROM (
        SELECT id, full_name, email, created_at, subscription_tier, onboarding_completed
        FROM public.users ORDER BY created_at DESC LIMIT 8
    ) t;

    RETURN jsonb_build_object(
        'generatedAt', now(),
        'windowDays',  v_days,
        'kpis', jsonb_build_object(
            'signups', jsonb_build_object('value', v_signups, 'prev', v_signups_prev),
            'active',  jsonb_build_object('dau', v_dau, 'wau', v_wau, 'mau', v_mau, 'prev', v_active_prev,
                          'stickiness', CASE WHEN v_mau > 0 THEN round(100.0 * v_dau / v_mau, 1) ELSE 0 END),
            'paying',  jsonb_build_object('pro', v_pro, 'premium', v_premium, 'total', v_f_paid,
                          'conversion', CASE WHEN v_total_users > 0
                                          THEN round(100.0 * v_f_paid / v_total_users, 1) ELSE 0 END),
            'revenue', jsonb_build_object('usd', v_rev_usd, 'bdt', v_rev_bdt, 'prevUsd', v_rev_usd_prev),
            'aiCost',  jsonb_build_object('usd', round(v_ai_cost, 4), 'prevUsd', round(v_ai_cost_prev, 4),
                          'pricedCalls', v_ai_priced, 'totalCalls', v_ai_total,
                          'perActiveUser', CASE WHEN v_wau > 0 THEN round(v_ai_cost / v_wau, 4) ELSE 0 END)
        ),
        'economics', jsonb_build_object(
            'costPerCompletedTest', CASE WHEN v_completed_tests > 0
                                      THEN round(v_ai_cost / v_completed_tests, 4) ELSE 0 END,
            'costPerPayingUser',    CASE WHEN v_f_paid > 0
                                      THEN round(v_ai_cost / v_f_paid, 4) ELSE 0 END,
            'completedTests',       v_completed_tests,
            'costCoverage',         CASE WHEN v_ai_total > 0
                                      THEN round(100.0 * v_ai_priced / v_ai_total, 1) ELSE 0 END
        ),
        'engagement', jsonb_build_object(
            'startedUsers', v_started_users,
            'repeatUsers',  v_repeat_users,
            'powerUsers',   v_power_users,
            'repeatRate',   CASE WHEN v_started_users > 0
                              THEN round(100.0 * v_repeat_users / v_started_users, 1) ELSE 0 END,
            'mockSessions', v_mock,
            'practiceSessions', v_practice
        ),
        'funnel', jsonb_build_array(
            jsonb_build_object('key','signed_up','label','Signed up','users',v_f_signed),
            jsonb_build_object('key','onboarded','label','Finished onboarding','users',v_f_onboarded),
            jsonb_build_object('key','started','label','Started a test','users',v_f_started),
            jsonb_build_object('key','completed','label','Completed a test','users',v_f_completed),
            jsonb_build_object('key','paid','label','Subscribed','users',v_f_paid)
        ),
        'actions',       v_actions,
        'trend',         COALESCE(v_trend, '[]'::jsonb),
        'retention',     COALESCE(v_retention, '[]'::jsonb),
        'hourly',        COALESCE(v_hours, '[]'::jsonb),
        'modules',       COALESCE(v_modules, '[]'::jsonb),
        'recentSignups', COALESCE(v_recent, '[]'::jsonb),
        'totals',        jsonb_build_object('users', v_total_users)
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_overview(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_overview(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_overview(integer) TO authenticated;

COMMENT ON FUNCTION public.get_admin_overview(integer) IS
'Admin landing-page snapshot: KPIs with prior-period deltas, activation funnel, action queue, cohort retention, unit economics, daily trend and module engagement in one call.';

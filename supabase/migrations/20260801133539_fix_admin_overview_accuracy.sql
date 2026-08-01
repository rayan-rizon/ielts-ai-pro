-- Keep every Admin Overview metric on an explicit, internally consistent
-- contract. The selected range is based on Bangladesh calendar days because
-- that is the operating timezone shown by the dashboard.

CREATE OR REPLACE FUNCTION public.get_admin_overview(p_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_days integer;
    v_since timestamptz;
    v_prev timestamptz;

    v_signups bigint; v_signups_prev bigint;
    v_dau bigint; v_active bigint; v_mau bigint; v_active_prev bigint;
    v_total_users bigint;
    v_pro bigint; v_premium bigint;
    v_rev_usd numeric; v_rev_bdt numeric; v_rev_usd_prev numeric;
    v_ai_cost numeric; v_ai_cost_prev numeric; v_ai_priced bigint; v_ai_total bigint;

    v_f_signed bigint; v_f_onboarded bigint; v_f_started bigint;
    v_f_completed bigint; v_f_paid bigint; v_f_subscribed bigint;

    v_pending_pay bigint; v_pending_oldest numeric;
    v_stuck bigint; v_cancelling bigint; v_expiring bigint; v_eval_failed bigint;

    v_started_users bigint; v_repeat_users bigint; v_power_users bigint;
    v_completed_tests bigint;
    v_mock bigint; v_practice bigint; v_other_modes bigint;

    v_trend jsonb; v_modules jsonb; v_recent jsonb; v_actions jsonb := '[]'::jsonb;
    v_retention jsonb; v_hours jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_days := LEAST(GREATEST(COALESCE(p_days, 7), 1), 90);
    v_since := (
        date_trunc('day', now() AT TIME ZONE 'Asia/Dhaka')
        - make_interval(days => v_days - 1)
    ) AT TIME ZONE 'Asia/Dhaka';
    v_prev := v_since - make_interval(days => v_days);

    -- Users: selected-window activity changes with the range selector. DAU and
    -- MAU remain fixed reference measures for the stickiness calculation.
    SELECT
        count(*),
        count(*) FILTER (WHERE created_at >= v_since),
        count(*) FILTER (WHERE created_at >= v_prev AND created_at < v_since),
        count(*) FILTER (WHERE last_active > now() - interval '1 day'),
        count(*) FILTER (WHERE last_active >= v_since),
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
    INTO v_total_users, v_signups, v_signups_prev, v_dau, v_active, v_mau,
         v_active_prev, v_pro, v_premium, v_f_onboarded, v_cancelling, v_expiring
    FROM public.users;

    v_f_signed := v_total_users;
    v_f_paid := v_pro + v_premium;

    -- Funnel and engagement-depth measures are all-time. Unit economics use
    -- completions from the same selected window as the AI-cost numerator.
    SELECT
        count(DISTINCT ts.user_id) FILTER (WHERE u.onboarding_completed),
        count(DISTINCT ts.user_id) FILTER (WHERE u.onboarding_completed AND ts.is_completed),
        count(*) FILTER (
            WHERE ts.is_completed
              AND COALESCE(ts.completed_at, ts.created_at) >= v_since
        ),
        count(*) FILTER (WHERE ts.test_mode = 'mock'),
        count(*) FILTER (WHERE ts.test_mode = 'practice'),
        count(*) FILTER (WHERE ts.test_mode IS NULL OR ts.test_mode NOT IN ('mock','practice')),
        count(*) FILTER (WHERE ts.evaluation_status = 'failed')
    INTO v_f_started, v_f_completed, v_completed_tests, v_mock, v_practice,
         v_other_modes, v_eval_failed
    FROM public.test_sessions ts
    JOIN public.users u ON u.id = ts.user_id;

    SELECT count(*) INTO v_f_subscribed
    FROM public.users u
    WHERE u.onboarding_completed
      AND u.subscription_tier IN ('pro','premium')
      AND EXISTS (
          SELECT 1
          FROM public.test_sessions ts
          WHERE ts.user_id = u.id
            AND ts.is_completed
      );

    SELECT
        count(*),
        count(*) FILTER (WHERE n >= 2),
        count(*) FILTER (WHERE n >= 5)
    INTO v_started_users, v_repeat_users, v_power_users
    FROM (
        SELECT ts.user_id, count(*) AS n
        FROM public.test_sessions ts
        JOIN public.users u ON u.id = ts.user_id
        GROUP BY ts.user_id
    ) s;

    -- Currency, not payment provider, determines which monetary total receives
    -- a payment. Dedupe matching payment requests against billing history.
    WITH paid AS (
        SELECT bh.amount, upper(bh.currency) AS currency, bh.created_at
        FROM public.billing_history bh
        WHERE bh.status = 'paid'
        UNION ALL
        SELECT pr.amount, upper(pr.currency) AS currency, pr.created_at
        FROM public.payment_requests pr
        WHERE pr.status = 'approved'
          AND NOT EXISTS (
              SELECT 1
              FROM public.billing_history b
              WHERE b.status = 'paid'
                AND b.transaction_id IS NOT NULL
                AND b.transaction_id = pr.transaction_id
          )
    )
    SELECT
        COALESCE(sum(amount) FILTER (WHERE currency = 'USD' AND created_at >= v_since), 0),
        COALESCE(sum(amount) FILTER (WHERE currency = 'BDT' AND created_at >= v_since), 0),
        COALESCE(sum(amount) FILTER (
            WHERE currency = 'USD' AND created_at >= v_prev AND created_at < v_since
        ), 0)
    INTO v_rev_usd, v_rev_bdt, v_rev_usd_prev
    FROM paid;

    -- This remains tracked provider cost, not an invoice total. Coverage makes
    -- the unpriced portion explicit.
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
            'key','pending_payments','label','Payment requests awaiting review',
            'count',v_pending_pay,'severity','high',
            'detail','Payment evidence was submitted and is waiting for admin verification.',
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

    -- Historical app-wide DAU cannot be reconstructed from users.last_active,
    -- which stores only the latest visit. Show distinct test takers instead.
    WITH spine AS (
        SELECT generate_series(
            (v_since AT TIME ZONE 'Asia/Dhaka')::date,
            (now() AT TIME ZONE 'Asia/Dhaka')::date,
            interval '1 day'
        )::date AS day
    ),
    su AS (
        SELECT (created_at AT TIME ZONE 'Asia/Dhaka')::date AS day, count(*) AS n
        FROM public.users
        WHERE created_at >= v_since
        GROUP BY 1
    ),
    testers AS (
        SELECT (created_at AT TIME ZONE 'Asia/Dhaka')::date AS day,
               count(DISTINCT user_id) AS n,
               count(*) AS sessions
        FROM public.test_sessions
        WHERE created_at >= v_since
        GROUP BY 1
    )
    SELECT jsonb_agg(jsonb_build_object(
               'date', to_char(spine.day, 'Mon DD'),
               'signups', COALESCE(su.n, 0),
               'testUsers', COALESCE(testers.n, 0),
               'sessions', COALESCE(testers.sessions, 0)
           ) ORDER BY spine.day)
    INTO v_trend
    FROM spine
    LEFT JOIN su ON su.day = spine.day
    LEFT JOIN testers ON testers.day = spine.day;

    -- Future retention weeks are NULL, not zero. Zero is reserved for a mature
    -- week in which nobody in the cohort ran a test.
    WITH cohort AS (
        SELECT id, date_trunc('week', created_at AT TIME ZONE 'Asia/Dhaka')::date AS wk
        FROM public.users
        WHERE created_at >= (
            date_trunc('week', now() AT TIME ZONE 'Asia/Dhaka') - interval '5 weeks'
        ) AT TIME ZONE 'Asia/Dhaka'
    ),
    act AS (
        SELECT DISTINCT user_id,
               date_trunc('week', created_at AT TIME ZONE 'Asia/Dhaka')::date AS wk
        FROM public.test_sessions
        WHERE created_at >= (
            date_trunc('week', now() AT TIME ZONE 'Asia/Dhaka') - interval '5 weeks'
        ) AT TIME ZONE 'Asia/Dhaka'
    ),
    joined AS (
        SELECT c.wk AS cohort_wk,
               c.id,
               ((a.wk - c.wk) / 7)::int AS week_offset
        FROM cohort c
        LEFT JOIN act a ON a.user_id = c.id AND a.wk >= c.wk
    ),
    rolled AS (
        SELECT cohort_wk,
               count(DISTINCT id) AS size,
               count(DISTINCT id) FILTER (WHERE week_offset = 0) AS w0,
               count(DISTINCT id) FILTER (WHERE week_offset = 1) AS w1,
               count(DISTINCT id) FILTER (WHERE week_offset = 2) AS w2,
               count(DISTINCT id) FILTER (WHERE week_offset = 3) AS w3
        FROM joined
        GROUP BY cohort_wk
    ),
    current_week AS (
        SELECT date_trunc('week', now() AT TIME ZONE 'Asia/Dhaka')::date AS wk
    )
    SELECT jsonb_agg(jsonb_build_object(
               'cohort', to_char(rolled.cohort_wk, 'Mon DD'),
               'size', rolled.size,
               'w0', rolled.w0,
               'w1', CASE WHEN rolled.cohort_wk <= current_week.wk - 7 THEN rolled.w1 END,
               'w2', CASE WHEN rolled.cohort_wk <= current_week.wk - 14 THEN rolled.w2 END,
               'w3', CASE WHEN rolled.cohort_wk <= current_week.wk - 21 THEN rolled.w3 END
           ) ORDER BY rolled.cohort_wk)
    INTO v_retention
    FROM rolled
    CROSS JOIN current_week;

    WITH hrs AS (SELECT generate_series(0, 23) AS h),
    s AS (
        SELECT extract(hour FROM created_at AT TIME ZONE 'Asia/Dhaka')::int AS h, count(*) AS n
        FROM public.test_sessions
        WHERE created_at >= now() - interval '30 days'
        GROUP BY 1
    )
    SELECT jsonb_agg(jsonb_build_object('hour', hrs.h, 'sessions', COALESCE(s.n, 0)) ORDER BY hrs.h)
    INTO v_hours
    FROM hrs
    LEFT JOIN s ON s.h = hrs.h;

    SELECT jsonb_agg(t ORDER BY t.sessions DESC)
    INTO v_modules
    FROM (
        SELECT initcap(lower(test_type)) AS module,
               count(DISTINCT user_id) AS users,
               count(*) AS sessions,
               COALESCE(round(100.0 * count(*) FILTER (WHERE is_completed) / NULLIF(count(*), 0), 1), 0) AS completion
        FROM public.test_sessions
        WHERE test_type IS NOT NULL
        GROUP BY lower(test_type)
    ) t;

    SELECT jsonb_agg(t ORDER BY t.created_at DESC)
    INTO v_recent
    FROM (
        SELECT id, full_name, email, created_at, subscription_tier, onboarding_completed
        FROM public.users
        ORDER BY created_at DESC
        LIMIT 8
    ) t;

    RETURN jsonb_build_object(
        'generatedAt', now(),
        'windowDays', v_days,
        'trendMetric', 'testUsers',
        'hourTimezone', 'Asia/Dhaka',
        'kpis', jsonb_build_object(
            'signups', jsonb_build_object('value', v_signups, 'prev', v_signups_prev),
            'active', jsonb_build_object(
                'value', v_active, 'dau', v_dau, 'mau', v_mau, 'prev', v_active_prev,
                'stickiness', CASE WHEN v_mau > 0 THEN round(100.0 * v_dau / v_mau, 1) ELSE 0 END
            ),
            'paying', jsonb_build_object(
                'pro', v_pro, 'premium', v_premium, 'total', v_f_paid,
                'conversion', CASE WHEN v_total_users > 0
                              THEN round(100.0 * v_f_paid / v_total_users, 1) ELSE 0 END
            ),
            'revenue', jsonb_build_object(
                'usd', v_rev_usd, 'bdt', v_rev_bdt, 'prevUsd', v_rev_usd_prev
            ),
            'aiCost', jsonb_build_object(
                'usd', round(v_ai_cost, 4), 'prevUsd', round(v_ai_cost_prev, 4),
                'pricedCalls', v_ai_priced, 'totalCalls', v_ai_total,
                'perActiveUser', CASE WHEN v_active > 0 THEN round(v_ai_cost / v_active, 4) ELSE 0 END
            )
        ),
        'economics', jsonb_build_object(
            'costPerCompletedTest', CASE WHEN v_completed_tests > 0
                                      THEN round(v_ai_cost / v_completed_tests, 4) ELSE 0 END,
            'costPerPayingUser', CASE WHEN v_f_paid > 0
                                   THEN round(v_ai_cost / v_f_paid, 4) ELSE 0 END,
            'completedTests', v_completed_tests,
            'costCoverage', CASE WHEN v_ai_total > 0
                              THEN round(100.0 * v_ai_priced / v_ai_total, 1) ELSE 0 END
        ),
        'engagement', jsonb_build_object(
            'startedUsers', v_started_users,
            'repeatUsers', v_repeat_users,
            'powerUsers', v_power_users,
            'repeatRate', CASE WHEN v_started_users > 0
                           THEN round(100.0 * v_repeat_users / v_started_users, 1) ELSE 0 END,
            'mockSessions', v_mock,
            'practiceSessions', v_practice,
            'otherModeSessions', v_other_modes
        ),
        'funnel', jsonb_build_array(
            jsonb_build_object('key','signed_up','label','Signed up','users',v_f_signed),
            jsonb_build_object('key','onboarded','label','Finished onboarding','users',v_f_onboarded),
            jsonb_build_object('key','started','label','Started a test','users',v_f_started),
            jsonb_build_object('key','completed','label','Completed a test','users',v_f_completed),
            jsonb_build_object(
                'key','paid','label','Completed + subscribed','users',v_f_subscribed
            )
        ),
        'actions', v_actions,
        'trend', COALESCE(v_trend, '[]'::jsonb),
        'retention', COALESCE(v_retention, '[]'::jsonb),
        'hourly', COALESCE(v_hours, '[]'::jsonb),
        'modules', COALESCE(v_modules, '[]'::jsonb),
        'recentSignups', COALESCE(v_recent, '[]'::jsonb),
        'totals', jsonb_build_object('users', v_total_users)
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_overview(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_overview(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_overview(integer) TO authenticated;

COMMENT ON FUNCTION public.get_admin_overview(integer) IS
'Admin landing-page snapshot with range-aligned KPIs, costs, trends, mature retention cells, and currency-correct revenue.';

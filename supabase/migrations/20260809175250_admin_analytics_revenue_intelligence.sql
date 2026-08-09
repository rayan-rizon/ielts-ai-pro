-- Decision-oriented admin analytics. This intentionally keeps monetary values
-- separated by settlement currency; neither client nor database converts BDT
-- to USD without a dated FX source.

CREATE OR REPLACE FUNCTION public.get_admin_analytics_intelligence(p_range text DEFAULT '30d')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_days integer;
    v_since timestamptz;
    v_total_users bigint; v_new_users bigint; v_active_users bigint;
    v_testers bigint; v_completed bigint; v_paying bigint;
    v_onboarded bigint; v_started bigint; v_new_user_paid bigint;
    v_trend jsonb; v_recent jsonb;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;

    v_days := CASE lower(coalesce(p_range, '30d'))
        WHEN '90d' THEN 90 WHEN '1y' THEN 365 ELSE 30 END;
    v_since := (date_trunc('day', now() AT TIME ZONE 'Asia/Dhaka')
        - make_interval(days => v_days - 1)) AT TIME ZONE 'Asia/Dhaka';

    SELECT count(*),
           count(*) FILTER (WHERE created_at >= v_since),
           count(*) FILTER (WHERE last_active >= v_since),
           count(*) FILTER (WHERE subscription_tier IN ('pro', 'premium'))
    INTO v_total_users, v_new_users, v_active_users, v_paying
    FROM public.users;

    SELECT count(DISTINCT ts.user_id), count(*) FILTER (WHERE ts.is_completed)
    INTO v_testers, v_completed
    FROM public.test_sessions ts
    WHERE ts.created_at >= v_since;

    -- This follows people who signed up in the selected period. Each step
    -- describes their current observed state, not a fabricated event timeline.
    SELECT count(*) FILTER (WHERE u.onboarding_completed),
           count(*) FILTER (WHERE EXISTS (
               SELECT 1 FROM public.test_sessions ts WHERE ts.user_id = u.id
           )),
           count(*) FILTER (WHERE u.subscription_tier IN ('pro', 'premium'))
    INTO v_onboarded, v_started, v_new_user_paid
    FROM public.users u
    WHERE u.created_at >= v_since;

    WITH spine AS (
        SELECT generate_series((v_since AT TIME ZONE 'Asia/Dhaka')::date,
                               (now() AT TIME ZONE 'Asia/Dhaka')::date,
                               interval '1 day')::date AS day
    ), signups AS (
        SELECT (created_at AT TIME ZONE 'Asia/Dhaka')::date AS day, count(*) AS n
        FROM public.users WHERE created_at >= v_since GROUP BY 1
    ), practice AS (
        SELECT (created_at AT TIME ZONE 'Asia/Dhaka')::date AS day,
               count(DISTINCT user_id) AS users,
               count(*) FILTER (WHERE is_completed) AS completions
        FROM public.test_sessions WHERE created_at >= v_since GROUP BY 1
    )
    SELECT jsonb_agg(jsonb_build_object(
        'date', to_char(spine.day, CASE WHEN v_days = 365 THEN 'Mon YY' ELSE 'Mon DD' END),
        'signups', coalesce(signups.n, 0), 'testers', coalesce(practice.users, 0),
        'completions', coalesce(practice.completions, 0)
    ) ORDER BY spine.day) INTO v_trend
    FROM spine LEFT JOIN signups USING (day) LEFT JOIN practice USING (day);

    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC) INTO v_recent
    FROM (
        SELECT id, full_name, email, created_at, subscription_tier, onboarding_completed
        FROM public.users ORDER BY created_at DESC LIMIT 8
    ) t;

    RETURN jsonb_build_object(
        'windowDays', v_days,
        'totalUsers', v_total_users, 'newUsers', v_new_users,
        'activeUsers', v_active_users, 'testers', v_testers,
        'completedTests', v_completed, 'payingUsers', v_paying,
        'conversionRate', CASE WHEN v_total_users > 0 THEN round(100.0 * v_paying / v_total_users, 1) ELSE 0 END,
        'activationRate', CASE WHEN v_new_users > 0 THEN round(100.0 * v_onboarded / v_new_users, 1) ELSE 0 END,
        'funnel', jsonb_build_array(
            jsonb_build_object('label', 'Signed up', 'users', v_new_users),
            jsonb_build_object('label', 'Finished onboarding', 'users', v_onboarded),
            jsonb_build_object('label', 'Started practice', 'users', v_started),
            jsonb_build_object('label', 'Paid', 'users', v_new_user_paid)
        ),
        'trend', coalesce(v_trend, '[]'::jsonb),
        'recentSignups', coalesce(v_recent, '[]'::jsonb)
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_analytics_intelligence(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_analytics_intelligence(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics_intelligence(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_revenue_intelligence(p_range text DEFAULT '30d')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_days integer; v_since timestamptz; v_prev timestamptz;
    v_usd numeric; v_bdt numeric; v_prev_usd numeric; v_prev_bdt numeric;
    v_transactions bigint; v_prev_transactions bigint;
    v_subscribers bigint; v_cancelling bigint; v_expiring bigint; v_failed bigint;
    v_trend jsonb; v_methods jsonb; v_recent jsonb;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
    v_days := CASE lower(coalesce(p_range, '30d'))
        WHEN '90d' THEN 90 WHEN '1y' THEN 365 ELSE 30 END;
    v_since := (date_trunc('day', now() AT TIME ZONE 'Asia/Dhaka')
        - make_interval(days => v_days - 1)) AT TIME ZONE 'Asia/Dhaka';
    v_prev := v_since - make_interval(days => v_days);

    WITH paid AS (
        SELECT bh.id, bh.auth_id, bh.user_id, bh.amount, upper(bh.currency) AS currency,
               bh.tier, bh.billing_interval, bh.payment_method, bh.created_at
        FROM public.billing_history bh WHERE bh.status = 'paid'
        UNION ALL
        SELECT pr.id, pr.auth_id, NULL::uuid, pr.amount, upper(pr.currency),
               pr.tier, pr.interval, pr.payment_method, pr.created_at
        FROM public.payment_requests pr WHERE pr.status = 'approved'
          AND NOT EXISTS (SELECT 1 FROM public.billing_history b WHERE b.status = 'paid'
            AND b.transaction_id IS NOT NULL AND b.transaction_id = pr.transaction_id)
    )
    SELECT coalesce(sum(amount) FILTER (WHERE currency = 'USD' AND created_at >= v_since), 0),
           coalesce(sum(amount) FILTER (WHERE currency = 'BDT' AND created_at >= v_since), 0),
           coalesce(sum(amount) FILTER (WHERE currency = 'USD' AND created_at >= v_prev AND created_at < v_since), 0),
           coalesce(sum(amount) FILTER (WHERE currency = 'BDT' AND created_at >= v_prev AND created_at < v_since), 0),
           count(*) FILTER (WHERE created_at >= v_since),
           count(*) FILTER (WHERE created_at >= v_prev AND created_at < v_since)
    INTO v_usd, v_bdt, v_prev_usd, v_prev_bdt, v_transactions, v_prev_transactions FROM paid;

    SELECT count(*) FILTER (WHERE subscription_tier IN ('pro','premium')),
           count(*) FILTER (WHERE subscription_tier IN ('pro','premium') AND cancel_at_period_end IS TRUE AND subscription_end_date > now()),
           count(*) FILTER (WHERE subscription_tier IN ('pro','premium') AND subscription_end_date BETWEEN now() AND now() + interval '7 days'),
           count(*) FILTER (WHERE payment_failed_at >= now() - interval '7 days')
    INTO v_subscribers, v_cancelling, v_expiring, v_failed FROM public.users;

    WITH paid AS (
        SELECT amount, upper(currency) AS currency, payment_method, created_at FROM public.billing_history WHERE status = 'paid'
        UNION ALL SELECT pr.amount, upper(pr.currency), pr.payment_method, pr.created_at FROM public.payment_requests pr
        WHERE pr.status = 'approved' AND NOT EXISTS (SELECT 1 FROM public.billing_history b WHERE b.status = 'paid' AND b.transaction_id IS NOT NULL AND b.transaction_id = pr.transaction_id)
    ), spine AS (
        SELECT generate_series((v_since AT TIME ZONE 'Asia/Dhaka')::date, (now() AT TIME ZONE 'Asia/Dhaka')::date, interval '1 day')::date AS day
    ), daily AS (
        SELECT (created_at AT TIME ZONE 'Asia/Dhaka')::date AS day,
               sum(amount) FILTER (WHERE currency = 'USD') AS usd,
               sum(amount) FILTER (WHERE currency = 'BDT') AS bdt, count(*) AS transactions
        FROM paid WHERE created_at >= v_since GROUP BY 1
    )
    SELECT jsonb_agg(jsonb_build_object('date', to_char(spine.day, CASE WHEN v_days = 365 THEN 'Mon YY' ELSE 'Mon DD' END),
      'revenueUsd', coalesce(daily.usd, 0), 'revenueBdt', coalesce(daily.bdt, 0), 'transactions', coalesce(daily.transactions, 0)) ORDER BY spine.day)
    INTO v_trend FROM spine LEFT JOIN daily USING (day);

    WITH paid AS (
        SELECT amount, upper(currency) AS currency, coalesce(nullif(payment_method, ''), 'unknown') AS method FROM public.billing_history WHERE status = 'paid'
        UNION ALL SELECT pr.amount, upper(pr.currency), coalesce(nullif(pr.payment_method, ''), 'unknown') FROM public.payment_requests pr
        WHERE pr.status = 'approved' AND NOT EXISTS (SELECT 1 FROM public.billing_history b WHERE b.status = 'paid' AND b.transaction_id IS NOT NULL AND b.transaction_id = pr.transaction_id)
    ) SELECT jsonb_agg(jsonb_build_object('method', method, 'currency', currency, 'transactions', transactions, 'amount', amount) ORDER BY transactions DESC)
    INTO v_methods FROM (SELECT method, currency, count(*) AS transactions, sum(amount) AS amount FROM paid GROUP BY method, currency) m;

    WITH paid AS (
        SELECT bh.id, bh.auth_id, bh.user_id, bh.amount, bh.currency, bh.tier, bh.billing_interval, bh.payment_method, bh.created_at FROM public.billing_history bh WHERE bh.status = 'paid'
        UNION ALL SELECT pr.id, pr.auth_id, NULL::uuid, pr.amount, pr.currency, pr.tier, pr.interval, pr.payment_method, pr.created_at FROM public.payment_requests pr WHERE pr.status = 'approved'
        AND NOT EXISTS (SELECT 1 FROM public.billing_history b WHERE b.status = 'paid' AND b.transaction_id IS NOT NULL AND b.transaction_id = pr.transaction_id)
    ) SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC) INTO v_recent FROM (
        SELECT p.id, p.amount, p.currency, p.tier, p.billing_interval, p.payment_method, p.created_at, coalesce(ua.full_name, ub.full_name) AS full_name, coalesce(ua.email, ub.email) AS email
        FROM paid p LEFT JOIN public.users ua ON ua.auth_id = p.auth_id LEFT JOIN public.users ub ON ub.id = p.user_id AND p.auth_id IS NULL ORDER BY p.created_at DESC LIMIT 10
    ) t;

    RETURN jsonb_build_object('windowDays', v_days, 'revenueUsd', v_usd, 'revenueBdt', v_bdt,
      'previousUsd', v_prev_usd, 'previousBdt', v_prev_bdt, 'transactions', v_transactions, 'previousTransactions', v_prev_transactions,
      'activeSubscribers', v_subscribers, 'cancellingSubscribers', v_cancelling, 'expiringSubscribers', v_expiring, 'failedPayments', v_failed,
      'trend', coalesce(v_trend, '[]'::jsonb), 'paymentMethods', coalesce(v_methods, '[]'::jsonb), 'recentTransactions', coalesce(v_recent, '[]'::jsonb));
END;
$function$;

REVOKE ALL ON FUNCTION public.get_revenue_intelligence(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_revenue_intelligence(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_revenue_intelligence(text) TO authenticated;

COMMENT ON FUNCTION public.get_admin_analytics_intelligence(text) IS 'Admin-only, range-aware community health, new-user activation, practice, and conversion metrics.';
COMMENT ON FUNCTION public.get_revenue_intelligence(text) IS 'Admin-only, range-aware settled revenue and renewal-risk metrics with USD and BDT always kept separate.';

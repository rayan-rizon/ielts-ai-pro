-- =============================================================================
-- FIX: Split Revenue Analytics by Currency (USD for Stripe, BDT for Manual)
-- =============================================================================
-- The previous get_revenue_analytics function summed USD and BDT amounts
-- interchangeably. This update splits all aggregations (total, monthly, tier)
-- into separate `usd` and `bdt` metrics.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_revenue_analytics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_monthly_revenue   json;
    v_revenue_by_tier   json;
    v_recent_transactions json;
    v_active_subscribers  bigint;
    v_pro_count           bigint;
    v_premium_count       bigint;
    v_arpu_usd          numeric;
    v_arpu_bdt          numeric;
    v_stripe_revenue    numeric;
    v_manual_revenue    numeric;
BEGIN
    -- Admin guard
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE auth_id = (SELECT auth.uid())
          AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- ── Total & breakdown ────────────────────────────────────────────────────
    SELECT COALESCE(SUM(amount), 0)
    INTO v_stripe_revenue
    FROM public.billing_history
    WHERE status = 'paid'
      AND LOWER(payment_method) = 'stripe';

    SELECT COALESCE(SUM(amount), 0)
    INTO v_manual_revenue
    FROM public.billing_history
    WHERE status = 'paid'
      AND LOWER(payment_method) != 'stripe';

    -- ── Monthly revenue (last 6 months) ─────────────────────────────────────
    SELECT json_agg(t ORDER BY t.month_start)
    INTO v_monthly_revenue
    FROM (
        SELECT
            date_trunc('month', created_at)                      AS month_start,
            to_char(date_trunc('month', created_at), 'Mon YYYY') AS month,
            to_char(date_trunc('month', created_at), 'Mon')      AS label,
            SUM(CASE WHEN LOWER(payment_method) = 'stripe' THEN amount ELSE 0 END) AS revenue_usd,
            SUM(CASE WHEN LOWER(payment_method) != 'stripe' THEN amount ELSE 0 END) AS revenue_bdt,
            COUNT(*)                                             AS transactions
        FROM public.billing_history
        WHERE status = 'paid'
          AND created_at >= (now() - INTERVAL '6 months')
        GROUP BY date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at)
    ) t;

    -- ── Revenue by tier ──────────────────────────────────────────────────────
    SELECT json_agg(t)
    INTO v_revenue_by_tier
    FROM (
        SELECT
            tier,
            SUM(CASE WHEN LOWER(payment_method) = 'stripe' THEN amount ELSE 0 END)  AS revenue_usd,
            SUM(CASE WHEN LOWER(payment_method) != 'stripe' THEN amount ELSE 0 END) AS revenue_bdt,
            COUNT(*)     AS count
        FROM public.billing_history
        WHERE status = 'paid'
        GROUP BY tier
    ) t;

    -- ── Recent transactions (last 10) ────────────────────────────────────────
    -- Uses COALESCE to match via auth_id first, then user_id as fallback
    SELECT json_agg(t)
    INTO v_recent_transactions
    FROM (
        SELECT
            bh.id,
            bh.amount,
            bh.currency,
            bh.tier,
            bh.billing_interval,
            bh.payment_method,
            bh.created_at,
            COALESCE(ua.full_name, ub.full_name)    AS full_name,
            COALESCE(ua.email, ub.email)             AS email,
            COALESCE(ua.avatar_url, ub.avatar_url)   AS avatar_url
        FROM public.billing_history bh
        LEFT JOIN public.users ua ON ua.auth_id = bh.auth_id
        LEFT JOIN public.users ub ON ub.id = bh.user_id AND bh.auth_id IS NULL
        WHERE bh.status = 'paid'
        ORDER BY bh.created_at DESC
        LIMIT 10
    ) t;

    -- ── Active subscriber counts ─────────────────────────────────────────────
    SELECT COUNT(*) INTO v_active_subscribers
    FROM public.users
    WHERE subscription_tier IN ('pro', 'premium');

    SELECT COUNT(*) INTO v_pro_count
    FROM public.users
    WHERE subscription_tier = 'pro';

    SELECT COUNT(*) INTO v_premium_count
    FROM public.users
    WHERE subscription_tier = 'premium';

    -- ── ARPU ─────────────────────────────────────────────────────────────────
    IF v_active_subscribers > 0 THEN
        v_arpu_usd := ROUND(v_stripe_revenue / v_active_subscribers, 2);
        v_arpu_bdt := ROUND(v_manual_revenue / v_active_subscribers, 2);
    ELSE
        v_arpu_usd := 0;
        v_arpu_bdt := 0;
    END IF;

    RETURN json_build_object(
        'stripeRevenue',      v_stripe_revenue,
        'manualRevenue',      v_manual_revenue,
        'monthlyRevenue',     COALESCE(v_monthly_revenue, '[]'::json),
        'revenueByTier',      COALESCE(v_revenue_by_tier, '[]'::json),
        'recentTransactions', COALESCE(v_recent_transactions, '[]'::json),
        'activeSubscribers',  v_active_subscribers,
        'proCount',           v_pro_count,
        'premiumCount',       v_premium_count,
        'arpuUsd',            v_arpu_usd,
        'arpuBdt',            v_arpu_bdt,
        'ltvUsd',             ROUND(v_arpu_usd * 12, 2),
        'ltvBdt',             ROUND(v_arpu_bdt * 12, 2)
    );
END;
$$;

-- =============================================================================
-- FIX: Revenue Analytics shows $0 for both local and Stripe payments
-- =============================================================================
-- ROOT CAUSE 1 (Manual/local): handle_payment_approval trigger updates
--   users.subscription_tier but NEVER writes to billing_history.
--   So all manually approved payments are invisible to the analytics RPC.
--
-- ROOT CAUSE 2 (Stripe join): get_revenue_analytics recent-transactions
--   query only joins billing_history on auth_id; rows where only user_id
--   matched (Stripe fallback path) lose the user name display.
--
-- FIX PLAN:
--   1. Update handle_payment_approval to also INSERT into billing_history
--   2. Backfill all previously-approved manual payments into billing_history
--   3. Update get_revenue_analytics with an improved JOIN + manual revenue
--      detection (payment_method != 'stripe' catches bKash/Nagad/etc.)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Update handle_payment_approval trigger
--    Adds billing_history insert on approval. Keeps the existing bypass-flag
--    pattern already used for protect_sensitive_user_columns.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_payment_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    IF (OLD.status = 'pending' AND NEW.status = 'approved') THEN

        -- Resolve the user's internal id for billing_history
        SELECT id INTO v_user_id
        FROM public.users
        WHERE auth_id = NEW.auth_id;

        -- Set bypass flag so protect_sensitive_user_columns allows this update
        PERFORM set_config('app.bypass_column_protection', 'on', true);

        UPDATE public.users
        SET
            subscription_tier       = NEW.tier,
            billing_interval        = NEW.interval,
            subscription_start_date = NOW(),
            subscription_amount     = NEW.amount,
            subscription_currency   = COALESCE(NEW.currency, 'BDT'),
            updated_at              = NOW()
        WHERE auth_id = NEW.auth_id;

        -- Clear bypass flag immediately
        PERFORM set_config('app.bypass_column_protection', '', true);

        -- ── NEW: Record payment in billing_history so revenue analytics works ──
        INSERT INTO public.billing_history (
            user_id,
            auth_id,
            amount,
            currency,
            payment_method,
            transaction_id,
            status,
            tier,
            billing_interval
        ) VALUES (
            v_user_id,
            NEW.auth_id,
            NEW.amount,
            COALESCE(NEW.currency, 'BDT'),
            COALESCE(NEW.payment_method, 'manual'),
            NEW.transaction_id,
            'paid',
            NEW.tier,
            NEW.interval
        )
        ON CONFLICT (transaction_id) DO NOTHING;

    END IF;
    RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Backfill all previously-approved manual payments into billing_history
--    ON CONFLICT DO NOTHING makes this idempotent / safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.billing_history (
    user_id,
    auth_id,
    amount,
    currency,
    payment_method,
    transaction_id,
    status,
    tier,
    billing_interval,
    created_at
)
SELECT
    u.id                                    AS user_id,
    pr.auth_id,
    pr.amount,
    COALESCE(pr.currency, 'BDT')            AS currency,
    COALESCE(pr.payment_method, 'manual')   AS payment_method,
    pr.transaction_id,
    'paid'                                  AS status,
    pr.tier,
    pr.interval                             AS billing_interval,
    pr.created_at
FROM public.payment_requests pr
LEFT JOIN public.users u ON u.auth_id = pr.auth_id
WHERE pr.status = 'approved'
ON CONFLICT (transaction_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Update get_revenue_analytics RPC
--    Fixes JOIN to use COALESCE(auth_id join, user_id join) so Stripe rows
--    that only populated user_id still return the user's name.
--    Also adds a fallback zero for NULL amounts and properly labels
--    any non-stripe row as "manual" revenue.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_revenue_analytics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_total_revenue     numeric;
    v_monthly_revenue   json;
    v_revenue_by_tier   json;
    v_recent_transactions json;
    v_active_subscribers  bigint;
    v_pro_count           bigint;
    v_premium_count       bigint;
    v_arpu              numeric;
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
    INTO v_total_revenue
    FROM public.billing_history
    WHERE status = 'paid';

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
            SUM(amount)                                          AS revenue,
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
            SUM(amount)  AS revenue,
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
        v_arpu := ROUND(v_total_revenue / v_active_subscribers, 2);
    ELSE
        v_arpu := 0;
    END IF;

    RETURN json_build_object(
        'totalRevenue',       v_total_revenue,
        'stripeRevenue',      v_stripe_revenue,
        'manualRevenue',      v_manual_revenue,
        'monthlyRevenue',     COALESCE(v_monthly_revenue, '[]'::json),
        'revenueByTier',      COALESCE(v_revenue_by_tier, '[]'::json),
        'recentTransactions', COALESCE(v_recent_transactions, '[]'::json),
        'activeSubscribers',  v_active_subscribers,
        'proCount',           v_pro_count,
        'premiumCount',       v_premium_count,
        'arpu',               v_arpu,
        'ltv',                ROUND(v_arpu * 12, 2)
    );
END;
$$;

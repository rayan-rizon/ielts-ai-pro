-- Keep Stripe payments visible in the admin payment history. The transaction
-- uniqueness also prevents a webhook and the client-side session sync fallback
-- from creating two records for the same checkout.
CREATE UNIQUE INDEX IF NOT EXISTS payment_requests_stripe_transaction_id_key
ON public.payment_requests (transaction_id)
WHERE LOWER(payment_method) = 'stripe';

CREATE OR REPLACE FUNCTION public.handle_stripe_event(
    p_event_id TEXT,
    p_event_type TEXT,
    p_auth_id TEXT,
    p_user_id TEXT,
    p_tier TEXT,
    p_interval TEXT,
    p_amount NUMERIC,
    p_currency TEXT,
    p_transaction_id TEXT,
    p_subscription_id TEXT DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_cancel_at_period_end BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_error TEXT;
    v_row_count INTEGER;
    v_applied_promo_id TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM stripe_events WHERE id = p_event_id) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Event already processed');
    END IF;

    PERFORM set_config('app.bypass_column_protection', 'on', true);

    IF p_event_type = 'checkout.session.completed' THEN
        SELECT (promo_discount->>'promo_id') INTO v_applied_promo_id
        FROM users
        WHERE auth_id = p_auth_id::uuid OR id = p_user_id::uuid
        LIMIT 1;

        IF v_applied_promo_id IS NOT NULL THEN
            UPDATE promo_codes
            SET current_uses = current_uses + 1
            WHERE id = v_applied_promo_id::uuid;
        END IF;
    END IF;

    INSERT INTO stripe_events (id, type, processed_at, status, metadata)
    VALUES (p_event_id, p_event_type, NOW(), 'processing', p_metadata)
    ON CONFLICT (id) DO NOTHING;

    UPDATE users
    SET
        subscription_tier      = COALESCE(p_tier, subscription_tier),
        billing_interval       = p_interval,
        stripe_subscription_id = COALESCE(p_subscription_id, stripe_subscription_id),
        subscription_start_date = CASE
            WHEN p_event_type IN ('checkout.session.completed', 'invoice.paid')
            THEN COALESCE(subscription_start_date, NOW())
            ELSE subscription_start_date
        END,
        subscription_end_date  = COALESCE(p_end_date, subscription_end_date),
        subscription_amount    = p_amount,
        subscription_currency  = COALESCE(NULLIF(UPPER(p_currency), ''), 'USD'),
        cancel_at_period_end   = p_cancel_at_period_end,
        used_promo_codes       = CASE
            WHEN p_event_type = 'checkout.session.completed'
                 AND v_applied_promo_id IS NOT NULL
                 AND NOT (v_applied_promo_id = ANY(COALESCE(used_promo_codes, ARRAY[]::text[])))
            THEN array_append(COALESCE(used_promo_codes, ARRAY[]::text[]), v_applied_promo_id)
            ELSE used_promo_codes
        END,
        promo_discount         = CASE
            WHEN p_event_type = 'checkout.session.completed' THEN NULL
            ELSE promo_discount
        END,
        updated_at             = NOW()
    WHERE auth_id = p_auth_id::uuid OR id = p_user_id::uuid;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;

    IF p_event_type IN ('checkout.session.completed', 'invoice.paid')
       AND p_tier IN ('pro', 'premium')
       AND NULLIF(BTRIM(p_transaction_id), '') IS NOT NULL THEN
        INSERT INTO payment_requests (
            auth_id, tier, interval, amount, currency, payment_method,
            transaction_id, sender_phone, status, admin_notes, created_at, updated_at
        ) VALUES (
            p_auth_id::uuid,
            p_tier,
            CASE WHEN p_interval = 'quarterly' THEN 'quarterly' ELSE 'monthly' END,
            COALESCE(p_amount, 0),
            COALESCE(NULLIF(UPPER(BTRIM(p_currency)), ''), 'USD'),
            'stripe',
            p_transaction_id,
            'Stripe',
            'approved',
            CASE
                WHEN p_event_type = 'invoice.paid' THEN 'Stripe subscription renewal'
                ELSE 'Stripe Checkout payment'
            END,
            NOW(),
            NOW()
        )
        ON CONFLICT (transaction_id) WHERE LOWER(payment_method) = 'stripe'
        DO UPDATE SET
            auth_id = EXCLUDED.auth_id,
            tier = EXCLUDED.tier,
            interval = EXCLUDED.interval,
            amount = EXCLUDED.amount,
            currency = EXCLUDED.currency,
            status = 'approved',
            admin_notes = EXCLUDED.admin_notes,
            updated_at = NOW();
    END IF;

    UPDATE stripe_events
    SET status = 'processed', error_message = NULL
    WHERE id = p_event_id;

    RETURN jsonb_build_object('success', true, 'rows_updated', v_row_count);

EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;

    INSERT INTO stripe_events (id, type, status, error_message, metadata)
    VALUES (p_event_id, p_event_type, 'failed', v_error, p_metadata)
    ON CONFLICT (id) DO UPDATE SET status = 'failed', error_message = v_error;

    RETURN jsonb_build_object('success', false, 'error', v_error);
END;
$$;

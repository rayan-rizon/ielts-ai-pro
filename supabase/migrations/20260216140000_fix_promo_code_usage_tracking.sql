-- ============================================================================
-- Migration: Fix promo code usage tracking in used_promo_codes array
-- 
-- Logic: Ensure that discount-type codes are persistently recorded in the 
-- users.used_promo_codes array upon successful checkout completion.
-- This prevents users from reusing the same discount code multiple times.
-- ============================================================================

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
    -- 1. Idempotency check
    IF EXISTS (SELECT 1 FROM stripe_events WHERE id = p_event_id) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Event already processed');
    END IF;

    -- 2. Bypass trigger protection for subscription column updates
    PERFORM set_config('app.bypass_column_protection', 'on', true);

    -- 3. Handle promo code usage increment and recording on checkout
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

    -- 4. Insert event record
    INSERT INTO stripe_events (id, type, processed_at, status, metadata)
    VALUES (p_event_id, p_event_type, NOW(), 'processing', p_metadata)
    ON CONFLICT (id) DO NOTHING;

    -- 5. Update user subscription data and permanent usage history
    UPDATE users
    SET
        subscription_tier     = COALESCE(p_tier, subscription_tier),
        billing_interval      = p_interval,
        stripe_subscription_id = COALESCE(p_subscription_id, stripe_subscription_id),
        subscription_end_date = COALESCE(p_end_date, subscription_end_date),
        cancel_at_period_end  = p_cancel_at_period_end,
        -- Record usage persistently if this is a completed checkout with a promo applied
        used_promo_codes      = CASE
            WHEN p_event_type = 'checkout.session.completed' AND v_applied_promo_id IS NOT NULL 
                 AND NOT (v_applied_promo_id = ANY(COALESCE(used_promo_codes, ARRAY[]::text[])))
            THEN array_append(COALESCE(used_promo_codes, ARRAY[]::text[]), v_applied_promo_id)
            ELSE used_promo_codes
        END,
        -- Clear temporary discount after it's been recorded and applied
        promo_discount        = CASE 
            WHEN p_event_type = 'checkout.session.completed' THEN NULL
            ELSE promo_discount
        END,
        updated_at            = NOW()
    WHERE auth_id = p_auth_id::uuid OR id = p_user_id::uuid;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;

    -- 6. Mark event as processed
    UPDATE stripe_events
    SET status = 'processed', error_message = NULL
    WHERE id = p_event_id;

    RETURN jsonb_build_object('success', true, 'rows_updated', v_row_count);

EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;

    -- Record the failure
    INSERT INTO stripe_events (id, type, status, error_message, metadata)
    VALUES (p_event_id, p_event_type, 'failed', v_error, p_metadata)
    ON CONFLICT (id) DO UPDATE SET status = 'failed', error_message = v_error;

    RETURN jsonb_build_object('success', false, 'error', v_error);
END;
$$;

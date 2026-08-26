-- Confirmed invariants from the 2026-08-27 project audit:
-- 1. Promo capacity and per-user redemption checks are serialized.
-- 2. Stripe webhook and client recovery claim one canonical checkout event
--    before any subscription or promo side effect.
-- 3. AI quota lookups have an index matching their actual filter shape.

CREATE OR REPLACE FUNCTION public.redeem_promo_code(code_lookup text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_auth_id uuid;
  v_profile_id uuid;
  v_promo public.promo_codes%ROWTYPE;
  v_already_used boolean;
BEGIN
  v_auth_id := auth.uid();
  IF v_auth_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not logged in');
  END IF;

  SELECT id INTO v_profile_id
  FROM public.users
  WHERE auth_id = v_auth_id
  FOR UPDATE;
  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE upper(code) = upper(trim(code_lookup))
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > now())
    AND (offer_expires_at IS NULL OR offer_expires_at > now())
    AND (assigned_user_id IS NULL OR assigned_user_id = v_profile_id)
  FOR UPDATE;

  IF v_promo IS NULL
     OR (v_promo.max_uses IS NOT NULL AND COALESCE(v_promo.current_uses, 0) >= v_promo.max_uses) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid, expired, or fully claimed promo code');
  END IF;

  SELECT (v_promo.id::text = ANY(COALESCE(used_promo_codes, ARRAY[]::text[])))
  INTO v_already_used
  FROM public.users
  WHERE id = v_profile_id;
  IF COALESCE(v_already_used, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already used this promo code');
  END IF;

  IF v_promo.grants_subscription IS NOT NULL THEN
    PERFORM set_config('app.bypass_column_protection', 'on', true);
    UPDATE public.users
    SET subscription_tier = v_promo.grants_subscription,
        promo_discount = NULL,
        used_promo_codes = array_append(COALESCE(used_promo_codes, ARRAY[]::text[]), v_promo.id::text),
        updated_at = now()
    WHERE id = v_profile_id;
    PERFORM set_config('app.bypass_column_protection', 'off', true);

    UPDATE public.promo_codes
    SET current_uses = COALESCE(current_uses, 0) + 1
    WHERE id = v_promo.id;
    RETURN jsonb_build_object(
      'success', true,
      'type', 'grant',
      'subscription', v_promo.grants_subscription,
      'message', 'Subscription ' || initcap(v_promo.grants_subscription) || ' activated successfully!'
    );
  END IF;

  PERFORM set_config('app.bypass_column_protection', 'on', true);
  UPDATE public.users
  SET promo_discount = jsonb_build_object(
        'code', v_promo.code,
        'discount_type', v_promo.discount_type,
        'discount_value', v_promo.discount_value,
        'applied_date', now()
      ),
      used_promo_codes = array_append(COALESCE(used_promo_codes, ARRAY[]::text[]), v_promo.id::text),
      updated_at = now()
  WHERE id = v_profile_id;
  PERFORM set_config('app.bypass_column_protection', 'off', true);

  UPDATE public.promo_codes
  SET current_uses = COALESCE(current_uses, 0) + 1
  WHERE id = v_promo.id;
  RETURN jsonb_build_object(
    'success', true,
    'type', 'discount',
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value,
    'code', v_promo.code,
    'message', 'Discount applied successfully!'
  );
END;
$$;

CREATE INDEX IF NOT EXISTS idx_ai_api_usage_quota
ON public.ai_api_usage (user_id, endpoint, created_at DESC)
WHERE cached = FALSE;

-- Point awards must pass through the authenticated Edge Function. The
-- service-only RPC provides durable idempotency and a bounded daily budget.
CREATE TABLE IF NOT EXISTS public.user_point_award_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id uuid NOT NULL,
    action_key text NOT NULL,
    reason text NOT NULL,
    points integer NOT NULL CHECK (points BETWEEN 1 AND 1200),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (auth_id, action_key)
);

ALTER TABLE public.user_point_award_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_point_award_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.user_point_award_events TO service_role;
CREATE INDEX IF NOT EXISTS idx_user_point_award_events_daily
ON public.user_point_award_events (auth_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.award_user_points(
    p_auth_id uuid,
    p_points integer,
    p_action_key text,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_profile_id uuid;
    v_daily_points integer;
    v_new_points integer;
BEGIN
    IF p_auth_id IS NULL
       OR p_points NOT BETWEEN 1 AND 1200
       OR NULLIF(BTRIM(p_action_key), '') IS NULL
       OR LENGTH(p_action_key) > 200
       OR p_reason NOT IN ('test_completion', 'vocabulary_add', 'vocabulary_mastery', 'vocabulary_review', 'speaking_evaluation') THEN
        RAISE EXCEPTION 'Invalid point award request';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(p_auth_id::text, 0));

    SELECT id INTO v_profile_id
    FROM public.users
    WHERE auth_id = p_auth_id;
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT points INTO v_new_points
    FROM public.user_points
    WHERE user_id = v_profile_id
    FOR UPDATE;

    IF EXISTS (
        SELECT 1 FROM public.user_point_award_events
        WHERE auth_id = p_auth_id AND action_key = p_action_key
    ) THEN
        RETURN jsonb_build_object('awarded', false, 'new_points', COALESCE(v_new_points, 0));
    END IF;

    SELECT COALESCE(SUM(points), 0)::integer INTO v_daily_points
    FROM public.user_point_award_events
    WHERE auth_id = p_auth_id AND created_at >= date_trunc('day', now());
    IF v_daily_points + p_points > 5000 THEN
        RAISE EXCEPTION 'Daily point award limit exceeded';
    END IF;

    INSERT INTO public.user_point_award_events (auth_id, action_key, reason, points)
    VALUES (p_auth_id, p_action_key, p_reason, p_points);

    INSERT INTO public.user_points (user_id, points, updated_at)
    VALUES (v_profile_id, p_points, now())
    ON CONFLICT (user_id) DO UPDATE
    SET points = public.user_points.points + EXCLUDED.points,
        updated_at = now()
    RETURNING points INTO v_new_points;

    RETURN jsonb_build_object('awarded', true, 'new_points', v_new_points);
END;
$$;

REVOKE ALL ON FUNCTION public.award_user_points(uuid, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_user_points(uuid, integer, text, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.add_user_points(integer) FROM authenticated;

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
    v_claimed_count INTEGER;
    v_applied_promo_id TEXT;
BEGIN
    INSERT INTO stripe_events (id, type, processed_at, status, metadata)
    VALUES (p_event_id, p_event_type, NOW(), 'processing', p_metadata)
    ON CONFLICT (id) DO UPDATE
    SET type = EXCLUDED.type,
        processed_at = NOW(),
        status = 'processing',
        error_message = NULL,
        metadata = EXCLUDED.metadata
    WHERE stripe_events.status = 'failed';
    GET DIAGNOSTICS v_claimed_count = ROW_COUNT;

    IF v_claimed_count = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'claimed', false,
            'message', 'Event already processed'
        );
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

    UPDATE users
    SET
        subscription_tier = COALESCE(p_tier, subscription_tier),
        billing_interval = p_interval,
        stripe_subscription_id = COALESCE(p_subscription_id, stripe_subscription_id),
        subscription_start_date = CASE
            WHEN p_event_type IN ('checkout.session.completed', 'invoice.paid')
            THEN COALESCE(subscription_start_date, NOW())
            ELSE subscription_start_date
        END,
        subscription_end_date = COALESCE(p_end_date, subscription_end_date),
        subscription_amount = p_amount,
        subscription_currency = COALESCE(NULLIF(UPPER(p_currency), ''), 'USD'),
        cancel_at_period_end = p_cancel_at_period_end,
        used_promo_codes = CASE
            WHEN p_event_type = 'checkout.session.completed'
                 AND v_applied_promo_id IS NOT NULL
                 AND NOT (v_applied_promo_id = ANY(COALESCE(used_promo_codes, ARRAY[]::text[])))
            THEN array_append(COALESCE(used_promo_codes, ARRAY[]::text[]), v_applied_promo_id)
            ELSE used_promo_codes
        END,
        promo_discount = CASE
            WHEN p_event_type = 'checkout.session.completed' THEN NULL
            ELSE promo_discount
        END,
        updated_at = NOW()
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

    RETURN jsonb_build_object('success', true, 'claimed', true, 'rows_updated', v_row_count);

EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;

    INSERT INTO stripe_events (id, type, status, error_message, metadata)
    VALUES (p_event_id, p_event_type, 'failed', v_error, p_metadata)
    ON CONFLICT (id) DO UPDATE SET status = 'failed', error_message = v_error;

    RETURN jsonb_build_object('success', false, 'error', v_error);
END;
$$;

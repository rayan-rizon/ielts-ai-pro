-- Correct verified concurrency and legacy promo-accounting findings.
-- Failed provider reservations can be retried; in-flight or completed keys
-- remain duplicates and must not invoke the provider again.

CREATE OR REPLACE FUNCTION public.reserve_ai_api_usage(
  p_auth_id uuid,
  p_endpoint text,
  p_feature_type text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  reservation_id uuid,
  allowed boolean,
  daily_remaining integer,
  monthly_remaining integer,
  daily_used integer,
  monthly_used integer,
  already_reserved boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_user public.users%ROWTYPE;
  v_tier text;
  v_quota record;
  v_existing public.ai_api_usage%ROWTYPE;
  v_reservation_id uuid;
  v_daily_limit integer;
  v_monthly_limit integer;
  v_daily_used integer;
  v_monthly_used integer;
  v_session_id text;
  v_part integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;

  IF p_endpoint IS NULL OR btrim(p_endpoint) = '' THEN
    RAISE EXCEPTION 'endpoint is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_user
  FROM public.users
  WHERE auth_id = p_auth_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user profile not found' USING ERRCODE = 'P0002';
  END IF;

  v_tier := CASE
    WHEN v_user.role = 'admin' THEN 'admin'
    ELSE lower(COALESCE(v_user.subscription_tier, 'free'))
  END;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_auth_id::text || ':' || COALESCE(p_feature_type, 'general'),
      0
    )
  );

  IF p_idempotency_key IS NOT NULL AND btrim(p_idempotency_key) <> '' THEN
    SELECT * INTO v_existing
    FROM public.ai_api_usage
    WHERE user_id = v_user.id
      AND endpoint = p_endpoint
      AND request_metadata ->> 'idempotencyKey' = p_idempotency_key
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
      IF COALESCE(v_existing.request_metadata ->> 'reservationStatus', 'completed') = 'failed'
         OR (
           v_existing.request_metadata ->> 'reservationStatus' = 'reserved'
           AND v_existing.created_at < now() - interval '15 minutes'
         ) THEN
        UPDATE public.ai_api_usage
        SET cached = false,
            tokens_used = 0,
            request_metadata = COALESCE(v_existing.request_metadata, '{}'::jsonb)
              || jsonb_build_object(
                'reservationStatus', 'reserved',
                'retryStartedAt', now()
              )
        WHERE id = v_existing.id;

        RETURN QUERY SELECT v_existing.id, true, 0, 0, 0, 0, false;
        RETURN;
      END IF;

      RETURN QUERY SELECT v_existing.id, true, 0, 0, 0, 0, true;
      RETURN;
    END IF;
  END IF;

  IF p_feature_type = 'speaking_turn' THEN
    v_session_id := p_metadata ->> 'speakingSessionId';
    v_part := (p_metadata ->> 'part')::integer;

    IF v_session_id IS NULL OR v_part NOT BETWEEN 1 AND 3 THEN
      RAISE EXCEPTION 'valid speaking session and part are required' USING ERRCODE = '22023';
    END IF;

    v_daily_limit := CASE v_part WHEN 2 THEN 4 ELSE 8 END;
    v_monthly_limit := 20;

    SELECT count(*)::integer INTO v_daily_used
    FROM public.ai_api_usage
    WHERE user_id = v_user.id
      AND endpoint = 'processSpeakingSession'
      AND request_metadata ->> 'speakingSessionId' = v_session_id
      AND (request_metadata ->> 'part')::integer = v_part;

    SELECT count(*)::integer INTO v_monthly_used
    FROM public.ai_api_usage
    WHERE user_id = v_user.id
      AND endpoint = 'processSpeakingSession'
      AND request_metadata ->> 'speakingSessionId' = v_session_id;

    SELECT
      (v_daily_used < v_daily_limit AND v_monthly_used < v_monthly_limit) AS allowed,
      v_daily_limit - v_daily_used AS daily_remaining,
      v_monthly_limit - v_monthly_used AS monthly_remaining,
      v_daily_used AS daily_used,
      v_monthly_used AS monthly_used
    INTO v_quota;
  ELSIF p_feature_type = 'tts' THEN
    SELECT
      CASE v_tier WHEN 'admin' THEN 1000 WHEN 'premium' THEN 200 WHEN 'pro' THEN 100 ELSE 30 END,
      CASE v_tier WHEN 'admin' THEN 30000 WHEN 'premium' THEN 5000 WHEN 'pro' THEN 2000 ELSE 300 END
    INTO v_daily_limit, v_monthly_limit;

    SELECT count(*)::integer INTO v_daily_used
    FROM public.ai_api_usage
    WHERE user_id = v_user.id
      AND endpoint = 'synthesizeSpeech'
      AND created_at >= date_trunc('day', now());

    SELECT count(*)::integer INTO v_monthly_used
    FROM public.ai_api_usage
    WHERE user_id = v_user.id
      AND endpoint = 'synthesizeSpeech'
      AND created_at >= date_trunc('month', now());

    SELECT
      (v_daily_used < v_daily_limit AND v_monthly_used < v_monthly_limit) AS allowed,
      v_daily_limit - v_daily_used AS daily_remaining,
      v_monthly_limit - v_monthly_used AS monthly_remaining,
      v_daily_used AS daily_used,
      v_monthly_used AS monthly_used
    INTO v_quota;
  ELSE
    SELECT * INTO v_quota
    FROM public.check_user_rate_limit(v_user.id, v_tier, p_feature_type);
  END IF;

  IF NOT COALESCE(v_quota.allowed, false) THEN
    RETURN QUERY SELECT
      NULL::uuid,
      false,
      COALESCE(v_quota.daily_remaining, 0),
      COALESCE(v_quota.monthly_remaining, 0),
      COALESCE(v_quota.daily_used, 0),
      COALESCE(v_quota.monthly_used, 0),
      false;
    RETURN;
  END IF;

  INSERT INTO public.ai_api_usage (
    user_id, endpoint, cached, tokens_used, request_metadata
  ) VALUES (
    v_user.id,
    p_endpoint,
    false,
    0,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'reservationStatus', 'reserved',
      'idempotencyKey', p_idempotency_key
    )
  )
  RETURNING id INTO v_reservation_id;

  RETURN QUERY SELECT
    v_reservation_id,
    true,
    GREATEST(COALESCE(v_quota.daily_remaining, 1) - 1, 0),
    GREATEST(COALESCE(v_quota.monthly_remaining, 1) - 1, 0),
    COALESCE(v_quota.daily_used, 0) + 1,
    COALESCE(v_quota.monthly_used, 0) + 1,
    false;
END;
$$;

ALTER FUNCTION public.reserve_ai_api_usage(uuid, text, text, text, jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.reserve_ai_api_usage(uuid, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_api_usage(uuid, text, text, text, jsonb) TO service_role;

-- Promo capacity is claimed atomically by redeem_promo_code. Checkout consumes
-- the stored discount but must never increment the counter a second time.
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
SET search_path TO ''
AS $$
DECLARE
    v_error TEXT;
    v_row_count INTEGER;
    v_claimed_count INTEGER;
BEGIN
    INSERT INTO public.stripe_events (id, type, processed_at, status, metadata)
    VALUES (p_event_id, p_event_type, now(), 'processing', p_metadata)
    ON CONFLICT (id) DO UPDATE
    SET type = EXCLUDED.type,
        processed_at = now(),
        status = 'processing',
        error_message = NULL,
        metadata = EXCLUDED.metadata
    WHERE stripe_events.status = 'failed';
    GET DIAGNOSTICS v_claimed_count = ROW_COUNT;

    IF v_claimed_count = 0 THEN
        RETURN jsonb_build_object('success', true, 'claimed', false, 'message', 'Event already processed');
    END IF;

    PERFORM set_config('app.bypass_column_protection', 'on', true);

    UPDATE public.users
    SET subscription_tier = COALESCE(p_tier, subscription_tier),
        billing_interval = p_interval,
        stripe_subscription_id = COALESCE(p_subscription_id, stripe_subscription_id),
        subscription_start_date = CASE
            WHEN p_event_type IN ('checkout.session.completed', 'invoice.paid')
            THEN COALESCE(subscription_start_date, now())
            ELSE subscription_start_date
        END,
        subscription_end_date = COALESCE(p_end_date, subscription_end_date),
        subscription_amount = p_amount,
        subscription_currency = COALESCE(NULLIF(upper(p_currency), ''), 'USD'),
        cancel_at_period_end = p_cancel_at_period_end,
        promo_discount = CASE
            WHEN p_event_type = 'checkout.session.completed' THEN NULL
            ELSE promo_discount
        END,
        updated_at = now()
    WHERE auth_id = p_auth_id::uuid OR id = p_user_id::uuid;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    PERFORM set_config('app.bypass_column_protection', 'off', true);

    IF p_event_type IN ('checkout.session.completed', 'invoice.paid')
       AND p_tier IN ('pro', 'premium')
       AND NULLIF(btrim(p_transaction_id), '') IS NOT NULL THEN
        INSERT INTO public.payment_requests (
            auth_id, tier, interval, amount, currency, payment_method,
            transaction_id, sender_phone, status, admin_notes, created_at, updated_at
        ) VALUES (
            p_auth_id::uuid,
            p_tier,
            CASE WHEN p_interval = 'quarterly' THEN 'quarterly' ELSE 'monthly' END,
            COALESCE(p_amount, 0),
            COALESCE(NULLIF(upper(btrim(p_currency)), ''), 'USD'),
            'stripe',
            p_transaction_id,
            'Stripe',
            'approved',
            CASE WHEN p_event_type = 'invoice.paid' THEN 'Stripe subscription renewal' ELSE 'Stripe Checkout payment' END,
            now(),
            now()
        )
        ON CONFLICT (transaction_id) WHERE lower(payment_method) = 'stripe'
        DO UPDATE SET
            auth_id = EXCLUDED.auth_id,
            tier = EXCLUDED.tier,
            interval = EXCLUDED.interval,
            amount = EXCLUDED.amount,
            currency = EXCLUDED.currency,
            status = 'approved',
            admin_notes = EXCLUDED.admin_notes,
            updated_at = now();
    END IF;

    UPDATE public.stripe_events
    SET status = 'processed', error_message = NULL
    WHERE id = p_event_id;

    RETURN jsonb_build_object('success', true, 'claimed', true, 'rows_updated', v_row_count);
EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;

    INSERT INTO public.stripe_events (id, type, status, error_message, metadata)
    VALUES (p_event_id, p_event_type, 'failed', v_error, p_metadata)
    ON CONFLICT (id) DO UPDATE SET status = 'failed', error_message = v_error;

    RETURN jsonb_build_object('success', false, 'error', v_error);
END;
$$;

ALTER FUNCTION public.handle_stripe_event(text, text, text, text, text, text, numeric, text, text, text, timestamptz, jsonb, boolean) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.handle_stripe_event(text, text, text, text, text, text, numeric, text, text, text, timestamptz, jsonb, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_stripe_event(text, text, text, text, text, text, numeric, text, text, text, timestamptz, jsonb, boolean) TO service_role;

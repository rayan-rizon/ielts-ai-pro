-- Verified audit remediations. Keep active reservations in quota counts so a
-- caller cannot evade limits with parallel requests; exclude only finalized
-- provider failures, which performed no successful learner evaluation.

CREATE OR REPLACE FUNCTION public.get_user_daily_usage(p_user_id uuid, p_endpoint text DEFAULT NULL::text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.can_access_user_id(p_user_id) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  SELECT count(*)::integer INTO v_count
  FROM public.ai_api_usage
  WHERE user_id = p_user_id
    AND (p_endpoint IS NULL OR endpoint = p_endpoint)
    AND created_at >= current_date
    AND cached = false
    AND COALESCE(request_metadata ->> 'reservationStatus', 'completed') <> 'failed';

  RETURN COALESCE(v_count, 0);
END;
$$;

-- A discount claim reserves one promo slot. Releasing that discount must release
-- the same slot atomically; subscription-grant promos never have a removable
-- promo_discount and are intentionally unaffected.
CREATE OR REPLACE FUNCTION public.clear_promo_discount()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_auth_id uuid := auth.uid();
  v_user public.users%ROWTYPE;
  v_promo public.promo_codes%ROWTYPE;
  v_code text;
BEGIN
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Not logged in' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_user
  FROM public.users
  WHERE auth_id = v_auth_id
  FOR UPDATE;
  IF v_user.id IS NULL THEN
    RAISE EXCEPTION 'User profile not found' USING ERRCODE = 'P0002';
  END IF;
  v_code := v_user.promo_discount ->> 'code';
  IF v_code IS NULL THEN
    RAISE EXCEPTION 'No active promo code to remove';
  END IF;

  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE upper(code) = upper(v_code)
  FOR UPDATE;

  PERFORM set_config('app.bypass_column_protection', 'on', true);
  UPDATE public.users
  SET promo_discount = NULL,
      used_promo_codes = CASE
        WHEN v_promo.id IS NULL THEN used_promo_codes
        ELSE array_remove(COALESCE(used_promo_codes, '{}'::text[]), v_promo.id::text)
      END,
      updated_at = now()
  WHERE id = v_user.id;
  PERFORM set_config('app.bypass_column_protection', 'off', true);

  IF v_promo.id IS NOT NULL THEN
    UPDATE public.promo_codes
    SET current_uses = greatest(COALESCE(current_uses, 0) - 1, 0)
    WHERE id = v_promo.id;
  END IF;

  RETURN jsonb_build_object('success', true, 'removed_code', v_code);
END;
$$;

-- Manual approvals represent a paid fixed billing interval. Persist an expiry
-- date from the later of the current entitlement and now, matching checkout
-- renewal semantics rather than silently granting indefinite access.
CREATE OR REPLACE FUNCTION public.handle_payment_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_user_id uuid;
  v_period_start timestamptz;
  v_end_date timestamptz;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    SELECT id, greatest(now(), COALESCE(subscription_end_date, now()))
    INTO v_user_id, v_period_start
    FROM public.users
    WHERE auth_id = NEW.auth_id
    FOR UPDATE;
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'User profile not found' USING ERRCODE = 'P0002';
    END IF;

    v_end_date := v_period_start + CASE
      WHEN lower(COALESCE(NEW.interval, 'monthly')) = 'quarterly' THEN interval '3 months'
      ELSE interval '1 month'
    END;

    PERFORM set_config('app.bypass_column_protection', 'on', true);
    UPDATE public.users
    SET subscription_tier = NEW.tier,
        billing_interval = NEW.interval,
        subscription_start_date = v_period_start,
        subscription_end_date = v_end_date,
        subscription_amount = NEW.amount,
        subscription_currency = COALESCE(NEW.currency, 'BDT'),
        updated_at = now()
    WHERE id = v_user_id;
    PERFORM set_config('app.bypass_column_protection', 'off', true);

    INSERT INTO public.billing_history (
      user_id, auth_id, amount, currency, payment_method, transaction_id,
      status, tier, billing_interval
    ) VALUES (
      v_user_id, NEW.auth_id, NEW.amount, COALESCE(NEW.currency, 'BDT'),
      COALESCE(NEW.payment_method, 'manual'), NEW.transaction_id, 'paid',
      NEW.tier, NEW.interval
    ) ON CONFLICT (transaction_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_monthly_usage(p_user_id uuid, p_endpoint text DEFAULT NULL::text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.can_access_user_id(p_user_id) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  SELECT count(*)::integer INTO v_count
  FROM public.ai_api_usage
  WHERE user_id = p_user_id
    AND (p_endpoint IS NULL OR endpoint = p_endpoint)
    AND created_at >= date_trunc('month', current_date)
    AND cached = false
    AND COALESCE(request_metadata ->> 'reservationStatus', 'completed') <> 'failed';

  RETURN COALESCE(v_count, 0);
END;
$$;

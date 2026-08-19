-- Restore the column-protection bypass in redeem_promo_code.
--
-- `protect_sensitive_user_columns` blocks writes to public.users.promo_discount
-- and used_promo_codes unless the caller is service_role/rls_definer, or the
-- transaction-local flag `app.bypass_column_protection` is 'on'.
--
-- SECURITY DEFINER is NOT enough to satisfy that check: it changes the
-- privileges the statement runs with, but `current_setting('role')` still
-- reports the session role, which is `authenticated` for any PostgREST call
-- from a signed-in learner. The original definition therefore set the bypass
-- flag around its UPDATEs. The rewrite in 20260809042731_checkout_recovery_engine
-- dropped those two lines, so every redemption by a real user has failed since
-- with `Cannot modify protected column: promo_discount`.
--
-- Effect: the FIRST30 offer advertised in the site announcement and in paid
-- ads could not be applied by anyone. This restores the bypass while keeping
-- the newer eligibility rules (offer_expires_at, assigned_user_id, max_uses).
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
  SELECT id INTO v_profile_id FROM public.users WHERE auth_id = v_auth_id;
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
    AND (max_uses IS NULL OR current_uses < max_uses);
  IF v_promo IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired promo code');
  END IF;

  SELECT (v_promo.id::text = ANY(COALESCE(used_promo_codes, ARRAY[]::text[])))
  INTO v_already_used
  FROM public.users
  WHERE auth_id = v_auth_id;
  IF COALESCE(v_already_used, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already used this promo code');
  END IF;

  IF v_promo.grants_subscription IS NOT NULL THEN
    -- Transaction-local; reset explicitly so nothing later in this transaction
    -- inherits an open bypass.
    PERFORM set_config('app.bypass_column_protection', 'on', true);
    UPDATE public.users
    SET subscription_tier = v_promo.grants_subscription,
        promo_discount = NULL,
        used_promo_codes = array_append(COALESCE(used_promo_codes, ARRAY[]::text[]), v_promo.id::text),
        updated_at = now()
    WHERE auth_id = v_auth_id;
    PERFORM set_config('app.bypass_column_protection', 'off', true);

    UPDATE public.promo_codes SET current_uses = COALESCE(current_uses, 0) + 1 WHERE id = v_promo.id;
    RETURN jsonb_build_object('success', true, 'type', 'grant', 'subscription', v_promo.grants_subscription,
      'message', 'Subscription ' || initcap(v_promo.grants_subscription) || ' activated successfully!');
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
  WHERE auth_id = v_auth_id;
  PERFORM set_config('app.bypass_column_protection', 'off', true);

  UPDATE public.promo_codes SET current_uses = COALESCE(current_uses, 0) + 1 WHERE id = v_promo.id;
  RETURN jsonb_build_object('success', true, 'type', 'discount',
    'discount_type', v_promo.discount_type, 'discount_value', v_promo.discount_value,
    'code', v_promo.code, 'message', 'Discount applied successfully!');
END;
$$;

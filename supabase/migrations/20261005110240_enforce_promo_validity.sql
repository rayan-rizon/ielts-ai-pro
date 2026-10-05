-- Calendar dates are inclusive in UTC. Exact personal deadlines still use offer_expires_at.
CREATE OR REPLACE FUNCTION public.redeem_promo_code(code_lookup text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    AND (valid_from IS NULL OR valid_from <= (now() AT TIME ZONE 'UTC')::date)
    AND (valid_until IS NULL OR valid_until >= (now() AT TIME ZONE 'UTC')::date)
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
        'applicable_plans', v_promo.applicable_plans,
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
    'applicable_plans', v_promo.applicable_plans,
    'message', 'Discount applied successfully!'
  );
END;
$function$

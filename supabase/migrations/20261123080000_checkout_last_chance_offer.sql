-- Last-chance 20% code for checkout recovery.
--
-- A learner's personal signup code lasts 24 hours and the account rules allow one
-- promo code ever, so someone who applied their code, did not pay in time and then
-- abandoned checkout was stuck: the recovery email had no code to show and a new one
-- could not be redeemed. This gives such a learner ONE fresh 20% first-payment code,
-- only when all of these hold: still free and never paid, no payment under way, a
-- checkout started in the last 14 days, and no live code of any kind. A stale applied
-- discount (an expired code that was never paid) is cleared so the new code can be
-- redeemed; a code that is still live, or a long-lived promo the learner used, is
-- never touched. The 24 hours start when the recovery email is opened
-- (start_offer_countdown), and a payment that uses the code is credited to the email.

CREATE OR REPLACE FUNCTION public.provision_checkout_last_chance_offer(
  p_campaign_id uuid, p_user_id uuid, p_delivery_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  u public.users%ROWTYPE;
  p public.promo_codes%ROWTYPE;
  v_code text;
  v_expiry timestamptz := now() + interval '24 hours';
  v_kept text[];
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.marketing_deliveries d JOIN public.marketing_campaigns c ON c.id = d.campaign_id
    WHERE d.id = p_delivery_id AND d.user_id = p_user_id AND d.campaign_id = p_campaign_id
      AND d.channel = 'email' AND c.metadata->>'lifecycle_stage' = 'checkout'
      AND c.metadata->>'last_chance_offer_percent' = '20'
  ) THEN RAISE EXCEPTION 'Last-chance offer delivery mismatch' USING ERRCODE = '42501'; END IF;

  SELECT * INTO u FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND OR u.subscription_tier IS DISTINCT FROM 'free' OR u.role = 'admin' THEN
    RETURN jsonb_build_object('available', false, 'reason', 'not_eligible');
  END IF;
  IF EXISTS (SELECT 1 FROM public.billing_history WHERE (user_id = u.id OR auth_id = u.auth_id) AND status = 'paid') THEN
    RETURN jsonb_build_object('available', false, 'reason', 'already_paid');
  END IF;
  IF EXISTS (SELECT 1 FROM public.marketing_checkout_intents WHERE user_id = u.id AND status IN ('settled', 'pending', 'manual_review'))
     OR EXISTS (SELECT 1 FROM public.payment_requests WHERE auth_id = u.auth_id AND status IN ('pending', 'approved')) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'payment_already_started');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.marketing_checkout_intents
                 WHERE user_id = u.id AND status = 'initiated' AND initiated_at > now() - interval '14 days') THEN
    RETURN jsonb_build_object('available', false, 'reason', 'no_recent_checkout');
  END IF;

  SELECT * INTO p FROM public.promo_codes WHERE assigned_user_id = u.id AND marketing_campaign_id = p_campaign_id;
  IF FOUND THEN
    IF p.is_active AND COALESCE(p.current_uses, 0) = 0 AND p.offer_expires_at > now() THEN
      RETURN jsonb_build_object('available', true, 'code', p.code, 'discount_percent', 20, 'expires_at', p.offer_expires_at);
    END IF;
    RETURN jsonb_build_object('available', false, 'reason', 'last_chance_used');
  END IF;
  IF EXISTS (SELECT 1 FROM public.promo_codes WHERE assigned_user_id = u.id AND is_active AND offer_expires_at > now()) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'live_offer_exists');
  END IF;

  -- Drop what is left of lapsed, unpaid codes; keep any promo that is still valid.
  SELECT COALESCE(array_agg(used_id), '{}') INTO v_kept
  FROM unnest(COALESCE(u.used_promo_codes, '{}'::text[])) AS used_id
  WHERE EXISTS (SELECT 1 FROM public.promo_codes x
                WHERE x.id::text = used_id AND (x.offer_expires_at IS NULL OR x.offer_expires_at > now()));
  IF cardinality(v_kept) > 0 THEN
    RETURN jsonb_build_object('available', false, 'reason', 'other_promo_used');
  END IF;
  IF u.promo_discount IS NOT NULL OR cardinality(COALESCE(u.used_promo_codes, '{}'::text[])) > 0 THEN
    PERFORM set_config('app.bypass_column_protection', 'on', true);
    UPDATE public.users SET promo_discount = NULL, used_promo_codes = '{}'::text[], updated_at = now() WHERE id = u.id;
    PERFORM set_config('app.bypass_column_protection', 'off', true);
  END IF;

  LOOP
    v_code := 'BACK20-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    BEGIN
      INSERT INTO public.promo_codes (code, discount_type, discount_value, is_active, valid_from, valid_until,
        max_uses, current_uses, applicable_plans, label, assigned_user_id, offer_expires_at,
        marketing_campaign_id, marketing_delivery_id)
      VALUES (v_code, 'percentage', 20, true, (now() AT TIME ZONE 'UTC')::date, (v_expiry AT TIME ZONE 'UTC')::date,
        1, 0, ARRAY['pro', 'premium'], 'Checkout last chance · 20% · first payment', u.id, v_expiry,
        p_campaign_id, p_delivery_id);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF EXISTS (SELECT 1 FROM public.promo_codes WHERE assigned_user_id = u.id AND marketing_campaign_id = p_campaign_id) THEN RAISE; END IF;
    END;
  END LOOP;
  RETURN jsonb_build_object('available', true, 'code', v_code, 'discount_percent', 20, 'expires_at', v_expiry);
END $$;
REVOKE ALL ON FUNCTION public.provision_checkout_last_chance_offer(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_checkout_last_chance_offer(uuid, uuid, uuid) TO service_role;

UPDATE public.marketing_campaigns
SET metadata = metadata || '{"last_chance_offer_percent": 20}'::jsonb, updated_at = now()
WHERE metadata->>'system_key' = 'journey:checkout_abandoned:plan_saved';

-- An expired personal code no longer blocks redeeming a new one (the only change to
-- redeem_promo_code is the offer_expires_at condition on the personal-code check).
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
    AND NOT is_signup_offer_template
    AND (valid_from IS NULL OR valid_from <= (now() AT TIME ZONE 'UTC')::date)
    AND (valid_until IS NULL OR valid_until >= (now() AT TIME ZONE 'UTC')::date)
    AND (offer_expires_at IS NULL OR offer_expires_at > now())
    AND (assigned_user_id IS NULL OR assigned_user_id = v_profile_id)
  FOR UPDATE;

  IF v_promo IS NULL
     OR (v_promo.max_uses IS NOT NULL AND COALESCE(v_promo.current_uses, 0) >= v_promo.max_uses) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid, expired, or fully claimed promo code');
  END IF;

  IF EXISTS (SELECT 1 FROM public.promo_codes WHERE assigned_user_id=v_profile_id AND signup_offer_template_id IS NOT NULL AND id<>v_promo.id AND (offer_expires_at IS NULL OR offer_expires_at > now())) THEN
    RETURN jsonb_build_object('success',false,'error','Your account has one personal promo code. Please use that code.');
  END IF;
  IF EXISTS (SELECT 1 FROM public.users u, unnest(COALESCE(u.used_promo_codes,'{}'::text[])) used_id WHERE u.id=v_profile_id AND used_id<>v_promo.id::text) THEN
    RETURN jsonb_build_object('success',false,'error','Only one promo code can be used per account.');
  END IF;
  IF EXISTS (SELECT 1 FROM public.users WHERE id=v_profile_id AND promo_discount IS NOT NULL AND promo_discount->>'code' IS DISTINCT FROM v_promo.code) THEN
    RETURN jsonb_build_object('success',false,'error','Remove your current promo before applying another code');
  END IF;
  IF v_promo.signup_offer_template_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.billing_history b JOIN public.users u ON u.id=v_profile_id
    WHERE (b.user_id=u.id OR b.auth_id=u.auth_id) AND b.status='paid'
  ) THEN
    RETURN jsonb_build_object('success',false,'error','This signup offer is only for your first subscription payment');
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
$function$;

BEGIN;
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

  IF EXISTS (SELECT 1 FROM public.promo_codes WHERE assigned_user_id=v_profile_id AND signup_offer_template_id IS NOT NULL AND id<>v_promo.id) THEN
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

CREATE OR REPLACE FUNCTION public.issue_signup_subscription_offer(p_user_id uuid, p_campaign_id uuid DEFAULT NULL, p_delivery_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u public.users%ROWTYPE; p public.promo_codes%ROWTYPE; t public.promo_codes%ROWTYPE;
  expiry timestamptz := now() + interval '7 days'; code_text text;
BEGIN
  SELECT * INTO u FROM public.users WHERE id=p_user_id FOR UPDATE;
  IF NOT FOUND OR u.subscription_tier IS DISTINCT FROM 'free' OR u.role='admin' THEN
    RETURN jsonb_build_object('available',false,'reason','not_eligible');
  END IF;
  IF EXISTS (SELECT 1 FROM public.billing_history WHERE (user_id=u.id OR auth_id=u.auth_id) AND status='paid') THEN
    RETURN jsonb_build_object('available',false,'reason','already_paid');
  END IF;
  SELECT * INTO t FROM public.promo_codes WHERE code='START20' AND is_signup_offer_template FOR UPDATE;
  IF NOT FOUND OR NOT t.is_active OR t.discount_type IS DISTINCT FROM 'percentage' OR t.discount_value <> 20 THEN
    RETURN jsonb_build_object('available',false,'reason','offer_paused');
  END IF;
  SELECT * INTO p FROM public.promo_codes WHERE signup_offer_template_id=t.id AND assigned_user_id=u.id FOR UPDATE;
  IF FOUND THEN
    IF u.promo_discount IS NULL AND COALESCE(cardinality(u.used_promo_codes),0)>0 THEN RETURN jsonb_build_object('available',false,'reason','starter_offer_used'); END IF;
    IF NOT p.is_active OR p.offer_expires_at IS NULL OR p.offer_expires_at <= now() THEN
      RETURN jsonb_build_object('available',false,'reason','starter_offer_ended');
    END IF;
    IF u.promo_discount IS NOT NULL AND u.promo_discount->>'code' IS DISTINCT FROM p.code THEN
      RETURN jsonb_build_object('available',false,'reason','another_offer_applied');
    END IF;
    RETURN jsonb_build_object('available',true,'code',p.code,'discount_percent',20,'expires_at',p.offer_expires_at);
  END IF;
  IF u.created_at < now()-interval '14 days' OR u.promo_discount IS NOT NULL OR COALESCE(cardinality(u.used_promo_codes),0)>0 THEN
    RETURN jsonb_build_object('available',false,'reason','not_eligible');
  END IF;
  IF EXISTS (SELECT 1 FROM public.marketing_checkout_intents WHERE user_id=u.id AND status IN ('settled','pending','manual_review'))
    OR EXISTS (SELECT 1 FROM public.payment_requests WHERE auth_id=u.auth_id AND status IN ('pending','approved')) THEN
    RETURN jsonb_build_object('available',false,'reason','payment_already_started');
  END IF;
  LOOP
    code_text := 'START20-' || upper(replace(gen_random_uuid()::text,'-',''));
    BEGIN
      INSERT INTO public.promo_codes(code,discount_type,discount_value,is_active,valid_from,valid_until,
        max_uses,current_uses,applicable_plans,label,assigned_user_id,offer_expires_at,signup_offer_template_id,
        marketing_campaign_id,marketing_delivery_id)
      VALUES(code_text,'percentage',20,true,(now() AT TIME ZONE 'UTC')::date,(expiry AT TIME ZONE 'UTC')::date,
        1,0,ARRAY['pro','premium'],'Personal signup · 20% · first payment',u.id,expiry,t.id,p_campaign_id,p_delivery_id);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- UUID code collision only; the locked profile rules out duplicate issuance.
      IF EXISTS (SELECT 1 FROM public.promo_codes WHERE signup_offer_template_id=t.id AND assigned_user_id=u.id) THEN RAISE; END IF;
    END;
  END LOOP;
  UPDATE public.promo_codes SET current_uses=COALESCE(current_uses,0)+1,updated_at=now() WHERE id=t.id;
  RETURN jsonb_build_object('available',true,'code',code_text,'discount_percent',20,'expires_at',expiry);
END $$;
REVOKE ALL ON FUNCTION public.issue_signup_subscription_offer(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.issue_signup_subscription_offer(uuid,uuid,uuid) TO service_role;


CREATE OR REPLACE FUNCTION public.clear_promo_discount() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid; code_text text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not logged in' USING ERRCODE='42501'; END IF;
  SELECT id,promo_discount->>'code' INTO uid,code_text FROM public.users WHERE auth_id=auth.uid() FOR UPDATE;
  IF uid IS NULL THEN RAISE EXCEPTION 'User profile not found' USING ERRCODE='P0002'; END IF;
  IF code_text IS NULL THEN RAISE EXCEPTION 'No active promo code to remove'; END IF;
  -- Removing a discount must never erase the account's redemption history.
  PERFORM set_config('app.bypass_column_protection','on',true);
  UPDATE public.users SET promo_discount=NULL,updated_at=now() WHERE id=uid;
  PERFORM set_config('app.bypass_column_protection','off',true);
  RETURN jsonb_build_object('success',true,'removed_code',code_text);
END $$;

COMMIT;

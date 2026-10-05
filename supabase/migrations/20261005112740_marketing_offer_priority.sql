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
  v_current public.promo_codes%ROWTYPE;
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

  SELECT p.* INTO v_current FROM public.promo_codes p JOIN public.users u ON upper(p.code)=upper(u.promo_discount->>'code')
  WHERE u.id=v_profile_id AND p.id<>v_promo.id FOR UPDATE OF p;
  IF FOUND THEN
    IF v_current.signup_offer_template_id IS NULL OR v_promo.signup_offer_template_id IS NOT NULL
      OR v_promo.grants_subscription IS NOT NULL OR v_promo.discount_type <> 'percentage'
      OR v_promo.discount_value < v_current.discount_value THEN
      RETURN jsonb_build_object('success',false,'error','Your current offer is protected. Remove it before choosing a different discount.');
    END IF;
    -- A valid explicit marketing offer can replace an unused starter reservation.
    -- Reject reused incoming codes BEFORE releasing the existing reservation.
    IF EXISTS (SELECT 1 FROM public.users WHERE id=v_profile_id AND v_promo.id::text=ANY(COALESCE(used_promo_codes,'{}'::text[]))) THEN
      RETURN jsonb_build_object('success',false,'error','You have already used this promo code');
    END IF;
    PERFORM set_config('app.bypass_column_protection','on',true);
    UPDATE public.users SET promo_discount=NULL, used_promo_codes=array_remove(COALESCE(used_promo_codes,'{}'::text[]),v_current.id::text) WHERE id=v_profile_id;
    PERFORM set_config('app.bypass_column_protection','off',true);
    UPDATE public.promo_codes SET current_uses=greatest(COALESCE(current_uses,0)-1,0) WHERE id=v_current.id;
  ELSIF EXISTS (SELECT 1 FROM public.users WHERE id=v_profile_id AND promo_discount IS NOT NULL AND promo_discount->>'code' IS DISTINCT FROM v_promo.code) THEN
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

CREATE OR REPLACE FUNCTION public.provision_signup_subscription_offer(p_campaign_id uuid,p_user_id uuid,p_delivery_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.marketing_deliveries d JOIN public.marketing_campaigns c ON c.id=d.campaign_id
    WHERE d.id=p_delivery_id AND d.user_id=p_user_id AND d.campaign_id=p_campaign_id AND d.channel IN ('email','in_app','banner')
      AND ((c.metadata->>'lifecycle_stage' IN ('signup','first_result','quota') AND c.metadata->>'signup_offer_percent'='20') OR EXISTS(SELECT 1 FROM public.promo_codes p WHERE p.id=c.promo_code_id AND p.is_signup_offer_template))
  ) THEN RAISE EXCEPTION 'Signup offer delivery mismatch' USING ERRCODE='42501'; END IF;
  RETURN public.issue_signup_subscription_offer(p_user_id,p_campaign_id,p_delivery_id);
END $$;
REVOKE ALL ON FUNCTION public.provision_signup_subscription_offer(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.provision_signup_subscription_offer(uuid,uuid,uuid) TO service_role;

COMMIT;

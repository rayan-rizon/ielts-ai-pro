-- Serialize offer issuance and never advertise a second account discount.
BEGIN;
CREATE OR REPLACE FUNCTION public.provision_checkout_recovery_offer(
  p_campaign_id uuid,
  p_user_id uuid,
  p_delivery_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing public.promo_codes%ROWTYPE;
  v_user public.users%ROWTYPE;
  v_code text;
  v_expires_at timestamptz := now() + interval '7 days';
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_user
  FROM public.users
  WHERE id = p_user_id AND role <> 'admin' AND subscription_tier = 'free' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('available', false, 'reason', 'not_free');
  END IF;
  IF v_user.promo_discount IS NOT NULL THEN
    RETURN jsonb_build_object('available', false, 'reason', 'active_promo');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.marketing_deliveries
    WHERE id = p_delivery_id AND campaign_id = p_campaign_id AND user_id = p_user_id AND channel = 'email'
  ) THEN
    RAISE EXCEPTION 'Recovery delivery does not match campaign recipient' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(cardinality(v_user.used_promo_codes),0)>0 THEN
    RETURN jsonb_build_object('available',false,'reason','account_promo_already_used');
  END IF;
  IF EXISTS (SELECT 1 FROM public.promo_codes WHERE assigned_user_id=p_user_id AND signup_offer_template_id IS NOT NULL) THEN
    RETURN jsonb_build_object('available',false,'reason','personal_signup_offer_exists');
  END IF;

  SELECT * INTO v_existing
  FROM public.promo_codes
  WHERE marketing_campaign_id = p_campaign_id AND assigned_user_id = p_user_id
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'available', v_existing.is_active AND (v_existing.offer_expires_at IS NULL OR v_existing.offer_expires_at > now()),
      'code', v_existing.code,
      'expires_at', v_existing.offer_expires_at
    );
  END IF;

  IF EXISTS (SELECT 1 FROM public.promo_codes WHERE assigned_user_id=p_user_id) THEN
    RETURN jsonb_build_object('available',false,'reason','another_offer_assigned');
  END IF;

  v_code := 'BACK15-' || upper(substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 10));
  INSERT INTO public.promo_codes (
    code, discount_type, discount_value, is_active, valid_from, valid_until,
    max_uses, current_uses, marketing_campaign_id, marketing_delivery_id, label,
    assigned_user_id, offer_expires_at
  ) VALUES (
    v_code, 'percentage', 15, true, now(), v_expires_at,
    1, 0, p_campaign_id, p_delivery_id, 'Checkout recovery · 15% · single use',
    p_user_id, v_expires_at
  );

  RETURN jsonb_build_object('available', true, 'code', v_code, 'expires_at', v_expires_at);
END;
$$;

REVOKE ALL ON FUNCTION public.provision_checkout_recovery_offer(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_checkout_recovery_offer(uuid, uuid, uuid) TO service_role;

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
  IF EXISTS (SELECT 1 FROM public.promo_codes WHERE assigned_user_id=u.id) THEN
    RETURN jsonb_build_object('available',false,'reason','another_offer_assigned');
  END IF;
  IF EXISTS (SELECT 1 FROM public.marketing_checkout_intents WHERE user_id=u.id AND status IN ('settled','pending','manual_review'))
    OR EXISTS (SELECT 1 FROM public.payment_requests WHERE auth_id=u.auth_id AND status IN ('pending','approved')) THEN
    RETURN jsonb_build_object('available',false,'reason','payment_already_started');
  END IF;
  LOOP
    code_text := 'START20' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
    BEGIN
      INSERT INTO public.promo_codes(code,discount_type,discount_value,is_active,valid_from,valid_until,
        max_uses,current_uses,applicable_plans,label,assigned_user_id,offer_expires_at,signup_offer_template_id,
        marketing_campaign_id,marketing_delivery_id)
      VALUES(code_text,'percentage',20,true,(now() AT TIME ZONE 'UTC')::date,(expiry AT TIME ZONE 'UTC')::date,
        1,0,ARRAY['pro','premium'],'Personal signup · 20% · first payment',u.id,expiry,t.id,p_campaign_id,p_delivery_id);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- A short random code collision retries against the unique code constraint; the locked profile rules out duplicate issuance.
      IF EXISTS (SELECT 1 FROM public.promo_codes WHERE signup_offer_template_id=t.id AND assigned_user_id=u.id) THEN RAISE; END IF;
    END;
  END LOOP;
  UPDATE public.promo_codes SET current_uses=COALESCE(current_uses,0)+1,updated_at=now() WHERE id=t.id;
  RETURN jsonb_build_object('available',true,'code',code_text,'discount_percent',20,'expires_at',expiry);
END $$;
REVOKE ALL ON FUNCTION public.issue_signup_subscription_offer(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.issue_signup_subscription_offer(uuid,uuid,uuid) TO service_role;

COMMIT;

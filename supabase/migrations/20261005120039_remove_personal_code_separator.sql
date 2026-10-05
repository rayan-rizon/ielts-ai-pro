-- Keep issued codes stable; generate new personal codes as one continuous string.
BEGIN;
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

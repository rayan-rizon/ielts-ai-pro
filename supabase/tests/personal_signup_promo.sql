-- Integration regression: requires three eligible Free profiles; all writes roll back.
BEGIN;
DO $$
DECLARE u public.users%ROWTYPE; other_user public.users%ROWTYPE; cid uuid; did uuid; first_offer jsonb; again jsonb; r jsonb; personal_id uuid; old_count integer; second_code text; recovery_user public.users%ROWTYPE; recovery_offer jsonb; recovery_delivery uuid;
BEGIN
  IF has_function_privilege('authenticated','public.issue_signup_subscription_offer(uuid,uuid,uuid)','EXECUTE')
    OR has_function_privilege('authenticated','public.provision_signup_subscription_offer(uuid,uuid,uuid)','EXECUTE')
    OR has_function_privilege('anon','public.get_signup_subscription_offer()','EXECUTE') THEN RAISE EXCEPTION 'Unsafe permissions'; END IF;
  SELECT * INTO u FROM public.users x WHERE x.subscription_tier='free' AND x.role IS DISTINCT FROM 'admin' AND x.created_at>now()-interval '14 days' AND x.auth_id IS NOT NULL AND x.promo_discount IS NULL AND COALESCE(cardinality(x.used_promo_codes),0)=0
    AND NOT EXISTS(SELECT 1 FROM public.billing_history b WHERE (b.user_id=x.id OR b.auth_id=x.auth_id) AND b.status='paid')
    AND NOT EXISTS(SELECT 1 FROM public.marketing_checkout_intents i WHERE i.user_id=x.id AND i.status IN ('settled','pending','manual_review'))
    AND NOT EXISTS(SELECT 1 FROM public.payment_requests p WHERE p.auth_id=x.auth_id AND p.status IN ('pending','approved')) LIMIT 1;
  IF u.id IS NULL THEN RAISE EXCEPTION 'Fixture missing'; END IF;
  SELECT current_uses INTO old_count FROM public.promo_codes WHERE code='FIRST30';
  PERFORM set_config('request.jwt.claim.sub',u.auth_id::text,true);
  r:=public.redeem_promo_code('START20');
  IF r->>'success' IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'Shared template redeemable'; END IF;
  first_offer:=public.get_signup_subscription_offer();
  IF first_offer->>'available' IS DISTINCT FROM 'true' OR (first_offer->>'expires_at')::timestamptz<>now()+interval '7 days' THEN RAISE EXCEPTION 'Bad expiry'; END IF;
  IF first_offer->>'code' !~ '^START20[0-9A-F]{8}$' THEN RAISE EXCEPTION 'Personal code must be one continuous string'; END IF;
  SELECT id INTO personal_id FROM public.promo_codes WHERE code=first_offer->>'code' AND assigned_user_id=u.id AND max_uses=1;
  IF personal_id IS NULL THEN RAISE EXCEPTION 'Binding missing'; END IF;
  again:=public.get_signup_subscription_offer();
  IF again<>first_offer THEN RAISE EXCEPTION 'Code or deadline changed'; END IF;
  SELECT id INTO cid FROM public.marketing_campaigns WHERE metadata->>'lifecycle_stage'='signup' LIMIT 1;
  INSERT INTO public.marketing_deliveries(campaign_id,user_id,channel,status,attempt) VALUES(cid,u.id,'email','processing',900001) RETURNING id INTO did;
  again:=public.provision_signup_subscription_offer(cid,u.id,did);
  IF again<>first_offer THEN RAISE EXCEPTION 'Email offer differs'; END IF;
  PERFORM set_config('request.jwt.claim.role','service_role',true);
  r:=public.provision_checkout_recovery_offer(cid,u.id,did);
  IF r->>'available' IS DISTINCT FROM 'false' OR r->>'reason' IS DISTINCT FROM 'personal_signup_offer_exists' THEN RAISE EXCEPTION 'Recovery advertised a second personal code'; END IF;
  UPDATE public.marketing_deliveries SET channel='in_app' WHERE id=did;
  UPDATE public.marketing_campaigns SET metadata='{}'::jsonb WHERE id=cid;
  again:=public.provision_signup_subscription_offer(cid,u.id,did);
  IF again<>first_offer THEN RAISE EXCEPTION 'Manual in-app offer differs'; END IF;
  BEGIN PERFORM public.provision_signup_subscription_offer(cid,gen_random_uuid(),did); RAISE EXCEPTION 'Mismatch accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  r:=public.redeem_promo_code('FIRST30');
  IF r->>'success' IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'Second code accepted before personal redemption'; END IF;
  SELECT * INTO other_user FROM public.users x WHERE x.id<>u.id AND x.subscription_tier='free' AND x.auth_id IS NOT NULL AND x.role IS DISTINCT FROM 'admin' AND x.promo_discount IS NULL AND COALESCE(cardinality(x.used_promo_codes),0)=0 AND NOT EXISTS(SELECT 1 FROM public.promo_codes p WHERE p.assigned_user_id=x.id AND p.signup_offer_template_id IS NOT NULL) LIMIT 1;
  PERFORM set_config('request.jwt.claim.sub',other_user.auth_id::text,true);
  r:=public.redeem_promo_code(first_offer->>'code');
  IF r->>'success' IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'Wrong account accepted'; END IF;
  PERFORM set_config('request.jwt.claim.sub',u.auth_id::text,true);
  r:=public.redeem_promo_code(first_offer->>'code');
  IF r->>'success' IS DISTINCT FROM 'true' OR (r->>'discount_value')::numeric<>20 THEN RAISE EXCEPTION 'Owner redemption failed'; END IF;
  IF public.get_applied_subscription_promo()->>'code' IS DISTINCT FROM first_offer->>'code' THEN RAISE EXCEPTION 'Payment quote missing'; END IF;
  r:=public.redeem_promo_code(first_offer->>'code');
  IF r->>'success' IS DISTINCT FROM 'false' OR (SELECT current_uses FROM public.promo_codes WHERE id=personal_id)<>1 THEN RAISE EXCEPTION 'Repeated use'; END IF;
  again:=public.get_signup_subscription_offer();
  IF again<>first_offer THEN RAISE EXCEPTION 'Resend differs'; END IF;
  r:=public.redeem_promo_code('FIRST30');
  IF r->>'success' IS DISTINCT FROM 'false' OR (SELECT promo_discount->>'code' FROM public.users WHERE id=u.id) IS DISTINCT FROM first_offer->>'code' THEN RAISE EXCEPTION 'Discount switching allowed'; END IF;
  UPDATE public.promo_codes SET offer_expires_at=now()-interval '1 second' WHERE id=personal_id;
  IF public.get_applied_subscription_promo() IS NOT NULL THEN RAISE EXCEPTION 'Expired discount still quoted for payment'; END IF;
  r:=public.redeem_promo_code(first_offer->>'code');
  again:=public.get_signup_subscription_offer();
  IF r->>'success' IS DISTINCT FROM 'false' OR again->>'available' IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'Expired offer reused or regenerated'; END IF;
  UPDATE public.promo_codes SET offer_expires_at=(first_offer->>'expires_at')::timestamptz WHERE id=personal_id;
  UPDATE public.promo_codes SET is_active=false WHERE code='START20';
  again:=public.get_signup_subscription_offer();
  IF again->>'available' IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'Paused rule issues'; END IF;
  UPDATE public.promo_codes SET is_active=true WHERE code='START20';
  PERFORM public.clear_promo_discount();
  IF NOT EXISTS(SELECT 1 FROM public.users WHERE id=u.id AND personal_id::text=ANY(used_promo_codes)) THEN RAISE EXCEPTION 'Remove cleared history'; END IF;
  again:=public.get_signup_subscription_offer();
  r:=public.redeem_promo_code('FIRST30');
  IF again->>'available' IS DISTINCT FROM 'false' OR r->>'success' IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'Remove allowed another code'; END IF;
  IF (SELECT count(*) FROM public.promo_codes WHERE assigned_user_id=u.id AND signup_offer_template_id IS NOT NULL)<>1 THEN RAISE EXCEPTION 'Duplicate personal codes'; END IF;
  PERFORM set_config('request.jwt.claim.sub',other_user.auth_id::text,true);
  r:=public.redeem_promo_code('FIRST30');
  IF r->>'success' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'First marketing code not allowed'; END IF;
  PERFORM public.clear_promo_discount();
  second_code:='SECOND-'||upper(replace(gen_random_uuid()::text,'-',''));
  INSERT INTO public.promo_codes(code,discount_type,discount_value,is_active,max_uses,current_uses) VALUES(second_code,'percentage',10,true,100,0);
  r:=public.redeem_promo_code(second_code);
  IF r->>'success' IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'Second generic code accepted after removal'; END IF;
  again:=public.get_signup_subscription_offer();
  IF again->>'available' IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'Marketing redemption allowed another starter'; END IF;
  SELECT * INTO recovery_user FROM public.users x WHERE x.id NOT IN (u.id,other_user.id) AND x.subscription_tier='free' AND x.role IS DISTINCT FROM 'admin' AND x.created_at>now()-interval '14 days' AND x.auth_id IS NOT NULL AND x.promo_discount IS NULL AND COALESCE(cardinality(x.used_promo_codes),0)=0
    AND NOT EXISTS(SELECT 1 FROM public.billing_history b WHERE (b.user_id=x.id OR b.auth_id=x.auth_id) AND b.status='paid')
    AND NOT EXISTS(SELECT 1 FROM public.promo_codes p WHERE p.assigned_user_id=x.id)
    AND NOT EXISTS(SELECT 1 FROM public.marketing_checkout_intents i WHERE i.user_id=x.id AND i.status IN ('settled','pending','manual_review'))
    AND NOT EXISTS(SELECT 1 FROM public.payment_requests p WHERE p.auth_id=x.auth_id AND p.status IN ('pending','approved')) LIMIT 1;
  IF recovery_user.id IS NULL THEN RAISE EXCEPTION 'Recovery fixture missing'; END IF;
  INSERT INTO public.marketing_deliveries(campaign_id,user_id,channel,status,attempt) VALUES(cid,recovery_user.id,'email','processing',900002) RETURNING id INTO recovery_delivery;
  recovery_offer:=public.provision_checkout_recovery_offer(cid,recovery_user.id,recovery_delivery);
  IF recovery_offer->>'available' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Eligible recovery offer unavailable'; END IF;
  again:=public.provision_checkout_recovery_offer(cid,recovery_user.id,recovery_delivery);
  IF again<>recovery_offer THEN RAISE EXCEPTION 'Recovery code or expiry changed'; END IF;
  again:=public.issue_signup_subscription_offer(recovery_user.id);
  IF again->>'available' IS DISTINCT FROM 'false' OR again->>'reason' IS DISTINCT FROM 'another_offer_assigned' THEN RAISE EXCEPTION 'Signup overwrote assigned recovery offer'; END IF;
  PERFORM set_config('request.jwt.claim.sub',recovery_user.auth_id::text,true);
  r:=public.redeem_promo_code(recovery_offer->>'code');
  IF r->>'success' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Recovery owner cannot redeem'; END IF;
  PERFORM public.clear_promo_discount();
  again:=public.provision_checkout_recovery_offer(cid,recovery_user.id,recovery_delivery);
  IF again->>'available' IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'Recovery offer advertised after use'; END IF;
  IF (SELECT current_uses FROM public.promo_codes WHERE code='FIRST30')<>old_count+1 THEN RAISE EXCEPTION 'Marketing counter incorrect'; END IF;
END $$;
ROLLBACK;
SELECT 'Passed: exact seven-day deadline; same personal code across paywall, email and manual in-app messages; owner-only redemption; one code per account; repeated use, switching, removal bypass, generic code hopping, expiry/reset, payment quote expiry and mismatched delivery blocked; recovery/signup conflicts, removed recovery reuse and RPC permissions. All test writes rolled back.' AS verification;
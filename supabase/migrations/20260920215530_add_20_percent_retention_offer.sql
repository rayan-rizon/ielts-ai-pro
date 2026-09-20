-- Issue the promised offer only after an admin approves a high-intent learner
-- message. The code is assigned to one free learner, can be used once, and
-- expires 48 hours after approval. Pricing-page interest is eligible only when
-- the intervention carries server-recorded plan-selection or repeat-view
-- evidence; ordinary quota reminders do not receive a discount.
CREATE OR REPLACE FUNCTION public.provision_autopilot_subscription_offer(
  p_intervention_id uuid,
  p_delivery_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_intervention public.marketing_interventions%ROWTYPE;
  v_delivery public.marketing_deliveries%ROWTYPE;
  v_existing public.promo_codes%ROWTYPE;
  v_checkout_intent_id uuid;
  v_checkout_status text;
  v_has_pricing_intent boolean := false;
  v_code text;
  v_expires_at timestamptz := now() + interval '48 hours';
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_intervention
  FROM public.marketing_interventions
  WHERE id = p_intervention_id
    AND playbook_key IN ('checkout_recovery', 'quota_upgrade');

  SELECT * INTO v_delivery
  FROM public.marketing_deliveries
  WHERE id = p_delivery_id
    AND intervention_id = p_intervention_id;

  IF v_intervention.id IS NULL OR v_delivery.id IS NULL THEN
    RAISE EXCEPTION 'Intervention delivery mismatch' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(v_intervention.evidence, '[]'::jsonb)) item
    WHERE item->>'metric' = 'offer_discount_percent'
      AND item->>'value' = '20'
  ) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'offer_evidence_missing');
  END IF;

  IF v_intervention.playbook_key = 'checkout_recovery' THEN
    SELECT (item->>'value')::uuid INTO v_checkout_intent_id
    FROM jsonb_array_elements(COALESCE(v_intervention.evidence, '[]'::jsonb)) item
    WHERE item->>'metric' = 'checkout_intent_id'
    LIMIT 1;

    SELECT status INTO v_checkout_status
    FROM public.marketing_checkout_intents
    WHERE id = v_checkout_intent_id
      AND user_id = v_intervention.user_id;

    IF v_checkout_status IS DISTINCT FROM 'initiated' THEN
      RETURN jsonb_build_object('available', false, 'reason', 'checkout_not_offer_eligible');
    END IF;
  ELSE
    SELECT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(v_intervention.evidence, '[]'::jsonb)) item
      WHERE item->>'metric' IN ('plan_selected', 'pricing_visits')
    ) INTO v_has_pricing_intent;

    IF NOT v_has_pricing_intent THEN
      RETURN jsonb_build_object('available', false, 'reason', 'pricing_intent_missing');
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.marketing_checkout_intents
      WHERE user_id = v_intervention.user_id
        AND status IN ('settled', 'pending', 'manual_review')
    ) THEN
      RETURN jsonb_build_object('available', false, 'reason', 'checkout_state_changed');
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = v_intervention.user_id
      AND subscription_tier = 'free'
      AND role <> 'admin'
      AND promo_discount IS NULL
  ) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'not_eligible');
  END IF;

  SELECT * INTO v_existing
  FROM public.promo_codes
  WHERE marketing_campaign_id = v_intervention.campaign_id
    AND assigned_user_id = v_intervention.user_id
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    IF COALESCE(v_existing.current_uses, 0) > 0 THEN
      RETURN jsonb_build_object('available', false, 'reason', 'offer_already_used');
    END IF;

    UPDATE public.promo_codes
    SET discount_type = 'percentage',
        discount_value = 20,
        is_active = true,
        valid_from = now(),
        valid_until = v_expires_at,
        max_uses = 1,
        marketing_delivery_id = v_delivery.id,
        label = 'High-intent subscription offer · 20% · 48 hours · single use',
        offer_expires_at = v_expires_at
    WHERE id = v_existing.id
    RETURNING * INTO v_existing;

    RETURN jsonb_build_object(
      'available', true,
      'code', v_existing.code,
      'discount_percent', 20,
      'expires_at', v_existing.offer_expires_at
    );
  END IF;

  v_code := 'IELTS20-' || upper(substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 10));
  INSERT INTO public.promo_codes(
    code, discount_type, discount_value, is_active, valid_from, valid_until,
    max_uses, current_uses, marketing_campaign_id, marketing_delivery_id,
    label, assigned_user_id, offer_expires_at
  ) VALUES (
    v_code, 'percentage', 20, true, now(), v_expires_at,
    1, 0, v_intervention.campaign_id, v_delivery.id,
    'High-intent subscription offer · 20% · 48 hours · single use',
    v_intervention.user_id, v_expires_at
  );

  RETURN jsonb_build_object(
    'available', true,
    'code', v_code,
    'discount_percent', 20,
    'expires_at', v_expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.provision_autopilot_subscription_offer(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_autopilot_subscription_offer(uuid, uuid)
  TO service_role;

UPDATE public.marketing_autopilot_policies
SET name = 'High-Intent 20% Offer',
    config = COALESCE(config, '{}'::jsonb) || jsonb_build_object(
      'discount_percent', 20,
      'offer_duration_hours', 48,
      'max_uses', 1,
      'first_payment_only', true
    ),
    updated_at = now()
WHERE playbook_key = 'checkout_recovery';

UPDATE public.marketing_campaigns c
SET name = 'Checkout recovery · 20% offer',
    subject = 'Your 20% IELTS plan offer is ready',
    title = 'Save 20% on your selected plan',
    message = 'Complete your upgrade within 48 hours to save 20% on your first subscription payment.',
    cta_label = 'Apply my 20% offer',
    cta_url = '/pricing',
    updated_at = now()
FROM public.marketing_autopilot_policies p
WHERE p.playbook_key = 'checkout_recovery'
  AND p.campaign_id = c.id;

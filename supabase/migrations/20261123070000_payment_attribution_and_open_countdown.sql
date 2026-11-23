-- 1. Payment attribution by offer code.
--
-- A purchase was only credited to a marketing email when the learner arrived
-- through that email's tracked link. Many learners copy the code from the email and
-- come back later, so every paid conversion showed no campaign. A code that an email
-- issued (promo_codes.marketing_delivery_id) is itself proof of where the offer came
-- from, so a payment that used it is credited to that delivery. An explicit
-- attribution from the checkout link is never overwritten, and codes issued on the
-- site (no delivery) stay unattributed.
CREATE OR REPLACE FUNCTION public.attribute_payment_to_marketing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_code text;
  v_campaign uuid;
  v_delivery uuid;
BEGIN
  IF NEW.marketing_delivery_id IS NOT NULL THEN RETURN NEW; END IF;

  IF TG_TABLE_NAME = 'billing_history' THEN
    v_code := NEW.promo_code;
  ELSE
    SELECT u.promo_discount->>'code' INTO v_code FROM public.users u WHERE u.auth_id = NEW.auth_id;
  END IF;
  IF v_code IS NULL THEN RETURN NEW; END IF;

  SELECT p.marketing_campaign_id, p.marketing_delivery_id INTO v_campaign, v_delivery
  FROM public.promo_codes p
  WHERE upper(p.code) = upper(v_code) AND p.marketing_delivery_id IS NOT NULL
  LIMIT 1;
  IF v_delivery IS NOT NULL THEN
    NEW.marketing_campaign_id := COALESCE(NEW.marketing_campaign_id, v_campaign);
    NEW.marketing_delivery_id := v_delivery;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.attribute_payment_to_marketing() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS attribute_payment_to_marketing ON public.billing_history;
CREATE TRIGGER attribute_payment_to_marketing BEFORE INSERT ON public.billing_history
  FOR EACH ROW EXECUTE FUNCTION public.attribute_payment_to_marketing();
DROP TRIGGER IF EXISTS attribute_payment_to_marketing ON public.payment_requests;
CREATE TRIGGER attribute_payment_to_marketing BEFORE INSERT ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.attribute_payment_to_marketing();

-- 2. The offer clock starts when the email is opened.
--
-- The recovery email shows a countdown image. When the mail client first loads it,
-- the learner's live personal code is given 24 hours from that moment (never less
-- than it already had), once per delivery. A code that has ended, been used, or is
-- not the learner's is never revived. Returns the code's deadline, or NULL when the
-- delivery is not a checkout-recovery email or has no live code.
CREATE OR REPLACE FUNCTION public.start_offer_countdown(p_delivery_id uuid, p_token uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d public.marketing_deliveries%ROWTYPE;
  p public.promo_codes%ROWTYPE;
  v_expiry timestamptz;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;
  SELECT dl.* INTO d
  FROM public.marketing_deliveries dl
  JOIN public.marketing_campaigns c ON c.id = dl.campaign_id
  WHERE dl.id = p_delivery_id AND dl.tracking_token = p_token
    AND c.metadata->>'lifecycle_stage' = 'checkout'
  FOR UPDATE OF dl;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO p FROM public.promo_codes
  WHERE code = d.content->>'promo_code' AND assigned_user_id = d.user_id FOR UPDATE;
  IF NOT FOUND OR NOT p.is_active OR COALESCE(p.current_uses, 0) > 0
     OR p.offer_expires_at IS NULL OR p.offer_expires_at <= now() THEN
    RETURN NULL;
  END IF;
  IF d.content ? 'countdown_started_at' THEN RETURN p.offer_expires_at; END IF;

  v_expiry := GREATEST(p.offer_expires_at, now() + interval '24 hours');
  UPDATE public.promo_codes
  SET offer_expires_at = v_expiry, valid_until = (v_expiry AT TIME ZONE 'UTC')::date, updated_at = now()
  WHERE id = p.id;
  UPDATE public.marketing_deliveries
  SET content = content || jsonb_build_object('countdown_started_at', now(), 'offer_expires_at', v_expiry)
  WHERE id = d.id;
  RETURN v_expiry;
END $$;
REVOKE ALL ON FUNCTION public.start_offer_countdown(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_offer_countdown(uuid, uuid) TO service_role;

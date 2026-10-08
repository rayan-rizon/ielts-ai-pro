-- Nagad rollout controls.
--
-- environment: each order remembers whether it went to Nagad's sandbox or the
-- live gateway. A verified sandbox payment is recorded on the order but grants
-- no plan and writes no payment_requests / billing rows, so admins can test
-- end to end without changing their own plan or adding fake revenue.
--
-- system_settings.nagad_payments.audience decides who sees Nagad at checkout:
-- 'off', 'admins' or 'everyone'. The Edge Functions read it with the service
-- role; it is not exposed to learners. Sandbox credentials are admin-only
-- whatever this says.

ALTER TABLE public.nagad_payments
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'live'
    CHECK (environment IN ('sandbox', 'live'));

INSERT INTO public.system_settings (key, value, description)
VALUES (
  'nagad_payments',
  '{"audience": "admins"}'::jsonb,
  'Who can pay with Nagad: off, admins or everyone. Sandbox credentials are always admin-only.'
)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.service_finalize_nagad_payment(
  p_order_id text,
  p_payment_ref_id text,
  p_outcome text,
  p_nagad_status text,
  p_status_code text DEFAULT NULL,
  p_verified_order_id text DEFAULT NULL,
  p_verified_amount numeric DEFAULT NULL,
  p_issuer_payment_ref text DEFAULT NULL,
  p_payer_mobile text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_order public.nagad_payments%ROWTYPE;
  v_request_id uuid;
  v_reason text;
BEGIN
  IF p_outcome NOT IN ('paid', 'pending', 'failed') THEN
    RAISE EXCEPTION 'Invalid outcome %', p_outcome USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_order FROM public.nagad_payments WHERE order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nagad order not found' USING ERRCODE = 'P0002';
  END IF;

  -- Paid and review are final: access was granted, or a human owns it now.
  IF v_order.status IN ('paid', 'review') THEN
    RETURN jsonb_build_object('status', v_order.status, 'changed', false);
  END IF;

  IF v_order.payment_ref_id IS DISTINCT FROM p_payment_ref_id THEN
    RAISE EXCEPTION 'Payment reference does not belong to this order' USING ERRCODE = '22023';
  END IF;

  IF p_outcome = 'pending' THEN
    UPDATE public.nagad_payments
    SET nagad_status = p_nagad_status,
        nagad_status_code = p_status_code,
        last_checked_at = now(),
        updated_at = now()
    WHERE order_id = p_order_id;
    RETURN jsonb_build_object('status', v_order.status, 'changed', false);
  END IF;

  IF p_outcome = 'failed' THEN
    IF v_order.status IN ('failed', 'expired') THEN
      RETURN jsonb_build_object('status', v_order.status, 'changed', false);
    END IF;
    UPDATE public.nagad_payments
    SET status = 'failed',
        nagad_status = p_nagad_status,
        nagad_status_code = p_status_code,
        failure_reason = COALESCE(p_nagad_status, 'failed'),
        last_checked_at = now(),
        updated_at = now()
    WHERE order_id = p_order_id;
    UPDATE public.marketing_checkout_intents
    SET status = 'failed', updated_at = now()
    WHERE provider = 'nagad' AND external_session_id = p_order_id AND status = 'initiated';
    RETURN jsonb_build_object('status', 'failed', 'changed', true);
  END IF;

  -- p_outcome = 'paid'. Grant only when Nagad confirms our order and amount.
  IF p_verified_order_id IS DISTINCT FROM v_order.order_id THEN
    v_reason := 'verified order id mismatch';
  ELSIF p_verified_amount IS NULL OR round(p_verified_amount, 2) <> v_order.amount THEN
    v_reason := format('paid %s, expected %s', p_verified_amount, v_order.amount);
  -- 'expired' is only our guess that the learner walked away; if Nagad later
  -- confirms the money, they get what they paid for. 'failed' came from Nagad
  -- itself, so a Success after it is contradictory and needs a human.
  ELSIF v_order.status = 'failed' THEN
    v_reason := 'Success reported after Nagad reported a failure';
  ELSIF v_order.auth_id IS NULL THEN
    v_reason := 'learner account no longer exists';
  END IF;

  -- Sandbox payments prove the gateway round trip and nothing else: the
  -- order is recorded as paid, but no plan is granted and no revenue is
  -- written. Admins test here, and their own plans must not change.
  IF v_reason IS NULL AND v_order.environment = 'sandbox' THEN
    UPDATE public.nagad_payments
    SET status = 'paid',
        nagad_status = p_nagad_status,
        nagad_status_code = p_status_code,
        issuer_payment_ref = p_issuer_payment_ref,
        payer_mobile = p_payer_mobile,
        paid_amount = p_verified_amount,
        failure_reason = NULL,
        paid_at = now(),
        last_checked_at = now(),
        updated_at = now()
    WHERE order_id = p_order_id;
    RETURN jsonb_build_object('status', 'paid', 'changed', true, 'sandbox', true);
  END IF;

  IF v_reason IS NOT NULL THEN
    UPDATE public.nagad_payments
    SET status = 'review',
        nagad_status = p_nagad_status,
        nagad_status_code = p_status_code,
        issuer_payment_ref = p_issuer_payment_ref,
        payer_mobile = p_payer_mobile,
        paid_amount = p_verified_amount,
        failure_reason = v_reason,
        last_checked_at = now(),
        updated_at = now()
    WHERE order_id = p_order_id;
    UPDATE public.marketing_checkout_intents
    SET status = 'manual_review', updated_at = now()
    WHERE provider = 'nagad' AND external_session_id = p_order_id;
    RETURN jsonb_build_object('status', 'review', 'changed', true, 'reason', v_reason);
  END IF;

  -- Inserted pending then approved, so on_payment_approval grants access and
  -- the other payment_requests triggers run exactly as for a manual approval.
  INSERT INTO public.payment_requests (
    auth_id, tier, interval, amount, currency, payment_method, transaction_id,
    sender_phone, status, admin_notes, marketing_campaign_id, marketing_delivery_id
  ) VALUES (
    v_order.auth_id, v_order.tier, v_order.billing_interval, v_order.amount, 'BDT', 'nagad',
    COALESCE(p_issuer_payment_ref, p_payment_ref_id),
    COALESCE(p_payer_mobile, ''),
    'pending',
    format('Nagad online payment, verified automatically. Order %s%s.',
      v_order.order_id,
      CASE WHEN v_order.promo_code IS NOT NULL THEN ', promo ' || v_order.promo_code ELSE '' END),
    v_order.marketing_campaign_id, v_order.marketing_delivery_id
  )
  RETURNING id INTO v_request_id;

  UPDATE public.payment_requests
  SET status = 'approved', updated_at = now()
  WHERE id = v_request_id;

  UPDATE public.nagad_payments
  SET status = 'paid',
      nagad_status = p_nagad_status,
      nagad_status_code = p_status_code,
      issuer_payment_ref = p_issuer_payment_ref,
      payer_mobile = p_payer_mobile,
      paid_amount = p_verified_amount,
      payment_request_id = v_request_id,
      failure_reason = NULL,
      paid_at = now(),
      last_checked_at = now(),
      updated_at = now()
  WHERE order_id = p_order_id;

  UPDATE public.marketing_checkout_intents
  SET status = 'settled', updated_at = now()
  WHERE provider = 'nagad' AND external_session_id = p_order_id;

  RETURN jsonb_build_object('status', 'paid', 'changed', true, 'payment_request_id', v_request_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.service_finalize_nagad_payment(text, text, text, text, text, text, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.service_finalize_nagad_payment(text, text, text, text, text, text, numeric, text, text) TO service_role;

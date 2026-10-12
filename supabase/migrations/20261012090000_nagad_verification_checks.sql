-- Nagad UAT observation (12 Oct 2026): before showing success, check the
-- verify response's merchant, paymentRefId, amount, status code and status,
-- and show an error on any mismatch.
--
-- nagad.ts compares the response with the order and passes any difference as
-- p_mismatch; the order then goes to review instead of paid or failed. Review
-- reasons now start with a stable code (amount_mismatch, merchant_mismatch, ...)
-- so the result page can tell the customer what went wrong.

DROP FUNCTION IF EXISTS public.service_finalize_nagad_payment(text, text, text, text, text, text, numeric, text, text);

CREATE OR REPLACE FUNCTION public.service_finalize_nagad_payment(
  p_order_id text,
  p_payment_ref_id text,
  p_outcome text,
  p_nagad_status text,
  p_status_code text DEFAULT NULL,
  p_verified_order_id text DEFAULT NULL,
  p_verified_amount numeric DEFAULT NULL,
  p_issuer_payment_ref text DEFAULT NULL,
  p_payer_mobile text DEFAULT NULL,
  p_mismatch text DEFAULT NULL
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

  -- The verify response did not match this order (merchant, payment
  -- reference, order id, amount or status code; checked in nagad.ts). It is
  -- never trusted as success or failure: a person reconciles it.
  IF p_mismatch IS NOT NULL THEN
    UPDATE public.nagad_payments
    SET status = 'review',
        nagad_status = p_nagad_status,
        nagad_status_code = p_status_code,
        issuer_payment_ref = p_issuer_payment_ref,
        paid_amount = p_verified_amount,
        failure_reason = left(p_mismatch, 500),
        last_checked_at = now(),
        updated_at = now()
    WHERE order_id = p_order_id;
    UPDATE public.marketing_checkout_intents
    SET status = 'manual_review', updated_at = now()
    WHERE provider = 'nagad' AND external_session_id = p_order_id;
    RETURN jsonb_build_object('status', 'review', 'changed', true, 'reason', p_mismatch);
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
    v_reason := 'order_mismatch: verified order id differs';
  ELSIF p_verified_amount IS NULL OR round(p_verified_amount, 2) <> v_order.amount THEN
    v_reason := format('amount_mismatch: paid %s, expected %s', p_verified_amount, v_order.amount);
  -- 'expired' is only our guess that the learner walked away; if Nagad later
  -- confirms the money, they get what they paid for. 'failed' came from Nagad
  -- itself, so a Success after it is contradictory and needs a human.
  ELSIF v_order.status = 'failed' THEN
    v_reason := 'success_after_failure: Success reported after Nagad reported a failure';
  ELSIF v_order.auth_id IS NULL THEN
    v_reason := 'account_missing: learner account no longer exists';
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

REVOKE ALL ON FUNCTION public.service_finalize_nagad_payment(text, text, text, text, text, text, numeric, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.service_finalize_nagad_payment(text, text, text, text, text, text, numeric, text, text, text) TO service_role;

-- One Stripe account serves this app and at least one other product, and a
-- webhook destination receives every refund and dispute on the account.
-- service_record_provider_refund recorded all of them, so another product's
-- refunds would have appeared in this app's refund ledger as orphan rows.
-- Refunds that match no payment and no customer of this app are now ignored.

CREATE OR REPLACE FUNCTION public.service_record_provider_refund(
  p_provider text,
  p_kind text,
  p_provider_refund_ref text,
  p_status text,
  p_amount numeric,
  p_currency text,
  p_payment_transaction_id text DEFAULT NULL,
  p_provider_payment_ref text DEFAULT NULL,
  p_customer_ref text DEFAULT NULL,
  p_app_refund_id uuid DEFAULT NULL,
  p_failure_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_id uuid;
  v_payment public.payment_requests%ROWTYPE;
  v_user_id uuid;
  v_evidence jsonb := '{}'::jsonb;
  v_terminal boolean := p_status IN ('succeeded', 'failed', 'canceled');
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('pending', 'succeeded', 'failed', 'canceled') THEN
    RAISE EXCEPTION 'Unknown refund status %', p_status USING ERRCODE = '22023';
  END IF;
  IF p_kind NOT IN ('refund', 'chargeback') THEN
    RAISE EXCEPTION 'Unknown refund kind %', p_kind USING ERRCODE = '22023';
  END IF;

  IF p_app_refund_id IS NOT NULL THEN
    SELECT id INTO v_id FROM public.payment_refunds WHERE id = p_app_refund_id FOR UPDATE;
  END IF;
  IF v_id IS NULL AND p_provider_refund_ref IS NOT NULL THEN
    SELECT id INTO v_id FROM public.payment_refunds
    WHERE provider = p_provider AND provider_refund_ref = p_provider_refund_ref FOR UPDATE;
  END IF;

  IF v_id IS NOT NULL THEN
    UPDATE public.payment_refunds SET
      provider_refund_ref = COALESCE(provider_refund_ref, p_provider_refund_ref),
      status = p_status,
      amount = COALESCE(round(p_amount, 2), amount),
      failure_reason = CASE WHEN p_status IN ('failed', 'canceled') THEN p_failure_reason ELSE NULL END,
      resolved_at = CASE WHEN v_terminal THEN COALESCE(resolved_at, now()) ELSE NULL END,
      updated_at = now()
    WHERE id = v_id;
    RETURN jsonb_build_object('id', v_id, 'created', false);
  END IF;

  IF NULLIF(btrim(COALESCE(p_payment_transaction_id, '')), '') IS NOT NULL THEN
    SELECT * INTO v_payment FROM public.payment_requests
    WHERE transaction_id = p_payment_transaction_id;
  END IF;

  IF v_payment.id IS NOT NULL THEN
    SELECT id INTO v_user_id FROM public.users WHERE auth_id = v_payment.auth_id;
    BEGIN
      v_evidence := public.get_payment_refund_evidence(v_payment.id);
    EXCEPTION WHEN OTHERS THEN
      v_evidence := '{}'::jsonb;
    END;
  ELSIF p_customer_ref IS NOT NULL THEN
    SELECT id INTO v_user_id FROM public.users WHERE stripe_customer_id = p_customer_ref LIMIT 1;
  END IF;

  -- The Stripe account also serves other products, and a webhook destination
  -- receives every refund and dispute on it. One that matches none of our
  -- payments and none of our customers is not ours: record nothing.
  IF v_payment.id IS NULL AND v_user_id IS NULL THEN
    RETURN jsonb_build_object('id', NULL, 'created', false, 'ignored', true);
  END IF;

  INSERT INTO public.payment_refunds (
    payment_request_id, user_id, kind, provider, method, status, amount, currency, reason,
    note, provider_payment_ref, provider_refund_ref, eligibility_snapshot, failure_reason,
    resolved_at
  ) VALUES (
    v_payment.id, v_user_id, p_kind, p_provider, 'provider_dashboard', p_status,
    round(p_amount, 2), upper(COALESCE(p_currency, v_payment.currency, 'USD')),
    CASE WHEN p_kind = 'chargeback' THEN 'chargeback' ELSE 'other' END,
    CASE WHEN p_kind = 'chargeback' THEN 'Dispute opened with the card issuer'
      ELSE 'Refunded outside the admin panel' END,
    COALESCE(v_payment.transaction_id, p_provider_payment_ref), p_provider_refund_ref,
    v_evidence, CASE WHEN p_status IN ('failed', 'canceled') THEN p_failure_reason END,
    CASE WHEN v_terminal THEN now() END
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'created', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.service_record_provider_refund(text, text, text, text, numeric, text, text, text, text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.service_record_provider_refund(text, text, text, text, numeric, text, text, text, text, uuid, text) TO service_role;

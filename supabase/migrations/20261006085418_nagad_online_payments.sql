-- Nagad Online Payment Gateway: automatic Bangladesh checkout.
--
-- One row per checkout attempt. Edge Functions own every write (service role);
-- a learner can only read their own rows, to show the result page.
--
-- A verified payment is not granted here directly. It becomes an approved
-- payment_requests row, exactly as an admin-approved bKash payment does, so
-- the existing triggers grant access (handle_payment_approval), write
-- billing_history, attribute the marketing campaign and record the customer
-- payment fact. Admin payment history, refunds and revenue reporting then see
-- Nagad with no further changes.

CREATE TABLE IF NOT EXISTS public.nagad_payments (
  order_id text PRIMARY KEY CHECK (order_id ~ '^[A-Za-z0-9]{5,20}$'),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  auth_id uuid REFERENCES public.users(auth_id) ON DELETE SET NULL,
  tier text NOT NULL CHECK (tier IN ('pro', 'premium')),
  billing_interval text NOT NULL CHECK (billing_interval IN ('monthly', 'quarterly')),
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'BDT' CHECK (currency = 'BDT'),
  promo_code text,
  marketing_campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  marketing_delivery_id uuid REFERENCES public.marketing_deliveries(id) ON DELETE SET NULL,
  -- initiated: row exists, Nagad not yet reached
  -- pending:   learner sent to Nagad, outcome unknown
  -- paid:      verified Success for the right amount, access granted
  -- failed:    Nagad reported a terminal failure or cancellation
  -- expired:   never completed within the reconcile window
  -- review:    Nagad says Success but the amount or order does not match ours;
  --            no access granted, an admin must look
  status text NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated', 'pending', 'paid', 'failed', 'expired', 'review')),
  payment_ref_id text UNIQUE,
  issuer_payment_ref text,
  nagad_status text,
  nagad_status_code text,
  payer_mobile text,
  paid_amount numeric(10,2),
  failure_reason text,
  payment_request_id uuid REFERENCES public.payment_requests(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_checked_at timestamptz,
  paid_at timestamptz
);

COMMENT ON TABLE public.nagad_payments IS
  'Nagad Online Payment checkouts. Written only by the nagad-* Edge Functions; verified payments become approved payment_requests.';

CREATE INDEX IF NOT EXISTS idx_nagad_payments_auth_id ON public.nagad_payments (auth_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nagad_payments_user_id ON public.nagad_payments (user_id);
CREATE INDEX IF NOT EXISTS idx_nagad_payments_open ON public.nagad_payments (created_at)
  WHERE status IN ('initiated', 'pending');
CREATE INDEX IF NOT EXISTS idx_nagad_payments_payment_request ON public.nagad_payments (payment_request_id);
CREATE INDEX IF NOT EXISTS idx_nagad_payments_campaign ON public.nagad_payments (marketing_campaign_id);
CREATE INDEX IF NOT EXISTS idx_nagad_payments_delivery ON public.nagad_payments (marketing_delivery_id);

ALTER TABLE public.nagad_payments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.nagad_payments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.nagad_payments TO authenticated;
GRANT ALL ON TABLE public.nagad_payments TO service_role;

DROP POLICY IF EXISTS "Learners read own Nagad payments" ON public.nagad_payments;
CREATE POLICY "Learners read own Nagad payments" ON public.nagad_payments
  FOR SELECT TO authenticated
  USING (auth_id = (SELECT auth.uid()) OR public.is_admin());

-- Checkout intents drive abandoned-checkout recovery and the growth dashboard.
-- Nagad orders are tracked there too and settled by the function below, so a
-- learner who paid is never sent a "you left your checkout" offer.
ALTER TABLE public.marketing_checkout_intents DROP CONSTRAINT IF EXISTS marketing_checkout_intents_provider_check;
ALTER TABLE public.marketing_checkout_intents ADD CONSTRAINT marketing_checkout_intents_provider_check
  CHECK (provider = ANY (ARRAY['stripe'::text, 'manual'::text, 'nagad'::text]));

-- ---------------------------------------------------------------------------
-- Record what Nagad's verify API said about one order. Idempotent and
-- serialised per order: the callback, the result page and the reconcile job
-- can all race here, and only the first Success grants.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Re-check open orders every 10 minutes, for learners who paid and closed the
-- tab before Nagad redirected them back. Runs only once the
-- nagad_reconcile_secret Vault secret exists (same pattern as skill-lab-cleanup).
-- ---------------------------------------------------------------------------
DO $schedule$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'nagad-reconcile';
    PERFORM cron.schedule('nagad-reconcile', '*/10 * * * *', $job$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/nagad-reconcile',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'nagad_reconcile_secret')
        ),
        body := '{}'::jsonb
      ) where exists (select 1 from vault.decrypted_secrets where name = 'nagad_reconcile_secret')
          and exists (select 1 from vault.decrypted_secrets where name = 'project_url')
          and exists (select 1 from public.nagad_payments where status in ('initiated', 'pending'));
    $job$);
  END IF;
END $schedule$;

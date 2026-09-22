-- Refund evidence, a provider-agnostic refund ledger, and a six-month ceiling
-- on payment and AI-usage records.
--
-- The refund policy offers a voluntary refund only when the FIRST paid purchase
-- is completely unused and the request arrives within seven days of it. Until
-- now nothing in the admin panel could answer that, Stripe refunds never
-- reached the app, and account deletion cascaded the payment ledger away.
--
-- payment_requests is the real payment ledger: handle_stripe_event inserts
-- Stripe purchases into it as 'approved', and bKash/Nagad submissions land in
-- it as 'pending'. Refunds therefore hang off payment_requests, keyed by
-- `provider` (= payment_method), so a future bKash/Nagad API integration only
-- has to write the same rows.

-- ---------------------------------------------------------------------------
-- 1. payment_requests: a refunded state, and learners can only submit pending
-- ---------------------------------------------------------------------------

ALTER TABLE public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_status_check;
ALTER TABLE public.payment_requests ADD CONSTRAINT payment_requests_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'refunded'::text]));

-- The INSERT policy only checked auth_id, so a learner could insert a row that
-- was already 'approved'. It never upgraded them (approval fires on UPDATE),
-- but it counted as revenue and would have counted as a first purchase here.
CREATE OR REPLACE FUNCTION public.guard_learner_payment_request_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF COALESCE(auth.role(), '') = 'authenticated' AND NOT public.is_admin() THEN
    NEW.status := 'pending';
    NEW.admin_notes := NULL;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_learner_payment_request_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_learner_payment_request_insert ON public.payment_requests;
CREATE TRIGGER guard_learner_payment_request_insert
  BEFORE INSERT ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.guard_learner_payment_request_insert();

-- ---------------------------------------------------------------------------
-- 2. Payment records survive account deletion (until the six-month purge)
-- ---------------------------------------------------------------------------
-- Deleting an account used to cascade the payment ledger away, which erased
-- the revenue history and the only evidence for a later chargeback. The rows
-- now lose their link to the person and are removed by the retention job.
-- Constraint names are unchanged: PostgREST embeds rely on them.

ALTER TABLE public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_auth_id_fkey;
ALTER TABLE public.payment_requests ADD CONSTRAINT payment_requests_auth_id_fkey
  FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE SET NULL;

ALTER TABLE public.billing_history DROP CONSTRAINT IF EXISTS billing_history_user_id_fkey;
ALTER TABLE public.billing_history ADD CONSTRAINT billing_history_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.billing_history DROP CONSTRAINT IF EXISTS billing_history_auth_id_fkey;
ALTER TABLE public.billing_history ADD CONSTRAINT billing_history_auth_id_fkey
  FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 3. Durable per-customer facts (outlive the six-month purge)
-- ---------------------------------------------------------------------------
-- "First purchase only" has to hold after the first payment row is purged,
-- otherwise a renewal eight months later would look like a first purchase.
-- One tiny row per paying account; removed with the account.

CREATE TABLE IF NOT EXISTS public.customer_billing_facts (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  first_paid_at timestamptz NOT NULL,
  first_payment_request_id uuid,
  last_paid_at timestamptz NOT NULL,
  paid_payments integer NOT NULL DEFAULT 0,
  refunds_succeeded integer NOT NULL DEFAULT 0,
  last_refund_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_billing_facts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_billing_facts_admin_read ON public.customer_billing_facts;
CREATE POLICY customer_billing_facts_admin_read ON public.customer_billing_facts
  FOR SELECT TO authenticated USING (public.is_admin());
REVOKE ALL ON public.customer_billing_facts FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.customer_billing_facts FROM authenticated;

-- The moment a payment counts as paid: Stripe rows are inserted at settlement;
-- a manual payment is paid when an admin approves it, which is when
-- handle_payment_approval writes its billing_history row.
CREATE OR REPLACE FUNCTION public.payment_request_paid_at(
  p_payment_method text,
  p_transaction_id text,
  p_created_at timestamptz,
  p_updated_at timestamptz
)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT CASE
    WHEN lower(COALESCE(p_payment_method, '')) = 'stripe' THEN p_created_at
    ELSE COALESCE(
      (SELECT bh.created_at FROM public.billing_history bh
        WHERE bh.transaction_id = p_transaction_id
        ORDER BY bh.created_at LIMIT 1),
      p_updated_at,
      p_created_at
    )
  END;
$function$;

REVOKE ALL ON FUNCTION public.payment_request_paid_at(text, text, timestamptz, timestamptz)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.track_customer_payment_fact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
  v_paid_at timestamptz;
BEGIN
  -- Only a transition INTO approved is a new payment. refunded -> approved is
  -- a reversed refund of an existing payment, not a second purchase.
  IF NEW.status IS DISTINCT FROM 'approved' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IN ('approved', 'refunded') THEN RETURN NEW; END IF;

  -- A bookkeeping failure must never block a payment from settling.
  BEGIN
    SELECT u.id INTO v_user_id FROM public.users u WHERE u.auth_id = NEW.auth_id;
    IF v_user_id IS NULL THEN RETURN NEW; END IF;

    v_paid_at := CASE WHEN TG_OP = 'INSERT' THEN COALESCE(NEW.created_at, now()) ELSE now() END;

    INSERT INTO public.customer_billing_facts AS f (
      user_id, first_paid_at, first_payment_request_id, last_paid_at, paid_payments
    ) VALUES (v_user_id, v_paid_at, NEW.id, v_paid_at, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      first_payment_request_id = CASE
        WHEN EXCLUDED.first_paid_at < f.first_paid_at THEN EXCLUDED.first_payment_request_id
        ELSE f.first_payment_request_id
      END,
      first_paid_at = LEAST(f.first_paid_at, EXCLUDED.first_paid_at),
      last_paid_at = GREATEST(f.last_paid_at, EXCLUDED.last_paid_at),
      paid_payments = f.paid_payments + 1,
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'customer_billing_facts not updated for payment %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.track_customer_payment_fact() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS track_customer_payment_fact ON public.payment_requests;
CREATE TRIGGER track_customer_payment_fact
  AFTER INSERT OR UPDATE OF status ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.track_customer_payment_fact();

INSERT INTO public.customer_billing_facts (
  user_id, first_paid_at, first_payment_request_id, last_paid_at, paid_payments
)
SELECT
  u.id,
  min(p.paid_at),
  (array_agg(pr.id ORDER BY p.paid_at))[1],
  max(p.paid_at),
  count(*)::integer
FROM public.payment_requests pr
JOIN public.users u ON u.auth_id = pr.auth_id
CROSS JOIN LATERAL (
  SELECT public.payment_request_paid_at(
    pr.payment_method, pr.transaction_id, pr.created_at, pr.updated_at
  ) AS paid_at
) p
WHERE pr.status = 'approved'
GROUP BY u.id
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Refund ledger (refunds and chargebacks, any payment provider)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payment_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id uuid REFERENCES public.payment_requests(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'refund' CHECK (kind IN ('refund', 'chargeback')),
  -- Matches payment_requests.payment_method: stripe, bkash, nagad, ...
  provider text NOT NULL CHECK (provider ~ '^[a-z0-9_]{2,32}$'),
  -- provider_api: we called the provider (Stripe today, bKash/Nagad later).
  -- manual_transfer: an admin sent the money back and recorded the reference.
  -- provider_dashboard: done outside the app and reported by webhook.
  method text NOT NULL CHECK (method IN ('provider_api', 'manual_transfer', 'provider_dashboard')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  reason text NOT NULL CHECK (reason IN (
    'unused_purchase', 'duplicate_charge', 'service_failure', 'unauthorized',
    'legal_requirement', 'goodwill', 'chargeback', 'other'
  )),
  note text CHECK (note IS NULL OR char_length(note) <= 1000),
  provider_payment_ref text,
  provider_refund_ref text,
  eligibility_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  failure_reason text,
  access_ended_at timestamptz,
  initiated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_refunds_provider_ref_key
  ON public.payment_refunds (provider, provider_refund_ref)
  WHERE provider_refund_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS payment_refunds_user_created_idx
  ON public.payment_refunds (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_refunds_payment_idx
  ON public.payment_refunds (payment_request_id);
CREATE INDEX IF NOT EXISTS payment_refunds_created_idx
  ON public.payment_refunds (created_at DESC);
CREATE INDEX IF NOT EXISTS payment_refunds_initiated_by_idx
  ON public.payment_refunds (initiated_by);

ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_refunds_admin_read ON public.payment_refunds;
CREATE POLICY payment_refunds_admin_read ON public.payment_refunds
  FOR SELECT TO authenticated USING (public.is_admin());
REVOKE ALL ON public.payment_refunds FROM anon;
-- Every write goes through the SECURITY DEFINER functions below.
REVOKE INSERT, UPDATE, DELETE ON public.payment_refunds FROM authenticated;

-- A payment is 'refunded' once succeeded refunds (or lost chargebacks) cover
-- it. Revenue reports read status = 'approved' / 'paid', so a full refund
-- drops out of revenue without touching any report.
CREATE OR REPLACE FUNCTION public.sync_payment_refund_state(p_payment_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_payment public.payment_requests%ROWTYPE;
  v_refunded numeric;
  v_target text;
BEGIN
  IF p_payment_request_id IS NULL THEN RETURN; END IF;

  SELECT * INTO v_payment FROM public.payment_requests
  WHERE id = p_payment_request_id FOR UPDATE;
  IF NOT FOUND OR v_payment.status NOT IN ('approved', 'refunded') THEN RETURN; END IF;

  SELECT COALESCE(sum(amount), 0) INTO v_refunded
  FROM public.payment_refunds
  WHERE payment_request_id = p_payment_request_id AND status = 'succeeded';

  v_target := CASE
    WHEN v_refunded >= COALESCE(v_payment.amount, 0) - 0.005 AND v_refunded > 0 THEN 'refunded'
    ELSE 'approved'
  END;

  IF v_target IS DISTINCT FROM v_payment.status THEN
    UPDATE public.payment_requests SET status = v_target WHERE id = p_payment_request_id;
  END IF;

  IF NULLIF(btrim(v_payment.transaction_id), '') IS NOT NULL THEN
    UPDATE public.billing_history
    SET status = CASE WHEN v_target = 'refunded' THEN 'refunded' ELSE 'paid' END
    WHERE transaction_id = v_payment.transaction_id
      AND status IN ('paid', 'refunded')
      AND status IS DISTINCT FROM CASE WHEN v_target = 'refunded' THEN 'refunded' ELSE 'paid' END;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_payment_refund_state(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.on_payment_refund_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_became_succeeded boolean;
  v_left_succeeded boolean;
  v_paid_at timestamptz;
BEGIN
  PERFORM public.sync_payment_refund_state(NEW.payment_request_id);
  IF TG_OP = 'UPDATE' AND OLD.payment_request_id IS DISTINCT FROM NEW.payment_request_id THEN
    PERFORM public.sync_payment_refund_state(OLD.payment_request_id);
  END IF;

  IF NEW.kind <> 'refund' OR NEW.user_id IS NULL THEN RETURN NEW; END IF;

  v_became_succeeded := NEW.status = 'succeeded'
    AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'succeeded');
  v_left_succeeded := TG_OP = 'UPDATE' AND OLD.status = 'succeeded' AND NEW.status <> 'succeeded';

  BEGIN
    IF v_became_succeeded THEN
      SELECT public.payment_request_paid_at(pr.payment_method, pr.transaction_id, pr.created_at, pr.updated_at)
      INTO v_paid_at
      FROM public.payment_requests pr WHERE pr.id = NEW.payment_request_id;

      INSERT INTO public.customer_billing_facts AS f (
        user_id, first_paid_at, first_payment_request_id, last_paid_at,
        paid_payments, refunds_succeeded, last_refund_at
      ) VALUES (
        NEW.user_id, COALESCE(v_paid_at, now()), NEW.payment_request_id, COALESCE(v_paid_at, now()),
        1, 1, now()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        refunds_succeeded = f.refunds_succeeded + 1,
        last_refund_at = now(),
        updated_at = now();
    ELSIF v_left_succeeded THEN
      UPDATE public.customer_billing_facts
      SET refunds_succeeded = GREATEST(refunds_succeeded - 1, 0), updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'customer_billing_facts refund count not updated for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.on_payment_refund_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_payment_refund_change ON public.payment_refunds;
CREATE TRIGGER on_payment_refund_change
  AFTER INSERT OR UPDATE OF status, amount, payment_request_id ON public.payment_refunds
  FOR EACH ROW EXECUTE FUNCTION public.on_payment_refund_change();

-- ---------------------------------------------------------------------------
-- 5. Refund evidence
-- ---------------------------------------------------------------------------

-- One place decides which AI rows are the learner using the product. Admin
-- tooling is excluded; automatic plan refreshes are shown but never decide.
CREATE OR REPLACE FUNCTION public.ai_usage_endpoint_class(p_endpoint text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path TO ''
AS $function$
  SELECT CASE
    WHEN p_endpoint ~ '^(admin|retentionAutopilot)' THEN 'admin'
    WHEN p_endpoint IN ('generateAdaptiveLearningPath', 'generateStudyRecommendations') THEN 'background'
    ELSE 'learner'
  END;
$function$;

GRANT EXECUTE ON FUNCTION public.ai_usage_endpoint_class(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_payment_refund_evidence(p_payment_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_payment public.payment_requests%ROWTYPE;
  v_user_id uuid;
  v_facts public.customer_billing_facts%ROWTYPE;
  v_paid_at timestamptz;
  v_window_ends timestamptz;
  v_is_first boolean;
  v_refunded numeric;
  v_pending numeric;
  v_own_refunds integer;
  v_prior_refunds integer;
  v_learner_delivered integer := 0;
  v_learner_cached integer := 0;
  v_learner_not_delivered integer := 0;
  v_background integer := 0;
  v_first_use timestamptz;
  v_cost numeric := 0;
  v_by_endpoint jsonb := '[]'::jsonb;
  v_tests integer := 0;
  v_first_test timestamptz;
  v_skill_lab integer := 0;
  v_verdict text;
  v_reasons jsonb := '[]'::jsonb;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_payment FROM public.payment_requests WHERE id = p_payment_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT u.id INTO v_user_id FROM public.users u WHERE u.auth_id = v_payment.auth_id;
  SELECT * INTO v_facts FROM public.customer_billing_facts WHERE user_id = v_user_id;

  v_paid_at := public.payment_request_paid_at(
    v_payment.payment_method, v_payment.transaction_id, v_payment.created_at, v_payment.updated_at
  );
  v_window_ends := v_paid_at + interval '7 days';
  v_is_first := v_facts.user_id IS NULL
    OR v_facts.first_payment_request_id = v_payment.id
    OR v_paid_at <= v_facts.first_paid_at + interval '1 minute';

  SELECT
    COALESCE(sum(amount) FILTER (WHERE status = 'succeeded'), 0),
    COALESCE(sum(amount) FILTER (WHERE status = 'pending'), 0),
    count(*) FILTER (WHERE status = 'succeeded' AND kind = 'refund')
  INTO v_refunded, v_pending, v_own_refunds
  FROM public.payment_refunds WHERE payment_request_id = v_payment.id;

  v_prior_refunds := GREATEST(COALESCE(v_facts.refunds_succeeded, 0) - v_own_refunds, 0);

  IF v_user_id IS NOT NULL AND v_payment.status IN ('approved', 'refunded') THEN
    WITH usage AS (
      SELECT
        a.endpoint,
        public.ai_usage_endpoint_class(a.endpoint) AS cls,
        COALESCE(a.request_metadata ->> 'reservationStatus', 'completed') = 'completed' AS delivered,
        a.cached,
        a.created_at,
        CASE WHEN (a.request_metadata ->> 'estimatedProviderCostUsd') ~ '^[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?$'
          THEN (a.request_metadata ->> 'estimatedProviderCostUsd')::numeric ELSE 0 END AS cost
      FROM public.ai_api_usage a
      WHERE a.user_id = v_user_id AND a.created_at >= v_paid_at
    ), totals AS (
      SELECT
        count(*) FILTER (WHERE cls = 'learner' AND delivered)::integer AS learner_delivered,
        count(*) FILTER (WHERE cls = 'learner' AND delivered AND cached)::integer AS learner_cached,
        count(*) FILTER (WHERE cls = 'learner' AND NOT delivered)::integer AS learner_not_delivered,
        count(*) FILTER (WHERE cls = 'background' AND delivered)::integer AS background,
        min(created_at) FILTER (WHERE cls = 'learner' AND delivered) AS first_use,
        COALESCE(sum(cost) FILTER (WHERE cls <> 'admin'), 0) AS cost
      FROM usage
    ), per_endpoint AS (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'endpoint', endpoint, 'class', cls,
        'delivered', delivered_count, 'notDelivered', failed_count
      ) ORDER BY delivered_count DESC, endpoint), '[]'::jsonb) AS rows
      FROM (
        SELECT endpoint, cls,
          count(*) FILTER (WHERE delivered)::integer AS delivered_count,
          count(*) FILTER (WHERE NOT delivered)::integer AS failed_count
        FROM usage WHERE cls <> 'admin'
        GROUP BY endpoint, cls
      ) e
    )
    SELECT t.learner_delivered, t.learner_cached, t.learner_not_delivered, t.background,
      t.first_use, t.cost, p.rows
    INTO v_learner_delivered, v_learner_cached, v_learner_not_delivered, v_background,
      v_first_use, v_cost, v_by_endpoint
    FROM totals t CROSS JOIN per_endpoint p;

    SELECT count(*)::integer, min(COALESCE(t.started_at, t.created_at))
    INTO v_tests, v_first_test
    FROM public.test_sessions t
    WHERE t.user_id = v_user_id AND t.created_at >= v_paid_at - interval '1 day'
      AND COALESCE(t.started_at, t.created_at) >= v_paid_at;

    SELECT count(*)::integer INTO v_skill_lab
    FROM public.skill_lab_sessions s
    WHERE s.user_id = v_user_id AND s.created_at >= v_paid_at;
  END IF;

  v_verdict := CASE
    WHEN v_payment.status = 'refunded' THEN 'refunded'
    WHEN v_payment.status <> 'approved' THEN 'not_paid'
    WHEN NOT v_is_first THEN 'not_first_purchase'
    WHEN now() > v_window_ends THEN 'window_expired'
    WHEN v_learner_delivered > 0 THEN 'used'
    WHEN v_user_id IS NULL OR v_prior_refunds > 0 OR v_tests > 0 OR v_skill_lab > 0 THEN 'review'
    ELSE 'eligible'
  END;

  v_reasons := to_jsonb(array_remove(ARRAY[
    CASE WHEN NOT v_is_first THEN 'An earlier paid purchase exists; the seven-day offer covers only the first purchase.' END,
    CASE WHEN now() > v_window_ends THEN 'More than seven days have passed since this payment was activated.' END,
    CASE WHEN v_learner_delivered > 0 THEN format('%s AI result(s) were delivered after purchase.', v_learner_delivered) END,
    CASE WHEN v_learner_not_delivered > 0 THEN format('%s AI request(s) failed or never finished; these do not count as use.', v_learner_not_delivered) END,
    CASE WHEN v_tests > 0 THEN format('%s practice test(s) were started after purchase — check whether they were paid-only.', v_tests) END,
    CASE WHEN v_skill_lab > 0 THEN format('%s Skill Lab session(s) were started after purchase.', v_skill_lab) END,
    CASE WHEN v_prior_refunds > 0 THEN format('This account has %s earlier refund(s).', v_prior_refunds) END,
    CASE WHEN v_user_id IS NULL THEN 'The account was deleted, so usage evidence is no longer available.' END
  ], NULL));

  RETURN jsonb_build_object(
    'paymentRequestId', v_payment.id,
    'provider', lower(COALESCE(v_payment.payment_method, 'manual')),
    'transactionId', v_payment.transaction_id,
    'amount', v_payment.amount,
    'currency', upper(COALESCE(v_payment.currency, 'USD')),
    'status', v_payment.status,
    'paidAt', v_paid_at,
    'windowEndsAt', v_window_ends,
    'withinWindow', now() <= v_window_ends,
    'isFirstPurchase', v_is_first,
    'firstPaidAt', v_facts.first_paid_at,
    'refundedAmount', v_refunded,
    'pendingRefundAmount', v_pending,
    'refundableAmount', GREATEST(COALESCE(v_payment.amount, 0) - v_refunded - v_pending, 0),
    'priorRefunds', v_prior_refunds,
    'usage', jsonb_build_object(
      'learnerDelivered', v_learner_delivered,
      'learnerCached', v_learner_cached,
      'learnerNotDelivered', v_learner_not_delivered,
      'background', v_background,
      'firstLearnerUseAt', v_first_use,
      'minutesToFirstUse', CASE WHEN v_first_use IS NULL THEN NULL
        ELSE round(extract(epoch FROM v_first_use - v_paid_at) / 60)::integer END,
      'providerCostUsd', round(v_cost, 4),
      'testsStarted', v_tests,
      'firstTestAt', v_first_test,
      'skillLabSessions', v_skill_lab,
      'byEndpoint', v_by_endpoint
    ),
    'evidenceComplete', v_user_id IS NOT NULL AND v_paid_at >= now() - interval '6 months',
    'verdict', v_verdict,
    'reasons', v_reasons,
    'evaluatedAt', now()
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_payment_refund_evidence(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_payment_refund_evidence(uuid) TO authenticated, service_role;

-- Everything an admin needs about one account on one screen.
CREATE OR REPLACE FUNCTION public.get_admin_customer_billing_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user public.users%ROWTYPE;
  v_facts public.customer_billing_facts%ROWTYPE;
  v_payments jsonb;
  v_refunds jsonb;
  v_last30 jsonb;
  v_daily jsonb;
  v_recent jsonb;
  v_oldest timestamptz;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_facts FROM public.customer_billing_facts WHERE user_id = v_user.id;

  SELECT COALESCE(jsonb_agg(p.payment ORDER BY p.created_at DESC), '[]'::jsonb) INTO v_payments
  FROM (
    SELECT pr.created_at, jsonb_build_object(
      'id', pr.id,
      'provider', lower(COALESCE(pr.payment_method, 'manual')),
      'transactionId', pr.transaction_id,
      'senderPhone', pr.sender_phone,
      'amount', pr.amount,
      'currency', upper(COALESCE(pr.currency, 'USD')),
      'tier', pr.tier,
      'interval', pr.interval,
      'status', pr.status,
      'submittedAt', pr.created_at,
      'adminNotes', pr.admin_notes,
      'evidence', CASE WHEN pr.status IN ('approved', 'refunded')
        THEN public.get_payment_refund_evidence(pr.id) END
    ) AS payment
    FROM public.payment_requests pr
    WHERE pr.auth_id = v_user.auth_id
    ORDER BY pr.created_at DESC
    LIMIT 50
  ) p;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', r.id, 'paymentRequestId', r.payment_request_id, 'kind', r.kind,
    'provider', r.provider, 'method', r.method, 'status', r.status,
    'amount', r.amount, 'currency', r.currency, 'reason', r.reason, 'note', r.note,
    'providerRefundRef', r.provider_refund_ref, 'failureReason', r.failure_reason,
    'accessEndedAt', r.access_ended_at, 'createdAt', r.created_at, 'resolvedAt', r.resolved_at,
    'initiatedBy', ib.email
  ) ORDER BY r.created_at DESC), '[]'::jsonb) INTO v_refunds
  FROM public.payment_refunds r
  LEFT JOIN public.users ib ON ib.id = r.initiated_by
  WHERE r.user_id = v_user.id;

  WITH recent AS (
    SELECT a.endpoint, public.ai_usage_endpoint_class(a.endpoint) AS cls,
      COALESCE(a.request_metadata ->> 'reservationStatus', 'completed') AS status,
      a.cached, a.created_at,
      a.request_metadata ->> 'model' AS model,
      a.request_metadata ->> 'provider' AS provider,
      CASE WHEN (a.request_metadata ->> 'estimatedProviderCostUsd') ~ '^[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?$'
        THEN (a.request_metadata ->> 'estimatedProviderCostUsd')::numeric ELSE 0 END AS cost
    FROM public.ai_api_usage a
    WHERE a.user_id = v_user.id AND a.created_at >= now() - interval '30 days'
  )
  SELECT
    jsonb_build_object(
      'learnerDelivered', count(*) FILTER (WHERE cls = 'learner' AND status = 'completed'),
      'learnerNotDelivered', count(*) FILTER (WHERE cls = 'learner' AND status <> 'completed'),
      'background', count(*) FILTER (WHERE cls = 'background' AND status = 'completed'),
      'providerCostUsd', round(COALESCE(sum(cost) FILTER (WHERE cls <> 'admin'), 0), 4)
    ),
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object('day', d.day::date, 'learner', COALESCE(x.learner, 0),
        'background', COALESCE(x.background, 0), 'failed', COALESCE(x.failed, 0)) ORDER BY d.day)
      FROM generate_series((now() - interval '29 days')::date, now()::date, interval '1 day') AS d(day)
      LEFT JOIN (
        SELECT created_at::date AS day,
          count(*) FILTER (WHERE cls = 'learner' AND status = 'completed') AS learner,
          count(*) FILTER (WHERE cls = 'background' AND status = 'completed') AS background,
          count(*) FILTER (WHERE cls <> 'admin' AND status <> 'completed') AS failed
        FROM recent GROUP BY 1
      ) x ON x.day = d.day::date
    ), '[]'::jsonb)
  INTO v_last30, v_daily
  FROM recent;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'createdAt', a.created_at, 'endpoint', a.endpoint,
    'class', public.ai_usage_endpoint_class(a.endpoint),
    'status', COALESCE(a.request_metadata ->> 'reservationStatus', 'completed'),
    'cached', a.cached, 'model', a.request_metadata ->> 'model',
    'costUsd', CASE WHEN (a.request_metadata ->> 'estimatedProviderCostUsd') ~ '^[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?$'
      THEN round((a.request_metadata ->> 'estimatedProviderCostUsd')::numeric, 5) END
  ) ORDER BY a.created_at DESC), '[]'::jsonb) INTO v_recent
  FROM (
    SELECT * FROM public.ai_api_usage
    WHERE user_id = v_user.id
    ORDER BY created_at DESC
    LIMIT 25
  ) a;

  SELECT min(created_at) INTO v_oldest FROM public.ai_api_usage WHERE user_id = v_user.id;

  RETURN jsonb_build_object(
    'user', jsonb_build_object(
      'id', v_user.id, 'email', v_user.email, 'fullName', v_user.full_name,
      'country', v_user.country, 'role', v_user.role, 'createdAt', v_user.created_at,
      'lastActive', v_user.last_active
    ),
    'subscription', jsonb_build_object(
      'tier', COALESCE(v_user.subscription_tier, 'free'),
      'interval', v_user.billing_interval,
      'startDate', v_user.subscription_start_date,
      'endDate', v_user.subscription_end_date,
      'cancelAtPeriodEnd', COALESCE(v_user.cancel_at_period_end, false),
      'amount', v_user.subscription_amount,
      'currency', v_user.subscription_currency,
      'hasStripeSubscription', v_user.stripe_subscription_id IS NOT NULL,
      'hasStripeCustomer', v_user.stripe_customer_id IS NOT NULL,
      'paymentFailedAt', v_user.payment_failed_at
    ),
    'facts', CASE WHEN v_facts.user_id IS NULL THEN NULL ELSE jsonb_build_object(
      'firstPaidAt', v_facts.first_paid_at,
      'firstPaymentRequestId', v_facts.first_payment_request_id,
      'lastPaidAt', v_facts.last_paid_at,
      'paidPayments', v_facts.paid_payments,
      'refundsSucceeded', v_facts.refunds_succeeded,
      'lastRefundAt', v_facts.last_refund_at
    ) END,
    'payments', v_payments,
    'refunds', v_refunds,
    'usage', jsonb_build_object(
      'last30Days', v_last30,
      'daily', v_daily,
      'recent', v_recent,
      'oldestRecordAt', v_oldest
    ),
    'retentionDays', 180
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_customer_billing_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_customer_billing_profile(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_refund_ledger(p_limit integer DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_rows jsonb;
  v_summary jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', r.id, 'kind', r.kind, 'provider', r.provider, 'method', r.method,
    'status', r.status, 'amount', r.amount, 'currency', r.currency, 'reason', r.reason,
    'note', r.note, 'providerRefundRef', r.provider_refund_ref,
    'providerPaymentRef', COALESCE(pr.transaction_id, r.provider_payment_ref),
    'paymentRequestId', r.payment_request_id, 'paymentAmount', pr.amount,
    'failureReason', r.failure_reason, 'accessEndedAt', r.access_ended_at,
    'createdAt', r.created_at, 'resolvedAt', r.resolved_at,
    'verdictAtDecision', r.eligibility_snapshot ->> 'verdict',
    'userId', r.user_id, 'email', u.email, 'fullName', u.full_name,
    'currentTier', COALESCE(u.subscription_tier, 'free'),
    'accessStillActive', r.kind = 'refund' AND r.status = 'succeeded'
      AND r.access_ended_at IS NULL AND u.subscription_tier IN ('pro', 'premium'),
    'initiatedBy', ib.email
  ) ORDER BY r.created_at DESC), '[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT * FROM public.payment_refunds
    ORDER BY created_at DESC
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500)
  ) r
  LEFT JOIN public.payment_requests pr ON pr.id = r.payment_request_id
  LEFT JOIN public.users u ON u.id = r.user_id
  LEFT JOIN public.users ib ON ib.id = r.initiated_by;

  SELECT jsonb_build_object(
    'pending', count(*) FILTER (WHERE status = 'pending' AND kind = 'refund'),
    'openChargebacks', count(*) FILTER (WHERE status = 'pending' AND kind = 'chargeback'),
    'failed', count(*) FILTER (WHERE status = 'failed'),
    'succeeded30d', count(*) FILTER (WHERE status = 'succeeded' AND created_at >= now() - interval '30 days'),
    'refundedUsd30d', COALESCE(sum(amount) FILTER (WHERE status = 'succeeded' AND currency = 'USD'
      AND created_at >= now() - interval '30 days'), 0),
    'refundedBdt30d', COALESCE(sum(amount) FILTER (WHERE status = 'succeeded' AND currency = 'BDT'
      AND created_at >= now() - interval '30 days'), 0)
  ) INTO v_summary
  FROM public.payment_refunds;

  RETURN jsonb_build_object('rows', v_rows, 'summary', v_summary, 'retentionDays', 180);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_refund_ledger(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_refund_ledger(integer) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Writing refunds
-- ---------------------------------------------------------------------------

-- bKash / Nagad today: the admin sends the money back from the merchant
-- wallet, then records the transfer reference here. Stripe refunds go through
-- the admin-billing edge function so the ledger and Stripe cannot disagree.
CREATE OR REPLACE FUNCTION public.admin_record_manual_refund(
  p_payment_request_id uuid,
  p_amount numeric,
  p_reason text,
  p_provider_refund_ref text,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_payment public.payment_requests%ROWTYPE;
  v_admin_id uuid;
  v_user_id uuid;
  v_evidence jsonb;
  v_ref text := NULLIF(btrim(COALESCE(p_provider_refund_ref, '')), '');
  v_refund public.payment_refunds%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_payment FROM public.payment_requests
  WHERE id = p_payment_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found' USING ERRCODE = 'P0002';
  END IF;
  IF lower(COALESCE(v_payment.payment_method, '')) = 'stripe' THEN
    RAISE EXCEPTION 'Stripe payments are refunded through Stripe, not recorded manually'
      USING ERRCODE = '22023';
  END IF;
  IF v_payment.status <> 'approved' THEN
    RAISE EXCEPTION 'Only an approved payment can be refunded (this one is %)', v_payment.status
      USING ERRCODE = '22023';
  END IF;
  IF p_reason IS NULL OR p_reason NOT IN (
    'unused_purchase', 'duplicate_charge', 'service_failure', 'unauthorized',
    'legal_requirement', 'goodwill', 'other'
  ) THEN
    RAISE EXCEPTION 'Choose a refund reason' USING ERRCODE = '22023';
  END IF;
  IF v_ref IS NULL OR char_length(v_ref) NOT BETWEEN 4 AND 64 THEN
    RAISE EXCEPTION 'Enter the transaction ID of the money you sent back' USING ERRCODE = '22023';
  END IF;

  v_evidence := public.get_payment_refund_evidence(v_payment.id);
  IF p_amount IS NULL OR p_amount <= 0
     OR p_amount > (v_evidence ->> 'refundableAmount')::numeric + 0.005 THEN
    RAISE EXCEPTION 'Refund amount must be between 0 and %', v_evidence ->> 'refundableAmount'
      USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_admin_id FROM public.users WHERE auth_id = auth.uid();
  SELECT id INTO v_user_id FROM public.users WHERE auth_id = v_payment.auth_id;

  INSERT INTO public.payment_refunds (
    payment_request_id, user_id, kind, provider, method, status, amount, currency,
    reason, note, provider_payment_ref, provider_refund_ref, eligibility_snapshot,
    initiated_by, resolved_at
  ) VALUES (
    v_payment.id, v_user_id, 'refund', lower(COALESCE(v_payment.payment_method, 'manual')),
    'manual_transfer', 'succeeded', round(p_amount, 2), upper(COALESCE(v_payment.currency, 'BDT')),
    p_reason, NULLIF(btrim(COALESCE(p_note, '')), ''), v_payment.transaction_id, v_ref,
    v_evidence, v_admin_id, now()
  )
  RETURNING * INTO v_refund;

  RETURN to_jsonb(v_refund);
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'That refund transaction ID is already recorded' USING ERRCODE = '23505';
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_record_manual_refund(uuid, numeric, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_record_manual_refund(uuid, numeric, text, text, text) TO authenticated;

-- Ends paid access now. Called by the admin-billing edge function after it has
-- cancelled any Stripe subscription, so a renewal cannot re-grant access.
CREATE OR REPLACE FUNCTION public.service_end_paid_access(p_user_id uuid, p_refund_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_previous text;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;

  SELECT subscription_tier INTO v_previous FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM set_config('app.bypass_column_protection', 'on', true);
  UPDATE public.users
  SET subscription_tier = 'free',
      subscription_end_date = now(),
      cancel_at_period_end = false,
      updated_at = now()
  WHERE id = p_user_id;
  PERFORM set_config('app.bypass_column_protection', 'off', true);

  IF p_refund_id IS NOT NULL THEN
    UPDATE public.payment_refunds
    SET access_ended_at = now(), updated_at = now()
    WHERE id = p_refund_id AND user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object('previousTier', v_previous, 'tier', 'free', 'endedAt', now());
END;
$function$;

REVOKE ALL ON FUNCTION public.service_end_paid_access(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.service_end_paid_access(uuid, uuid) TO service_role;

-- Pending Stripe refund created by the admin-billing edge function.
CREATE OR REPLACE FUNCTION public.service_open_provider_refund(
  p_payment_request_id uuid,
  p_amount numeric,
  p_reason text,
  p_note text,
  p_initiated_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_payment public.payment_requests%ROWTYPE;
  v_evidence jsonb;
  v_user_id uuid;
  v_refund public.payment_refunds%ROWTYPE;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_payment FROM public.payment_requests
  WHERE id = p_payment_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_payment.status <> 'approved' THEN
    RAISE EXCEPTION 'Only an approved payment can be refunded (this one is %)', v_payment.status
      USING ERRCODE = '22023';
  END IF;
  IF p_reason IS NULL OR p_reason NOT IN (
    'unused_purchase', 'duplicate_charge', 'service_failure', 'unauthorized',
    'legal_requirement', 'goodwill', 'other'
  ) THEN
    RAISE EXCEPTION 'Choose a refund reason' USING ERRCODE = '22023';
  END IF;

  v_evidence := public.get_payment_refund_evidence(v_payment.id);
  IF p_amount IS NULL OR p_amount <= 0
     OR p_amount > (v_evidence ->> 'refundableAmount')::numeric + 0.005 THEN
    RAISE EXCEPTION 'Refund amount must be between 0 and %', v_evidence ->> 'refundableAmount'
      USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_user_id FROM public.users WHERE auth_id = v_payment.auth_id;

  INSERT INTO public.payment_refunds (
    payment_request_id, user_id, kind, provider, method, status, amount, currency,
    reason, note, provider_payment_ref, eligibility_snapshot, initiated_by
  ) VALUES (
    v_payment.id, v_user_id, 'refund', lower(COALESCE(v_payment.payment_method, 'stripe')),
    'provider_api', 'pending', round(p_amount, 2), upper(COALESCE(v_payment.currency, 'USD')),
    p_reason, NULLIF(btrim(COALESCE(p_note, '')), ''), v_payment.transaction_id,
    v_evidence, p_initiated_by
  )
  RETURNING * INTO v_refund;

  RETURN to_jsonb(v_refund);
END;
$function$;

REVOKE ALL ON FUNCTION public.service_open_provider_refund(uuid, numeric, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.service_open_provider_refund(uuid, numeric, text, text, uuid) TO service_role;

-- Provider-reported state (Stripe webhooks and API responses today; a
-- bKash/Nagad callback later). Idempotent: matches the row the app opened,
-- then the provider's own reference, and only then inserts.
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

-- ---------------------------------------------------------------------------
-- 7. Six-month retention
-- ---------------------------------------------------------------------------
-- Payment, refund and AI-usage records are kept for at most six months.
-- Pending manual payments are kept until an admin acts on them: deleting one
-- would silently drop a learner's claim that they sent money.

CREATE SCHEMA IF NOT EXISTS billing_private;
REVOKE ALL ON SCHEMA billing_private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION billing_private.prune_expired_records()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_cutoff timestamptz := now() - interval '6 months';
  v_ai integer;
  v_refunds integer;
  v_billing integer;
  v_payments integer;
  v_events integer;
BEGIN
  DELETE FROM public.ai_api_usage WHERE created_at < v_cutoff;
  GET DIAGNOSTICS v_ai = ROW_COUNT;

  DELETE FROM public.payment_refunds WHERE created_at < v_cutoff AND status <> 'pending';
  GET DIAGNOSTICS v_refunds = ROW_COUNT;

  DELETE FROM public.billing_history WHERE created_at < v_cutoff;
  GET DIAGNOSTICS v_billing = ROW_COUNT;

  DELETE FROM public.payment_requests WHERE created_at < v_cutoff AND status <> 'pending';
  GET DIAGNOSTICS v_payments = ROW_COUNT;

  DELETE FROM public.stripe_events WHERE processed_at < v_cutoff;
  GET DIAGNOSTICS v_events = ROW_COUNT;

  RETURN jsonb_build_object(
    'cutoff', v_cutoff, 'aiUsage', v_ai, 'refunds', v_refunds,
    'billingHistory', v_billing, 'paymentRequests', v_payments, 'stripeEvents', v_events
  );
END;
$function$;

REVOKE ALL ON FUNCTION billing_private.prune_expired_records() FROM PUBLIC, anon, authenticated;

DO $cron$
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'six-month-record-retention';
  PERFORM cron.schedule(
    'six-month-record-retention',
    '41 3 * * *',
    'select billing_private.prune_expired_records()'
  );
END
$cron$;

-- ---------------------------------------------------------------------------
-- 8. Revenue reads only what is retained
-- ---------------------------------------------------------------------------
-- '1y' could no longer be honest once records stop at six months, so the
-- admin range becomes '6m'. '1y' is still accepted for an old cached client.
-- previousRetained tells the page when the comparison period predates
-- retention, so it shows "not retained" instead of a fake zero.

CREATE OR REPLACE FUNCTION public.get_revenue_intelligence(p_range text DEFAULT '30d'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_days integer; v_since timestamptz; v_prev timestamptz;
    v_usd numeric; v_bdt numeric; v_prev_usd numeric; v_prev_bdt numeric;
    v_transactions bigint; v_prev_transactions bigint;
    v_subscribers bigint; v_cancelling bigint; v_expiring bigint; v_failed bigint;
    v_trend jsonb; v_methods jsonb; v_recent jsonb;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
    v_days := CASE lower(coalesce(p_range,'30d'))
        WHEN '90d' THEN 90 WHEN '6m' THEN 180 WHEN '1y' THEN 365 ELSE 30 END;
    v_since := (date_trunc('day',now() AT TIME ZONE 'Asia/Dhaka')
        - make_interval(days => v_days - 1)) AT TIME ZONE 'Asia/Dhaka';
    v_prev := v_since - make_interval(days => v_days);

    WITH paid AS (
        SELECT bh.id,bh.auth_id,bh.user_id,bh.amount,upper(bh.currency) AS currency,
            bh.tier,bh.billing_interval,bh.payment_method,bh.created_at
        FROM public.billing_history bh WHERE bh.status = 'paid'
          AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.role = 'admin'
              AND (u.id = bh.user_id OR u.auth_id = bh.auth_id))
        UNION ALL
        SELECT pr.id,pr.auth_id,NULL::uuid,pr.amount,upper(pr.currency),pr.tier,
            pr.interval,pr.payment_method,pr.created_at
        FROM public.payment_requests pr WHERE pr.status = 'approved'
          AND NOT EXISTS (SELECT 1 FROM public.users u
              WHERE u.role = 'admin' AND u.auth_id = pr.auth_id)
          AND NOT EXISTS (SELECT 1 FROM public.billing_history b WHERE b.status = 'paid'
              AND b.transaction_id IS NOT NULL AND b.transaction_id = pr.transaction_id)
    )
    SELECT coalesce(sum(amount) FILTER (WHERE currency='USD' AND created_at>=v_since),0),
        coalesce(sum(amount) FILTER (WHERE currency='BDT' AND created_at>=v_since),0),
        coalesce(sum(amount) FILTER (WHERE currency='USD' AND created_at>=v_prev AND created_at<v_since),0),
        coalesce(sum(amount) FILTER (WHERE currency='BDT' AND created_at>=v_prev AND created_at<v_since),0),
        count(*) FILTER (WHERE created_at>=v_since),
        count(*) FILTER (WHERE created_at>=v_prev AND created_at<v_since)
    INTO v_usd,v_bdt,v_prev_usd,v_prev_bdt,v_transactions,v_prev_transactions FROM paid;

    SELECT count(*) FILTER (WHERE subscription_tier IN ('pro','premium')),
        count(*) FILTER (WHERE subscription_tier IN ('pro','premium')
            AND cancel_at_period_end IS TRUE AND subscription_end_date>now()),
        count(*) FILTER (WHERE subscription_tier IN ('pro','premium')
            AND subscription_end_date BETWEEN now() AND now()+interval '7 days'),
        count(*) FILTER (WHERE payment_failed_at>=now()-interval '7 days')
    INTO v_subscribers,v_cancelling,v_expiring,v_failed
    FROM public.users WHERE role IS DISTINCT FROM 'admin';

    WITH paid AS (
        SELECT bh.amount,upper(bh.currency) AS currency,bh.payment_method,bh.created_at
        FROM public.billing_history bh WHERE bh.status='paid'
          AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.role='admin'
              AND (u.id=bh.user_id OR u.auth_id=bh.auth_id))
        UNION ALL
        SELECT pr.amount,upper(pr.currency),pr.payment_method,pr.created_at
        FROM public.payment_requests pr WHERE pr.status='approved'
          AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.role='admin' AND u.auth_id=pr.auth_id)
          AND NOT EXISTS (SELECT 1 FROM public.billing_history b WHERE b.status='paid'
              AND b.transaction_id IS NOT NULL AND b.transaction_id=pr.transaction_id)
    ), spine AS (
        SELECT generate_series((v_since AT TIME ZONE 'Asia/Dhaka')::date,
            (now() AT TIME ZONE 'Asia/Dhaka')::date,interval '1 day')::date AS day
    ), daily AS (
        SELECT (created_at AT TIME ZONE 'Asia/Dhaka')::date AS day,
            sum(amount) FILTER (WHERE currency='USD') AS usd,
            sum(amount) FILTER (WHERE currency='BDT') AS bdt,count(*) AS transactions
        FROM paid WHERE created_at>=v_since GROUP BY 1
    )
    SELECT jsonb_agg(jsonb_build_object(
        'date',to_char(spine.day,CASE WHEN v_days=365 THEN 'Mon YY' ELSE 'Mon DD' END),
        'revenueUsd',coalesce(daily.usd,0),'revenueBdt',coalesce(daily.bdt,0),
        'transactions',coalesce(daily.transactions,0)) ORDER BY spine.day)
    INTO v_trend FROM spine LEFT JOIN daily USING(day);

    WITH paid AS (
        SELECT bh.amount,upper(bh.currency) AS currency,
            coalesce(nullif(bh.payment_method,''),'unknown') AS method
        FROM public.billing_history bh WHERE bh.status='paid'
          AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.role='admin'
              AND (u.id=bh.user_id OR u.auth_id=bh.auth_id))
        UNION ALL
        SELECT pr.amount,upper(pr.currency),coalesce(nullif(pr.payment_method,''),'unknown')
        FROM public.payment_requests pr WHERE pr.status='approved'
          AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.role='admin' AND u.auth_id=pr.auth_id)
          AND NOT EXISTS (SELECT 1 FROM public.billing_history b WHERE b.status='paid'
              AND b.transaction_id IS NOT NULL AND b.transaction_id=pr.transaction_id)
    )
    SELECT jsonb_agg(jsonb_build_object('method',method,'currency',currency,
        'transactions',transactions,'amount',amount) ORDER BY transactions DESC)
    INTO v_methods FROM (SELECT method,currency,count(*) AS transactions,sum(amount) AS amount
        FROM paid GROUP BY method,currency) m;

    WITH paid AS (
        SELECT bh.id,bh.auth_id,bh.user_id,bh.amount,bh.currency,bh.tier,
            bh.billing_interval,bh.payment_method,bh.created_at
        FROM public.billing_history bh WHERE bh.status='paid'
          AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.role='admin'
              AND (u.id=bh.user_id OR u.auth_id=bh.auth_id))
        UNION ALL
        SELECT pr.id,pr.auth_id,NULL::uuid,pr.amount,pr.currency,pr.tier,pr.interval,
            pr.payment_method,pr.created_at FROM public.payment_requests pr
        WHERE pr.status='approved'
          AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.role='admin' AND u.auth_id=pr.auth_id)
          AND NOT EXISTS (SELECT 1 FROM public.billing_history b WHERE b.status='paid'
              AND b.transaction_id IS NOT NULL AND b.transaction_id=pr.transaction_id)
    )
    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC) INTO v_recent FROM (
        SELECT p.id,p.amount,p.currency,p.tier,p.billing_interval,p.payment_method,p.created_at,
            coalesce(ua.full_name,ub.full_name) AS full_name,coalesce(ua.email,ub.email) AS email
        FROM paid p LEFT JOIN public.users ua ON ua.auth_id=p.auth_id
        LEFT JOIN public.users ub ON ub.id=p.user_id AND p.auth_id IS NULL
        ORDER BY p.created_at DESC LIMIT 10
    ) t;

    RETURN jsonb_build_object('windowDays',v_days,'revenueUsd',v_usd,'revenueBdt',v_bdt,
        'previousUsd',v_prev_usd,'previousBdt',v_prev_bdt,'transactions',v_transactions,
        'previousTransactions',v_prev_transactions,
        'previousRetained',v_prev >= now() - interval '6 months',
        'activeSubscribers',v_subscribers,
        'cancellingSubscribers',v_cancelling,'expiringSubscribers',v_expiring,
        'failedPayments',v_failed,'trend',coalesce(v_trend,'[]'::jsonb),
        'paymentMethods',coalesce(v_methods,'[]'::jsonb),
        'recentTransactions',coalesce(v_recent,'[]'::jsonb));
END;
$function$;

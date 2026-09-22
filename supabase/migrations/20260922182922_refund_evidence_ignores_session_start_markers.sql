-- Opening a speaking session writes a processSpeakingSession_start row to
-- ai_api_usage. It books the speaking quota with zero tokens before any AI
-- runs, so it is not an AI result. Counting it as one marked a learner who
-- opened a session and got nothing back as "used", denying a refund the
-- seven-day policy allows. Session starts now send the payment to review.

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
    -- Quota bookkeeping written when a session opens, before any AI runs.
    WHEN p_endpoint ~ '_start$' THEN 'session'
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
  v_sessions_opened integer := 0;
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
        count(*) FILTER (WHERE cls = 'session' AND delivered)::integer AS sessions_opened,
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
      t.sessions_opened, t.first_use, t.cost, p.rows
    INTO v_learner_delivered, v_learner_cached, v_learner_not_delivered, v_background,
      v_sessions_opened, v_first_use, v_cost, v_by_endpoint
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
    WHEN v_user_id IS NULL OR v_prior_refunds > 0 OR v_tests > 0 OR v_skill_lab > 0
      OR v_sessions_opened > 0 THEN 'review'
    ELSE 'eligible'
  END;

  v_reasons := to_jsonb(array_remove(ARRAY[
    CASE WHEN NOT v_is_first THEN 'An earlier paid purchase exists; the seven-day offer covers only the first purchase.' END,
    CASE WHEN now() > v_window_ends THEN 'More than seven days have passed since this payment was activated.' END,
    CASE WHEN v_learner_delivered > 0 THEN format('%s AI result(s) were delivered after purchase.', v_learner_delivered) END,
    CASE WHEN v_learner_not_delivered > 0 THEN format('%s AI request(s) failed or never finished; these do not count as use.', v_learner_not_delivered) END,
    CASE WHEN v_tests > 0 THEN format('%s practice test(s) were started after purchase — check whether they were paid-only.', v_tests) END,
    CASE WHEN v_sessions_opened > 0 AND v_learner_delivered = 0 THEN format('%s paid session(s) were opened, but no AI result was delivered.', v_sessions_opened) END,
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
      'sessionsOpened', v_sessions_opened,
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

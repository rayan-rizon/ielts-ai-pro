-- A prepaid pass expires normally; only a recurring subscription can cancel.
-- Patch the current definitions without replacing unrelated analytics or refund logic.
DO $migration$
DECLARE
  v_signature text;
  v_source text;
  v_patched text;
BEGIN
  FOREACH v_signature IN ARRAY ARRAY[
    'public.get_admin_overview_actions()',
    'public.get_revenue_intelligence(text)'
  ] LOOP
    v_source := pg_get_functiondef(v_signature::regprocedure);
    v_patched := replace(v_source, 'cancel_at_period_end IS TRUE',
      'cancel_at_period_end IS TRUE AND stripe_subscription_id IS NOT NULL');
    IF v_patched = v_source THEN
      RAISE EXCEPTION 'Cancellation predicate missing in %', v_signature;
    END IF;
    EXECUTE v_patched;
  END LOOP;

  v_source := pg_get_functiondef('public.get_admin_customer_billing_profile(uuid)'::regprocedure);
  v_patched := replace(v_source, 'COALESCE(v_user.cancel_at_period_end, false)',
    '(v_user.stripe_subscription_id IS NOT NULL AND COALESCE(v_user.cancel_at_period_end, false))');
  IF v_patched = v_source THEN
    RAISE EXCEPTION 'Billing cancellation field missing';
  END IF;
  EXECUTE v_patched;

  -- Also normalize writes from older deployed webhook/session-sync clients.
  v_source := pg_get_functiondef('public.handle_stripe_event(text,text,text,text,text,text,numeric,text,text,text,timestamptz,jsonb,boolean)'::regprocedure);
  v_patched := replace(v_source, 'cancel_at_period_end = p_cancel_at_period_end',
    'cancel_at_period_end = (p_subscription_id IS NOT NULL AND COALESCE(p_cancel_at_period_end, false))');
  IF v_patched = v_source THEN
    RAISE EXCEPTION 'Stripe cancellation assignment missing';
  END IF;
  EXECUTE v_patched;
END;
$migration$;

-- Repair only one-time three-month passes, preserving payments and expiry dates.
UPDATE public.users
SET cancel_at_period_end = false
WHERE billing_interval = 'quarterly'
  AND stripe_subscription_id IS NULL
  AND cancel_at_period_end IS TRUE;

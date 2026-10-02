-- Run against a database with an admin, an active one-time quarterly pass,
-- and an active recurring subscription scheduled to cancel. All changes roll back.
BEGIN;
DO $test$
DECLARE
  v_pass uuid;
  v_subscription uuid;
  v_before bigint;
  v_count bigint;
BEGIN
  PERFORM set_config('request.jwt.claims', jsonb_build_object(
    'sub', (SELECT auth_id FROM public.users WHERE role = 'admin' LIMIT 1),
    'role', 'authenticated')::text, true);
  SELECT id INTO STRICT v_pass FROM public.users
  WHERE billing_interval = 'quarterly' AND stripe_subscription_id IS NULL
    AND subscription_tier IN ('pro','premium') AND subscription_end_date > now()
    AND role IS DISTINCT FROM 'admin' LIMIT 1;
  SELECT id INTO STRICT v_subscription FROM public.users
  WHERE stripe_subscription_id IS NOT NULL AND cancel_at_period_end IS TRUE
    AND subscription_tier IN ('pro','premium') AND subscription_end_date > now()
    AND role IS DISTINCT FROM 'admin' LIMIT 1;
  v_before := (public.get_revenue_intelligence('30d')->>'cancellingSubscribers')::bigint;

  -- Simulate an old client incorrectly flagging a prepaid pass.
  UPDATE public.users SET cancel_at_period_end = true WHERE id = v_pass;
  IF (public.get_admin_customer_billing_profile(v_pass)->'subscription'->>'cancelAtPeriodEnd')::boolean THEN
    RAISE EXCEPTION 'One-time pass was reported as cancelling';
  END IF;
  SELECT COALESCE((a->>'count')::bigint,0) INTO v_count
  FROM jsonb_array_elements(public.get_admin_overview_actions()) a WHERE a->>'key'='cancelling';
  IF v_count IS DISTINCT FROM v_before OR
    (public.get_revenue_intelligence('30d')->>'cancellingSubscribers')::bigint <> v_before THEN
    RAISE EXCEPTION 'One-time pass changed a cancellation counter';
  END IF;

  -- A genuine recurring cancellation must still be counted and removable.
  IF NOT (public.get_admin_customer_billing_profile(v_subscription)->'subscription'->>'cancelAtPeriodEnd')::boolean THEN
    RAISE EXCEPTION 'Recurring cancellation was hidden';
  END IF;
  UPDATE public.users SET cancel_at_period_end = false WHERE id = v_subscription;
  IF (public.get_revenue_intelligence('30d')->>'cancellingSubscribers')::bigint <> v_before - 1 THEN
    RAISE EXCEPTION 'Recurring reactivation did not reduce cancellation count';
  END IF;
END;
$test$;
ROLLBACK;

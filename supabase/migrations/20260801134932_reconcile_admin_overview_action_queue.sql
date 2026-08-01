-- The dashboard action queue is operational, unlike long-lived historical
-- records. Keep its predicates aligned to actionable current-state windows.

CREATE OR REPLACE FUNCTION public.get_admin_overview_actions()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_actions jsonb := '[]'::jsonb;
    v_pending_pay bigint;
    v_stuck bigint;
    v_eval_failed bigint;
    v_cancelling bigint;
    v_expiring bigint;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT count(*) FILTER (WHERE status = 'pending')
    INTO v_pending_pay
    FROM public.payment_requests;

    SELECT count(*)
    INTO v_stuck
    FROM public.ai_api_usage
    WHERE request_metadata->>'reservationStatus' = 'reserved'
      AND created_at < now() - interval '1 hour'
      AND created_at >= now() - interval '30 days';

    -- A terminal evaluation is an incident only while it is recent. Older
    -- records belong in historical reporting, not the live action queue.
    SELECT count(*)
    INTO v_eval_failed
    FROM public.test_sessions
    WHERE is_completed
      AND evaluation_status = 'failed'
      AND COALESCE(updated_at, created_at) >= now() - interval '24 hours';

    -- A cancellation is actionable only before the paid period ends. Stripe
    -- webhook state can retain the flag after expiry, so exclude those rows.
    SELECT
        count(*) FILTER (
            WHERE cancel_at_period_end IS TRUE
              AND subscription_tier IN ('pro', 'premium')
              AND subscription_end_date > now()
        ),
        count(*) FILTER (
            WHERE subscription_tier IN ('pro', 'premium')
              AND subscription_end_date BETWEEN now() AND now() + interval '7 days'
        )
    INTO v_cancelling, v_expiring
    FROM public.users;

    IF v_pending_pay > 0 THEN
        v_actions := v_actions || jsonb_build_object(
            'key', 'pending_payments', 'label', 'Payment requests awaiting review',
            'count', v_pending_pay, 'severity', 'high',
            'detail', 'Payment evidence was submitted and is waiting for admin verification.',
            'tab', 'payments'
        );
    END IF;
    IF v_stuck > 0 THEN
        v_actions := v_actions || jsonb_build_object(
            'key', 'stuck_reservations', 'label', 'Stuck AI reservations',
            'count', v_stuck, 'severity', CASE WHEN v_stuck >= 10 THEN 'high' ELSE 'medium' END,
            'detail', 'Quota was consumed but the request never completed.', 'tab', 'ai-usage'
        );
    END IF;
    IF v_eval_failed > 0 THEN
        v_actions := v_actions || jsonb_build_object(
            'key', 'eval_failed', 'label', 'Test evaluations failed',
            'count', v_eval_failed, 'severity', 'high',
            'detail', 'A completed test has not received a score in the last 24 hours.',
            'tab', 'ai-usage'
        );
    END IF;
    IF v_cancelling > 0 THEN
        v_actions := v_actions || jsonb_build_object(
            'key', 'cancelling', 'label', 'Subscriptions set to cancel',
            'count', v_cancelling, 'severity', 'medium',
            'detail', 'Will not renew at the end of the current paid period.',
            'tab', 'users', 'subscriptionStatus', 'cancelling'
        );
    END IF;
    IF v_expiring > 0 THEN
        v_actions := v_actions || jsonb_build_object(
            'key', 'expiring', 'label', 'Subscriptions expiring within 7 days',
            'count', v_expiring, 'severity', 'low',
            'detail', 'Renewal or outreach window.', 'tab', 'users', 'subscriptionStatus', 'expiring'
        );
    END IF;

    RETURN v_actions;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_overview_actions() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_overview_actions() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_overview_actions() TO authenticated;

COMMENT ON FUNCTION public.get_admin_overview_actions() IS
'Current actionable admin queue. Excludes stale evaluation and expired cancellation state.';

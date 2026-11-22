-- Retries refresh the learner's dunning flag. Only first attempts open a sidebar alert.
create or replace function public.get_admin_sidebar_badges(p_payment_seen_through timestamptz default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_admin uuid := (select auth.uid());
  v_observed_at timestamptz := statement_timestamp();
  v_seen_at timestamptz;
begin
  if v_admin is null or not public.is_admin() then
    raise exception 'Admin required' using errcode = '42501';
  end if;
  if p_payment_seen_through > v_observed_at then
    raise exception 'Invalid payment acknowledgment timestamp' using errcode = '22023';
  end if;

  select seen_at into v_seen_at from public.admin_payment_alert_reads where admin_id = v_admin;
  if v_seen_at is null then
    -- Same first-use baseline as the legacy API; only one row per admin.
    insert into public.admin_payment_alert_reads (admin_id, seen_at, updated_at)
    values (v_admin, v_observed_at, v_observed_at) on conflict (admin_id) do nothing;
    select seen_at into v_seen_at from public.admin_payment_alert_reads where admin_id = v_admin;
  end if;
  if p_payment_seen_through is not null and p_payment_seen_through > v_seen_at then
    update public.admin_payment_alert_reads
    set seen_at = p_payment_seen_through, updated_at = v_observed_at
    where admin_id = v_admin and seen_at < p_payment_seen_through;
    -- Read the actual value: another device may have advanced it further.
    select seen_at into v_seen_at from public.admin_payment_alert_reads where admin_id = v_admin;
  end if;

  return jsonb_build_object(
    'observedAt', v_observed_at,
    'pendingCount', (select count(*) from (
      select 1 from public.payment_requests where status = 'pending'
        and created_at > v_seen_at and created_at <= v_observed_at limit 100
    ) q),
    'stripePaymentCount', (select count(*) from (
      select 1 from public.payment_requests where status = 'approved' and payment_method = 'stripe'
        and created_at > v_seen_at and created_at <= v_observed_at limit 100
    ) q),
    'stripeFailureCount', (select count(*) from (
      select 1 from public.users u
      where u.payment_failed_at > v_seen_at and u.payment_failed_at <= v_observed_at
        and exists (
          select 1 from public.stripe_events e
          where e.type = 'invoice.payment_failed'
            and e.status = 'processed'
            and e.processed_at > v_seen_at and e.processed_at <= v_observed_at
            and e.metadata->>'user_id' = u.id::text
            and e.metadata->>'attempt_count' = '1'
        )
      limit 100
    ) q),
    'featureRequestCount', (select count(*) from (
      select 1 from public.feature_requests where status = 'pending' limit 100
    ) q),
    'testReportCount', (select count(*) from (
      select 1 from public.test_issue_reports where status in ('open', 'reviewing') limit 100
    ) q),
    'institutionRequestCount', (select count(*) from (
      select 1 from public.institution_applications where status = 'pending' limit 100
    ) q)
  );
end;
$$;

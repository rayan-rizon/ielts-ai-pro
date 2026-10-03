-- Notification RLS runs inside GET transactions. Audience checks must only read
-- current access; seat activation/expiry is reconciled by the writable access RPC.
create or replace function public.current_subscription_tier()
returns text
language sql stable security definer
set search_path = ''
as $$
  with personal as (
    select public.entitled_subscription_tier(u.subscription_tier, u.subscription_end_date) as tier
    from public.users u where u.auth_id = auth.uid()
  ), institution as (
    select o.tier from public.institution_seats s
    join public.institution_orders o on o.id = s.order_id
    where s.user_auth_id = auth.uid() and s.status = 'active' and s.access_until > now()
    limit 1
  )
  select case
    when coalesce((select tier from personal), 'free') = 'free'
      then coalesce((select tier from institution), 'free')
    when (select tier from personal) = 'pro' and (select tier from institution) = 'premium'
      then 'premium'
    else coalesce((select tier from personal), 'free')
  end;
$$;

revoke all on function public.current_subscription_tier() from public, anon;
grant execute on function public.current_subscription_tier() to authenticated, service_role;

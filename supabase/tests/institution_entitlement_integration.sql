-- Linked-database rollback regression. Uses existing identities; the temporary
-- institution, seats, and personal expiry change are never committed.
begin;
do $$
declare
  free_user public.users;
  paid_user public.users;
  institution uuid := gen_random_uuid();
  allocation uuid := gen_random_uuid();
  waiting_seat uuid := gen_random_uuid();
  profile record;
  access jsonb;
  expired_at timestamptz := now() - interval '2 hours';
begin
  select * into strict free_user from public.users u
    where u.role = 'user' and u.auth_id is not null
      and public.entitled_subscription_tier(u.subscription_tier,u.subscription_end_date) = 'free'
      and not exists(select 1 from public.institution_seats s where s.user_auth_id=u.auth_id and s.status in ('active','waiting'))
    order by u.id limit 1;
  select * into strict paid_user from public.users u
    where u.role = 'user' and u.auth_id is not null
      and public.entitled_subscription_tier(u.subscription_tier,u.subscription_end_date) in ('pro','premium')
      and not exists(select 1 from public.institution_seats s where s.user_auth_id=u.auth_id and s.status in ('active','waiting'))
    order by u.id limit 1;

  insert into public.institutions(id,name,owner_auth_id,owner_email,status)
    values(institution,'Rollback entitlement regression',paid_user.auth_id,'rollback@example.invalid','active');
  insert into public.institution_orders(id,institution_id,source,status,tier,quantity,access_days,currency,reason)
    values(allocation,institution,'complimentary','complimentary','premium',2,30,'USD','Rollback regression');
  insert into public.institution_seats(order_id,institution_id,status,user_auth_id,accepted_at,activated_at,access_until)
    values(allocation,institution,'active',free_user.auth_id,now(),now(),now()+interval '30 days');
  insert into public.institution_seats(id,order_id,institution_id,status,user_auth_id,accepted_at)
    values(waiting_seat,allocation,institution,'waiting',paid_user.auth_id,now()-interval '1 hour');

  select * into strict profile from public.get_institution_learner_profile(free_user.auth_id);
  if profile.subscription_tier is distinct from 'premium' or profile.subscription_end_date is null or profile.subscription_end_date <= now() then
    raise exception 'Active institution access missing from service profile';
  end if;
  if (select subscription_tier is distinct from free_user.subscription_tier
    or subscription_end_date is distinct from free_user.subscription_end_date
    from public.users where id=free_user.id) then
    raise exception 'Institution access overwrote personal access';
  end if;
  perform set_config('request.jwt.claim.sub',free_user.auth_id::text,true);
  if public.current_subscription_tier() is distinct from 'premium' then
    raise exception 'Notification targeting lost active institution access';
  end if;
  if public.get_grammar_dashboard()#>>'{access,isPaid}' is distinct from 'true' then
    raise exception 'Grammar access lost institution entitlement';
  end if;

  access:=institution_private.access(paid_user.auth_id);
  if access->>'subscription_tier' is distinct from paid_user.subscription_tier
    or (select status from public.institution_seats where id=waiting_seat) <> 'waiting' then
    raise exception 'Waiting seat replaced active personal access';
  end if;
  perform set_config('app.bypass_column_protection','on',true);
  update public.users set subscription_end_date=expired_at where id=paid_user.id;
  select * into strict profile from public.get_institution_learner_profile(paid_user.auth_id);
  if profile.subscription_tier is distinct from 'premium' or profile.subscription_end_date is null or profile.subscription_end_date <= now()
    or (select status from public.institution_seats where id=waiting_seat) <> 'active' then
    raise exception 'Waiting institution seat did not activate after personal expiry';
  end if;
  if (select subscription_tier is distinct from paid_user.subscription_tier
    or subscription_end_date is distinct from expired_at from public.users where id=paid_user.id) then
    raise exception 'Seat activation overwrote personal subscription fields';
  end if;
end $$;
rollback;

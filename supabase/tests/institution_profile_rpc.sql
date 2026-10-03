-- Rollback-only regression for profile reads and learner-owned guide completion.
begin;
do $$
declare learner record; resolved record;
begin
  if has_function_privilege('anon','public.get_institution_learner_profile(uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.get_institution_learner_profile(uuid)','EXECUTE') then
    raise exception 'Profile RPC must remain service-only';
  end if;
  if not has_function_privilege('service_role','public.get_institution_learner_profile(uuid)','EXECUTE') then
    raise exception 'Service profile RPC unavailable';
  end if;
  for learner in
    select id,auth_id from public.users
    where auth_id is not null and (
      id in (select distinct on (role,subscription_tier) id from public.users
        where auth_id is not null order by role,subscription_tier,id)
      or auth_id in (select user_auth_id from public.institution_seats
        where status in ('active','waiting'))
    )
  loop
    select * into strict resolved from public.get_institution_learner_profile(learner.auth_id);
    if resolved.id <> learner.id or resolved.auth_id <> learner.auth_id then
      raise exception 'Profile RPC resolved another learner';
    end if;
    if resolved.subscription_tier is distinct from
      (institution_private.access(learner.auth_id)->>'subscription_tier') then
      raise exception 'Profile RPC did not preserve effective entitlement';
    end if;
    perform set_config('request.jwt.claim.sub',learner.auth_id::text,true);
    if public.current_subscription_tier() is distinct from resolved.subscription_tier then
      raise exception 'Notification audience tier differs from reconciled access';
    end if;
  end loop;
end $$;

create temporary table guide_test_identity as
select id,auth_id,row_number() over(order by id) as position
from (select id,auth_id from public.users where auth_id is not null order by id limit 2) users;
grant select on guide_test_identity to authenticated;
select set_config('request.jwt.claim.sub',(select auth_id::text from guide_test_identity where position=1),true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $$
declare own_user uuid; other_user uuid; slug text := 'rollback-regression-'||gen_random_uuid();
begin
  select id into strict own_user from guide_test_identity where position=1;
  select id into strict other_user from guide_test_identity where position=2;
  insert into public.grammar_guide_progress(user_id,guide_slug) values(own_user,slug);
  if not exists(select 1 from public.grammar_guide_progress where user_id=own_user and guide_slug=slug) then
    raise exception 'Own guide completion did not load';
  end if;
  update public.grammar_guide_progress set completed_at=now() where user_id=own_user and guide_slug=slug;
  begin
    insert into public.grammar_guide_progress(user_id,guide_slug) values(other_user,slug);
    raise exception 'Another learner guide completion could be written';
  exception when insufficient_privilege then null;
  end;
  if exists(select 1 from public.grammar_guide_progress where user_id<>own_user) then
    raise exception 'Another learner guide completion could be read';
  end if;
  delete from public.grammar_guide_progress where user_id=own_user and guide_slug=slug;
  if exists(select 1 from public.grammar_guide_progress where guide_slug=slug) then
    raise exception 'Own guide completion could not be removed';
  end if;
end $$;
rollback;

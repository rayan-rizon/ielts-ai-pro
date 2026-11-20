-- Free learners share the newest published papers in each skill. The same
-- Admin setting controls the catalogue window and the existing start quota.
create index objective_newest_free_passages_idx on public.passages
  (test_type, created_at desc nulls last, id)
  where is_active and access_tier = 'free' and test_type in ('reading', 'listening');

create function objective_private.free_test_limit(p_type text, p_currency text)
returns integer language sql stable set search_path = '' as $$
  select coalesce((
    select case when p_type = 'reading' then reading_test_limit else listening_test_limit end
    from public.tier_rate_limits
    where tier = 'free' and currency in (coalesce(upper(p_currency), 'ALL'), 'ALL')
    order by (currency = coalesce(upper(p_currency), 'ALL')) desc
    limit 1
  ), -1)
$$;
revoke all on function objective_private.free_test_limit(text, text) from public, anon, authenticated;

create function objective_private.is_recent_free_test(p_passage uuid, p_user_id uuid)
returns boolean language sql stable set search_path = '' as $$
  select exists (
    select 1
    from public.passages target
    left join public.users u on u.id = p_user_id
    where target.id = p_passage and target.is_active and target.access_tier = 'free'
      and target.test_type in ('reading', 'listening')
      and target.id in (
        select candidate.id from public.passages candidate
        where candidate.test_type = target.test_type and candidate.is_active
          and candidate.access_tier = 'free' and candidate.test_type in ('reading', 'listening')
        order by candidate.created_at desc nulls last, candidate.id
        limit nullif(objective_private.free_test_limit(target.test_type, u.subscription_currency), -1)
      )
  )
$$;
revoke all on function objective_private.is_recent_free_test(uuid, uuid) from public, anon, authenticated;

create function objective_private.can_start_passage(p_passage uuid, p_access text, p_tier text, p_user_id uuid)
returns boolean language sql stable set search_path = '' as $$
  select case p_tier
    when 'premium' then true
    when 'pro' then p_access in ('free', 'pro')
    when 'free' then p_access = 'free' and objective_private.is_recent_free_test(p_passage, p_user_id)
    else false
  end
$$;
revoke all on function objective_private.can_start_passage(uuid, text, text, uuid) from public, anon, authenticated;

-- The legacy direct-table reader must respect the same boundary even when
-- server-scoring key protection is disabled. The read-only lookup is suitable
-- for PostgREST GET requests. Owned attempts keep their historical access.
create function objective_private.can_read_objective_passage(p_passage uuid, p_access text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.users u where u.auth_id = auth.uid()
    and (
      (select public.is_admin())
      or objective_private.can_start_passage(
        p_passage, p_access, public.entitled_subscription_tier(u.subscription_tier, u.subscription_end_date), u.id
      )
      or exists (
        select 1 from public.institution_seats seat
        join public.institution_orders o on o.id = seat.order_id
        where seat.user_auth_id = u.auth_id and seat.status = 'active' and seat.access_until > now()
          and objective_private.can_start_passage(p_passage, p_access, o.tier, u.id)
      )
      or exists (
        select 1 from public.test_sessions s
        where s.user_id = u.id and s.passage_id = p_passage and s.test_type in ('reading', 'listening')
      )
    )
  )
$$;
revoke all on function objective_private.can_read_objective_passage(uuid, text) from public, anon;
grant execute on function objective_private.can_read_objective_passage(uuid, text) to authenticated;

create policy objective_starter_passage_read on public.passages as restrictive for select to authenticated
using (test_type not in ('reading', 'listening') or objective_private.can_read_objective_passage(id, access_tier));
-- Leave non-objective questions under their existing table policies.
create function objective_private.can_read_objective_questions(p_passage uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select not exists (
    select 1 from public.passages p
    where p.id = p_passage and p.test_type in ('reading', 'listening')
      and not objective_private.can_read_objective_passage(p.id, p.access_tier)
  )
$$;
revoke all on function objective_private.can_read_objective_questions(uuid) from public, anon;
grant execute on function objective_private.can_read_objective_questions(uuid) to authenticated;

create policy objective_starter_question_read on public.questions as restrictive for select to authenticated
using (objective_private.can_read_objective_questions(passage_id));

-- Match the solo start's effective plan (including institution seats).
create or replace function paired_private.entitled(actor uuid, passage uuid)
returns boolean language sql volatile security definer set search_path = '' as $$
  select exists (
    select 1 from public.institution_learner_profiles u cross join public.passages p
    where u.id = actor and p.id = passage and p.is_active
      and objective_private.can_start_passage(p.id, p.access_tier,
        case when u.role = 'admin' then 'premium' else u.subscription_tier end, u.id)
  )
$$;

-- Paired attempts are created together in one transaction. If either learner
-- has no remaining starts, fail the transaction before either one is charged.
create function objective_private.count_paired_test_start()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  learner public.users;
  quota jsonb;
begin
  select * into strict learner from public.users where id = new.user_id for update;
  quota := objective_private.test_start_status(learner, new.test_type);
  if (quota->>'limit')::integer >= 0 and (quota->>'used')::integer >= (quota->>'limit')::integer then
    raise exception 'Both learners need a remaining test start' using errcode = '42501';
  end if;
  insert into objective_private.test_start_ledger
    (session_id, user_id, request_id, test_type, counts_toward_free_limit)
  values (
    new.id, new.user_id, gen_random_uuid(), new.test_type,
    skill_lab_private.tier(new.user_id) = 'free'
  );
  return new;
end $$;
revoke all on function objective_private.count_paired_test_start() from public, anon, authenticated;
create trigger count_paired_test_start after insert on public.test_sessions
for each row when (new.paired_room_id is not null and new.test_type in ('reading', 'listening'))
execute function objective_private.count_paired_test_start();

-- Change only the eligibility predicates of the existing production RPCs.
-- Fail migration if a prior function changed rather than silently leaving an
-- alternate path open. Keep the original grants and score/resume behavior.
do $migration$
declare
  patch record;
  definition text;
  updated text;
begin
  for patch in select * from (values
    ('objective_private.test_start_status(public.users,text)',
      $old$if p_type = 'reading' then
      select reading_test_limit into v_limit
      from public.tier_rate_limits
      where tier = 'free' and currency in (coalesce(upper(p_user.subscription_currency), 'ALL'), 'ALL')
      order by case when currency = coalesce(upper(p_user.subscription_currency), 'ALL') then 0 else 1 end
      limit 1;
    else
      select listening_test_limit into v_limit
      from public.tier_rate_limits
      where tier = 'free' and currency in (coalesce(upper(p_user.subscription_currency), 'ALL'), 'ALL')
      order by case when currency = coalesce(upper(p_user.subscription_currency), 'ALL') then 0 else 1 end
      limit 1;
    end if;
    v_limit := coalesce(v_limit, -1);$old$,
      $new$v_limit := objective_private.free_test_limit(p_type, p_user.subscription_currency);$new$),
    ('public.start_objective_test(uuid,text,text,integer,uuid,jsonb,uuid)',
      $old$select * into v_user from public.institution_learner_profiles where auth_id = auth.uid() for update;$old$,
      $new$perform 1 from public.users where auth_id = auth.uid() for update;
  select * into v_user from public.institution_learner_profiles where auth_id = auth.uid();$new$),
    ('public.start_objective_test(uuid,text,text,integer,uuid,jsonb,uuid)',
      $old$if not (v_user.role = 'admin' or v_passage.access_tier = 'free' or
    (v_user.subscription_tier = 'premium' and (v_user.subscription_end_date is null or v_user.subscription_end_date > now())) or
    (v_user.subscription_tier = 'pro' and v_passage.access_tier = 'pro' and
      (v_user.subscription_end_date is null or v_user.subscription_end_date > now()))) then
    raise exception 'Test unavailable with your current plan' using errcode = '42501';
  end if;
$old$, ''),
    ('public.start_objective_test(uuid,text,text,integer,uuid,jsonb,uuid)',
      $old$v_content := jsonb_build_object($old$,
      $new$if not objective_private.can_start_passage(v_passage.id, v_passage.access_tier,
    case when v_user.role = 'admin' then 'premium'
         else public.entitled_subscription_tier(v_user.subscription_tier, v_user.subscription_end_date)
    end, v_user.id) then
    raise exception 'Test unavailable with your current plan' using errcode = '42501';
  end if;

  v_content := jsonb_build_object($new$),
    ('public.objective_test_state(uuid,text,uuid,jsonb)',
      $old$(a.session_id is null and not coalesce(t.is_completed,false) and (
  not p.is_active or not (p.access_tier='free' or tier='premium' or (tier='pro' and p.access_tier='pro'))))$old$,
      $new$(t.id is null and (
  not p.is_active or not objective_private.can_start_passage(p.id, p.access_tier, tier, u)))$new$),
    ('public.practice_library_state(uuid,text,uuid,jsonb)',
      $old$(access_tier='free' or tier='premium' or (tier='pro' and access_tier='pro'))$old$,
      $new$objective_private.can_start_passage(id, access_tier, tier, u)$new$),
    ('public.practice_library_catalogue_for_sources(uuid,uuid[],boolean)',
      $old$p.access_tier = 'free'
          or skill_lab_private.tier(u.id) = 'premium'
          or (p.access_tier = 'pro' and skill_lab_private.tier(u.id) = 'pro')$old$,
      $new$objective_private.can_start_passage(p.id, p.access_tier, skill_lab_private.tier(u.id), u.id)$new$),
    ('public.practice_library_dashboard_groups_uncached(uuid)',
      $old$p.access_tier = 'free'
        or l.tier = 'premium'
        or (p.access_tier = 'pro' and l.tier = 'pro')$old$,
      $new$objective_private.can_start_passage(p.id, p.access_tier, l.tier, l.id)$new$)
  ) as patches(signature, old_text, new_text)
  loop
    definition := pg_get_functiondef(patch.signature::regprocedure);
    updated := replace(definition, patch.old_text, patch.new_text);
    if updated = definition then
      raise exception 'Expected starter set eligibility check missing in %', patch.signature;
    end if;
    execute updated;
  end loop;
end
$migration$;

-- Compute the Free dashboard against the current limit and published papers.
-- Paid tiers keep their existing dashboard cache.
create or replace function public.practice_library_dashboard_groups(p_auth uuid)
returns jsonb language sql volatile security definer set search_path = '' as $$
  select coalesce(c.payload, public.practice_library_dashboard_groups_uncached(p_auth))
  from public.users u
  left join skill_lab_private.practice_library_dashboard_cache c
    on c.tier = skill_lab_private.tier(u.id) and c.tier <> 'free'
  where u.auth_id = p_auth
$$;

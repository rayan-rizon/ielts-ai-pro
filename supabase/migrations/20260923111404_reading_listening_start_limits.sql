-- A start is counted once, even if the learner abandons or deletes its session.
-- -1 means unlimited; 0 means no new starts. Existing settings stay unlimited.
alter table public.tier_rate_limits
  add column reading_daily_limit integer not null default -1,
  add column reading_monthly_limit integer not null default -1,
  add column listening_daily_limit integer not null default -1,
  add column listening_monthly_limit integer not null default -1;

alter table public.tier_rate_limits
  add constraint reading_daily_limit_valid check (reading_daily_limit >= -1),
  add constraint reading_monthly_limit_valid check (reading_monthly_limit >= -1),
  add constraint listening_daily_limit_valid check (listening_daily_limit >= -1),
  add constraint listening_monthly_limit_valid check (listening_monthly_limit >= -1);

create table objective_private.test_start_ledger (
  session_id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  request_id uuid not null,
  test_type text not null check (test_type in ('reading', 'listening')),
  counts_toward_free_limit boolean not null,
  started_at timestamptz not null default now(),
  unique (user_id, request_id)
);
create index test_start_ledger_usage_idx
  on objective_private.test_start_ledger (user_id, test_type, started_at);
alter table objective_private.test_start_ledger enable row level security;
revoke all on objective_private.test_start_ledger from public, anon, authenticated;

create function objective_private.test_start_status(p_user public.users, p_type text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_daily integer := -1;
  v_monthly integer := -1;
  v_daily_used integer;
  v_monthly_used integer;
  v_day_start timestamptz := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  v_month_start timestamptz := date_trunc('month', now() at time zone 'UTC') at time zone 'UTC';
begin
  if p_type not in ('reading', 'listening') then
    raise exception 'Invalid test type' using errcode = '22023';
  end if;

  -- Only an active paid subscription bypasses the Free limits.
  if p_user.role <> 'admin' and not (
    p_user.subscription_tier in ('pro', 'premium') and
    (p_user.subscription_end_date is null or p_user.subscription_end_date > now())
  ) then
    if p_type = 'reading' then
      select reading_daily_limit, reading_monthly_limit into v_daily, v_monthly
      from public.tier_rate_limits
      where tier = 'free' and currency in (coalesce(upper(p_user.subscription_currency), 'ALL'), 'ALL')
      order by case when currency = coalesce(upper(p_user.subscription_currency), 'ALL') then 0 else 1 end
      limit 1;
    else
      select listening_daily_limit, listening_monthly_limit into v_daily, v_monthly
      from public.tier_rate_limits
      where tier = 'free' and currency in (coalesce(upper(p_user.subscription_currency), 'ALL'), 'ALL')
      order by case when currency = coalesce(upper(p_user.subscription_currency), 'ALL') then 0 else 1 end
      limit 1;
    end if;
    v_daily := coalesce(v_daily, -1);
    v_monthly := coalesce(v_monthly, -1);
  end if;

  select count(*) filter (where started_at >= v_day_start), count(*)
    into v_daily_used, v_monthly_used
  from objective_private.test_start_ledger
  where user_id = p_user.id and test_type = p_type
    and counts_toward_free_limit and started_at >= v_month_start;

  return jsonb_build_object(
    'daily_limit', v_daily, 'monthly_limit', v_monthly,
    'daily_used', v_daily_used, 'monthly_used', v_monthly_used,
    'daily_reset_at', v_day_start + interval '1 day',
    'monthly_reset_at', v_month_start + interval '1 month'
  );
end $$;
revoke all on function objective_private.test_start_status(public.users, text) from public, anon, authenticated;

create function public.get_objective_test_quotas()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_user public.users;
begin
  select * into v_user from public.users where auth_id = auth.uid();
  if v_user.id is null then
    raise exception 'Sign in to view your test limits' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'reading', objective_private.test_start_status(v_user, 'reading'),
    'listening', objective_private.test_start_status(v_user, 'listening')
  );
end $$;
revoke all on function public.get_objective_test_quotas() from public, anon;
grant execute on function public.get_objective_test_quotas() to authenticated;

create function public.start_objective_test(
  p_passage_id uuid,
  p_test_type text,
  p_test_mode text,
  p_duration_seconds integer,
  p_learning_path_activity_id uuid default null,
  p_audio_durations jsonb default '[]'::jsonb,
  p_request_id uuid default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user public.users;
  v_passage public.passages;
  v_session public.test_sessions;
  v_status jsonb;
  v_content jsonb;
  v_request_id uuid := coalesce(p_request_id, gen_random_uuid());
begin
  if p_test_type not in ('reading', 'listening') or p_test_mode not in ('practice', 'exam')
     or p_duration_seconds not between 60 and 7200 then
    raise exception 'Invalid test start' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_audio_durations, '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_audio_durations, '[]'::jsonb)) > 8 then
    raise exception 'Invalid audio durations' using errcode = '22023';
  end if;

  -- Lock the profile so simultaneous starts for this learner cannot both pass.
  select * into v_user from public.users where auth_id = auth.uid() for update;
  if v_user.id is null then
    raise exception 'Sign in to start this test' using errcode = '42501';
  end if;
  if exists (
    select 1 from objective_private.test_start_ledger
    where user_id = v_user.id and request_id = v_request_id
  ) then
    select s.* into v_session
    from objective_private.test_start_ledger l
    join public.test_sessions s on s.id = l.session_id
    where l.user_id = v_user.id and l.request_id = v_request_id;
    if v_session.id is null then
      return jsonb_build_object('error', 'attempt_unavailable');
    end if;
    return jsonb_build_object('session', to_jsonb(v_session));
  end if;
  select * into v_passage from public.passages where id = p_passage_id;
  if v_passage.id is null or not v_passage.is_active or lower(v_passage.test_type) <> p_test_type then
    raise exception 'Test unavailable' using errcode = '42501';
  end if;
  if not (v_user.role = 'admin' or v_passage.access_tier = 'free' or
    (v_user.subscription_tier = 'premium' and (v_user.subscription_end_date is null or v_user.subscription_end_date > now())) or
    (v_user.subscription_tier = 'pro' and v_passage.access_tier = 'pro' and
      (v_user.subscription_end_date is null or v_user.subscription_end_date > now()))) then
    raise exception 'Test unavailable with your current plan' using errcode = '42501';
  end if;
  if p_learning_path_activity_id is not null and not exists (
    select 1 from public.learning_path_activities
    where id = p_learning_path_activity_id and user_id = v_user.id
  ) then
    raise exception 'Invalid learning activity' using errcode = '42501';
  end if;

  v_status := objective_private.test_start_status(v_user, p_test_type);
  if ((v_status->>'daily_limit')::integer >= 0 and
      (v_status->>'daily_used')::integer >= (v_status->>'daily_limit')::integer) or
     ((v_status->>'monthly_limit')::integer >= 0 and
      (v_status->>'monthly_used')::integer >= (v_status->>'monthly_limit')::integer) then
    return jsonb_build_object('error', 'quota_exceeded', 'quota', v_status);
  end if;

  v_content := jsonb_build_object(
    'passage_id', p_passage_id, 'test_mode', p_test_mode,
    'duration_seconds', p_duration_seconds
  );
  if p_test_type = 'listening' then
    v_content := v_content || jsonb_build_object(
      'title', v_passage.title, 'audio_durations', coalesce(p_audio_durations, '[]'::jsonb),
      'review_seconds', case when p_test_mode = 'exam' then 120 else 0 end
    );
  end if;

  insert into public.test_sessions (
    user_id, test_type, test_mode, is_completed, duration_minutes,
    passage_id, learning_path_activity_id, content_data
  ) values (
    v_user.id, p_test_type, case when p_test_mode = 'exam' then 'mock' else 'practice' end,
    false, ceil(p_duration_seconds / 60.0)::integer, p_passage_id,
    p_learning_path_activity_id, v_content
  ) returning * into v_session;
  insert into objective_private.test_start_ledger
    (session_id, user_id, request_id, test_type, counts_toward_free_limit)
  values (
    v_session.id, v_user.id, v_request_id, p_test_type,
    not (v_user.role = 'admin' or
      (v_user.subscription_tier in ('pro', 'premium') and
       (v_user.subscription_end_date is null or v_user.subscription_end_date > now())))
  );

  return jsonb_build_object('session', to_jsonb(v_session));
end $$;
revoke all on function public.start_objective_test(uuid, text, text, integer, uuid, jsonb, uuid) from public, anon;
grant execute on function public.start_objective_test(uuid, text, text, integer, uuid, jsonb, uuid) to authenticated;

-- Existing broad owner policies must not permit a direct Reading/Listening insert.
create policy objective_solo_start_insert on public.test_sessions
  as restrictive for insert to authenticated
  with check (test_type not in ('reading', 'listening'));

-- Prevent changing a different session into a Reading/Listening attempt or
-- editing identifying fields on a counted attempt through the Data API.
create function objective_private.protect_start_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_setting('role', true) in ('anon', 'authenticated') and
     (old.test_type in ('reading', 'listening') or new.test_type in ('reading', 'listening')) and
     (new.user_id is distinct from old.user_id or
      new.passage_id is distinct from old.passage_id or
      new.test_type is distinct from old.test_type or
      new.created_at is distinct from old.created_at or
      new.paired_room_id is distinct from old.paired_room_id) then
    raise exception 'Test start details cannot be changed' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function objective_private.protect_start_identity() from public, anon, authenticated;
create trigger protect_objective_start_identity before update on public.test_sessions
  for each row execute function objective_private.protect_start_identity();

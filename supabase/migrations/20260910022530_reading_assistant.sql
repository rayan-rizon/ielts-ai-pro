-- Contextual Reading assistant. All state is private and reachable only through
-- authenticated Edge Function calls using the service role.
set lock_timeout = '2s';
set statement_timeout = '30s';

create schema if not exists reading_assistant_private;
revoke all on schema reading_assistant_private from public, anon, authenticated;

create table reading_assistant_private.settings (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  daily_budget numeric not null default 10 check (daily_budget between 0 and 1000),
  free_daily_assists integer not null default 5 check (free_daily_assists between 0 and 100),
  fair_use_daily integer not null default 500 check (fair_use_daily between 1 and 5000),
  burst_per_minute integer not null default 20 check (burst_per_minute between 1 and 120),
  concurrent_generations integer not null default 2 check (concurrent_generations between 1 and 10)
);
insert into reading_assistant_private.settings default values on conflict (id) do nothing;

create table reading_assistant_private.operations (
  id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  action text not null check (action in ('dictionary', 'simplify', 'translate', 'breakdown')),
  cache_key text not null,
  state text not null default 'pending' check (state in ('pending', 'complete', 'failed')),
  result jsonb,
  cached boolean not null default false,
  reserved_cost numeric not null default 0.002,
  actual_cost numeric,
  tokens integer,
  model text,
  latency_ms integer,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  expires_at timestamptz not null default now() + interval '45 seconds'
);
create index reading_assistant_operations_user_created
  on reading_assistant_private.operations (user_id, created_at desc);
create index reading_assistant_operations_budget
  on reading_assistant_private.operations (created_at, state);

create table reading_assistant_private.unlocks (
  user_id uuid not null references public.users(id) on delete cascade,
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  cache_key text not null,
  action text not null check (action in ('dictionary', 'simplify', 'translate', 'breakdown')),
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, cache_key)
);
create index reading_assistant_unlocks_user_created
  on reading_assistant_private.unlocks (user_id, created_at desc);

alter table reading_assistant_private.settings enable row level security;
alter table reading_assistant_private.operations enable row level security;
alter table reading_assistant_private.unlocks enable row level security;
revoke all on all tables in schema reading_assistant_private from public, anon, authenticated;

create or replace function public.reading_assistant_status(p_auth uuid, p_session uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  u public.users;
  s public.test_sessions;
  cfg reading_assistant_private.settings;
  tier text;
  used integer;
begin
  select * into strict u from public.users where auth_id = p_auth;
  select * into strict s from public.test_sessions where id = p_session and user_id = u.id;
  select * into strict cfg from reading_assistant_private.settings where id;
  if s.test_type <> 'reading' or s.paired_room_id is not null then
    raise exception 'This Reading session is unavailable' using errcode = '42501';
  end if;
  if not s.is_completed and s.test_mode = 'mock' then
    raise exception 'Reading help is hidden during Exam mode' using errcode = '42501';
  end if;
  tier := case
    when u.role = 'admin' then 'premium'
    when u.subscription_end_date is not null and u.subscription_end_date <= now() then 'free'
    when u.subscription_tier in ('pro', 'premium') then u.subscription_tier
    else 'free'
  end;
  select count(*) into used
  from reading_assistant_private.unlocks x
  where x.user_id = u.id
    and x.action in ('translate', 'breakdown')
    and x.created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  return jsonb_build_object(
    'enabled', cfg.enabled,
    'tier', tier,
    'remainingDailyQuota', case when tier = 'free' then greatest(0, cfg.free_daily_assists - used) else null end,
    'quotaResetsAt', date_trunc('day', now() at time zone 'UTC') at time zone 'UTC' + interval '1 day'
  );
end
$$;

create or replace function public.reading_assistant_reserve(
  p_auth uuid,
  p_session uuid,
  p_id uuid,
  p_action text,
  p_cache_key text,
  p_cached_result jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  u public.users;
  s public.test_sessions;
  cfg reading_assistant_private.settings;
  op reading_assistant_private.operations;
  unlocked reading_assistant_private.unlocks;
  tier text;
  used integer;
  pending_trial integer;
  daily_count integer;
  spend numeric;
  remaining integer;
begin
  if p_action not in ('dictionary', 'simplify', 'translate', 'breakdown')
     or length(p_cache_key) not between 32 and 160 then
    raise exception 'Invalid Reading assistance request';
  end if;
  select * into strict u from public.users where auth_id = p_auth;
  perform pg_advisory_xact_lock(hashtextextended(u.id::text, 811));
  perform pg_advisory_xact_lock(811812);
  select * into strict s from public.test_sessions where id = p_session and user_id = u.id;
  select * into strict cfg from reading_assistant_private.settings where id;
  if not cfg.enabled then raise exception 'Reading help is temporarily unavailable'; end if;
  if s.test_type <> 'reading' or s.paired_room_id is not null then
    raise exception 'This Reading session is unavailable' using errcode = '42501';
  end if;
  if not s.is_completed and s.test_mode = 'mock' then
    raise exception 'Reading help is hidden during Exam mode' using errcode = '42501';
  end if;
  tier := case
    when u.role = 'admin' then 'premium'
    when u.subscription_end_date is not null and u.subscription_end_date <= now() then 'free'
    when u.subscription_tier in ('pro', 'premium') then u.subscription_tier
    else 'free'
  end;

  select * into op from reading_assistant_private.operations where id = p_id;
  if found then
    if op.user_id <> u.id or op.session_id <> p_session or op.action <> p_action or op.cache_key <> p_cache_key then
      raise exception 'Request identifier is already in use';
    end if;
    if op.state = 'pending' and op.expires_at <= now() then
      update reading_assistant_private.operations
      set state = 'failed', finished_at = now() where id = p_id;
      return jsonb_build_object('state', 'failed');
    end if;
    return jsonb_build_object('state', op.state, 'result', op.result, 'cached', op.cached,
      'replayed', true);
  end if;

  select * into unlocked from reading_assistant_private.unlocks
  where user_id = u.id and cache_key = p_cache_key;
  if found then
    return jsonb_build_object('state', 'complete', 'result', unlocked.result, 'cached', true,
      'reopened', true);
  end if;

  update reading_assistant_private.operations
  set state = 'failed', finished_at = now()
  where user_id = u.id and state = 'pending' and expires_at <= now();

  if exists(select 1 from reading_assistant_private.operations
      where user_id = u.id and cache_key = p_cache_key and state = 'pending') then
    raise exception 'This Reading request is already being processed';
  end if;

  if (select count(*) from reading_assistant_private.operations
      where user_id = u.id and state = 'pending') >= cfg.concurrent_generations then
    raise exception 'Two Reading requests are already being processed';
  end if;
  if (select count(*) from reading_assistant_private.operations
      where user_id = u.id and created_at > now() - interval '1 minute') >= cfg.burst_per_minute then
    raise exception 'Please wait a minute before requesting more Reading help';
  end if;
  select count(*) into daily_count from reading_assistant_private.unlocks
  where user_id = u.id and action = p_action
    and created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  if daily_count >= cfg.fair_use_daily then
    raise exception 'Reading help will be available again tomorrow';
  end if;

  select count(*) into used from reading_assistant_private.unlocks
  where user_id = u.id and action in ('translate', 'breakdown')
    and created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  select count(*) into pending_trial from reading_assistant_private.operations
  where user_id = u.id and state = 'pending' and action in ('translate', 'breakdown')
    and created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  if tier = 'free' and p_action in ('translate', 'breakdown')
     and used + pending_trial >= cfg.free_daily_assists then
    raise exception 'You have used today''s five free Translate and Breakdown results';
  end if;

  remaining := case when tier = 'free' then
    greatest(0, cfg.free_daily_assists - used - pending_trial -
      case when p_action in ('translate', 'breakdown') then 1 else 0 end)
    else null end;

  if p_cached_result is not null then
    insert into reading_assistant_private.unlocks(user_id, session_id, cache_key, action, result)
    values(u.id, p_session, p_cache_key, p_action, p_cached_result)
    on conflict (user_id, cache_key) do nothing;
    insert into reading_assistant_private.operations
      (id, user_id, session_id, action, cache_key, state, result, cached, reserved_cost,
       actual_cost, finished_at)
    values(p_id, u.id, p_session, p_action, p_cache_key, 'complete', p_cached_result, true, 0,
      0, now());
    return jsonb_build_object('state', 'complete', 'result', p_cached_result, 'cached', true,
      'reopened', false,
      'remainingDailyQuota', remaining,
      'quotaResetsAt', date_trunc('day', now() at time zone 'UTC') at time zone 'UTC' + interval '1 day');
  end if;

  select coalesce(sum(case when state = 'pending' then reserved_cost else coalesce(actual_cost, reserved_cost) end), 0)
  into spend from reading_assistant_private.operations
  where created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC'
    and state in ('pending', 'complete');
  if spend + 0.002 > cfg.daily_budget then
    raise exception 'New Reading explanations are taking a break today';
  end if;

  insert into reading_assistant_private.operations(id, user_id, session_id, action, cache_key)
  values(p_id, u.id, p_session, p_action, p_cache_key);
  return jsonb_build_object('state', 'reserved', 'user_id', u.id,
    'budgetWarning', spend + 0.002 >= cfg.daily_budget * 0.8,
    'remainingDailyQuota', remaining,
    'quotaResetsAt', date_trunc('day', now() at time zone 'UTC') at time zone 'UTC' + interval '1 day');
end
$$;

create or replace function public.reading_assistant_finish(
  p_id uuid,
  p_result jsonb,
  p_cost numeric,
  p_tokens integer,
  p_model text,
  p_latency integer,
  p_ok boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare op reading_assistant_private.operations;
begin
  select * into op from reading_assistant_private.operations where id = p_id for update;
  if not found or op.state <> 'pending' then return; end if;
  if op.expires_at <= now() then
    update reading_assistant_private.operations set state = 'failed', finished_at = now() where id = p_id;
    return;
  end if;
  if p_ok and p_result is not null then
    insert into reading_assistant_private.unlocks(user_id, session_id, cache_key, action, result)
    values(op.user_id, op.session_id, op.cache_key, op.action, p_result)
    on conflict (user_id, cache_key) do nothing;
  end if;
  update reading_assistant_private.operations set
    state = case when p_ok and p_result is not null then 'complete' else 'failed' end,
    result = case when p_ok then p_result else null end,
    actual_cost = greatest(0, coalesce(p_cost, 0)),
    tokens = greatest(0, coalesce(p_tokens, 0)),
    model = left(coalesce(p_model, ''), 120),
    latency_ms = greatest(0, coalesce(p_latency, 0)),
    finished_at = now()
  where id = p_id;
end
$$;

revoke all on function public.reading_assistant_status(uuid, uuid) from public, anon, authenticated;
revoke all on function public.reading_assistant_reserve(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.reading_assistant_finish(uuid, jsonb, numeric, integer, text, integer, boolean) from public, anon, authenticated;
grant execute on function public.reading_assistant_status(uuid, uuid) to service_role;
grant execute on function public.reading_assistant_reserve(uuid, uuid, uuid, text, text, jsonb) to service_role;
grant execute on function public.reading_assistant_finish(uuid, jsonb, numeric, integer, text, integer, boolean) to service_role;

reset lock_timeout;
reset statement_timeout;

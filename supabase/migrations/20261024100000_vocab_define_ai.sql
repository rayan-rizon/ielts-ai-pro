-- AI vocabulary cards ("vocab-define").
--
-- Quick Add used to ask two free public dictionaries for the first dictionary
-- sense of a word and MyMemory for a machine translation of that sentence. This
-- route replaces that with one AI answer per word -- plain-English meaning,
-- Bangla (or another learner language), IPA, level, examples, collocations --
-- cached once for every learner.
--
-- Everything below the table definitions exists to keep that affordable and fair:
-- a per-minute burst limit, a daily cap on *fresh generations* per tier (a cache
-- hit is free for us, so it does not spend the learner's allowance), a separate
-- anti-scraping cap on cache hits, and a shared daily provider budget that stops
-- new generation without stopping cached answers.
set lock_timeout = '2s';
set statement_timeout = '30s';

-- ---------------------------------------------------------------------------
-- What a saved word can now carry.
-- ---------------------------------------------------------------------------
alter table public.vocabulary_items
  add column if not exists level text,
  add column if not exists translations jsonb not null default '{}'::jsonb,
  add column if not exists details jsonb not null default '{}'::jsonb,
  add column if not exists enriched_at timestamptz;

do $guard$
begin
  -- These columns are writable by the owner through the API, so they are bounded
  -- here rather than trusted to the client.
  if not exists (select 1 from pg_constraint where conname = 'vocabulary_items_translations_shape') then
    alter table public.vocabulary_items
      add constraint vocabulary_items_translations_shape
      check (jsonb_typeof(translations) = 'object' and octet_length(translations::text) <= 6000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'vocabulary_items_details_shape') then
    alter table public.vocabulary_items
      add constraint vocabulary_items_details_shape
      check (jsonb_typeof(details) = 'object' and octet_length(details::text) <= 6000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'vocabulary_items_level_shape') then
    alter table public.vocabulary_items
      add constraint vocabulary_items_level_shape
      check (level is null or level in ('A2', 'B1', 'B2', 'C1', 'C2'));
  end if;
end
$guard$;

-- ---------------------------------------------------------------------------
-- Private state. Reachable only through the Edge Function's service role.
-- ---------------------------------------------------------------------------
create schema if not exists vocab_assistant_private;
revoke all on schema vocab_assistant_private from public, anon, authenticated;

create table if not exists vocab_assistant_private.settings (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  -- Shared by every learner. Hitting it pauses *new* generation only.
  daily_budget numeric not null default 3 check (daily_budget between 0 and 1000),
  -- Fresh AI generations per learner per UTC day. Cached answers do not count.
  free_daily_generations integer not null default 25 check (free_daily_generations between 0 and 1000),
  paid_daily_generations integer not null default 150 check (paid_daily_generations between 0 and 5000),
  -- Cached answers are free to serve, but an unbounded read loop is a scraper.
  cached_daily integer not null default 400 check (cached_daily between 1 and 10000),
  burst_per_minute integer not null default 12 check (burst_per_minute between 1 and 120),
  concurrent_generations integer not null default 2 check (concurrent_generations between 1 and 10),
  -- Held against the budget while a generation is in flight.
  reserved_cost numeric not null default 0.0012 check (reserved_cost between 0 and 1)
);
insert into vocab_assistant_private.settings default values on conflict (id) do nothing;

create table if not exists vocab_assistant_private.operations (
  id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  cache_key text not null,
  state text not null default 'pending' check (state in ('pending', 'complete', 'failed')),
  result jsonb,
  cached boolean not null default false,
  reserved_cost numeric not null default 0.0012,
  actual_cost numeric,
  tokens integer,
  model text,
  latency_ms integer,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  expires_at timestamptz not null default now() + interval '60 seconds'
);
create index if not exists vocab_assistant_operations_user_created
  on vocab_assistant_private.operations (user_id, created_at desc);
create index if not exists vocab_assistant_operations_budget
  on vocab_assistant_private.operations (created_at, state);

create table if not exists vocab_assistant_private.budget_events (
  day date not null,
  level text not null check (level in ('warning', 'exhausted')),
  spend numeric not null,
  budget numeric not null,
  created_at timestamptz not null default now(),
  primary key (day, level)
);

alter table vocab_assistant_private.settings enable row level security;
alter table vocab_assistant_private.operations enable row level security;
alter table vocab_assistant_private.budget_events enable row level security;
revoke all on all tables in schema vocab_assistant_private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admission. Returns a state instead of raising for the expected refusals so the
-- Edge Function can tell the learner exactly why, and when to come back.
--   complete          a cached answer (free) or an idempotent replay
--   reserved          go ahead and generate
--   rate_limited      type = burst | busy | quota, with retryAfterSeconds
--   budget_exhausted  the shared daily provider budget is spent
-- ---------------------------------------------------------------------------
create or replace function public.vocab_define_reserve(
  p_auth uuid,
  p_id uuid,
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
  cfg vocab_assistant_private.settings;
  op vocab_assistant_private.operations;
  tier text;
  day_start timestamptz;
  next_day timestamptz;
  burst_count integer;
  burst_oldest timestamptz;
  fresh_today integer;
  fresh_cap integer;
  cached_today integer;
  spend numeric;
begin
  if length(p_cache_key) not between 32 and 160 then
    raise exception 'Invalid vocabulary request';
  end if;
  select * into strict u from public.users where auth_id = p_auth;
  -- One reservation per learner at a time, so two tabs cannot both slip past the
  -- last remaining generation.
  perform pg_advisory_xact_lock(hashtextextended(u.id::text, 821));
  select * into strict cfg from vocab_assistant_private.settings where id;
  if not cfg.enabled then
    raise exception 'Vocabulary help is temporarily unavailable';
  end if;

  tier := case
    when u.role = 'admin' then 'premium'
    when u.subscription_end_date is not null and u.subscription_end_date <= now() then 'free'
    when u.subscription_tier in ('pro', 'premium') then u.subscription_tier
    else 'free'
  end;
  day_start := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  next_day := day_start + interval '1 day';
  fresh_cap := case when tier = 'free' then cfg.free_daily_generations
                    else cfg.paid_daily_generations end;

  -- A retry of the same request id replays instead of being charged twice.
  select * into op from vocab_assistant_private.operations where id = p_id;
  if found then
    if op.user_id <> u.id or op.cache_key <> p_cache_key then
      raise exception 'Request identifier is already in use';
    end if;
    if op.state = 'pending' and op.expires_at <= now() then
      update vocab_assistant_private.operations
      set state = 'failed', finished_at = now() where id = p_id;
      return jsonb_build_object('state', 'failed');
    end if;
    return jsonb_build_object('state', op.state, 'result', op.result, 'cached', op.cached,
      'replayed', true);
  end if;

  update vocab_assistant_private.operations
  set state = 'failed', finished_at = now()
  where user_id = u.id and state = 'pending' and expires_at <= now();

  -- Operations are only needed for the limits above; keep the table small.
  delete from vocab_assistant_private.operations
  where user_id = u.id and created_at < now() - interval '30 days';

  -- 1. Per-minute burst, counting cached answers too: typing-driven lookups are
  --    what makes this route chatty.
  select count(*), min(created_at) into burst_count, burst_oldest
  from vocab_assistant_private.operations
  where user_id = u.id and created_at > now() - interval '1 minute';
  if burst_count >= cfg.burst_per_minute then
    return jsonb_build_object('state', 'rate_limited', 'type', 'burst',
      'retryAfterSeconds',
      greatest(1, ceil(extract(epoch from (burst_oldest + interval '1 minute' - now())))::integer));
  end if;

  -- 2. Concurrent generations.
  if exists(select 1 from vocab_assistant_private.operations
      where user_id = u.id and cache_key = p_cache_key and state = 'pending')
     or (select count(*) from vocab_assistant_private.operations
         where user_id = u.id and state = 'pending') >= cfg.concurrent_generations then
    return jsonb_build_object('state', 'rate_limited', 'type', 'busy', 'retryAfterSeconds', 3);
  end if;

  select count(*) into fresh_today from vocab_assistant_private.operations
  where user_id = u.id and not cached and state in ('pending', 'complete')
    and created_at >= day_start;

  -- 3. A cached answer costs us nothing, so it is served without touching the
  --    learner's generation allowance or the provider budget.
  if p_cached_result is not null then
    select count(*) into cached_today from vocab_assistant_private.operations
    where user_id = u.id and cached and created_at >= day_start;
    if cached_today >= cfg.cached_daily then
      return jsonb_build_object('state', 'rate_limited', 'type', 'quota',
        'retryAfterSeconds', ceil(extract(epoch from (next_day - now())))::integer,
        'quotaResetsAt', next_day);
    end if;
    insert into vocab_assistant_private.operations
      (id, user_id, cache_key, state, result, cached, reserved_cost, actual_cost, finished_at)
    values (p_id, u.id, p_cache_key, 'complete', p_cached_result, true, 0, 0, now());
    return jsonb_build_object('state', 'complete', 'result', p_cached_result, 'cached', true,
      'remainingDailyQuota', greatest(0, fresh_cap - fresh_today),
      'quotaResetsAt', next_day);
  end if;

  -- 4. Fresh generations per tier. Failed attempts are not the learner's fault
  --    and are not counted.
  if fresh_today >= fresh_cap then
    return jsonb_build_object('state', 'rate_limited', 'type', 'quota',
      'retryAfterSeconds', ceil(extract(epoch from (next_day - now())))::integer,
      'quotaResetsAt', next_day, 'remainingDailyQuota', 0);
  end if;

  -- 5. The shared provider budget. One global lock so two learners cannot both
  --    read the same remaining headroom. A rejected provider answer is still
  --    billed, so failures count at their recorded cost.
  perform pg_advisory_xact_lock(821822);
  select coalesce(sum(case
    when state = 'pending' then reserved_cost
    when state = 'failed' then coalesce(actual_cost, 0)
    else coalesce(actual_cost, reserved_cost)
  end), 0)
  into spend from vocab_assistant_private.operations
  where created_at >= day_start and state in ('pending', 'complete', 'failed');

  if spend + cfg.reserved_cost > cfg.daily_budget then
    -- Returned, not raised: raising would roll this insert back and the admin
    -- would never learn that generation stopped.
    insert into vocab_assistant_private.budget_events(day, level, spend, budget)
    values (day_start::date, 'exhausted', spend, cfg.daily_budget)
    on conflict (day, level) do nothing;
    return jsonb_build_object('state', 'budget_exhausted');
  end if;
  if spend + cfg.reserved_cost >= cfg.daily_budget * 0.8 then
    insert into vocab_assistant_private.budget_events(day, level, spend, budget)
    values (day_start::date, 'warning', spend, cfg.daily_budget)
    on conflict (day, level) do nothing;
  end if;

  insert into vocab_assistant_private.operations(id, user_id, cache_key, reserved_cost)
  values (p_id, u.id, p_cache_key, cfg.reserved_cost);
  return jsonb_build_object('state', 'reserved', 'userId', u.id,
    'budgetWarning', spend + cfg.reserved_cost >= cfg.daily_budget * 0.8,
    'remainingDailyQuota', greatest(0, fresh_cap - fresh_today - 1),
    'quotaResetsAt', next_day);
end
$$;

create or replace function public.vocab_define_finish(
  p_id uuid,
  p_result jsonb,
  p_cost numeric,
  p_tokens integer,
  p_model text,
  p_latency integer,
  p_ok boolean
)
returns void
language sql
security definer
set search_path = ''
as $$
  update vocab_assistant_private.operations
  set state = case when p_ok then 'complete' else 'failed' end,
      result = case when p_ok then p_result else null end,
      actual_cost = greatest(coalesce(p_cost, 0), 0),
      tokens = p_tokens,
      model = nullif(p_model, ''),
      latency_ms = p_latency,
      finished_at = now()
  where id = p_id and state = 'pending';
$$;

revoke all on function public.vocab_define_reserve(uuid, uuid, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.vocab_define_finish(uuid, jsonb, numeric, integer, text, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.vocab_define_reserve(uuid, uuid, text, jsonb) to service_role;
grant execute on function public.vocab_define_finish(uuid, jsonb, numeric, integer, text, integer, boolean)
  to service_role;

reset lock_timeout;
reset statement_timeout;

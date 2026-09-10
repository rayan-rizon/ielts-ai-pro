-- Reading assistant: three corrections to the launch behaviour.
--
-- 1. Translate and Breakdown each get their own free daily allowance. They used
--    to share one pool of five, so a learner who translated five sentences lost
--    Breakdown for the rest of the day even though they had never opened it.
-- 2. The global provider budget drops from $10/day to $2/day.
-- 3. Hitting that budget is now recorded, so it reaches an admin through the
--    existing platform health card instead of only a server log line. The
--    budget stop therefore returns a state instead of raising: an exception
--    would roll back the very row that records it.
set lock_timeout = '2s';
set statement_timeout = '30s';

alter table reading_assistant_private.settings
  alter column daily_budget set default 2;
update reading_assistant_private.settings set daily_budget = 2 where id;

-- One row per UTC day per level. `warning` fires at 80% of the budget,
-- `exhausted` the first time a request is refused for want of budget.
create table if not exists reading_assistant_private.budget_events (
  day date not null,
  level text not null check (level in ('warning', 'exhausted')),
  spend numeric not null,
  budget numeric not null,
  created_at timestamptz not null default now(),
  primary key (day, level)
);
alter table reading_assistant_private.budget_events enable row level security;
revoke all on reading_assistant_private.budget_events from public, anon, authenticated;

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
  day_start timestamptz;
  used_translate integer;
  used_breakdown integer;
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
  day_start := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';

  select
    count(*) filter (where x.action = 'translate'),
    count(*) filter (where x.action = 'breakdown')
  into used_translate, used_breakdown
  from reading_assistant_private.unlocks x
  where x.user_id = u.id and x.created_at >= day_start;

  return jsonb_build_object(
    'enabled', cfg.enabled,
    'tier', tier,
    'freeDailyAssists', cfg.free_daily_assists,
    -- Per action, never a shared pool.
    'remainingByAction', case when tier = 'free' then jsonb_build_object(
      'translate', greatest(0, cfg.free_daily_assists - used_translate),
      'breakdown', greatest(0, cfg.free_daily_assists - used_breakdown)
    ) else null end,
    'quotaResetsAt', day_start + interval '1 day'
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
  day_start timestamptz;
  used_translate integer;
  used_breakdown integer;
  pending_translate integer;
  pending_breakdown integer;
  left_translate integer;
  left_breakdown integer;
  remaining_by_action jsonb;
  remaining integer;
  daily_count integer;
  spend numeric;
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
  day_start := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';

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
  where user_id = u.id and action = p_action and created_at >= day_start;
  if daily_count >= cfg.fair_use_daily then
    raise exception 'Reading help will be available again tomorrow';
  end if;

  -- Free allowances are counted per action: Translate spending does not consume
  -- Breakdown, and vice versa. In-flight requests hold their own slot so two
  -- parallel tabs cannot both slip past the last remaining use.
  select
    count(*) filter (where action = 'translate'),
    count(*) filter (where action = 'breakdown')
  into used_translate, used_breakdown
  from reading_assistant_private.unlocks
  where user_id = u.id and created_at >= day_start;

  select
    count(*) filter (where action = 'translate'),
    count(*) filter (where action = 'breakdown')
  into pending_translate, pending_breakdown
  from reading_assistant_private.operations
  where user_id = u.id and state = 'pending' and created_at >= day_start;

  left_translate := greatest(0, cfg.free_daily_assists - used_translate - pending_translate);
  left_breakdown := greatest(0, cfg.free_daily_assists - used_breakdown - pending_breakdown);

  if tier = 'free' and p_action = 'translate' and left_translate <= 0 then
    raise exception 'You have used today''s % free Translate results', cfg.free_daily_assists;
  end if;
  if tier = 'free' and p_action = 'breakdown' and left_breakdown <= 0 then
    raise exception 'You have used today''s % free Breakdown results', cfg.free_daily_assists;
  end if;

  -- This request consumes one of its own action's uses.
  if p_action = 'translate' then left_translate := greatest(0, left_translate - 1); end if;
  if p_action = 'breakdown' then left_breakdown := greatest(0, left_breakdown - 1); end if;

  remaining_by_action := case when tier = 'free' then jsonb_build_object(
    'translate', left_translate, 'breakdown', left_breakdown) else null end;
  remaining := case
    when tier <> 'free' then null
    when p_action = 'translate' then left_translate
    when p_action = 'breakdown' then left_breakdown
    else null
  end;

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
      'remainingByAction', remaining_by_action,
      'quotaResetsAt', day_start + interval '1 day');
  end if;

  select coalesce(sum(case when state = 'pending' then reserved_cost else coalesce(actual_cost, reserved_cost) end), 0)
  into spend from reading_assistant_private.operations
  where created_at >= day_start
    and state in ('pending', 'complete');

  if spend + 0.002 > cfg.daily_budget then
    -- Returned, not raised: raising would roll back this insert and the admin
    -- would never learn that generation stopped.
    insert into reading_assistant_private.budget_events(day, level, spend, budget)
    values(day_start::date, 'exhausted', spend, cfg.daily_budget)
    on conflict (day, level) do nothing;
    return jsonb_build_object('state', 'budget_exhausted',
      'message', 'New Reading explanations are taking a break today');
  end if;

  if spend + 0.002 >= cfg.daily_budget * 0.8 then
    insert into reading_assistant_private.budget_events(day, level, spend, budget)
    values(day_start::date, 'warning', spend, cfg.daily_budget)
    on conflict (day, level) do nothing;
  end if;

  insert into reading_assistant_private.operations(id, user_id, session_id, action, cache_key)
  values(p_id, u.id, p_session, p_action, p_cache_key);
  return jsonb_build_object('state', 'reserved', 'user_id', u.id,
    'budgetWarning', spend + 0.002 >= cfg.daily_budget * 0.8,
    'remainingDailyQuota', remaining,
    'remainingByAction', remaining_by_action,
    'quotaResetsAt', day_start + interval '1 day');
end
$$;

revoke all on function public.reading_assistant_status(uuid, uuid) from public, anon, authenticated;
revoke all on function public.reading_assistant_reserve(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.reading_assistant_status(uuid, uuid) to service_role;
grant execute on function public.reading_assistant_reserve(uuid, uuid, uuid, text, text, jsonb) to service_role;

comment on function public.reading_assistant_reserve(uuid, uuid, uuid, text, text, jsonb) is
'Reserves one Reading assistance generation. Free Translate and Breakdown allowances are counted separately per UTC day. Returns state=budget_exhausted (rather than raising) when the daily provider budget is spent, so the budget event is recorded for admin health.';

reset lock_timeout;
reset statement_timeout;

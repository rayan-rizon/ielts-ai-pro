-- Reading assistant cost accuracy and cache retention.
--
--  1. A provider bills a response it has generated even when the Edge Function
--     rejects its shape, and the whole fallback chain can be billed for one
--     learner action. The function now records those charges on the operation,
--     so the daily budget has to count failed rows or the cap can be passed
--     without anything noticing.
--  2. Gemini is no longer in the Reading fallback chain; the health card should
--     not keep advertising it.
--  3. ai_feedback_cache, operations and unlocks had no retention at all.
set lock_timeout = '2s';
set statement_timeout = '60s';

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

  -- A rejected provider answer is still billed, and the Edge Function now records
  -- that charge on the failed row. Counting only pending and complete rows let a
  -- bad fallback run spend past the cap unseen, so failures are counted too -- at
  -- their recorded cost, since a failure that never reached a provider cost
  -- nothing and must not be charged the pending reservation estimate.
  select coalesce(sum(case
    when state = 'pending' then reserved_cost
    when state = 'failed' then coalesce(actual_cost, 0)
    else coalesce(actual_cost, reserved_cost)
  end), 0)
  into spend from reading_assistant_private.operations
  where created_at >= day_start
    and state in ('pending', 'complete', 'failed');

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

revoke all on function public.reading_assistant_reserve(uuid, uuid, uuid, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.reading_assistant_reserve(uuid, uuid, uuid, text, text, jsonb)
  to service_role;

-- A reservation that ran past its 45-second window was marked failed and its
-- cost thrown away, which is exactly the case a slow fallback chain produces --
-- the run most likely to have been billed several times over. The charge is now
-- recorded on the expired row so the budget still sees it.
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
    update reading_assistant_private.operations set
      state = 'failed',
      actual_cost = greatest(0, coalesce(p_cost, 0)),
      tokens = greatest(0, coalesce(p_tokens, 0)),
      model = left(coalesce(p_model, ''), 120),
      latency_ms = greatest(0, coalesce(p_latency, 0)),
      finished_at = now()
    where id = p_id;
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

revoke all on function public.reading_assistant_finish(uuid, jsonb, numeric, integer, text, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.reading_assistant_finish(uuid, jsonb, numeric, integer, text, integer, boolean)
  to service_role;

-- --------------------------------------------------------------------------
-- Retention. The lookup is by input_hash, so expiry needs its own index for the
-- sweep to stay cheap as the table grows.
-- --------------------------------------------------------------------------
create index if not exists ai_feedback_cache_expires_at
  on public.ai_feedback_cache (expires_at);
create index if not exists reading_assistant_unlocks_created
  on reading_assistant_private.unlocks (created_at);

create or replace function reading_assistant_private.prune()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Expired generations. Deleting in bounded batches keeps the sweep off the
  -- lock for long enough to matter on a busy table.
  delete from public.ai_feedback_cache
  where ctid in (
    select ctid from public.ai_feedback_cache
    where expires_at <= now()
    limit 5000
  );

  -- Operations are telemetry: the admin health card reads at most 90 days.
  delete from reading_assistant_private.operations
  where ctid in (
    select ctid from reading_assistant_private.operations
    where created_at < now() - interval '90 days'
    limit 5000
  );

  -- Unlocks are what makes re-opening an old explanation free. They are kept
  -- longer than the 90-day shared cache so a learner never loses free access to
  -- something still cached; past that the entry is gone from both.
  delete from reading_assistant_private.unlocks
  where ctid in (
    select ctid from reading_assistant_private.unlocks
    where created_at < now() - interval '120 days'
    limit 5000
  );
end
$$;

revoke all on function reading_assistant_private.prune() from public, anon, authenticated;

select cron.unschedule('reading-assistant-prune')
where exists (select 1 from cron.job where jobname = 'reading-assistant-prune');
select cron.schedule(
  'reading-assistant-prune',
  '23 3 * * *',
  $job$select reading_assistant_private.prune()$job$
);

reset lock_timeout;
reset statement_timeout;

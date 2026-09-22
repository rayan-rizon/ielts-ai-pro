-- Personalized IELTS AI Coach. The feature is disabled at both the client and
-- server layers until multilingual grounding benchmarks and browser QA pass.
set lock_timeout = '2s';
set statement_timeout = '30s';

create schema if not exists ai_coach_private;
revoke all on schema ai_coach_private from public, anon, authenticated;

create table public.ai_coach_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null default 'New coaching conversation' check (length(title) between 1 and 120),
  explanation_language text not null default 'en'
    check (explanation_language in ('en','bn','hi','ur','ar','ne','zh-CN','vi','es','tr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index ai_coach_conversations_user_recent
  on public.ai_coach_conversations (user_id, last_message_at desc);

create table public.ai_coach_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_coach_conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (length(content) between 1 and 12000),
  response_language text check (response_language is null or response_language in
    ('en','bn','hi','ur','ar','ne','zh-CN','vi','es','tr')),
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  exercise jsonb,
  actions jsonb not null default '[]'::jsonb check (jsonb_typeof(actions) = 'array'),
  request_id uuid,
  created_at timestamptz not null default now()
);
create index ai_coach_messages_conversation_recent
  on public.ai_coach_messages (conversation_id, created_at desc);
create unique index ai_coach_messages_request_role
  on public.ai_coach_messages (request_id, role) where request_id is not null;

create table public.ai_coach_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  explanation_language text not null default 'en'
    check (explanation_language in ('en','bn','hi','ur','ar','ne','zh-CN','vi','es','tr')),
  updated_at timestamptz not null default now()
);

create table public.ai_coach_action_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid not null references public.ai_coach_conversations(id) on delete cascade,
  message_id uuid not null references public.ai_coach_messages(id) on delete cascade,
  action_type text not null check (action_type in ('navigate','save_vocabulary','reschedule_activity')),
  label text not null check (length(label) between 1 and 120),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status text not null default 'pending'
    check (status in ('pending','executing','confirmed','expired','failed')),
  idempotency_key uuid not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '15 minutes',
  executed_at timestamptz
);
create index ai_coach_actions_user_pending
  on public.ai_coach_action_proposals (user_id, status, expires_at);

create table public.ai_coach_activity_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid not null references public.ai_coach_conversations(id) on delete cascade,
  proposal_id uuid references public.ai_coach_action_proposals(id) on delete set null,
  route text not null check (length(route) between 1 and 500),
  source_session_id uuid references public.test_sessions(id) on delete set null,
  launched_at timestamptz not null default now(),
  completed_session_id uuid references public.test_sessions(id) on delete set null,
  completed_at timestamptz
);
create index ai_coach_activity_links_user_recent
  on public.ai_coach_activity_links (user_id, launched_at desc);

create table ai_coach_private.settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  daily_budget_usd numeric not null default 3 check (daily_budget_usd between 0 and 1000),
  warning_budget_usd numeric not null default 2.4 check (warning_budget_usd between 0 and 1000),
  reserved_request_cost_usd numeric not null default 0.005
    check (reserved_request_cost_usd between 0.0001 and 1),
  free_daily_replies integer not null default 5 check (free_daily_replies between 0 and 100),
  pro_daily_replies integer not null default 10 check (pro_daily_replies between 0 and 200),
  premium_daily_replies integer not null default 20 check (premium_daily_replies between 0 and 500),
  retention_days integer not null default 90 check (retention_days between 1 and 3650)
);
insert into ai_coach_private.settings default values on conflict (id) do nothing;

create table ai_coach_private.operations (
  id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid not null references public.ai_coach_conversations(id) on delete cascade,
  state text not null default 'pending' check (state in ('pending','complete','failed')),
  response jsonb,
  requested_language text not null,
  reserved_cost numeric not null,
  actual_cost numeric,
  tokens integer,
  model text,
  latency_ms integer,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  expires_at timestamptz not null default now() + interval '45 seconds'
);
create index ai_coach_operations_user_recent
  on ai_coach_private.operations (user_id, created_at desc);
create index ai_coach_operations_budget
  on ai_coach_private.operations (created_at, state);

create table ai_coach_private.exercise_answers (
  message_id uuid primary key references public.ai_coach_messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  correct_index integer not null check (correct_index between 0 and 4),
  explanation text not null check (length(explanation) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.ai_coach_conversations enable row level security;
alter table public.ai_coach_messages enable row level security;
alter table public.ai_coach_preferences enable row level security;
alter table public.ai_coach_action_proposals enable row level security;
alter table public.ai_coach_activity_links enable row level security;
alter table ai_coach_private.settings enable row level security;
alter table ai_coach_private.operations enable row level security;
alter table ai_coach_private.exercise_answers enable row level security;

revoke all on table public.ai_coach_conversations from public, anon, authenticated;
revoke all on table public.ai_coach_messages from public, anon, authenticated;
revoke all on table public.ai_coach_preferences from public, anon, authenticated;
revoke all on table public.ai_coach_action_proposals from public, anon, authenticated;
revoke all on table public.ai_coach_activity_links from public, anon, authenticated;
revoke all on all tables in schema ai_coach_private from public, anon, authenticated;

grant select, delete on table public.ai_coach_conversations to authenticated;
grant select on table public.ai_coach_messages to authenticated;
grant select on table public.ai_coach_preferences to authenticated;
grant select on table public.ai_coach_action_proposals to authenticated;
grant select on table public.ai_coach_activity_links to authenticated;

create policy "Learners read own coach conversations"
on public.ai_coach_conversations for select to authenticated
using (user_id = (select public.get_my_public_user_id()));
create policy "Learners delete own coach conversations"
on public.ai_coach_conversations for delete to authenticated
using (user_id = (select public.get_my_public_user_id()));
create policy "Learners read own coach messages"
on public.ai_coach_messages for select to authenticated
using (user_id = (select public.get_my_public_user_id()));
create policy "Learners read own coach preferences"
on public.ai_coach_preferences for select to authenticated
using (user_id = (select public.get_my_public_user_id()));
create policy "Learners read own coach actions"
on public.ai_coach_action_proposals for select to authenticated
using (user_id = (select public.get_my_public_user_id()));
create policy "Learners read own coach activity links"
on public.ai_coach_activity_links for select to authenticated
using (user_id = (select public.get_my_public_user_id()));

create or replace function public.ai_coach_status(p_auth uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  u public.users;
  cfg ai_coach_private.settings;
  effective_tier text;
  daily_limit integer;
  completed_count integer;
  spend numeric;
begin
  select * into strict u from public.users where auth_id = p_auth;
  select * into strict cfg from ai_coach_private.settings where id;
  effective_tier := case
    when u.role = 'admin' then 'premium'
    when u.subscription_end_date is not null and u.subscription_end_date <= now() then 'free'
    when u.subscription_tier in ('pro','premium') then u.subscription_tier
    else 'free' end;
  daily_limit := case effective_tier when 'premium' then cfg.premium_daily_replies
    when 'pro' then cfg.pro_daily_replies else cfg.free_daily_replies end;
  select count(*) into completed_count from ai_coach_private.operations
    where user_id = u.id and state = 'complete'
      and created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  select coalesce(sum(case when state = 'pending' then reserved_cost
    else coalesce(actual_cost, reserved_cost) end), 0) into spend
    from ai_coach_private.operations
    where state in ('pending','complete','failed')
      and created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  return jsonb_build_object(
    'enabled', cfg.enabled,
    'tier', effective_tier,
    'dailyLimit', daily_limit,
    'remainingDailyReplies', greatest(0, daily_limit - completed_count),
    'quotaResetsAt', date_trunc('day', now() at time zone 'UTC') at time zone 'UTC' + interval '1 day',
    'budgetAvailable', spend + cfg.reserved_request_cost_usd <= cfg.daily_budget_usd
  );
end
$$;

create or replace function public.ai_coach_reserve(
  p_auth uuid,
  p_operation_id uuid,
  p_conversation_id uuid,
  p_language text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  u public.users;
  cfg ai_coach_private.settings;
  convo public.ai_coach_conversations;
  op ai_coach_private.operations;
  effective_tier text;
  daily_limit integer;
  completed_count integer;
  pending_count integer;
  spend numeric;
begin
  if p_language not in ('en','bn','hi','ur','ar','ne','zh-CN','vi','es','tr') then
    raise exception 'Unsupported explanation language';
  end if;
  select * into strict u from public.users where auth_id = p_auth;
  perform pg_advisory_xact_lock(hashtextextended(u.id::text, 92022));
  perform pg_advisory_xact_lock(9202201);
  select * into strict cfg from ai_coach_private.settings where id;
  if not cfg.enabled then raise exception 'AI Coach is not available yet'; end if;

  select * into op from ai_coach_private.operations where id = p_operation_id;
  if found then
    if op.user_id <> u.id then raise exception 'Request identifier is already in use'; end if;
    if op.state = 'pending' and op.expires_at <= now() then
      update ai_coach_private.operations set state = 'failed', finished_at = now()
      where id = p_operation_id;
      return jsonb_build_object('state','failed');
    end if;
    return jsonb_build_object('state', op.state, 'response', op.response,
      'conversationId', op.conversation_id, 'replayed', true);
  end if;

  -- Reconcile every expired reservation while holding the global budget lock so
  -- abandoned requests cannot reserve budget forever.
  update ai_coach_private.operations set state = 'failed', finished_at = now()
  where state = 'pending' and expires_at <= now();
  if exists(select 1 from ai_coach_private.operations where user_id = u.id and state = 'pending') then
    raise exception 'Another coaching reply is already being prepared';
  end if;

  if p_conversation_id is null then
    insert into public.ai_coach_conversations(user_id, explanation_language)
    values(u.id, p_language) returning * into convo;
  else
    select * into convo from public.ai_coach_conversations
    where id = p_conversation_id and user_id = u.id;
    if not found then raise exception 'Conversation not found' using errcode = '42501'; end if;
  end if;

  effective_tier := case
    when u.role = 'admin' then 'premium'
    when u.subscription_end_date is not null and u.subscription_end_date <= now() then 'free'
    when u.subscription_tier in ('pro','premium') then u.subscription_tier
    else 'free' end;
  daily_limit := case effective_tier when 'premium' then cfg.premium_daily_replies
    when 'pro' then cfg.pro_daily_replies else cfg.free_daily_replies end;
  select count(*) into completed_count from ai_coach_private.operations
    where user_id = u.id and state = 'complete'
      and created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  select count(*) into pending_count from ai_coach_private.operations
    where user_id = u.id and state = 'pending'
      and created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  if completed_count + pending_count >= daily_limit then
    raise exception 'Your AI Coach replies will reset at 00:00 UTC';
  end if;

  select coalesce(sum(case when state = 'pending' then reserved_cost
    else coalesce(actual_cost, reserved_cost) end), 0) into spend
    from ai_coach_private.operations
    where state in ('pending','complete','failed')
      and created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  if spend + cfg.reserved_request_cost_usd > cfg.daily_budget_usd then
    raise exception 'AI Coach is taking a break for the rest of today';
  end if;

  insert into ai_coach_private.operations
    (id, user_id, conversation_id, requested_language, reserved_cost)
  values(p_operation_id, u.id, convo.id, p_language, cfg.reserved_request_cost_usd);
  return jsonb_build_object(
    'state','reserved', 'conversationId',convo.id,
    'reservedCostUsd', cfg.reserved_request_cost_usd,
    'remainingDailyReplies', greatest(0, daily_limit - completed_count - 1),
    'quotaResetsAt', date_trunc('day', now() at time zone 'UTC') at time zone 'UTC' + interval '1 day',
    'budgetWarning', spend + cfg.reserved_request_cost_usd >= cfg.warning_budget_usd
  );
end
$$;

create or replace function public.ai_coach_finish(
  p_operation_id uuid,
  p_user_message text,
  p_response jsonb,
  p_cost numeric,
  p_tokens integer,
  p_model text,
  p_latency integer,
  p_ok boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  op ai_coach_private.operations;
  assistant_message_id uuid;
  final_response jsonb;
  action jsonb;
  proposals jsonb := '[]'::jsonb;
  proposal_id uuid;
  action_key uuid;
  safe_exercise jsonb;
begin
  select * into op from ai_coach_private.operations where id = p_operation_id for update;
  if not found then raise exception 'Coach operation not found'; end if;
  if op.state <> 'pending' then return coalesce(op.response, '{}'::jsonb); end if;
  if op.expires_at <= now() then
    update ai_coach_private.operations set state = 'failed', actual_cost = case when p_cost is null then null else greatest(0,p_cost) end,
      tokens = greatest(0,coalesce(p_tokens,0)), model = left(coalesce(p_model,''),120),
      latency_ms = greatest(0,coalesce(p_latency,0)), finished_at = now()
    where id = p_operation_id;
    return '{}'::jsonb;
  end if;
  if not p_ok or p_response is null then
    update ai_coach_private.operations set state = 'failed', actual_cost = case when p_cost is null then null else greatest(0,p_cost) end,
      tokens = greatest(0,coalesce(p_tokens,0)), model = left(coalesce(p_model,''),120),
      latency_ms = greatest(0,coalesce(p_latency,0)), finished_at = now()
    where id = p_operation_id;
    return '{}'::jsonb;
  end if;

  insert into public.ai_coach_messages
    (conversation_id,user_id,role,content,request_id)
  values(op.conversation_id,op.user_id,'user',left(p_user_message,2000),p_operation_id);
  safe_exercise := p_response->'exercise';
  if safe_exercise->>'kind' = 'multiple_choice' then
    safe_exercise := safe_exercise - 'answerIndex' - 'explanation';
  end if;
  insert into public.ai_coach_messages
    (conversation_id,user_id,role,content,response_language,evidence_refs,exercise,request_id)
  values(op.conversation_id,op.user_id,'assistant',left(p_response->>'answer',12000),
    op.requested_language,coalesce(p_response->'evidenceRefs','[]'::jsonb),safe_exercise,p_operation_id)
  returning id into assistant_message_id;

  if p_response#>>'{exercise,kind}' = 'multiple_choice' then
    insert into ai_coach_private.exercise_answers(message_id,user_id,correct_index,explanation)
    values(assistant_message_id,op.user_id,(p_response#>>'{exercise,answerIndex}')::integer,
      left(p_response#>>'{exercise,explanation}',500));
  end if;

  for action in select value from jsonb_array_elements(coalesce(p_response->'actions','[]'::jsonb)) loop
    proposal_id := gen_random_uuid();
    action_key := gen_random_uuid();
    insert into public.ai_coach_action_proposals
      (id,user_id,conversation_id,message_id,action_type,label,payload,idempotency_key)
    values(proposal_id,op.user_id,op.conversation_id,assistant_message_id,
      action->>'type',left(action->>'label',120),action->'payload',action_key);
    proposals := proposals || jsonb_build_array(jsonb_build_object(
      'id',proposal_id,'type',action->>'type','label',action->>'label',
      'payload',action->'payload','expiresAt',now() + interval '15 minutes'));
  end loop;
  final_response := (p_response - 'actions' - 'exercise') || jsonb_build_object(
    'exercise',safe_exercise,'actions',proposals,'messageId',assistant_message_id,
    'conversationId',op.conversation_id);
  update public.ai_coach_messages set actions = proposals where id = assistant_message_id;
  update public.ai_coach_conversations set
    title = case when title = 'New coaching conversation' then left(p_user_message,80) else title end,
    explanation_language = op.requested_language,
    updated_at = now(), last_message_at = now() where id = op.conversation_id;
  update ai_coach_private.operations set state = 'complete', response = final_response,
    actual_cost = greatest(0,coalesce(p_cost,0)), tokens = greatest(0,coalesce(p_tokens,0)),
    model = left(coalesce(p_model,''),120), latency_ms = greatest(0,coalesce(p_latency,0)),
    finished_at = now() where id = p_operation_id;
  return final_response;
end
$$;

create or replace function public.ai_coach_check_exercise(
  p_auth uuid,
  p_message_id uuid,
  p_selected_index integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  answer ai_coach_private.exercise_answers;
  learner_id uuid;
begin
  select id into strict learner_id from public.users where auth_id = p_auth;
  select * into answer from ai_coach_private.exercise_answers
    where message_id = p_message_id and user_id = learner_id;
  if not found then raise exception 'Exercise not found' using errcode = '42501'; end if;
  if p_selected_index < 0 or p_selected_index > 4 then
    raise exception 'Invalid answer choice' using errcode = '22023';
  end if;
  return jsonb_build_object(
    'correct', p_selected_index = answer.correct_index,
    'correctIndex', answer.correct_index,
    'explanation', answer.explanation
  );
end
$$;

create or replace function public.ai_coach_claim_action(p_auth uuid, p_proposal_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  learner_id uuid;
  proposal public.ai_coach_action_proposals;
begin
  select id into strict learner_id from public.users where auth_id = p_auth;
  select * into proposal from public.ai_coach_action_proposals
    where id = p_proposal_id and user_id = learner_id for update;
  if not found then raise exception 'Action not found' using errcode = '42501'; end if;
  if proposal.status = 'confirmed' then
    return to_jsonb(proposal) || jsonb_build_object('replayed', true);
  end if;
  if proposal.status = 'executing' then
    return to_jsonb(proposal) || jsonb_build_object('replayed', true);
  end if;
  if proposal.status <> 'pending' or proposal.expires_at <= now() then
    update public.ai_coach_action_proposals set status = 'expired'
      where id = proposal.id and status = 'pending';
    raise exception 'This action has expired. Ask the coach for a fresh suggestion.';
  end if;
  update public.ai_coach_action_proposals set status = 'executing'
    where id = proposal.id returning * into proposal;
  return to_jsonb(proposal) || jsonb_build_object('replayed', false);
end
$$;

revoke all on function public.ai_coach_status(uuid) from public, anon, authenticated;
revoke all on function public.ai_coach_reserve(uuid,uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.ai_coach_finish(uuid,text,jsonb,numeric,integer,text,integer,boolean)
  from public, anon, authenticated;
revoke all on function public.ai_coach_claim_action(uuid,uuid) from public, anon, authenticated;
revoke all on function public.ai_coach_check_exercise(uuid,uuid,integer)
  from public, anon, authenticated;
grant execute on function public.ai_coach_status(uuid) to service_role;
grant execute on function public.ai_coach_reserve(uuid,uuid,uuid,text) to service_role;
grant execute on function public.ai_coach_finish(uuid,text,jsonb,numeric,integer,text,integer,boolean)
  to service_role;
grant execute on function public.ai_coach_claim_action(uuid,uuid) to service_role;
grant execute on function public.ai_coach_check_exercise(uuid,uuid,integer) to service_role;

create or replace function public.get_ai_coach_budget_status()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg ai_coach_private.settings;
  spend numeric;
begin
  if not exists (
    select 1 from public.users
    where auth_id = (select auth.uid()) and role = 'admin'
  ) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  select * into strict cfg from ai_coach_private.settings where id;
  select coalesce(sum(case when state = 'pending' then reserved_cost
    else coalesce(actual_cost, reserved_cost) end), 0) into spend
    from ai_coach_private.operations
    where state in ('pending','complete','failed')
      and created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  return jsonb_build_object(
    'enabled', cfg.enabled,
    'spentUsd', spend,
    'budgetUsd', cfg.daily_budget_usd,
    'warningUsd', cfg.warning_budget_usd,
    'warning', spend >= cfg.warning_budget_usd,
    'exhausted', spend + cfg.reserved_request_cost_usd > cfg.daily_budget_usd,
    'resetsAt', date_trunc('day', now() at time zone 'UTC') at time zone 'UTC' + interval '1 day'
  );
end
$$;
revoke all on function public.get_ai_coach_budget_status() from public, anon;
grant execute on function public.get_ai_coach_budget_status() to authenticated;

-- Add the coach to the existing Admin -> Global Settings system-health feed.
alter function public.get_platform_health(integer)
  rename to get_platform_health_core_v13;
revoke all on function public.get_platform_health_core_v13(integer)
  from public, anon, authenticated;

create or replace function public.get_platform_health(p_hours integer default 24)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  base jsonb;
  cfg ai_coach_private.settings;
  hours integer;
  since_at timestamptz;
  day_start timestamptz;
  spend numeric;
  completed_count bigint;
  failed_count bigint;
  pending_count bigint;
  stuck_count bigint;
  latency numeric;
  failure_rate numeric;
  budget_rate numeric;
  coach_status text;
begin
  if not public.is_admin() then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  hours := least(greatest(coalesce(p_hours, 24), 1), 24 * 90);
  since_at := now() - make_interval(hours => hours);
  day_start := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  base := public.get_platform_health_core_v13(hours);
  select * into strict cfg from ai_coach_private.settings where id;

  select
    count(*) filter (where state = 'complete' and created_at >= since_at),
    count(*) filter (where state = 'failed' and created_at >= since_at),
    count(*) filter (where state = 'pending'),
    count(*) filter (where state = 'pending' and expires_at <= now()),
    percentile_cont(0.95) within group (order by latency_ms)
      filter (where created_at >= since_at and latency_ms is not null)
  into completed_count, failed_count, pending_count, stuck_count, latency
  from ai_coach_private.operations;

  select coalesce(sum(case when state = 'pending' then reserved_cost
    else coalesce(actual_cost, reserved_cost) end), 0)
  into spend from ai_coach_private.operations
  where state in ('pending','complete','failed') and created_at >= day_start;

  failure_rate := case when completed_count + failed_count > 0
    then 100.0 * failed_count / (completed_count + failed_count) else 0 end;
  budget_rate := case when cfg.daily_budget_usd > 0
    then 100.0 * spend / cfg.daily_budget_usd else 100 end;
  coach_status := case
    when stuck_count > 0 then 'degraded'
    when spend + cfg.reserved_request_cost_usd > cfg.daily_budget_usd then 'attention'
    when spend >= cfg.warning_budget_usd then 'attention'
    when not cfg.enabled then 'idle'
    when completed_count + failed_count = 0 then 'idle'
    when failed_count >= 3 and failure_rate >= 20 then 'degraded'
    else 'operational'
  end;

  base := jsonb_set(
    base,
    '{services}',
    coalesce(base->'services', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'key', 'personalized_ai_coach',
      'label', 'Personalized AI Coach',
      'category', 'ai',
      'provider', 'OpenRouter GPT-OSS 120B -> GPT-5.6 Luna',
      'status', coach_status,
      'source', 'ai_coach_private operations and budget ledger',
      'metrics', jsonb_build_object(
        'dailySpendUsd', round(spend, 6),
        'dailyBudgetUsd', cfg.daily_budget_usd,
        'budgetUtilization', round(budget_rate, 1),
        'pendingReservations', pending_count,
        'stuckReservations', stuck_count,
        'completedReplies', completed_count,
        'failedRequests', failed_count,
        'failureRate', round(failure_rate, 1),
        'p95LatencyMs', case when latency is null then null else round(latency)::integer end,
        'featureEnabled', cfg.enabled,
        'resetsAt', day_start + interval '1 day'
      ),
      'impact', case
        when stuck_count > 0 then stuck_count || ' expired reservation(s) need reconciliation.'
        when spend + cfg.reserved_request_cost_usd > cfg.daily_budget_usd
          then 'The $3 daily safety budget is exhausted; saved conversations and learning activities remain available.'
        when spend >= cfg.warning_budget_usd
          then 'Daily coach spend has crossed the $2.40 warning threshold.'
        when not cfg.enabled then 'The coach is installed and held behind its release gate.'
        when failed_count > 0 then failed_count || ' coach request(s) failed in this window.'
        when completed_count = 0 then 'No coach replies in this window; this is not proof of provider health.'
        else 'Coach replies are completing within the configured budget.'
      end
    )),
    true
  );
  base := jsonb_set(base, '{contractVersion}', '13'::jsonb, true);
  return base;
end
$$;
revoke all on function public.get_platform_health(integer) from public, anon;
grant execute on function public.get_platform_health(integer) to authenticated;

comment on table public.ai_coach_messages is
  'Coach chat only. Mini-practice messages never update official scores or skill proficiency.';
comment on table ai_coach_private.operations is
  'Private replay-safe quota and provider-cost ledger. Recovery responses expire with their 90-day conversation; analytics never receive message content.';

reset lock_timeout;
reset statement_timeout;

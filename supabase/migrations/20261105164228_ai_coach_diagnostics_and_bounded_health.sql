-- Bounded private diagnostics share the existing settlement write and retention.
set lock_timeout='2s';
set statement_timeout='30s';
alter table ai_coach_private.operations add column diagnostics jsonb not null default '{}'::jsonb
 check (jsonb_typeof(diagnostics)='object' and octet_length(diagnostics::text)<=4096);
-- Legacy zero measurements mean unknown, not instant execution. Preserve costs.
update ai_coach_private.operations set latency_ms=null where latency_ms=0;
create index ai_coach_operations_pending_expiry on ai_coach_private.operations(expires_at) where state='pending';
-- Replacing the signature with a trailing default preserves old callers without
-- ambiguous PostgREST overloads. All writes still lock the same operation row.
drop function public.ai_coach_finish(uuid,text,jsonb,numeric,integer,text,integer,boolean);
create or replace function public.ai_coach_finish(
  p_operation_id uuid,
  p_user_message text,
  p_response jsonb,
  p_cost numeric,
  p_tokens integer,
  p_model text,
  p_latency integer,
  p_ok boolean,
  p_diagnostics jsonb default '{}'::jsonb
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
      latency_ms = nullif(greatest(0,coalesce(p_latency,0)),0), diagnostics = coalesce(p_diagnostics,'{}'::jsonb), finished_at = now()
    where id = p_operation_id;
    return '{}'::jsonb;
  end if;
  if not p_ok or p_response is null then
    update ai_coach_private.operations set state = 'failed', actual_cost = case when p_cost is null then null else greatest(0,p_cost) end,
      tokens = greatest(0,coalesce(p_tokens,0)), model = left(coalesce(p_model,''),120),
      latency_ms = nullif(greatest(0,coalesce(p_latency,0)),0), diagnostics = coalesce(p_diagnostics,'{}'::jsonb), finished_at = now()
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
    (conversation_id,user_id,role,content,response_language,evidence_refs,exercise,follow_ups,request_id)
  values(op.conversation_id,op.user_id,'assistant',left(p_response->>'answer',12000),
    op.requested_language,coalesce(p_response->'evidenceRefs','[]'::jsonb),safe_exercise,
    coalesce(p_response->'followUps','[]'::jsonb),p_operation_id)
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
    model = left(coalesce(p_model,''),120), latency_ms = nullif(greatest(0,coalesce(p_latency,0)),0), diagnostics = coalesce(p_diagnostics,'{}'::jsonb),
    finished_at = now() where id = p_operation_id;
  return final_response;
end
$$;

revoke all on function public.ai_coach_finish(uuid,text,jsonb,numeric,integer,text,integer,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.ai_coach_finish(uuid,text,jsonb,numeric,integer,text,integer,boolean,jsonb) to service_role;
CREATE OR REPLACE FUNCTION public.get_platform_health_core_v14(p_hours integer DEFAULT 24)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    percentile_cont(0.95) within group (order by latency_ms)
      filter (where created_at >= since_at and latency_ms is not null)
  into completed_count, failed_count, latency
  from ai_coach_private.operations
  where created_at >= since_at;

  select count(*), count(*) filter (where expires_at <= now())
  into pending_count, stuck_count
  from ai_coach_private.operations where state = 'pending';

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
      'provider', 'OpenRouter GPT-OSS 120B -> GPT-6 Luna',
      'status', coach_status,
      'source', 'ai_coach_private operations and budget ledger',
      'metrics', jsonb_build_object(
        'dailySpendUsd', round(spend, 6),
        'dailyBudgetUsd', cfg.daily_budget_usd,
        'budgetUtilization', round(budget_rate, 4),
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
$function$;

revoke all on function public.get_platform_health_core_v14(integer) from public,anon,authenticated;
reset lock_timeout;
reset statement_timeout;

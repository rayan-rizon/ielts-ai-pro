alter table public.ai_coach_messages
  add column follow_ups jsonb not null default '[]'::jsonb
  check (jsonb_typeof(follow_ups) = 'array' and jsonb_array_length(follow_ups) <= 3);

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
    model = left(coalesce(p_model,''),120), latency_ms = greatest(0,coalesce(p_latency,0)),
    finished_at = now() where id = p_operation_id;
  return final_response;
end
$$;

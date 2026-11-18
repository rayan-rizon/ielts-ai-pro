-- Run against an isolated migrated database. All fixtures roll back.
begin;
do $$
declare
  learner uuid := gen_random_uuid();
  auth_id uuid := gen_random_uuid();
  sent uuid := gen_random_uuid();
  pending uuid := gen_random_uuid();
  chat uuid;
  quota_before jsonb;
  finished jsonb;
begin
  insert into public.users(id, auth_id, email, role, subscription_tier)
  values(learner, auth_id, learner || '@example.test', 'user', 'free');
  update ai_coach_private.settings set enabled = true, daily_budget_usd = 3;

  chat := (public.ai_coach_reserve(auth_id, sent, null, 'en')->>'conversationId')::uuid;
  perform public.ai_coach_finish(sent, 'Question', '{"answer":"Response"}',
    0.001, 100, 'test', 10, true, '{}');
  quota_before := public.ai_coach_status(auth_id);
  delete from public.ai_coach_conversations where id = chat;

  if not exists (
    select 1 from ai_coach_private.operations where id = sent and state = 'complete'
      and conversation_id is null and response is null and actual_cost = 0.001
  ) then raise exception 'Deleting a chat must strip its response and preserve settled usage'; end if;
  if public.ai_coach_status(auth_id) <> quota_before then
    raise exception 'Deleting a chat changed quota or budget';
  end if;
  if exists (select 1 from public.ai_coach_messages where conversation_id = chat) then
    raise exception 'Deleted chat messages were retained';
  end if;

  chat := (public.ai_coach_reserve(auth_id, pending, null, 'en')->>'conversationId')::uuid;
  delete from public.ai_coach_conversations where id = chat;
  finished := public.ai_coach_finish(pending, 'Question', '{"answer":"Response"}',
    0.002, 200, 'test', 10, true, '{}');
  if finished ? 'messageId' or not exists (
    select 1 from ai_coach_private.operations where id = pending and state = 'failed'
      and conversation_id is null and response is null and actual_cost = 0.002
  ) then raise exception 'Deleted pending chat must settle its cost without storing a reply'; end if;
  update ai_coach_private.operations set created_at = now() - interval '91 days' where id = sent;
  perform ai_coach_private.prune_detached_operations();
  if exists (select 1 from ai_coach_private.operations where id = sent)
    or not exists (select 1 from ai_coach_private.operations where id = pending)
  then raise exception 'Cleanup must only remove detached usage past retention'; end if;
end;
$$;
rollback;

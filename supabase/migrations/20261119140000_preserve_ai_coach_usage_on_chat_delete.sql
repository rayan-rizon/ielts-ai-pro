-- Keep quota and cost accounting when a learner removes a conversation.
set lock_timeout = '2s';
set statement_timeout = '30s';

alter table ai_coach_private.operations
  drop constraint operations_conversation_id_fkey,
  alter column conversation_id drop not null,
  add constraint operations_conversation_id_fkey
    foreign key (conversation_id) references public.ai_coach_conversations(id) on delete set null;

create function ai_coach_private.clear_detached_response()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.response := null;
  return new;
end;
$$;

create trigger clear_detached_response
before update of conversation_id on ai_coach_private.operations
for each row when (old.conversation_id is not null and new.conversation_id is null)
execute function ai_coach_private.clear_detached_response();

-- Keep the existing settlement logic and grant public API access only through
-- the wrapper, which locks the conversation before the operation.
alter function public.ai_coach_finish(uuid,text,jsonb,numeric,integer,text,integer,boolean,jsonb)
  set schema ai_coach_private;
revoke all on function ai_coach_private.ai_coach_finish(uuid,text,jsonb,numeric,integer,text,integer,boolean,jsonb)
  from public, anon, authenticated, service_role;

create function public.ai_coach_finish(
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
  chat_exists boolean;
begin
  -- DELETE takes the same conversation lock before detaching operations.
  perform 1 from public.ai_coach_conversations c
    join ai_coach_private.operations o on o.conversation_id = c.id
    where o.id = p_operation_id
    for no key update of c;
  chat_exists := found;
  return ai_coach_private.ai_coach_finish(
    p_operation_id, p_user_message, p_response, p_cost, p_tokens, p_model, p_latency,
    p_ok and chat_exists, p_diagnostics
  );
end;
$$;

revoke all on function public.ai_coach_finish(uuid,text,jsonb,numeric,integer,text,integer,boolean,jsonb)
  from public, anon, authenticated;
grant execute on function public.ai_coach_finish(uuid,text,jsonb,numeric,integer,text,integer,boolean,jsonb)
  to service_role;

-- Bound detached accounting rows to the configured retention window.
create function ai_coach_private.prune_detached_operations()
returns void
language sql
set search_path = ''
as $$
  delete from ai_coach_private.operations
  where id in (
    select o.id
    from ai_coach_private.operations o
    cross join ai_coach_private.settings s
    where s.id and o.conversation_id is null
      and o.created_at < now() - make_interval(days => s.retention_days)
      and (o.state <> 'pending' or o.expires_at <= now())
    order by o.created_at
    limit 5000
  );
$$;

revoke all on function ai_coach_private.prune_detached_operations() from public, anon, authenticated;

do $$
begin
  if to_regprocedure('cron.schedule(text,text,text)') is not null then
    perform cron.schedule(
      'ai-coach-usage-retention',
      '29 3 * * *',
      'select ai_coach_private.prune_detached_operations()'
    );
  end if;
end;
$$;

reset lock_timeout;
reset statement_timeout;

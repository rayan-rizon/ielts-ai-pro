-- One coaching workspace per original Writing practice part. The scored session
-- remains immutable; these rows never enter progress or readiness aggregation.
create table public.writing_practice_coaching (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  task_type text not null check (task_type in ('Task 1', 'Task 2')),
  original_text text not null,
  revision_text text not null check (octet_length(revision_text) <= 12000),
  revision_feedback jsonb,
  revision_history jsonb not null default '[]'::jsonb,
  revision_scored_text text,
  revision_status text not null default 'available'
    check (revision_status in ('available', 'checking')),
  revision_check_started_at timestamptz,
  revision_checked_at timestamptz,
  transformation jsonb,
  transformation_status text not null default 'available'
    check (transformation_status in ('available', 'generating', 'complete', 'failed')),
  transformation_started_at timestamptz,
  transformation_cost_usd numeric(12,8),
  transformation_attempts integer not null default 0 check (transformation_attempts between 0 and 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, task_type),
  check (octet_length(original_text) <= 12000)
);

create index writing_practice_coaching_user_session_idx
  on public.writing_practice_coaching(user_id, session_id);

alter table public.writing_practice_coaching enable row level security;

create policy "Read own Writing coaching" on public.writing_practice_coaching
  for select to authenticated
  using (user_id = (select public.get_my_public_user_id()));

create policy "Create own Writing coaching" on public.writing_practice_coaching
  for insert to authenticated
  with check (
    user_id = (select public.get_my_public_user_id())
    and exists (
      select 1 from public.test_sessions s
      where s.id = public.writing_practice_coaching.session_id
        and s.user_id = public.writing_practice_coaching.user_id
        and s.test_type = 'writing' and s.test_mode = 'practice'
        and s.evaluation_status = 'complete'
    )
  );

create policy "Edit own Writing coaching" on public.writing_practice_coaching
  for update to authenticated
  using (user_id = (select public.get_my_public_user_id()))
  with check (user_id = (select public.get_my_public_user_id()));

revoke all on public.writing_practice_coaching from public, anon, authenticated;
grant select, insert on public.writing_practice_coaching to authenticated;
grant update (revision_text, updated_at)
  on public.writing_practice_coaching to authenticated;
grant all on public.writing_practice_coaching to service_role;

-- Prevent clients from inventing an original answer or submitting a revision as
-- a different session. The server also checks the scored session on generation.
create or replace function public.validate_writing_coaching_insert()
returns trigger language plpgsql security invoker as $$
declare source_text text;
begin
  select case when new.task_type = 'Task 2'
    then s.user_responses->0->>'task2_response'
    else s.user_responses->0->>'task1_response' end
  into source_text
  from public.test_sessions s
  where s.id = new.session_id and s.user_id = new.user_id;
  if source_text is null or source_text <> new.original_text
    or new.revision_text <> source_text
    or new.revision_feedback is not null or new.revision_history <> '[]'::jsonb
    or new.revision_scored_text is not null
    or new.revision_status <> 'available' or new.revision_check_started_at is not null
    or new.revision_checked_at is not null or new.transformation is not null
    or new.transformation_cost_usd is not null or new.transformation_started_at is not null
    or new.transformation_attempts <> 0
    or new.transformation_status <> 'available' then
    raise exception 'Writing coaching must begin from the saved original';
  end if;
  return new;
end;
$$;

create trigger writing_coaching_validate_insert
before insert on public.writing_practice_coaching
for each row execute function public.validate_writing_coaching_insert();

-- Called with the service role after ownership has been checked in the Edge
-- Function. The advisory lock makes the shared daily budget race safe.
create or replace function public.claim_writing_transformation(p_id uuid)
returns boolean language plpgsql security invoker as $$
declare daily_spend numeric;
begin
  perform pg_advisory_xact_lock(hashtext('writing-transformation-budget'));
  select coalesce(sum(coalesce(transformation_cost_usd, 0) +
    case when transformation_status = 'generating' then 0.005 else 0 end), 0) into daily_spend
  from public.writing_practice_coaching
  where transformation_started_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC'
    and transformation_started_at < (date_trunc('day', now() at time zone 'UTC') + interval '1 day') at time zone 'UTC';
  if daily_spend + 0.005 > 3 then return false; end if;
  update public.writing_practice_coaching
  set transformation_status = 'generating', transformation_started_at = now(),
    transformation_attempts = transformation_attempts + 1, updated_at = now()
  where id = p_id and (
    transformation_status in ('available', 'failed') or
    (transformation_status = 'generating' and transformation_started_at < now() - interval '5 minutes')
  )
    and transformation_attempts < 2;
  return found;
end;
$$;
revoke all on function public.claim_writing_transformation(uuid) from public, anon, authenticated;
grant execute on function public.claim_writing_transformation(uuid) to service_role;

create or replace function public.claim_writing_revision_check(p_id uuid, p_text text)
returns boolean language plpgsql security invoker as $$
begin
  update public.writing_practice_coaching
  set revision_status = 'checking', revision_check_started_at = now(), updated_at = now()
  where id = p_id and (
    revision_status = 'available' or
    (revision_status = 'checking' and revision_check_started_at < now() - interval '5 minutes')
  )
    and revision_text = p_text
    and (revision_scored_text is distinct from p_text or revision_feedback is null);
  return found;
end;
$$;
revoke all on function public.claim_writing_revision_check(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_writing_revision_check(uuid, text) to service_role;

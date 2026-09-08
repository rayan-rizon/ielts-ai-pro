-- Additive preparation. Existing browser access is deliberately not revoked here:
-- that cutover requires the compatible frontend to be live first.
set lock_timeout='2s';
set statement_timeout='30s';
create schema objective_private;
revoke all on schema objective_private from public, anon, authenticated;
create table objective_private.attempts (
 session_id uuid primary key references public.test_sessions(id) on delete cascade,
 user_id uuid not null references public.users(id) on delete cascade,
 snapshot jsonb not null,
 result jsonb,
 answers jsonb,
 created_at timestamptz not null default now(),
 completed_at timestamptz
);
alter table objective_private.attempts enable row level security;
revoke all on objective_private.attempts from public, anon, authenticated;

create function public.objective_test_state(p_auth uuid,p_action text,p_session uuid default null,p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid; t public.test_sessions; a objective_private.attempts; p public.passages; tier text; r jsonb;
begin
 select id into strict u from public.users where auth_id=p_auth;
 if p_session is not null then
  select * into strict t from public.test_sessions where id=p_session and user_id=u for update;
  if t.paired_room_id is not null or t.test_type not in ('reading','listening') then
   raise exception 'Use the original test interface' using errcode='42501'; end if;
 end if;
 select * into strict p from public.passages where id=coalesce(t.passage_id,(p_data->>'passage_id')::uuid);
 tier:=skill_lab_private.tier(u);
 if not p.is_active or p.test_type not in ('reading','listening') or
  not (p.access_tier='free' or tier='premium' or (tier='pro' and p.access_tier='pro')) then
  raise exception 'Test unavailable with your current plan' using errcode='42501'; end if;
 if p_action='authorize' then return jsonb_build_object('passage_id',p.id,'session',to_jsonb(t),
  'attempt',(select to_jsonb(x) from objective_private.attempts x where session_id=t.id)); end if;
 if p_session is null then raise exception 'A test session is required'; end if;
 select * into a from objective_private.attempts where session_id=t.id;
 if p_action='load' then
  if a.session_id is null then
   if t.is_completed then raise exception 'Use the original saved result for this previous test'; end if;
   if p_data->'snapshot' is null or p_data#>>'{snapshot,testData,id}' is distinct from p.id::text then
    raise exception 'Invalid test snapshot'; end if;
   insert into objective_private.attempts(session_id,user_id,snapshot)
    values(t.id,u,p_data->'snapshot') returning * into a;
  end if;
 elsif p_action='submit' then
  if a.session_id is null then raise exception 'Load this test before submitting'; end if;
  if a.completed_at is null then
   r:=p_data->'result';
   if r is null or jsonb_typeof(r)<>'object' or jsonb_typeof(p_data->'answers')<>'object' then raise exception 'Invalid result'; end if;
   update objective_private.attempts set result=r,answers=p_data->'answers',completed_at=now()
    where session_id=t.id returning * into a;
   update public.test_sessions set score=(r->>'bandScore')::numeric,is_completed=true,completed_at=now(),updated_at=now(),
    user_responses=a.answers,content_data=coalesce(content_data,'{}')||jsonb_build_object(
     'serverScored',true,'serverResult',r,'savedAnswers',a.answers,
     'correctAnswersMap',coalesce(r->'correctAnswersMap',r->'answersMap'),
     'responseDetails',r->'responseDetails','totalQuestions',r->'totalQuestions',
     'correctAnswers',r->'correctAnswers','percentage',r->'percentage',
     'sectionStats',r->'sectionStats','typeStats',r->'typeStats') where id=t.id;
  end if;
 else raise exception 'Unknown test action'; end if;
 return to_jsonb(a);
end $$;
revoke all on function public.objective_test_state(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.objective_test_state(uuid,text,uuid,jsonb) to service_role;

-- Protect new server-scored attempts from direct score/result overwrites.
-- Existing sessions, including Writing, Speaking and paired tests, are unaffected.
create function objective_private.protect_result() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if current_setting('role',true) in ('anon','authenticated') and exists(
  select 1 from objective_private.attempts where session_id=old.id
 ) and (new.score is distinct from old.score or new.is_completed is distinct from old.is_completed
  or new.completed_at is distinct from old.completed_at or new.user_id is distinct from old.user_id
  or new.passage_id is distinct from old.passage_id or new.test_type is distinct from old.test_type
  or new.content_data is distinct from old.content_data or new.user_responses is distinct from old.user_responses) then
  raise exception 'Save this attempt through the test service' using errcode='42501';
 end if;
 return new;
end $$;
revoke all on function objective_private.protect_result() from public,anon,authenticated;
create trigger protect_objective_result before update on public.test_sessions
 for each row execute function objective_private.protect_result();
reset lock_timeout;
reset statement_timeout;

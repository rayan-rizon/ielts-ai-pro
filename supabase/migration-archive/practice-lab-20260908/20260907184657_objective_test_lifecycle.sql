-- Prepare the compatible API and metadata view. The access switch stays off
-- until the new frontend has passed authenticated verification.
set lock_timeout='2s';
set statement_timeout='30s';
create table objective_private.settings(id boolean primary key default true check(id),protect_keys boolean not null default false,
 preview_auth_ids uuid[] not null default '{}');
insert into objective_private.settings default values;
alter table objective_private.settings enable row level security;
revoke all on objective_private.settings from public,anon,authenticated;
alter table objective_private.attempts add column revision bigint not null default 0,
 add column last_save_request uuid;

create function public.objective_keys_protected() returns boolean language sql stable security definer set search_path='' as $$
 select protect_keys or coalesce(auth.uid()=any(preview_auth_ids),false) from objective_private.settings where id
$$;
revoke all on function public.objective_keys_protected() from public,anon;
grant execute on function public.objective_keys_protected() to authenticated,service_role;

-- This definer view deliberately exposes an explicit safe column list. An
-- invoker view would lose objective metadata when base-row access is disabled.
create view public.library_passages with(security_barrier=true) as
 select id,title,topic,
 case when test_type in ('reading','listening') and not public.is_admin() then null::text else content end as content,
 case when test_type in ('reading','listening') and not public.is_admin() then null::text else audio_url end as audio_url,
 is_active,task_type,test_type,created_at,
 case when test_type in ('reading','listening') and not public.is_admin() then null::text else transcript end as transcript,
 updated_at,access_tier,test_format,cambridge_year,question_count,cambridge_title,total_questions,
 duration_minutes,cambridge_test_number,is_official_cambridge
 from public.passages where auth.uid() is not null and (is_active or public.is_admin());
revoke all on public.library_passages from public,anon,authenticated;
grant select on public.library_passages to authenticated;
create policy objective_passage_key_gate on public.passages as restrictive for select to authenticated
 using(not public.objective_keys_protected() or public.is_admin() or test_type not in('reading','listening'));
create policy objective_question_key_gate on public.questions as restrictive for select to authenticated
 using(not public.objective_keys_protected() or public.is_admin() or exists(
  select 1 from public.passages p where p.id=passage_id and p.test_type not in('reading','listening')));

create or replace function public.objective_test_state(p_auth uuid,p_action text,p_session uuid default null,p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid; t public.test_sessions; a objective_private.attempts; p public.passages; tier text;
 r jsonb; meta jsonb; finished_now boolean:=false; elapsed integer;
begin
 select id into strict u from public.users where auth_id=p_auth;
 if p_session is not null then
  select * into strict t from public.test_sessions where id=p_session and user_id=u for update;
  if t.paired_room_id is not null or t.test_type not in ('reading','listening') then
   raise exception 'Use the original test interface' using errcode='42501'; end if;
  select * into a from objective_private.attempts where session_id=t.id;
 end if;
 select * into strict p from public.passages where id=coalesce(t.passage_id,(p_data->>'passage_id')::uuid);
 tier:=skill_lab_private.tier(u);
 if p.test_type not in ('reading','listening') or (a.session_id is null and not coalesce(t.is_completed,false) and (
  not p.is_active or not (p.access_tier='free' or tier='premium' or (tier='pro' and p.access_tier='pro')))) then
  raise exception 'Test unavailable with your current plan' using errcode='42501'; end if;
 if p_action='authorize' then return jsonb_build_object('passage_id',p.id,'session',to_jsonb(t),'attempt',to_jsonb(a)); end if;
 if p_session is null then raise exception 'A test session is required'; end if;
 if p_action='load' then
  if a.session_id is null then
   if t.is_completed then raise exception 'Use the original saved result for this previous test'; end if;
   if p_data->'snapshot' is null or p_data#>>'{snapshot,testData,id}' is distinct from p.id::text then raise exception 'Invalid test snapshot'; end if;
   insert into objective_private.attempts(session_id,user_id,snapshot,answers)
    values(t.id,u,p_data->'snapshot',case when jsonb_typeof(t.user_responses)='object' then t.user_responses else '{}' end) returning * into a;
  end if;
 elsif p_action in('save','submit') then
  if a.session_id is null then raise exception 'Load this test before saving'; end if;
  if a.completed_at is not null then return to_jsonb(a)||jsonb_build_object('completed_now',false); end if;
  if p_action='save' and a.last_save_request is not null and a.last_save_request=(p_data->>'request_id')::uuid then return to_jsonb(a); end if;
  if nullif(p_data->>'expected_revision','')::bigint is distinct from a.revision then
   raise exception 'This test changed in another tab. Reload the saved test before continuing'; end if;
  if jsonb_typeof(p_data->'answers') is distinct from 'object' or octet_length((p_data->'answers')::text)>25000 then raise exception 'Invalid answers'; end if;
  select coalesce(jsonb_object_agg(key,value),'{}') into meta from jsonb_each(coalesce(p_data->'metadata','{}'))
   where key in('time_remaining','audio_current_time','highlights','notes','passageTimes','answerChangeCounts');
  if octet_length(meta::text)>40000 then raise exception 'Saved notes are too large'; end if;
  if p_action='save' then
   if nullif(p_data->>'request_id','') is null then raise exception 'A save request identifier is required'; end if;
   update objective_private.attempts set answers=p_data->'answers',revision=revision+1,last_save_request=(p_data->>'request_id')::uuid where session_id=t.id returning * into a;
   update public.test_sessions set user_responses=a.answers,updated_at=now(),
    content_data=coalesce(content_data,'{}')||meta||jsonb_build_object('last_saved_at',now(),'savedAnswers',a.answers) where id=t.id;
  else
   r:=p_data->'result';if jsonb_typeof(r) is distinct from 'object' then raise exception 'Invalid result'; end if;
   elapsed:=greatest(1,least(14400,coalesce(t.duration_minutes,case t.test_type when 'reading' then 60 else 40 end)*60-greatest(0,least(14400,coalesce((meta->>'time_remaining')::integer,0)))));
   update objective_private.attempts set result=r,answers=p_data->'answers',completed_at=now(),revision=revision+1 where session_id=t.id returning * into a;
   update public.test_sessions set score=(r->>'bandScore')::numeric,is_completed=true,completed_at=now(),updated_at=now(),
    actual_duration_seconds=elapsed,duration_minutes=greatest(1,elapsed/60),user_responses=a.answers,
    content_data=coalesce(content_data,'{}')||meta||jsonb_build_object('serverScored',true,'serverResult',r,'savedAnswers',a.answers,
     'correctAnswersMap',coalesce(r->'correctAnswersMap',r->'answersMap'),'responseDetails',r->'responseDetails',
     'totalQuestions',r->'totalQuestions','correctAnswers',r->'correctAnswers','percentage',r->'percentage',
     'sectionStats',r->'sectionStats','typeStats',r->'typeStats','timeMetrics',jsonb_build_object('totalTimeSpent',elapsed)) where id=t.id;
   finished_now:=true;
  end if;
 else raise exception 'Unknown test action'; end if;
 return to_jsonb(a)||jsonb_build_object('completed_now',finished_now);
end $$;
revoke all on function public.objective_test_state(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.objective_test_state(uuid,text,uuid,jsonb) to service_role;

create or replace function objective_private.protect_result() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if current_setting('role',true) not in('anon','authenticated') then return new; end if;
 if tg_op='INSERT' then
  if public.objective_keys_protected() and new.test_type in('reading','listening') and
   (coalesce(new.is_completed,false) or new.score is not null or new.completed_at is not null
    or coalesce(new.content_data->>'serverScored','false')<>'false') then
   raise exception 'Complete this test through the test service' using errcode='42501'; end if;
 elsif (exists(select 1 from objective_private.attempts where session_id=old.id) or
   (public.objective_keys_protected() and (old.test_type in('reading','listening') or new.test_type in('reading','listening'))))
   and (new.score is distinct from old.score or new.is_completed is distinct from old.is_completed
    or new.completed_at is distinct from old.completed_at or new.user_id is distinct from old.user_id
    or new.passage_id is distinct from old.passage_id or new.test_type is distinct from old.test_type
    or new.content_data is distinct from old.content_data or new.user_responses is distinct from old.user_responses) then
  raise exception 'Save this attempt through the test service' using errcode='42501';
 end if;
 return new;
end $$;
create trigger protect_objective_insert before insert on public.test_sessions for each row execute function objective_private.protect_result();
reset lock_timeout;
reset statement_timeout;

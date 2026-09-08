-- Additive library-backed practice storage. Disabled until content/access audit passes.
set lock_timeout='2s';
set statement_timeout='30s';
alter table skill_lab_private.settings add column library_enabled boolean not null default false;
create table skill_lab_private.library_groups (
 id text primary key,
 source_id uuid not null references public.passages(id) on delete cascade,
 focus text not null,
 version text not null,
 snapshot jsonb not null,
 eligible boolean not null default false,
 exclusion text,
 updated_at timestamptz not null default now()
);
create index practice_library_focus on skill_lab_private.library_groups(focus) where eligible;
create table skill_lab_private.library_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.users(id) on delete cascade,
 request_id uuid not null,
 group_id text not null,
 source_id uuid not null references public.passages(id),
 source_session_id uuid references public.test_sessions(id) on delete set null,
 activity_id uuid references public.learning_path_activities(id) on delete set null,
 focus text not null,
 version text not null,
 snapshot jsonb not null,
 answers jsonb not null default '{}',
 result jsonb,
 stage integer not null default 0 check(stage between 0 and 3),
 assisted boolean not null default false,
 familiarity text not null check(familiarity in ('new','familiar','repeated')),
 created_at timestamptz not null default now(),
 completed_at timestamptz,
 next_review_at timestamptz,
 unique(user_id,request_id)
);
create index practice_library_history on skill_lab_private.library_sessions(user_id,created_at desc);
alter table skill_lab_private.library_groups enable row level security;
alter table skill_lab_private.library_sessions enable row level security;
create table public.practice_library_exposure (
 user_id uuid not null references public.users(id) on delete cascade,
 source_id uuid not null references public.passages(id) on delete cascade,
 group_id text not null,
 first_seen_at timestamptz not null default now(),
 primary key(user_id,group_id)
);
alter table public.practice_library_exposure enable row level security;
revoke all on public.practice_library_exposure from public,anon,authenticated;
grant select on public.practice_library_exposure to authenticated;
create policy practice_exposure_owner on public.practice_library_exposure for select to authenticated
 using(user_id in(select id from public.users where auth_id=(select auth.uid())));

-- Called only by an authenticated Edge handler using the service role.
-- Never grant this snapshot-bearing interface to browser roles.
create function public.practice_library_state(p_auth uuid,p_action text,p_session uuid default null,p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid; tier text; allowance integer; used integer;
 s skill_lab_private.library_sessions; g skill_lab_private.library_groups;
 familiarity text; source_session uuid; activity uuid;
begin
 select id into strict u from public.users where auth_id=p_auth;
 perform pg_advisory_xact_lock(hashtextextended(u::text,713));
 tier:=skill_lab_private.tier(u);
 allowance:=case tier when 'premium' then 20 when 'pro' then 10 else 2 end;
 select (select count(*) from skill_lab_private.library_sessions where user_id=u and created_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')+
 (select count(*) from public.skill_lab_sessions where user_id=u and created_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC') into used;
 if p_action='dashboard' then
  return jsonb_build_object('enabled',(select library_enabled from skill_lab_private.settings),'tier',tier,
   'remaining',greatest(0,allowance-used),'limit',allowance,
   'reset_at',(date_trunc('day',now() at time zone 'UTC')+interval '1 day') at time zone 'UTC',
   'sessions',coalesce((select jsonb_agg(to_jsonb(x)-'snapshot') from (select * from skill_lab_private.library_sessions where user_id=u order by created_at desc limit 100)x),'[]'),
   'exposures',coalesce((select jsonb_agg(to_jsonb(e)) from public.practice_library_exposure e where user_id=u),'[]'));
 end if;
 if p_action='start' then
  select * into s from skill_lab_private.library_sessions where user_id=u and request_id=(p_data->>'request_id')::uuid;
  if found then return to_jsonb(s); end if;
  if not (select library_enabled from skill_lab_private.settings) then raise exception 'Library practice is not available yet'; end if;
  if used>=allowance then raise exception 'You have used today’s practice sets. Your allowance resets at 00:00 UTC.'; end if;
  select * into strict g from skill_lab_private.library_groups where id=p_data->>'group_id' and eligible;
  if not exists(select 1 from public.passages where id=g.source_id and is_active and
   (access_tier='free' or tier='premium' or (tier='pro' and access_tier='pro'))) then
   raise exception 'This test is not available with your current plan' using errcode='42501'; end if;
  source_session:=nullif(p_data->>'source_session_id','')::uuid;
  if source_session is not null and not exists(select 1 from public.test_sessions where id=source_session and user_id=u and is_completed) then
   raise exception 'Result unavailable' using errcode='42501'; end if;
  activity:=nullif(p_data->>'activity_id','')::uuid;
  if activity is not null and not exists(select 1 from public.learning_path_activities where id=activity and user_id=u and not is_completed
   and module=split_part(g.focus,':',1) and activity_type in('targeted_drill','targeted_repair','spaced_review')
   and (replace(g.focus,':','_')=any(skill_targets))) then
   raise exception 'This set does not match the learning activity' using errcode='42501'; end if;
  familiarity:=case when exists(select 1 from public.practice_library_exposure where user_id=u and group_id=g.id) then 'repeated'
   when exists(select 1 from public.practice_library_exposure where user_id=u and source_id=g.source_id)
    or exists(select 1 from public.test_sessions where user_id=u and passage_id=g.source_id) then 'familiar' else 'new' end;
  insert into skill_lab_private.library_sessions(user_id,request_id,group_id,source_id,source_session_id,activity_id,focus,version,snapshot,familiarity)
   values(u,(p_data->>'request_id')::uuid,g.id,g.source_id,source_session,activity,g.focus,g.version,
    g.snapshot || jsonb_build_object('mistake',p_data->'mistake'),familiarity) returning * into s;
  insert into public.practice_library_exposure(user_id,source_id,group_id) values(u,g.source_id,g.id) on conflict do nothing;
  return to_jsonb(s);
 end if;
 select * into strict s from skill_lab_private.library_sessions where id=p_session and user_id=u for update;
 if p_action='resume' then return to_jsonb(s); end if;
 if s.completed_at is not null then return to_jsonb(s); end if;
 if p_action='save' then
  if jsonb_typeof(p_data->'answers')<>'object' or octet_length((p_data->'answers')::text)>30000 then raise exception 'Invalid answers'; end if;
  update skill_lab_private.library_sessions set answers=p_data->'answers',stage=greatest(stage,least(2,coalesce((p_data->>'stage')::integer,stage))),
   assisted=assisted or coalesce((p_data->>'assisted')::boolean,false) where id=s.id returning * into s;
 elsif p_action='complete' then
  -- Result is produced by the shared scorer in the service-only handler, never the browser.
  update skill_lab_private.library_sessions set result=p_data->'result',answers=p_data->'answers',stage=3,completed_at=now(),
   next_review_at=now()+interval '2 days' where id=s.id returning * into s;
  if s.activity_id is not null then
   update public.learning_path_activities set is_completed=true,completed_at=now(),updated_at=now(),
    outcome_data=jsonb_build_object('source','practice_library','session_id',s.id,'practice_only',true)
    where id=s.activity_id and user_id=u and not is_completed;
  end if;
 else raise exception 'Unknown practice action'; end if;
 return to_jsonb(s);
end $$;
revoke all on function public.practice_library_state(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.practice_library_state(uuid,text,uuid,jsonb) to service_role;
revoke all on all tables in schema skill_lab_private from public,anon,authenticated;

create function public.practice_library_catalogue(p_auth uuid) returns jsonb
language sql security definer set search_path='' as $$
 select jsonb_build_object(
 'passages',coalesce((select jsonb_agg(to_jsonb(p)) from public.passages p where p.is_active and p.test_type in('reading','listening') and
 (p.access_tier='free' or skill_lab_private.tier(u.id)='premium' or (p.access_tier='pro' and skill_lab_private.tier(u.id)='pro'))),'[]'),
 'questions',coalesce((select jsonb_agg(to_jsonb(q)) from public.questions q join public.passages p on p.id=q.passage_id where p.is_active and p.test_type in('reading','listening') and
 (p.access_tier='free' or skill_lab_private.tier(u.id)='premium' or (p.access_tier='pro' and skill_lab_private.tier(u.id)='pro'))),'[]'),
 'history',coalesce((select jsonb_agg(to_jsonb(t)) from public.test_sessions t where t.user_id=u.id and t.is_completed and t.test_type in('reading','listening')
 and t.completed_at>=now()-interval '90 days'),'[]')) from public.users u where u.auth_id=p_auth
$$;
revoke all on function public.practice_library_catalogue(uuid) from public,anon,authenticated;
grant execute on function public.practice_library_catalogue(uuid) to service_role;

create function public.practice_library_index(p_group jsonb) returns void
language sql security definer set search_path='' as $$
 insert into skill_lab_private.library_groups(id,source_id,focus,version,snapshot,eligible,exclusion)
 values(p_group->>'id',(p_group->>'sourceId')::uuid,p_group->>'focus',p_group->>'version',p_group->'snapshot',
  (p_group->>'eligible')::boolean,p_group->>'exclusion')
 on conflict(id) do update set version=excluded.version,snapshot=excluded.snapshot,eligible=excluded.eligible,
  exclusion=excluded.exclusion,updated_at=now()
$$;
revoke all on function public.practice_library_index(jsonb) from public,anon,authenticated;
grant execute on function public.practice_library_index(jsonb) to service_role;

alter table skill_lab_private.operations alter column session_id drop not null;
alter table skill_lab_private.operations add column library_session_id uuid references skill_lab_private.library_sessions(id) on delete cascade;
alter table skill_lab_private.operations add constraint practice_operation_one_session check(num_nonnulls(session_id,library_session_id)=1);
create function public.practice_library_ai_reserve(p_auth uuid,p_session uuid,p_id uuid,p_kind text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid; s skill_lab_private.library_sessions; op skill_lab_private.operations; spend numeric; ctx jsonb;
begin
 select id into strict u from public.users where auth_id=p_auth;
 perform pg_advisory_xact_lock(hashtextextended(u::text,713));
 perform pg_advisory_xact_lock(713714);
 select * into strict s from skill_lab_private.library_sessions where id=p_session and user_id=u;
 if p_kind<>'help' then raise exception 'This practice uses question answers, not AI grading'; end if;
 if skill_lab_private.tier(u)='free' then raise exception 'AI explanations are available with Pro or Premium'; end if;
 if not(select library_enabled from skill_lab_private.settings) then raise exception 'AI help is unavailable'; end if;
 if s.stage=2 then raise exception 'Finish this set before asking for an explanation'; end if;
 select * into op from skill_lab_private.operations where id=p_id;
 if found then
  if op.user_id<>u or op.library_session_id is distinct from s.id then raise exception 'Request unavailable'; end if;
  return jsonb_build_object('state',op.state,'result',op.result);
 end if;
 update skill_lab_private.operations set state='failed',finished_at=now(),cost=reserved_cost where user_id=u and state='pending' and expires_at<=now();
 if exists(select 1 from skill_lab_private.operations where user_id=u and state='pending') then raise exception 'Your previous request is still being processed'; end if;
 if (select count(*) from skill_lab_private.operations where user_id=u and created_at>now()-interval '1 minute')>=6 then raise exception 'Please wait a minute before trying again'; end if;
 if (select count(*) from skill_lab_private.operations where library_session_id=s.id and state in('pending','complete'))>=3 then raise exception 'You have used the three AI questions included in this set'; end if;
 select coalesce(sum(coalesce(cost,reserved_cost)),0) into spend from skill_lab_private.operations where created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
 if spend+0.1>(select daily_budget from skill_lab_private.settings) then raise exception 'AI help is taking a break today. You can still use the saved tips.'; end if;
 ctx:=jsonb_build_object('focus',s.focus,'previous_mistake',s.snapshot->'mistake');
 if s.completed_at is not null then ctx:=ctx||jsonb_build_object('completed_questions',s.snapshot->'questions','result',s.result,'source',s.snapshot->'source'); end if;
 if coalesce((select enabled from public.skill_lab_memory where user_id=u),true) then
  ctx:=ctx||jsonb_build_object('previous_progress',coalesce((select jsonb_agg(to_jsonb(x)) from
   (select completed_at,result->'correct' as correct,result->'total' as total,familiarity,next_review_at from skill_lab_private.library_sessions
    where user_id=u and focus=s.focus and completed_at is not null order by completed_at desc limit 5)x),'[]'));
 end if;
 if octet_length(ctx::text)>24000 then ctx:=jsonb_build_object('focus',s.focus,'note','Source is too long. Give general strategy only; do not invent evidence.'); end if;
 -- Feedback after submission does not turn an independent answer into a helped answer.
 update skill_lab_private.library_sessions set assisted=true where id=s.id and completed_at is null;
 insert into skill_lab_private.operations(id,user_id,library_session_id,kind) values(p_id,u,s.id,'help');
 return jsonb_build_object('state','reserved','context',ctx,'user_id',u);
end $$;
revoke all on function public.practice_library_ai_reserve(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.practice_library_ai_reserve(uuid,uuid,uuid,text) to service_role;

alter function public.skill_lab_action(text,uuid,jsonb) rename to skill_lab_legacy_action;
revoke all on function public.skill_lab_legacy_action(text,uuid,jsonb) from public,anon,authenticated;
create function public.skill_lab_action(p_action text,p_session uuid default null,p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if p_action='start' and (select library_enabled from skill_lab_private.settings) then
  raise exception 'Start a question set from the new Practice Lab. Previous sessions can still be resumed.';
 end if;
 return public.skill_lab_legacy_action(p_action,p_session,p_data);
end $$;
revoke all on function public.skill_lab_action(text,uuid,jsonb) from public,anon;
grant execute on function public.skill_lab_action(text,uuid,jsonb) to authenticated;
reset lock_timeout;
reset statement_timeout;

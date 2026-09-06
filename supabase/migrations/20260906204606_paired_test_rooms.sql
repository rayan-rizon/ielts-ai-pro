-- Private, server-authoritative two-person practice. Feature flags default OFF.
create schema if not exists paired_private;
revoke all on schema paired_private from public;
grant usage on schema paired_private to authenticated, service_role;

create table public.paired_test_rooms (
 id uuid primary key default gen_random_uuid(), host_id uuid not null references public.users(id) on delete cascade,
 passage_id uuid not null references public.passages(id) on delete cascade, test_type text not null check(test_type in ('reading','listening')),
 title text not null, snapshot jsonb not null, content_version text not null,
 invite_token uuid not null unique default gen_random_uuid(), expires_at timestamptz not null default now()+interval '24 hours',
 state text not null default 'lobby' check(state in ('lobby','running','grading','complete','cancelled','expired')),
 started_at timestamptz, deadline timestamptz, duration_seconds integer not null check(duration_seconds between 60 and 7200),
 audio_durations jsonb not null default '[]', created_at timestamptz not null default now()
);
create table public.paired_test_members (
 room_id uuid not null references public.paired_test_rooms(id) on delete cascade,
 user_id uuid not null references public.users(id) on delete cascade, session_id uuid unique references public.test_sessions(id) on delete set null,
 active boolean not null default true, ready boolean not null default false,
 answers jsonb not null default '{}', revision bigint not null default 0,
 submitted_at timestamptz, finish_reason text check(finish_reason in ('submitted','deadline','left')),
 interrupted boolean not null default false, summary jsonb, joined_at timestamptz not null default now(),
 primary key(room_id,user_id)
);
create unique index paired_one_active_room_per_user on public.paired_test_members(user_id) where active;
create index paired_room_deadlines on public.paired_test_rooms(deadline) where state='running';
create table public.paired_test_limits (user_id uuid primary key references public.users(id) on delete cascade, window_start timestamptz not null, requests integer not null);
create table public.paired_test_events (id bigint generated always as identity primary key, room_id uuid references public.paired_test_rooms(id) on delete cascade, user_id uuid references public.users(id) on delete cascade, event text not null, created_at timestamptz not null default now());
alter table public.paired_test_rooms enable row level security;
alter table public.paired_test_members enable row level security;
alter table public.paired_test_limits enable row level security;
alter table public.paired_test_events enable row level security;
revoke all on public.paired_test_rooms, public.paired_test_members, public.paired_test_limits, public.paired_test_events from anon, authenticated;
grant all on public.paired_test_rooms, public.paired_test_members, public.paired_test_limits, public.paired_test_events to service_role;
grant usage on sequence public.paired_test_events_id_seq to service_role;
alter table public.test_sessions add column paired_room_id uuid references public.paired_test_rooms(id) on delete set null;

create function paired_private.review_released(room uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.paired_test_rooms r join public.paired_test_members m on m.room_id=r.id join public.users u on u.id=m.user_id where r.id=room and r.state='complete' and u.auth_id=auth.uid());
$$;
revoke all on function paired_private.review_released(uuid) from public;
grant execute on function paired_private.review_released(uuid) to authenticated;
-- Restrictive policies supplement (and never broaden) the existing owner/admin policies.
create policy paired_session_read on public.test_sessions as restrictive for select to authenticated using(paired_room_id is null or paired_private.review_released(paired_room_id));
create policy paired_session_insert on public.test_sessions as restrictive for insert to authenticated with check(paired_room_id is null);
create policy paired_session_update on public.test_sessions as restrictive for update to authenticated using(paired_room_id is null) with check(paired_room_id is null);
create policy paired_session_delete on public.test_sessions as restrictive for delete to authenticated using(paired_room_id is null);

create function paired_private.can_join_channel(topic text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.paired_test_members m join public.users u on u.id=m.user_id where topic='paired:'||m.room_id::text and u.auth_id=auth.uid());
$$;
revoke all on function paired_private.can_join_channel(text) from public;
grant execute on function paired_private.can_join_channel(text) to authenticated;
create policy paired_realtime_read on realtime.messages for select to authenticated using(paired_private.can_join_channel(realtime.topic()));
create policy paired_realtime_presence on realtime.messages for insert to authenticated with check(extension='presence' and paired_private.can_join_channel(realtime.topic()));

create function paired_private.entitled(actor uuid, passage uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.users u cross join public.passages p where u.id=actor and p.id=passage and p.is_active and (
 u.role='admin' or p.access_tier='free' or (u.subscription_tier in ('pro','premium') and (u.subscription_end_date is null or u.subscription_end_date>now()))));
$$;
revoke all on function paired_private.entitled(uuid,uuid) from public;

create function paired_private.close_due(room uuid) returns void language plpgsql security definer set search_path='' as $$
declare r public.paired_test_rooms;
begin
 select * into r from public.paired_test_rooms where id=room for update;
 if r.state='lobby' and r.expires_at<=clock_timestamp() then
  update public.paired_test_rooms set state='expired' where id=room;
  update public.paired_test_members set active=false where room_id=room;
 elsif r.state='running' and r.deadline<=clock_timestamp() then
  update public.paired_test_members set submitted_at=r.deadline, finish_reason='deadline' where room_id=room and submitted_at is null;
  update public.paired_test_rooms set state='grading' where id=room;
 end if;
end $$;
revoke all on function paired_private.close_due(uuid) from public;

-- This RPC is callable ONLY by the authenticated Edge Function's service client.
-- p_auth is obtained from getUser(), never from request JSON.
create function public.paired_test_action(p_auth uuid, p_action text, p_room uuid default null, p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 actor uuid; r public.paired_test_rooms; m public.paired_test_members; other public.paired_test_members;
 sid uuid; n integer; out_data jsonb; entry record;
begin
 select id into actor from public.users where auth_id=p_auth;
 if actor is null then raise exception 'Sign in to continue'; end if;
 if p_action in ('authorize','create','join','preview') then
  insert into public.paired_test_limits values(actor,now(),1) on conflict(user_id) do update set
  requests=case when paired_test_limits.window_start<now()-interval '1 hour' then 1 else paired_test_limits.requests+1 end,
  window_start=case when paired_test_limits.window_start<now()-interval '1 hour' then now() else paired_test_limits.window_start end returning requests into n;
  -- Return, rather than raise, so the failed-attempt counter commits.
  if n>20 then return jsonb_build_object('error','Too many invitations. Try again in an hour.'); end if;
 end if;
 if p_action in ('authorize','create','join') then
  perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
  for entry in select room_id from public.paired_test_members where user_id=actor and active loop perform paired_private.close_due(entry.room_id); end loop;
 end if;
 if p_action='authorize' then
  if not paired_private.entitled(actor,(p_data->>'passage_id')::uuid) then return jsonb_build_object('error','Your account does not have access to this test'); end if;
  if exists(select 1 from public.paired_test_members where user_id=actor and active) then return jsonb_build_object('error','Finish or leave your active room first'); end if;
  return '{}'::jsonb;
 elsif p_action='list' then
  for entry in select room_id from public.paired_test_members where user_id=actor and active loop perform paired_private.close_due(entry.room_id); end loop;
  return (select coalesce(jsonb_agg(x),'[]') from (select r.id,r.title,r.test_type,r.state,r.created_at from public.paired_test_rooms r join public.paired_test_members m on m.room_id=r.id where m.user_id=actor order by r.created_at desc limit 30) x);
 elsif p_action='create' then
  if p_data->>'consent' is distinct from 'true' then return jsonb_build_object('error','Accept score sharing to create a room'); end if;
  if not paired_private.entitled(actor,(p_data->>'passage_id')::uuid) then return jsonb_build_object('error','Your account does not have access to this test'); end if;
  if exists(select 1 from public.paired_test_members where user_id=actor and active) then return jsonb_build_object('error','Finish or leave your active room first'); end if;
  insert into public.paired_test_rooms(host_id,passage_id,test_type,title,snapshot,content_version,duration_seconds,audio_durations)
  values(actor,(p_data->>'passage_id')::uuid,p_data->>'test_type',p_data->>'title',p_data->'snapshot',p_data->>'content_version',(p_data->>'duration_seconds')::integer,p_data->'audio_durations') returning * into r;
  insert into public.paired_test_members(room_id,user_id) values(r.id,actor);
  insert into public.paired_test_events(room_id,user_id,event) values(r.id,actor,'created');
  p_room:=r.id;
 elsif p_action in ('preview','join') then
  select * into r from public.paired_test_rooms where invite_token=(p_data->>'token')::uuid for update;
  if not found then return jsonb_build_object('error','Invitation unavailable'); end if;
  p_room:=r.id;
  perform paired_private.close_due(p_room);
  select * into r from public.paired_test_rooms where id=p_room;
  if exists(select 1 from public.paired_test_members where room_id=p_room and user_id=actor) then p_action:='get';
  elsif r.state<>'lobby' or r.expires_at<=clock_timestamp() then return jsonb_build_object('error','Invitation expired or test already started');
  elsif p_action='preview' then return jsonb_build_object('id',r.id,'title',r.title,'test_type',r.test_type,'duration_seconds',r.duration_seconds,'can_access',paired_private.entitled(actor,r.passage_id),'preview',true);
  else
   if p_data->>'consent' is distinct from 'true' then return jsonb_build_object('error','Accept score sharing to join'); end if;
   if not paired_private.entitled(actor,r.passage_id) then return jsonb_build_object('error','Your account does not have access to this test'); end if;
   if (select count(*) from public.paired_test_members where room_id=p_room)>=2 then return jsonb_build_object('error','This room is full'); end if;
   if exists(select 1 from public.paired_test_members where user_id=actor and active) then return jsonb_build_object('error','Finish or leave your active room first'); end if;
   insert into public.paired_test_members(room_id,user_id) values(p_room,actor);
   insert into public.paired_test_events(room_id,user_id,event) values(p_room,actor,'joined');
  end if;
 end if;
 select * into r from public.paired_test_rooms where id=p_room for update;
 if not found then raise exception 'Room unavailable'; end if;
 select * into m from public.paired_test_members where room_id=p_room and user_id=actor;
 if not found then raise exception 'Room unavailable'; end if;
 perform paired_private.close_due(p_room);
 select * into r from public.paired_test_rooms where id=p_room;
 select * into m from public.paired_test_members where room_id=p_room and user_id=actor;
 if p_action='ready' then
  if r.state<>'lobby' then raise exception 'Room already started'; end if;
  if not paired_private.entitled(actor,r.passage_id) then raise exception 'Test access required'; end if;
  update public.paired_test_members set ready=coalesce((p_data->>'ready')::boolean,false) where room_id=p_room and user_id=actor;
 elsif p_action='start' and r.state='lobby' then
  if actor<>r.host_id or (select count(*) from public.paired_test_members where room_id=p_room and ready)<>2 then raise exception 'Both students must be ready'; end if;
  if exists(select 1 from public.paired_test_members where room_id=p_room and not paired_private.entitled(user_id,r.passage_id)) then raise exception 'Both students need test access'; end if;
  update public.paired_test_rooms set state='running',started_at=now()+interval '5 seconds',deadline=now()+interval '5 seconds'+make_interval(secs=>duration_seconds) where id=p_room returning * into r;
  for other in select * from public.paired_test_members where room_id=p_room loop
   insert into public.test_sessions(user_id,passage_id,test_type,test_mode,started_at,duration_minutes,paired_room_id,content_data)
   values(other.user_id,r.passage_id,r.test_type,'mock',r.started_at,ceil(r.duration_seconds/60.0),r.id,jsonb_build_object('paired_room_id',r.id,'duration_seconds',r.duration_seconds,'audio_durations',r.audio_durations,'review_seconds',120)) returning id into sid;
   update public.paired_test_members set session_id=sid where room_id=p_room and user_id=other.user_id;
  end loop;
  insert into public.paired_test_events(room_id,user_id,event) values(p_room,actor,'started');
 elsif p_action in ('save','submit') then
  if r.state='running' and clock_timestamp()>=r.started_at and m.submitted_at is null then
   if (p_data->>'revision')::bigint is distinct from m.revision then return jsonb_build_object('error','Answers changed in another tab. Reload to continue.','conflict',true); end if;
   if exists (
     select 1 from jsonb_each(p_data->'answers') e
     where jsonb_typeof(e.value)='array' and not exists (
       select 1 from jsonb_array_elements(r.snapshot->'questions') q
       where q->>'id'=e.key and q->>'type'='multiple_choice'
       and jsonb_array_length(e.value)<=coalesce((q->>'question_count')::integer,(q->>'_displaySize')::integer,1)
     )
   ) then raise exception 'Invalid selection count or answer type'; end if;
   if p_data ? 'answers' then
    update public.paired_test_members set answers=p_data->'answers', revision=revision+1 where room_id=p_room and user_id=actor;
   end if;
   if p_action='submit' then
    update public.paired_test_members set submitted_at=clock_timestamp(),finish_reason='submitted' where room_id=p_room and user_id=actor;
    insert into public.paired_test_events(room_id,user_id,event) values(p_room,actor,'submitted');
   end if;
  end if;
 elsif p_action='review' then
  if r.state<>'complete' then raise exception 'Results are not ready'; end if;
  if not exists(select 1 from public.paired_test_events where room_id=p_room and user_id=actor and event='reviewed') then insert into public.paired_test_events(room_id,user_id,event) values(p_room,actor,'reviewed'); end if;
 elsif p_action='interrupted' then
  update public.paired_test_members set interrupted=true where room_id=p_room and user_id=actor;
 elsif p_action='leave' then
  if r.state='lobby' then
   update public.paired_test_rooms set state='cancelled' where id=p_room;
   update public.paired_test_members set active=false where room_id=p_room;
  elsif r.state='running' and m.submitted_at is null then
   update public.paired_test_members set submitted_at=clock_timestamp(),finish_reason='left',interrupted=true where room_id=p_room and user_id=actor;
  end if;
 elsif p_action='grade' then
  if m.submitted_at is null or r.state not in ('grading','complete') then raise exception 'Both submissions must be locked before grading'; end if;
  if m.summary is null then
   update public.paired_test_members set summary=p_data->'summary' where room_id=p_room and user_id=actor;
   update public.test_sessions set is_completed=true,score=(p_data->'summary'->>'bandScore')::numeric,band_score=(p_data->'summary'->>'bandScore')::numeric,
    completed_at=m.submitted_at,user_responses=m.answers,actual_duration_seconds=greatest(1,extract(epoch from m.submitted_at-r.started_at)::integer),
    content_data=coalesce(content_data,'{}')||p_data->'result'||jsonb_build_object('analysisSchemaVersion',2,'savedAnswers',m.answers,'paired_room_id',r.id,'finish_reason',m.finish_reason,'interrupted',m.interrupted)
    where id=m.session_id and is_completed=false;
  end if;
 elsif p_action not in ('get','create','join','preview','start') then raise exception 'Unknown action';
 end if;
 if r.state in ('running','grading') and not exists(select 1 from public.paired_test_members where room_id=p_room and submitted_at is null) then
  update public.paired_test_rooms set state='grading' where id=p_room;
  if not exists(select 1 from public.paired_test_members where room_id=p_room and summary is null) then
   update public.paired_test_rooms set state='complete' where id=p_room;
   update public.paired_test_members set active=false where room_id=p_room;
   if r.state<>'complete' then insert into public.paired_test_events(room_id,event) values(p_room,'completed'); end if;
  end if;
 end if;
 if p_action not in ('get','save') then perform realtime.send('{}'::jsonb,'changed','paired:'||p_room::text,true); end if;
 select to_jsonb(room) into out_data from public.paired_test_rooms room where id=p_room;
 return out_data||jsonb_build_object('actor_id',actor,'server_now',clock_timestamp(),'members',(select jsonb_agg(to_jsonb(member)||jsonb_build_object('display_name',coalesce(u.full_name,'Student'),'auth_id',u.auth_id)) from public.paired_test_members member join public.users u on u.id=member.user_id where member.room_id=p_room));
end $$;
revoke all on function public.paired_test_action(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.paired_test_action(uuid,text,uuid,jsonb) to service_role;

-- Deadlines lock answers even when both browsers are closed. Grading is retried on the next authenticated room read.
create function paired_private.expire_rooms() returns void language plpgsql security definer set search_path='' as $$
declare entry record;
begin
 for entry in select id from public.paired_test_rooms where (state='running' and deadline<=now()) or (state='lobby' and expires_at<=now()) order by id limit 200 loop
  perform paired_private.close_due(entry.id);
 end loop;
end $$;
revoke all on function paired_private.expire_rooms() from public;
select cron.schedule('paired-test-deadlines','* * * * *','select paired_private.expire_rooms()');

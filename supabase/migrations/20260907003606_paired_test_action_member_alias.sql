-- The `m` and `r` record variables collided with the list query's table aliases.
-- Use distinct aliases for both tables, keeping variable-conflict errors enabled.
create or replace function public.paired_test_action(p_auth uuid, p_action text, p_room uuid default null, p_data jsonb default '{}') returns jsonb
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
  return (select coalesce(jsonb_agg(x),'[]') from (select room_row.id,room_row.title,room_row.test_type,room_row.state,room_row.created_at from public.paired_test_rooms room_row join public.paired_test_members member_row on member_row.room_id=room_row.id where member_row.user_id=actor order by room_row.created_at desc limit 30) x);
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

-- Execute the formerly failing branch. Roll back any expiry effects from this
-- probe while retaining the function replacement. Other errors abort migration.
do $test$
declare
 test_auth uuid;
 test_result jsonb;
begin
 select auth_id into test_auth from public.users where auth_id is not null limit 1;
 if test_auth is null then raise exception 'Paired RPC smoke test requires a user'; end if;
 begin
  test_result := public.paired_test_action(test_auth, 'list');
  if jsonb_typeof(test_result) is distinct from 'array' then
   raise exception 'Paired RPC list must return an array';
  end if;
  raise sqlstate 'PT001' using message = 'Rollback paired RPC smoke test effects';
 exception when sqlstate 'PT001' then
  null;
 end;
end $test$;

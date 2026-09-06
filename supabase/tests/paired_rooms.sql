-- Run against an isolated database AFTER the migration. Transaction rolls back fixtures.
begin;
insert into auth.users(id,email) values
 ('b0000000-0000-4000-8000-000000000001','paired-one@example.invalid'),
 ('b0000000-0000-4000-8000-000000000002','paired-two@example.invalid'),
 ('b0000000-0000-4000-8000-000000000003','paired-three@example.invalid');
-- Supabase may already create profiles through its auth trigger.
insert into public.users(id,auth_id,email,full_name) values
 ('a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','paired-one@example.invalid','One'),
 ('a0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000002','paired-two@example.invalid','Two'),
 ('a0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000003','paired-three@example.invalid','Three')
 on conflict(auth_id) do nothing;
insert into public.passages(id,title,test_type,test_format,topic,is_active,access_tier) values('c0000000-0000-4000-8000-000000000001','Paired fixture','reading','academic','test',true,'free');
create temporary table paired_fixture(room uuid,token uuid);
do $$
declare r jsonb; joined jsonb; rid uuid; invitation uuid; result jsonb; a uuid:='b0000000-0000-4000-8000-000000000001'; b uuid:='b0000000-0000-4000-8000-000000000002'; c uuid:='b0000000-0000-4000-8000-000000000003';
begin
 r:=public.paired_test_action(a,'create',null,'{"passage_id":"c0000000-0000-4000-8000-000000000001","test_type":"reading","title":"Fixture","snapshot":{},"content_version":"fixture","duration_seconds":3600,"audio_durations":[],"consent":true}');
 rid:=(r->>'id')::uuid;invitation:=(r->>'invite_token')::uuid;
 assert rid is not null, 'Room not created';
 insert into paired_fixture values(rid,invitation);
 result:=public.paired_test_action(b,'join',null,jsonb_build_object('token',invitation));
 assert result ? 'error','Missing consent accepted';
 joined:=public.paired_test_action(b,'join',null,jsonb_build_object('token',invitation,'consent',true));
 assert jsonb_array_length(joined->'members')=2,'Join failed';
 result:=public.paired_test_action(c,'join',null,jsonb_build_object('token',invitation,'consent',true));
 assert result ? 'error','Third member accepted';
 begin perform public.paired_test_action(c,'get',rid);raise exception 'Unauthorized read accepted';exception when raise_exception then assert sqlerrm='Room unavailable';end;
 begin perform public.paired_test_action(a,'start',rid);raise exception 'Started without readiness';exception when raise_exception then assert sqlerrm='Both students must be ready';end;
 perform public.paired_test_action(a,'ready',rid,'{"ready":true}');perform public.paired_test_action(b,'ready',rid,'{"ready":true}');
 perform public.paired_test_action(a,'start',rid);perform public.paired_test_action(a,'start',rid);
 assert (select count(*) from public.test_sessions where paired_room_id=rid)=2,'Duplicate attempts';
 -- Advance the shared timeline without sleeping.
 update public.paired_test_rooms set started_at=now()-interval '10 seconds',deadline=now()+interval '1 hour' where id=rid;
 begin perform public.paired_test_action(a,'save',rid,'{"revision":0,"answers":{"q1":["A","B"]}}');raise exception 'Bad array accepted';exception when raise_exception then assert sqlerrm='Invalid selection count or answer type';end;
 perform public.paired_test_action(a,'save',rid,'{"revision":0,"answers":{"q1":"A"}}');
 result:=public.paired_test_action(a,'save',rid,'{"revision":0,"answers":{"q1":"B"}}');assert result ? 'conflict','Stale tab overwrote answers';
 perform public.paired_test_action(a,'submit',rid,'{"revision":1,"answers":{"q1":"A"}}');
 perform public.paired_test_action(a,'save',rid,'{"revision":2,"answers":{"q1":"B"}}');
 assert (select answers->>'q1' from public.paired_test_members where room_id=rid and user_id=(select id from public.users where auth_id='b0000000-0000-4000-8000-000000000001'))='A','Locked answer changed';
 begin perform public.paired_test_action(a,'grade',rid,'{"summary":{"bandScore":7},"result":{}}');raise exception 'Early grading accepted';exception when raise_exception then assert sqlerrm='Both submissions must be locked before grading';end;
 assert (select state from public.paired_test_rooms where id=rid)='running','Released results before partner ended';
 perform set_config('test.uid',a::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 execute 'set local role authenticated';
 assert (select count(*) from public.test_sessions)=0,'Early personal score leaked through session table';
 execute 'reset role';

 update public.paired_test_rooms set deadline=now()-interval '1 second' where id=rid;
 perform public.paired_test_action(b,'get',rid);
 assert (select finish_reason from public.paired_test_members where room_id=rid and user_id=(select id from public.users where auth_id='b0000000-0000-4000-8000-000000000002'))='deadline','Deadline not enforced';
 perform public.paired_test_action(a,'grade',rid,'{"summary":{"bandScore":7},"result":{}}');
 perform public.paired_test_action(b,'grade',rid,'{"summary":{"bandScore":5},"result":{}}');
 perform public.paired_test_action(b,'grade',rid,'{"summary":{"bandScore":9},"result":{}}');
 assert (select score from public.test_sessions where user_id=(select id from public.users where auth_id='b0000000-0000-4000-8000-000000000002') and paired_room_id=rid)=5,'Duplicate grading changed score';
 assert (select state from public.paired_test_rooms where id=rid)='complete','Room not completed';
 assert not exists(select 1 from public.paired_test_members where room_id=rid and active),'Active slot not released';
end $$;
do $$
declare r jsonb; rid uuid; token uuid; a uuid:='b0000000-0000-4000-8000-000000000001'; b uuid:='b0000000-0000-4000-8000-000000000002'; data jsonb:='{"passage_id":"c0000000-0000-4000-8000-000000000001","test_type":"reading","title":"Fixture","snapshot":{},"content_version":"fixture","duration_seconds":3600,"audio_durations":[],"consent":true}';
begin
 r:=public.paired_test_action(a,'create',null,data-'consent'); assert r ? 'error','Creator consent missing';
 r:=public.paired_test_action(a,'create',null,data);rid:=(r->>'id')::uuid;token:=(r->>'invite_token')::uuid;
 update public.paired_test_rooms set expires_at=clock_timestamp()-interval '1 second' where id=rid;
 r:=public.paired_test_action(b,'join',null,jsonb_build_object('token',token,'consent',true));assert r ? 'error','Expired invite accepted';
 assert not exists(select 1 from public.paired_test_members where room_id=rid and active),'Expired active slot retained';
 r:=public.paired_test_action(a,'create',null,data);rid:=(r->>'id')::uuid;token:=(r->>'invite_token')::uuid;
 perform public.paired_test_action(a,'leave',rid);
 r:=public.paired_test_action(b,'join',null,jsonb_build_object('token',token,'consent',true));assert r ? 'error','Revoked invitation accepted';
 update public.passages set access_tier='pro' where id='c0000000-0000-4000-8000-000000000001';
 r:=public.paired_test_action(a,'create',null,data);assert r ? 'error','Free account bypassed entitlement';
 update public.passages set access_tier='free' where id='c0000000-0000-4000-8000-000000000001';
 r:=public.paired_test_action(a,'create',null,data);rid:=(r->>'id')::uuid;token:=(r->>'invite_token')::uuid;
 perform public.paired_test_action(b,'join',null,jsonb_build_object('token',token,'consent',true));
 perform public.paired_test_action(a,'ready',rid,'{"ready":true}');perform public.paired_test_action(b,'ready',rid,'{"ready":true}');
 update public.passages set access_tier='pro' where id='c0000000-0000-4000-8000-000000000001';
 begin perform public.paired_test_action(a,'start',rid);raise exception 'Access not checked at start';exception when raise_exception then assert sqlerrm='Both students need test access';end;
 perform public.paired_test_action(a,'leave',rid);
end $$;
-- These checks execute as a real authenticated database role, not a service client.
set local role authenticated;
select set_config('test.uid','b0000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$
begin
 assert (select count(*) from public.test_sessions)=1,'Can read partner private attempt';
 update public.test_sessions set score=9 where paired_room_id is not null;
 assert not found,'Can alter a paired score';
 begin perform public.paired_test_action('b0000000-0000-4000-8000-000000000001','get',null);raise exception 'Service RPC exposed';exception when insufficient_privilege then null;end;
 begin perform count(*) from public.paired_test_members;raise exception 'Private members exposed';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;

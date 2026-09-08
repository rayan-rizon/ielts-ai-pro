-- Disposable database only: fake identities and test content, rolled back.
begin;
do $$
begin
 if has_function_privilege('authenticated','public.objective_test_state(uuid,text,uuid,jsonb)','execute')
 or has_function_privilege('anon','public.objective_test_state(uuid,text,uuid,jsonb)','execute') then
  raise exception 'Private test endpoint is accessible to a client role'; end if;
 if has_schema_privilege('authenticated','objective_private','usage') then raise exception 'Private schema exposed'; end if;
end $$;
insert into public.users(id,auth_id,role,subscription_tier)
 values('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','user','free'),
 ('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','user','free');
insert into public.passages(id,title,test_type,test_format,topic,is_active,access_tier,content)
 values('30000000-0000-4000-8000-000000000001','TEST FIXTURE','reading','academic','test fixture',true,'free','[]');
insert into public.test_sessions(id,user_id,passage_id,test_type,is_completed,content_data)
 values('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','reading',false,'{}');
do $$
declare first_snapshot jsonb; second_snapshot jsonb; first_result jsonb; second_result jsonb;
begin
 first_snapshot:=public.objective_test_state('20000000-0000-4000-8000-000000000001','load','40000000-0000-4000-8000-000000000001',
  '{"snapshot":{"testData":{"id":"30000000-0000-4000-8000-000000000001"},"version":1}}');
 second_snapshot:=public.objective_test_state('20000000-0000-4000-8000-000000000001','load','40000000-0000-4000-8000-000000000001',
  '{"snapshot":{"testData":{"id":"30000000-0000-4000-8000-000000000001"},"version":2}}');
 if first_snapshot->'snapshot' is distinct from second_snapshot->'snapshot' then raise exception 'Snapshot changed'; end if;
 begin
  perform public.objective_test_state('20000000-0000-4000-8000-000000000002','authorize','40000000-0000-4000-8000-000000000001');
  raise exception 'Cross-user access succeeded';
 exception when no_data_found then null; end;
 first_result:=public.objective_test_state('20000000-0000-4000-8000-000000000001','save','40000000-0000-4000-8000-000000000001',
  '{"answers":{"q":"A"},"expected_revision":0,"request_id":"50000000-0000-4000-8000-000000000001","metadata":{"notes":{"q":"My note"},"serverScored":true,"score":9}}');
 second_result:=public.objective_test_state('20000000-0000-4000-8000-000000000001','save','40000000-0000-4000-8000-000000000001',
  '{"answers":{"q":"A"},"expected_revision":0,"request_id":"50000000-0000-4000-8000-000000000001"}');
 if first_result-'completed_now' is distinct from second_result-'completed_now' then raise exception 'Save replay changed the attempt'; end if;
 if exists(select 1 from public.test_sessions where id='40000000-0000-4000-8000-000000000001' and (content_data ? 'serverScored' or content_data ? 'score')) then raise exception 'Forged result metadata persisted'; end if;
 begin
  perform public.objective_test_state('20000000-0000-4000-8000-000000000001','save','40000000-0000-4000-8000-000000000001',
   '{"answers":{"q":"B"},"expected_revision":0,"request_id":"50000000-0000-4000-8000-000000000002"}');
  raise exception 'Stale save succeeded';
 exception when raise_exception then
  if sqlerrm not like 'This test changed in another tab%' then raise; end if;
 end;
 first_result:=public.objective_test_state('20000000-0000-4000-8000-000000000001','submit','40000000-0000-4000-8000-000000000001',
  '{"answers":{"q":"A"},"expected_revision":1,"result":{"bandScore":5,"correctAnswers":16,"totalQuestions":40}}');
 second_result:=public.objective_test_state('20000000-0000-4000-8000-000000000001','submit','40000000-0000-4000-8000-000000000001',
  '{"answers":{"q":"B"},"result":{"bandScore":9,"correctAnswers":40,"totalQuestions":40}}');
 if first_result-'completed_now' is distinct from second_result-'completed_now' then raise exception 'Submission replay changed result'; end if;
end $$;
grant update,select on public.test_sessions to authenticated;
set local role authenticated;
do $$ begin
 begin
  update public.test_sessions set score=9 where id='40000000-0000-4000-8000-000000000001';
  raise exception 'Direct score forgery succeeded';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;

-- Run only against the isolated fixture in helpers/scalability_fixture.sql.
begin;
insert into auth.users values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into public.users values('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002');
insert into public.passages values('20000000-0000-0000-0000-000000000001','Test','Cambridge','academic');
insert into public.test_sessions(id,user_id,passage_id,test_type,is_completed,created_at,completed_at,content_data,user_responses)
values('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','reading',true,'2026-01-01','2026-01-01','{"essay":"private","total_questions":40}', '{"1":"old"}'),
('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','reading',false,'2026-01-02',null,'{"total_questions":20,"paired_room_id":"40000000-0000-0000-0000-000000000001"}','{"1":"a","2":"b"}'),
('30000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','writing',true,'2026-01-03','2026-01-01','{"ai_feedbacks":{"Task 2":{"summary":"prose","criteriaScores":{"TaskResponse":7}}},"criteriaScores":{"grammar":6},"time_remaining":100}', '[]');
insert into public.grammar_attempts(user_id,mode,completion_state,correct_count,total_questions,completed_at)
values('10000000-0000-0000-0000-000000000001','transfer','completed',2,3,'2026-01-03'),
('10000000-0000-0000-0000-000000000001','practice','completed',1,2,'2026-01-01');
update public.test_sessions set evaluation_status='pending',content_data=content_data||'{"evaluationRequestedAt":"2026-01-03T00:00:00Z"}' where test_type='writing';
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $$ declare v jsonb; begin
  v:=public.get_learner_latest_sessions('10000000-0000-0000-0000-000000000001','reading',array['20000000-0000-0000-0000-000000000001']::uuid[]);
  assert jsonb_array_length(v)=1;
  assert v->0->>'id'='30000000-0000-0000-0000-000000000002';
  assert (v->0->>'completed_questions')::int=2;
  assert v->0->>'paired_room_id'='40000000-0000-0000-0000-000000000001';
  assert not(v->0 ? 'user_responses');
  v:=public.get_learner_analytics_page('10000000-0000-0000-0000-000000000001',null,null,null,1);
  assert v->0->>'id'='30000000-0000-0000-0000-000000000003';
  assert v->0->'content_data'->'ai_feedbacks'->'Task 2'->'criteriaScores'->>'TaskResponse'='7';
  assert not(v->0->'content_data'->'ai_feedbacks'->'Task 2' ? 'summary');
  assert jsonb_array_length(public.get_learner_analytics_page('10000000-0000-0000-0000-000000000001',null,(v->0->>'cursor_date')::timestamptz,(v->0->>'id')::uuid,1))=1;
  v:=public.get_learner_grammar_summary('10000000-0000-0000-0000-000000000001','2026-01-02');
  assert v->>'completedAttempts'='1' and v->>'questions'='3' and v->>'correct'='2';
  begin
    perform public.get_learner_latest_sessions('10000000-0000-0000-0000-000000000002','reading',array[]::uuid[]);
    raise exception 'Other learner accepted';
  exception when insufficient_privilege then null; end;
  assert not has_function_privilege('anon','public.get_learner_latest_sessions(uuid,text,uuid[])','execute');
  assert not has_function_privilege('authenticated','public.claim_writing_feedback(uuid)','execute');
  assert not has_schema_privilege('authenticated','ai_work','usage');
end $$;
reset role;
do $$ declare v_job jsonb; v_again jsonb; v_claim jsonb; v_slot uuid:=gen_random_uuid(); v_second uuid:=gen_random_uuid(); v_result jsonb:='{"success":true,"data":{"overallBand":7}}'; begin
  v_job:=public.enqueue_writing_feedback('00000000-0000-0000-0000-000000000001',repeat('a',64),'{"writingText":"Essay","taskPrompt":"Prompt","taskType":"Task 2","sessionId":"30000000-0000-0000-0000-000000000003","evaluationRequestedAt":"2026-01-03T00:00:00Z"}');
  v_again:=public.enqueue_writing_feedback('00000000-0000-0000-0000-000000000001',repeat('a',64),'{"writingText":"Essay","taskType":"Task 2"}');
  assert v_again->>'jobId'=v_job->>'jobId';
  assert (select count(*) from public.ai_api_usage)=1;
  update ai_work.worker_slots set token=v_slot,expires_at=now()+interval '30 seconds' where id=1;
  v_claim:=public.claim_writing_feedback(v_slot);
  assert v_claim->>'id'=v_job->>'jobId';
  assert (select count(*) from pgmq.q_writing_feedback)=1;
  assert not public.finish_writing_feedback((v_job->>'jobId')::uuid,v_second,200,v_result,false);
  assert public.finish_writing_feedback((v_job->>'jobId')::uuid,v_slot,503,'{"error":"Retry"}',true);
  assert (select state='queued' and attempts=1 and payload->>'writingText'='Essay' from ai_work.writing_jobs where id=(v_job->>'jobId')::uuid);
  update pgmq.q_writing_feedback set vt=now()-interval '1 second';
  update ai_work.worker_slots set token=v_second,expires_at=now()+interval '30 seconds' where id=1;
  v_claim:=public.claim_writing_feedback(v_second);
  assert v_claim->>'attempts'='2';
  assert public.finish_writing_feedback((v_job->>'jobId')::uuid,v_second,200,v_result,false);
  assert (select count(*) from pgmq.q_writing_feedback)=0;
  assert (select payload='{}'::jsonb from ai_work.writing_jobs where id=(v_job->>'jobId')::uuid);
  assert (select content_data->'ai_feedbacks'->'Task 2'->>'overallBand'='7' from public.test_sessions where id='30000000-0000-0000-0000-000000000003');
  assert public.get_writing_feedback_job((v_job->>'jobId')::uuid)->'response'=v_result;
  v_job:=public.enqueue_writing_feedback('00000000-0000-0000-0000-000000000001',repeat('b',64),'{"writingText":"Essay","taskPrompt":"Prompt","taskType":"Task 2","sessionId":"30000000-0000-0000-0000-000000000003","evaluationRequestedAt":"2026-01-03T00:00:00Z"}');
  update public.test_sessions set content_data=content_data||'{"evaluationRequestedAt":"new-generation"}' where test_type='writing';
  update ai_work.worker_slots set token=v_slot,expires_at=now()+interval '30 seconds' where id=1;
  v_claim:=public.claim_writing_feedback(v_slot);
  assert public.finish_writing_feedback((v_job->>'jobId')::uuid,v_slot,200,'{"success":true,"data":{"overallBand":9}}',false);
  assert (select content_data->'ai_feedbacks'->'Task 2'->>'overallBand'='7' from public.test_sessions where id='30000000-0000-0000-0000-000000000003'), 'Late result overwrote newer session generation';
  v_job:=public.enqueue_writing_feedback('00000000-0000-0000-0000-000000000001',repeat('c',64),'{"writingText":"Essay","taskPrompt":"Prompt","taskType":"Task 2"}');
  perform public.finalize_ai_api_usage((select reservation_id from ai_work.writing_jobs where id=(v_job->>'jobId')::uuid),0,false,jsonb_build_object('response',v_result),'completed');
  update ai_work.writing_jobs set attempts=3,state='processing',lease_until=now()-interval '1 second' where id=(v_job->>'jobId')::uuid;
  update ai_work.worker_slots set token=v_slot,expires_at=now()+interval '30 seconds' where id=1;
  assert public.claim_writing_feedback(v_slot) is null;
  assert (select state='completed' and response=v_result from ai_work.writing_jobs where id=(v_job->>'jobId')::uuid), 'Settled report was discarded at crash recovery limit';
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
  begin
    perform public.get_writing_feedback_job((v_job->>'jobId')::uuid);
    raise exception 'Other learner read job';
  exception when insufficient_privilege then null; end;
  assert not public.verify_writing_worker('bogus');
  assert not has_function_privilege('anon','public.verify_writing_worker(text)','execute');
end $$;
rollback;
select 'Scalability SQL ownership, cursor, payload, reservation, retry and fencing checks passed' as result;

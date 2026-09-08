-- Isolated/local database only, after the two Skill Lab migrations. Fixtures roll back.
begin;
-- Explicit test IDs keep assertions readable; roll back everything, including trigger side effects.
insert into auth.users(id,email) values
 ('b7100000-0000-4000-8000-000000000001','lab-one@example.invalid'),
 ('b7100000-0000-4000-8000-000000000002','lab-two@example.invalid');
delete from public.users where auth_id in ('b7100000-0000-4000-8000-000000000001','b7100000-0000-4000-8000-000000000002');
insert into public.users(id,auth_id,email,subscription_tier) values
 ('a7100000-0000-4000-8000-000000000001','b7100000-0000-4000-8000-000000000001','lab-one@example.invalid','free'),
 ('a7100000-0000-4000-8000-000000000002','b7100000-0000-4000-8000-000000000002','lab-two@example.invalid','pro');
update skill_lab_private.settings set enabled=true;
select set_config('request.jwt.claim.sub','b7100000-0000-4000-8000-000000000001',true);
do $$
declare r jsonb;s uuid;other uuid;answer jsonb;item jsonb;context jsonb;id uuid:=gen_random_uuid();
begin
 r:=public.skill_lab_action('start',null,jsonb_build_object('skill','reading_true_false_not_given','request_id',id));s:=(r->>'id')::uuid;
 assert s is not null,'No session';
 assert not (r->'lesson' ? 'items'),'Answer bank leaked';
 r:=public.skill_lab_action('start',null,jsonb_build_object('skill','reading_true_false_not_given','request_id',id));
 assert (r->>'id')::uuid=s,'Retry charged twice';
 assert (select count(*) from public.skill_lab_sessions where user_id='a7100000-0000-4000-8000-000000000001')=1,'Duplicate session';
 r:=public.skill_lab_action('next',s,'{"position":-1}');
 assert not(r->'item' ? 'answer') and not(r->'item' ? 'explanation'),'Answer leaked before submission';
 r:=public.skill_lab_action('next',s,'{"position":-1}');assert (r->>'position')::integer=0,'Retry skipped question';
 begin perform public.skill_lab_action('next',s,'{"position":0}');raise exception 'skip accepted';exception when raise_exception then assert sqlerrm='Answer this question first';end;
 for i in 0..5 loop
  select value into item from skill_lab_private.lessons l,jsonb_array_elements(l.content->'items') where l.skill='reading_true_false_not_given' and value->>'id'=r->'item'->>'id';
  r:=public.skill_lab_action('answer',s,jsonb_build_object('item_id',item->>'id','answer',item->'answer','evidence',item->>'evidence_answer'));
  assert (r->'response'->>'correct')::boolean,'Correct response misgraded';
  assert r->'item' ? 'explanation','Feedback missing';
  r:=public.skill_lab_action('answer',s,jsonb_build_object('item_id',item->>'id','answer','wrong'));
  assert (r->'response'->>'correct')::boolean,'First answer overwritten';
  r:=public.skill_lab_action('next',s,jsonb_build_object('position',i));
 end loop;
 assert (r->>'independent_count')::integer=5,'Guided answer counted';
 assert not(r->>'retained')::boolean,'One session falsely retained';
 assert (select practice_count from public.skill_proficiency where user_id='a7100000-0000-4000-8000-000000000001')=5,'Progress not connected';
 perform public.skill_lab_action('next',s,'{"position":5}');
 assert (select practice_count from public.skill_proficiency where user_id='a7100000-0000-4000-8000-000000000001')=5,'Completion replay inflated evidence';
 r:=public.skill_lab_action('start',null,jsonb_build_object('skill','reading_true_false_not_given','request_id',gen_random_uuid()));other:=(r->>'id')::uuid;
 assert not exists(select 1 from public.skill_lab_sessions a,public.skill_lab_sessions b,jsonb_array_elements_text(a.item_ids) aa,jsonb_array_elements_text(b.item_ids) bb where a.id=s and b.id=other and aa=bb and aa not like '%-0'),'Fresh check repeats content';
 begin perform public.skill_lab_action('start',null,jsonb_build_object('skill','reading_true_false_not_given','request_id',gen_random_uuid()));raise exception 'quota bypass';exception when raise_exception then assert sqlerrm like 'You have used today%';end;
 begin perform public.skill_lab_ai_reserve('b7100000-0000-4000-8000-000000000001',other,gen_random_uuid(),'help');raise exception 'free AI bypass';exception when raise_exception then assert sqlerrm='AI help is available with Pro or Premium';end;
 perform public.skill_lab_action('memory',null,'{"operation":"reset"}');
 assert not(select enabled from public.skill_lab_memory where user_id='a7100000-0000-4000-8000-000000000001'),'Reset did not disable memory';
 assert (select count(*) from public.skill_lab_sessions where user_id='a7100000-0000-4000-8000-000000000001')=2,'Reset deleted learning history';
 perform set_config('request.jwt.claim.sub','b7100000-0000-4000-8000-000000000002',true);
 begin perform public.skill_lab_action('get',s);raise exception 'owner bypass';exception when insufficient_privilege then null;end;
 r:=public.skill_lab_action('start',null,jsonb_build_object('skill','writing_cohesion','request_id',gen_random_uuid()));s:=(r->>'id')::uuid;
 context:=public.skill_lab_ai_reserve('b7100000-0000-4000-8000-000000000002',s,id,'help');
 assert context->>'state'='reserved','AI reservation failed';
 assert not(context->'context' ? 'items'),'Teacher got independent answers';
 begin perform public.skill_lab_ai_reserve('b7100000-0000-4000-8000-000000000002',s,gen_random_uuid(),'help');raise exception 'concurrent AI accepted';exception when raise_exception then assert sqlerrm='Your previous request is still being processed';end;
 perform public.skill_lab_ai_finish(id,'{"explanation":"Try the example."}',0.01,10,'fixture',100,true);
 context:=public.skill_lab_ai_reserve('b7100000-0000-4000-8000-000000000002',s,id,'help');assert context->>'state'='complete','AI replay not idempotent';
 update skill_lab_private.settings set daily_budget=0;
 begin perform public.skill_lab_ai_reserve('b7100000-0000-4000-8000-000000000002',s,gen_random_uuid(),'help');raise exception 'budget bypass';exception when raise_exception then assert sqlerrm like 'AI help is taking a break%';end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','b7100000-0000-4000-8000-000000000002',true);
do $$
begin
 assert (select count(*) from public.skill_lab_sessions)=1,'RLS leaked another learner';
 begin execute 'select * from skill_lab_private.lessons';raise exception 'keys readable';exception when insufficient_privilege then null;end;
 begin insert into public.skill_lab_sessions(user_id,skill,content_version,request_id,item_ids) values('a7100000-0000-4000-8000-000000000002','x',1,gen_random_uuid(),'[]');raise exception 'direct session write';exception when insufficient_privilege then null;end;
 begin perform public.skill_lab_ai_reserve('b7100000-0000-4000-8000-000000000002',gen_random_uuid(),gen_random_uuid(),'help');raise exception 'service RPC exposed';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$begin
 begin perform public.skill_lab_action('dashboard');raise exception 'anonymous RPC';exception when insufficient_privilege then null;end;
 begin perform * from public.skill_lab_sessions;raise exception 'anonymous read';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;

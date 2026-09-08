begin;
insert into auth.users(id,email) values('b9100000-0000-4000-8000-000000000001','lab-review@example.invalid');
delete from public.users where auth_id='b9100000-0000-4000-8000-000000000001';
insert into public.users(id,auth_id,email,subscription_tier) values('a9100000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000001','lab-review@example.invalid','premium');
update skill_lab_private.settings set enabled=true;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000001',true);
create function pg_temp.finish_lesson(p_correct boolean) returns jsonb language plpgsql as $$
declare r jsonb;q jsonb;session_id uuid;
begin
 r:=public.skill_lab_action('start',null,jsonb_build_object('skill','reading_true_false_not_given','mode','check','request_id',gen_random_uuid()));
 session_id:=(r->>'id')::uuid;
 assert r->'item'->>'stage'='independent','Starting check showed teaching';
 begin perform public.skill_lab_ai_reserve('b9100000-0000-4000-8000-000000000001',session_id,gen_random_uuid(),'help');raise exception 'Independent answer helper allowed';exception when raise_exception then assert sqlerrm like 'AI help is available while learning%';end;
 for i in 0..4 loop
  select value into q from skill_lab_private.lessons l,jsonb_array_elements(l.content->'items') where l.skill='reading_true_false_not_given' and value->>'id'=r->'item'->>'id';
  r:=public.skill_lab_action('answer',session_id,jsonb_build_object('item_id',q->>'id','answer',case when p_correct then q->'answer' else '"wrong"'::jsonb end,'evidence',q->>'evidence_answer'));
  r:=public.skill_lab_action('next',session_id,jsonb_build_object('position',i));
 end loop;
 return r;
end $$;
do $$
declare first jsonb;second jsonb;third jsonb;fourth jsonb;again jsonb;
begin
 first:=pg_temp.finish_lesson(true);assert not(first->>'retained')::boolean,'First check was enough';
 update public.skill_lab_sessions set completed_at=now()-interval '3 days' where id=(first->>'id')::uuid;
 second:=pg_temp.finish_lesson(true);assert (second->>'retained')::boolean,'Delayed successful check not recognised';
 third:=pg_temp.finish_lesson(false);assert not(third->>'retained')::boolean,'Failure did not return to practice';
 fourth:=pg_temp.finish_lesson(true);assert not(fourth->>'retained')::boolean,'Old pass overrode recent failure';
 again:=pg_temp.finish_lesson(true);assert (again->>'repeated')::boolean,'Exhausted bank not labelled';assert (again->>'independent_count')::integer=0,'Repeated items counted as fresh';
 assert (select practice_count from public.skill_proficiency where user_id='a9100000-0000-4000-8000-000000000001')=20,'Repeated check inflated progress';
end $$;
rollback;

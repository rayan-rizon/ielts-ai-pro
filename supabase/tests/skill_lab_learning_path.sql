-- Run only against an isolated local database with the Practice Lab migrations.
begin;
insert into auth.users(id,email) values ('b9100000-0000-4000-8000-000000000001','lab-path@example.invalid');
delete from public.users where auth_id='b9100000-0000-4000-8000-000000000001';
insert into public.users(id,auth_id,email,subscription_tier) values ('a9100000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000001','lab-path@example.invalid','premium');
insert into public.learning_path_activities(id,user_id,activity_key,title,module,activity_type,skill_targets) values
('e9100000-0000-4000-8000-000000000001','a9100000-0000-4000-8000-000000000001','lab-linked','Practise headings','reading','targeted_repair',array['reading_matching_headings']),
('e9100000-0000-4000-8000-000000000002','a9100000-0000-4000-8000-000000000001','lab-broad','Improve reading','reading','targeted_repair',array['reading_general']);
update skill_lab_private.settings set enabled=true;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000001',true);
do $$
declare r jsonb;s uuid;item jsonb;stamp timestamptz;
begin
 begin
  perform public.skill_lab_action('start',null,jsonb_build_object('skill','reading_true_false_not_given','activity_id','e9100000-0000-4000-8000-000000000001','request_id',gen_random_uuid()));
  raise exception 'Mismatched skill accepted';
 exception when raise_exception then assert sqlerrm='Choose the skill linked to this learning activity';end;
 r:=public.skill_lab_action('start',null,jsonb_build_object('skill','reading_matching_headings','activity_id','e9100000-0000-4000-8000-000000000001','request_id',gen_random_uuid()));s:=(r->>'id')::uuid;
 assert r->>'return_to'='/learning-path','Return destination lost';
 r:=public.skill_lab_action('next',s,'{"position":-1}');
 for i in 0..5 loop
  select value into item from skill_lab_private.lessons l,jsonb_array_elements(l.content->'items') where l.skill='reading_matching_headings' and value->>'id'=r->'item'->>'id';
  r:=public.skill_lab_action('answer',s,jsonb_build_object('item_id',item->>'id','answer',item->'answer','evidence',item->>'evidence_answer'));
  r:=public.skill_lab_action('next',s,jsonb_build_object('position',i));
 end loop;
 assert (select is_completed from public.learning_path_activities where id='e9100000-0000-4000-8000-000000000001'),'Linked activity not completed';
 select completed_at into stamp from public.learning_path_activities where id='e9100000-0000-4000-8000-000000000001';
 perform public.skill_lab_action('next',s,'{"position":5}');
 assert (select completed_at=stamp and outcome_data->>'session_id'=s::text and (outcome_data->>'practice_only')::boolean from public.learning_path_activities where id='e9100000-0000-4000-8000-000000000001'),'Completion replay changed activity';
 r:=public.skill_lab_action('start',null,jsonb_build_object('skill','reading_matching_headings','activity_id','e9100000-0000-4000-8000-000000000002','request_id',gen_random_uuid()));
 assert r->>'activity_id' is null,'Broad recommendation falsely linked';
 assert r->>'return_to'='/learning-path','Broad recommendation lost return path';
 assert not(select is_completed from public.learning_path_activities where id='e9100000-0000-4000-8000-000000000002'),'Unrelated activity completed';
end $$;
rollback;

-- Run on an isolated database with migrations applied. Fixtures roll back.
begin;

insert into auth.users (id, email)
values ('94100000-0000-4000-8000-000000000001', 'practice-catalogue@example.invalid');
insert into public.users (auth_id, email, full_name, subscription_tier, subscription_end_date)
values ('94100000-0000-4000-8000-000000000001', 'practice-catalogue@example.invalid',
  'Practice catalogue fixture', 'pro', now() + interval '1 day')
on conflict (auth_id) do update set
  subscription_tier = excluded.subscription_tier,
  subscription_end_date = excluded.subscription_end_date;

insert into public.passages (id, title, test_type, test_format, topic, is_active, access_tier, content, audio_url) values
  ('94200000-0000-4000-8000-000000000001', 'Listening fixture', 'listening', 'academic', 'fixture', true, 'free', '[]', '/fixture.mp3'),
  ('94200000-0000-4000-8000-000000000002', 'Reading fixture', 'reading', 'academic', 'fixture', true, 'free', 'Original passage', null);

insert into public.questions (id, passage_id, type, question_text, section, question_number, group_instructions, gap_fill) values
  ('94300000-0000-4000-8000-000000000001', '94200000-0000-4000-8000-000000000001', 'gap_fill', 'Original form', 1, 1, 'Complete the form below.', '{"text":"Name [gap], city [gap]","answers":{"0":"Ada","1":"York"}}'),
  ('94300000-0000-4000-8000-000000000002', '94200000-0000-4000-8000-000000000002', 'notes_completion', 'Original notes', 2, 14, 'Complete the notes.', '{"structured_text":"Writer [14], date [15]","answers":{"14":"Ada","15":"1843"}}'),
  ('94300000-0000-4000-8000-000000000003', '94200000-0000-4000-8000-000000000002', 'notes_completion', 'Incomplete notes', 2, 16, 'Complete the notes.', '{"structured_text":"Writer [16], date [17]","answers":{"16":"Ada"}}');

select skill_lab_private.refresh_practice_library_dashboard_cache();
do $$
declare
  learner constant uuid := '94100000-0000-4000-8000-000000000001';
  catalogue jsonb := public.practice_library_dashboard_groups_v2(learner);
begin
  assert catalogue @> '[{"sourceId":"94200000-0000-4000-8000-000000000001","focus":"listening:gap_fill","category":"listening:form_completion","total":2}]';
  assert catalogue @> '[{"sourceId":"94200000-0000-4000-8000-000000000002","focus":"reading:notes_completion","startNumber":14,"total":2}]';
  assert not catalogue @> '[{"sourceId":"94200000-0000-4000-8000-000000000002","focus":"reading:notes_completion","startNumber":16}]';
  assert not public.practice_library_dashboard_groups(learner) @> '[{"sourceId":"94200000-0000-4000-8000-000000000001"}]';
  assert not has_function_privilege('authenticated', 'public.practice_library_dashboard_groups_v2(uuid)', 'EXECUTE');
  assert has_function_privilege('service_role', 'public.practice_library_dashboard_groups_v2(uuid)', 'EXECUTE');
end $$;

rollback;

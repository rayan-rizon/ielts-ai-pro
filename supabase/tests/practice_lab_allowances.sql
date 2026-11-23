-- Run on an isolated database with migrations applied. Fixtures roll back.
begin;

insert into auth.users (id, email) values
  ('b7110000-0000-4000-8000-000000000001', 'practice-free@example.invalid'),
  ('b7110000-0000-4000-8000-000000000002', 'practice-pro@example.invalid'),
  ('b7110000-0000-4000-8000-000000000003', 'practice-premium@example.invalid');

insert into public.users (auth_id, email, full_name, subscription_tier)
select id, email, 'Practice fixture', split_part(split_part(email, '@', 1), '-', 2)
from auth.users where id::text like 'b7110000-0000-4000-8000-%'
on conflict (auth_id) do update set
  subscription_tier = excluded.subscription_tier,
  subscription_end_date = now() + interval '1 day';

insert into public.passages (id, title, test_type, test_format, topic, is_active, access_tier, content, created_at)
values ('c7110000-0000-4000-8000-000000000001', 'Practice fixture', 'reading', 'academic', 'fixture', true, 'free', '[]', now() + interval '20 years');
insert into skill_lab_private.library_groups (id, source_id, focus, version, snapshot, eligible)
values ('practice-allowance-fixture', 'c7110000-0000-4000-8000-000000000001', 'reading:multiple_choice', 'fixture', '{}', true);
update skill_lab_private.settings set enabled = true, library_enabled = false;

do $$
declare
  free_auth constant uuid := 'b7110000-0000-4000-8000-000000000001';
  lesson constant jsonb := '{"skill":"reading_true_false_not_given"}';
  library_set constant jsonb := '{"group_id":"practice-allowance-fixture"}';
  learner record;
  dashboard jsonb;
  request jsonb;
  session_id uuid;
begin
  perform set_config('request.jwt.claim.sub', free_auth::text, true);
  perform public.skill_lab_action('start', null, lesson || jsonb_build_object('request_id', gen_random_uuid()));

  for learner in select auth_id, subscription_tier from public.users
    where auth_id::text like 'b7110000-0000-4000-8000-%' and auth_id <> free_auth
  loop
    perform set_config('request.jwt.claim.sub', learner.auth_id::text, true);
    for attempt in 1..21 loop
      perform public.skill_lab_action('start', null, lesson || jsonb_build_object('request_id', gen_random_uuid()));
    end loop;
    dashboard := public.skill_lab_action('dashboard');
    assert dashboard @> '{"unlimited":true,"remaining":1}', 'Paid legacy dashboard breaks quota compatibility';
  end loop;

  update skill_lab_private.settings set library_enabled = true;
  for learner in select auth_id, subscription_tier from public.users
    where auth_id::text like 'b7110000-0000-4000-8000-%' and auth_id <> free_auth
  loop
    for attempt in 1..21 loop
      perform public.practice_library_state(learner.auth_id, 'start', null,
        library_set || jsonb_build_object('request_id', gen_random_uuid()));
    end loop;
    dashboard := public.practice_library_state(learner.auth_id, 'dashboard');
    assert dashboard @> '{"unlimited":true,"remaining":1}', 'Paid library dashboard breaks quota compatibility';
  end loop;

  dashboard := public.practice_library_state(free_auth, 'dashboard');
  assert dashboard @> '{"limit":2,"remaining":1}', 'Free allowance does not count the legacy lesson';
  request := library_set || jsonb_build_object('request_id', gen_random_uuid());
  session_id := (public.practice_library_state(free_auth, 'start', null, request)->>'id')::uuid;
  dashboard := public.practice_library_state(free_auth, 'dashboard');
  assert dashboard @> '{"unlimited":false,"limit":2,"remaining":0}' and dashboard->>'reset_at' is not null,
    'Free dashboard does not report the exhausted allowance and reset';
  assert (public.practice_library_state(free_auth, 'start', null, request)->>'id')::uuid = session_id,
    'Replaying a saved start was blocked by the quota';
  begin
    perform public.practice_library_state(free_auth, 'start', null,
      library_set || jsonb_build_object('request_id', gen_random_uuid()));
    raise exception 'Free learner started a third set';
  exception when raise_exception then
    assert sqlerrm like 'You have used today%', sqlerrm;
  end;
end $$;

rollback;

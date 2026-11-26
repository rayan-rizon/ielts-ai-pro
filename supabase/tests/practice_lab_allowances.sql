-- Run on an isolated database with migrations applied. Fixtures roll back.
begin;

insert into auth.users (id, email) values
  ('b7110000-0000-4000-8000-000000000001', 'practice-free@example.invalid'),
  ('b7110000-0000-4000-8000-000000000002', 'practice-pro@example.invalid'),
  ('b7110000-0000-4000-8000-000000000003', 'practice-premium@example.invalid');

insert into public.users (auth_id, email, full_name, subscription_tier, subscription_end_date)
select id, email, 'Practice fixture', split_part(split_part(email, '@', 1), '-', 2),
  case when email <> 'practice-free@example.invalid' then now() + interval '1 day' end
from auth.users where id::text like 'b7110000-0000-4000-8000-%'
on conflict (auth_id) do update set
  subscription_tier = excluded.subscription_tier,
  subscription_end_date = excluded.subscription_end_date;

-- The legacy start RPC needs five published independent items in check mode.
insert into skill_lab_private.lessons (skill, module, version, content, published)
select 'reading_allowance_fixture', 'reading', 1,
  jsonb_build_object('module', 'reading', 'version', 1, 'items',
    jsonb_agg(jsonb_build_object('id', 'fixture-' || item, 'stage', 'independent') order by item)),
  true
from generate_series(1, 5) as fixture(item);

insert into public.passages (id, title, test_type, test_format, topic, is_active, access_tier, content, created_at)
values ('c7110000-0000-4000-8000-000000000001', 'Practice fixture', 'reading', 'academic', 'fixture', true, 'free', '[]', now() + interval '20 years');
insert into skill_lab_private.library_groups (id, source_id, focus, version, snapshot, eligible)
values ('practice-allowance-fixture', 'c7110000-0000-4000-8000-000000000001', 'reading:multiple_choice', 'fixture', '{}', true);
update skill_lab_private.settings set enabled = true, library_enabled = false;

do $$
declare
  free_auth constant uuid := 'b7110000-0000-4000-8000-000000000001';
  lesson constant jsonb := '{"skill":"reading_allowance_fixture","mode":"check"}';
  library_set constant jsonb := '{"group_id":"practice-allowance-fixture"}';
  learner record;
  dashboard jsonb;
  request jsonb;
  started jsonb;
  session_id uuid;
begin
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', free_auth::text, true);
  started := public.skill_lab_action('start', null, lesson || jsonb_build_object('request_id', gen_random_uuid()));
  assert (started->>'id')::uuid is not null, 'Free legacy lesson did not start';
  dashboard := public.skill_lab_action('dashboard');
  assert dashboard @> '{"tier":"free","unlimited":false,"limit":5,"remaining":4}',
    'Free legacy dashboard must allow five and count the first lesson';

  for learner in select * from (values
    ('b7110000-0000-4000-8000-000000000002'::uuid, 'pro'),
    ('b7110000-0000-4000-8000-000000000003'::uuid, 'premium')
  ) as paid(auth_id, tier)
  loop
    perform set_config('request.jwt.claim.sub', learner.auth_id::text, true);
    for attempt in 1..21 loop
      started := public.skill_lab_action('start', null, lesson || jsonb_build_object('request_id', gen_random_uuid()));
      assert (started->>'id')::uuid is not null, 'Paid legacy lesson did not start';
    end loop;
    dashboard := public.skill_lab_action('dashboard');
    assert dashboard @> jsonb_build_object('tier', learner.tier, 'unlimited', true, 'remaining', 1),
      'Paid legacy dashboard breaks quota compatibility';
    assert jsonb_array_length(dashboard->'sessions') = 21, 'Paid legacy starts did not create 21 sessions';
  end loop;
  reset role;

  update skill_lab_private.settings set library_enabled = true;
  set local role service_role;
  for learner in select auth_id, subscription_tier from public.users
    where auth_id::text like 'b7110000-0000-4000-8000-%' and auth_id <> free_auth
  loop
    for attempt in 1..21 loop
      started := public.practice_library_state(learner.auth_id, 'start', null,
        library_set || jsonb_build_object('request_id', gen_random_uuid()));
      assert (started->>'id')::uuid is not null, 'Paid library set did not start';
    end loop;
    dashboard := public.practice_library_state(learner.auth_id, 'dashboard');
    assert dashboard @> jsonb_build_object('tier', learner.subscription_tier, 'unlimited', true, 'remaining', 1),
      'Paid library dashboard breaks quota compatibility';
    assert jsonb_array_length(dashboard->'sessions') = 21, 'Paid library starts did not create 21 sessions';
  end loop;

  dashboard := public.practice_library_state(free_auth, 'dashboard');
  assert dashboard @> '{"tier":"free","unlimited":false,"limit":5,"remaining":4}',
    'Free allowance must start at five and count the legacy lesson';
  for attempt in 1..4 loop
    request := library_set || jsonb_build_object('request_id', gen_random_uuid());
    session_id := (public.practice_library_state(free_auth, 'start', null, request)->>'id')::uuid;
    assert session_id is not null, 'Free library set did not start within the allowance';
  end loop;
  dashboard := public.practice_library_state(free_auth, 'dashboard');
  assert dashboard @> '{"unlimited":false,"limit":5,"remaining":0}'
    and (dashboard->>'reset_at')::timestamptz = (date_trunc('day', now() at time zone 'UTC') + interval '1 day') at time zone 'UTC',
    'Free dashboard does not report the exhausted allowance and reset';
  assert (public.practice_library_state(free_auth, 'start', null, request)->>'id')::uuid = session_id,
    'Replaying a saved start was blocked by the quota';
  begin
    perform public.practice_library_state(free_auth, 'start', null,
      library_set || jsonb_build_object('request_id', gen_random_uuid()));
    assert false, 'Free learner started a sixth set';
  exception when raise_exception then
    assert sqlerrm like 'You have used today%', sqlerrm;
  end;
  dashboard := public.practice_library_state(free_auth, 'dashboard');
  assert jsonb_array_length(dashboard->'sessions') = 4,
    'A replay or rejected request created an extra library session';
  reset role;
end $$;

rollback;

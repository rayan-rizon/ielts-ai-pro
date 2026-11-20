-- Run on an isolated database with migrations applied. Fixtures roll back.
begin;

insert into auth.users (id, email) values
  ('81000000-0000-4000-8000-000000000001', 'starter-free-1@example.invalid'),
  ('81000000-0000-4000-8000-000000000002', 'starter-free-2@example.invalid'),
  ('81000000-0000-4000-8000-000000000003', 'starter-admin@example.invalid'),
  ('81000000-0000-4000-8000-000000000004', 'starter-pro@example.invalid');

insert into public.users (auth_id, email, full_name, role, subscription_tier)
select id, email, split_part(email, '@', 1),
  case when email like 'starter-admin%' then 'admin' else 'user' end,
  case when email like 'starter-pro%' then 'pro' else 'free' end
from auth.users where id::text like '81000000-0000-4000-8000-%'
on conflict (auth_id) do update set role = excluded.role, subscription_tier = excluded.subscription_tier;

insert into public.passages (id, title, test_type, test_format, topic, is_active, access_tier, content, created_at)
select ('82000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'Starter fixture ' || n,
  case when n <= 7 then 'reading' else 'listening' end, 'academic', 'fixture', true, 'free', '[]', now() + make_interval(years => 20, days => -n)
from generate_series(1, 14) as n;
insert into public.questions (passage_id, question_text, type, question_number, section)
values
  ('82000000-0000-4000-8000-000000000001', 'Starter question', 'multiple_choice', 1, 1),
  ('82000000-0000-4000-8000-000000000007', 'Locked question', 'multiple_choice', 1, 1);
update public.tier_rate_limits
set reading_test_limit = 6, listening_test_limit = 6 where tier = 'free';
do $$
declare
  free_a constant uuid := '81000000-0000-4000-8000-000000000001';
  free_b constant uuid := '81000000-0000-4000-8000-000000000002';
  paid constant uuid := '81000000-0000-4000-8000-000000000004';
  starter constant uuid := '82000000-0000-4000-8000-000000000001';
  locked constant uuid := '82000000-0000-4000-8000-000000000007';
  starter_listening constant uuid := '82000000-0000-4000-8000-000000000008';
  locked_listening constant uuid := '82000000-0000-4000-8000-000000000014';
  learner record;
  session_id uuid;
begin
  for learner in select auth_id, id from public.users where auth_id in (free_a, free_b) loop
    perform set_config('request.jwt.claims', jsonb_build_object('sub', learner.auth_id, 'role', 'authenticated')::text, true);
    set local role authenticated;
    assert (select count(*) from public.library_passages where title like 'Starter fixture %') = 14,
      'Locked papers disappeared from the metadata catalogue';
    reset role;
    assert (select count(*) from public.passages p where p.test_type = 'reading'
      and objective_private.is_recent_free_test(p.id, learner.id)) = 6;
    assert (select count(*) from public.passages p where p.test_type = 'listening'
      and objective_private.is_recent_free_test(p.id, learner.id)) = 6;
    set local role authenticated;
    assert not exists (select 1 from public.passages where id = locked);
    assert not exists (select 1 from public.questions where passage_id = locked);
    assert not exists (select 1 from public.library_passages where id = locked and content is not null);
    assert public.start_objective_test(starter, 'reading', 'practice', 3600) ? 'session';
    assert public.start_objective_test(starter_listening, 'listening', 'practice', 2400) ? 'session';
    begin
      perform public.start_objective_test(locked, 'reading', 'practice', 3600);
      raise exception 'Free learner started an out-of-set Reading paper';
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.start_objective_test(locked_listening, 'listening', 'practice', 2400);
      raise exception 'Free learner started an out-of-set Listening paper';
    exception when insufficient_privilege then null;
    end;
    assert public.get_objective_test_quotas() #>> '{reading,used}' = '1';
    reset role;

    assert paired_private.entitled(learner.id, starter);
    assert not paired_private.entitled(learner.id, locked);
    assert public.objective_test_state(learner.auth_id, 'authorize', null, jsonb_build_object('passage_id', starter))->>'passage_id' = starter::text;
    begin
      perform public.objective_test_state(learner.auth_id, 'authorize', null, jsonb_build_object('passage_id', locked));
      raise exception 'Free learner loaded a locked objective preview';
    exception when insufficient_privilege then null;
    end;
    assert jsonb_array_length(public.practice_library_catalogue_for_sources(learner.auth_id, array[starter, locked], true)->'passages') = 1;
    assert jsonb_array_length(public.practice_library_catalogue_for_sources(learner.auth_id, array[starter, locked], true)->'questions') = 1;
    assert exists (select 1 from jsonb_array_elements(public.practice_library_dashboard_groups(learner.auth_id)) g where g->>'sourceId' = starter::text);
    assert not exists (select 1 from jsonb_array_elements(public.practice_library_dashboard_groups(learner.auth_id)) g where g->>'sourceId' = locked::text);
  end loop;

  perform set_config('request.jwt.claims', jsonb_build_object('sub', paid, 'role', 'authenticated')::text, true);
  set local role authenticated;
  assert public.start_objective_test(locked, 'reading', 'exam', 3600) ? 'session';
  assert public.get_objective_test_quotas() #>> '{reading,limit}' = '-1';
  assert public.get_objective_test_quotas() #>> '{reading,used}' = '0';
  reset role;

  -- A paid host can create a room for this paper, but a free invitee
  -- cannot join it until the paper is in the shared starter set.
  declare
    invitation uuid;
  begin
    insert into public.paired_test_rooms(host_id, passage_id, test_type, title, snapshot, content_version, duration_seconds)
    values((select id from public.users where auth_id = paid), locked, 'reading', 'Locked invitation', '{}', 'fixture', 3600)
    returning invite_token into invitation;
    assert public.paired_test_action(free_a, 'preview', null, jsonb_build_object('token', invitation))
      ->> 'can_access' = 'false';
    assert public.paired_test_action(free_a, 'join', null, jsonb_build_object('token', invitation, 'consent', true))
      ? 'error';
  end;

  -- Publishing a newer test pushes an older one out of the free window.
  select id into session_id from public.test_sessions where passage_id = starter and
    user_id = (select id from public.users where auth_id = free_a);
  update public.passages set created_at = now() + interval '21 years' where id = locked;
  update public.passages set created_at = now() + interval '19 years' where id = starter;

  -- The same Admin setting immediately changes the window and the quota.
  update public.tier_rate_limits set reading_test_limit = 7 where tier = 'free';
  assert objective_private.is_recent_free_test(starter, (select id from public.users where auth_id = free_a));
  update public.tier_rate_limits set reading_test_limit = 6 where tier = 'free';
  assert public.objective_test_state(free_a, 'authorize', session_id)->>'passage_id' = starter::text;
  update public.test_sessions set is_completed = true where id = session_id;
  assert public.objective_test_state(free_a, 'authorize', session_id) #>> '{session,is_completed}' = 'true';
  perform set_config('request.jwt.claims', jsonb_build_object('sub', free_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  assert public.get_objective_test_quotas() #>> '{reading,used}' = '1';
  begin
    perform public.start_objective_test(starter, 'reading', 'practice', 3600);
    raise exception 'Free learner retook a paper removed from the set';
  exception when insufficient_privilege then null;
  end;
  reset role;
end $$;

-- Paired start must be all-or-nothing and use the same allowance as solo.
do $$
declare
  host_auth constant uuid := '81000000-0000-4000-8000-000000000001';
  guest_auth constant uuid := '81000000-0000-4000-8000-000000000002';
  paper constant uuid := '82000000-0000-4000-8000-000000000007';
  host_id uuid;
  guest_id uuid;
  room_id uuid;
  member record;
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', guest_auth, 'role', 'authenticated')::text, true);
  set local role authenticated;
  assert public.start_objective_test(paper, 'reading', 'practice', 3600) ? 'session';
  reset role;
  select id into strict host_id from public.users where auth_id = host_auth;
  select id into strict guest_id from public.users where auth_id = guest_auth;
  insert into public.paired_test_rooms(host_id, passage_id, test_type, title, snapshot, content_version, duration_seconds)
    values(host_id, paper, 'reading', 'Paired fixture', '{}', 'fixture', 3600)
    returning id into room_id;
  insert into public.paired_test_members (room_id, user_id, ready) values (room_id, host_id, true), (room_id, guest_id, true);
  update public.tier_rate_limits set reading_test_limit = 2 where tier = 'free';
  begin
    perform public.paired_test_action(host_auth, 'start', room_id);
    raise exception 'Paired room bypassed the free allowance';
  exception when insufficient_privilege then null;
  end;
  assert (select state from public.paired_test_rooms where id = room_id) = 'lobby';
  assert not exists (select 1 from public.test_sessions where paired_room_id = room_id);
  update public.tier_rate_limits set reading_test_limit = 6 where tier = 'free';
  assert public.paired_test_action(host_auth, 'start', room_id)->>'state' = 'running';
  assert public.paired_test_action(host_auth, 'start', room_id)->>'state' = 'running';
  for member in select auth_id from public.users where id in (host_id, guest_id) loop
    perform set_config('request.jwt.claims', jsonb_build_object('sub', member.auth_id, 'role', 'authenticated')::text, true);
    assert (public.get_objective_test_quotas() #>> '{reading,used}')::integer =
      case when member.auth_id = host_auth then 2 else 3 end,
      'Paired start did not count exactly once';
  end loop;
end $$;

rollback;

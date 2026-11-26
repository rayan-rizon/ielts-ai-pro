-- Run in an isolated migrated Supabase database. Fixtures roll back.
begin;

insert into auth.users (id, email) values
  ('7a710000-0000-4000-8000-000000000001', 'card-owner@example.invalid'),
  ('7a710000-0000-4000-8000-000000000002', 'card-other@example.invalid');
insert into public.users (auth_id, email, full_name, role, subscription_tier)
values
  ('7a710000-0000-4000-8000-000000000001', 'card-owner@example.invalid', 'Card owner', 'user', 'free'),
  ('7a710000-0000-4000-8000-000000000002', 'card-other@example.invalid', 'Other learner', 'user', 'free')
on conflict (auth_id) do nothing;
insert into public.passages (id, title, test_type, test_format, topic, is_active, access_tier)
values
  ('7a720000-0000-4000-8000-000000000001', 'Reading card', 'reading', 'academic', 'fixture', true, 'free'),
  ('7a720000-0000-4000-8000-000000000002', 'Writing card', 'writing', 'academic', 'fixture', true, 'free');

insert into public.test_sessions
  (id, user_id, passage_id, test_type, is_completed, created_at, band_score, content_data, user_responses)
select fixture.id, u.id, fixture.paper, fixture.module, fixture.completed,
  fixture.created, fixture.band, fixture.content, fixture.responses
from public.users u cross join (values
  ('7a730000-0000-4000-8000-000000000001'::uuid, '7a720000-0000-4000-8000-000000000001'::uuid,
    'reading', true, '2026-01-01'::timestamptz, 7::numeric, '{"essay":"old private content"}'::jsonb, '{}'::jsonb),
  ('7a730000-0000-4000-8000-000000000002'::uuid, '7a720000-0000-4000-8000-000000000001'::uuid,
    'reading', false, '2026-01-02'::timestamptz, null, '{"total_questions":40}'::jsonb,
    '{"1":"yes","2":"","3":[],"4":null,"5":["a"]}'::jsonb),
  ('7a730000-0000-4000-8000-000000000003'::uuid, '7a720000-0000-4000-8000-000000000002'::uuid,
    'writing', true, '2026-01-02'::timestamptz, 6.5, '{"essay":"private writing response"}'::jsonb, '{}'::jsonb)
) as fixture(id,paper,module,completed,created,band,content,responses)
where u.auth_id = '7a710000-0000-4000-8000-000000000001';

select set_config('request.jwt.claim.sub', '7a710000-0000-4000-8000-000000000001', true);
set local role authenticated;
do $$
declare owner_id uuid; cards jsonb;
begin
  select id into strict owner_id from public.users where auth_id = auth.uid();
  cards := public.get_learner_latest_sessions(owner_id, 'reading',
    array['7a720000-0000-4000-8000-000000000001'::uuid]);
  assert jsonb_array_length(cards) = 1;
  assert cards->0->>'id' = '7a730000-0000-4000-8000-000000000002';
  assert cards->0->>'completed_questions' = '5', 'Keep the web progress contract';
  assert cards->0->>'answered_questions' = '2', 'Keep native progress for nonempty answers';
  assert not (cards->0 ? 'user_responses');
  cards := public.get_learner_latest_sessions(owner_id, 'writing',
    array['7a720000-0000-4000-8000-000000000002'::uuid]);
  assert jsonb_array_length(cards) = 1;
  assert cards->0->>'band_score' = '6.5';
  assert not (cards->0->'content_data' ? 'essay');
  perform set_config('request.jwt.claim.sub', '7a710000-0000-4000-8000-000000000002', true);
  begin
    perform public.get_learner_latest_sessions(owner_id, 'writing',
      array['7a720000-0000-4000-8000-000000000002'::uuid]);
    assert false, 'A different learner could read the card';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;

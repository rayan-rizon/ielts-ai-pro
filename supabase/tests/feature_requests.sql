-- Run against an isolated database after feature_requests_board.sql.
-- Exercises quotas, privacy, voting, and the admin state machine. All fixtures roll back.
begin;

insert into auth.users (id, email) values
  ('f1000000-0000-4000-8000-000000000001', 'feature-free@example.invalid'),
  ('f1000000-0000-4000-8000-000000000002', 'feature-paid@example.invalid'),
  ('f1000000-0000-4000-8000-000000000003', 'feature-other@example.invalid'),
  ('f1000000-0000-4000-8000-000000000004', 'feature-admin@example.invalid');

set local role service_role;
insert into public.users (id, auth_id, email, full_name, role, subscription_tier, subscription_end_date)
values
  ('f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'feature-free@example.invalid', 'Free Learner', 'user', 'free', null),
  ('f2000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000002', 'feature-paid@example.invalid', 'Paid Learner', 'user', 'pro', now() + interval '30 days'),
  ('f2000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000003', 'feature-other@example.invalid', 'Other Learner', 'user', 'free', null),
  ('f2000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000004', 'feature-admin@example.invalid', 'Feature Admin', 'admin', 'premium', now() + interval '30 days')
on conflict (auth_id) do update set
  role = excluded.role,
  subscription_tier = excluded.subscription_tier,
  subscription_end_date = excluded.subscription_end_date;
reset role;

-- Free: one lifetime request, with input validation and duplicate/quota failures.
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  response jsonb;
begin
  perform public.submit_feature_request(
    'A learner feature idea',
    'This description is long enough to explain the learner feature idea.',
    'reading'
  );
  response := public.feature_request_page('mine', 'new', '', 0);
  assert response ->> 'remaining' = '0', 'Free lifetime allowance was not consumed';
  assert jsonb_array_length(response -> 'items') = 1, 'Owner cannot read pending request';
  assert response -> 'items' -> 0 ->> 'category' = 'reading', 'Selected feature area was not preserved';

  begin
    perform public.submit_feature_request(
      'Invalid category idea',
      'This description is valid but the supplied product area is not.',
      'not-a-real-area'
    );
    raise exception 'Invalid feature request category was accepted';
  exception when invalid_parameter_value then
    assert sqlerrm = 'Choose a valid product area';
  end;

  begin
    perform public.submit_feature_request(
      'Another learner feature',
      'This second description should fail because the free allowance is exhausted.'
    );
    raise exception 'Free user bypassed lifetime quota';
  exception when raise_exception then
    assert sqlerrm = 'Feature request allowance reached';
  end;
end $$;
reset role;

-- Paid: three requests in the UTC month. A historical request does not consume this month.
insert into public.feature_requests (user_id, title, description, created_at)
values (
  'f2000000-0000-4000-8000-000000000002',
  'Historical paid feature',
  'A valid paid request from a previous UTC calendar month for quota coverage.',
  date_trunc('month', now() at time zone 'UTC') at time zone 'UTC' - interval '1 day'
);
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  response jsonb;
begin
  perform public.submit_feature_request('Paid feature request one', 'A sufficiently detailed description for paid request number one.');
  perform public.submit_feature_request('Paid feature request two', 'A sufficiently detailed description for paid request number two.');
  perform public.submit_feature_request('Paid feature request three', 'A sufficiently detailed description for paid request number three.');
  response := public.feature_request_page('mine', 'new', '', 0);
  assert response ->> 'limit' = '3' and response ->> 'remaining' = '0', 'Paid monthly quota is incorrect';
  begin
    perform public.submit_feature_request('Paid feature request four', 'A sufficiently detailed description that must exceed the paid quota.');
    raise exception 'Paid user bypassed monthly quota';
  exception when raise_exception then
    assert sqlerrm = 'Feature request allowance reached';
  end;
end $$;
reset role;

-- A downgrade does not restore a free allowance: lifetime history is counted.
set local role service_role;
update public.users set subscription_tier = 'free', subscription_end_date = null
where auth_id = 'f1000000-0000-4000-8000-000000000002';
reset role;
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  assert public.feature_request_page('mine', 'new', '', 0) ->> 'remaining' = '0',
    'Downgrade incorrectly restored the free allowance';
end $$;
reset role;

-- Other learners cannot see pending rows through either the RPC or direct tables.
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  assert jsonb_array_length(public.feature_request_page('board', 'new', '', 0) -> 'items') = 0,
    'Pending request leaked onto learner board';
  begin
    perform count(*) from public.feature_requests;
    raise exception 'Direct feature request table access was granted';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- Admin approves the first request, after which another learner can vote once.
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  request_id uuid;
begin
  select id into request_id from public.feature_requests where title = 'A learner feature idea';
  perform public.admin_update_feature_request(request_id, 'approved', 'Approved for community voting.');
  assert jsonb_array_length(public.admin_feature_request_page('approved', '', 0) -> 'items') = 1,
    'Approved request missing from admin queue';
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"f1000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  request_id uuid;
  response jsonb;
begin
  response := public.feature_request_page('board', 'top', '', 0);
  assert jsonb_array_length(response -> 'items') = 1, 'Approved request missing from learner board';
  assert (response -> 'items' -> 0 ->> 'admin_note') is null, 'Private admin note leaked to another learner';
  request_id := (response -> 'items' -> 0 ->> 'id')::uuid;
  assert public.toggle_feature_request_vote(request_id), 'First vote was not created';
  assert not public.toggle_feature_request_vote(request_id), 'Second toggle did not remove vote';
end $$;
reset role;

-- The requester sees the note but cannot upvote their own idea.
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  request_id uuid;
  response jsonb;
begin
  response := public.feature_request_page('mine', 'new', '', 0);
  assert response -> 'items' -> 0 ->> 'admin_note' = 'Approved for community voting.',
    'Requester cannot see admin note';
  request_id := (response -> 'items' -> 0 ->> 'id')::uuid;
  begin
    perform public.toggle_feature_request_vote(request_id);
    raise exception 'Requester voted on own request';
  exception when invalid_parameter_value then
    assert sqlerrm = 'You cannot vote on your own request';
  end;
end $$;
reset role;

rollback;

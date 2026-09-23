-- Run on an isolated database with all migrations applied. Fixtures roll back.
begin;

insert into auth.users (id, email) values
  ('41000000-0000-4000-8000-000000000001', 'objective-free@example.invalid'),
  ('41000000-0000-4000-8000-000000000002', 'objective-pro@example.invalid'),
  ('41000000-0000-4000-8000-000000000003', 'objective-expired@example.invalid');

set local role service_role;
insert into public.users (id, auth_id, email, full_name, role, subscription_tier, subscription_end_date)
values
  ('42000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', 'objective-free@example.invalid', 'Free Learner', 'user', 'free', null),
  ('42000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000002', 'objective-pro@example.invalid', 'Pro Learner', 'user', 'pro', now() + interval '30 days'),
  ('42000000-0000-4000-8000-000000000003', '41000000-0000-4000-8000-000000000003', 'objective-expired@example.invalid', 'Expired Learner', 'user', 'premium', now() - interval '1 day')
on conflict (auth_id) do update set
  subscription_tier = excluded.subscription_tier,
  subscription_end_date = excluded.subscription_end_date;
insert into public.passages (id, title, test_type, test_format, topic, is_active, access_tier)
values
  ('43000000-0000-4000-8000-000000000001', 'Quota Reading', 'reading', 'academic', 'fixture', true, 'free'),
  ('43000000-0000-4000-8000-000000000002', 'Quota Listening', 'listening', 'academic', 'fixture', true, 'free');
update public.tier_rate_limits set
  reading_daily_limit = -1, reading_monthly_limit = -1,
  listening_daily_limit = -1, listening_monthly_limit = -1
where tier = 'free' and currency = 'ALL';
reset role;

-- Unset settings remain unlimited through the migration.
select set_config('request.jwt.claims', '{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$
declare r jsonb;
begin
  r := public.get_objective_test_quotas();
  assert r #>> '{reading,daily_limit}' = '-1';
  assert r #>> '{listening,monthly_limit}' = '-1';
end $$;
reset role;

set local role service_role;
update public.tier_rate_limits set
  reading_daily_limit = 1, reading_monthly_limit = 1,
  listening_daily_limit = 0, listening_monthly_limit = 0
where tier = 'free' and currency = 'ALL';
reset role;

select set_config('request.jwt.claims', '{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$
declare r jsonb; sid uuid;
begin
  r := public.start_objective_test('43000000-0000-4000-8000-000000000001', 'reading', 'practice', 3600,
    p_request_id => '44000000-0000-4000-8000-000000000001');
  sid := (r #>> '{session,id}')::uuid;
  assert sid is not null, 'First Reading start was denied';
  assert public.get_objective_test_quotas() #>> '{reading,monthly_used}' = '1';
  assert public.start_objective_test('43000000-0000-4000-8000-000000000001', 'reading', 'practice', 3600,
    p_request_id => '44000000-0000-4000-8000-000000000001') #>> '{session,id}' = sid::text,
    'Retry consumed a new start instead of returning the original session';
  assert public.get_objective_test_quotas() #>> '{reading,monthly_used}' = '1';
  assert public.start_objective_test('43000000-0000-4000-8000-000000000001', 'reading', 'exam', 3600)->>'error' = 'quota_exceeded', 'Second Reading start bypassed the limit';
  assert public.start_objective_test('43000000-0000-4000-8000-000000000002', 'listening', 'practice', 2400)->>'error' = 'quota_exceeded', 'Zero Listening limit was bypassed';
  assert public.get_objective_test_quotas() #>> '{listening,monthly_used}' = '0';
  assert (select count(*) from public.test_sessions where id = sid) = 1, 'Resume target disappeared';
  begin
    insert into public.test_sessions(user_id, passage_id, test_type, test_mode)
    values ('42000000-0000-4000-8000-000000000001', '43000000-0000-4000-8000-000000000001', 'reading', 'practice');
    raise exception 'Direct Reading insert bypassed the quota';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.test_sessions set test_type = 'writing' where id = sid;
    raise exception 'Reading session identity was editable';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- An older start still counts this month, but no longer counts today.
set local role service_role;
update objective_private.test_start_ledger
set started_at = date_trunc('day', now() at time zone 'UTC') at time zone 'UTC' - interval '1 day'
where user_id = '42000000-0000-4000-8000-000000000001';
reset role;
select set_config('request.jwt.claims', '{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  assert public.get_objective_test_quotas() #>> '{reading,daily_used}' = '0';
  assert public.get_objective_test_quotas() #>> '{reading,monthly_used}' = '1';
  assert public.start_objective_test('43000000-0000-4000-8000-000000000001', 'reading', 'practice', 3600)->>'error' = 'quota_exceeded',
    'Monthly limit did not survive the daily reset';
end $$;
reset role;

-- Deleting a session cannot refund its start. A currency override changes the
-- Free allowance without changing the already-recorded usage.
set local role service_role;
delete from public.test_sessions
where user_id = '42000000-0000-4000-8000-000000000001' and test_type = 'reading';
update public.users set subscription_currency = 'BDT'
where id = '42000000-0000-4000-8000-000000000001';
insert into public.tier_rate_limits(tier, currency, reading_daily_limit, reading_monthly_limit)
values ('free', 'BDT', 3, 3)
on conflict (tier, currency) do update set
  reading_daily_limit = excluded.reading_daily_limit,
  reading_monthly_limit = excluded.reading_monthly_limit;
reset role;
select set_config('request.jwt.claims', '{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  assert public.get_objective_test_quotas() #>> '{reading,monthly_used}' = '1',
    'Deleting a session refunded its start';
  assert public.get_objective_test_quotas() #>> '{reading,monthly_limit}' = '3',
    'Currency override did not apply';
end $$;
reset role;

-- Paid users are unlimited; an expired paid subscription follows Free limits.
select set_config('request.jwt.claims', '{"sub":"41000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  assert public.start_objective_test('43000000-0000-4000-8000-000000000001', 'reading', 'practice', 3600) ? 'session';
  assert public.start_objective_test('43000000-0000-4000-8000-000000000001', 'reading', 'exam', 3600) ? 'session';
  assert public.get_objective_test_quotas() #>> '{reading,monthly_limit}' = '-1';
  assert public.get_objective_test_quotas() #>> '{reading,monthly_used}' = '0',
    'Paid starts should not consume a later Free allowance';
end $$;
reset role;

set local role service_role;
update public.users set subscription_tier = 'free', subscription_end_date = null
where id = '42000000-0000-4000-8000-000000000002';
reset role;
select set_config('request.jwt.claims', '{"sub":"41000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  assert public.get_objective_test_quotas() #>> '{reading,monthly_used}' = '0',
    'Downgrade counted earlier paid starts against Free';
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"41000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  assert public.get_objective_test_quotas() #>> '{reading,monthly_limit}' = '1';
  assert public.start_objective_test('43000000-0000-4000-8000-000000000002', 'listening', 'practice', 2400)->>'error' = 'quota_exceeded';
end $$;
reset role;

rollback;

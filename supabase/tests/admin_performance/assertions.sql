create function public.test_assert(ok boolean,msg text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'Assertion failed: %',msg; end if; end $$;
create function public.test_denied(statement text) returns boolean language plpgsql as $$
begin execute statement; return false; exception when insufficient_privilege then return true; end $$;

select public.test_assert(public.get_ai_usage_stats_paginated(1,20,'totalCalls','desc')::jsonb=(select result from baseline_ai),'AI lifecycle/cost/endpoint output parity');
select public.test_assert(public.get_marketing_dashboard(30)=(select result from baseline_marketing),'Marketing metrics/currencies parity with multiplying join fixture');
select public.test_assert((public.get_ai_usage_stats_paginated(999,20,'cost','desc')->>'total')::int=44,'Out-of-range AI page retains total');
select public.test_assert((public.get_admin_referral_stats()->'topReferrers'->0->>'count')::int=101,'Leader beyond first 100 referrals');
select public.test_assert((public.get_admin_referral_stats()->>'totalReferrals')::int=201,'Complete referral total');
select public.test_assert((public.admin_broadcast_page()->'stats'->>'reads')::int=1501,'All broadcast opens beyond API row cap');
select public.test_assert(jsonb_array_length(public.admin_broadcast_page()->'entries')=26,'Broadcast bounded lookahead');
select public.test_assert((public.admin_broadcast_page()->'entries'->0->>'read_count')::int=1501,'Per-broadcast exact opens');
select public.test_assert((select sum(value::int) from jsonb_each_text(public.admin_broadcast_page()->'stats') where key<>'reads')=60,'All broadcast state counts');
select public.test_assert(jsonb_array_length(public.admin_payment_requests_page()->'entries')=51,'Payment bounded lookahead');
select public.test_assert(jsonb_array_length(public.admin_payment_requests_page('pending','learner@example.test')->'entries')=51,'Server-side payment search/status');
select public.test_assert(jsonb_array_length(public.admin_payment_requests_page('pending','trx105')->'entries')=1,'Search finds old records outside first page');
with first_page as (select public.admin_payment_requests_page()->'entries'->49 last_row)
select public.test_assert(jsonb_array_length(public.admin_payment_requests_page('all','',(last_row->>'created_at')::timestamptz,(last_row->>'id')::uuid)->'entries')=51,'Payment cursor retrieves next page') from first_page;

set role authenticated;
select public.test_assert((select count(*) from public.users)=44,'AAL2 admin sees all users');
select public.test_assert((select count(*) from public.ai_api_usage)=1720,'AAL2 admin sees all usage');
select public.test_assert(public.get_ai_coach_budget_status()->>'enabled'='true','AAL2 budget access');
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000002","aal":"aal1"}',false);
select public.test_assert((select count(*) from public.users)=1,'Learner only sees own profile');
select public.test_assert((select count(*) from public.ai_api_usage)=40,'Learner only sees own usage');
select public.test_assert((select count(*) from public.test_sessions)=1,'Learner only sees own sessions');
select public.test_assert(public.test_denied('select public.get_admin_referral_stats()'),'Learner denied referrals summary');
select public.test_assert(public.test_denied('select public.admin_broadcast_page()'),'Learner denied broadcast summary');
select public.test_assert(public.test_denied('select public.admin_payment_requests_page()'),'Learner denied payment summary');
select public.test_assert(public.test_denied('select public.get_ai_coach_budget_status()'),'Learner denied coach budget');
select public.test_assert(public.test_denied('update public.test_sessions set user_id=''00000000-0000-0000-0000-000000000003'' where user_id=''00000000-0000-0000-0000-000000000002'''),'Session ownership cannot be reassigned');
select public.test_assert(public.test_denied('insert into public.test_sessions(user_id) values(''00000000-0000-0000-0000-000000000003'')'),'Cannot insert another learner session');
with inserted as (insert into public.test_sessions(user_id) values('00000000-0000-0000-0000-000000000002') returning id)
select public.test_assert((select count(*) from inserted)=1,'Own session insert succeeds');
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","aal":"aal1"}',false);
select public.test_assert((select count(*) from public.users)=1,'Admin AAL1 cannot read other users');
select public.test_assert(public.test_denied('select public.admin_broadcast_page()'),'Admin AAL1 denied sensitive summaries');
select public.test_assert(public.test_denied('select public.get_ai_coach_budget_status()'),'Admin AAL1 denied budget');
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","aal":"aal1","recovery":"active"}',false);
select public.test_assert((select count(*) from public.users)=44,'Active admin recovery preserved');
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","aal":"aal1","recovery":"expired"}',false);
select public.test_assert((select count(*) from public.users)=1,'Expired recovery denied');
reset role;
set role anon;
select public.test_assert(public.test_denied('select public.get_admin_referral_stats()'),'Anonymous cannot execute referrals');
select public.test_assert(public.test_denied('select public.admin_broadcast_page()'),'Anonymous cannot execute broadcasts');
select public.test_assert(public.test_denied('select public.admin_payment_requests_page()'),'Anonymous cannot execute payments');
reset role;
select 'Admin performance SQL: output parity, ownership, MFA, cursors and completeness passed' result;

create role anon;
create role authenticated;
create schema auth;
create function auth.jwt() returns jsonb language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb
$$;
create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
create table public.users(id uuid primary key,auth_id uuid unique,role text,full_name text,email text,avatar_url text);
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.users where auth_id=auth.uid() and role='admin')
   and coalesce(auth.jwt()->>'aal'='aal2' or auth.jwt()->>'recovery'='active',false)
$$;
create function public.get_my_public_user_id() returns uuid language sql stable security definer set search_path='' as $$
 select id from public.users where auth_id=auth.uid()
$$;
create table public.ai_api_usage(id uuid default gen_random_uuid(),user_id uuid,endpoint text,cached boolean,tokens_used bigint,created_at timestamptz,request_metadata jsonb);
create table public.test_sessions(id uuid default gen_random_uuid(),user_id uuid,paired_room_id uuid);
create table public.marketing_campaigns(id uuid primary key,name text,status text,objective text,channels text[],created_at timestamptz);
create table public.marketing_deliveries(id uuid primary key,campaign_id uuid,user_id uuid,status text,failure_reason text);
create table public.marketing_events(id uuid default gen_random_uuid(),campaign_id uuid,user_id uuid,event_type text,occurred_at timestamptz);
create table public.billing_history(id uuid default gen_random_uuid(),institution_id uuid,marketing_campaign_id uuid,user_id uuid,status text,amount numeric,gross_amount numeric,discount_amount numeric,currency text,created_at timestamptz);
create schema ai_coach_private;
create table ai_coach_private.settings(id boolean,enabled boolean,daily_budget_usd numeric,warning_budget_usd numeric,reserved_request_cost_usd numeric);
create table ai_coach_private.operations(state text,reserved_cost numeric,actual_cost numeric,created_at timestamptz);
insert into ai_coach_private.settings values(true,true,3,2.4,0.01);
create table public.user_referrals(id uuid default gen_random_uuid(),referrer_id uuid,referred_id uuid);
create table public.notifications(id uuid primary key,title text,message text,is_active boolean,starts_at timestamptz,expires_at timestamptz,created_at timestamptz);
create table public.notification_reads(notification_id uuid,user_id uuid,read_at timestamptz);
create table public.payment_requests(id uuid primary key,auth_id uuid,status text,transaction_id text,sender_phone text,payment_method text,created_at timestamptz);
alter table public.users enable row level security;
alter table public.ai_api_usage enable row level security;
alter table public.test_sessions enable row level security;
create policy users_select_policy on public.users for select to authenticated using(auth_id=(select auth.uid()) or public.is_admin());
create policy api_usage_select_policy on public.ai_api_usage for select to authenticated using(user_id=(select id from public.users where auth_id=(select auth.uid())) or public.is_admin());
create policy sessions_all_policy on public.test_sessions to authenticated using(user_id=(select public.get_my_public_user_id()) or public.is_admin());
grant usage on schema public,auth to anon,authenticated;
grant select on public.users,public.ai_api_usage to authenticated;
grant select,insert,update,delete on public.test_sessions to authenticated;
insert into public.users values
 ('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','admin','Admin','admin@example.test',null),
 ('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','learner','Learner','learner@example.test',null),
 ('00000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003','learner','Leader','leader@example.test',null);
insert into public.users select md5(n::text)::uuid,md5(('auth'||n)::text)::uuid,'learner','User'||n,n||'@example.test',null from generate_series(1,40)n;
insert into public.ai_api_usage
 select gen_random_uuid(),u.id,'endpoint'||(n%3),(n%2=0),n*10,now()-make_interval(days=>n%4),
 jsonb_build_object('reservationStatus',case n%5 when 0 then 'reserved' when 1 then 'failed' else 'completed' end,
 'estimatedProviderCostUsd',case when n%2=0 then '0.01' else 'not priced' end)
 from public.users u cross join generate_series(1,40)n;
insert into public.users values('00000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004','learner','Unused','unused@example.test',null);
insert into public.test_sessions(user_id) select id from public.users;
insert into public.marketing_campaigns values('20000000-0000-0000-0000-000000000001','Campaign','active','paid_conversion','{email}',now());
insert into public.marketing_deliveries select gen_random_uuid(),'20000000-0000-0000-0000-000000000001',u.id,
 case n when 1 then 'delivered' when 2 then 'failed' else 'skipped' end,'marketing_consent_required'
 from public.users u cross join generate_series(1,3)n;
insert into public.marketing_events(campaign_id,user_id,event_type,occurred_at)
 select '20000000-0000-0000-0000-000000000001',u.id,case n when 1 then 'viewed' when 2 then 'clicked' else 'checkout_started' end,
 now()-make_interval(days=>n%3) from public.users u cross join generate_series(1,3)n;
insert into public.billing_history(marketing_campaign_id,user_id,status,amount,gross_amount,discount_amount,currency,created_at)
 select '20000000-0000-0000-0000-000000000001',u.id,'paid',10,12,2,case n when 1 then 'USD' else 'BDT' end,now()
 from public.users u cross join generate_series(1,2)n;
insert into public.user_referrals(referrer_id) select case when n<=100 then '00000000-0000-0000-0000-000000000002'::uuid
 else '00000000-0000-0000-0000-000000000003'::uuid end from generate_series(1,201)n;
insert into public.notifications select md5(('notice'||n)::text)::uuid,'Notice'||n,'Body',n%4<>0,
 case when n%4=1 then now()+interval '1 day' else null end,
 case when n%4=2 then now()-interval '1 day' else null end,now()-make_interval(days=>n)
 from generate_series(1,60)n;
insert into public.notification_reads select (select id from public.notifications order by created_at desc limit 1),
 md5(n::text)::uuid,now() from generate_series(1,1501)n;
insert into public.payment_requests select md5(('pay'||n)::text)::uuid,'10000000-0000-0000-0000-000000000002',
 case when n%2=0 then 'approved' else 'pending' end,'trx'||n,'555','manual',now()-make_interval(days=>n)
 from generate_series(1,105)n;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","aal":"aal2"}',false);

begin;
insert into auth.users values ('10000000-0000-4000-8000-000000000001'), ('10000000-0000-4000-8000-000000000002'), ('10000000-0000-4000-8000-000000000003');
insert into public.users (auth_id,role) values
 ('10000000-0000-4000-8000-000000000001','admin'),
 ('10000000-0000-4000-8000-000000000002','user'),
 ('10000000-0000-4000-8000-000000000003','admin');
insert into public.admin_payment_alert_reads values ('10000000-0000-4000-8000-000000000001',now()-interval '1 day',now()-interval '1 day');
insert into public.payment_requests (status,payment_method,created_at) values
 ('pending','manual',now()-interval '20 minutes'),
 ('pending','manual',now()-interval '10 minutes'),
 ('approved','stripe',now()-interval '20 minutes'),
 ('approved','manual',now()-interval '20 minutes'),
 ('declined','stripe',now()-interval '20 minutes'),
 ('pending','manual',now()-interval '2 days'),
 ('approved','stripe',now()+interval '1 day');
update public.users set payment_failed_at=now()-interval '20 minutes' where role='user';
insert into public.feature_requests (status) values ('pending'),('pending'),('approved'),('declined');
insert into public.test_issue_reports (status) values ('open'),('reviewing'),('resolved'),('dismissed');
insert into public.institution_applications (status) values ('pending'),('approved'),('declined');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ declare r jsonb; begin
 r:=public.get_admin_sidebar_badges();
 assert r->>'pendingCount'='2' and r->>'stripePaymentCount'='1' and r->>'stripeFailureCount'='1', 'Payment filtering changed';
 assert r->>'featureRequestCount'='2' and r->>'testReportCount'='2' and r->>'institutionRequestCount'='1', 'Wrong queue statuses';
 r:=public.get_admin_sidebar_badges(now()-interval '15 minutes');
 assert r->>'pendingCount'='1' and r->>'stripePaymentCount'='0' and r->>'stripeFailureCount'='0', 'Dismissal swallowed a later payment';
 r:=public.get_admin_sidebar_badges(now()-interval '1 day');
 assert r->>'pendingCount'='1', 'Older device moved marker backward';
 begin
  perform public.get_admin_sidebar_badges(now()+interval '1 day');
  raise exception 'Future acknowledgment accepted';
 exception when invalid_parameter_value then null; end;
end $$;
reset role;
do $$ declare old_xmin xid; old_updated timestamptz; begin
 select xmin,updated_at into old_xmin,old_updated from public.admin_payment_alert_reads where admin_id=auth.uid();
 perform public.get_admin_sidebar_badges(); perform public.get_admin_sidebar_badges();
 assert (select xmin=old_xmin and updated_at=old_updated from public.admin_payment_alert_reads where admin_id=auth.uid()), 'Polling wrote marker';
end $$;
update public.feature_requests set status='approved' where status='pending';
update public.test_issue_reports set status='resolved' where status in ('open','reviewing');
update public.institution_applications set status='declined' where status='pending';
do $$ declare r jsonb; begin
 r:=public.get_admin_sidebar_badges();
 assert r->>'featureRequestCount'='0' and r->>'testReportCount'='0' and r->>'institutionRequestCount'='0', 'Reviewed items stayed in badge';
end $$;

-- Cap all growing queues and payment sources without exposing any record bodies.
insert into public.feature_requests(status) select 'pending' from generate_series(1,1000);
insert into public.test_issue_reports(status) select 'open' from generate_series(1,1000);
insert into public.institution_applications(status) select 'pending' from generate_series(1,1000);
insert into public.payment_requests(status,payment_method,created_at) select 'pending','manual',now()-interval '1 minute' from generate_series(1,1000);
insert into public.payment_requests(status,payment_method,created_at) select 'approved','stripe',now()-interval '1 minute' from generate_series(1,1000);
insert into public.users(role,payment_failed_at) select 'user',now()-interval '1 minute' from generate_series(1,1000);
do $$ declare r jsonb; key text; begin
 r:=public.get_admin_sidebar_badges();
 foreach key in array array['pendingCount','stripePaymentCount','stripeFailureCount','featureRequestCount','testReportCount','institutionRequestCount'] loop
  assert r->>key='100', 'Unbounded count: '||key;
 end loop;
 assert (select count(*) from jsonb_object_keys(r))=7, 'Unexpected data in response';
end $$;

-- Fresh administrators do not receive historical payment alerts.
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
set local role authenticated;
do $$ declare r jsonb; begin
 r:=public.get_admin_sidebar_badges();
 assert r->>'pendingCount'='0' and r->>'stripePaymentCount'='0' and r->>'stripeFailureCount'='0', 'First-use baseline regressed';
 assert r->>'testReportCount'='100', 'First-use hid actionable reports';
end $$;
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$ begin
 begin perform public.get_admin_sidebar_badges(); raise exception 'Learner read counts'; exception when insufficient_privilege then null; end;
 begin perform public.get_admin_sidebar_badges(now()); raise exception 'Learner acknowledged payments'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role authenticated;
do $$ begin
 begin perform public.get_admin_sidebar_badges(); raise exception 'Missing identity read counts'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.get_admin_sidebar_badges(); raise exception 'Anonymous read counts'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'Admin badge database integration checks passed' as result;

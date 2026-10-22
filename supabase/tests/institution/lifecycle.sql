-- Runs in the isolated database harness. Everything is rolled back.
begin;
select set_config('request.jwt.claim.role','service_role',true);
insert into auth.users(id,email,email_confirmed_at) values
 ('00000000-0000-0000-0000-000000000001','admin@example.com',now()),
 ('00000000-0000-0000-0000-000000000002','owner@example.com',now()),
 ('00000000-0000-0000-0000-000000000003','student@example.com',now()),
 ('00000000-0000-0000-0000-000000000004','paid@example.com',now()),
 ('00000000-0000-0000-0000-000000000005','stranger@example.com',now());
insert into public.users(auth_id,email,role,subscription_tier,subscription_end_date) values
 ('00000000-0000-0000-0000-000000000001','admin@example.com','admin','free',null),
 ('00000000-0000-0000-0000-000000000002','owner@example.com','user','free',null),
 ('00000000-0000-0000-0000-000000000003','student@example.com','user','free',null),
 ('00000000-0000-0000-0000-000000000004','paid@example.com','user','premium',now()+interval '10 days'),
 ('00000000-0000-0000-0000-000000000005','stranger@example.com','user','free',null);
create temporary table institution_test_ids(k text primary key,id uuid);
do $$ declare
 admin uuid:='00000000-0000-0000-0000-000000000001'; owner uuid:='00000000-0000-0000-0000-000000000002';
 student uuid:='00000000-0000-0000-0000-000000000003'; paid uuid:='00000000-0000-0000-0000-000000000004'; stranger uuid:='00000000-0000-0000-0000-000000000005';
 institution uuid; other uuid; allocation uuid; seat uuid; paid_seat uuid; test_order uuid; preview_order uuid:=gen_random_uuid(); result jsonb; old_expiry timestamptz; quota record; student_id uuid;
begin
 result:=public.institution_action(admin,'create','{"name":"Test Centre","owner_email":"owner@example.com"}'); institution:=(result->>'id')::uuid;
 insert into institution_test_ids values('institution',institution);
 result:=public.institution_action(admin,'create','{"name":"Other Centre","owner_email":"stranger@example.com"}');other:=(result->>'id')::uuid;
 insert into institution_test_ids values('other',other);
 perform public.institution_action(admin,'enable','{"enabled":true}');
 perform public.institution_action(admin,'invite_owner',jsonb_build_object('institution_id',institution,'email','owner@example.com','token_hash','owner-token'));
 perform public.institution_action(owner,'accept','{"token_hash":"owner-token"}');
 if (select owner_auth_id from public.institutions where id=institution)<>owner then raise exception 'Owner not assigned'; end if;
 begin perform public.institution_action(stranger,'detail',jsonb_build_object('institution_id',institution));raise exception 'Cross-tenant access allowed';exception when insufficient_privilege then null;end;
 begin perform public.institution_action(owner,'grant',jsonb_build_object('institution_id',institution,'reason','Attempt'));raise exception 'Owner granted free seats';exception when insufficient_privilege then null;end;
 result:=public.institution_action(admin,'grant',jsonb_build_object('institution_id',institution,'tier','pro','quantity',3,'access_days',30,'activation_deadline',now()+interval '90 days','reason','Pilot'));
 allocation:=(result->>'id')::uuid;
 if (select count(*) from public.institution_seats where order_id=allocation)<>3 then raise exception 'Grant count mismatch';end if;
 if exists(select 1 from public.billing_history) then raise exception 'Complimentary seats became revenue';end if;
 result:=public.institution_action(owner,'invite',jsonb_build_object('institution_id',institution,'email','student@example.com','token_hash','student-token','order_id',allocation));
 seat:=(result->>'seat_id')::uuid;
 begin perform public.institution_action(stranger,'accept','{"token_hash":"student-token"}');raise exception 'Wrong account accepted';exception when insufficient_privilege then null;end;
 perform public.institution_action(student,'accept','{"token_hash":"student-token"}');
 perform public.institution_action(student,'accept','{"token_hash":"student-token"}');
 if (select status from public.institution_seats where id=seat)<>'active' then raise exception 'Student not activated';end if;
 if (select subscription_tier from public.users where auth_id=student)<>'free' then raise exception 'Personal plan overwritten';end if;
 if (select subscription_tier from public.institution_learner_profiles where auth_id=student)<>'pro' then raise exception 'Effective view lacks Pro access';end if;
 select id into student_id from public.users where auth_id=student;
 if skill_lab_private.tier(student_id)<>'pro' then raise exception 'Practice Lab tier did not resolve Pro';end if;
 if (objective_private.test_start_status((select u from public.users u where id=student_id),'reading')->>'limit')::int<>-1 then raise exception 'Reading did not recognise paid access';end if;
 select * into quota from public.check_user_rate_limit(student_id,'free','writing');
 if quota.daily_remaining<>20 then raise exception 'Institution did not receive the Pro writing allowance: %',quota.daily_remaining; end if;
 select * into quota from public.reserve_ai_api_usage(student,'generateDetailedFeedback','writing','institution-writing-one');
 if not quota.allowed then raise exception 'Institution writing reservation denied';end if;
 perform public.reserve_ai_api_usage(student,'generateDetailedFeedback','writing','institution-writing-one');
 if (select count(*) from public.ai_api_usage where user_id=student_id)<>1 then raise exception 'Quota reservation duplicated';end if;

 begin perform public.institution_action(owner,'cancel',jsonb_build_object('institution_id',institution,'seat_id',seat));raise exception 'Activated seat reassigned';exception when raise_exception then if SQLERRM='Activated seat reassigned' then raise;end if;end;
 result:=public.institution_action(owner,'invite',jsonb_build_object('institution_id',institution,'email','paid@example.com','token_hash','paid-token','order_id',allocation));
 paid_seat:=(result->>'seat_id')::uuid;
 perform public.institution_action(paid,'accept','{"token_hash":"paid-token"}');
 if (select status from public.institution_seats where id=paid_seat)<>'waiting' then raise exception 'Personal paid access failed to reserve';end if;
 -- Accepted reservations survive allocation deadline; only unaccepted seats expire.
 update public.institution_orders set activation_deadline=now()-interval '1 day' where id=allocation;
 perform institution_private.reconcile_all();
 if (select status from public.institution_seats where id=paid_seat)<>'waiting' then raise exception 'Waiting seat expired with allocation';end if;
 update public.users set subscription_end_date=now()-interval '2 hours' where auth_id=paid;
 perform institution_private.reconcile_user(paid);
 if (select status from public.institution_seats where id=paid_seat)<>'active' then raise exception 'Waiting seat did not activate';end if;
 select access_until into old_expiry from public.institution_seats where id=paid_seat;
 perform public.institution_action(admin,'extend',jsonb_build_object('institution_id',institution,'seat_id',paid_seat,'access_until',old_expiry+interval '5 days','reason','Correction'));
 perform public.institution_action(admin,'revoke',jsonb_build_object('institution_id',institution,'seat_id',paid_seat,'reason','Pilot ended'));
 if (institution_private.access(paid)->>'subscription_tier')<>'free' then raise exception 'Revocation kept institutional access';end if;
 update public.users set subscription_tier='premium',subscription_end_date=now()+interval '5 days' where auth_id=paid;
 if institution_private.access(paid)->>'subscription_tier'<>'premium' then raise exception 'Revocation failed to fall back to valid personal access';end if;
 -- A new seat for an active institutional student is reserved as a renewal.
 result:=public.institution_action(admin,'grant',jsonb_build_object('institution_id',institution,'tier','pro','quantity',1,'access_days',30,'activation_deadline',now()+interval '90 days','reason','Renewal allocation'));
 allocation:=(result->>'id')::uuid;
 result:=public.institution_action(owner,'invite',jsonb_build_object('institution_id',institution,'email','student@example.com','token_hash','renewal-token','order_id',allocation));
 perform public.institution_action(student,'accept','{"token_hash":"renewal-token"}');
 if (select count(*) from public.institution_seats where user_auth_id=student and status='active')<>1 or (select count(*) from public.institution_seats where user_auth_id=student and status='waiting')<>1 then raise exception 'Renewal was not reserved alongside active access';end if;
 perform public.institution_action(admin,'release',jsonb_build_object('institution_id',institution,'seat_id',result->>'seat_id','reason','Renewal cancelled'));
 if exists(select 1 from public.institution_seats where user_auth_id=student and status='waiting') then raise exception 'Waiting reservation not released';end if;
 -- Quoted amounts stay immutable even if the current price book changes.
 perform public.institution_prepare_order(owner,preview_order,institution,'{"tier":"pro","months":1,"quantity":5,"amount_minor":4995,"total":49.95,"currency":"USD"}');
 perform public.institution_prepare_order(owner,preview_order,institution,'{"tier":"pro","months":1,"quantity":5,"amount_minor":9995,"total":99.95,"currency":"USD"}');
 if (select amount_minor from public.institution_orders where id=preview_order)<>4995 then raise exception 'Historical quote repriced';end if;
 perform public.institution_action(admin,'update',jsonb_build_object('institution_id',institution,'status','suspended','reason','Pause distribution'));
 begin perform public.institution_prepare_order(owner,gen_random_uuid(),institution,'{"tier":"pro","months":1,"quantity":5,"amount_minor":4995,"total":49.95,"currency":"USD"}');raise exception 'Suspended checkout allowed';exception when raise_exception then if SQLERRM='Suspended checkout allowed' then raise;end if;end;
 if (institution_private.access(student)->>'subscription_tier')<>'pro' then raise exception 'Suspension revoked active access';end if;
 perform public.institution_action(admin,'update',jsonb_build_object('institution_id',institution,'status','active','reason','Resume'));
 -- Paid order settlement is exactly-once, binds totals/session, and preserves the owner plan.
 test_order:=gen_random_uuid();
 insert into public.institution_orders(id,institution_id,source,status,tier,quantity,months,amount_minor,currency,pricing_snapshot,created_by,checkout_session_id)
 values(test_order,institution,'paid','pending','premium',2,1,2000,'USD','{"total":20}',owner,'cs_institution_test');
 begin perform public.institution_settle_order(test_order,'cs_institution_test','pi_test',1,'USD',now());raise exception 'Tampered amount fulfilled';exception when raise_exception then if SQLERRM='Tampered amount fulfilled' then raise;end if;end;
 perform public.institution_settle_order(test_order,'cs_institution_test','pi_test',2000,'USD',now());
 perform public.institution_settle_order(test_order,'cs_institution_test','pi_test',2000,'USD',now());
 if (select count(*) from public.institution_seats where order_id=test_order)<>2 then raise exception 'Duplicate settlement created extra seats';end if;
 if (select status from public.billing_history limit 1)<>'paid' then raise exception 'Institution revenue is not settled';end if;
 if (select count(*) from public.billing_history)<>1 then raise exception 'Duplicate revenue';end if;
 if (select subscription_tier from public.users where auth_id=owner)<>'free' then raise exception 'Owner upgraded by seat purchase';end if;
 perform public.institution_refund_order('pi_test',500);
 if (select amount from public.institution_revenue_history where transaction_id='cs_institution_test')<>15 then raise exception 'Partial refund net revenue incorrect';end if;
 if (select status from public.institution_orders where id=test_order)<>'reconciliation' then raise exception 'Partial refund did not block allocation';end if;
 perform public.institution_refund_order('pi_test',2000);
 if exists(select 1 from public.institution_seats where order_id=test_order and status<>'revoked') then raise exception 'Full refund kept seats';end if;
 if (select count(*) from public.ai_api_usage where user_id=student_id)<>1 then raise exception 'Access changes reset usage';end if;
 if (select count(*) from public.institution_audit where institution_id=institution)<10 then raise exception 'Audit history missing';end if;
 raise notice 'Lifecycle, personal-plan preservation, settlement and refund assertions passed';
end $$;
-- Client roles cannot write allocations or invoke service-only operations.
grant select on institution_test_ids to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$ begin
 if (select count(*) from public.institutions)<>1 then raise exception 'Owner RLS leaked another tenant';end if;
 begin update public.institution_seats set status='active';raise exception 'Client seat write allowed';exception when insufficient_privilege then null;end;
 begin perform public.institution_action('00000000-0000-0000-0000-000000000001','enable','{"enabled":true}');raise exception 'Forged admin actor allowed';exception when insufficient_privilege then null;end;
 begin perform institution_private.access('00000000-0000-0000-0000-000000000003');raise exception 'Private entitlement exposed';exception when insufficient_privilege then null;end;
 if (public.get_my_institution_access()->>'subscription_tier')<>'free' then raise exception 'Owner inadvertently upgraded';end if;
 raise notice 'Owner RLS and denied mutation assertions passed';
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
do $$ begin
 if (select count(*) from public.institutions)<>0 then raise exception 'Student read institution owner details';end if;
 if (select count(*) from public.institution_seats)<>1 then raise exception 'Student seat RLS wrong';end if;
 if public.get_my_institution_access()->>'subscription_tier'<>'pro' then raise exception 'Student profile lacks institutional access';end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$ begin if (select count(*) from public.institutions)<>2 then raise exception 'Admin RLS denied institutions';end if; end $$;
set local role anon;
select set_config('request.jwt.claim.role','anon',true);
do $$ begin
 begin perform * from public.institutions;raise exception 'Anonymous institution access allowed';exception when insufficient_privilege then null;end;
 begin perform public.get_my_institution_access();raise exception 'Anonymous access resolver allowed';exception when insufficient_privilege then null;end;
end $$;
rollback;

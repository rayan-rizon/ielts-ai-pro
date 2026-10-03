-- Private intake, review, retries, and transactional owner invitation.
begin;
select set_config('request.jwt.claim.role','service_role',true);
insert into auth.users(id,email,email_confirmed_at) values
 ('20000000-0000-0000-0000-000000000001','review-admin@example.test',now()),
 ('20000000-0000-0000-0000-000000000002','request-owner@example.test',now());
insert into public.users(auth_id,email,role) select id,email,case when email like 'review-admin%' then 'admin' else 'user' end from auth.users where id::text like '20000000%';
do $$ declare
 admin uuid:='20000000-0000-0000-0000-000000000001'; owner uuid:='20000000-0000-0000-0000-000000000002';
 payload jsonb:='{"request_key":"20000000-0000-0000-0000-000000000003","institution_name":"Request Centre","contact_name":"Owner Name","email":" Request-Owner@Example.Test ","country":"Bangladesh","expected_seats":50}';
 application uuid; institution uuid; r jsonb; before_count integer;
begin
 if has_table_privilege('anon','public.institution_applications','select') or has_table_privilege('authenticated','public.institution_applications','insert') then raise exception 'Browser table permissions exposed';end if;
 if has_function_privilege('anon','public.institution_application_submit(jsonb,text)','execute') or has_function_privilege('authenticated','public.institution_application_admin(uuid,text,jsonb)','execute') then raise exception 'Browser RPC permissions exposed';end if;
 perform public.institution_application_submit(payload,repeat('a',64));
 perform public.institution_application_submit(payload,repeat('a',64));
 perform public.institution_application_submit(payload||jsonb_build_object('request_key',gen_random_uuid()),repeat('b',64));
 if (select count(*) from public.institution_applications)<>1 then raise exception 'Duplicate request created';end if;
 select id into application from public.institution_applications;
 if (select email from public.institution_applications where id=application)<>'request-owner@example.test' then raise exception 'Email not normalized';end if;
 if exists(select 1 from public.institutions) then raise exception 'Application created institution';end if;
 begin perform public.institution_application_admin(owner,'list','{}');raise exception 'Owner read applications';exception when insufficient_privilege then null;end;
 begin perform public.institution_application_admin(null,'list','{}');raise exception 'Anonymous read applications';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claim.role','authenticated',true);
 begin perform public.institution_application_submit(payload,repeat('a',64));raise exception 'Direct user submit allowed';exception when insufficient_privilege then null;end;
 begin perform public.institution_application_admin(admin,'list','{}');raise exception 'Non-service admin allowed';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claim.role','service_role',true);
 r:=public.institution_application_admin(admin,'list','{"status":"pending","search":"REQUEST"}');
 if jsonb_array_length(r->'entries')<>1 or (r->>'pending_count')::integer<>1 then raise exception 'Queue filter/count wrong';end if;
 begin perform public.institution_application_admin(admin,'approve',jsonb_build_object('application_id',application,'reason','test','token_hash',repeat('c',64),'currency','EUR'));raise exception 'Invalid currency allowed';exception when raise_exception then if sqlerrm='Invalid currency allowed' then raise;end if;end;
 if exists(select 1 from public.institutions) then raise exception 'Failed review persisted institution';end if;
 r:=public.institution_application_admin(admin,'approve',jsonb_build_object('application_id',application,'reason','Pilot approval','token_hash',repeat('c',64),'currency','BDT'));
 institution:=(r->'application'->>'institution_id')::uuid;
 if (select currency from public.institutions where id=institution)<>'BDT' then raise exception 'Approval currency wrong';end if;
 if (select owner_auth_id from public.institutions where id=institution) is not null then raise exception 'Owner auto-granted';end if;
 if (select count(*) from public.institution_invitations where institution_id=institution and kind='owner')<>1 then raise exception 'Owner invitation missing';end if;
 if exists(select 1 from public.institution_orders) or exists(select 1 from public.billing_history) then raise exception 'Approval created paid access';end if;
 r:=public.institution_application_admin(admin,'approve',jsonb_build_object('application_id',application,'reason','Retry','token_hash',repeat('d',64)));
 if (r->>'already_reviewed')::boolean is not true or (select count(*) from public.institutions)<>1 or (select count(*) from public.institution_invitations)<>1 then raise exception 'Approval retry not idempotent';end if;
 begin perform public.institution_application_admin(admin,'decline',jsonb_build_object('application_id',application,'reason','Wrong second decision'));raise exception 'Decision changed';exception when raise_exception then if sqlerrm='Decision changed' then raise;end if;end;
 if not exists(select 1 from public.institution_audit where institution_id=institution and action='application_approved' and reason='Pilot approval') then raise exception 'Missing review history';end if;
 -- A token collision after institution creation rolls back that institution too.
 perform public.institution_application_submit(payload||jsonb_build_object('request_key',gen_random_uuid(),'institution_name','Rollback Centre'),repeat('9',64));
 select id into application from public.institution_applications where institution_name='Rollback Centre';
 begin perform public.institution_application_admin(admin,'approve',jsonb_build_object('application_id',application,'reason','Collision test','token_hash',repeat('c',64)));raise exception 'Duplicate token accepted';exception when unique_violation then null;end;
 if (select count(*) from public.institutions)<>1 or (select status from public.institution_applications where id=application)<>'pending' then raise exception 'Failed invitation left partial approval';end if;
 perform public.institution_application_submit(payload||jsonb_build_object('request_key',gen_random_uuid(),'institution_name','Decline Centre'),repeat('a',64));
 select id into application from public.institution_applications where institution_name='Decline Centre';
 perform public.institution_application_admin(admin,'decline',jsonb_build_object('application_id',application,'reason','Not eligible'));
 r:=public.institution_application_admin(admin,'decline',jsonb_build_object('application_id',application,'reason','Retry'));
 if (r->>'already_reviewed')::boolean is not true or (select count(*) from public.institutions)<>1 then raise exception 'Decline created access';end if;
 -- Durable rate budget also applies across Edge Function instances.
 for n in 1..3 loop perform public.institution_application_submit(payload||jsonb_build_object('request_key',gen_random_uuid(),'institution_name','Budget Centre '||n),repeat('a',64));end loop;
 begin perform public.institution_application_submit(payload||jsonb_build_object('request_key',gen_random_uuid(),'institution_name','Budget Blocked'),repeat('a',64));raise exception 'Budget bypass';exception when sqlstate '54000' then null;end;
 -- Pagination is deterministic when timestamps tie.
 r:=public.institution_application_admin(admin,'list','{"status":"all"}');
 r:=public.institution_application_admin(admin,'list',jsonb_build_object('status','all','cursor_date',r->'entries'->0->>'created_at','cursor_id',r->'entries'->0->>'id'));
 if jsonb_array_length(r->'entries')<>5 then raise exception 'Pagination lost rows';end if;
end $$;
rollback;

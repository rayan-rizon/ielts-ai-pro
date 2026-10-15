begin;
insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-000000000001','brand-owner@test.example'),
 ('00000000-0000-0000-0000-000000000002','brand-student@test.example'),
 ('00000000-0000-0000-0000-000000000003','brand-stranger@test.example');
insert into public.users(auth_id,email) select id,email from auth.users;
insert into public.institutions(id,name,owner_auth_id,owner_email,logo_url) values
 ('10000000-0000-0000-0000-000000000001','Academy One','00000000-0000-0000-0000-000000000001','brand-owner@test.example','https://example.com/logo.png'),
 ('10000000-0000-0000-0000-000000000002','Academy Two','00000000-0000-0000-0000-000000000003','brand-stranger@test.example',null);
insert into public.institution_orders(id,institution_id,source,status,tier,quantity,access_days,amount_minor,currency)
values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','complimentary','complimentary','pro',1,30,0,'USD');
insert into public.institution_seats(institution_id,order_id,status,user_auth_id,accepted_at,activated_at,access_until)
values ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','active','00000000-0000-0000-0000-000000000002',now(),now(),now()+interval '30 days');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
set local role authenticated;
do $$ declare result jsonb; begin
  result := public.get_my_institution_access();
  if result->'institution_branding'->>'name' <> 'Academy One'
    or result->'institution_branding'->>'logo_url' <> 'https://example.com/logo.png'
    or result->>'subscription_tier' <> 'pro' then raise exception 'Student branding or entitlement missing'; end if;
  if (result->'institution_branding') ? 'owner_email' then raise exception 'Private institution data leaked'; end if;
  begin
    insert into storage.objects(bucket_id,name) values('institution-logos','10000000-0000-0000-0000-000000000001/student.png');
    raise exception 'Student could upload a logo';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
set local role authenticated;
insert into storage.objects(bucket_id,name) values('institution-logos','10000000-0000-0000-0000-000000000001/owner.png');
do $$ begin
  begin
    insert into storage.objects(bucket_id,name) values('institution-logos','10000000-0000-0000-0000-000000000002/foreign.png');
    raise exception 'Cross-institution upload allowed';
  exception when insufficient_privilege then null; end;
  if (select count(*) from storage.objects) <> 1 then raise exception 'Owner cannot read their own logo'; end if;
end $$;
reset role;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
set local role authenticated;
do $$ begin
  if public.get_my_institution_access()->'institution_branding' <> 'null'::jsonb then raise exception 'Unenrolled user saw branding'; end if;
  if exists(select 1 from storage.objects) then raise exception 'Foreign logo listing allowed'; end if;
  delete from storage.objects;
end $$;
reset role;
do $$ begin
  if (select count(*) from storage.objects) <> 1 then raise exception 'Foreign logo deletion allowed'; end if;
end $$;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
set local role authenticated;
delete from storage.objects;
reset role;
do $$ begin
  if exists(select 1 from storage.objects) then raise exception 'Owner logo cleanup failed'; end if;
end $$;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
update public.institutions set status='suspended' where name='Academy One';
do $$ begin
  if public.get_my_institution_access()->'institution_branding' <> 'null'::jsonb then raise exception 'Suspended institution branding visible'; end if;
end $$;
update public.institutions set status='active' where name='Academy One';
update public.institution_seats set status='waiting', activated_at=null, access_until=null;
update public.users set subscription_tier='premium', subscription_end_date=now()+interval '10 days'
where auth_id='00000000-0000-0000-0000-000000000002';
do $$ declare result jsonb; begin
  result := public.get_my_institution_access();
  if result->'institution_branding'->>'name' <> 'Academy One'
    or result->>'subscription_tier' <> 'premium'
    or result->'institution_access'->>'status' <> 'waiting' then
    raise exception 'Waiting student branding changed personal access';
  end if;
end $$;
update public.institution_seats set status='active', activated_at=now()-interval '31 days', access_until=now()-interval '1 day';
do $$ begin
  if public.get_my_institution_access()->'institution_branding' <> 'null'::jsonb then raise exception 'Expired student branding visible'; end if;
end $$;
update public.institution_seats set status='revoked';
do $$ begin
  if public.get_my_institution_access()->'institution_branding' <> 'null'::jsonb then raise exception 'Revoked student branding visible'; end if;
end $$;
rollback;

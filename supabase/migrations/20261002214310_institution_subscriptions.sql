-- Institution allocations never write a student's personal subscription or usage counters.
create schema if not exists institution_private;
revoke all on schema institution_private from public, anon, authenticated;

create table public.institutions (
 id uuid primary key default gen_random_uuid(), name text not null check(length(btrim(name)) between 1 and 160),
 owner_auth_id uuid references auth.users(id) on delete set null, owner_email text not null,
 contact_email text, contact_phone text, logo_url text,
 status text not null default 'active' check(status in ('active','suspended','archived')),
 currency text not null default 'USD' check(currency ~ '^[A-Z]{3}$'), stripe_customer_id text unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index institutions_owner_idx on public.institutions(owner_auth_id);
create table public.institution_pricing (
 id uuid primary key default gen_random_uuid(), institution_id uuid references public.institutions(id),
 kind text not null check(kind in ('default','bulk','override','package')),
 tier text not null check(tier in ('pro','premium')), months integer not null check(months in (1,3)),
 currency text not null check(currency ~ '^[A-Z]{3}$'), quantity integer not null default 1 check(quantity > 0),
 amount numeric not null check(amount > 0), enabled boolean not null default true,
 created_at timestamptz not null default now(),
 check((kind in ('default','bulk') and institution_id is null) or (kind in ('override','package') and institution_id is not null))
);
create unique index institution_pricing_unique on public.institution_pricing(coalesce(institution_id,'00000000-0000-0000-0000-000000000000'::uuid),kind,tier,months,currency,quantity);
create table public.institution_orders (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 source text not null check(source in ('paid','complimentary')),
 status text not null check(status in ('pending','paid','complimentary','failed','refunded','reconciliation')),
 tier text not null check(tier in ('pro','premium')), quantity integer not null check(quantity between 1 and 10000),
 months integer check(months in (1,3)), access_days integer check(access_days between 1 and 3650),
 amount_minor bigint not null default 0 check(amount_minor >= 0), currency text not null,
 pricing_snapshot jsonb not null default '{}', reason text, created_by uuid references auth.users(id),
 checkout_session_id text unique, payment_intent_id text unique, invoice_url text, receipt_url text,
 activation_deadline timestamptz, paid_at timestamptz, refunded_minor bigint not null default 0,
 created_at timestamptz not null default now(),
 check((source='paid' and months is not null and amount_minor>0) or (source='complimentary' and access_days is not null and amount_minor=0))
);
create index institution_orders_list_idx on public.institution_orders(institution_id,created_at desc);
create table public.institution_seats (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.institution_orders(id),
 institution_id uuid not null references public.institutions(id),
 status text not null default 'available' check(status in ('available','invited','waiting','active','expired','revoked')),
 recipient_email text, recipient_name text, user_auth_id uuid references auth.users(id) on delete set null,
 accepted_at timestamptz, activated_at timestamptz, access_until timestamptz,
 created_at timestamptz not null default now()
);
create index institution_seats_list_idx on public.institution_seats(institution_id,status);
create unique index institution_one_active on public.institution_seats(user_auth_id) where status='active';
create unique index institution_one_waiting on public.institution_seats(user_auth_id) where status='waiting';
create unique index institution_one_invite on public.institution_seats(institution_id,lower(recipient_email)) where status='invited';
create table public.institution_invitations (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 seat_id uuid references public.institution_seats(id), kind text not null check(kind in ('owner','student')),
 email text not null, token_hash text not null unique, expires_at timestamptz not null,
 accepted_at timestamptz, cancelled_at timestamptz, sent_at timestamptz, delivery_error text,
 created_at timestamptz not null default now()
);
create table public.institution_audit (
 id bigint generated always as identity primary key, institution_id uuid references public.institutions(id),
 actor_auth_id uuid, action text not null, reason text not null, before_value jsonb, after_value jsonb,
 created_at timestamptz not null default now()
);
-- Read policies are tenant scoped; all writes go through the checked transactional API.
do $$ declare t text; begin
 foreach t in array array['institutions','institution_pricing','institution_orders','institution_seats','institution_invitations','institution_audit'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public, anon, authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant usage, select on sequence public.institution_audit_id_seq to service_role;
create function institution_private.is_admin(p_actor uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.users where auth_id=p_actor and role='admin')
$$;
create function institution_private.can_manage(p_id uuid,p_actor uuid) returns boolean language sql stable security definer set search_path='' as $$
 select institution_private.is_admin(p_actor) or exists(select 1 from public.institutions where id=p_id and owner_auth_id=p_actor)
$$;
grant select on public.institutions,public.institution_orders,public.institution_seats to authenticated;
create policy institution_owner_read on public.institutions for select to authenticated using(institution_private.can_manage(id,(select auth.uid())));
create policy institution_order_read on public.institution_orders for select to authenticated using(institution_private.can_manage(institution_id,(select auth.uid())));
create policy institution_seat_read on public.institution_seats for select to authenticated using(institution_private.can_manage(institution_id,(select auth.uid())) or user_auth_id=(select auth.uid()));
-- Policy helpers have no write privileges and expose booleans only.
grant usage on schema institution_private to authenticated;
grant execute on function institution_private.is_admin(uuid),institution_private.can_manage(uuid,uuid) to authenticated;

insert into public.system_settings(key,value) values('institution_enabled','false'::jsonb) on conflict(key) do nothing;
-- Seed a separate price book from current retail settings; no added discount.
insert into public.institution_pricing(kind,tier,months,currency,amount)
select distinct on(t,m,currency) 'default',t,m,currency,
 round(price * case when m=3 then 2.25 else 1 end,
 case when price=trunc(price) or currency in ('BDT','BIF','CLP','DJF','GNF','JPY','KMF','KRW','MGA','PYG','RWF','VND','VUV','XAF','XOF','XPF','ISK','UGX') then 0 else 2 end)
from public.system_settings s cross join (values('pro'),('premium')) tiers(t)
cross join (values(1),(3)) terms(m)
cross join lateral (
 select (s.value->t->>'price')::numeric price,upper(coalesce(s.value->t->>'currency','USD')) currency,0 priority
 union all
 select (r->>'price')::numeric,upper(coalesce(r->>'currency',s.value->t->>'currency','USD')),1
 from jsonb_array_elements(coalesce(s.value->t->'regional','[]')) r
) prices
where s.key='pricing_tiers' and price>0
order by t,m,currency,priority;


create function institution_private.audit(p_id uuid,p_actor uuid,p_action text,p_reason text,p_before jsonb,p_after jsonb)
returns void language sql security definer set search_path='' as $$
 insert into public.institution_audit(institution_id,actor_auth_id,action,reason,before_value,after_value)
 values(p_id,p_actor,p_action,coalesce(nullif(btrim(p_reason),''),'Institution operation'),p_before,p_after)
$$;

create function institution_private.reconcile_user(p_auth uuid) returns void language plpgsql security definer set search_path='' as $$
declare u public.users; s public.institution_seats; o public.institution_orders; start_at timestamptz;
begin
 -- Same lock orders acceptance and protected learner operations, including concurrent requests.
 select * into u from public.users where auth_id=p_auth for update;
 if not found then return; end if;
 select max(access_until) into start_at from public.institution_seats where user_auth_id=p_auth and status='active' and access_until<=now();
 update public.institution_seats set status='expired' where user_auth_id=p_auth and status='active' and access_until<=now();
 if u.subscription_tier in ('pro','premium') and (u.subscription_end_date is null or u.subscription_end_date>now()) then return; end if;
 if exists(select 1 from public.institution_seats where user_auth_id=p_auth and status='active') then return; end if;
 select * into s from public.institution_seats where user_auth_id=p_auth and status='waiting' for update;
 if not found then return; end if;
 select * into o from public.institution_orders where id=s.order_id;
 if o.status not in ('paid','complimentary','reconciliation') then return; end if;
 start_at:=greatest(s.accepted_at,coalesce(start_at,s.accepted_at),coalesce(u.subscription_end_date,s.accepted_at));
 update public.institution_seats set activated_at=start_at,access_until=start_at+case when o.months is not null then make_interval(months=>o.months) else make_interval(days=>o.access_days) end,
 status=case when start_at+case when o.months is not null then make_interval(months=>o.months) else make_interval(days=>o.access_days) end<=now() then 'expired' else 'active' end where id=s.id;
end $$;

create function institution_private.access(p_auth uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u public.users; s record; waiting jsonb; tier text; end_at timestamptz;
begin
 perform institution_private.reconcile_user(p_auth);
 select * into u from public.users where auth_id=p_auth;
 tier:=public.entitled_subscription_tier(u.subscription_tier,u.subscription_end_date); end_at:=u.subscription_end_date;
 select seat.*, i.name,i.id institution, o.tier,o.source into s from public.institution_seats seat join public.institutions i on i.id=seat.institution_id join public.institution_orders o on o.id=seat.order_id
 where seat.user_auth_id=p_auth and seat.status='active' and seat.access_until>now();
 select jsonb_build_object('seat_id',seat.id,'institution_id',i.id,'name',i.name,'status','waiting','tier',o.tier)
 into waiting from public.institution_seats seat join public.institutions i on i.id=seat.institution_id join public.institution_orders o on o.id=seat.order_id where seat.user_auth_id=p_auth and seat.status='waiting';
 if s.id is not null and (tier='free' or (s.tier='premium' and tier='pro')) then tier:=s.tier; end_at:=s.access_until; end if;
 return jsonb_build_object('subscription_tier',tier,'subscription_end_date',end_at,'personal_subscription',jsonb_build_object('subscription_tier',u.subscription_tier,'subscription_end_date',u.subscription_end_date),
 'institution_access',case when s.id is null then waiting else jsonb_build_object('seat_id',s.id,'institution_id',s.institution,'name',s.name,'status','active','tier',s.tier,'source',s.source,'access_until',s.access_until,'waiting',waiting) end,
 'institution_owner_ids',(select coalesce(jsonb_agg(id),'[]') from public.institutions where owner_auth_id=p_auth and status<>'archived'));
end $$;
create function public.get_my_institution_access() returns jsonb language sql security definer set search_path='' as $$
 select institution_private.access(auth.uid()) where auth.uid() is not null
$$;
revoke all on function public.get_my_institution_access() from public,anon;
grant execute on function public.get_my_institution_access() to authenticated;
-- Service and existing checked database functions consume exactly the users row shape.
do $$ declare cols text; begin
 select string_agg(case when attname='subscription_tier' then '(a.data->>''subscription_tier'') as subscription_tier'
 when attname='subscription_end_date' then '(a.data->>''subscription_end_date'')::timestamptz as subscription_end_date'
 else format('u.%I',attname) end,',' order by attnum) into cols from pg_attribute where attrelid='public.users'::regclass and attnum>0 and not attisdropped;
 execute 'create view public.institution_learner_profiles with (security_invoker=true) as select '||cols||' from public.users u cross join lateral (select institution_private.access(u.auth_id) as data offset 0) a';
end $$;
revoke all on public.institution_learner_profiles from public,anon,authenticated;
grant select on public.institution_learner_profiles to service_role;
-- Update only learner access routines. Billing/marketing continue to read personal records.
do $$ declare f record; definition text; begin
 for f in select p.oid,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where
 (n.nspname='public' and p.proname in ('check_user_rate_limit','reserve_ai_api_usage','current_subscription_tier','reading_assistant_reserve','reading_assistant_status','ai_coach_status','ai_coach_reserve','objective_test_state','get_objective_test_quotas','start_objective_test','create_objective_test_session','practice_library_state','practice_library_ai_reserve','paired_test_state','speaking_claim_turn','claim_speaking_turn','reserve_speaking_v2_turn','get_grammar_dashboard','start_grammar_attempt','save_learning_path_v2','feature_request_page','submit_feature_request'))
 or (n.nspname in ('objective_private','practice_private','skill_lab_private','paired_private') and p.proname in ('current_tier','user_tier','effective_tier','start_test','test_start_status','tier','can_access_passage','entitled')) loop
 definition:=pg_get_functiondef(f.oid);
 definition:=regexp_replace(definition,'(FROM|from|JOIN|join) public\.users','\1 public.institution_learner_profiles','g');
 definition:=replace(definition,' STABLE',' VOLATILE');
 if definition like '%p_user.subscription_tier%' then
 definition:=replace(definition,'BEGIN','BEGIN'||E'\n  SELECT x.* INTO p_user FROM public.institution_learner_profiles x WHERE id=p_user.id;');
 definition:=replace(definition,E'begin\n',E'begin\n  SELECT x.* INTO p_user FROM public.institution_learner_profiles x WHERE id=p_user.id;\n');
 end if;
 if definition like '%institution_learner_profiles%' then definition:=replace(definition,' SECURITY INVOKER',' SECURITY DEFINER'); end if;
 if f.proname='save_learning_path_v2' then definition:=replace(definition,'LANGUAGE plpgsql','LANGUAGE plpgsql SECURITY DEFINER'); end if;
 if f.oid::regprocedure::text like 'skill_lab_private.tier%' then definition:=replace(definition,'LANGUAGE sql','LANGUAGE sql SECURITY DEFINER'); end if;
 execute definition;
 end loop;
end $$;

create function public.institution_action(p_actor uuid,p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare i public.institutions; s public.institution_seats; o public.institution_orders; inv public.institution_invitations; u public.users;
 id_value uuid:=nullif(p_data->>'institution_id','')::uuid; admin boolean:=institution_private.is_admin(p_actor);
 result jsonb; before_value jsonb; rule public.institution_pricing; qty integer; email_value text; deadline timestamptz;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service role required' using errcode='42501'; end if;
 if not exists(select 1 from public.users where auth_id=p_actor) then raise exception 'Profile required' using errcode='42501'; end if;
 if p_action='list' then
 return jsonb_build_object('enabled',coalesce((select value='true'::jsonb from public.system_settings where key='institution_enabled'),false),
 'institutions',(select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]') from public.institutions x where admin or x.owner_auth_id=p_actor),
 'pricing',case when admin then (select coalesce(jsonb_agg(to_jsonb(x)),'[]') from public.institution_pricing x) else '[]'::jsonb end);
 end if;
 if p_action='user_access' then
 if not admin then raise exception 'Admin required' using errcode='42501'; end if;
 select auth_id into id_value from public.users where id=(p_data->>'user_id')::uuid;
 return institution_private.access(id_value);
 end if;
 if p_action='enable' then
 if not admin then raise exception 'Admin required' using errcode='42501'; end if;
 update public.system_settings set value=coalesce(p_data->'enabled','false') where key='institution_enabled';
 perform institution_private.audit(null,p_actor,p_action,p_data->>'reason',null,p_data); return '{}'::jsonb;
 end if;
 if p_action='create' then
 if not admin then raise exception 'Admin required' using errcode='42501'; end if;
 insert into public.institutions(name,owner_email,contact_email,currency) values(btrim(p_data->>'name'),lower(btrim(p_data->>'owner_email')),p_data->>'contact_email',coalesce(p_data->>'currency','USD')) returning * into i;
 perform institution_private.audit(i.id,p_actor,p_action,p_data->>'reason',null,to_jsonb(i)); return to_jsonb(i);
 end if;
 if p_action='accept' then
 if not coalesce((select value='true'::jsonb from public.system_settings where key='institution_enabled'),false) then raise exception 'Institution access is not enabled'; end if;
 select * into inv from public.institution_invitations where token_hash=p_data->>'token_hash' for update;
 if inv.id is null or inv.cancelled_at is not null then raise exception 'Invitation unavailable'; end if;
 select * into u from public.users where auth_id=p_actor for update;
 if lower(u.email)<>lower(inv.email) then raise exception 'Sign in with the invited email address' using errcode='42501'; end if;
 if inv.accepted_at is not null then return jsonb_build_object('kind',inv.kind,'institution_id',inv.institution_id,'already_accepted',true); end if;
 if inv.expires_at<=now() then raise exception 'Invitation expired'; end if;
 select * into i from public.institutions where id=inv.institution_id;
 if i.status<>'active' then raise exception 'Institution unavailable'; end if;
 if inv.kind='owner' then
 if lower(i.owner_email)<>lower(inv.email) then raise exception 'Owner invitation superseded'; end if;
 update public.institutions set owner_auth_id=p_actor where id=i.id;
 else
 perform institution_private.reconcile_user(p_actor);
 if exists(select 1 from public.institution_seats where user_auth_id=p_actor and status='waiting') then raise exception 'A seat is already waiting for this student'; end if;
 select * into s from public.institution_seats where id=inv.seat_id for update;
 select * into o from public.institution_orders where id=s.order_id for update;
 if s.status<>'invited' or lower(s.recipient_email)<>lower(inv.email) or o.status not in ('paid','complimentary') or o.activation_deadline<=now() then raise exception 'Seat unavailable'; end if;
 update public.institution_seats set user_auth_id=p_actor,accepted_at=now(),status='waiting' where id=s.id;
 perform institution_private.reconcile_user(p_actor);
 end if;
 update public.institution_invitations set accepted_at=now() where id=inv.id;
 perform institution_private.audit(i.id,p_actor,p_action,'Invitation accepted',null,jsonb_build_object('seat_id',inv.seat_id,'kind',inv.kind));
 return jsonb_build_object('kind',inv.kind,'institution_id',i.id);
 end if;
 -- Global pricing can be managed without an institution.
 if p_action='pricing' then
 if not admin then raise exception 'Admin required' using errcode='42501'; end if;
 if p_data ? 'id' then select to_jsonb(x) into before_value from public.institution_pricing x where x.id=(p_data->>'id')::uuid; end if;
 insert into public.institution_pricing(id,institution_id,kind,tier,months,currency,quantity,amount,enabled)
 values(coalesce(nullif(p_data->>'id','')::uuid,gen_random_uuid()),id_value,p_data->>'kind',p_data->>'tier',(p_data->>'months')::int,upper(p_data->>'currency'),coalesce((p_data->>'quantity')::int,1),(p_data->>'amount')::numeric,coalesce((p_data->>'enabled')::boolean,true))
 on conflict(id) do update set institution_id=excluded.institution_id,kind=excluded.kind,tier=excluded.tier,months=excluded.months,currency=excluded.currency,quantity=excluded.quantity,amount=excluded.amount,enabled=excluded.enabled returning * into rule;
 perform institution_private.audit(id_value,p_actor,p_action,p_data->>'reason',before_value,to_jsonb(rule)); return to_jsonb(rule);
 end if;
 select * into i from public.institutions where id=id_value;
 if i.id is null or not institution_private.can_manage(i.id,p_actor) then raise exception 'Institution access denied' using errcode='42501'; end if;
 if not admin and not coalesce((select value='true'::jsonb from public.system_settings where key='institution_enabled'),false) then raise exception 'Institution access is not enabled'; end if;
 if p_action='detail' then
 perform institution_private.reconcile_user(user_auth_id) from public.institution_seats where institution_id=i.id and status in ('active','waiting');
 return jsonb_build_object('institution',to_jsonb(i),
 'seats',(select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('tier',ord.tier,'source',ord.source,'activation_deadline',ord.activation_deadline,'months',ord.months,'access_days',ord.access_days,'allocation_blocked',ord.status not in ('paid','complimentary')) order by x.created_at desc),'[]') from public.institution_seats x join public.institution_orders ord on ord.id=x.order_id where x.institution_id=i.id),
 'orders',(select coalesce(jsonb_agg(to_jsonb(x) order by created_at desc),'[]') from public.institution_orders x where institution_id=i.id),
 'pricing',case when admin then (select coalesce(jsonb_agg(to_jsonb(x)),'[]') from public.institution_pricing x where institution_id=i.id or institution_id is null) else '[]'::jsonb end,
 'audit',case when admin then (select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select * from public.institution_audit where institution_id=i.id order by created_at desc limit 100) x) else '[]'::jsonb end);
 end if;
 if p_action='update' then
 before_value:=to_jsonb(i);
 if not admin and (p_data ? 'status' or p_data ? 'owner_email' or p_data ? 'currency') then raise exception 'Admin required' using errcode='42501'; end if;
 update public.institutions set name=coalesce(p_data->>'name',name),contact_email=coalesce(p_data->>'contact_email',contact_email),contact_phone=coalesce(p_data->>'contact_phone',contact_phone),logo_url=coalesce(p_data->>'logo_url',logo_url),
 status=coalesce(p_data->>'status',status),currency=coalesce(p_data->>'currency',currency),
 owner_auth_id=case when p_data ? 'owner_email' and lower(p_data->>'owner_email')<>lower(owner_email) then null else owner_auth_id end,
 owner_email=coalesce(lower(p_data->>'owner_email'),owner_email),updated_at=now() where id=i.id returning * into i;
 perform institution_private.audit(i.id,p_actor,p_action,p_data->>'reason',before_value,to_jsonb(i)); return to_jsonb(i);
 end if;
 if p_action='grant' then
 if not admin or length(btrim(coalesce(p_data->>'reason','')))=0 then raise exception 'Admin and reason required' using errcode='42501'; end if;
 insert into public.institution_orders(institution_id,source,status,tier,quantity,access_days,currency,activation_deadline,reason,created_by)
 values(i.id,'complimentary','complimentary',p_data->>'tier',(p_data->>'quantity')::int,(p_data->>'access_days')::int,i.currency,(p_data->>'activation_deadline')::timestamptz,p_data->>'reason',p_actor) returning * into o;
 if o.activation_deadline<=now() then raise exception 'Activation deadline must be in the future'; end if;
 insert into public.institution_seats(order_id,institution_id) select o.id,i.id from generate_series(1,o.quantity);
 perform institution_private.audit(i.id,p_actor,p_action,o.reason,null,to_jsonb(o)); return to_jsonb(o);
 end if;
 if p_action in ('invite','invite_owner') then
 if i.status<>'active' then raise exception 'Institution is not active'; end if;
 email_value:=lower(btrim(p_data->>'email'));
 if email_value is null or email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Valid email required'; end if;
 if p_action='invite_owner' then
 if not admin then raise exception 'Admin required' using errcode='42501'; end if;
 if email_value<>lower(i.owner_email) then raise exception 'Update the institution owner email first'; end if;
 update public.institution_invitations set cancelled_at=now() where institution_id=i.id and kind='owner' and accepted_at is null;
 deadline:=now()+interval '7 days';
 else
 if p_data ? 'seat_id' then
 select * into s from public.institution_seats where id=(p_data->>'seat_id')::uuid and institution_id=i.id for update;
 else
 select seat.* into s from public.institution_seats seat join public.institution_orders ord on ord.id=seat.order_id
 where seat.institution_id=i.id and seat.status='available' and ord.status in ('paid','complimentary') and ord.activation_deadline>now()
 and (not(p_data ? 'order_id') or seat.order_id=(p_data->>'order_id')::uuid) order by ord.activation_deadline,seat.created_at limit 1 for update of seat skip locked;
 end if;
 if s.id is null or s.status not in ('available','invited') then raise exception 'No available seat'; end if;
 select * into o from public.institution_orders where id=s.order_id for update;
 if o.status not in ('paid','complimentary') or o.activation_deadline<=now() then raise exception 'Allocation unavailable'; end if;
 before_value:=to_jsonb(s);
 update public.institution_invitations set cancelled_at=now() where seat_id=s.id and accepted_at is null;
 update public.institution_seats set status='invited',recipient_email=email_value,recipient_name=p_data->>'name' where id=s.id;
 deadline:=o.activation_deadline;
 end if;
 insert into public.institution_invitations(institution_id,seat_id,kind,email,token_hash,expires_at) values(i.id,s.id,case when p_action='invite_owner' then 'owner' else 'student' end,email_value,p_data->>'token_hash',deadline) returning * into inv;
 perform institution_private.audit(i.id,p_actor,p_action,p_data->>'reason',before_value,jsonb_build_object('seat_id',s.id,'email',email_value)); return to_jsonb(inv);
 end if;
 if p_action in ('cancel','revoke','extend','release','correct') then
 if p_action='correct' then select * into u from public.users where lower(email)=lower(p_data->>'email') for update; end if;
 select * into s from public.institution_seats where id=(p_data->>'seat_id')::uuid and institution_id=i.id for update;
 if s.id is null then raise exception 'Seat not found'; end if;
 before_value:=to_jsonb(s);
 if p_action='cancel' then
 if s.status<>'invited' then raise exception 'Only unaccepted invitations can be cancelled'; end if;
 update public.institution_seats set status='available',recipient_email=null,recipient_name=null where id=s.id;
 else
 if not admin or length(btrim(coalesce(p_data->>'reason','')))=0 then raise exception 'Admin and reason required' using errcode='42501'; end if;
 if p_action='extend' then
 select * into o from public.institution_orders where id=s.order_id;
 if o.status not in ('paid','complimentary','reconciliation') then raise exception 'Order is not valid for access'; end if;
 if s.status not in ('active','expired') or (p_data->>'access_until')::timestamptz<=greatest(now(),coalesce(s.access_until,now())) then raise exception 'Choose a later access date'; end if;
 update public.institution_seats set status='active',access_until=(p_data->>'access_until')::timestamptz where id=s.id;
 elsif p_action='revoke' then update public.institution_seats set status='revoked' where id=s.id;
 elsif p_action='release' then
 if s.status<>'waiting' then raise exception 'Only waiting seats can be released'; end if;
 update public.institution_seats set status='available',user_auth_id=null,recipient_email=null,recipient_name=null,accepted_at=null where id=s.id;
 else
 if u.auth_id is null or s.activated_at is null then raise exception 'An activated seat and existing student are required'; end if;
 update public.institution_seats set user_auth_id=u.auth_id,recipient_email=u.email,recipient_name=u.full_name where id=s.id;
 end if;
 end if;
 update public.institution_invitations set cancelled_at=now() where seat_id=s.id and accepted_at is null;
 select to_jsonb(x) into result from public.institution_seats x where id=s.id;
 perform institution_private.audit(i.id,p_actor,p_action,p_data->>'reason',before_value,result); return result;
 end if;
 if p_action='reconcile_refund' then
 if not admin or length(btrim(coalesce(p_data->>'reason','')))=0 then raise exception 'Admin and reason required' using errcode='42501'; end if;
 select * into o from public.institution_orders where id=(p_data->>'order_id')::uuid and institution_id=i.id for update;
 if o.status<>'reconciliation' then raise exception 'Order does not need reconciliation'; end if;
 update public.institution_seats set status='revoked' where order_id=o.id and id in (select value::uuid from jsonb_array_elements_text(p_data->'seat_ids'));
 update public.institution_orders set status='paid' where id=o.id;
 perform institution_private.audit(i.id,p_actor,p_action,p_data->>'reason',to_jsonb(o),p_data); return '{}'::jsonb;
 end if;
 raise exception 'Unknown institution operation';
end $$;
revoke all on function public.institution_action(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.institution_action(uuid,text,jsonb) to service_role;

create function public.institution_settle_order(p_order uuid,p_session text,p_intent text,p_amount bigint,p_currency text,p_paid_at timestamptz,p_invoice text default null,p_receipt text default null)
returns boolean language plpgsql security definer set search_path='' as $$
declare o public.institution_orders; i public.institutions; owner_id uuid;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service role required'; end if;
 select * into o from public.institution_orders where id=p_order for update;
 if o.id is null or o.source<>'paid' or o.checkout_session_id is distinct from p_session or o.amount_minor<>p_amount or lower(o.currency)<>lower(p_currency) then raise exception 'Order does not match Stripe payment'; end if;
 if o.status in ('paid','refunded','reconciliation') then
 update public.institution_orders set invoice_url=coalesce(p_invoice,invoice_url),receipt_url=coalesce(p_receipt,receipt_url) where id=o.id; return false;
 end if;
 if o.status not in ('pending','failed') then raise exception 'Order cannot be settled'; end if;
 update public.institution_orders set status='paid',payment_intent_id=p_intent,paid_at=p_paid_at,activation_deadline=p_paid_at+interval '90 days',invoice_url=coalesce(p_invoice,invoice_url),receipt_url=coalesce(p_receipt,receipt_url) where id=o.id;
 insert into public.institution_seats(order_id,institution_id) select o.id,o.institution_id from generate_series(1,o.quantity);
 select * into i from public.institutions where id=o.institution_id;
 select id into owner_id from public.users where auth_id=o.created_by;
 insert into public.billing_history(user_id,auth_id,amount,currency,payment_method,transaction_id,status,tier,billing_interval,institution_id)
 values(owner_id,o.created_by,(o.pricing_snapshot->>'total')::numeric,o.currency,'stripe',p_session,'paid',o.tier,'institution_prepaid',i.id) on conflict(transaction_id) do nothing;
 perform institution_private.audit(i.id,null,'payment','Verified Stripe payment',null,to_jsonb(o)||jsonb_build_object('session_id',p_session)); return true;
end $$;
alter table public.billing_history add column institution_id uuid references public.institutions(id);
revoke all on function public.institution_settle_order(uuid,text,text,bigint,text,timestamptz,text,text) from public,anon,authenticated;
grant execute on function public.institution_settle_order(uuid,text,text,bigint,text,timestamptz,text,text) to service_role;

create function public.institution_refund_order(p_intent text,p_refunded bigint) returns boolean language plpgsql security definer set search_path='' as $$
declare o public.institution_orders;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service role required'; end if;
 select * into o from public.institution_orders where payment_intent_id=p_intent for update;
 if o.id is null then return false; end if;
 if p_refunded<=o.refunded_minor then return true; end if;
 update public.institution_orders set refunded_minor=p_refunded,status=case when p_refunded>=amount_minor then 'refunded' else 'reconciliation' end where id=o.id;
 if p_refunded>=o.amount_minor then
 update public.institution_seats set status='revoked' where order_id=o.id and status<>'revoked';
 update public.billing_history set status='refunded' where transaction_id=o.checkout_session_id;
 end if;
 perform institution_private.audit(o.institution_id,null,'refund','Verified Stripe refund',to_jsonb(o),jsonb_build_object('refunded_minor',p_refunded)); return true;
end $$;
revoke all on function public.institution_refund_order(text,bigint) from public,anon,authenticated;
grant execute on function public.institution_refund_order(text,bigint) to service_role;
create function institution_private.reconcile_all() returns void language plpgsql security definer set search_path='' as $$
begin
 perform institution_private.reconcile_user(user_auth_id) from public.institution_seats where status in ('active','waiting');
 update public.institution_seats s set status='expired' from public.institution_orders o where o.id=s.order_id and s.status in ('available','invited') and o.activation_deadline<=now();
end $$;
-- Private routines are not publicly callable. Only the two boolean policy helpers are client executable.
revoke execute on all functions in schema institution_private from public,anon,authenticated;
grant execute on function institution_private.is_admin(uuid),institution_private.can_manage(uuid,uuid) to authenticated;
grant usage on schema institution_private to service_role;
grant execute on all functions in schema institution_private to service_role;
do $$ begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
 perform cron.schedule('institution-access-reconcile','* * * * *','select institution_private.reconcile_all()');
 end if;
end $$;

-- Keep immutable purchase totals in the ledger while analytics reads net institution revenue.
-- The invoker view is private; the existing admin-only revenue RPC retains its authorisation.
create view public.institution_revenue_history with (security_invoker=true) as
select bh.id,bh.user_id,bh.auth_id,
 case when bh.institution_id is not null and o.amount_minor>0 then
 round(bh.amount * greatest(o.amount_minor-o.refunded_minor,0)::numeric / o.amount_minor,2)
 else bh.amount end as amount,
 bh.currency,bh.payment_method,bh.transaction_id,bh.status,bh.tier,bh.billing_interval,bh.created_at
from public.billing_history bh left join public.institution_orders o on o.checkout_session_id=bh.transaction_id and o.institution_id=bh.institution_id;
revoke all on public.institution_revenue_history from public,anon,authenticated;
grant select on public.institution_revenue_history to service_role;
do $$ declare definition text; begin
 if to_regprocedure('public.get_revenue_intelligence(text)') is not null then
 definition:=pg_get_functiondef('public.get_revenue_intelligence(text)'::regprocedure);
 definition:=replace(definition,'FROM public.billing_history bh','FROM public.institution_revenue_history bh');
 execute definition;
 end if;
end $$;

-- Preparing a purchase checks ownership, suspension and the feature gate in one transaction.
create function public.institution_prepare_order(p_actor uuid,p_id uuid,p_institution uuid,p_quote jsonb)
returns public.institution_orders language plpgsql security definer set search_path='' as $$
declare i public.institutions; o public.institution_orders;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service role required' using errcode='42501'; end if;
 select * into i from public.institutions where id=p_institution for update;
 if i.id is null or not institution_private.can_manage(i.id,p_actor) then raise exception 'Institution access denied' using errcode='42501';end if;
 if i.status<>'active' or not coalesce((select value='true'::jsonb from public.system_settings where key='institution_enabled'),false) then raise exception 'Institution purchases unavailable';end if;
 select * into o from public.institution_orders where id=p_id;
 if found then
 if o.institution_id<>i.id or o.created_by<>p_actor then raise exception 'Order access denied' using errcode='42501';end if;
 if o.status<>'pending' or o.tier<>p_quote->>'tier' or o.months<>(p_quote->>'months')::int or o.quantity<>(p_quote->>'quantity')::int then raise exception 'Use a new request for a different purchase';end if;
 return o;
 end if;
 insert into public.institution_orders(id,institution_id,source,status,tier,quantity,months,amount_minor,currency,pricing_snapshot,created_by)
 values(p_id,i.id,'paid','pending',p_quote->>'tier',(p_quote->>'quantity')::int,(p_quote->>'months')::int,(p_quote->>'amount_minor')::bigint,i.currency,p_quote,p_actor) returning * into o;
 perform institution_private.audit(i.id,p_actor,'quote','Prepaid purchase quote',null,to_jsonb(o));
 return o;
end $$;
revoke all on function public.institution_prepare_order(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.institution_prepare_order(uuid,uuid,uuid,jsonb) to service_role;

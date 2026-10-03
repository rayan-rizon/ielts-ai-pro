-- Public intake is mediated by an Edge Function. No browser role can read requests or write review decisions.
create table public.institution_applications (
 id uuid primary key default gen_random_uuid(), request_key uuid not null unique,
 institution_name text not null check(length(btrim(institution_name)) between 2 and 160),
 contact_name text not null check(length(btrim(contact_name)) between 2 and 120),
 email text not null check(email=lower(btrim(email)) and length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 country text not null check(length(btrim(country)) between 2 and 100),
 expected_seats integer not null check(expected_seats between 1 and 100000),
 message text not null default '' check(length(message)<=2000),
 status text not null default 'pending' check(status in ('pending','approved','declined')),
 submitted_ip_hash text not null, created_at timestamptz not null default now(),
 reviewed_at timestamptz, reviewed_by uuid references auth.users(id) on delete set null,
 decision_reason text, institution_id uuid references public.institutions(id) on delete restrict,
 check((status='pending' and reviewed_at is null and institution_id is null) or (status='approved' and reviewed_at is not null and institution_id is not null) or (status='declined' and reviewed_at is not null and institution_id is null))
);
alter table public.institution_applications enable row level security;
revoke all on public.institution_applications from anon, authenticated;
grant all on public.institution_applications to service_role;
create unique index institution_applications_pending_email on public.institution_applications(email,lower(institution_name)) where status='pending';
create index institution_applications_review_queue on public.institution_applications(status,created_at desc,id desc);
create index institution_applications_ip_budget on public.institution_applications(submitted_ip_hash,created_at);
create index institution_applications_reviewer_idx on public.institution_applications(reviewed_by);
create index institution_applications_institution_idx on public.institution_applications(institution_id);

create function public.institution_application_submit(p_data jsonb,p_ip_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare email_value text:=lower(btrim(p_data->>'email'));
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service role required' using errcode='42501'; end if;
 if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid submission'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_ip_hash,0));
 if exists(select 1 from public.institution_applications where request_key=(p_data->>'request_key')::uuid) then return '{"received":true}'::jsonb; end if;
 if (select count(*) from public.institution_applications where submitted_ip_hash=p_ip_hash and created_at>now()-interval '1 hour')>=5 then raise exception 'Too many requests. Please try again later.' using errcode='54000'; end if;
 insert into public.institution_applications(request_key,institution_name,contact_name,email,country,expected_seats,message,submitted_ip_hash)
 values((p_data->>'request_key')::uuid,btrim(p_data->>'institution_name'),btrim(p_data->>'contact_name'),email_value,btrim(p_data->>'country'),(p_data->>'expected_seats')::integer,coalesce(btrim(p_data->>'message'),''),p_ip_hash)
 on conflict do nothing;
 return '{"received":true}'::jsonb;
end $$;
revoke all on function public.institution_application_submit(jsonb,text) from public,anon,authenticated;
grant execute on function public.institution_application_submit(jsonb,text) to service_role;

create function public.institution_application_admin(p_actor uuid,p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.institution_applications; result jsonb; i jsonb; inv jsonb; category text:=coalesce(p_data->>'status','pending'); reason text:=btrim(p_data->>'reason');
begin
 if auth.role() is distinct from 'service_role' or not institution_private.is_admin(p_actor) then raise exception 'Admin required' using errcode='42501'; end if;
 if p_action='list' then
  if category not in ('all','pending','approved','declined') then raise exception 'Invalid request status'; end if;
  select jsonb_build_object('entries',coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id desc),'[]'::jsonb),'pending_count',(select count(*) from public.institution_applications where status='pending')) into result
  from (select * from public.institution_applications where (category='all' or status=category)
   and (coalesce(p_data->>'search','')='' or institution_name ilike '%'||(p_data->>'search')||'%' or email ilike '%'||(p_data->>'search')||'%' or contact_name ilike '%'||(p_data->>'search')||'%')
   and (p_data->>'cursor_id' is null or (created_at,id)<((p_data->>'cursor_date')::timestamptz,(p_data->>'cursor_id')::uuid))
   order by created_at desc,id desc limit 26) x;
  return result;
 end if;
 if p_action not in ('approve','decline') then raise exception 'Unknown request operation'; end if;
 if reason is null or length(reason) not between 1 and 1000 then raise exception 'A review reason is required'; end if;
 select * into a from public.institution_applications where id=(p_data->>'application_id')::uuid for update;
 if not found then raise exception 'Request not found'; end if;
 if a.status=(case when p_action='approve' then 'approved' else 'declined' end) then return jsonb_build_object('application',to_jsonb(a),'already_reviewed',true); end if;
 if a.status<>'pending' then raise exception 'This request has already been reviewed'; end if;
 if p_action='approve' then
  if coalesce(p_data->>'currency','USD') not in ('USD','BDT') then raise exception 'Choose a supported currency'; end if;
  if coalesce(p_data->>'token_hash','') !~ '^[0-9a-f]{64}$' then raise exception 'Invalid invitation'; end if;
  i:=public.institution_action(p_actor,'create',jsonb_build_object('name',a.institution_name,'owner_email',a.email,'contact_email',a.email,'currency',coalesce(p_data->>'currency','USD'),'reason',reason));
  inv:=public.institution_action(p_actor,'invite_owner',jsonb_build_object('institution_id',i->>'id','email',a.email,'token_hash',p_data->>'token_hash','reason',reason));
  update public.institution_applications set status='approved',reviewed_at=now(),reviewed_by=p_actor,decision_reason=reason,institution_id=(i->>'id')::uuid where id=a.id returning * into a;
  perform institution_private.audit(a.institution_id,p_actor,'application_approved',reason,null,jsonb_build_object('name',a.institution_name,'email',a.email,'expected_seats',a.expected_seats));
 else
  update public.institution_applications set status='declined',reviewed_at=now(),reviewed_by=p_actor,decision_reason=reason where id=a.id returning * into a;
  perform institution_private.audit(null,p_actor,'application_declined',reason,null,jsonb_build_object('application_id',a.id,'name',a.institution_name,'email',a.email));
 end if;
 return jsonb_build_object('application',to_jsonb(a),'invitation',inv);
end $$;
revoke all on function public.institution_application_admin(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.institution_application_admin(uuid,text,jsonb) to service_role;

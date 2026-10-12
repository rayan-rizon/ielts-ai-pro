-- Isolated local test fixture only. Never apply this to a Supabase project.
-- The existing quota policy is unchanged; this stub tests reservation/job integration.
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create schema vault; create schema cron; create schema net; create schema extensions;
create extension pgcrypto with schema extensions;
create table auth.users(id uuid primary key);
create table public.users(id uuid primary key,auth_id uuid references auth.users(id));
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function public.can_access_user_id(p_id uuid) returns boolean language sql stable security definer as $$select exists(select 1 from public.users where id=p_id and auth_id=auth.uid())$$;
create table public.passages(id uuid primary key,title text,cambridge_title text,test_format text);
create table public.test_sessions(id uuid primary key default gen_random_uuid(),user_id uuid references public.users(id), passage_id uuid references public.passages(id),test_type text,is_completed boolean,score numeric,paired_room_id uuid,content_data jsonb default '{}',user_responses jsonb, created_at timestamptz default now(),completed_at timestamptz,duration_minutes numeric,actual_duration_seconds integer,test_mode text,evaluation_status text,evaluation_version text,evaluated_at timestamptz,updated_at timestamptz default now());
create table public.grammar_attempts(id uuid primary key default gen_random_uuid(),user_id uuid,mode text,completion_state text,correct_count integer,total_questions integer,completed_at timestamptz);
create table public.ai_api_usage(id uuid primary key default gen_random_uuid(),user_id uuid,endpoint text,request_metadata jsonb,created_at timestamptz default now());
create function public.reserve_ai_api_usage(p_auth uuid,p_endpoint text,p_feature text,p_key text,p_metadata jsonb) returns table(reservation_id uuid,allowed boolean,daily_remaining integer,monthly_remaining integer,daily_used integer,monthly_used integer,already_reserved boolean) language plpgsql as $$
declare v_id uuid; v_meta jsonb; v_user uuid;
begin
 select id into v_user from public.users where auth_id=p_auth;
 select id,request_metadata into v_id,v_meta from public.ai_api_usage where user_id=v_user and endpoint=p_endpoint and request_metadata->>'idempotencyKey'=p_key;
 if v_id is null then
 insert into public.ai_api_usage(user_id,endpoint,request_metadata) values(v_user,p_endpoint,p_metadata||jsonb_build_object('idempotencyKey',p_key,'reservationStatus','reserved')) returning id into v_id;
 return query select v_id,true,4,10,1,1,false;
 elsif v_meta->>'reservationStatus'='failed' then
 update public.ai_api_usage set request_metadata=request_metadata||'{"reservationStatus":"reserved"}' where id=v_id;
 return query select v_id,true,4,10,1,1,false;
 else return query select v_id,true,4,10,1,1,true; end if;
end$$;
create function public.finalize_ai_api_usage(p_id uuid,p_tokens integer,p_cached boolean,p_metadata jsonb,p_status text) returns boolean language plpgsql as $$begin
update public.ai_api_usage set request_metadata=request_metadata||p_metadata||jsonb_build_object('reservationStatus',p_status) where id=p_id and request_metadata->>'reservationStatus'='reserved';
return found or exists(select 1 from public.ai_api_usage where id=p_id and request_metadata->>'reservationStatus' in('completed','failed'));end$$;

create table vault.secrets(name text primary key,decrypted_secret text);
create view vault.decrypted_secrets as select * from vault.secrets;
create function vault.create_secret(secret text,name text) returns uuid language plpgsql as $$begin insert into vault.secrets values(name,secret);return gen_random_uuid();end$$;
create function net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds integer) returns bigint language sql as $$select 1::bigint$$;
create function cron.schedule(name text,schedule text,command text) returns bigint language sql as $$select 1::bigint$$;
grant usage on schema public,auth to authenticated,anon,service_role;
grant select on all tables in schema public to authenticated;
alter table public.test_sessions enable row level security;
create policy own_sessions on public.test_sessions for select to authenticated using(public.can_access_user_id(user_id));
alter table public.grammar_attempts enable row level security;
create policy own_grammar on public.grammar_attempts for select to authenticated using(public.can_access_user_id(user_id));

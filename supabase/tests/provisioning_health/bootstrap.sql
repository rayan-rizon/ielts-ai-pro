create role anon;
create role authenticated;
create role service_role;
create schema auth;
create table auth.users(id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}', email_confirmed_at timestamptz, last_sign_in_at timestamptz, created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table public.users(
 id uuid primary key default gen_random_uuid(),auth_id uuid unique references auth.users(id),email text not null unique,
 full_name text, role text not null default 'user', subscription_tier text not null default 'free', subscription_end_date timestamptz,
 onboarding_completed boolean default false,created_at timestamptz default now(), updated_at timestamptz default now(),
 signup_channel text, signup_attribution_recorded_at timestamptz, signup_utm_source text,signup_utm_medium text, signup_utm_campaign text,
 signup_utm_content text,signup_utm_term text,signup_referrer text,signup_landing_page text,signup_gclid text,signup_fbclid text
);
create function public.is_admin() returns boolean language sql stable as $$ select coalesce(current_setting('test.is_admin',true),'on') <> 'off' $$;
create function public.get_my_public_user_id() returns uuid language sql stable as $$ select id from public.users where auth_id=auth.uid() $$;
create function public.get_platform_health(integer default 24) returns jsonb language sql stable as $$ select '{"services":[]}'::jsonb $$;
create table public.test_sessions(id uuid primary key);
-- Established account predating deployment: migration must recover it.
insert into auth.users(id,email,email_confirmed_at,created_at) values('10000000-0000-4000-8000-000000000001','backfill@example.test',now(),now()-interval '1 hour');

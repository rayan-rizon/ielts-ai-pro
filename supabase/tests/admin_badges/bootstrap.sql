-- Isolated test contracts; production authorization is also verified on the linked DB.
create role anon;
create role authenticated;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create table public.users (
  id uuid primary key default gen_random_uuid(), auth_id uuid unique references auth.users,
  role text, payment_failed_at timestamptz
);
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.users where auth_id = auth.uid() and role = 'admin')
$$;
create table public.payment_requests (
  id uuid primary key default gen_random_uuid(), status text, payment_method text, created_at timestamptz
);
create table public.feature_requests (id uuid primary key default gen_random_uuid(), status text, created_at timestamptz default now());
create table public.test_issue_reports (id uuid primary key default gen_random_uuid(), status text, created_at timestamptz default now());
create table public.institution_applications (id uuid primary key default gen_random_uuid(), status text, created_at timestamptz default now());
create table public.admin_payment_alert_reads (
  admin_id uuid primary key references auth.users, seen_at timestamptz not null, updated_at timestamptz not null
);
alter table public.admin_payment_alert_reads enable row level security;
alter table public.admin_payment_alert_reads force row level security;
create index feature_requests_status_created_idx on public.feature_requests(status, created_at desc);
create index test_issue_reports_status_created_idx on public.test_issue_reports(status, created_at desc);
create index institution_applications_review_queue on public.institution_applications(status, created_at desc, id desc);
grant usage on schema public, auth to anon, authenticated;

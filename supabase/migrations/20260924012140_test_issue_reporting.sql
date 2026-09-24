create table public.test_issue_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  test_type text not null check (test_type in ('reading', 'listening')),
  issue_type text not null check (
    issue_type in ('question_error', 'answer_error', 'typo', 'audio_problem', 'other')
  ),
  description text not null check (char_length(description) between 10 and 2000),
  test_id text check (test_id is null or char_length(test_id) <= 128),
  test_title text check (test_title is null or char_length(test_title) <= 200),
  section_label text check (section_label is null or char_length(section_label) <= 80),
  question_reference text check (question_reference is null or char_length(question_reference) <= 80),
  test_mode text check (test_mode is null or char_length(test_mode) <= 32),
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index test_issue_reports_status_created_idx
  on public.test_issue_reports (status, created_at desc);
create index test_issue_reports_user_created_idx
  on public.test_issue_reports (user_id, created_at desc);

alter table public.test_issue_reports enable row level security;
revoke all on public.test_issue_reports from public, anon, authenticated;

-- Reports are written and read through narrowly scoped authenticated RPCs.
-- Keep admin-only table policies as defense in depth if access is granted later.
create policy test_issue_reports_admin_read on public.test_issue_reports
  for select to authenticated using ((select public.is_admin()));
create policy test_issue_reports_admin_update on public.test_issue_reports
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create function public.submit_test_issue_report(
  p_test_type text,
  p_issue_type text,
  p_description text,
  p_test_id text default null,
  p_test_title text default null,
  p_section_label text default null,
  p_question_reference text default null,
  p_test_mode text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user public.users%rowtype;
  v_description text := pg_catalog.btrim(coalesce(p_description, ''));
  v_report_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to report a test issue' using errcode = '28000';
  end if;

  if p_test_type is null or p_test_type not in ('reading', 'listening') then
    raise exception 'Choose a valid test type' using errcode = '22023';
  end if;
  if p_issue_type is null
      or p_issue_type not in ('question_error', 'answer_error', 'typo', 'audio_problem', 'other')
      or (p_test_type = 'reading' and p_issue_type = 'audio_problem') then
    raise exception 'Choose a valid issue type' using errcode = '22023';
  end if;
  if pg_catalog.char_length(v_description) not between 10 and 2000 then
    raise exception 'Please describe the issue in 10 to 2000 characters' using errcode = '22023';
  end if;

  select * into v_user from public.users where auth_id = auth.uid();
  if not found then
    raise exception 'Account profile not found' using errcode = '28000';
  end if;

  insert into public.test_issue_reports (
    user_id, test_type, issue_type, description, test_id, test_title,
    section_label, question_reference, test_mode
  ) values (
    v_user.id,
    p_test_type,
    p_issue_type,
    v_description,
    nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_test_id, '')), 128), ''),
    nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_test_title, '')), 200), ''),
    nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_section_label, '')), 80), ''),
    nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_question_reference, '')), 80), ''),
    nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_test_mode, '')), 32), '')
  ) returning id into v_report_id;

  return v_report_id;
end;
$$;

create function public.admin_test_issue_reports_page(
  p_status text default 'open',
  p_search text default '',
  p_offset integer default 0
) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_total integer;
  v_items jsonb;
  v_search text := pg_catalog.left(pg_catalog.btrim(coalesce(p_search, '')), 100);
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('all', 'open', 'reviewing', 'resolved', 'dismissed')
      or p_offset is null or p_offset < 0 or p_offset > 10000 then
    raise exception 'Invalid report filters' using errcode = '22023';
  end if;

  select count(*) into v_total
  from public.test_issue_reports r
  join public.users u on u.id = r.user_id
  where (p_status = 'all' or r.status = p_status)
    and (v_search = '' or r.test_title ilike '%' || v_search || '%'
      or r.description ilike '%' || v_search || '%'
      or u.email ilike '%' || v_search || '%');

  select coalesce(
    jsonb_agg(to_jsonb(page) order by page.created_at desc, page.id desc),
    '[]'::jsonb
  ) into v_items
  from (
    select r.id, r.user_id, r.test_type, r.issue_type, r.description,
      r.test_id, r.test_title, r.section_label, r.question_reference, r.test_mode, r.status,
      r.admin_note, r.created_at, r.updated_at,
      u.full_name as requester_name, u.email as requester_email,
      u.subscription_tier as requester_tier
    from public.test_issue_reports r
    join public.users u on u.id = r.user_id
    where (p_status = 'all' or r.status = p_status)
      and (v_search = '' or r.test_title ilike '%' || v_search || '%'
        or r.description ilike '%' || v_search || '%'
        or u.email ilike '%' || v_search || '%')
    order by r.created_at desc, r.id desc
    limit 20 offset p_offset
  ) page;

  return jsonb_build_object('items', v_items, 'total', v_total);
end;
$$;

create function public.admin_update_test_issue_report(
  p_report_id uuid,
  p_status text,
  p_admin_note text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_note text := nullif(pg_catalog.btrim(coalesce(p_admin_note, '')), '');
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('open', 'reviewing', 'resolved', 'dismissed') then
    raise exception 'Choose a valid report status' using errcode = '22023';
  end if;
  if pg_catalog.char_length(coalesce(v_note, '')) > 500 then
    raise exception 'Admin note must be at most 500 characters' using errcode = '22023';
  end if;

  update public.test_issue_reports
  set status = p_status, admin_note = v_note, updated_at = now()
  where id = p_report_id;
  if not found then
    raise exception 'Test issue report not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.submit_test_issue_report(text, text, text, text, text, text, text, text),
  public.admin_test_issue_reports_page(text, text, integer),
  public.admin_update_test_issue_report(uuid, text, text) from public, anon;
grant execute on function public.submit_test_issue_report(text, text, text, text, text, text, text, text),
  public.admin_test_issue_reports_page(text, text, integer),
  public.admin_update_test_issue_report(uuid, text, text) to authenticated;

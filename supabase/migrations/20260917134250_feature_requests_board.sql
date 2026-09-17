-- Feature requests are accessible to clients only through narrow, authenticated RPCs.
-- No learner write privileges are granted on either table; RLS is defense in depth.
create table public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) between 8 and 120),
  description text not null check (char_length(description) between 20 and 1000),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'planned', 'in_progress', 'completed', 'declined')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index feature_requests_owner_created_idx on public.feature_requests (user_id, created_at desc);
create index feature_requests_status_created_idx on public.feature_requests (status, created_at desc);
create unique index feature_requests_owner_title_idx on public.feature_requests (user_id, lower(title));

create table public.feature_request_votes (
  request_id uuid not null references public.feature_requests(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);
create index feature_request_votes_owner_idx on public.feature_request_votes (user_id);

alter table public.feature_requests enable row level security;
alter table public.feature_request_votes enable row level security;
revoke all on public.feature_requests, public.feature_request_votes from public, anon, authenticated;

-- These policies remain useful if a future migration grants table access. The
-- RPCs below intentionally do not depend on direct client table privileges.
create policy feature_requests_read on public.feature_requests for select to authenticated
  using (
    user_id in (select id from public.users where auth_id = (select auth.uid()))
    or status in ('approved', 'planned', 'in_progress', 'completed')
    or (select public.is_admin())
  );
create policy feature_request_votes_read on public.feature_request_votes for select to authenticated
  using (user_id in (select id from public.users where auth_id = (select auth.uid()))
    or (select public.is_admin()));

create function public.feature_request_page(
  p_scope text default 'board', p_sort text default 'top',
  p_search text default '', p_offset integer default 0
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_user public.users%rowtype;
  v_month timestamptz := date_trunc('month', now() at time zone 'UTC') at time zone 'UTC';
  v_used integer;
  v_limit integer;
  v_total integer;
  v_items jsonb;
  v_search text := left(trim(coalesce(p_search, '')), 100);
begin
  if auth.uid() is null then raise exception 'Sign in to view feature requests' using errcode = '28000'; end if;
  if p_scope not in ('board', 'mine') or p_sort not in ('top', 'new')
      or p_offset is null or p_offset < 0 or p_offset > 10000 then
    raise exception 'Invalid request filters' using errcode = '22023';
  end if;
  select * into v_user from public.users where auth_id = auth.uid();
  if not found then raise exception 'Account profile not found' using errcode = '28000'; end if;

  v_limit := case when lower(v_user.subscription_tier) in ('pro', 'premium')
    and (v_user.subscription_end_date is null or v_user.subscription_end_date > now()) then 3 else 1 end;
  select count(*) into v_used from public.feature_requests
    where user_id = v_user.id and (v_limit = 1 or created_at >= v_month);

  select count(*) into v_total from public.feature_requests r
    where ((p_scope = 'mine' and r.user_id = v_user.id)
       or (p_scope = 'board' and r.status in ('approved', 'planned', 'in_progress', 'completed')))
      and (v_search = '' or r.title ilike '%' || v_search || '%'
        or r.description ilike '%' || v_search || '%');

  select coalesce(jsonb_agg(to_jsonb(page) order by page.position), '[]'::jsonb)
    into v_items from (
      select r.id, r.title, r.description, r.status, r.created_at, r.updated_at,
        case when r.user_id = v_user.id then r.admin_note else null end as admin_note,
        (r.user_id = v_user.id) as is_mine,
        (select count(*) from public.feature_request_votes votes where votes.request_id = r.id) as vote_count,
        exists (select 1 from public.feature_request_votes votes
          where votes.request_id = r.id and votes.user_id = v_user.id) as has_voted,
        row_number() over (order by
          case when p_sort = 'top' then (select count(*) from public.feature_request_votes votes where votes.request_id = r.id) end desc nulls last,
          r.created_at desc, r.id desc) as position
      from public.feature_requests r
      where ((p_scope = 'mine' and r.user_id = v_user.id)
         or (p_scope = 'board' and r.status in ('approved', 'planned', 'in_progress', 'completed')))
        and (v_search = '' or r.title ilike '%' || v_search || '%'
          or r.description ilike '%' || v_search || '%')
      order by position limit 20 offset p_offset
    ) page;

  return jsonb_build_object('items', v_items, 'total', v_total,
    'remaining', greatest(0, v_limit - v_used), 'limit', v_limit,
    'period', case when v_limit = 1 then 'lifetime' else 'month' end);
end;
$$;

create function public.submit_feature_request(p_title text, p_description text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user public.users%rowtype;
  v_title text := trim(coalesce(p_title, ''));
  v_description text := trim(coalesce(p_description, ''));
  v_month timestamptz := date_trunc('month', now() at time zone 'UTC') at time zone 'UTC';
  v_used integer;
  v_limit integer;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to submit a feature request' using errcode = '28000'; end if;
  if char_length(v_title) not between 8 and 120 or char_length(v_description) not between 20 and 1000 then
    raise exception 'Title must be 8–120 characters and description 20–1000 characters' using errcode = '22023';
  end if;
  -- Serializes all submissions by this account, including concurrent tabs.
  select * into v_user from public.users where auth_id = auth.uid() for update;
  if not found then raise exception 'Account profile not found' using errcode = '28000'; end if;
  if exists (select 1 from public.feature_requests where user_id = v_user.id and lower(title) = lower(v_title)) then
    raise exception 'You already submitted a request with this title' using errcode = '23505';
  end if;
  v_limit := case when lower(v_user.subscription_tier) in ('pro', 'premium')
    and (v_user.subscription_end_date is null or v_user.subscription_end_date > now()) then 3 else 1 end;
  select count(*) into v_used from public.feature_requests
    where user_id = v_user.id and (v_limit = 1 or created_at >= v_month);
  if v_used >= v_limit then
    raise exception 'Feature request allowance reached' using errcode = 'P0001';
  end if;
  insert into public.feature_requests (user_id, title, description)
    values (v_user.id, v_title, v_description) returning id into v_id;
  return v_id;
end;
$$;

create function public.toggle_feature_request_vote(p_request_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid;
  v_request public.feature_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in to vote' using errcode = '28000'; end if;
  select id into v_user_id from public.users where auth_id = auth.uid();
  if v_user_id is null then raise exception 'Account profile not found' using errcode = '28000'; end if;
  select * into v_request from public.feature_requests where id = p_request_id;
  if not found or v_request.status not in ('approved', 'planned', 'in_progress', 'completed') then
    raise exception 'This request is not open for voting' using errcode = '22023';
  end if;
  if v_request.user_id = v_user_id then raise exception 'You cannot vote on your own request' using errcode = '22023'; end if;
  -- Lock the account row so rapid retries from multiple tabs toggle sequentially.
  perform 1 from public.users where id = v_user_id for update;
  delete from public.feature_request_votes where request_id = p_request_id and user_id = v_user_id;
  if found then return false; end if;
  insert into public.feature_request_votes (request_id, user_id) values (p_request_id, v_user_id);
  return true;
end;
$$;

create function public.admin_feature_request_page(
  p_status text default 'all', p_search text default '', p_offset integer default 0
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_total integer;
  v_items jsonb;
  v_search text := left(trim(coalesce(p_search, '')), 100);
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_status not in ('all', 'pending', 'approved', 'planned', 'in_progress', 'completed', 'declined')
      or p_offset is null or p_offset < 0 or p_offset > 10000 then
    raise exception 'Invalid request filters' using errcode = '22023';
  end if;
  select count(*) into v_total from public.feature_requests r join public.users u on u.id = r.user_id
    where (p_status = 'all' or r.status = p_status)
      and (v_search = '' or r.title ilike '%' || v_search || '%'
        or r.description ilike '%' || v_search || '%'
        or u.email ilike '%' || v_search || '%');
  select coalesce(jsonb_agg(to_jsonb(page) order by page.created_at desc, page.id desc), '[]'::jsonb)
    into v_items from (
      select r.id, r.title, r.description, r.status, r.admin_note, r.created_at, r.updated_at,
        u.id as requester_id, u.full_name as requester_name, u.email as requester_email,
        u.subscription_tier as requester_tier,
        (select count(*) from public.feature_request_votes v where v.request_id = r.id) as vote_count
      from public.feature_requests r join public.users u on u.id = r.user_id
      where (p_status = 'all' or r.status = p_status)
        and (v_search = '' or r.title ilike '%' || v_search || '%'
          or r.description ilike '%' || v_search || '%'
          or u.email ilike '%' || v_search || '%')
      order by r.created_at desc, r.id desc limit 20 offset p_offset
    ) page;
  return jsonb_build_object('items', v_items, 'total', v_total);
end;
$$;

create function public.admin_update_feature_request(p_request_id uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_old_status text;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if char_length(coalesce(v_note, '')) > 500 then
    raise exception 'Admin note must be at most 500 characters' using errcode = '22023';
  end if;
  select status into v_old_status from public.feature_requests where id = p_request_id for update;
  if not found then raise exception 'Feature request not found' using errcode = 'P0002'; end if;
  if not ((v_old_status = 'pending' and p_status in ('approved', 'declined'))
    or (v_old_status = 'approved' and p_status = 'planned')
    or (v_old_status = 'planned' and p_status = 'in_progress')
    or (v_old_status = 'in_progress' and p_status = 'completed')) then
    raise exception 'Invalid feature request status transition' using errcode = '22023';
  end if;
  update public.feature_requests set status = p_status, admin_note = v_note, updated_at = now()
    where id = p_request_id;
end;
$$;

revoke all on function public.feature_request_page(text, text, text, integer),
  public.submit_feature_request(text, text), public.toggle_feature_request_vote(uuid),
  public.admin_feature_request_page(text, text, integer),
  public.admin_update_feature_request(uuid, text, text) from public, anon;
grant execute on function public.feature_request_page(text, text, text, integer),
  public.submit_feature_request(text, text), public.toggle_feature_request_vote(uuid),
  public.admin_feature_request_page(text, text, integer),
  public.admin_update_feature_request(uuid, text, text) to authenticated;

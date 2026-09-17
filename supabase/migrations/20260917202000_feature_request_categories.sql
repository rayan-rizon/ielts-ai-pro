-- Classify requests by the IELTS/product area selected in the learner form.
-- Existing rows and legacy two-argument submissions remain valid as "other".
alter table public.feature_requests
  add column category text not null default 'other'
  constraint feature_requests_category_check
  check (category in ('reading', 'writing', 'listening', 'speaking', 'other'));

create index feature_requests_category_status_created_idx
  on public.feature_requests (category, status, created_at desc);

create or replace function public.feature_request_page(
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
        or r.description ilike '%' || v_search || '%'
        or r.category ilike '%' || v_search || '%');

  select coalesce(jsonb_agg(to_jsonb(page) order by page.position), '[]'::jsonb)
    into v_items from (
      select r.id, r.title, r.description, r.category, r.status, r.created_at, r.updated_at,
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
          or r.description ilike '%' || v_search || '%'
          or r.category ilike '%' || v_search || '%')
      order by position limit 20 offset p_offset
    ) page;

  return jsonb_build_object('items', v_items, 'total', v_total,
    'remaining', greatest(0, v_limit - v_used), 'limit', v_limit,
    'period', case when v_limit = 1 then 'lifetime' else 'month' end);
end;
$$;

create function public.submit_feature_request(
  p_title text, p_description text, p_category text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user public.users%rowtype;
  v_title text := trim(coalesce(p_title, ''));
  v_description text := trim(coalesce(p_description, ''));
  v_category text := lower(trim(coalesce(p_category, '')));
  v_month timestamptz := date_trunc('month', now() at time zone 'UTC') at time zone 'UTC';
  v_used integer;
  v_limit integer;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to submit a feature request' using errcode = '28000'; end if;
  if char_length(v_title) not between 8 and 120 or char_length(v_description) not between 20 and 1000 then
    raise exception 'Title must be 8–120 characters and description 20–1000 characters' using errcode = '22023';
  end if;
  if v_category not in ('reading', 'writing', 'listening', 'speaking', 'other') then
    raise exception 'Choose a valid product area' using errcode = '22023';
  end if;
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
  insert into public.feature_requests (user_id, title, description, category)
    values (v_user.id, v_title, v_description, v_category) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.admin_feature_request_page(
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
        or r.category ilike '%' || v_search || '%'
        or u.full_name ilike '%' || v_search || '%'
        or u.email ilike '%' || v_search || '%');
  select coalesce(jsonb_agg(to_jsonb(page) order by page.created_at desc, page.id desc), '[]'::jsonb)
    into v_items from (
      select r.id, r.title, r.description, r.category, r.status, r.admin_note, r.created_at, r.updated_at,
        u.id as requester_id, u.full_name as requester_name, u.email as requester_email,
        u.subscription_tier as requester_tier,
        (select count(*) from public.feature_request_votes v where v.request_id = r.id) as vote_count
      from public.feature_requests r join public.users u on u.id = r.user_id
      where (p_status = 'all' or r.status = p_status)
        and (v_search = '' or r.title ilike '%' || v_search || '%'
          or r.description ilike '%' || v_search || '%'
          or r.category ilike '%' || v_search || '%'
          or u.full_name ilike '%' || v_search || '%'
          or u.email ilike '%' || v_search || '%')
      order by r.created_at desc, r.id desc limit 20 offset p_offset
    ) page;
  return jsonb_build_object('items', v_items, 'total', v_total);
end;
$$;

revoke all on function public.submit_feature_request(text, text, text) from public, anon;
grant execute on function public.submit_feature_request(text, text, text) to authenticated;

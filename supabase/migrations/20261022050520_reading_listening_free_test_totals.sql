-- Free Reading and Listening practice becomes a fixed number of tests per skill
-- for the life of the account, replacing the daily and monthly windows.
-- -1 means unlimited; 0 means no free tests. Paid, admin and institution access
-- stay unlimited exactly as before.
alter table public.tier_rate_limits
  add column reading_test_limit integer not null default -1,
  add column listening_test_limit integer not null default -1;

-- Keep today's effective cap: the monthly number when one was set, otherwise the
-- daily one. Rows that were unlimited stay unlimited.
update public.tier_rate_limits set
  reading_test_limit = case
    when reading_monthly_limit >= 0 then reading_monthly_limit
    when reading_daily_limit >= 0 then reading_daily_limit
    else -1 end,
  listening_test_limit = case
    when listening_monthly_limit >= 0 then listening_monthly_limit
    when listening_daily_limit >= 0 then listening_daily_limit
    else -1 end;

alter table public.tier_rate_limits
  add constraint reading_test_limit_valid check (reading_test_limit >= -1),
  add constraint listening_test_limit_valid check (listening_test_limit >= -1);

alter table public.tier_rate_limits
  drop column reading_daily_limit,
  drop column reading_monthly_limit,
  drop column listening_daily_limit,
  drop column listening_monthly_limit;

-- Both functions below keep the institution_learner_profiles reads that the
-- institution access migration rewrote into the deployed bodies.
create or replace function objective_private.test_start_status(p_user public.users, p_type text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_limit integer := -1;
  v_used integer;
begin
  select x.* into p_user from public.institution_learner_profiles x where id = p_user.id;
  if p_type not in ('reading', 'listening') then
    raise exception 'Invalid test type' using errcode = '22023';
  end if;

  -- Only an active paid subscription bypasses the Free limit.
  if p_user.role <> 'admin' and not (
    p_user.subscription_tier in ('pro', 'premium') and
    (p_user.subscription_end_date is null or p_user.subscription_end_date > now())
  ) then
    if p_type = 'reading' then
      select reading_test_limit into v_limit
      from public.tier_rate_limits
      where tier = 'free' and currency in (coalesce(upper(p_user.subscription_currency), 'ALL'), 'ALL')
      order by case when currency = coalesce(upper(p_user.subscription_currency), 'ALL') then 0 else 1 end
      limit 1;
    else
      select listening_test_limit into v_limit
      from public.tier_rate_limits
      where tier = 'free' and currency in (coalesce(upper(p_user.subscription_currency), 'ALL'), 'ALL')
      order by case when currency = coalesce(upper(p_user.subscription_currency), 'ALL') then 0 else 1 end
      limit 1;
    end if;
    v_limit := coalesce(v_limit, -1);
  end if;

  -- Every counted start since the account began; paid starts never count.
  select count(*) into v_used
  from objective_private.test_start_ledger
  where user_id = p_user.id and test_type = p_type and counts_toward_free_limit;

  return jsonb_build_object('limit', v_limit, 'used', v_used);
end $$;

create or replace function public.start_objective_test(
  p_passage_id uuid,
  p_test_type text,
  p_test_mode text,
  p_duration_seconds integer,
  p_learning_path_activity_id uuid default null,
  p_audio_durations jsonb default '[]'::jsonb,
  p_request_id uuid default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user public.users;
  v_passage public.passages;
  v_session public.test_sessions;
  v_status jsonb;
  v_content jsonb;
  v_request_id uuid := coalesce(p_request_id, gen_random_uuid());
begin
  if p_test_type not in ('reading', 'listening') or p_test_mode not in ('practice', 'exam')
     or p_duration_seconds not between 60 and 7200 then
    raise exception 'Invalid test start' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_audio_durations, '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_audio_durations, '[]'::jsonb)) > 8 then
    raise exception 'Invalid audio durations' using errcode = '22023';
  end if;

  -- Lock the profile so simultaneous starts for this learner cannot both pass.
  select * into v_user from public.institution_learner_profiles where auth_id = auth.uid() for update;
  if v_user.id is null then
    raise exception 'Sign in to start this test' using errcode = '42501';
  end if;
  if exists (
    select 1 from objective_private.test_start_ledger
    where user_id = v_user.id and request_id = v_request_id
  ) then
    select s.* into v_session
    from objective_private.test_start_ledger l
    join public.test_sessions s on s.id = l.session_id
    where l.user_id = v_user.id and l.request_id = v_request_id;
    if v_session.id is null then
      return jsonb_build_object('error', 'attempt_unavailable');
    end if;
    return jsonb_build_object('session', to_jsonb(v_session));
  end if;
  select * into v_passage from public.passages where id = p_passage_id;
  if v_passage.id is null or not v_passage.is_active or lower(v_passage.test_type) <> p_test_type then
    raise exception 'Test unavailable' using errcode = '42501';
  end if;
  if not (v_user.role = 'admin' or v_passage.access_tier = 'free' or
    (v_user.subscription_tier = 'premium' and (v_user.subscription_end_date is null or v_user.subscription_end_date > now())) or
    (v_user.subscription_tier = 'pro' and v_passage.access_tier = 'pro' and
      (v_user.subscription_end_date is null or v_user.subscription_end_date > now()))) then
    raise exception 'Test unavailable with your current plan' using errcode = '42501';
  end if;
  if p_learning_path_activity_id is not null and not exists (
    select 1 from public.learning_path_activities
    where id = p_learning_path_activity_id and user_id = v_user.id
  ) then
    raise exception 'Invalid learning activity' using errcode = '42501';
  end if;

  v_status := objective_private.test_start_status(v_user, p_test_type);
  if (v_status->>'limit')::integer >= 0 and
     (v_status->>'used')::integer >= (v_status->>'limit')::integer then
    return jsonb_build_object('error', 'quota_exceeded', 'quota', v_status);
  end if;

  v_content := jsonb_build_object(
    'passage_id', p_passage_id, 'test_mode', p_test_mode,
    'duration_seconds', p_duration_seconds
  );
  if p_test_type = 'listening' then
    v_content := v_content || jsonb_build_object(
      'title', v_passage.title, 'audio_durations', coalesce(p_audio_durations, '[]'::jsonb),
      'review_seconds', case when p_test_mode = 'exam' then 120 else 0 end
    );
  end if;

  insert into public.test_sessions (
    user_id, test_type, test_mode, is_completed, duration_minutes,
    passage_id, learning_path_activity_id, content_data
  ) values (
    v_user.id, p_test_type, case when p_test_mode = 'exam' then 'mock' else 'practice' end,
    false, ceil(p_duration_seconds / 60.0)::integer, p_passage_id,
    p_learning_path_activity_id, v_content
  ) returning * into v_session;
  insert into objective_private.test_start_ledger
    (session_id, user_id, request_id, test_type, counts_toward_free_limit)
  values (
    v_session.id, v_user.id, v_request_id, p_test_type,
    not (v_user.role = 'admin' or
      (v_user.subscription_tier in ('pro', 'premium') and
       (v_user.subscription_end_date is null or v_user.subscription_end_date > now())))
  );

  return jsonb_build_object('session', to_jsonb(v_session));
end $$;

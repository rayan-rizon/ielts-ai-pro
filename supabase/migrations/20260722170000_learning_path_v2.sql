-- Learning Path V2: explicit availability, evidence-safe reads, and full-plan revisions.

create or replace function public.is_valid_study_availability(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value is null or (
    pg_catalog.jsonb_typeof(value) = 'object'
    and value->>'version' = '1'
    and pg_catalog.jsonb_typeof(value->'days') = 'object'
    and pg_catalog.length(pg_catalog.btrim(coalesce(value->>'timezone', ''))) between 1 and 100
    and (value->>'timezone' = 'UTC' or value->>'timezone' ~ '^[A-Za-z_]+(/[A-Za-z0-9_+.-]+)+$')
    and exists (select 1 from pg_catalog.jsonb_each(value->'days'))
    and not exists (
      select 1
      from pg_catalog.jsonb_each(value->'days') as entry(day_name, minutes)
      where entry.day_name not in (
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
      )
      or pg_catalog.jsonb_typeof(entry.minutes) <> 'number'
      or (entry.minutes #>> '{}')::numeric <> pg_catalog.trunc((entry.minutes #>> '{}')::numeric)
      or (entry.minutes #>> '{}')::integer not between 20 and 240
    )
  );
$$;

alter table public.users
  add column if not exists study_availability jsonb;

alter table public.users
  drop constraint if exists users_study_availability_valid;

alter table public.users
  add constraint users_study_availability_valid
  check (public.is_valid_study_availability(study_availability));

comment on column public.users.study_availability is
  'Versioned per-weekday study minutes. study_hours_goal remains a derived legacy weekly-hours field.';

create or replace function public.upsert_user_profile(
  p_auth_id uuid,
  p_email text,
  p_updates jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_result jsonb;
  v_availability jsonb;
begin
  if auth.uid() is null or auth.uid() <> p_auth_id then
    raise exception 'Authentication required for this profile' using errcode = '42501';
  end if;

  if p_updates ? 'study_availability' then
    v_availability := p_updates->'study_availability';
    if not public.is_valid_study_availability(v_availability) then
      raise exception 'Invalid study availability' using errcode = '22023';
    end if;
  end if;

  select profile.id into v_user_id
  from public.users as profile
  where profile.auth_id = p_auth_id;

  if v_user_id is null then
    select profile.id into v_user_id
    from public.users as profile
    where pg_catalog.lower(profile.email) = pg_catalog.lower(p_email);
  end if;

  if v_user_id is not null then
    update public.users as profile
    set
      auth_id = p_auth_id,
      full_name = case when p_updates ? 'full_name' then nullif(p_updates->>'full_name', '') else profile.full_name end,
      avatar_url = case when p_updates ? 'avatar_url' then nullif(p_updates->>'avatar_url', '') else profile.avatar_url end,
      exam_type = case when p_updates ? 'exam_type' then nullif(p_updates->>'exam_type', '') else profile.exam_type end,
      target_band_score = case when p_updates ? 'target_band_score' then (p_updates->>'target_band_score')::numeric(2,1) else profile.target_band_score end,
      test_date = case when p_updates ? 'test_date' then nullif(p_updates->>'test_date', '')::date else profile.test_date end,
      study_hours_goal = case when p_updates ? 'study_hours_goal' then greatest(1, least(40, (p_updates->>'study_hours_goal')::numeric)) else profile.study_hours_goal end,
      study_availability = case when p_updates ? 'study_availability' then v_availability else profile.study_availability end,
      weak_area = case when p_updates ? 'weak_area' then nullif(p_updates->>'weak_area', '') else profile.weak_area end,
      onboarding_completed = case when p_updates ? 'onboarding_completed' then (p_updates->>'onboarding_completed')::boolean else profile.onboarding_completed end,
      updated_at = pg_catalog.now()
    where profile.id = v_user_id
    returning pg_catalog.to_jsonb(profile.*) into v_result;
    return v_result;
  end if;

  insert into public.users as profile (
    auth_id, email, full_name, avatar_url, exam_type, role, subscription_tier,
    target_band_score, test_date, study_hours_goal, study_availability, weak_area,
    onboarding_completed, created_at, updated_at
  ) values (
    p_auth_id,
    p_email,
    coalesce(nullif(p_updates->>'full_name', ''), p_email),
    nullif(p_updates->>'avatar_url', ''),
    coalesce(nullif(p_updates->>'exam_type', ''), 'academic'),
    'user',
    'free',
    nullif(p_updates->>'target_band_score', '')::numeric(2,1),
    nullif(p_updates->>'test_date', '')::date,
    coalesce(nullif(p_updates->>'study_hours_goal', '')::numeric, 10),
    v_availability,
    nullif(p_updates->>'weak_area', ''),
    coalesce((p_updates->>'onboarding_completed')::boolean, false),
    pg_catalog.now(),
    pg_catalog.now()
  )
  returning pg_catalog.to_jsonb(profile.*) into v_result;

  return v_result;
end;
$$;

revoke all on function public.upsert_user_profile(uuid, text, jsonb) from public;
revoke all on function public.upsert_user_profile(uuid, text, jsonb) from anon;
grant execute on function public.upsert_user_profile(uuid, text, jsonb) to authenticated;
grant execute on function public.upsert_user_profile(uuid, text, jsonb) to service_role;

create or replace function public.get_learning_path_data()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_path record;
  v_activities json;
  v_module_averages json;
  v_module_trends json;
  v_sessions json;
  v_proficiencies json;
  v_total_tests integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select profile.id into v_user_id
  from public.users as profile
  where profile.auth_id = auth.uid();

  if v_user_id is null then
    raise exception 'Profile not found' using errcode = '42501';
  end if;

  select path.id, path.path_data, path.activities_completed, path.created_at
    into v_path
  from public.learning_paths as path
  where path.user_id = v_user_id
  order by path.created_at desc
  limit 1;

  select coalesce(pg_catalog.json_agg(pg_catalog.json_build_object(
    'id', activity.id,
    'activity_key', activity.activity_key,
    'scheduled_day', activity.scheduled_day,
    'scheduled_date', activity.scheduled_date,
    'is_completed', activity.is_completed,
    'completed_at', activity.completed_at,
    'outcome_score', activity.outcome_score,
    'outcome_data', activity.outcome_data,
    'title', activity.title,
    'description', activity.description,
    'module', activity.module,
    'estimated_minutes', activity.estimated_minutes,
    'priority', activity.priority,
    'activity_type', activity.activity_type,
    'skill_targets', activity.skill_targets
  )), '[]'::json)
  into v_activities
  from public.learning_path_activities as activity
  where activity.learning_path_id = v_path.id;

  with recent_sessions as (
    select session.test_type, session.score, session.completed_at,
      pg_catalog.row_number() over (
        partition by session.test_type order by session.completed_at desc
      ) as sequence
    from public.test_sessions as session
    where session.user_id = v_user_id
      and session.is_completed = true
      and session.score is not null
      and session.completed_at >= pg_catalog.now() - interval '90 days'
  ), module_stats as (
    select test_type, pg_catalog.avg(score) as average_score,
      pg_catalog.max(score) filter (where sequence = 1) as latest_score,
      pg_catalog.max(score) filter (where sequence = 2) as previous_score
    from recent_sessions
    group by test_type
  )
  select
    coalesce(pg_catalog.json_object_agg(test_type, pg_catalog.round(average_score::numeric, 2)), '{}'::json),
    coalesce(pg_catalog.json_object_agg(test_type, case
      when latest_score > previous_score then 'up'
      when latest_score < previous_score then 'down'
      else 'stable'
    end), '{}'::json)
  into v_module_averages, v_module_trends
  from module_stats;

  select pg_catalog.count(*) into v_total_tests
  from public.test_sessions as session
  where session.user_id = v_user_id and session.is_completed = true;

  select coalesce(pg_catalog.json_agg(pg_catalog.json_build_object(
    'id', session.id,
    'test_type', session.test_type,
    'score', session.score,
    'completed_at', session.completed_at,
    'content_data', session.content_data
  ) order by session.completed_at desc), '[]'::json)
  into v_sessions
  from public.test_sessions as session
  where session.user_id = v_user_id
    and session.is_completed = true
    and session.completed_at >= pg_catalog.now() - interval '90 days';

  select coalesce(pg_catalog.json_agg(pg_catalog.json_build_object(
    'skill_code', proficiency.skill_code,
    'module', proficiency.module,
    'mastery_probability', proficiency.mastery_probability,
    'confidence_level', proficiency.confidence_level,
    'practice_count', proficiency.practice_count,
    'correct_count', proficiency.correct_count,
    'last_practiced_at', proficiency.last_practiced_at,
    'next_review_at', proficiency.next_review_at
  ) order by proficiency.mastery_probability asc), '[]'::json)
  into v_proficiencies
  from public.skill_proficiency as proficiency
  where proficiency.user_id = v_user_id;

  return pg_catalog.json_build_object(
    'learningPath', case when v_path.id is null then null else pg_catalog.json_build_object(
      'id', v_path.id,
      'path_data', v_path.path_data,
      'activities_completed', v_path.activities_completed,
      'created_at', v_path.created_at
    ) end,
    'activities', coalesce(v_activities, '[]'::json),
    'stats', pg_catalog.json_build_object(
      'moduleAverages', coalesce(v_module_averages, '{}'::json),
      'moduleTrends', coalesce(v_module_trends, '{}'::json),
      'totalTests', coalesce(v_total_tests, 0),
      'sessions', coalesce(v_sessions, '[]'::json)
    ),
    'skillProficiencies', coalesce(v_proficiencies, '[]'::json)
  );
end;
$$;

revoke all on function public.get_learning_path_data() from public;
revoke all on function public.get_learning_path_data() from anon;
grant execute on function public.get_learning_path_data() to authenticated;
grant execute on function public.get_learning_path_data() to service_role;

create or replace function public.get_user_weak_skills(p_user_id uuid, p_limit integer default 5)
returns table(
  skill_code text,
  module text,
  mastery_probability double precision,
  practice_count integer,
  days_since_practice integer,
  priority_score double precision
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_access_user_id(p_user_id) then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  return query
  select
    proficiency.skill_code,
    proficiency.module,
    proficiency.mastery_probability,
    proficiency.practice_count,
    coalesce(extract(day from pg_catalog.now() - proficiency.last_practiced_at)::integer, 999),
    (1 - proficiency.mastery_probability) * 0.7
      + least(coalesce(extract(day from pg_catalog.now() - proficiency.last_practiced_at), 30) / 30.0, 1.0) * 0.3
  from public.skill_proficiency as proficiency
  where proficiency.user_id = p_user_id
    and proficiency.practice_count >= 5
    and proficiency.confidence_level >= 0.40
    and proficiency.mastery_probability < 0.75
  order by 6 desc
  limit greatest(1, least(coalesce(p_limit, 5), 20));
end;
$$;

revoke all on function public.get_user_weak_skills(uuid, integer) from public;
revoke all on function public.get_user_weak_skills(uuid, integer) from anon;
grant execute on function public.get_user_weak_skills(uuid, integer) to authenticated;
grant execute on function public.get_user_weak_skills(uuid, integer) to service_role;

create or replace function public.reschedule_learning_path_activity(
  p_activity_id uuid,
  p_scheduled_date date
)
returns public.learning_path_activities
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_activity public.learning_path_activities;
  v_day text;
  v_capacity integer;
  v_used integer;
  v_activity_minutes integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_scheduled_date < current_date or p_scheduled_date > current_date + 30 then
    raise exception 'Choose a date within the next 30 days' using errcode = '22023';
  end if;

  v_day := pg_catalog.lower(pg_catalog.to_char(p_scheduled_date, 'FMDay'));
  select
    (profile.study_availability#>>array['days', v_day])::integer,
    activity.estimated_minutes
  into v_capacity, v_activity_minutes
  from public.learning_path_activities as activity
  join public.users as profile on profile.id = activity.user_id
  where activity.id = p_activity_id
    and activity.user_id = public.get_my_public_user_id();

  if v_activity_minutes is null then
    raise exception 'Activity not found for this user' using errcode = '42501';
  end if;
  if coalesce(v_capacity, 0) < 20 then
    raise exception 'That is a rest day. Add availability before rescheduling.' using errcode = '22023';
  end if;

  select coalesce(pg_catalog.sum(other.estimated_minutes), 0)
  into v_used
  from public.learning_path_activities as other
  where other.user_id = public.get_my_public_user_id()
    and other.scheduled_date = p_scheduled_date
    and other.id <> p_activity_id
    and other.is_completed = false;

  if v_used + v_activity_minutes > v_capacity then
    raise exception 'Rescheduling would exceed the selected daily availability' using errcode = '22023';
  end if;

  update public.learning_path_activities as activity
  set scheduled_date = p_scheduled_date,
      scheduled_day = v_day
  where activity.id = p_activity_id
    and activity.user_id = public.get_my_public_user_id()
  returning activity.* into v_activity;

  return v_activity;
end;
$$;

revoke all on function public.reschedule_learning_path_activity(uuid, date) from public;
revoke all on function public.reschedule_learning_path_activity(uuid, date) from anon;
grant execute on function public.reschedule_learning_path_activity(uuid, date) to authenticated;

create or replace function public.save_learning_path_v2(
  p_path_data jsonb,
  p_activities jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_path_id uuid;
  v_activity_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select profile.id into v_user_id
  from public.users as profile
  where profile.auth_id = auth.uid()
    and pg_catalog.lower(profile.subscription_tier) in ('pro', 'premium');

  if v_user_id is null then
    raise exception 'Pro or Premium profile not found' using errcode = '42501';
  end if;
  if pg_catalog.jsonb_typeof(p_path_data) <> 'object'
    or p_path_data->>'version' <> '2'
    or nullif(p_path_data->>'input_fingerprint', '') is null then
    raise exception 'Invalid V2 path contract' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_typeof(p_activities) <> 'array'
    or pg_catalog.jsonb_array_length(p_activities) > 21 then
    raise exception 'Invalid activity payload' using errcode = '22023';
  end if;

  insert into public.learning_paths (user_id, path_data)
  values (v_user_id, p_path_data)
  returning id into v_path_id;

  insert into public.learning_path_activities (
    learning_path_id, user_id, activity_key, activity_type, module, title, description,
    skill_targets, scheduled_day, scheduled_date, estimated_minutes, priority, is_completed
  )
  select
    v_path_id,
    v_user_id,
    item.activity->>'activity_key',
    coalesce(nullif(item.activity->>'activity_type', ''), 'practice'),
    nullif(item.activity->>'module', ''),
    item.activity->>'title',
    nullif(item.activity->>'description', ''),
    array(select pg_catalog.jsonb_array_elements_text(coalesce(item.activity->'skill_targets', '[]'::jsonb))),
    item.activity->>'scheduled_day',
    (item.activity->>'scheduled_date')::date,
    greatest(20, least(60, (item.activity->>'estimated_time')::integer)),
    case when item.activity->>'priority' in ('low', 'medium', 'high') then item.activity->>'priority' else 'medium' end,
    false
  from pg_catalog.jsonb_array_elements(p_activities) as item(activity);

  get diagnostics v_activity_count = row_count;
  update public.users as profile
  set last_path_generated_at = pg_catalog.now(), updated_at = pg_catalog.now()
  where profile.id = v_user_id;

  return pg_catalog.jsonb_build_object('path_id', v_path_id, 'activity_count', v_activity_count);
end;
$$;

revoke all on function public.save_learning_path_v2(jsonb, jsonb) from public;
revoke all on function public.save_learning_path_v2(jsonb, jsonb) from anon;
grant execute on function public.save_learning_path_v2(jsonb, jsonb) to authenticated;

create or replace function public.save_result_focus_plan(
  p_source_session_id uuid,
  p_path_data jsonb,
  p_activities jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_module text;
  v_path_id uuid;
  v_previous_path jsonb := '{}'::jsonb;
  v_previous_schedule jsonb := '{}'::jsonb;
  v_merged_schedule jsonb := '{}'::jsonb;
  v_adjusted_activities jsonb := '[]'::jsonb;
  v_item record;
  v_day text;
  v_candidate_date date;
  v_minutes integer;
  v_capacity integer;
  v_used integer;
  v_activity_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select session.user_id, session.test_type
    into v_user_id, v_module
  from public.test_sessions as session
  where session.id = p_source_session_id
    and session.is_completed = true
    and session.test_type in ('reading', 'listening')
    and session.user_id = public.get_my_public_user_id();

  if not found then
    raise exception 'Completed source test not found for this user' using errcode = '42501';
  end if;
  if pg_catalog.jsonb_typeof(p_path_data) <> 'object' then
    raise exception 'Path data must be a JSON object' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_typeof(p_activities) <> 'array' or pg_catalog.jsonb_array_length(p_activities) <> 7 then
    raise exception 'Exactly seven plan activities are required' using errcode = '22023';
  end if;

  select coalesce(path.path_data, '{}'::jsonb)
    into v_previous_path
  from public.learning_paths as path
  where path.user_id = v_user_id
  order by path.created_at desc
  limit 1;

  v_previous_schedule := coalesce(v_previous_path->'weekly_schedule', '{}'::jsonb);
  v_merged_schedule := v_previous_schedule;

  for v_item in
    select activity, ordinality
    from pg_catalog.jsonb_array_elements(p_activities) with ordinality as item(activity, ordinality)
  loop
    v_day := nullif(v_item.activity->>'scheduled_day', '');
    v_candidate_date := nullif(v_item.activity->>'scheduled_date', '')::date;
    if v_day not in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
      or v_candidate_date is null then
      raise exception 'Every recovery activity needs a valid day and date' using errcode = '22023';
    end if;
    v_minutes := greatest(20, least(60, coalesce((v_item.activity->>'estimated_time')::integer, 30)));
    v_capacity := coalesce(
      (v_previous_path#>>array['goal_snapshot','study_availability','days',v_day])::integer,
      case when v_previous_path->>'version' = '2' then 0 else 60 end
    );
    select coalesce(pg_catalog.sum((task->>'estimated_time')::integer), 0)
      into v_used
    from pg_catalog.jsonb_array_elements(coalesce(v_merged_schedule->v_day, '[]'::jsonb)) as task;

    if v_candidate_date between current_date and current_date + 6
      and v_capacity > 0
      and v_used + v_minutes <= v_capacity then
      v_merged_schedule := pg_catalog.jsonb_set(
        v_merged_schedule,
        array[v_day],
        coalesce(v_merged_schedule->v_day, '[]'::jsonb) || (v_item.activity || pg_catalog.jsonb_build_object(
          'activity_key', pg_catalog.format('result:%s:day:%s', p_source_session_id, v_item.ordinality),
          'evidence', pg_catalog.jsonb_build_object('source_session_id', p_source_session_id),
          'success_criterion', 'Complete the recovery task and record the outcome before the next revision.'
        )),
        true
      );
    elsif v_candidate_date between current_date and current_date + 6 then
      v_candidate_date := v_candidate_date + 7;
    end if;

    while exists (
      select 1
      from pg_catalog.jsonb_array_elements(v_adjusted_activities) as existing(activity)
      where existing.activity->>'scheduled_date' = v_candidate_date::text
    ) loop
      v_candidate_date := v_candidate_date + 7;
    end loop;

    v_adjusted_activities := v_adjusted_activities || (
      v_item.activity || pg_catalog.jsonb_build_object(
        'scheduled_date', v_candidate_date,
        'scheduled_day', pg_catalog.lower(pg_catalog.to_char(v_candidate_date, 'FMDay'))
      )
    );
  end loop;

  insert into public.learning_paths (user_id, path_data)
  values (
    v_user_id,
    v_previous_path || (p_path_data - 'weekly_schedule') || pg_catalog.jsonb_build_object(
      'version', 2,
      'generator_version', coalesce(v_previous_path->>'generator_version', '2.0.0'),
      'generation_trigger', 'result_recovery',
      'source', 'result_deep_analysis',
      'source_session_id', p_source_session_id,
      'module', v_module,
      'weekly_schedule', v_merged_schedule,
      'recovery_backlog', v_adjusted_activities,
      'why_plan_changed', pg_catalog.format('A new scored %s result added recovery work without replacing your exam roadmap.', v_module)
    )
  ) returning id into v_path_id;

  insert into public.learning_path_activities (
    learning_path_id, user_id, activity_key, activity_type, module, title, description,
    skill_targets, scheduled_day, scheduled_date, estimated_minutes, priority
  )
  select
    v_path_id,
    v_user_id,
    pg_catalog.format('result:%s:day:%s', p_source_session_id, item.ordinality),
    coalesce(nullif(item.activity->>'activity_type', ''), 'practice'),
    v_module,
    coalesce(nullif(item.activity->>'title', ''), pg_catalog.format('Recovery plan day %s', item.ordinality)),
    nullif(item.activity->>'description', ''),
    array(select pg_catalog.jsonb_array_elements_text(coalesce(item.activity->'skill_targets', '[]'::jsonb))),
    nullif(item.activity->>'scheduled_day', ''),
    nullif(item.activity->>'scheduled_date', '')::date,
    greatest(20, least(60, coalesce((item.activity->>'estimated_time')::integer, 30))),
    case when item.activity->>'priority' in ('low', 'medium', 'high') then item.activity->>'priority' else 'medium' end
  from pg_catalog.jsonb_array_elements(v_adjusted_activities) with ordinality as item(activity, ordinality);

  get diagnostics v_activity_count = row_count;
  return pg_catalog.jsonb_build_object('path_id', v_path_id, 'activity_count', v_activity_count);
end;
$$;

revoke all on function public.save_result_focus_plan(uuid, jsonb, jsonb) from public;
revoke all on function public.save_result_focus_plan(uuid, jsonb, jsonb) from anon;
grant execute on function public.save_result_focus_plan(uuid, jsonb, jsonb) to authenticated;

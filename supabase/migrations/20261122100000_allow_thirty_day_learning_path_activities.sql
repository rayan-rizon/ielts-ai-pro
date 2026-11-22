-- Study plan now covers up to 30 days (3 tasks a day at most), so the activity
-- cap in save_learning_path_v2 moves from 21 (one week) to 90. Only the cap
-- changes; everything else matches the function as it is deployed.
create or replace function public.save_learning_path_v2(p_path_data jsonb, p_activities jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_path_id uuid;
  v_activity_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select profile.id into v_user_id
  from public.institution_learner_profiles as profile
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
    or pg_catalog.jsonb_array_length(p_activities) > 90 then
    raise exception 'Invalid activity payload' using errcode = '22023';
  end if;

  insert into public.learning_paths (user_id, path_data)
  values (v_user_id, p_path_data)
  returning id into v_path_id;

  insert into public.learning_path_activities (
    learning_path_id, user_id, activity_key, activity_type, module, title, description,
    skill_targets, scheduled_day, scheduled_date, estimated_minutes, priority,
    stage_key, completion_policy, requested_mode, evidence_key,
    is_completed, completed_at, outcome_score, outcome_band, outcome_accuracy,
    completion_source, outcome_data
  )
  select
    v_path_id,
    v_user_id,
    item.activity->>'activity_key',
    coalesce(nullif(item.activity->>'activity_type', ''), 'practice'),
    nullif(item.activity->>'module', ''),
    item.activity->>'title',
    nullif(item.activity->>'description', ''),
    array(
      select pg_catalog.jsonb_array_elements_text(
        coalesce(item.activity->'skill_targets', '[]'::jsonb)
      )
    ),
    item.activity->>'scheduled_day',
    (item.activity->>'scheduled_date')::date,
    greatest(20, least(60, (item.activity->>'estimated_time')::integer)),
    case
      when item.activity->>'priority' in ('low', 'medium', 'high')
        then item.activity->>'priority'
      else 'medium'
    end,
    nullif(item.activity->>'stage_key', ''),
    case
      when item.activity->>'completion_policy' = 'self_reported' then 'self_reported'
      else 'verified'
    end,
    nullif(item.activity->>'requested_mode', ''),
    nullif(item.activity->>'evidence_key', ''),
    coalesce(carried.is_completed, false),
    carried.completed_at,
    carried.outcome_score,
    carried.outcome_band,
    carried.outcome_accuracy,
    carried.completion_source,
    carried.outcome_data
  from pg_catalog.jsonb_array_elements(p_activities) as item(activity)
  left join lateral (
    select
      true as is_completed,
      previous.completed_at,
      previous.outcome_score,
      previous.outcome_band,
      previous.outcome_accuracy,
      previous.completion_source,
      previous.outcome_data
    from public.learning_path_activities as previous
    where previous.user_id = v_user_id
      and previous.is_completed is true
      and previous.activity_key = item.activity->>'activity_key'
      and (
        previous.completion_source in (
          'test_session', 'grammar_attempt', 'transfer', 'vocabulary_review'
        )
        or previous.outcome_data->>'verified' = 'true'
      )
    order by previous.completed_at desc nulls last, previous.created_at desc
    limit 1
  ) as carried on true;

  get diagnostics v_activity_count = row_count;

  update public.users as profile
  set last_path_generated_at = pg_catalog.now(), updated_at = pg_catalog.now()
  where profile.id = v_user_id;

  return pg_catalog.jsonb_build_object('path_id', v_path_id, 'activity_count', v_activity_count);
end;
$function$;

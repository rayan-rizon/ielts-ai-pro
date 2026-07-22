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
  v_activity_count integer;
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

  if jsonb_typeof(p_path_data) <> 'object' then
    raise exception 'Path data must be a JSON object' using errcode = '22023';
  end if;

  if jsonb_typeof(p_activities) <> 'array' or jsonb_array_length(p_activities) <> 7 then
    raise exception 'Exactly seven plan activities are required' using errcode = '22023';
  end if;

  insert into public.learning_paths (user_id, path_data)
  values (
    v_user_id,
    p_path_data || jsonb_build_object(
      'source', 'result_deep_analysis',
      'source_session_id', p_source_session_id,
      'module', v_module
    )
  )
  returning id into v_path_id;

  insert into public.learning_path_activities (
    learning_path_id,
    user_id,
    activity_key,
    activity_type,
    module,
    title,
    description,
    skill_targets,
    scheduled_day,
    scheduled_date,
    estimated_minutes,
    priority
  )
  select
    v_path_id,
    v_user_id,
    format('result:%s:day:%s', p_source_session_id, item.ordinality),
    coalesce(nullif(item.activity->>'activity_type', ''), 'practice'),
    v_module,
    coalesce(nullif(item.activity->>'title', ''), format('Recovery plan day %s', item.ordinality)),
    nullif(item.activity->>'description', ''),
    array(
      select jsonb_array_elements_text(coalesce(item.activity->'skill_targets', '[]'::jsonb))
    ),
    nullif(item.activity->>'scheduled_day', ''),
    nullif(item.activity->>'scheduled_date', '')::date,
    greatest(5, least(180, coalesce((item.activity->>'estimated_time')::integer, 30))),
    case
      when item.activity->>'priority' in ('low', 'medium', 'high')
        then item.activity->>'priority'
      else 'medium'
    end
  from jsonb_array_elements(p_activities) with ordinality as item(activity, ordinality);

  get diagnostics v_activity_count = row_count;

  return jsonb_build_object(
    'path_id', v_path_id,
    'activity_count', v_activity_count
  );
end;
$$;

revoke all on function public.save_result_focus_plan(uuid, jsonb, jsonb) from public;
revoke all on function public.save_result_focus_plan(uuid, jsonb, jsonb) from anon;
grant execute on function public.save_result_focus_plan(uuid, jsonb, jsonb) to authenticated;

comment on function public.save_result_focus_plan(uuid, jsonb, jsonb) is
  'Atomically saves a deterministic seven-day recovery plan for an authenticated user completed Reading or Listening result.';

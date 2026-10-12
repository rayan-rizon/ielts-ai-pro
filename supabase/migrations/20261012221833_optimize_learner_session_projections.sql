-- Card lists need one attempt per passage, never the essay/answers themselves.
create index if not exists idx_test_sessions_latest_passage
  on public.test_sessions (user_id, test_type, passage_id, created_at desc nulls last, id desc);

create or replace function public.get_learner_latest_sessions(
  p_user_id uuid, p_test_type text, p_passage_ids uuid[]
) returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
  if not public.can_access_user_id(p_user_id) then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  if p_test_type not in ('reading', 'listening') or cardinality(p_passage_ids) > 100 then
    raise exception 'Invalid session list parameters' using errcode = '22023';
  end if;
  return coalesce((select jsonb_agg(to_jsonb(s)) from (
    select distinct on (ts.passage_id) ts.id, ts.passage_id, ts.is_completed, ts.score,
      coalesce(ts.paired_room_id::text, ts.content_data->>'paired_room_id') as paired_room_id,
      ts.created_at, ts.completed_at,
      case jsonb_typeof(ts.user_responses)
        when 'object' then (select count(*)::integer from jsonb_object_keys(ts.user_responses))
        when 'array' then jsonb_array_length(ts.user_responses)
        else 0 end as completed_questions,
      jsonb_build_object('passage_id',ts.passage_id,'total_questions',ts.content_data->'total_questions') as content_data
    from public.test_sessions ts
    where ts.user_id = p_user_id and ts.test_type = p_test_type
      and ts.passage_id = any(p_passage_ids)
    order by ts.passage_id, ts.created_at desc nulls last, ts.id desc
  ) s), '[]'::jsonb);
end $$;
revoke all on function public.get_learner_latest_sessions(uuid,text,uuid[]) from public, anon;
grant execute on function public.get_learner_latest_sessions(uuid,text,uuid[]) to authenticated, service_role;

create index if not exists idx_test_sessions_analytics_cursor
  on public.test_sessions(user_id, (coalesce(completed_at,created_at,'-infinity'::timestamptz)) desc, id desc)
  where is_completed = true;

-- Preserve exact attempt-level analytics, including legacy evidence repair, but
-- omit report prose and drafts. Full result data is fetched only when opened.
create or replace function public.get_learner_analytics_page(
  p_user_id uuid, p_cutoff timestamptz default null,
  p_before_date timestamptz default null, p_before_id uuid default null,
  p_limit integer default 500
) returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
  if not public.can_access_user_id(p_user_id) then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  if (p_before_date is null) <> (p_before_id is null) then
    raise exception 'Incomplete cursor' using errcode = '22023';
  end if;
  return coalesce((select jsonb_agg(to_jsonb(s) order by s.cursor_date desc, s.id desc) from (
    select ts.id, ts.passage_id, ts.created_at, ts.completed_at, ts.score,
      ts.duration_minutes,ts.actual_duration_seconds,ts.test_type,ts.test_mode,ts.is_completed,
      ts.evaluation_status,ts.evaluation_version,ts.evaluated_at,
      coalesce(ts.completed_at,ts.created_at,'-infinity'::timestamptz) as cursor_date,
      (coalesce(ts.content_data,'{}'::jsonb) - array[
        'writingText','task1_response','task2_response','drafts','essay','transcript',
        'ai_feedbacks','finalEvaluation','passage_content','passageContent','questions'
      ]) || jsonb_build_object(
        'ai_feedbacks', (select coalesce(jsonb_object_agg(f.key, jsonb_build_object(
          'criteriaScores',f.value->'criteriaScores','criteria_scores',f.value->'criteria_scores'
        )),'{}'::jsonb) from jsonb_each(case when jsonb_typeof(ts.content_data->'ai_feedbacks')='object'
          then ts.content_data->'ai_feedbacks' else '{}'::jsonb end) f),
        'finalEvaluation', case when jsonb_typeof(ts.content_data->'finalEvaluation')='object'
          then (ts.content_data->'finalEvaluation') - array['feedback','summary','transcript','annotations','strengths','improvements','recommendations']
          else ts.content_data->'finalEvaluation' end,
        'analyticsMetadataOnly',true
      ) as content_data,
      jsonb_build_object('title',p.title,'cambridge_title',p.cambridge_title,'test_format',p.test_format) as passage
    from public.test_sessions ts left join public.passages p on p.id=ts.passage_id
    where ts.user_id=p_user_id and ts.is_completed=true
      and (p_cutoff is null or coalesce(ts.completed_at,ts.created_at) >= p_cutoff)
      and (p_before_date is null or (coalesce(ts.completed_at,ts.created_at,'-infinity'::timestamptz),ts.id) < (p_before_date,p_before_id))
    order by coalesce(ts.completed_at,ts.created_at,'-infinity'::timestamptz) desc,ts.id desc
    limit greatest(1,least(coalesce(p_limit,500),500))
  ) s),'[]'::jsonb);
end $$;
revoke all on function public.get_learner_analytics_page(uuid,timestamptz,timestamptz,uuid,integer) from public,anon;
grant execute on function public.get_learner_analytics_page(uuid,timestamptz,timestamptz,uuid,integer) to authenticated,service_role;

create or replace function public.get_learner_grammar_summary(p_user_id uuid,p_cutoff timestamptz default null)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
  if not public.can_access_user_id(p_user_id) then
    raise exception 'Access denied' using errcode='42501';
  end if;
  return (select jsonb_build_object('completedAttempts',count(*),
    'correct',coalesce(sum(correct_count),0),'questions',coalesce(sum(total_questions),0),
    'transferAttempts',count(*) filter(where mode='transfer'))
    from public.grammar_attempts where user_id=p_user_id and completion_state='completed'
    and (p_cutoff is null or completed_at>=p_cutoff));
end $$;
revoke all on function public.get_learner_grammar_summary(uuid,timestamptz) from public,anon;
grant execute on function public.get_learner_grammar_summary(uuid,timestamptz) to authenticated,service_role;

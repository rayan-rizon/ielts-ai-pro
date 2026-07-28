-- Match the production migration version created during the live rollout repair.
create or replace function public.get_grammar_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_id uuid := auth.uid();
  v_user public.users%rowtype;
  v_timezone text := 'UTC';
  v_local_day date;
  v_is_paid boolean := false;
  v_daily_used integer := 0;
  v_last_diagnostic timestamptz;
  v_latest_path jsonb;
begin
  if v_auth_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into v_user
  from public.users
  where id = v_auth_id or auth_id = v_auth_id
  order by case when id = v_auth_id then 0 else 1 end
  limit 1;

  if v_user.id is null then
    raise exception 'Learner profile not found' using errcode = 'P0002';
  end if;

  v_timezone := coalesce(nullif(v_user.study_availability ->> 'timezone', ''), 'UTC');
  if not exists (select 1 from pg_timezone_names where name = v_timezone) then
    v_timezone := 'UTC';
  end if;
  v_local_day := (now() at time zone v_timezone)::date;
  v_is_paid :=
    lower(coalesce(v_user.subscription_tier, 'free')) in ('pro', 'premium', 'admin')
    or lower(coalesce(v_user.role, '')) = 'admin';

  select coalesce(sum(a.total_questions), 0)::integer
  into v_daily_used
  from public.grammar_attempts a
  where a.user_id = v_user.id
    and a.mode in ('practice', 'review')
    and (a.started_at at time zone v_timezone)::date = v_local_day
    and a.completion_state in ('in_progress', 'completed');

  select max(coalesce(a.completed_at, a.started_at))
  into v_last_diagnostic
  from public.grammar_attempts a
  where a.user_id = v_user.id
    and a.mode = 'diagnostic'
    and a.completion_state in ('in_progress', 'completed');

  select lp.path_data
  into v_latest_path
  from public.learning_paths lp
  where lp.user_id = v_user.id
  order by lp.created_at desc
  limit 1;

  return jsonb_build_object(
    'access', jsonb_build_object(
      'tier', lower(coalesce(v_user.subscription_tier, 'free')),
      'isPaid', v_is_paid,
      'timezone', v_timezone,
      'dailyLimit', case when v_is_paid then null else 5 end,
      'dailyUsed', case when v_is_paid then 0 else least(5, v_daily_used) end,
      'dailyRemaining', case when v_is_paid then null else greatest(0, 5 - v_daily_used) end,
      'diagnosticAvailable', v_is_paid or v_last_diagnostic is null or v_last_diagnostic <= now() - interval '30 days',
      'lastDiagnosticAt', v_last_diagnostic
    ),
    'skills', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'skillCode', s.skill_code,
          'label', s.learner_label,
          'description', s.description,
          'displayOrder', s.display_order,
          'mastery', coalesce(sp.mastery_probability, 0.5),
          'confidence', coalesce(sp.confidence_level, 0),
          'observations', coalesce(sp.practice_count, 0),
          'correctCount', coalesce(sp.correct_count, 0),
          'evidenceClass', case
            when coalesce(sp.practice_count, 0) = 0 or coalesce(sp.confidence_level, 0) < 0.15 then 'diagnostic'
            when coalesce(sp.practice_count, 0) < 5 or coalesce(sp.confidence_level, 0) < 0.4 then 'early'
            else 'measured'
          end,
          'nextReviewAt', sp.next_review_at,
          'isDue', coalesce(sp.practice_count, 0) > 0 and sp.next_review_at <= now()
        )
        order by s.display_order
      ), '[]'::jsonb)
      from public.grammar_skills s
      left join public.skill_proficiency sp
        on sp.user_id = v_user.id
       and sp.skill_code = s.skill_code
       and sp.module = 'grammar'
      where s.is_published
    ),
    'criterionEvidence', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'source', case sp.skill_code
            when 'writing_grammar' then 'writing'
            when 'speaking_grammar' then 'speaking'
          end,
          'skillCode', sp.skill_code,
          'mastery', sp.mastery_probability,
          'confidence', sp.confidence_level,
          'observations', sp.practice_count,
          'evidenceClass', case
            when coalesce(sp.practice_count, 0) = 0 or coalesce(sp.confidence_level, 0) < 0.15 then 'diagnostic'
            when coalesce(sp.practice_count, 0) < 5 or coalesce(sp.confidence_level, 0) < 0.4 then 'early'
            else 'measured'
          end,
          'provenance', case sp.skill_code
            when 'writing_grammar' then 'Writing grammatical range and accuracy criterion'
            when 'speaking_grammar' then 'Speaking grammatical range and accuracy criterion · transcript-based'
          end,
          'lastPracticedAt', sp.last_practiced_at
        )
        order by sp.skill_code
      ), '[]'::jsonb)
      from public.skill_proficiency sp
      where sp.user_id = v_user.id
        and sp.skill_code in ('writing_grammar', 'speaking_grammar')
        and sp.skill_code not in ('grammar_writing', 'grammar_speaking')
    ),
    'dueReviews', (
      select count(*)::integer
      from public.skill_proficiency sp
      where sp.user_id = v_user.id
        and sp.module = 'grammar'
        and sp.practice_count > 0
        and sp.next_review_at <= now()
    ),
    'recentAttempts', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
      from (
        select
          a.id,
          a.mode,
          a.target_skills as "targetSkills",
          a.total_questions as "totalQuestions",
          a.correct_count as "correctCount",
          a.completion_state as "completionState",
          a.transfer_evaluation as "transferEvaluation",
          a.started_at as "startedAt",
          a.completed_at as "completedAt"
        from public.grammar_attempts a
        where a.user_id = v_user.id
        order by a.started_at desc
        limit 8
      ) x
    ),
    'learningPath', jsonb_build_object(
      'fingerprint', v_latest_path ->> 'input_fingerprint',
      'grammarActivities', coalesce((
        select jsonb_agg(activity.item)
        from jsonb_each(coalesce(v_latest_path -> 'weekly_schedule', '{}'::jsonb))
          as days(day_name, activities)
        cross join lateral jsonb_array_elements(days.activities) as activity(item)
        where activity.item ->> 'module' = 'grammar'
      ), '[]'::jsonb)
    )
  );
end;
$$;

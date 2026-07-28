-- Connected learner evidence contract.
-- Historical Writing/Speaking reports remain untouched. Only their metadata is
-- marked legacy so criterion-level evidence cannot influence future coaching.

alter table public.test_sessions
  add column if not exists learning_path_activity_id uuid
    references public.learning_path_activities(id) on delete set null,
  add column if not exists evaluation_status text,
  add column if not exists evaluation_version text,
  add column if not exists evaluated_at timestamptz,
  add column if not exists actual_duration_seconds integer;

alter table public.test_sessions
  drop constraint if exists test_sessions_evaluation_status_check,
  add constraint test_sessions_evaluation_status_check
    check (
      evaluation_status is null
      or evaluation_status in ('not_requested', 'pending', 'complete', 'failed', 'legacy')
    ),
  drop constraint if exists test_sessions_actual_duration_seconds_check,
  add constraint test_sessions_actual_duration_seconds_check
    check (
      actual_duration_seconds is null
      or actual_duration_seconds between 1 and 14400
    );

create index if not exists idx_test_sessions_learning_path_activity
  on public.test_sessions (learning_path_activity_id)
  where learning_path_activity_id is not null;

alter table public.learning_path_activities
  add column if not exists outcome_band numeric,
  add column if not exists outcome_accuracy numeric,
  add column if not exists completion_source text;

alter table public.learning_path_activities
  drop constraint if exists learning_path_activities_outcome_band_check,
  add constraint learning_path_activities_outcome_band_check
    check (outcome_band is null or outcome_band between 0 and 9),
  drop constraint if exists learning_path_activities_outcome_accuracy_check,
  add constraint learning_path_activities_outcome_accuracy_check
    check (outcome_accuracy is null or outcome_accuracy between 0 and 100),
  drop constraint if exists learning_path_activities_completion_source_check,
  add constraint learning_path_activities_completion_source_check
    check (
      completion_source is null
      or completion_source in ('manual', 'test_session', 'grammar_attempt', 'transfer')
    );

alter table public.skill_proficiency
  add column if not exists evidence_version text;

update public.test_sessions
set evaluation_status = 'legacy'
where lower(test_type) in ('writing', 'speaking')
  and evaluation_status is null
  and (
    score is not null
    or band_score is not null
    or content_data ? 'ai_feedbacks'
    or content_data ? 'finalEvaluation'
    or content_data ? 'detailedFeedback'
  );

update public.test_sessions
set evaluation_status = 'not_requested'
where lower(test_type) in ('writing', 'speaking')
  and evaluation_status is null;

update public.learning_path_activities
set
  outcome_band = case
    when (outcome_data ->> 'test_score') ~ '^[0-9]+(\.[0-9]+)?$'
      then least(9, greatest(0, (outcome_data ->> 'test_score')::numeric))
    else outcome_band
  end,
  completion_source = 'test_session'
where is_completed is true
  and coalesce((outcome_data ->> 'auto_completed')::boolean, false)
  and outcome_data ? 'test_session_id';

update public.learning_path_activities
set completion_source = 'manual'
where is_completed is true
  and completion_source is null;

create or replace function public.auto_complete_learning_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_accuracy numeric;
begin
  if not (
    new.is_completed is true
    and (tg_op = 'INSERT' or coalesce(old.is_completed, false) is false)
    and new.learning_path_activity_id is not null
  ) then
    return new;
  end if;

  if lower(new.test_type) in ('reading', 'listening') then
    v_accuracy := case
      when (new.content_data ->> 'correctAnswers') ~ '^[0-9]+$'
       and (new.content_data ->> 'totalQuestions') ~ '^[1-9][0-9]*$'
      then round(
        ((new.content_data ->> 'correctAnswers')::numeric
          / (new.content_data ->> 'totalQuestions')::numeric) * 100,
        1
      )
      else null
    end;
  end if;

  update public.learning_path_activities activity
  set
    is_completed = true,
    completed_at = coalesce(new.completed_at, now()),
    outcome_band = coalesce(new.band_score, new.score),
    outcome_accuracy = v_accuracy,
    completion_source = 'test_session',
    outcome_score = coalesce(
      v_accuracy::double precision,
      new.band_score::double precision,
      new.score::double precision
    ),
    outcome_data = coalesce(activity.outcome_data, '{}'::jsonb) || jsonb_build_object(
      'verified', true,
      'auto_completed', true,
      'test_session_id', new.id,
      'test_score', coalesce(new.band_score, new.score),
      'test_type', new.test_type
    ),
    updated_at = now()
  where activity.id = new.learning_path_activity_id
    and activity.user_id = new.user_id
    and not coalesce(activity.is_completed, false)
    and lower(coalesce(activity.module, '')) = lower(new.test_type);

  return new;
end;
$function$;

-- Reading and Listening evidence stays deterministic. Writing and Speaking
-- criterion evidence is handled by the v5-only trigger below.
create or replace function public.update_skill_proficiency_from_test()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_skill record;
  v_skill_code text;
  v_total integer;
  v_correct integer;
  v_accuracy double precision;
begin
  if not (
    new.is_completed is true
    and (tg_op = 'INSERT' or coalesce(old.is_completed, false) is false)
    and lower(new.test_type) in ('reading', 'listening')
  ) then
    return new;
  end if;

  for v_skill in
    select * from jsonb_each(coalesce(new.content_data -> 'typeStats', '{}'::jsonb))
  loop
    v_total := coalesce((v_skill.value ->> 'total')::integer, 0);
    v_correct := coalesce((v_skill.value ->> 'correct')::integer, 0);
    continue when v_total <= 0;
    v_accuracy := least(greatest(v_correct::double precision / v_total, 0), 1);
    v_skill_code := lower(new.test_type) || '_' || replace(lower(v_skill.key), ' ', '_');

    insert into public.skill_proficiency (
      user_id, skill_code, module, mastery_probability, confidence_level,
      practice_count, correct_count, last_practiced_at, next_review_at, updated_at
    )
    values (
      new.user_id, v_skill_code, lower(new.test_type),
      least(greatest((0.5 * 0.8) + (v_accuracy * 0.2), 0.01), 0.99),
      least(0.15 + v_total::double precision / 150.0, 1),
      v_total, v_correct, now(),
      now() + (case when v_accuracy < 0.5 then 1 else 5 end || ' days')::interval,
      now()
    )
    on conflict (user_id, skill_code) do update set
      mastery_probability = least(greatest(
        public.skill_proficiency.mastery_probability * 0.8 + v_accuracy * 0.2,
        0.01
      ), 0.99),
      confidence_level = least(coalesce(public.skill_proficiency.confidence_level, 0) + 0.1, 1),
      practice_count = coalesce(public.skill_proficiency.practice_count, 0) + v_total,
      correct_count = coalesce(public.skill_proficiency.correct_count, 0) + v_correct,
      last_practiced_at = now(),
      next_review_at = excluded.next_review_at,
      updated_at = now();
  end loop;
  return new;
end;
$function$;

create or replace function public.update_current_evaluation_skill_evidence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_skill record;
  v_score double precision;
  v_accuracy double precision;
  v_skill_code text;
  v_module text;
begin
  if new.evaluation_status <> 'complete'
    or new.evaluation_version <> '2026-07-29-v5'
    or lower(new.test_type) not in ('writing', 'speaking')
    or (
      tg_op = 'UPDATE'
      and
      old.evaluation_status = 'complete'
      and old.evaluation_version = new.evaluation_version
      and old.evaluated_at is not distinct from new.evaluated_at
    )
  then
    return new;
  end if;

  v_module := lower(new.test_type);
  for v_skill in
    select * from jsonb_each(coalesce(new.content_data -> 'criteriaScores', '{}'::jsonb))
  loop
    begin
      v_score := (v_skill.value #>> '{}')::double precision;
    exception when others then
      continue;
    end;
    continue when v_score <= 0 or v_score > 9;
    v_accuracy := v_score / 9.0;
    v_skill_code := v_module || '_' || v_skill.key;

    insert into public.skill_proficiency (
      user_id, skill_code, module, mastery_probability, confidence_level,
      practice_count, correct_count, last_practiced_at, next_review_at,
      evidence_version, updated_at
    )
    values (
      new.user_id, v_skill_code, v_module, v_accuracy, 0.18, 1,
      case when v_accuracy >= 0.67 then 1 else 0 end,
      now(), now() + (case when v_accuracy < 0.56 then 1 else 5 end || ' days')::interval,
      '2026-07-29-v5', now()
    )
    on conflict (user_id, skill_code) do update set
      module = excluded.module,
      mastery_probability = case
        when public.skill_proficiency.evidence_version is distinct from '2026-07-29-v5'
          then excluded.mastery_probability
        else least(greatest(
          public.skill_proficiency.mastery_probability * 0.85 + v_accuracy * 0.15,
          0.01
        ), 0.99)
      end,
      confidence_level = case
        when public.skill_proficiency.evidence_version is distinct from '2026-07-29-v5'
          then excluded.confidence_level
        else least(coalesce(public.skill_proficiency.confidence_level, 0) + 0.08, 1)
      end,
      practice_count = case
        when public.skill_proficiency.evidence_version is distinct from '2026-07-29-v5'
          then 1
        else coalesce(public.skill_proficiency.practice_count, 0) + 1
      end,
      correct_count = case
        when public.skill_proficiency.evidence_version is distinct from '2026-07-29-v5'
          then excluded.correct_count
        else coalesce(public.skill_proficiency.correct_count, 0) + excluded.correct_count
      end,
      last_practiced_at = now(),
      next_review_at = excluded.next_review_at,
      evidence_version = '2026-07-29-v5',
      updated_at = now();
  end loop;
  return new;
end;
$function$;

drop trigger if exists trigger_update_current_evaluation_skill_evidence
  on public.test_sessions;
create trigger trigger_update_current_evaluation_skill_evidence
after insert or update of evaluation_status, evaluation_version, evaluated_at
on public.test_sessions
for each row execute function public.update_current_evaluation_skill_evidence();

create or replace function public.sync_grammar_activity_outcome_v5()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.completion_state = 'completed'
    and old.completion_state is distinct from 'completed'
    and new.learning_path_activity_id is not null
  then
    update public.learning_path_activities activity
    set
      outcome_accuracy = round(
        new.correct_count::numeric / greatest(1, new.total_questions) * 100,
        1
      ),
      completion_source = case when new.mode = 'transfer' then 'transfer' else 'grammar_attempt' end,
      updated_at = now()
    where activity.id = new.learning_path_activity_id
      and activity.user_id = new.user_id;
  end if;
  return new;
end;
$function$;

drop trigger if exists trigger_sync_grammar_activity_outcome_v5
  on public.grammar_attempts;
create trigger trigger_sync_grammar_activity_outcome_v5
after update of completion_state on public.grammar_attempts
for each row execute function public.sync_grammar_activity_outcome_v5();

-- Learning activities can continue to aggregate deterministic Reading,
-- Listening and Vocabulary practice. Writing/Speaking criteria come only from
-- the v5 evaluation trigger, while Grammar attempts update their own evidence.
drop trigger if exists trigger_update_skill_proficiency_from_activity
  on public.learning_path_activities;
create trigger trigger_update_skill_proficiency_from_activity
after update on public.learning_path_activities
for each row
when (
  lower(coalesce(new.module, '')) not in ('writing', 'speaking', 'grammar')
)
execute function public.update_skill_proficiency_from_activity();

-- Keep the profile-level estimate aligned with Band Progress: it is only
-- available when all four modules have evidence, uses the latest score from
-- each module, and applies IELTS half-band rounding. Writing/Speaking response
-- submission does not count until its v5 evaluation completes.
create or replace function public.update_user_profile_after_test()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_estimated_band double precision;
  v_total_minutes integer;
  v_strengths text[] := array[]::text[];
  v_weaknesses text[] := array[]::text[];
  v_module record;
  v_streak integer;
  v_longest_streak integer;
  v_last_study date;
  v_today date := current_date;
  v_is_new_completion boolean;
  v_is_new_current_evaluation boolean;
begin
  v_is_new_completion :=
    new.is_completed is true
    and (tg_op = 'INSERT' or coalesce(old.is_completed, false) is false);
  v_is_new_current_evaluation :=
    tg_op = 'UPDATE'
    and lower(new.test_type) in ('writing', 'speaking')
    and new.evaluation_status = 'complete'
    and new.evaluation_version = '2026-07-29-v5'
    and (
      old.evaluation_status is distinct from new.evaluation_status
      or old.evaluation_version is distinct from new.evaluation_version
      or old.evaluated_at is distinct from new.evaluated_at
    );

  if not (v_is_new_completion or v_is_new_current_evaluation) then
    return new;
  end if;

  v_user_id := new.user_id;

  for v_module in
    with latest as (
      select distinct on (lower(test_type))
        lower(test_type) as module,
        coalesce(band_score, score)::double precision as module_score
      from public.test_sessions
      where user_id = v_user_id
        and is_completed is true
        and lower(test_type) in ('reading', 'listening', 'writing', 'speaking')
        and coalesce(band_score, score) is not null
        and (
          lower(test_type) in ('reading', 'listening')
          or evaluation_status = 'legacy'
          or (
            evaluation_status = 'complete'
            and evaluation_version = '2026-07-29-v5'
          )
        )
      order by lower(test_type), coalesce(evaluated_at, completed_at, created_at) desc, id desc
    )
    select module, module_score
    from latest
  loop
    if v_module.module_score >= 7 then
      v_strengths := array_append(v_strengths, v_module.module);
    elsif v_module.module_score < 6 then
      v_weaknesses := array_append(v_weaknesses, v_module.module);
    end if;
  end loop;

  with latest as (
    select distinct on (lower(test_type))
      lower(test_type) as module,
      coalesce(band_score, score)::double precision as module_score
    from public.test_sessions
    where user_id = v_user_id
      and is_completed is true
      and lower(test_type) in ('reading', 'listening', 'writing', 'speaking')
      and coalesce(band_score, score) is not null
      and (
        lower(test_type) in ('reading', 'listening')
        or evaluation_status = 'legacy'
        or (
          evaluation_status = 'complete'
          and evaluation_version = '2026-07-29-v5'
        )
      )
    order by lower(test_type), coalesce(evaluated_at, completed_at, created_at) desc, id desc
  )
  select case
    when count(*) = 4
      then round((avg(module_score) * 2)::numeric) / 2.0
    else null
  end
  into v_estimated_band
  from latest;

  select coalesce(sum(
    case
      when actual_duration_seconds between 1 and 14400
        then actual_duration_seconds / 60.0
      when (content_data #>> '{timeMetrics,totalTimeSpent}') ~ '^[0-9]+(\.[0-9]+)?$'
        and (content_data #>> '{timeMetrics,totalTimeSpent}')::numeric between 1 and 14400
        then (content_data #>> '{timeMetrics,totalTimeSpent}')::numeric / 60.0
      when lower(test_type) in ('reading', 'writing')
        and (content_data ->> 'time_remaining') ~ '^[0-9]+$'
        and (content_data ->> 'time_remaining')::integer between 0 and 3600
        then (3600 - (content_data ->> 'time_remaining')::integer) / 60.0
      when lower(test_type) = 'listening'
        and (content_data ->> 'time_remaining') ~ '^[0-9]+$'
        and (content_data ->> 'time_remaining')::integer between 0 and 2400
        then (2400 - (content_data ->> 'time_remaining')::integer) / 60.0
      when completed_at is not null and started_at is not null
        and completed_at >= started_at
        then least(extract(epoch from (completed_at - started_at)) / 60.0, 240)
      when completed_at is not null and created_at is not null
        and completed_at >= created_at
        then least(extract(epoch from (completed_at - created_at)) / 60.0, 240)
      else 0
    end
  ), 0)::integer
  into v_total_minutes
  from public.test_sessions
  where user_id = v_user_id
    and is_completed is true;

  select current_streak, longest_streak, last_study_date
  into v_streak, v_longest_streak, v_last_study
  from public.users
  where id = v_user_id;

  v_streak := coalesce(v_streak, 0);
  v_longest_streak := coalesce(v_longest_streak, 0);
  if v_last_study is null or v_last_study < v_today - 1 then
    v_streak := 1;
  elsif v_last_study = v_today - 1 then
    v_streak := v_streak + 1;
  end if;
  v_longest_streak := greatest(v_longest_streak, v_streak);

  update public.users
  set
    current_estimated_band = v_estimated_band,
    total_study_time = v_total_minutes,
    strengths = case when cardinality(v_strengths) > 0 then v_strengths else strengths end,
    weaknesses = case when cardinality(v_weaknesses) > 0 then v_weaknesses else weaknesses end,
    current_streak = v_streak,
    longest_streak = v_longest_streak,
    last_study_date = v_today,
    updated_at = now()
  where id = v_user_id;

  return new;
end;
$function$;

-- Align saved profile summaries immediately instead of waiting for the next
-- completed test. Missing modules intentionally produce a null Overall.
with accepted_sessions as (
  select
    session.user_id,
    lower(session.test_type) as module,
    coalesce(session.band_score, session.score)::double precision as module_score,
    row_number() over (
      partition by session.user_id, lower(session.test_type)
      order by coalesce(session.evaluated_at, session.completed_at, session.created_at) desc,
        session.id desc
    ) as module_rank
  from public.test_sessions session
  where session.is_completed is true
    and lower(session.test_type) in ('reading', 'listening', 'writing', 'speaking')
    and coalesce(session.band_score, session.score) is not null
    and (
      lower(session.test_type) in ('reading', 'listening')
      or session.evaluation_status = 'legacy'
      or (
        session.evaluation_status = 'complete'
        and session.evaluation_version = '2026-07-29-v5'
      )
    )
),
qualified_overall as (
  select
    user_id,
    case
      when count(*) filter (where module_rank = 1) = 4
        then round((avg(module_score) filter (where module_rank = 1) * 2)::numeric) / 2.0
      else null
    end as overall_band
  from accepted_sessions
  group by user_id
),
study_time as (
  select
    user_id,
    coalesce(sum(
      case
        when actual_duration_seconds between 1 and 14400
          then actual_duration_seconds / 60.0
        when (content_data #>> '{timeMetrics,totalTimeSpent}') ~ '^[0-9]+(\.[0-9]+)?$'
          and (content_data #>> '{timeMetrics,totalTimeSpent}')::numeric between 1 and 14400
          then (content_data #>> '{timeMetrics,totalTimeSpent}')::numeric / 60.0
        when lower(test_type) in ('reading', 'writing')
          and (content_data ->> 'time_remaining') ~ '^[0-9]+$'
          and (content_data ->> 'time_remaining')::integer between 0 and 3600
          then (3600 - (content_data ->> 'time_remaining')::integer) / 60.0
        when lower(test_type) = 'listening'
          and (content_data ->> 'time_remaining') ~ '^[0-9]+$'
          and (content_data ->> 'time_remaining')::integer between 0 and 2400
          then (2400 - (content_data ->> 'time_remaining')::integer) / 60.0
        when completed_at is not null and started_at is not null
          and completed_at >= started_at
          then least(extract(epoch from (completed_at - started_at)) / 60.0, 240)
        when completed_at is not null and created_at is not null
          and completed_at >= created_at
          then least(extract(epoch from (completed_at - created_at)) / 60.0, 240)
        else 0
      end
    ), 0)::integer as total_minutes
  from public.test_sessions
  where is_completed is true
  group by user_id
)
update public.users learner
set
  current_estimated_band = qualified.overall_band,
  total_study_time = coalesce(study.total_minutes, 0),
  updated_at = now()
from qualified_overall qualified
full join study_time study on study.user_id = qualified.user_id
where learner.id = coalesce(qualified.user_id, study.user_id);

revoke all on function public.auto_complete_learning_activity() from public, anon, authenticated;
revoke all on function public.update_skill_proficiency_from_test() from public, anon, authenticated;
revoke all on function public.update_current_evaluation_skill_evidence() from public, anon, authenticated;
revoke all on function public.sync_grammar_activity_outcome_v5() from public, anon, authenticated;
revoke all on function public.update_user_profile_after_test() from public, anon, authenticated;

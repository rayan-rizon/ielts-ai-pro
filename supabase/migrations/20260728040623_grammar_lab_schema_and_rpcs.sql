-- Dedicated IELTS Grammar Lab
-- Schema, row-level security, deterministic attempt APIs, and evidence updates.

create table if not exists public.grammar_skills (
  skill_code text primary key,
  learner_label text not null,
  description text not null,
  display_order smallint not null,
  is_published boolean not null default false,
  content_version integer not null default 1 check (content_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grammar_skills_code_check
    check (skill_code = any (array[
      'grammar_sentence_boundaries',
      'grammar_verb_forms',
      'grammar_agreement_number',
      'grammar_articles_determiners',
      'grammar_clause_control',
      'grammar_word_forms'
    ])),
  constraint grammar_skills_display_order_check check (display_order between 1 and 6)
);

create table if not exists public.grammar_items (
  id uuid primary key default gen_random_uuid(),
  skill_code text not null references public.grammar_skills(skill_code) on update cascade,
  difficulty smallint not null check (difficulty between 5 and 7),
  question_format text not null check (
    question_format = any (array[
      'form_selection',
      'error_correction',
      'sentence_completion',
      'meaning_preserving_transformation'
    ])
  ),
  prompt text not null,
  options jsonb,
  answer_data jsonb not null,
  explanation text not null,
  academic_context jsonb not null default '{}'::jsonb,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'retired')),
  content_version integer not null default 1 check (content_version > 0),
  content_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grammar_items_content_key_version_key unique (content_key, content_version),
  constraint grammar_items_prompt_check check (char_length(trim(prompt)) >= 12),
  constraint grammar_items_explanation_check check (char_length(trim(explanation)) >= 20),
  constraint grammar_items_answer_shape_check check (
    jsonb_typeof(answer_data -> 'accepted') = 'array'
    and jsonb_array_length(answer_data -> 'accepted') > 0
    and nullif(trim(answer_data ->> 'display'), '') is not null
  ),
  constraint grammar_items_options_shape_check check (
    (
      question_format in ('form_selection', 'meaning_preserving_transformation')
      and jsonb_typeof(options) = 'array'
      and jsonb_array_length(options) >= 2
    )
    or (
      question_format in ('error_correction', 'sentence_completion')
      and options is null
    )
  )
);

create table if not exists public.grammar_resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  skill_code text not null references public.grammar_skills(skill_code) on update cascade,
  title text not null,
  summary text not null,
  content_markdown text not null,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'retired')),
  content_version integer not null default 1 check (content_version > 0),
  estimated_minutes smallint not null default 6 check (estimated_minutes between 1 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grammar_resources_slug_version_key unique (slug, content_version),
  constraint grammar_resources_content_check check (char_length(trim(content_markdown)) >= 200)
);

create table if not exists public.grammar_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  mode text not null check (mode in ('diagnostic', 'practice', 'review', 'transfer')),
  target_skills text[] not null default '{}'::text[],
  item_ids uuid[] not null default '{}'::uuid[],
  learning_path_activity_id uuid references public.learning_path_activities(id) on delete set null,
  completion_state text not null default 'in_progress'
    check (completion_state in ('in_progress', 'completed', 'abandoned')),
  total_questions integer not null default 0 check (total_questions between 0 and 24),
  correct_count integer check (correct_count is null or correct_count between 0 and total_questions),
  study_timezone text not null default 'UTC',
  content_version integer not null default 1 check (content_version > 0),
  transfer_evaluation jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grammar_attempts_transfer_shape_check check (
    (mode = 'transfer' and total_questions = 0)
    or (mode <> 'transfer' and total_questions > 0)
  )
);

create table if not exists public.grammar_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.grammar_attempts(id) on delete cascade,
  item_id uuid not null references public.grammar_items(id) on delete restrict,
  submitted_answer jsonb not null,
  is_correct boolean not null,
  grading_evidence jsonb not null,
  created_at timestamptz not null default now(),
  constraint grammar_responses_attempt_item_key unique (attempt_id, item_id)
);

create index if not exists grammar_items_selection_idx
  on public.grammar_items (publication_status, skill_code, difficulty, question_format, content_version);
create index if not exists grammar_resources_skill_idx
  on public.grammar_resources (publication_status, skill_code, content_version);
create index if not exists grammar_attempts_user_started_idx
  on public.grammar_attempts (user_id, started_at desc);
create index if not exists grammar_attempts_user_completed_idx
  on public.grammar_attempts (user_id, completed_at desc)
  where completion_state = 'completed';
create index if not exists grammar_responses_attempt_idx
  on public.grammar_responses (attempt_id, created_at);
create index if not exists grammar_responses_item_idx
  on public.grammar_responses (item_id, created_at desc);

alter table public.grammar_skills enable row level security;
alter table public.grammar_items enable row level security;
alter table public.grammar_resources enable row level security;
alter table public.grammar_attempts enable row level security;
alter table public.grammar_responses enable row level security;

drop policy if exists "Authenticated learners can read published grammar skills"
  on public.grammar_skills;
create policy "Authenticated learners can read published grammar skills"
  on public.grammar_skills
  for select
  to authenticated
  using (is_published);

drop policy if exists "Authenticated learners can read published grammar resources"
  on public.grammar_resources;
create policy "Authenticated learners can read published grammar resources"
  on public.grammar_resources
  for select
  to authenticated
  using (publication_status = 'published');

drop policy if exists "Learners can read their own grammar attempts"
  on public.grammar_attempts;
create policy "Learners can read their own grammar attempts"
  on public.grammar_attempts
  for select
  to authenticated
  using (
    user_id in (
      select u.id
      from public.users u
      where u.id = (select auth.uid()) or u.auth_id = (select auth.uid())
    )
  );

revoke all on table public.grammar_items from anon, authenticated;
revoke all on table public.grammar_responses from anon, authenticated;
revoke insert, update, delete on table public.grammar_skills from anon, authenticated;
revoke insert, update, delete on table public.grammar_resources from anon, authenticated;
revoke insert, update, delete on table public.grammar_attempts from anon, authenticated;
revoke insert, update, delete on table public.grammar_responses from anon, authenticated;
grant select on table public.grammar_skills to authenticated;
grant select on table public.grammar_resources to authenticated;
grant select on table public.grammar_attempts to authenticated;

create or replace function public.grammar_normalize_answer(p_answer jsonb)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select trim(
    regexp_replace(
      regexp_replace(
        lower(coalesce(p_answer #>> '{}', '')),
        '[[:space:]]+',
        ' ',
        'g'
      ),
      '[[:space:][:punct:]]+$',
      '',
      'g'
    )
  );
$$;

revoke all on function public.grammar_normalize_answer(jsonb) from public, anon, authenticated;

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
        select jsonb_agg(value)
        from jsonb_each(coalesce(v_latest_path -> 'weekly_schedule', '{}'::jsonb)) days,
        lateral jsonb_array_elements(days.value) value
        where value ->> 'module' = 'grammar'
      ), '[]'::jsonb)
    )
  );
end;
$$;

create or replace function public.start_grammar_attempt(
  p_mode text,
  p_target_skills text[] default null,
  p_question_count integer default null,
  p_learning_path_activity_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_id uuid := auth.uid();
  v_user public.users%rowtype;
  v_attempt_id uuid := gen_random_uuid();
  v_mode text := lower(trim(coalesce(p_mode, 'practice')));
  v_target_skills text[];
  v_timezone text := 'UTC';
  v_local_day date;
  v_is_paid boolean := false;
  v_question_count integer;
  v_daily_used integer := 0;
  v_item_ids uuid[];
  v_additional_item_ids uuid[];
  v_last_diagnostic timestamptz;
begin
  if v_auth_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if v_mode not in ('diagnostic', 'practice', 'review', 'transfer') then
    raise exception 'Unsupported Grammar Lab mode';
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

  v_is_paid :=
    lower(coalesce(v_user.subscription_tier, 'free')) in ('pro', 'premium', 'admin')
    or lower(coalesce(v_user.role, '')) = 'admin';
  v_timezone := coalesce(nullif(v_user.study_availability ->> 'timezone', ''), 'UTC');
  if not exists (select 1 from pg_timezone_names where name = v_timezone) then
    v_timezone := 'UTC';
  end if;
  v_local_day := (now() at time zone v_timezone)::date;

  select coalesce(array_agg(s.skill_code order by s.display_order), '{}'::text[])
  into v_target_skills
  from public.grammar_skills s
  where s.is_published
    and (p_target_skills is null or cardinality(p_target_skills) = 0 or s.skill_code = any(p_target_skills));
  if cardinality(v_target_skills) = 0 then
    raise exception 'Choose at least one published Grammar Lab skill';
  end if;

  if p_learning_path_activity_id is not null and not exists (
    select 1
    from public.learning_path_activities lpa
    where lpa.id = p_learning_path_activity_id
      and lpa.user_id = v_user.id
      and lower(coalesce(lpa.module, '')) = 'grammar'
  ) then
    raise exception 'Linked Learning Path activity was not found' using errcode = 'P0002';
  end if;

  if v_mode = 'transfer' then
    if not v_is_paid then
      raise exception 'Grammar transfer evaluation requires Pro or Premium'
        using errcode = 'P0001',
          hint = 'upgrade_required';
    end if;
    insert into public.grammar_attempts (
      id, user_id, mode, target_skills, item_ids, learning_path_activity_id,
      total_questions, study_timezone, content_version
    )
    values (
      v_attempt_id, v_user.id, v_mode, v_target_skills, '{}'::uuid[],
      p_learning_path_activity_id, 0, v_timezone, 1
    );
    return jsonb_build_object(
      'attempt', jsonb_build_object(
        'id', v_attempt_id,
        'mode', v_mode,
        'targetSkills', v_target_skills,
        'totalQuestions', 0
      ),
      'items', '[]'::jsonb,
      'transferPrompt', case
        when exists (select 1 from unnest(v_target_skills) s where s like '%sentence%' or s like '%clause%')
          then 'Write a 120–160 word Academic Writing Task 2 paragraph that presents one clear position and deliberately varies sentence and clause structures.'
        else 'Write a 120–160 word Academic Writing Task 2 paragraph using the selected grammar accurately in a clear academic argument.'
      end
    );
  end if;

  if v_mode = 'diagnostic' then
    select max(coalesce(a.completed_at, a.started_at))
    into v_last_diagnostic
    from public.grammar_attempts a
    where a.user_id = v_user.id
      and a.mode = 'diagnostic'
      and a.completion_state in ('in_progress', 'completed');
    if not v_is_paid and v_last_diagnostic > now() - interval '30 days' then
      raise exception 'The free Grammar diagnostic is available once every 30 days';
    end if;
    v_question_count := 24;
    select array_agg(id order by skill_order, item_order)
    into v_item_ids
    from (
      select
        i.id,
        s.display_order as skill_order,
        row_number() over (
          partition by i.skill_code
          order by md5(v_user.id::text || i.id::text || date_trunc('month', now())::text)
        ) as item_order
      from public.grammar_items i
      join public.grammar_skills s on s.skill_code = i.skill_code
      where i.publication_status = 'published'
        and s.is_published
    ) ranked
    where item_order <= 4;
  else
    v_question_count := greatest(1, least(case when v_is_paid then 10 else 5 end, coalesce(p_question_count, 5)));
    if not v_is_paid then
      select coalesce(sum(a.total_questions), 0)::integer
      into v_daily_used
      from public.grammar_attempts a
      where a.user_id = v_user.id
        and a.mode in ('practice', 'review')
        and (a.started_at at time zone v_timezone)::date = v_local_day
        and a.completion_state in ('in_progress', 'completed');
      if v_daily_used >= 5 then
        raise exception 'Today''s five free Grammar Lab questions are already used';
      end if;
      v_question_count := least(v_question_count, 5 - v_daily_used);
    end if;

    if v_mode = 'review' then
      select array_agg(id order by sort_key)
      into v_item_ids
      from (
        select distinct on (i.id)
          i.id,
          md5(v_user.id::text || v_local_day::text || i.id::text || v_attempt_id::text) as sort_key
        from public.grammar_items i
        join public.grammar_responses r on r.item_id = i.id and not r.is_correct
        join public.grammar_attempts a on a.id = r.attempt_id and a.user_id = v_user.id
        where i.publication_status = 'published'
          and i.skill_code = any(v_target_skills)
        order by i.id, r.created_at desc
        limit v_question_count
      ) review_items;
    end if;

    if coalesce(cardinality(v_item_ids), 0) < v_question_count then
      select array_agg(id order by sort_key)
      into v_additional_item_ids
      from (
        select
          i.id,
          md5(
            v_user.id::text || v_local_day::text || i.id::text ||
            case when v_is_paid then v_attempt_id::text else '' end
          ) as sort_key
        from public.grammar_items i
        where i.publication_status = 'published'
          and i.skill_code = any(v_target_skills)
          and not (i.id = any(coalesce(v_item_ids, '{}'::uuid[])))
        order by sort_key
        limit v_question_count - coalesce(cardinality(v_item_ids), 0)
      ) practice_items;
      v_item_ids :=
        coalesce(v_item_ids, '{}'::uuid[]) ||
        coalesce(v_additional_item_ids, '{}'::uuid[]);
    end if;
  end if;

  if cardinality(v_item_ids) <> v_question_count then
    raise exception 'Grammar Lab content is incomplete for this attempt';
  end if;

  insert into public.grammar_attempts (
    id, user_id, mode, target_skills, item_ids, learning_path_activity_id,
    total_questions, study_timezone, content_version
  )
  values (
    v_attempt_id, v_user.id, v_mode, v_target_skills, v_item_ids,
    p_learning_path_activity_id, v_question_count, v_timezone, 1
  );

  return jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', v_attempt_id,
      'mode', v_mode,
      'targetSkills', v_target_skills,
      'totalQuestions', v_question_count,
      'startedAt', now()
    ),
    'items', (
      select jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'skillCode', i.skill_code,
          'difficulty', i.difficulty,
          'questionFormat', i.question_format,
          'prompt', i.prompt,
          'options', case
            when i.options is null then null
            else (
              select jsonb_agg(option_value order by md5(v_attempt_id::text || option_value::text))
              from jsonb_array_elements(i.options) as option_rows(option_value)
            )
          end,
          'academicContext', i.academic_context,
          'position', array_position(v_item_ids, i.id)
        )
        order by array_position(v_item_ids, i.id)
      )
      from public.grammar_items i
      where i.id = any(v_item_ids)
    ),
    'allowance', jsonb_build_object(
      'isPaid', v_is_paid,
      'dailyLimit', case when v_is_paid then null else 5 end,
      'dailyRemaining', case
        when v_is_paid then null
        else greatest(0, 5 - v_daily_used - case when v_mode in ('practice', 'review') then v_question_count else 0 end)
      end
    )
  );
end;
$$;

create or replace function public.get_grammar_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_id uuid := auth.uid();
  v_attempt public.grammar_attempts%rowtype;
begin
  if v_auth_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select a.*
  into v_attempt
  from public.grammar_attempts a
  join public.users u on u.id = a.user_id
  where a.id = p_attempt_id
    and (u.id = v_auth_id or u.auth_id = v_auth_id);
  if v_attempt.id is null then
    raise exception 'Grammar attempt not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', v_attempt.id,
      'mode', v_attempt.mode,
      'targetSkills', v_attempt.target_skills,
      'totalQuestions', v_attempt.total_questions,
      'completionState', v_attempt.completion_state,
      'correctCount', v_attempt.correct_count,
      'startedAt', v_attempt.started_at,
      'completedAt', v_attempt.completed_at
    ),
    'items', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'skillCode', i.skill_code,
          'difficulty', i.difficulty,
          'questionFormat', i.question_format,
          'prompt', i.prompt,
          'options', case
            when i.options is null then null
            else (
              select jsonb_agg(option_value order by md5(v_attempt.id::text || option_value::text))
              from jsonb_array_elements(i.options) as option_rows(option_value)
            )
          end,
          'academicContext', i.academic_context,
          'position', array_position(v_attempt.item_ids, i.id),
          'response', case when r.id is null then null else jsonb_build_object(
            'submittedAnswer', r.submitted_answer,
            'isCorrect', case
              when v_attempt.mode = 'diagnostic' and v_attempt.completion_state <> 'completed' then null
              else r.is_correct
            end
          ) end,
          'feedback', case
            when r.id is null or (v_attempt.mode = 'diagnostic' and v_attempt.completion_state <> 'completed') then null
            else jsonb_build_object(
              'isCorrect', r.is_correct,
              'correctAnswer', i.answer_data ->> 'display',
              'explanation', i.explanation
            )
          end
        )
        order by array_position(v_attempt.item_ids, i.id)
      ), '[]'::jsonb)
      from public.grammar_items i
      left join public.grammar_responses r
        on r.attempt_id = v_attempt.id and r.item_id = i.id
      where i.id = any(v_attempt.item_ids)
    )
  );
end;
$$;

create or replace function public.submit_grammar_response(
  p_attempt_id uuid,
  p_item_id uuid,
  p_answer jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_id uuid := auth.uid();
  v_attempt public.grammar_attempts%rowtype;
  v_item public.grammar_items%rowtype;
  v_normalized text;
  v_is_correct boolean;
  v_response public.grammar_responses%rowtype;
begin
  if v_auth_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_answer is null or jsonb_typeof(p_answer) not in ('string', 'number', 'boolean') then
    raise exception 'Submit one text or option answer';
  end if;

  select a.*
  into v_attempt
  from public.grammar_attempts a
  join public.users u on u.id = a.user_id
  where a.id = p_attempt_id
    and (u.id = v_auth_id or u.auth_id = v_auth_id)
  for update of a;
  if v_attempt.id is null then
    raise exception 'Grammar attempt not found' using errcode = 'P0002';
  end if;
  if v_attempt.completion_state <> 'in_progress' or v_attempt.mode = 'transfer' then
    raise exception 'This Grammar attempt is not accepting answers';
  end if;
  if not (p_item_id = any(v_attempt.item_ids)) then
    raise exception 'Question is not part of this Grammar attempt';
  end if;

  select *
  into v_item
  from public.grammar_items
  where id = p_item_id;

  select *
  into v_response
  from public.grammar_responses
  where attempt_id = p_attempt_id and item_id = p_item_id;
  if v_response.id is not null then
    return jsonb_build_object(
      'accepted', true,
      'alreadySubmitted', true,
      'isCorrect', case when v_attempt.mode = 'diagnostic' then null else v_response.is_correct end,
      'feedback', case when v_attempt.mode = 'diagnostic' then null else jsonb_build_object(
        'correctAnswer', v_item.answer_data ->> 'display',
        'explanation', v_item.explanation
      ) end
    );
  end if;

  v_normalized := public.grammar_normalize_answer(p_answer);
  if v_normalized = '' or char_length(v_normalized) > 600 then
    raise exception 'Answer must be between 1 and 600 characters';
  end if;

  select exists (
    select 1
    from jsonb_array_elements_text(v_item.answer_data -> 'accepted') accepted(value)
    where public.grammar_normalize_answer(to_jsonb(accepted.value)) = v_normalized
  )
  into v_is_correct;

  insert into public.grammar_responses (
    attempt_id,
    item_id,
    submitted_answer,
    is_correct,
    grading_evidence
  )
  values (
    p_attempt_id,
    p_item_id,
    p_answer,
    v_is_correct,
    jsonb_build_object(
      'gradingMethod', 'normalized_exact_match',
      'questionFormat', v_item.question_format,
      'contentVersion', v_item.content_version,
      'normalizedSubmission', v_normalized,
      'gradedAt', now()
    )
  )
  returning * into v_response;

  return jsonb_build_object(
    'accepted', true,
    'alreadySubmitted', false,
    'isCorrect', case when v_attempt.mode = 'diagnostic' then null else v_is_correct end,
    'feedback', case when v_attempt.mode = 'diagnostic' then null else jsonb_build_object(
      'correctAnswer', v_item.answer_data ->> 'display',
      'explanation', v_item.explanation
    ) end
  );
end;
$$;

create or replace function public.complete_grammar_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_id uuid := auth.uid();
  v_attempt public.grammar_attempts%rowtype;
  v_answered integer;
  v_correct integer;
  v_activity_updated boolean := false;
  v_fingerprint_seed text;
  v_skill record;
begin
  if v_auth_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select a.*
  into v_attempt
  from public.grammar_attempts a
  join public.users u on u.id = a.user_id
  where a.id = p_attempt_id
    and (u.id = v_auth_id or u.auth_id = v_auth_id)
  for update of a;
  if v_attempt.id is null then
    raise exception 'Grammar attempt not found' using errcode = 'P0002';
  end if;
  if v_attempt.mode = 'transfer' then
    raise exception 'Transfer attempts are completed by the Grammar transfer evaluator';
  end if;

  select count(*), count(*) filter (where is_correct)
  into v_answered, v_correct
  from public.grammar_responses
  where attempt_id = p_attempt_id;

  if v_attempt.completion_state = 'completed' then
    return jsonb_build_object(
      'attemptId', v_attempt.id,
      'alreadyCompleted', true,
      'correctCount', v_attempt.correct_count,
      'totalQuestions', v_attempt.total_questions,
      'accuracy', case when v_attempt.total_questions > 0
        then round((v_attempt.correct_count::numeric / v_attempt.total_questions) * 100, 1)
        else null
      end,
      'results', (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'itemId', r.item_id,
            'skillCode', i.skill_code,
            'submittedAnswer', r.submitted_answer,
            'isCorrect', r.is_correct,
            'correctAnswer', i.answer_data ->> 'display',
            'explanation', i.explanation
          )
          order by array_position(v_attempt.item_ids, r.item_id)
        ), '[]'::jsonb)
        from public.grammar_responses r
        join public.grammar_items i on i.id = r.item_id
        where r.attempt_id = v_attempt.id
      )
    );
  end if;

  if v_answered <> v_attempt.total_questions then
    raise exception 'Answer every question before completing this Grammar attempt';
  end if;

  update public.grammar_attempts
  set
    completion_state = 'completed',
    correct_count = v_correct,
    completed_at = now(),
    updated_at = now()
  where id = v_attempt.id;

  for v_skill in
    select
      i.skill_code,
      count(*)::integer as observations,
      count(*) filter (where r.is_correct)::integer as correct
    from public.grammar_responses r
    join public.grammar_items i on i.id = r.item_id
    where r.attempt_id = v_attempt.id
    group by i.skill_code
  loop
    insert into public.skill_proficiency (
      user_id,
      skill_code,
      module,
      mastery_probability,
      confidence_level,
      practice_count,
      correct_count,
      last_practiced_at,
      next_review_at,
      streak_count,
      updated_at
    )
    values (
      v_attempt.user_id,
      v_skill.skill_code,
      'grammar',
      v_skill.correct::double precision / greatest(1, v_skill.observations),
      least(1.0, v_skill.observations::double precision / 20.0),
      v_skill.observations,
      v_skill.correct,
      now(),
      now() + case
        when v_skill.correct::double precision / greatest(1, v_skill.observations) < 0.6 then interval '1 day'
        when v_skill.correct::double precision / greatest(1, v_skill.observations) < 0.8 then interval '3 days'
        else interval '7 days'
      end,
      case when v_skill.correct = v_skill.observations then 1 else 0 end,
      now()
    )
    on conflict (user_id, skill_code)
    do update set
      module = 'grammar',
      practice_count = coalesce(public.skill_proficiency.practice_count, 0) + excluded.practice_count,
      correct_count = coalesce(public.skill_proficiency.correct_count, 0) + excluded.correct_count,
      mastery_probability =
        (coalesce(public.skill_proficiency.correct_count, 0) + excluded.correct_count)::double precision
        / greatest(1, coalesce(public.skill_proficiency.practice_count, 0) + excluded.practice_count),
      confidence_level = least(
        1.0,
        (coalesce(public.skill_proficiency.practice_count, 0) + excluded.practice_count)::double precision / 20.0
      ),
      last_practiced_at = now(),
      next_review_at = excluded.next_review_at,
      streak_count = case
        when excluded.correct_count = excluded.practice_count
          then coalesce(public.skill_proficiency.streak_count, 0) + 1
        else 0
      end,
      updated_at = now();
  end loop;

  if v_attempt.learning_path_activity_id is not null then
    update public.learning_path_activities
    set
      is_completed = true,
      completed_at = now(),
      outcome_score = round((v_correct::numeric / greatest(1, v_attempt.total_questions)) * 100, 1),
      outcome_data = coalesce(outcome_data, '{}'::jsonb) || jsonb_build_object(
        'source', 'grammar_lab',
        'attemptId', v_attempt.id,
        'mode', v_attempt.mode,
        'correctCount', v_correct,
        'totalQuestions', v_attempt.total_questions
      ),
      updated_at = now()
    where id = v_attempt.learning_path_activity_id
      and user_id = v_attempt.user_id
      and not coalesce(is_completed, false);
    v_activity_updated := found;
  end if;

  v_fingerprint_seed := md5(
    v_attempt.user_id::text || ':' || v_attempt.id::text || ':' ||
    v_correct::text || ':' || v_attempt.total_questions::text
  );

  return jsonb_build_object(
    'attemptId', v_attempt.id,
    'alreadyCompleted', false,
    'correctCount', v_correct,
    'totalQuestions', v_attempt.total_questions,
    'accuracy', round((v_correct::numeric / greatest(1, v_attempt.total_questions)) * 100, 1),
    'learningPathActivityUpdated', v_activity_updated,
    'evidenceChangeKey', v_fingerprint_seed,
    'results', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'itemId', r.item_id,
          'skillCode', i.skill_code,
          'submittedAnswer', r.submitted_answer,
          'isCorrect', r.is_correct,
          'correctAnswer', i.answer_data ->> 'display',
          'explanation', i.explanation
        )
        order by array_position(v_attempt.item_ids, r.item_id)
      ), '[]'::jsonb)
      from public.grammar_responses r
      join public.grammar_items i on i.id = r.item_id
      where r.attempt_id = v_attempt.id
    )
  );
end;
$$;

revoke all on function public.get_grammar_dashboard() from public, anon;
revoke all on function public.start_grammar_attempt(text, text[], integer, uuid) from public, anon;
revoke all on function public.get_grammar_attempt(uuid) from public, anon;
revoke all on function public.submit_grammar_response(uuid, uuid, jsonb) from public, anon;
revoke all on function public.complete_grammar_attempt(uuid) from public, anon;

grant execute on function public.get_grammar_dashboard() to authenticated;
grant execute on function public.start_grammar_attempt(text, text[], integer, uuid) to authenticated;
grant execute on function public.get_grammar_attempt(uuid) to authenticated;
grant execute on function public.submit_grammar_response(uuid, uuid, jsonb) to authenticated;
grant execute on function public.complete_grammar_attempt(uuid) to authenticated;

comment on table public.grammar_items is
  'Server-graded IELTS Grammar Lab items. answer_data is intentionally unavailable through client table grants.';
comment on table public.grammar_attempts is
  'Grammar practice domain attempts; these do not count as a fifth IELTS test module.';
comment on function public.start_grammar_attempt(text, text[], integer, uuid) is
  'Creates deterministic, entitlement-aware Grammar Lab attempts and returns sanitized items.';
comment on function public.complete_grammar_attempt(uuid) is
  'Idempotently completes a deterministic Grammar Lab attempt and updates granular grammar evidence once.';

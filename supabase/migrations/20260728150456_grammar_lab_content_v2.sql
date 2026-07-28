-- Grammar Lab content version 2
-- Learner-facing prompts are concise, completion answers are constrained,
-- diagnostic sampling is stratified, and guides become richer full-page lessons.

alter table public.grammar_items
  drop constraint if exists grammar_items_options_shape_check;

alter table public.grammar_items
  add constraint grammar_items_options_shape_check check (
    (
      question_format in ('form_selection', 'meaning_preserving_transformation')
      and jsonb_typeof(options) = 'array'
      and jsonb_array_length(options) >= 2
    )
    or (
      question_format = 'sentence_completion'
      and (
        options is null
        or (
          jsonb_typeof(options) = 'array'
          and jsonb_array_length(options) >= 2
        )
      )
    )
    or (
      question_format = 'error_correction'
      and options is null
    )
  );

insert into public.grammar_resources (
  slug,
  skill_code,
  title,
  summary,
  content_markdown,
  publication_status,
  content_version,
  estimated_minutes
)
values
  (
    'complete-and-controlled-ielts-sentences',
    'grammar_sentence_boundaries',
    'Build complete, controlled IELTS sentences',
    'Turn chart comparisons, arguments, and longer spoken answers into complete ideas that are easy to follow.',
    $guide$
## Why this matters in IELTS

Clear grammar begins with complete ideas. In Writing, a fragment or comma splice can make a good comparison hard to follow. In Speaking, the examiner listens for controlled clauses rather than judging written punctuation.

## The rule in 30 seconds

- A complete main clause needs a subject, a finite verb, and a complete thought.
- A clause beginning with **although**, **because**, or **which** usually needs a main clause beside it.
- Two complete clauses need a real join: a coordinator, a subordinator, a semicolon, or a full stop.

## See it in IELTS

### Writing Task 1

> Car use rose steadily, whereas bus use remained stable.

The connector **whereas** joins two complete chart comparisons and makes their relationship clear.

### Writing Task 2

> Although free university education could widen access, it may increase public spending.

The although-clause is not left alone; it leads into a complete position.

### Speaking

> The journey was tiring, but the view made it worthwhile.

Two short, controlled ideas are often clearer than one very long answer joined repeatedly with **and**.

## Common traps

- Fragment: **Because public transport is cheaper.**
- Comma splice: **Car use rose, bus use fell.**
- Unfinished ending: **It was useful because.**

## Check yourself

1. Repair this fragment: **Although the policy is expensive.**
2. Join these Task 1 ideas: **Online sales rose. Store sales fell.**
3. Read one Speaking answer aloud and pause after each complete idea.

## Suggested answers

- **Although the policy is expensive, it may produce long-term savings.**
- **Online sales rose, whereas store sales fell.**

## Final check

- Can you find the main verb in every clause?
- Does every dependent clause attach to a complete idea?
- Are two complete clauses joined clearly?
$guide$,
    'draft',
    2,
    7
  ),
  (
    'verb-forms-across-ielts-tasks',
    'grammar_verb_forms',
    'Control verb forms across IELTS tasks',
    'Choose tense, voice, and verb patterns from the time and meaning of the sentence.',
    $guide$
## Start with meaning, not the task name

The words around a verb usually tell you which form you need. Dates show whether a period is finished. **Since** often connects a past starting point to the present. Process diagrams often use the passive because the stage matters more than the person doing it.

## The rule in 30 seconds

- Finished period: use past simple.
- Change continuing to now: often use present perfect.
- Process stage: often use **be + past participle**.
- After a modal such as **should**, **may**, or **could**, use the base verb.

## See it in IELTS

### Writing Task 1

> The rate fell between 2000 and 2010.

Both dates are finished, so past simple is the natural choice.

> Online enrolment has increased since 2020.

The change began in the past and continues to the present.

### Process description

> The material is filtered before it is heated.

The passive keeps attention on the process stages.

### Speaking

> I had never travelled alone before I took that trip.

The past perfect marks the earlier experience; **took** marks the later event.

## Common traps

- **should investing** instead of **should invest**
- **has fallen between 2000 and 2010** for a finished period
- changing tense without changing the timeline

## Check yourself

1. The figure ___ from 40% to 55% between 2012 and 2016.
2. The paper ___ before it is packaged.
3. Governments should ___ in preventative healthcare.

## Suggested answers

- **rose**
- **is dried**
- **invest**

## Final check

- Circle the time marker.
- Check every modal verb.
- Ask whether the actor or the process should be the focus.
$guide$,
    'draft',
    2,
    7
  ),
  (
    'agreement-and-number-in-ielts',
    'grammar_agreement_number',
    'Keep agreement and number accurate',
    'Find the real subject, then control verbs, quantities, count nouns, and mass nouns.',
    $guide$
## Find the head noun

IELTS sentences often place a long phrase between the subject and verb. Ignore that extra information first and find the head noun. In **The number of commuters has increased**, the head noun is **number**, not **commuters**.

## The rule in 30 seconds

- **The number of + plural noun** takes a singular verb.
- **A number of + plural noun** takes a plural verb.
- **Research, evidence, information, traffic,** and **equipment** are normally uncountable.
- A proportion expression agrees with the noun after **of**: **60% of residents support**, but **60% of the land is**.

## See it in IELTS

### Writing Task 1

> The number of rail commuters has increased.

The singular head noun **number** controls the verb.

### Writing Task 2

> Recent research provides useful evidence for the policy.

**Research** and **evidence** are mass nouns here; they do not need plural endings.

### Speaking

> Most people in my neighbourhood use buses.

The subject is **people**, so the verb stays plural.

## Common traps

- **researches** and **evidences** in general academic use
- choosing the verb beside the nearest noun
- using **less** with plural count nouns when **fewer** is needed

## Check yourself

1. The number of cars on the road ___ fallen.
2. A number of residents ___ concerned.
3. Sixty per cent of the land ___ protected.

## Suggested answers

- **has**
- **are**
- **is**

## Final check

- Box the head noun.
- Mark each noun countable or uncountable.
- Recheck quantity expressions before submitting.
$guide$,
    'draft',
    2,
    7
  ),
  (
    'articles-and-determiners-for-ielts',
    'grammar_articles_determiners',
    'Choose articles precisely in IELTS',
    'Use meaning to choose a, an, the, zero article, and common quantity determiners.',
    $guide$
## Ask three questions

Article choice is about meaning. First ask whether the noun is a singular count noun. Then ask whether it is specific. Finally, ask whether the reader or listener already knows which one you mean.

## The rule in 30 seconds

- Use **a/an** for one non-specific singular count noun.
- Use **the** for a specific, defined, or previously mentioned noun.
- Use no article for plural or uncountable nouns used generally.
- Use quantity words that match countability: **fewer people**, **less traffic**, **little evidence**.

## See it in IELTS

### Writing Task 1

> The chart shows the proportion of households using solar power.

The chart identifies one specific proportion.

### Writing Task 2

> Education benefits society, but the education system also needs stable funding.

The first noun is a general idea. The second refers to a defined system.

### Speaking

> I visited a museum near my college. The museum had a large science gallery.

**A** introduces the place; **the** refers to the same place again.

## Common traps

- adding **the** before general ideas such as technology or society
- omitting an article before a singular count noun
- using **few** with uncountable evidence

## Check yourself

1. The chart compares ___ use of cars and bicycles in one city.
2. ___ public transport can reduce congestion.
3. There is ___ evidence that longer hours improve productivity.

## Suggested answers

- **the**
- **—** (no article)
- **little**

## Final check

- Is the noun singular and countable?
- Is it general or specifically identified?
- Have you already introduced it?
$guide$,
    'draft',
    2,
    7
  ),
  (
    'clause-control-for-complex-ideas',
    'grammar_clause_control',
    'Connect and qualify complex IELTS ideas',
    'Choose the relationship first, then connect comparisons, reasons, conditions, and concessions clearly.',
    $guide$
## Complexity needs a purpose

A longer sentence is useful only when its clauses show a clear relationship. Before choosing a connector, decide whether the second idea contrasts, explains, limits, defines, or depends on the first.

## The rule in 30 seconds

- Comparison: **whereas**, **while**
- Concession: **although**, **even though**
- Cause: **because**, **since**
- Condition: **if**, **provided that**, **only if**
- Definition: **who**, **which**, **that**

## See it in IELTS

### Writing Task 1

> Urban demand rose, whereas rural demand remained stable.

The two chart trends are directly compared.

### Writing Task 2

> Although the policy is costly, it may deliver long-term savings.

The concession acknowledges a problem before presenting the main position.

### Speaking Part 3

> If cities invested in reliable rail, commuters might drive less.

The conditional helps the speaker discuss a possible result without making an absolute claim.

## Common traps

- **because of + full clause**
- **although ... but**
- a relative pronoun with no clear noun to refer to

## Check yourself

1. Choose the relationship: **Both figures rose. Rail use increased much faster.**
2. Repair: **Although the scheme is expensive, but it may be worthwhile.**
3. Complete: **People ___ work remotely may save commuting time.**

## Suggested answers

- **Although both figures rose, rail use increased much faster.**
- Remove **but**.
- **who**

## Final check

- Can you name the relationship between the clauses?
- Does each dependent clause have a main clause?
- Is every relative pronoun attached to a clear noun?
$guide$,
    'draft',
    2,
    7
  ),
  (
    'word-forms-for-academic-accuracy',
    'grammar_word_forms',
    'Use the right word form in IELTS',
    'Use sentence position and meaning to choose the right noun, verb, adjective, or adverb.',
    $guide$
## Let the sentence give you clues

You may know the right word family but choose the wrong form. First identify what the sentence position needs. Then check whether the form creates a natural academic phrase.

## The rule in 30 seconds

- Before a noun: usually an adjective.
- After a change verb: often an adverb.
- As a subject or object: usually a noun.
- After a modal: use the base verb.

## See it in IELTS

### Writing Task 1

> There was a significant increase in online sales.

The adjective **significant** describes the noun **increase**.

> Online sales increased significantly.

The adverb **significantly** describes how sales increased.

### Writing Task 2

> The policy may benefit low-income households.

The modal **may** needs the base verb **benefit**.

### Speaking

> The location is convenient for students.

An adjective follows the linking verb **is** and describes the location.

## Common traps

- **increased significant**
- **economic** and **economical** used as if they mean the same thing
- heavy noun forms that make a spoken answer unnatural

## Check yourself

1. There was a ___ decline in car use. (gradual)
2. Car use declined ___. (gradual)
3. Greater ___ may improve participation. (accessible)

## Suggested answers

- **gradual**
- **gradually**
- **accessibility**

## Final check

- Label the position N, V, Adj, or Adv.
- Check the meaning, not only the suffix.
- Read the full sentence once for naturalness.
$guide$,
    'draft',
    2,
    7
  )
on conflict (slug, content_version) do update set
  skill_code = excluded.skill_code,
  title = excluded.title,
  summary = excluded.summary,
  content_markdown = excluded.content_markdown,
  estimated_minutes = excluded.estimated_minutes,
  publication_status = excluded.publication_status,
  updated_at = now();

insert into public.grammar_items (
  skill_code,
  difficulty,
  question_format,
  prompt,
  options,
  answer_data,
  explanation,
  academic_context,
  publication_status,
  content_version,
  content_key
)
select
  source.skill_code,
  source.difficulty,
  source.question_format,
  coalesce(
    (regexp_match(source.prompt, '“([^”]+)”[[:space:]]*$'))[1],
    source.prompt
  ),
  case
    when source.question_format = 'sentence_completion'
      then form_item.options
    else source.options
  end,
  source.answer_data,
  source.explanation,
  source.academic_context || jsonb_build_object(
    'variantGroup',
    regexp_replace(source.content_key, '_(form_selection|error_correction|sentence_completion|meaning_preserving_transformation)$', '')
  ),
  'draft',
  2,
  source.content_key
from public.grammar_items source
left join public.grammar_items form_item
  on form_item.content_key = regexp_replace(source.content_key, '_sentence_completion$', '_form_selection')
 and form_item.content_version = source.content_version
where source.content_version = 1
on conflict (content_key, content_version) do update set
  skill_code = excluded.skill_code,
  difficulty = excluded.difficulty,
  question_format = excluded.question_format,
  prompt = excluded.prompt,
  options = excluded.options,
  answer_data = excluded.answer_data,
  explanation = excluded.explanation,
  academic_context = excluded.academic_context,
  publication_status = excluded.publication_status,
  updated_at = now();

create or replace function public.grammar_normalize_answer(p_answer jsonb)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select trim(
    regexp_replace(
      regexp_replace(
        lower(
          replace(
            replace(
              replace(
                replace(coalesce(p_answer #>> '{}', ''), '’', ''''),
                '‘',
                ''''
              ),
              '–',
              '-'
            ),
            '—',
            '-'
          )
        ),
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
  v_content_version integer := 2;
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
    and (
      p_target_skills is null
      or cardinality(p_target_skills) = 0
      or s.skill_code = any(p_target_skills)
    );
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

  select coalesce(max(i.content_version), 2)
  into v_content_version
  from public.grammar_items i
  where i.publication_status = 'published';

  if v_mode = 'transfer' then
    if not v_is_paid then
      raise exception 'Grammar transfer evaluation requires Pro or Premium'
        using errcode = 'P0001',
          hint = 'upgrade_required';
    end if;
    insert into public.grammar_attempts (
      id,
      user_id,
      mode,
      target_skills,
      item_ids,
      learning_path_activity_id,
      total_questions,
      study_timezone,
      content_version
    )
    values (
      v_attempt_id,
      v_user.id,
      v_mode,
      v_target_skills,
      '{}'::uuid[],
      p_learning_path_activity_id,
      0,
      v_timezone,
      v_content_version
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
        when exists (
          select 1
          from unnest(v_target_skills) s
          where s like '%sentence%' or s like '%clause%'
        )
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
    with slots(question_format, difficulty, target_rank, slot_order) as (
      values
        ('form_selection'::text, 5::smallint, 1, 1),
        ('error_correction'::text, 6::smallint, 1, 2),
        ('sentence_completion'::text, 6::smallint, 2, 3),
        ('meaning_preserving_transformation'::text, 7::smallint, 1, 4)
    ),
    candidates as (
      select
        i.id,
        s.display_order as skill_order,
        slots.slot_order,
        slots.target_rank,
        row_number() over (
          partition by i.skill_code, i.difficulty, i.question_format
          order by md5(
            v_user.id::text
            || i.skill_code
            || i.difficulty::text
            || coalesce(i.academic_context ->> 'variantGroup', i.content_key)
            || date_trunc('month', now())::text
          )
        ) as candidate_rank
      from public.grammar_items i
      join public.grammar_skills s
        on s.skill_code = i.skill_code
       and s.is_published
      join slots
        on slots.question_format = i.question_format
       and slots.difficulty = i.difficulty
      where i.publication_status = 'published'
    )
    select array_agg(id order by skill_order, slot_order)
    into v_item_ids
    from candidates
    where candidate_rank = target_rank;
  else
    v_question_count := greatest(
      1,
      least(case when v_is_paid then 10 else 5 end, coalesce(p_question_count, 5))
    );
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
        select distinct on (current_item.id)
          current_item.id,
          md5(
            v_user.id::text
            || v_local_day::text
            || current_item.id::text
            || v_attempt_id::text
          ) as sort_key
        from public.grammar_responses r
        join public.grammar_attempts a
          on a.id = r.attempt_id
         and a.user_id = v_user.id
        join public.grammar_items prior_item
          on prior_item.id = r.item_id
        join public.grammar_items current_item
          on current_item.content_key = prior_item.content_key
         and current_item.publication_status = 'published'
        where not r.is_correct
          and current_item.skill_code = any(v_target_skills)
        order by current_item.id, r.created_at desc
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
            v_user.id::text
            || v_local_day::text
            || i.id::text
            || case when v_is_paid then v_attempt_id::text else '' end
          ) as sort_key
        from public.grammar_items i
        where i.publication_status = 'published'
          and i.skill_code = any(v_target_skills)
          and not (i.id = any(coalesce(v_item_ids, '{}'::uuid[])))
        order by sort_key
        limit v_question_count - coalesce(cardinality(v_item_ids), 0)
      ) practice_items;
      v_item_ids :=
        coalesce(v_item_ids, '{}'::uuid[])
        || coalesce(v_additional_item_ids, '{}'::uuid[]);
    end if;
  end if;

  if cardinality(v_item_ids) <> v_question_count then
    raise exception 'Grammar Lab content is incomplete for this attempt';
  end if;

  select coalesce(max(i.content_version), v_content_version)
  into v_content_version
  from public.grammar_items i
  where i.id = any(v_item_ids);

  insert into public.grammar_attempts (
    id,
    user_id,
    mode,
    target_skills,
    item_ids,
    learning_path_activity_id,
    total_questions,
    study_timezone,
    content_version
  )
  values (
    v_attempt_id,
    v_user.id,
    v_mode,
    v_target_skills,
    v_item_ids,
    p_learning_path_activity_id,
    v_question_count,
    v_timezone,
    v_content_version
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
              select jsonb_agg(
                option_value
                order by md5(v_attempt_id::text || option_value::text)
              )
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
        else greatest(
          0,
          5
          - v_daily_used
          - case when v_mode in ('practice', 'review') then v_question_count else 0 end
        )
      end
    )
  );
end;
$$;

revoke all on function public.start_grammar_attempt(text, text[], integer, uuid)
  from public, anon;
grant execute on function public.start_grammar_attempt(text, text[], integer, uuid)
  to authenticated;

do $$
declare
  v_item_count integer;
  v_resource_count integer;
  v_bad_skill_count integer;
  v_bad_format_count integer;
  v_unconstrained_completion_count integer;
  v_missing_answer_option_count integer;
  v_verbose_prompt_count integer;
  v_incomplete_guide_count integer;
begin
  select count(*)
  into v_item_count
  from public.grammar_items
  where content_version = 2;

  select count(*)
  into v_resource_count
  from public.grammar_resources
  where content_version = 2;

  select count(*)
  into v_bad_skill_count
  from (
    select skill_code
    from public.grammar_items
    where content_version = 2
    group by skill_code
    having count(*) <> 40
  ) invalid_skills;

  select count(*)
  into v_bad_format_count
  from (
    select question_format
    from public.grammar_items
    where content_version = 2
    group by question_format
    having count(*) <> 60
  ) invalid_formats;

  select count(*)
  into v_unconstrained_completion_count
  from public.grammar_items
  where content_version = 2
    and question_format = 'sentence_completion'
    and (options is null or jsonb_array_length(options) < 2);

  select count(*)
  into v_missing_answer_option_count
  from public.grammar_items
  where content_version = 2
    and options is not null
    and not (options @> (answer_data -> 'accepted'));

  select count(*)
  into v_verbose_prompt_count
  from public.grammar_items
  where content_version = 2
    and (
      prompt ilike '%In an Academic IELTS%'
      or prompt ilike '%Complete this Academic IELTS%'
      or prompt ilike '%Correct the grammatical error in this Academic IELTS%'
      or prompt ilike '%Choose the grammatically accurate revision of this Academic IELTS%'
    );

  select count(*)
  into v_incomplete_guide_count
  from public.grammar_resources
  where content_version = 2
    and (
      content_markdown not like '%## See it in IELTS%'
      or content_markdown not like '%## Check yourself%'
      or content_markdown not like '%## Final check%'
    );

  if
    v_item_count <> 240
    or v_resource_count <> 6
    or v_bad_skill_count <> 0
    or v_bad_format_count <> 0
    or v_unconstrained_completion_count <> 0
    or v_missing_answer_option_count <> 0
    or v_verbose_prompt_count <> 0
    or v_incomplete_guide_count <> 0
  then
    raise exception
      'Grammar Lab v2 validation failed: items %, resources %, skills %, formats %, open completions %, missing options %, verbose prompts %, incomplete guides %',
      v_item_count,
      v_resource_count,
      v_bad_skill_count,
      v_bad_format_count,
      v_unconstrained_completion_count,
      v_missing_answer_option_count,
      v_verbose_prompt_count,
      v_incomplete_guide_count;
  end if;
end
$$;

update public.grammar_items
set
  publication_status = case when content_version = 2 then 'published' else 'retired' end,
  updated_at = now()
where content_version in (1, 2);

update public.grammar_resources
set
  publication_status = case when content_version = 2 then 'published' else 'retired' end,
  updated_at = now()
where content_version in (1, 2);

comment on function public.start_grammar_attempt(text, text[], integer, uuid) is
  'Creates entitlement-aware Grammar Lab attempts from the current content version. Diagnostics use four formats, Bands 5–7, and distinct underlying concepts per skill.';

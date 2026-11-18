-- Follow-up to 20261119120000. Some imports repeat the same `mcq_title` on every
-- question (and others store ''), so "each heading starts a set" still produced
-- one-question sets. A set now runs until the heading CHANGES, a blank heading is
-- no heading, and listening instructions are keyed by their first line (the rest
-- is often the question text). Mirrors `groupQuestionsByBucket` in
-- supabase/functions/_shared/skill-lab/libraryPractice.js.

create or replace function public.practice_library_dashboard_groups_uncached(p_auth uuid)
returns jsonb
language sql
volatile
security definer
set search_path to ''
as $function$
  with learner as (
    select u.id, skill_lab_private.tier(u.id) as tier
    from public.users u
    where u.auth_id = p_auth
  ), eligible_passages as (
    select p.*
    from public.passages p
    cross join learner l
    where p.is_active
      and p.test_type in ('reading', 'listening')
      and (
        p.access_tier = 'free'
        or l.tier = 'premium'
        or (p.access_tier = 'pro' and l.tier = 'pro')
      )
  ), question_rows as (
    select
      q.*,
      p.title as passage_title,
      p.test_type,
      p.audio_url as passage_audio_url,
      p.content as passage_content,
      coalesce(q.section, q.part_number, 1) as section_number,
      case
        when q.type = 'matching_features'
          and q.matching_features ->> 'mode' = 'paragraph'
          then p.test_type || ':summary_completion'
        when p.test_type = 'reading' and q.type = 'matching_features'
          and concat_ws(' ', q.group_instructions, q.matching_features ->> 'box_title')
            ~* 'list of headings|correct heading|suitable heading'
          then 'reading:matching_headings'
        when p.test_type = 'reading' and q.type = 'matching_features'
          and concat_ws(' ', q.group_instructions, q.matching_features ->> 'box_title')
            ~* 'which (paragraph|section) contains|match.*information.*paragraph'
          then 'reading:matching_information'
        else p.test_type || ':' || q.type
      end as focus,
      case
        when q.type = 'matching_features'
          and q.matching_features ->> 'mode' = 'paragraph'
          then greatest(
            regexp_count(coalesce(q.matching_features ->> 'text', ''), '\[\d+\]'),
            1
          )
        when q.type = 'matching_features'
          and jsonb_typeof(q.matching_features -> 'questions') = 'array'
          then greatest(jsonb_array_length(q.matching_features -> 'questions'), 1)
        when q.type = 'multiple_choice' and q.allow_multiple
          then greatest(
            coalesce(
              q.question_count,
              case when jsonb_typeof(to_jsonb(q.correct_answer)) = 'array'
                then jsonb_array_length(to_jsonb(q.correct_answer))
              end,
              1
            ),
            1
          )
        else 1
      end as display_size
    from public.questions q
    join eligible_passages p on p.id = q.passage_id
    where (
      p.test_type = 'reading'
      and q.type in (
        'matching_headings', 'matching_features', 'matching', 'multiple_choice',
        'true_false_not_given', 'yes_no_not_given'
      )
    ) or (
      p.test_type = 'listening'
      and q.type in ('matching_features', 'multiple_choice')
    )
  ), keyed as (
    select
      qr.*,
      case
        when qr.test_type = 'listening'
          then btrim(split_part(
            replace(btrim(coalesce(qr.group_instructions, ''), E' \t\r\n'), '\n', E'\n'),
            E'\n', 1
          ))
        else btrim(coalesce(qr.group_instructions, ''), E' \t\r\n')
      end as instruction_key,
      nullif(btrim(qr.mcq_title), '') as heading
    from question_rows qr
  ), counted as (
    select
      k.*,
      count(k.heading) over (
        partition by k.passage_id, k.section_number, k.focus, k.instruction_key
        order by k.question_number, k.id
      ) as headings_seen
    from keyed k
  ), filled as (
    -- Carry each heading forward over the untitled questions that follow it.
    select
      c.*,
      max(c.heading) over (
        partition by c.passage_id, c.section_number, c.focus, c.instruction_key, c.headings_seen
      ) as current_heading
    from counted c
  ), flagged as (
    select
      f.*,
      case
        when f.current_heading is distinct from lag(f.current_heading) over (
          partition by f.passage_id, f.section_number, f.focus, f.instruction_key
          order by f.question_number, f.id
        ) then 1 else 0
      end as heading_changed
    from filled f
  ), titled as (
    select
      fl.*,
      sum(fl.heading_changed) over (
        partition by fl.passage_id, fl.section_number, fl.focus, fl.instruction_key
        order by fl.question_number, fl.id
      ) as title_run
    from flagged fl
  ), grouped as (
    select
      passage_id,
      passage_title,
      test_type,
      passage_audio_url,
      passage_content,
      section_number,
      focus,
      instruction_key,
      title_run,
      (array_agg(id order by question_number, id))[1] as first_question_id,
      min(question_number) as start_number,
      sum(display_size) as total
    from titled
    group by
      passage_id, passage_title, test_type, passage_audio_url, passage_content,
      section_number, focus, instruction_key, title_run
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', g.passage_id::text || ':' || g.first_question_id::text,
    'sourceId', g.passage_id,
    'title', g.passage_title,
    'focus', g.focus,
    'total', g.total,
    'section', g.section_number,
    'startNumber', g.start_number,
    'audioScope', case when g.test_type = 'listening' then
      case when exists (
        select 1
        from jsonb_array_elements(
          case when jsonb_typeof(g.passage_content::jsonb) = 'array'
            then g.passage_content::jsonb else '[]'::jsonb end
        ) section
        where coalesce((section ->> 'section_number')::integer, 1) = g.section_number
          and nullif(section ->> 'audio_url', '') is not null
      ) then 'section'
      when nullif(g.passage_audio_url, '') is not null then 'full_test'
      end
    end
  ) order by g.passage_id, g.section_number, g.start_number, g.first_question_id), '[]'::jsonb)
  from grouped g;
$function$;

-- Existing practice sessions keep their stored snapshot. Rebuild the cached
-- dashboard so new sessions see the merged sets.
select skill_lab_private.refresh_practice_library_dashboard_cache();

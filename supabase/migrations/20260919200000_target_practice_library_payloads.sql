-- Return pre-grouped dashboard metadata and source-scoped full data so the Edge
-- runtime never has to download and score the entire catalogue on a cold start.

create or replace function public.practice_library_dashboard_groups(p_auth uuid)
returns jsonb
language sql
stable
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
  ), grouped as (
    select
      passage_id,
      passage_title,
      test_type,
      passage_audio_url,
      passage_content,
      section_number,
      focus,
      group_instructions,
      mcq_title,
      (array_agg(id order by question_number, id))[1] as first_question_id,
      min(question_number) as start_number,
      sum(display_size) as total
    from question_rows
    group by
      passage_id, passage_title, test_type, passage_audio_url, passage_content,
      section_number, focus, group_instructions, mcq_title
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

create or replace function public.practice_library_catalogue_for_sources(
  p_auth uuid,
  p_sources uuid[],
  p_include_explanations boolean default true
)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  select jsonb_build_object(
    'passages', coalesce((
      select jsonb_agg(to_jsonb(p) - 'transcript' - 'created_at' - 'updated_at' order by p.id)
      from public.passages p
      where p.id = any(p_sources)
        and p.is_active
        and p.test_type in ('reading', 'listening')
        and (
          p.access_tier = 'free'
          or skill_lab_private.tier(u.id) = 'premium'
          or (p.access_tier = 'pro' and skill_lab_private.tier(u.id) = 'pro')
        )
    ), '[]'::jsonb),
    'questions', coalesce((
      select jsonb_agg(
        case when p_include_explanations
          then to_jsonb(q) - 'created_at' - 'updated_at'
          else to_jsonb(q) - 'created_at' - 'updated_at' - 'explanation_data' - 'explanation'
        end
        order by q.passage_id, q.question_number, q.id
      )
      from public.questions q
      join public.passages p on p.id = q.passage_id
      where p.id = any(p_sources)
        and p.is_active
        and p.test_type in ('reading', 'listening')
        and (
          p.access_tier = 'free'
          or skill_lab_private.tier(u.id) = 'premium'
          or (p.access_tier = 'pro' and skill_lab_private.tier(u.id) = 'pro')
        )
    ), '[]'::jsonb)
  )
  from public.users u
  where u.auth_id = p_auth;
$function$;

revoke all on function public.practice_library_dashboard_groups(uuid)
  from public, anon, authenticated;
revoke all on function public.practice_library_catalogue_for_sources(uuid, uuid[], boolean)
  from public, anon, authenticated;

grant execute on function public.practice_library_dashboard_groups(uuid) to service_role;
grant execute on function public.practice_library_catalogue_for_sources(uuid, uuid[], boolean)
  to service_role;

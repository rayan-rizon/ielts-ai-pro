-- Expand the materialized question-type catalogue. The original RPC keeps
-- its previous coverage so this migration can precede the Edge/UI rollout.
create or replace function skill_lab_private.practice_extra_question_size(
  module text, kind text, question jsonb
)
returns integer language plpgsql immutable set search_path = '' as $function$
declare
  block jsonb;
  slots integer;
begin
  if kind = 'short_answer' and module = 'reading' then
    slots := regexp_count(question->>'question_text', '_____');
    if nullif(btrim(question->>'question_text'), '') is not null
      and nullif(btrim(question->>'correct_answer'), '') is not null
      and (slots < 2 or (
        cardinality(string_to_array(question->>'correct_answer', ',')) = slots
        and not exists (select 1 from unnest(string_to_array(question->>'correct_answer', ',')) answer
          where btrim(answer) = '')
      )) then return 1; end if;
  elsif kind = 'notes_completion' and module = 'reading' then
    block := question->'gap_fill';
    select count(*) into slots
    from regexp_matches(block->>'structured_text', '\[(\d+)\]', 'g') token;
    if slots > 0 and not exists (
      select 1 from regexp_matches(block->>'structured_text', '\[(\d+)\]', 'g') token
      where nullif(btrim(block->'answers'->>token[1]), '') is null
    ) then return slots; end if;
  elsif kind = 'map_labeling' and module = 'listening' then
    block := question->'map_labeling';
    if jsonb_typeof(block->'questions') = 'array'
      and nullif(btrim(block->>'image_url'), '') is not null
      and not exists (
        select 1 from jsonb_array_elements(block->'questions') item
        where nullif(btrim(item->>'answer'), '') is null
      ) then return nullif(jsonb_array_length(block->'questions'), 0); end if;
  elsif kind = 'table_completion' then
    block := question->'table_data';
    if jsonb_typeof(block->'rows') = 'array' then
      if module = 'reading' then
        block := coalesce(block->'blanks', block->'blank_positions');
      else
        block := coalesce(block->'blank_positions', block->'blanks');
      end if;
      if jsonb_typeof(block) = 'array' and not exists (
        select 1 from jsonb_array_elements(block) item
        where nullif(btrim(coalesce(item->>'answer', item->>'correct_answer')), '') is null
      ) then
        if module = 'reading' then
          select count(distinct item->>'blankNumber') into slots from jsonb_array_elements(block) item;
          return nullif(slots, 0);
        end if;
        return nullif(jsonb_array_length(block), 0);
      end if;
    end if;
  elsif kind = 'flowchart' or (kind = 'gap_fill' and module = 'listening') then
    if kind = 'flowchart' then
      block := question->'flowchart';
      if jsonb_typeof(block->'steps') is distinct from 'array' then return null; end if;
      select sum(regexp_count(step->>'text', '\[gap\]')) into slots
      from jsonb_array_elements(block->'steps') step;
    else
      block := question->'gap_fill';
      slots := regexp_count(coalesce(block->>'text', block->>'content'), '\[gap\]|__BLANK__|__BLANK_\d+__');
    end if;
    if slots > 0 and not exists (
      select 1 from generate_series(0, slots - 1) n
      where nullif(btrim(case when jsonb_typeof(block->'answers') = 'array'
        then block->'answers'->>n else block->'answers'->>n::text end), '') is null
    ) then return slots; end if;
  end if;
  return null;
end
$function$;

revoke all on function skill_lab_private.practice_extra_question_size(text, text, jsonb)
  from public, anon, authenticated;

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
      and objective_private.can_start_passage(p.id, p.access_tier, l.tier, l.id)
  ), question_rows as (
    select
      q.*,
      extra.size as extended_size,
      substring(concat_ws(' ', q.group_instructions, q.mcq_title)
        from '(?i)(?:complet|fill)[^\r\n]{0,18}\m(notes?|forms?|sentences?|summar(?:y|ies))\M')
        as gap_noun,
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
        when extra.size is not null then extra.size
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
              case when pg_input_is_valid(q.correct_answer, 'jsonb') then
                case when jsonb_typeof(q.correct_answer::jsonb) = 'array'
                  then jsonb_array_length(q.correct_answer::jsonb) end
              end,
              2
            ),
            1
          )
        else 1
      end as display_size
    from public.questions q
    join eligible_passages p on p.id = q.passage_id
    cross join lateral (
      select case when q.type in (
        'gap_fill', 'map_labeling', 'notes_completion', 'short_answer', 'table_completion', 'flowchart'
      ) then skill_lab_private.practice_extra_question_size(p.test_type, q.type, to_jsonb(q)) end as size
    ) extra
    where extra.size > 0 or (
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
        when qr.extended_size is not null and qr.type <> 'short_answer' then qr.id::text
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
      sum(display_size) as total,
      bool_or(extended_size is not null) as extended,
      case
        when focus = 'listening:multiple_choice' and bool_and(coalesce(allow_multiple, false))
          then 'listening:multiple_choice_multiple'
        when focus = 'listening:gap_fill' and min(gap_noun) is not null
          then 'listening:' || regexp_replace(lower(min(gap_noun)), '(ies|s)$',
            case when lower(min(gap_noun)) like '%ies' then 'y' else '' end) || '_completion'
        else focus
      end as category
    from titled
    group by
      passage_id, passage_title, test_type, passage_audio_url, passage_content,
      section_number, focus, instruction_key, title_run
  ), with_source as (
    select g.*,
      case when g.test_type = 'listening' then
        case when nullif(coalesce(section.value->>'audio_url', section.value->>'audioUrl'), '') is not null then 'section'
          when nullif(g.passage_audio_url, '') is not null then 'full_test'
        end
      end as audio_scope,
      case when jsonb_typeof(parsed.content) = 'array' then section.value->>'content'
        else g.passage_content end as reading_text
    from grouped g
    cross join lateral (
      select case when pg_input_is_valid(g.passage_content, 'jsonb') then g.passage_content::jsonb end as content
    ) parsed
    left join lateral (
      select value
      from jsonb_array_elements(case when jsonb_typeof(parsed.content) = 'array'
        then parsed.content else '[]'::jsonb end) with ordinality as item(value, position)
      where coalesce(nullif(value->>'section_number', ''), position::text) = g.section_number::text
      order by position limit 1
    ) section on true
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', g.passage_id::text || ':' || g.first_question_id::text,
    'sourceId', g.passage_id,
    'title', g.passage_title,
    'focus', g.focus,
    'total', g.total,
    'section', g.section_number,
    'startNumber', g.start_number,
    'category', g.category,
    'extended', g.extended,
    'audioScope', g.audio_scope
  ) order by g.passage_id, g.section_number, g.start_number, g.first_question_id), '[]'::jsonb)
  from with_source g
  where not g.extended
    or (g.test_type = 'reading' and nullif(btrim(g.reading_text), '') is not null)
    or (g.test_type = 'listening' and g.audio_scope is not null);
$function$;

create or replace function public.practice_library_dashboard_groups_v2(p_auth uuid)
returns jsonb language sql volatile security definer set search_path = '' as $function$
  select coalesce(c.payload, public.practice_library_dashboard_groups_uncached(p_auth))
  from public.users u
  left join skill_lab_private.practice_library_dashboard_cache c
    on c.tier = skill_lab_private.tier(u.id) and c.tier <> 'free'
  where u.auth_id = p_auth
$function$;

revoke all on function public.practice_library_dashboard_groups_v2(uuid)
  from public, anon, authenticated;
grant execute on function public.practice_library_dashboard_groups_v2(uuid) to service_role;

create or replace function public.practice_library_dashboard_groups(p_auth uuid)
returns jsonb language sql volatile security definer set search_path = '' as $function$
  select coalesce(jsonb_agg(item - 'category' - 'extended' order by position), '[]'::jsonb)
  from jsonb_array_elements(public.practice_library_dashboard_groups_v2(p_auth))
    with ordinality as entry(item, position)
  where not coalesce((item->>'extended')::boolean, false)
$function$;

select skill_lab_private.refresh_practice_library_dashboard_cache();

-- Listening dashboard cards need section audio metadata, not transcripts or
-- subtitles. Preserve the fields consumed by libraryGroupSource while keeping
-- full/start payloads byte-for-byte unchanged.

create or replace function skill_lab_private.dashboard_passage_content(p public.passages)
returns text
language sql
stable
set search_path to ''
as $function$
  select case
    when p.test_type = 'reading' then 'available'
    when p.test_type = 'listening' then coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'section_number', section.value -> 'section_number',
        'title', section.value -> 'title',
        'audio_url', section.value -> 'audio_url',
        'duration_minutes', section.value -> 'duration_minutes'
      )) order by section.ordinality)::text
      from jsonb_array_elements(
        case when jsonb_typeof(p.content::jsonb) = 'array'
          then p.content::jsonb
          else '[]'::jsonb
        end
      ) with ordinality as section(value, ordinality)
    ), '[]')
    else ''
  end;
$function$;

revoke all on function skill_lab_private.dashboard_passage_content(public.passages)
  from public;

create or replace function skill_lab_private.build_practice_library_catalogue(
  p_tier text,
  p_include_explanations boolean
)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  select jsonb_build_object(
    'passages', coalesce((
      select jsonb_agg(
        case when p_include_explanations
          then to_jsonb(p) - 'transcript' - 'created_at' - 'updated_at'
          else (
            to_jsonb(p) - 'transcript' - 'created_at' - 'updated_at' - 'content'
          ) || jsonb_build_object(
            'content', skill_lab_private.dashboard_passage_content(p)
          )
        end
        order by p.id
      )
      from public.passages p
      where p.is_active
        and p.test_type in ('reading', 'listening')
        and (
          p.access_tier = 'free'
          or p_tier = 'premium'
          or (p.access_tier = 'pro' and p_tier = 'pro')
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
      where p.is_active
        and p.test_type in ('reading', 'listening')
        and (
          p.access_tier = 'free'
          or p_tier = 'premium'
          or (p.access_tier = 'pro' and p_tier = 'pro')
        )
    ), '[]'::jsonb)
  );
$function$;

revoke all on function skill_lab_private.build_practice_library_catalogue(text, boolean)
  from public;

select skill_lab_private.refresh_practice_library_catalogue_cache();

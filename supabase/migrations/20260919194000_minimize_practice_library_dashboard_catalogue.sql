-- The dashboard does not render passage text. Keep only a non-empty marker for
-- Reading so group eligibility remains identical; Listening retains its JSON
-- because section-level audio metadata can live there. Full/start payloads are
-- unchanged and still contain the original passage content.

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
        case when p_include_explanations or p.test_type = 'listening'
          then to_jsonb(p) - 'transcript' - 'created_at' - 'updated_at'
          else (
            to_jsonb(p) - 'transcript' - 'created_at' - 'updated_at' - 'content'
          ) || jsonb_build_object('content', 'available')
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

-- `practice_library_catalogue` was the slowest RPC in the app: 1,263 ms mean
-- over 163 calls. It returned `to_jsonb()` of every row it touched —
-- 4,360 kB of passages, 4,110 kB of questions, and the caller's full 90-day
-- session rows — roughly 8.5 MB of JSON per Skill Lab load, built fresh each
-- time.
--
-- Most of that is genuinely consumed by `buildLibraryGroups`, which needs the
-- passage content and nearly every question column to decide group eligibility
-- and to score. This migration removes only what the caller provably never
-- reads. The endpoint is still heavy by design; the remaining cost is
-- structural (it rebuilds the whole tier-scoped library on every dashboard
-- load) and wants its own change.
--
-- Measured reductions, per call:
--   history:          675 kB -> 58 kB for the heaviest user (41 sessions)
--   explanation_data: -1,234 kB on the dashboard action, which never reads it
--
-- Passages and questions use a denylist (`to_jsonb(x) - 'col'`) rather than an
-- allowlist so a column added later still reaches the renderer by default.
-- `history` uses an allowlist because its consumer is small and fully audited:
-- libraryHandler.ts reads only id, passage_id, test_type, completed_at and
-- content_data.savedAnswers from these rows.

create or replace function public.practice_library_catalogue(
  p_auth uuid,
  p_include_explanations boolean default true
)
returns jsonb
language sql
security definer
set search_path to ''
as $function$
  select jsonb_build_object(
    'passages', coalesce((
      select jsonb_agg(
        -- `transcript` can hold the full listening script and is never read by
        -- the Skill Lab; the timestamps are not read either.
        to_jsonb(p) - 'transcript' - 'created_at' - 'updated_at'
      )
      from public.passages p
      where p.is_active
        and p.test_type in ('reading', 'listening')
        and (
          p.access_tier = 'free'
          or skill_lab_private.tier(u.id) = 'premium'
          or (p.access_tier = 'pro' and skill_lab_private.tier(u.id) = 'pro')
        )
    ), '[]'),

    'questions', coalesce((
      select jsonb_agg(
        case when p_include_explanations
          then to_jsonb(q) - 'created_at' - 'updated_at'
          -- The dashboard action only builds group summaries. Explanations are
          -- 1,234 kB of the questions payload and are read only when a practice
          -- set is started or a completed one is reviewed.
          else to_jsonb(q) - 'created_at' - 'updated_at' - 'explanation_data' - 'explanation'
        end
      )
      from public.questions q
      join public.passages p on p.id = q.passage_id
      where p.is_active
        and p.test_type in ('reading', 'listening')
        and (
          p.access_tier = 'free'
          or skill_lab_private.tier(u.id) = 'premium'
          or (p.access_tier = 'pro' and skill_lab_private.tier(u.id) = 'pro')
        )
    ), '[]'),

    'history', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'passage_id', t.passage_id,
        'test_type', t.test_type,
        'completed_at', t.completed_at,
        -- Only this one key is read. The surrounding blob averages 4.5 kB per
        -- row and `user_responses` alongside it was never read at all.
        'content_data', jsonb_build_object('savedAnswers', t.content_data -> 'savedAnswers')
      ))
      from public.test_sessions t
      where t.user_id = u.id
        and t.is_completed
        and t.test_type in ('reading', 'listening')
        and t.completed_at >= now() - interval '90 days'
    ), '[]')
  )
  from public.users u
  where u.auth_id = p_auth
$function$;

comment on function public.practice_library_catalogue(uuid, boolean) is
  'Skill Lab library catalogue for a learner''s tier. Pass p_include_explanations => false for the dashboard action, which builds group summaries only.';

revoke all on function public.practice_library_catalogue(uuid, boolean) from public, anon, authenticated;
grant execute on function public.practice_library_catalogue(uuid, boolean) to service_role;

-- The single-argument form is now ambiguous against the defaulted two-argument
-- one, and nothing should call it. Drop it only after the replacement exists.
drop function if exists public.practice_library_catalogue(uuid);

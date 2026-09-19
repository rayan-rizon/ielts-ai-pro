-- The Skill Lab dashboard currently asks PostgREST to serialize the complete
-- tier-scoped Reading and Listening catalogue for every request. The catalogue
-- is static across learners in the same tier, while only history is personal.
-- Split those concerns so the Edge Function can reuse static catalogue JSON
-- inside a warm isolate without caching or sharing learner data.

create or replace function skill_lab_private.touch_catalogue_updated_at()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

drop trigger if exists practice_library_touch_passage on public.passages;
create trigger practice_library_touch_passage
before update on public.passages
for each row execute function skill_lab_private.touch_catalogue_updated_at();

drop trigger if exists practice_library_touch_question on public.questions;
create trigger practice_library_touch_question
before update on public.questions
for each row execute function skill_lab_private.touch_catalogue_updated_at();

revoke all on function skill_lab_private.touch_catalogue_updated_at() from public;

create or replace function public.practice_library_catalogue_version(p_auth uuid)
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
  )
  select jsonb_build_object(
    'tier', l.tier,
    'version', md5(concat_ws(
      '|',
      l.tier,
      passage_stats.row_count,
      passage_stats.latest_update,
      question_stats.row_count,
      question_stats.latest_update
    ))
  )
  from learner l
  cross join lateral (
    select
      count(*) as row_count,
      coalesce(max(p.updated_at), '-infinity'::timestamptz) as latest_update
    from public.passages p
    where p.is_active
      and p.test_type in ('reading', 'listening')
      and (
        p.access_tier = 'free'
        or l.tier = 'premium'
        or (p.access_tier = 'pro' and l.tier = 'pro')
      )
  ) passage_stats
  cross join lateral (
    select
      count(*) as row_count,
      coalesce(max(q.updated_at), '-infinity'::timestamptz) as latest_update
    from public.questions q
    join public.passages p on p.id = q.passage_id
    where p.is_active
      and p.test_type in ('reading', 'listening')
      and (
        p.access_tier = 'free'
        or l.tier = 'premium'
        or (p.access_tier = 'pro' and l.tier = 'pro')
      )
  ) question_stats;
$function$;

comment on function public.practice_library_catalogue_version(uuid) is
  'Small cache version for the tier-scoped static Skill Lab catalogue. Contains no learner history.';

create or replace function public.practice_library_catalogue_static(
  p_auth uuid,
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
      select jsonb_agg(
        to_jsonb(p) - 'transcript' - 'created_at' - 'updated_at'
        order by p.id
      )
      from public.passages p
      where p.is_active
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
      where p.is_active
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

comment on function public.practice_library_catalogue_static(uuid, boolean) is
  'Tier-scoped static Skill Lab source data. Safe to reuse by version; contains no learner history.';

create or replace function public.practice_library_history(p_auth uuid)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'passage_id', t.passage_id,
    'test_type', t.test_type,
    'completed_at', t.completed_at,
    'content_data', jsonb_build_object('savedAnswers', t.content_data -> 'savedAnswers')
  ) order by t.completed_at desc, t.id) filter (where t.id is not null), '[]'::jsonb)
  from public.users u
  left join public.test_sessions t
    on t.user_id = u.id
   and t.is_completed
   and t.test_type in ('reading', 'listening')
   and t.completed_at >= now() - interval '90 days'
  where u.auth_id = p_auth
  having count(u.id) > 0;
$function$;

comment on function public.practice_library_history(uuid) is
  'Current learner-only Skill Lab history. Deliberately excluded from the shared static catalogue cache.';

revoke all on function public.practice_library_catalogue_version(uuid)
  from public, anon, authenticated;
revoke all on function public.practice_library_catalogue_static(uuid, boolean)
  from public, anon, authenticated;
revoke all on function public.practice_library_history(uuid)
  from public, anon, authenticated;

grant execute on function public.practice_library_catalogue_version(uuid) to service_role;
grant execute on function public.practice_library_catalogue_static(uuid, boolean) to service_role;
grant execute on function public.practice_library_history(uuid) to service_role;

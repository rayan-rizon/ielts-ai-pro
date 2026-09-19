-- Building the tier catalogue JSON on every Edge Function cold start takes
-- longer than the live runtime budget. Materialize the six reusable variants
-- (three tiers, with/without explanations) inside Postgres. Statement-level
-- triggers rebuild them only when source catalogue rows change.

create table if not exists skill_lab_private.practice_library_catalogue_cache (
  tier text not null check (tier in ('free', 'pro', 'premium')),
  include_explanations boolean not null,
  payload jsonb not null,
  refreshed_at timestamptz not null default now(),
  primary key (tier, include_explanations)
);

revoke all on table skill_lab_private.practice_library_catalogue_cache from public;

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
        to_jsonb(p) - 'transcript' - 'created_at' - 'updated_at'
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

create or replace function skill_lab_private.refresh_practice_library_catalogue_cache()
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  catalogue_tier text;
  catalogue_includes_explanations boolean;
begin
  foreach catalogue_tier in array array['free', 'pro', 'premium'] loop
    foreach catalogue_includes_explanations in array array[false, true] loop
      insert into skill_lab_private.practice_library_catalogue_cache (
        tier,
        include_explanations,
        payload,
        refreshed_at
      ) values (
        catalogue_tier,
        catalogue_includes_explanations,
        skill_lab_private.build_practice_library_catalogue(
          catalogue_tier,
          catalogue_includes_explanations
        ),
        now()
      )
      on conflict (tier, include_explanations) do update
      set payload = excluded.payload,
          refreshed_at = excluded.refreshed_at;
    end loop;
  end loop;
  return;
end;
$function$;

create or replace function skill_lab_private.refresh_practice_library_catalogue_cache_trigger()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform skill_lab_private.refresh_practice_library_catalogue_cache();
  return null;
end;
$function$;

revoke all on function skill_lab_private.build_practice_library_catalogue(text, boolean)
  from public;
revoke all on function skill_lab_private.refresh_practice_library_catalogue_cache()
  from public;
revoke all on function skill_lab_private.refresh_practice_library_catalogue_cache_trigger()
  from public;

drop trigger if exists practice_library_refresh_passage_cache on public.passages;
create trigger practice_library_refresh_passage_cache
after insert or update or delete or truncate on public.passages
for each statement execute function skill_lab_private.refresh_practice_library_catalogue_cache_trigger();

drop trigger if exists practice_library_refresh_question_cache on public.questions;
create trigger practice_library_refresh_question_cache
after insert or update or delete or truncate on public.questions
for each statement execute function skill_lab_private.refresh_practice_library_catalogue_cache_trigger();

select skill_lab_private.refresh_practice_library_catalogue_cache();

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
  select c.payload
  from public.users u
  join skill_lab_private.practice_library_catalogue_cache c
    on c.tier = skill_lab_private.tier(u.id)
   and c.include_explanations = p_include_explanations
  where u.auth_id = p_auth;
$function$;

revoke all on function public.practice_library_catalogue_static(uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.practice_library_catalogue_static(uuid, boolean) to service_role;

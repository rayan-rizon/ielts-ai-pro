-- The exact dashboard grouping query is much smaller than the catalogue but is
-- still CPU-heavy. Cache its result per represented tier and refresh it with
-- the catalogue caches whenever passages or questions change.

alter function public.practice_library_dashboard_groups(uuid)
  rename to practice_library_dashboard_groups_uncached;

create table if not exists skill_lab_private.practice_library_dashboard_cache (
  tier text primary key check (tier in ('free', 'pro', 'premium')),
  payload jsonb not null,
  refreshed_at timestamptz not null default now()
);

revoke all on table skill_lab_private.practice_library_dashboard_cache from public;

create or replace function skill_lab_private.refresh_practice_library_dashboard_cache()
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  representative record;
begin
  for representative in
    select distinct on (skill_lab_private.tier(u.id))
      skill_lab_private.tier(u.id) as tier,
      u.auth_id
    from public.users u
    where u.auth_id is not null
    order by skill_lab_private.tier(u.id), u.created_at, u.id
  loop
    insert into skill_lab_private.practice_library_dashboard_cache (
      tier,
      payload,
      refreshed_at
    ) values (
      representative.tier,
      public.practice_library_dashboard_groups_uncached(representative.auth_id),
      now()
    )
    on conflict (tier) do update
    set payload = excluded.payload,
        refreshed_at = excluded.refreshed_at;
  end loop;
end;
$function$;

revoke all on function skill_lab_private.refresh_practice_library_dashboard_cache()
  from public;

select skill_lab_private.refresh_practice_library_dashboard_cache();

create or replace function public.practice_library_dashboard_groups(p_auth uuid)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  select coalesce(
    c.payload,
    public.practice_library_dashboard_groups_uncached(p_auth)
  )
  from public.users u
  left join skill_lab_private.practice_library_dashboard_cache c
    on c.tier = skill_lab_private.tier(u.id)
  where u.auth_id = p_auth;
$function$;

create or replace function skill_lab_private.refresh_practice_library_catalogue_cache_trigger()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform skill_lab_private.refresh_practice_library_catalogue_cache();
  perform skill_lab_private.refresh_practice_library_dashboard_cache();
  return null;
end;
$function$;

revoke all on function public.practice_library_dashboard_groups_uncached(uuid)
  from public, anon, authenticated;
revoke all on function public.practice_library_dashboard_groups(uuid)
  from public, anon, authenticated;
revoke all on function skill_lab_private.refresh_practice_library_catalogue_cache_trigger()
  from public;

grant execute on function public.practice_library_dashboard_groups(uuid) to service_role;

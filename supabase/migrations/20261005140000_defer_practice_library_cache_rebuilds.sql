-- Test edits should not synchronously rebuild global practice-library JSON
-- caches. Concurrent cache refreshes contend on the same rows and can make an
-- otherwise small passage/question write exceed PostgREST's statement timeout.

create table if not exists skill_lab_private.practice_library_cache_refresh_state (
  singleton boolean primary key default true check (singleton),
  requested_generation bigint not null default 0,
  refreshed_generation bigint not null default 0,
  updated_at timestamptz not null default now(),
  check (requested_generation >= refreshed_generation)
);

revoke all on table skill_lab_private.practice_library_cache_refresh_state
  from public, anon, authenticated;

-- Seed a refresh so any cache left stale by an earlier timed-out write is
-- rebuilt after this migration is installed.
insert into skill_lab_private.practice_library_cache_refresh_state (
  singleton,
  requested_generation,
  refreshed_generation
) values (true, 1, 0)
on conflict (singleton) do nothing;

-- Keep the existing statement triggers, but make them queue work with a tiny
-- counter update instead of rebuilding every tier's cache in the write.
create or replace function skill_lab_private.refresh_practice_library_catalogue_cache_trigger()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  update skill_lab_private.practice_library_cache_refresh_state
  set requested_generation = requested_generation + 1,
      updated_at = now()
  where singleton;
  return null;
end;
$function$;

create or replace function skill_lab_private.refresh_practice_library_caches_if_dirty()
returns void
language plpgsql
security definer
set search_path to ''
set statement_timeout to '5min'
as $function$
declare
  v_requested_generation bigint;
  v_refreshed_generation bigint;
begin
  select state.requested_generation, state.refreshed_generation
    into v_requested_generation, v_refreshed_generation
  from skill_lab_private.practice_library_cache_refresh_state as state
  where state.singleton;

  if v_requested_generation is null
    or v_requested_generation <= v_refreshed_generation then
    return;
  end if;

  perform skill_lab_private.refresh_practice_library_catalogue_cache();
  perform skill_lab_private.refresh_practice_library_dashboard_cache();

  -- If a test changed while the caches were rebuilding, its higher generation
  -- stays pending and the next scheduled run catches it up.
  update skill_lab_private.practice_library_cache_refresh_state
  set refreshed_generation = greatest(refreshed_generation, v_requested_generation),
      updated_at = now()
  where singleton;
end;
$function$;

revoke all on function skill_lab_private.refresh_practice_library_caches_if_dirty()
  from public, anon, authenticated;

select cron.schedule(
  'practice-library-cache-refresh',
  '* * * * *',
  'select skill_lab_private.refresh_practice_library_caches_if_dirty()'
);

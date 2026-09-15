-- Grammar Lab paid ~600 ms per call to validate a timezone string.
--
-- `get_grammar_dashboard()` and `start_grammar_attempt()` both guarded the
-- learner's stored timezone with
--
--   if not exists (select 1 from pg_timezone_names where name = v_timezone)
--
-- `pg_timezone_names` is a set-returning function, not a table: every reference
-- re-reads and re-parses the whole tzdata set. Measured on this database:
--
--   Function Scan on pg_timezone_names (actual time=897.678..897.691 rows=1)
--     Rows Removed by Filter: 1193
--   Execution Time: 899.977 ms
--
-- That put `get_grammar_dashboard` at min 55 ms / mean 648 ms / max 2,123 ms
-- over 373 calls — the mean was almost entirely this one line, paid on every
-- Grammar Lab page load and every attempt start.
--
-- `AT TIME ZONE` resolves exactly the names Postgres knows without
-- materialising the catalog, so an exception-guarded cast answers the same
-- question. Benchmarked at 7.2 µs per resolution over 1,000 iterations.
--
-- The guarded cast accepts a superset of `pg_timezone_names`: it also allows
-- abbreviations (`PST`) and POSIX offsets (`+06`). Every name the old check
-- accepted still resolves to itself, and a name it would have silently
-- downgraded to UTC now resolves correctly instead. `grammar_attempts.study_timezone`
-- has no CHECK constraint and is only ever consumed by `AT TIME ZONE`, so the
-- wider input set cannot produce a value its readers reject.

create or replace function public.resolve_study_timezone(p_timezone text)
returns text
language plpgsql
stable
set search_path to ''
as $function$
declare
  v_name text := nullif(btrim(coalesce(p_timezone, '')), '');
begin
  if v_name is null then
    return 'UTC';
  end if;

  -- Raises invalid_parameter_value (22023) when Postgres does not know the
  -- name. The subtransaction this handler opens costs microseconds; the
  -- catalog scan it replaces cost ~900 ms.
  perform timestamptz '2000-01-01 00:00:00+00' at time zone v_name;
  return v_name;
exception
  when others then
    return 'UTC';
end;
$function$;

comment on function public.resolve_study_timezone(text) is
  'Normalise a learner-supplied IANA timezone to one Postgres can resolve, falling back to UTC. Replaces an EXISTS check against pg_timezone_names that cost ~900 ms per call.';

revoke all on function public.resolve_study_timezone(text) from public;
grant execute on function public.resolve_study_timezone(text) to authenticated, service_role;

-- Swap the catalog scan for the helper inside both callers.
--
-- This patches the function body in place rather than restating it. The two
-- definitions are long, and `start_grammar_attempt` has drifted between what
-- runs in production and what a fresh replay of the baseline produces (the
-- replay body derives `content_version` and selects diagnostic items by
-- question_format slots; production's does not). Restating either one here
-- would silently revert or advance that difference as a side effect of a
-- performance fix. Substituting the marker leaves whichever body is present
-- otherwise untouched.
--
-- The guard is deliberate: if the marker is missing or appears more than once,
-- the migration fails loudly instead of leaving a caller on the slow path.
do $patch$
declare
  v_marker constant text :=
'  if not exists (select 1 from pg_timezone_names where name = v_timezone) then
    v_timezone := ''UTC'';
  end if;';
  v_replacement constant text := '  v_timezone := public.resolve_study_timezone(v_timezone);';
  r record;
  v_hits integer;
  v_body text;
begin
  for r in
    select
      p.oid,
      p.proname,
      p.prosrc,
      pg_get_function_arguments(p.oid) as args,
      pg_get_function_result(p.oid) as result
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('get_grammar_dashboard', 'start_grammar_attempt')
    order by p.proname
  loop
    v_hits := (length(r.prosrc) - length(replace(r.prosrc, v_marker, ''))) / length(v_marker);

    -- Already patched (a re-run, or a body that shipped with the helper call):
    -- leave it alone rather than failing.
    if v_hits = 0 and position(v_replacement in r.prosrc) > 0 then
      continue;
    end if;

    if v_hits <> 1 then
      raise exception
        'public.%: expected exactly 1 pg_timezone_names guard to patch, found %',
        r.proname, v_hits;
    end if;

    v_body := replace(r.prosrc, v_marker, v_replacement);

    execute format(
      'create or replace function public.%I(%s) returns %s language plpgsql volatile security definer set search_path to '''' as %L',
      r.proname, r.args, r.result, v_body
    );
  end loop;

  -- Nothing may still reach the catalog scan on a request path.
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosrc like '%pg_timezone_names%'
  ) then
    raise exception 'a public function still references pg_timezone_names';
  end if;
end
$patch$;

-- Rollback-only check of the real entitlement chain and catalogue entry points.
begin;
do $$
declare
  signature text;
  learner record;
  groups jsonb;
  version jsonb;
  catalogue jsonb;
  source_id uuid;
  checked integer := 0;
begin
  foreach signature in array array[
    'public.practice_library_catalogue_version(uuid)',
    'public.practice_library_catalogue_static(uuid,boolean)',
    'public.practice_library_catalogue_for_sources(uuid,uuid[],boolean)',
    'public.practice_library_dashboard_groups_uncached(uuid)',
    'public.practice_library_dashboard_groups(uuid)'
  ] loop
    if (select provolatile from pg_proc where oid=signature::regprocedure) <> 'v' then
      raise exception 'Catalogue caller must allow entitlement reconciliation: %', signature;
    end if;
    if has_function_privilege('anon',signature,'EXECUTE')
      or has_function_privilege('authenticated',signature,'EXECUTE') then
      raise exception 'Browser must not call service catalogue directly: %', signature;
    end if;
    if not has_function_privilege('service_role',signature,'EXECUTE') then
      raise exception 'Service catalogue execution was removed: %', signature;
    end if;
  end loop;

  -- Exercise one existing account per personal tier/admin group. Reconciliation
  -- and any seat expiry are rolled back; no lessons or AI quota are consumed.
  for learner in
    select distinct on (role,subscription_tier) id,auth_id,role,subscription_tier
    from public.users where auth_id is not null
    order by role,subscription_tier,id
  loop
    version := public.practice_library_catalogue_version(learner.auth_id);
    if version->>'tier' is distinct from skill_lab_private.tier(learner.id) then
      raise exception 'Catalogue tier does not match effective entitlement';
    end if;
    groups := public.practice_library_dashboard_groups(learner.auth_id);
    if jsonb_typeof(groups) is distinct from 'array' then
      raise exception 'Dashboard groups did not load';
    end if;
    perform public.practice_library_dashboard_groups_uncached(learner.auth_id);
    catalogue := public.practice_library_catalogue_static(learner.auth_id,false);
    if jsonb_typeof(catalogue->'passages') is distinct from 'array' then
      raise exception 'Static catalogue did not load';
    end if;
    source_id := (groups->0->>'sourceId')::uuid;
    catalogue := public.practice_library_catalogue_for_sources(
      learner.auth_id,coalesce(array[source_id],array[]::uuid[]),false
    );
    if jsonb_typeof(catalogue->'questions') is distinct from 'array' then
      raise exception 'Source catalogue did not load';
    end if;
    checked := checked + 1;
  end loop;
  if checked = 0 then raise exception 'No learners available for entitlement regression'; end if;
end $$;
rollback;

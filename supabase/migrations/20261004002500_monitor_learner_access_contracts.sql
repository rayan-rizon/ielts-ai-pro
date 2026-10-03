-- Cheap read-only contract checks cover failures before provider telemetry exists.
-- No learner seat reconciliation, quota reservation, or paid provider probes.
alter function public.get_platform_health(integer) rename to get_platform_health_core_v16;
revoke all on function public.get_platform_health_core_v16(integer) from public, anon, authenticated;

create function public.get_platform_health(p_hours integer default 24)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  base jsonb;
  checks jsonb := '[]';
  services jsonb;
  failures text;
  failed_count integer;
  item text;
  relation oid;
  routine oid;
  ok boolean;
begin
  if not public.is_admin() then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  base := public.get_platform_health_core_v16(p_hours);
  foreach item in array array[
    'users','institution_seats','institution_orders','institution_learner_profiles','grammar_guide_progress'
  ] loop
    checks := checks || jsonb_build_array(jsonb_build_object(
      'name',item,'ok',to_regclass('public.'||item) is not null));
  end loop;

  routine := to_regprocedure('public.get_institution_learner_profile(uuid)');
  ok := coalesce((select p.provolatile = 'v' and p.prosecdef
    from pg_catalog.pg_proc p where p.oid = routine),false)
    and coalesce(has_function_privilege('service_role',routine,'EXECUTE'),false)
    and not coalesce(has_function_privilege('authenticated',routine,'EXECUTE'),false)
    and not coalesce(has_function_privilege('anon',routine,'EXECUTE'),false);
  checks := checks || jsonb_build_array(jsonb_build_object('name','service-only writable profile RPC','ok',ok));

  foreach item in array array[
    'practice_library_catalogue_version(uuid)',
    'practice_library_catalogue_static(uuid,boolean)',
    'practice_library_catalogue_for_sources(uuid,uuid[],boolean)',
    'practice_library_dashboard_groups_uncached(uuid)',
    'practice_library_dashboard_groups(uuid)',
    'feature_request_page(text,text,text,integer)',
    'get_grammar_dashboard()',
    'get_objective_test_quotas()'
  ] loop
    routine := to_regprocedure('public.'||item);
    ok := coalesce((select p.provolatile = 'v' from pg_catalog.pg_proc p where p.oid = routine),false);
    checks := checks || jsonb_build_array(jsonb_build_object('name','writable '||item,'ok',ok));
  end loop;

  relation := to_regclass('public.grammar_guide_progress');
  ok := coalesce((select c.relrowsecurity from pg_catalog.pg_class c where c.oid = relation),false)
    and (select count(*) = 4 from pg_catalog.pg_policy p where p.polrelid = relation
      and p.polname in (
        'Learners can read their own grammar guide progress',
        'Learners can add their own grammar guide progress',
        'Learners can update their own grammar guide progress',
        'Learners can remove their own grammar guide progress'));
  checks := checks || jsonb_build_array(jsonb_build_object('name','guide ownership policies','ok',ok));
  foreach item in array array['SELECT','INSERT','UPDATE','DELETE'] loop
    checks := checks || jsonb_build_array(jsonb_build_object(
      'name','guide '||lower(item)||' permission',
      'ok',coalesce(has_table_privilege('authenticated',relation,item),false)));
  end loop;

  select count(*)::integer,string_agg(c->>'name',', ' order by c->>'name')
    into failed_count,failures from jsonb_array_elements(checks) c where not (c->>'ok')::boolean;
  services := coalesce(base->'services','[]') || jsonb_build_array(jsonb_build_object(
    'key','learner_access_contracts','label','Learner Access & Schema',
    'category','platform','provider','Account, institution, Practice Lab and grammar contracts',
    'status',case when failed_count>0 then 'down' else 'operational' end,
    'source','Read-only database schema, function and permission checks',
    'metrics',jsonb_build_object('checks',jsonb_array_length(checks),'failedChecks',failed_count),
    'impact',case when failed_count>0 then 'Learner access contracts failed: '||failures
      else 'Required access and grammar contracts are present. Browser journeys and AI responses are not probed by this check.' end,
    'checks',checks
  ));
  base := jsonb_set(base,'{services}',services,true);
  base := jsonb_set(base,'{summary}',(
    select coalesce(jsonb_object_agg(status,n),'{}') from (
      select s->>'status' as status,count(*) as n from jsonb_array_elements(services) s group by s->>'status'
    ) statuses),true);
  return base;
end $$;

revoke all on function public.get_platform_health(integer) from public, anon;
grant execute on function public.get_platform_health(integer) to authenticated, service_role;

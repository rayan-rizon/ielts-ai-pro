do $$
declare payload jsonb; metric jsonb;
begin
  if (select count(*) from admin_health_private.scheduled_cron_runs)<>1 then raise exception 'Backfill must isolate scheduled-email history'; end if;
  payload:=public.get_platform_health_core_v3(24);
  select s->'metrics' into metric from jsonb_array_elements(payload->'services')s where s->>'key'='scheduled_automation';
  if metric->>'lastCronStatus'<>'running' then raise exception 'Existing running state changed'; end if;
  if has_function_privilege('authenticated','admin_health_private.refresh_scheduled_cron_history()','execute') then raise exception 'Refresh exposed to authenticated'; end if;
  if has_table_privilege('anon','admin_health_private.scheduled_cron_runs','select') then raise exception 'Cache exposed to anon'; end if;
end $$;
-- A previously running execution must be updated after the global watermark advanced.
update cron.job_run_details set status='failed',end_time=now(),return_message='HTTP dispatch failed' where runid=8001;
insert into cron.job_run_details select n,12,'succeeded',now(),now(),null from generate_series(8002,8100)n;
select admin_health_private.refresh_scheduled_cron_history();
do $$
declare incidents jsonb;
begin
  if (select status from admin_health_private.scheduled_cron_runs where runid=8001)<>'failed' then raise exception 'Missed running-to-failed update'; end if;
  incidents:=public.get_platform_health_incidents_core_v3(24,50);
  if not exists(select from jsonb_array_elements(incidents)i where i->>'message'='HTTP dispatch failed' and (i->>'occurrences')::integer=1) then raise exception 'Lost scheduler failure evidence'; end if;
  if (select count(*) from admin_health_private.scheduled_cron_runs)<>1 then raise exception 'Unrelated jobs leaked into cache'; end if;
end $$;
-- Preserve start-time ordering even when run IDs are allocated out of order.
insert into cron.job_run_details values(8101,11,'succeeded',now()-interval '1 day',now(),null);
select admin_health_private.refresh_scheduled_cron_history();
do $$
declare result jsonb;
begin
  select s into result from jsonb_array_elements(public.get_platform_health_core_v3(24)->'services')s where s->>'key'='scheduled_automation';
  if result->'metrics'->>'lastCronStatus'<>'failed' then raise exception 'Run ID order replaced start-time order'; end if;
end $$;
update admin_health_private.cron_sync_state set synced_at=now()-interval '10 minutes';
do $$
declare result jsonb;
begin
  select s into result from jsonb_array_elements(public.get_platform_health_core_v3(24)->'services')s where s->>'key'='scheduled_automation';
  if result->>'status'<>'degraded' or result->>'impact' not ilike '%stale%' then raise exception 'Stale cache presented as current'; end if;
end $$;
select admin_health_private.refresh_scheduled_cron_history();
-- A provider history reset must not strand the watermark above new run IDs.
truncate cron.job_run_details;
insert into cron.job_run_details values(1,11,'succeeded',now(),now(),null);
select admin_health_private.refresh_scheduled_cron_history();
do $$
begin
  if (select count(*) from admin_health_private.scheduled_cron_runs)<>1 or not exists(select from admin_health_private.scheduled_cron_runs where runid=1) then raise exception 'Provider history reset was not recovered'; end if;
  if position('FROM cron.job_run_details' in pg_get_functiondef('public.get_platform_health_core_v3(integer)'::regprocedure))>0 then raise exception 'Dashboard still reads full managed history'; end if;
end $$;
select set_config('test.admin','false',false);
do $$
begin
  perform public.get_platform_health_core_v3(24);
  raise exception 'Non-admin access allowed';
exception when raise_exception then
  if sqlerrm<>'Access denied' then raise; end if;
end $$;

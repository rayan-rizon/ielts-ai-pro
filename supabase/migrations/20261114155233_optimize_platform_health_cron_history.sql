-- The extension-owned history cannot be indexed by the project's postgres role.
-- Keep an indexed, private projection of the daily job instead. Provider history
-- remains untouched; subsequent syncs read the primary-key tail plus running rows.
CREATE SCHEMA IF NOT EXISTS admin_health_private;
REVOKE ALL ON SCHEMA admin_health_private FROM PUBLIC, anon, authenticated, service_role;
CREATE TABLE admin_health_private.scheduled_cron_runs (
  runid bigint PRIMARY KEY,
  jobid bigint NOT NULL,
  status text,
  start_time timestamptz,
  end_time timestamptz,
  return_message text
);
CREATE INDEX scheduled_cron_runs_job_time_idx ON admin_health_private.scheduled_cron_runs(jobid,start_time DESC);
CREATE TABLE admin_health_private.cron_sync_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  last_runid bigint NOT NULL DEFAULT 0,
  synced_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE admin_health_private.scheduled_cron_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_health_private.cron_sync_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA admin_health_private FROM PUBLIC, anon, authenticated, service_role;
INSERT INTO admin_health_private.cron_sync_state(singleton) VALUES(true);

CREATE FUNCTION admin_health_private.refresh_scheduled_cron_history()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  after_id bigint;
  through_id bigint;
BEGIN
  SELECT last_runid INTO after_id FROM admin_health_private.cron_sync_state WHERE singleton FOR UPDATE;
  SELECT coalesce(max(runid),0) INTO through_id FROM cron.job_run_details;
  -- Extension recreation can reset IDs. This table is only a derived projection.
  IF through_id < after_id THEN
    DELETE FROM admin_health_private.scheduled_cron_runs;
    after_id := 0;
  END IF;
  INSERT INTO admin_health_private.scheduled_cron_runs(runid,jobid,status,start_time,end_time,return_message)
  SELECT r.runid,r.jobid,r.status,r.start_time,r.end_time,left(r.return_message,500)
  FROM (
    SELECT runid,jobid,status,start_time,end_time,return_message FROM cron.job_run_details
    WHERE runid>greatest(after_id-1000,0) AND runid<=through_id
      AND jobid IN (SELECT jobid FROM cron.job WHERE jobname='daily-scheduled-emails')
    UNION
    SELECT r.runid,r.jobid,r.status,r.start_time,r.end_time,r.return_message FROM cron.job_run_details r
    JOIN admin_health_private.scheduled_cron_runs s USING(runid)
    WHERE s.status IS NULL OR s.status NOT IN ('succeeded','failed')
  ) r
  WHERE r.jobid IN (SELECT jobid FROM cron.job WHERE jobname='daily-scheduled-emails')
  ON CONFLICT(runid) DO UPDATE SET jobid=excluded.jobid,status=excluded.status,
    start_time=excluded.start_time,end_time=excluded.end_time,return_message=excluded.return_message;
  UPDATE admin_health_private.cron_sync_state SET last_runid=through_id,synced_at=clock_timestamp() WHERE singleton;
END $$;
REVOKE ALL ON FUNCTION admin_health_private.refresh_scheduled_cron_history() FROM PUBLIC, anon, authenticated, service_role;
SELECT admin_health_private.refresh_scheduled_cron_history();

-- Patch the existing protected cores in place, preserving their callers,
-- contracts, owner, ACLs, admin checks and all unrelated telemetry. Fail closed
-- if either expected relation reference has drifted.
DO $$
DECLARE routine regprocedure; definition text;
BEGIN
  FOREACH routine IN ARRAY ARRAY[
    'public.get_platform_health_core_v3(integer)'::regprocedure,
    'public.get_platform_health_incidents_core_v3(integer,integer)'::regprocedure
  ] LOOP
    definition := pg_get_functiondef(routine);
    IF position('cron.job_run_details r' IN definition)=0 THEN
      RAISE EXCEPTION 'Unexpected cron health definition: %',routine;
    END IF;
    definition := replace(definition,'cron.job_run_details r','admin_health_private.scheduled_cron_runs r');
    IF routine='public.get_platform_health_core_v3(integer)'::regprocedure THEN
      IF position('WHEN NOT v_cron_active THEN ''unconfigured''' IN definition)=0 THEN
        RAISE EXCEPTION 'Unexpected scheduler status contract';
      END IF;
      definition := replace(definition,
        'WHEN NOT v_cron_active THEN ''unconfigured''',
        'WHEN NOT v_cron_active THEN ''unconfigured''
        WHEN NOT EXISTS (SELECT 1 FROM admin_health_private.cron_sync_state WHERE singleton AND synced_at >= now()-interval ''5 minutes'') THEN ''degraded''');
      definition := replace(definition,
        'WHEN NOT v_cron_active THEN ''The daily scheduled-email job is missing or disabled.''',
        'WHEN NOT v_cron_active THEN ''The daily scheduled-email job is missing or disabled.''
        WHEN NOT EXISTS (SELECT 1 FROM admin_health_private.cron_sync_state WHERE singleton AND synced_at >= now()-interval ''5 minutes'') THEN ''Scheduled-job telemetry is stale; verify the health-history sync job.''');
      definition := replace(definition,
        '''cronActive'', v_cron_active,',
        '''cronSnapshotAt'', (SELECT synced_at FROM admin_health_private.cron_sync_state WHERE singleton), ''cronActive'', v_cron_active,');
      definition := replace(definition,'''cron.job_run_details and scheduled_email_runs''',
        '''Synchronized scheduled-job history and scheduled_email_runs''');
    END IF;
    EXECUTE definition;
  END LOOP;
END $$;
SELECT cron.schedule('sync-admin-health-cron-history','* * * * *',
  'select admin_health_private.refresh_scheduled_cron_history();');

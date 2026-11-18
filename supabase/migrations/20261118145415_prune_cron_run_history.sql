-- cron.job_run_details is append-only and pg_cron never trims it. Six jobs run
-- every minute (about 7,500 rows a day), so it had reached ~316k rows / 67 MB.
--
-- Safety notes:
--   * The platform-health page reads admin_health_private.scheduled_cron_runs,
--     not this table. That projection is neither read from nor changed here.
--   * refresh_scheduled_cron_history() resets its projection if max(runid)
--     ever falls below its high-water mark, so the newest run is never deleted.
--   * It also re-reads rows whose projected status is still in flight, so only
--     finished runs ('succeeded' / 'failed') are eligible.
--   * Failures are kept longer than successes because they are the rows an
--     operator actually investigates.
CREATE OR REPLACE FUNCTION admin_health_private.prune_cron_run_history()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted bigint;
BEGIN
  DELETE FROM cron.job_run_details
  WHERE runid < (SELECT max(runid) FROM cron.job_run_details)
    AND status IN ('succeeded', 'failed')
    AND (
      (status = 'succeeded' AND start_time < pg_catalog.now() - interval '7 days')
      OR (status = 'failed' AND start_time < pg_catalog.now() - interval '30 days')
    );
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END $$;

REVOKE ALL ON FUNCTION admin_health_private.prune_cron_run_history() FROM PUBLIC, anon, authenticated, service_role;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'prune-cron-run-history';
  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'prune-cron-run-history',
  '29 3 * * *',
  'select admin_health_private.prune_cron_run_history();'
);

-- Clear the existing backlog now instead of waiting for the first scheduled run.
SELECT admin_health_private.prune_cron_run_history();

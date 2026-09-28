-- Retention Copilot is prepared on demand from the admin panel.
-- Keep the jobs and their schedules for a simple, reversible restart.
DO $pause$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'quarter-hour-retention-autopilot';
  IF v_job_id IS NOT NULL THEN
    PERFORM cron.alter_job(job_id := v_job_id, active := false);
  END IF;

  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'daily-retention-autopilot-analysis';
  IF v_job_id IS NOT NULL THEN
    PERFORM cron.alter_job(job_id := v_job_id, active := false);
  END IF;
END;
$pause$;

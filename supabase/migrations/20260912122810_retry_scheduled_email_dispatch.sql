-- A single asynchronous pg_net request can be lost after pg_cron has already
-- reported that its SQL statement succeeded. Retry during a small UTC window,
-- and let the application claim the UTC date exactly once before it can send.

ALTER TABLE public.scheduled_email_runs
    ADD COLUMN IF NOT EXISTS scheduled_for date;

-- Preserve historical telemetry. If an environment contains old manual runs
-- on the same UTC date, only the first one becomes that date's canonical run.
WITH ranked_runs AS (
    SELECT id,
           (started_at AT TIME ZONE 'UTC')::date AS run_date,
           row_number() OVER (
               PARTITION BY (started_at AT TIME ZONE 'UTC')::date
               ORDER BY started_at, id
           ) AS run_number
    FROM public.scheduled_email_runs
    WHERE scheduled_for IS NULL
)
UPDATE public.scheduled_email_runs AS runs
SET scheduled_for = ranked_runs.run_date
FROM ranked_runs
WHERE runs.id = ranked_runs.id
  AND ranked_runs.run_number = 1;

ALTER TABLE public.scheduled_email_runs
    ALTER COLUMN scheduled_for
    SET DEFAULT ((now() AT TIME ZONE 'UTC')::date);

CREATE UNIQUE INDEX scheduled_email_runs_scheduled_for_idx
    ON public.scheduled_email_runs (scheduled_for);

DO $block$
DECLARE
    v_job_id bigint;
BEGIN
    SELECT jobid INTO v_job_id
    FROM cron.job
    WHERE jobname = 'daily-scheduled-emails';

    IF v_job_id IS NOT NULL THEN
        PERFORM cron.unschedule(v_job_id);
    END IF;
END;
$block$;

SELECT cron.schedule(
    'daily-scheduled-emails',
    '0 0-2 * * *',
    $cron$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
            || '/functions/v1/scheduled-emails',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'X-Scheduler-Secret',
            (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'scheduled_email_token')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 30000
    ) AS request_id;
    $cron$
);

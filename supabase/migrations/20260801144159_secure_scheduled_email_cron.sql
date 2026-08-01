-- Secure scheduled messaging with a purpose-specific random credential stored
-- in Vault. The Edge Function verifies this credential through a service-role
-- RPC, so the cron definition never contains the project's service-role key.

DO $block$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM vault.decrypted_secrets WHERE name = 'project_url'
    ) THEN
        PERFORM vault.create_secret(
            'https://zvrmvycajimjxghrnpgy.supabase.co',
            'project_url',
            'Supabase project URL used by database scheduled jobs'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM vault.decrypted_secrets WHERE name = 'scheduled_email_token'
    ) THEN
        PERFORM vault.create_secret(
            encode(extensions.gen_random_bytes(32), 'hex'),
            'scheduled_email_token',
            'Dedicated credential for the scheduled-emails Edge Function'
        );
    END IF;
END;
$block$;

CREATE OR REPLACE FUNCTION public.verify_scheduled_email_token(p_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
    SELECT
        COALESCE(auth.jwt()->>'role', '') = 'service_role'
        AND p_token IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM vault.decrypted_secrets
            WHERE name = 'scheduled_email_token'
              AND extensions.digest(decrypted_secret, 'sha256') =
                  extensions.digest(p_token, 'sha256')
        );
$function$;

REVOKE ALL ON FUNCTION public.verify_scheduled_email_token(text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_scheduled_email_token(text)
    TO service_role;

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
    '0 0 * * *',
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

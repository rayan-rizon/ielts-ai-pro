-- Add persisted evidence for communication jobs and extend Platform Health to
-- cover account provisioning, learner result delivery, email dispatch, and
-- scheduled automation. The existing v2 health functions remain as internal
-- core collectors so this migration does not duplicate their service logic.

CREATE TABLE IF NOT EXISTS public.email_delivery_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    email_type text NOT NULL,
    recipient_hash text,
    status text NOT NULL,
    provider_message_id text,
    error_message text,
    CONSTRAINT email_delivery_events_status_check
        CHECK (status IN ('accepted', 'failed', 'skipped'))
);

CREATE TABLE IF NOT EXISTS public.scheduled_email_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    status text NOT NULL DEFAULT 'running',
    candidates integer NOT NULL DEFAULT 0,
    accepted integer NOT NULL DEFAULT 0,
    skipped integer NOT NULL DEFAULT 0,
    failed integer NOT NULL DEFAULT 0,
    error_message text,
    CONSTRAINT scheduled_email_runs_status_check
        CHECK (status IN ('running', 'completed', 'failed')),
    CONSTRAINT scheduled_email_runs_counts_check
        CHECK (candidates >= 0 AND accepted >= 0 AND skipped >= 0 AND failed >= 0)
);

ALTER TABLE public.email_delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_email_runs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.email_delivery_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.scheduled_email_runs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.email_delivery_events TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.scheduled_email_runs TO service_role;

CREATE INDEX IF NOT EXISTS idx_email_delivery_events_created_status
    ON public.email_delivery_events (created_at DESC, status);
CREATE INDEX IF NOT EXISTS idx_scheduled_email_runs_started_status
    ON public.scheduled_email_runs (started_at DESC, status);

ALTER FUNCTION public.get_platform_health(integer)
    RENAME TO get_platform_health_core_v2;
REVOKE ALL ON FUNCTION public.get_platform_health_core_v2(integer)
    FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_platform_health(p_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_hours integer;
    v_since timestamptz;
    v_base jsonb;
    v_services jsonb;
    v_status text;
    v_auth_total bigint := 0;
    v_profile_total bigint := 0;
    v_orphan_profiles bigint := 0;
    v_oldest_orphan_hours numeric := 0;
    v_results_completed bigint := 0;
    v_results_failed bigint := 0;
    v_results_stuck bigint := 0;
    v_result_users bigint := 0;
    v_email_accepted bigint := 0;
    v_email_failed bigint := 0;
    v_email_skipped bigint := 0;
    v_email_error_rate numeric := 0;
    v_cron_active boolean := false;
    v_cron_last_status text;
    v_cron_last_run timestamptz;
    v_run_status text;
    v_run_started timestamptz;
    v_run_completed timestamptz;
    v_run_accepted integer := 0;
    v_run_failed integer := 0;
    v_run_age_hours numeric;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_hours := LEAST(GREATEST(COALESCE(p_hours, 24), 1), 24 * 90);
    v_since := now() - make_interval(hours => v_hours);
    v_base := public.get_platform_health_core_v2(v_hours);
    v_services := COALESCE(v_base->'services', '[]'::jsonb);

    -- Auth account creation and public profile creation are one transaction from
    -- the learner's perspective. Ignore the first 15 minutes to avoid alerting
    -- while the normal post-signup trigger/profile request is still in flight.
    SELECT count(*) INTO v_auth_total FROM auth.users WHERE created_at >= v_since;
    SELECT count(*) INTO v_profile_total FROM public.users WHERE created_at >= v_since;
    SELECT count(*),
           COALESCE(extract(epoch FROM (now() - min(a.created_at))) / 3600, 0)
    INTO v_orphan_profiles, v_oldest_orphan_hours
    FROM auth.users a
    LEFT JOIN public.users p ON p.auth_id = a.id
    WHERE p.id IS NULL AND a.created_at < now() - interval '15 minutes';

    v_status := CASE
        WHEN v_orphan_profiles >= 10 THEN 'down'
        WHEN v_orphan_profiles > 0 THEN 'degraded'
        ELSE 'operational'
    END;
    v_services := v_services || jsonb_build_object(
        'key', 'auth_provisioning', 'label', 'Account Provisioning',
        'category', 'platform', 'provider', 'Supabase Auth', 'status', v_status,
        'source', 'auth.users matched to public.users by auth_id',
        'metrics', jsonb_build_object('authAccountsInWindow', v_auth_total,
            'profilesInWindow', v_profile_total, 'orphanProfiles', v_orphan_profiles,
            'oldestOrphanHours', round(v_oldest_orphan_hours, 1)),
        'impact', CASE WHEN v_orphan_profiles = 0
            THEN 'Every established Auth account has a learner profile.'
            ELSE v_orphan_profiles || ' Auth account(s) have no learner profile and may be unable to use the app.' END
    );

    -- Only explicit failed evaluations and processing rows that exceeded the
    -- normal completion window are faults. "not_requested" writing sessions are
    -- valid and must not be reported as failures.
    SELECT count(*) FILTER (WHERE is_completed),
           count(*) FILTER (WHERE is_completed AND (
               lower(COALESCE(evaluation_status, '')) = 'failed'
               OR (lower(COALESCE(evaluation_status, '')) IN ('completed', 'succeeded')
                   AND score IS NULL AND band_score IS NULL))),
           count(*) FILTER (WHERE is_completed
               AND lower(COALESCE(evaluation_status, '')) IN ('pending', 'processing')
               AND updated_at < now() - interval '15 minutes'),
           count(DISTINCT user_id) FILTER (WHERE is_completed AND (
               lower(COALESCE(evaluation_status, '')) = 'failed'
               OR (lower(COALESCE(evaluation_status, '')) IN ('pending', 'processing')
                   AND updated_at < now() - interval '15 minutes')))
    INTO v_results_completed, v_results_failed, v_results_stuck, v_result_users
    FROM public.test_sessions
    WHERE created_at >= v_since;

    v_status := CASE
        WHEN v_results_failed + v_results_stuck = 0 THEN 'operational'
        WHEN v_results_failed + v_results_stuck >= 5 THEN 'down'
        ELSE 'degraded'
    END;
    v_services := v_services || jsonb_build_object(
        'key', 'test_result_delivery', 'label', 'Test Result Delivery',
        'category', 'content', 'provider', 'Evaluation pipeline', 'status', v_status,
        'source', 'test_sessions evaluation_status and result fields',
        'metrics', jsonb_build_object('completedSessions', v_results_completed,
            'failedEvaluations', v_results_failed, 'stuckEvaluations', v_results_stuck,
            'usersAffected', v_result_users),
        'impact', CASE WHEN v_results_failed + v_results_stuck = 0
            THEN 'No completed learner test is waiting on a failed or stalled evaluation.'
            ELSE (v_results_failed + v_results_stuck) || ' evaluation(s) failed or stalled across ' ||
                 v_result_users || ' learner(s).' END
    );

    SELECT count(*) FILTER (WHERE status = 'accepted'),
           count(*) FILTER (WHERE status = 'failed'),
           count(*) FILTER (WHERE status = 'skipped')
    INTO v_email_accepted, v_email_failed, v_email_skipped
    FROM public.email_delivery_events
    WHERE created_at >= v_since;
    v_email_error_rate := CASE WHEN v_email_accepted + v_email_failed > 0
        THEN 100.0 * v_email_failed / (v_email_accepted + v_email_failed) ELSE 0 END;
    v_status := CASE
        WHEN v_email_accepted + v_email_failed + v_email_skipped = 0 THEN 'idle'
        WHEN v_email_accepted + v_email_failed >= 5 AND v_email_error_rate >= 25 THEN 'down'
        WHEN v_email_failed > 0 THEN 'degraded'
        ELSE 'operational'
    END;
    v_services := v_services || jsonb_build_object(
        'key', 'email_dispatch', 'label', 'Transactional Email',
        'category', 'communications', 'provider', 'Resend', 'status', v_status,
        'source', 'persisted Resend dispatch outcomes',
        'metrics', jsonb_build_object('accepted', v_email_accepted,
            'failedDispatches', v_email_failed, 'skipped', v_email_skipped,
            'dispatchFailureRate', round(v_email_error_rate, 1)),
        'impact', CASE
            WHEN v_email_accepted + v_email_failed + v_email_skipped = 0 THEN 'No email dispatches were attempted in this window.'
            WHEN v_email_failed > 0 THEN v_email_failed || ' email dispatch(es) were rejected or failed.'
            ELSE 'Email dispatches were accepted by Resend.' END
    );

    SELECT COALESCE(bool_or(j.active), false), max(r.end_time),
           (array_agg(r.status ORDER BY r.start_time DESC) FILTER (WHERE r.start_time IS NOT NULL))[1]
    INTO v_cron_active, v_cron_last_run, v_cron_last_status
    FROM cron.job j
    LEFT JOIN cron.job_run_details r ON r.jobid = j.jobid
    WHERE j.jobname = 'daily-scheduled-emails';

    SELECT status, started_at, completed_at, accepted, failed
    INTO v_run_status, v_run_started, v_run_completed, v_run_accepted, v_run_failed
    FROM public.scheduled_email_runs
    ORDER BY started_at DESC LIMIT 1;
    v_run_age_hours := CASE WHEN v_run_started IS NULL THEN NULL
        ELSE extract(epoch FROM (now() - v_run_started)) / 3600 END;

    v_status := CASE
        WHEN NOT v_cron_active THEN 'unconfigured'
        WHEN v_cron_last_status = 'failed' THEN 'down'
        WHEN v_run_status = 'failed' THEN 'down'
        WHEN v_run_status = 'running' AND COALESCE(v_run_age_hours, 0) > 0.5 THEN 'degraded'
        WHEN v_run_started IS NULL OR COALESCE(v_run_age_hours, 999) > 36 THEN 'down'
        ELSE 'operational'
    END;
    v_services := v_services || jsonb_build_object(
        'key', 'scheduled_automation', 'label', 'Scheduled Messaging',
        'category', 'communications', 'provider', 'Supabase Cron + Edge Functions',
        'status', v_status, 'source', 'cron.job_run_details and scheduled_email_runs',
        'metrics', jsonb_build_object('cronActive', v_cron_active,
            'lastCronStatus', v_cron_last_status, 'lastRunAgeHours', round(COALESCE(v_run_age_hours, 0), 1),
            'lastRunAccepted', COALESCE(v_run_accepted, 0), 'lastRunFailed', COALESCE(v_run_failed, 0)),
        'impact', CASE
            WHEN NOT v_cron_active THEN 'The daily scheduled-email job is missing or disabled.'
            WHEN v_cron_last_status = 'failed' THEN 'The database scheduler failed before the email job could run.'
            WHEN v_run_status = 'failed' THEN 'The latest scheduled-email run failed.'
            WHEN v_run_started IS NULL THEN 'The scheduler is configured but no application run has been recorded.'
            WHEN COALESCE(v_run_age_hours, 999) > 36 THEN 'The daily email workflow has not completed within its expected window.'
            ELSE 'The daily messaging workflow completed within its expected window.' END
    );

    v_base := jsonb_set(v_base, '{services}', v_services, true);
    v_base := jsonb_set(v_base, '{contractVersion}', '3'::jsonb, true);
    v_base := jsonb_set(v_base, '{summary}', (
        SELECT COALESCE(jsonb_object_agg(status, n), '{}'::jsonb)
        FROM (SELECT s->>'status' status, count(*) n
              FROM jsonb_array_elements(v_services) s GROUP BY 1) counts
    ), true);
    RETURN v_base;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health(integer) TO authenticated;

ALTER FUNCTION public.get_platform_health_incidents(integer, integer)
    RENAME TO get_platform_health_incidents_core_v2;
REVOKE ALL ON FUNCTION public.get_platform_health_incidents_core_v2(integer, integer)
    FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_platform_health_incidents(
    p_hours integer DEFAULT 24,
    p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_since timestamptz;
    v_core jsonb;
    v_result jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    v_since := now() - make_interval(hours => LEAST(GREATEST(COALESCE(p_hours, 24), 1), 24 * 90));
    v_core := public.get_platform_health_incidents_core_v2(p_hours, p_limit);

    SELECT COALESCE(jsonb_agg(to_jsonb(i) ORDER BY i.last_seen DESC, i.occurrences DESC), '[]'::jsonb)
    INTO v_result
    FROM (
        SELECT service, left(message, 500) message, occurrences, last_seen, first_seen
        FROM jsonb_to_recordset(v_core) AS c(service text, message text, occurrences bigint,
            last_seen timestamptz, first_seen timestamptz)
        UNION ALL
        SELECT 'email_dispatch', left(COALESCE(NULLIF(error_message, ''), 'Email dispatch failed'), 500),
               count(*), max(created_at), min(created_at)
        FROM public.email_delivery_events
        WHERE created_at >= v_since AND status = 'failed'
        GROUP BY left(COALESCE(NULLIF(error_message, ''), 'Email dispatch failed'), 500)
        UNION ALL
        SELECT 'scheduled_automation', left(COALESCE(NULLIF(error_message, ''), 'Scheduled email run failed'), 500),
               count(*), max(started_at), min(started_at)
        FROM public.scheduled_email_runs
        WHERE started_at >= v_since AND status = 'failed'
        GROUP BY left(COALESCE(NULLIF(error_message, ''), 'Scheduled email run failed'), 500)
        UNION ALL
        SELECT 'test_result_delivery', 'A ' || test_type || ' evaluation failed',
               count(*), max(updated_at), min(updated_at)
        FROM public.test_sessions
        WHERE created_at >= v_since AND lower(COALESCE(evaluation_status, '')) = 'failed'
        GROUP BY test_type
        UNION ALL
        SELECT 'auth_provisioning', 'Auth account has no learner profile',
               count(*), max(a.created_at), min(a.created_at)
        FROM auth.users a LEFT JOIN public.users p ON p.auth_id = a.id
        WHERE p.id IS NULL AND a.created_at < now() - interval '15 minutes'
        HAVING count(*) > 0
        UNION ALL
        SELECT 'scheduled_automation', left(COALESCE(NULLIF(r.return_message, ''), 'Scheduled database job failed'), 500),
               count(*), max(r.end_time), min(r.start_time)
        FROM cron.job j JOIN cron.job_run_details r ON r.jobid = j.jobid
        WHERE j.jobname = 'daily-scheduled-emails' AND r.start_time >= v_since AND r.status = 'failed'
        GROUP BY left(COALESCE(NULLIF(r.return_message, ''), 'Scheduled database job failed'), 500)
        ORDER BY last_seen DESC
        LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200)
    ) i;
    RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health_incidents(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health_incidents(integer, integer) TO authenticated;

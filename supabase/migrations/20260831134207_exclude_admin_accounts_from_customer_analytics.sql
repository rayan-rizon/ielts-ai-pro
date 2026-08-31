-- Admin accounts exercise learner and billing flows during QA. Keep their
-- provider calls visible in AI usage/cost reporting, but exclude their profile,
-- practice, subscription, payment, acquisition, and activity rows from customer
-- analytics everywhere in the admin reporting surface.

CREATE OR REPLACE FUNCTION public.get_admin_overview(p_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_days integer; v_since timestamptz; v_prev timestamptz;
    v_signups bigint; v_signups_prev bigint; v_dau bigint; v_active bigint;
    v_mau bigint; v_active_prev bigint; v_total_users bigint;
    v_pro bigint; v_premium bigint;
    v_rev_usd numeric; v_rev_bdt numeric; v_rev_usd_prev numeric;
    v_ai_cost numeric; v_ai_cost_prev numeric; v_ai_priced bigint; v_ai_total bigint;
    v_customer_ai_cost numeric; v_customer_ai_priced bigint; v_customer_ai_total bigint;
    v_f_signed bigint; v_f_onboarded bigint; v_f_started bigint;
    v_f_completed bigint; v_f_paid bigint; v_f_subscribed bigint;
    v_pending_pay bigint; v_pending_oldest numeric;
    v_stuck bigint; v_cancelling bigint; v_expiring bigint; v_eval_failed bigint;
    v_started_users bigint; v_repeat_users bigint; v_power_users bigint;
    v_completed_tests bigint; v_mock bigint; v_practice bigint; v_other_modes bigint;
    v_trend jsonb; v_modules jsonb; v_recent jsonb; v_actions jsonb := '[]'::jsonb;
    v_retention jsonb; v_hours jsonb; v_channels jsonb;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;

    v_days := LEAST(GREATEST(COALESCE(p_days, 7), 1), 90);
    v_since := (date_trunc('day', now() AT TIME ZONE 'Asia/Dhaka')
        - make_interval(days => v_days - 1)) AT TIME ZONE 'Asia/Dhaka';
    v_prev := v_since - make_interval(days => v_days);

    SELECT count(*),
        count(*) FILTER (WHERE created_at >= v_since),
        count(*) FILTER (WHERE created_at >= v_prev AND created_at < v_since),
        count(*) FILTER (WHERE last_active > now() - interval '1 day'),
        count(*) FILTER (WHERE last_active >= v_since),
        count(*) FILTER (WHERE last_active > now() - interval '30 days'),
        count(*) FILTER (WHERE last_active >= v_prev AND last_active < v_since),
        count(*) FILTER (WHERE subscription_tier = 'pro'),
        count(*) FILTER (WHERE subscription_tier = 'premium'),
        count(*) FILTER (WHERE onboarding_completed),
        count(*) FILTER (WHERE cancel_at_period_end IS TRUE
            AND subscription_tier IN ('pro','premium')),
        count(*) FILTER (WHERE subscription_tier IN ('pro','premium')
            AND subscription_end_date IS NOT NULL
            AND subscription_end_date BETWEEN now() AND now() + interval '7 days')
    INTO v_total_users, v_signups, v_signups_prev, v_dau, v_active, v_mau,
         v_active_prev, v_pro, v_premium, v_f_onboarded, v_cancelling, v_expiring
    FROM public.users
    WHERE role IS DISTINCT FROM 'admin';

    v_f_signed := v_total_users;
    v_f_paid := v_pro + v_premium;

    SELECT
        count(DISTINCT ts.user_id) FILTER (WHERE u.onboarding_completed),
        count(DISTINCT ts.user_id) FILTER (WHERE u.onboarding_completed AND ts.is_completed),
        count(*) FILTER (WHERE ts.is_completed
            AND COALESCE(ts.completed_at, ts.created_at) >= v_since),
        count(*) FILTER (WHERE ts.test_mode = 'mock'),
        count(*) FILTER (WHERE ts.test_mode = 'practice'),
        count(*) FILTER (WHERE ts.test_mode IS NULL OR ts.test_mode NOT IN ('mock','practice')),
        count(*) FILTER (WHERE ts.evaluation_status = 'failed')
    INTO v_f_started, v_f_completed, v_completed_tests, v_mock, v_practice,
         v_other_modes, v_eval_failed
    FROM public.test_sessions ts
    JOIN public.users u ON u.id = ts.user_id
    WHERE u.role IS DISTINCT FROM 'admin';

    SELECT count(*) INTO v_f_subscribed
    FROM public.users u
    WHERE u.role IS DISTINCT FROM 'admin'
      AND u.onboarding_completed
      AND u.subscription_tier IN ('pro','premium')
      AND EXISTS (SELECT 1 FROM public.test_sessions ts
          WHERE ts.user_id = u.id AND ts.is_completed);

    SELECT count(*), count(*) FILTER (WHERE n >= 2), count(*) FILTER (WHERE n >= 5)
    INTO v_started_users, v_repeat_users, v_power_users
    FROM (
        SELECT ts.user_id, count(*) AS n
        FROM public.test_sessions ts
        JOIN public.users u ON u.id = ts.user_id
        WHERE u.role IS DISTINCT FROM 'admin'
        GROUP BY ts.user_id
    ) s;

    WITH paid AS (
        SELECT bh.amount, upper(bh.currency) AS currency, bh.created_at
        FROM public.billing_history bh
        WHERE bh.status = 'paid'
          AND NOT EXISTS (SELECT 1 FROM public.users u
              WHERE u.role = 'admin'
                AND (u.id = bh.user_id OR u.auth_id = bh.auth_id))
        UNION ALL
        SELECT pr.amount, upper(pr.currency), pr.created_at
        FROM public.payment_requests pr
        WHERE pr.status = 'approved'
          AND NOT EXISTS (SELECT 1 FROM public.users u
              WHERE u.role = 'admin' AND u.auth_id = pr.auth_id)
          AND NOT EXISTS (SELECT 1 FROM public.billing_history b
              WHERE b.status = 'paid' AND b.transaction_id IS NOT NULL
                AND b.transaction_id = pr.transaction_id)
    )
    SELECT
        COALESCE(sum(amount) FILTER (WHERE currency = 'USD' AND created_at >= v_since), 0),
        COALESCE(sum(amount) FILTER (WHERE currency = 'BDT' AND created_at >= v_since), 0),
        COALESCE(sum(amount) FILTER (WHERE currency = 'USD'
            AND created_at >= v_prev AND created_at < v_since), 0)
    INTO v_rev_usd, v_rev_bdt, v_rev_usd_prev FROM paid;

    -- Deliberately unfiltered: admin provider calls remain visible as AI usage.
    SELECT
        COALESCE(sum((request_metadata->>'estimatedProviderCostUsd')::numeric)
            FILTER (WHERE jsonb_typeof(request_metadata->'estimatedProviderCostUsd') = 'number'
                AND created_at >= v_since), 0),
        COALESCE(sum((request_metadata->>'estimatedProviderCostUsd')::numeric)
            FILTER (WHERE jsonb_typeof(request_metadata->'estimatedProviderCostUsd') = 'number'
                AND created_at >= v_prev AND created_at < v_since), 0),
        count(*) FILTER (WHERE jsonb_typeof(request_metadata->'estimatedProviderCostUsd') = 'number'
            AND created_at >= v_since),
        count(*) FILTER (WHERE created_at >= v_since)
    INTO v_ai_cost, v_ai_cost_prev, v_ai_priced, v_ai_total
    FROM public.ai_api_usage;

    -- Customer unit economics must use the same non-admin population as their
    -- denominators. Admin calls remain in the global AI totals above.
    SELECT
        COALESCE(sum((a.request_metadata->>'estimatedProviderCostUsd')::numeric)
            FILTER (WHERE jsonb_typeof(a.request_metadata->'estimatedProviderCostUsd') = 'number'
                AND a.created_at >= v_since), 0),
        count(*) FILTER (WHERE jsonb_typeof(a.request_metadata->'estimatedProviderCostUsd') = 'number'
            AND a.created_at >= v_since),
        count(*) FILTER (WHERE a.created_at >= v_since)
    INTO v_customer_ai_cost, v_customer_ai_priced, v_customer_ai_total
    FROM public.ai_api_usage a
    JOIN public.users u ON u.id = a.user_id
    WHERE u.role IS DISTINCT FROM 'admin';

    SELECT count(*) FILTER (WHERE pr.status = 'pending'),
        COALESCE(extract(epoch FROM (now() - min(pr.created_at)
            FILTER (WHERE pr.status = 'pending'))) / 3600, 0)
    INTO v_pending_pay, v_pending_oldest
    FROM public.payment_requests pr
    WHERE NOT EXISTS (SELECT 1 FROM public.users u
        WHERE u.role = 'admin' AND u.auth_id = pr.auth_id);

    -- Deliberately unfiltered: stuck reservations are AI-usage operations.
    SELECT count(*) INTO v_stuck FROM public.ai_api_usage
    WHERE request_metadata->>'reservationStatus' = 'reserved'
      AND created_at < now() - interval '1 hour'
      AND created_at >= now() - interval '30 days';

    IF v_pending_pay > 0 THEN v_actions := v_actions || jsonb_build_object(
        'key','pending_payments','label','Payment requests awaiting review','count',v_pending_pay,
        'severity','high','detail','Payment evidence was submitted and is waiting for admin verification.','tab','payments'); END IF;
    IF v_stuck > 0 THEN v_actions := v_actions || jsonb_build_object(
        'key','stuck_reservations','label','Stuck AI reservations','count',v_stuck,
        'severity',CASE WHEN v_stuck >= 10 THEN 'high' ELSE 'medium' END,
        'detail','Quota was consumed but the request never completed.','tab','ai-usage'); END IF;
    IF v_eval_failed > 0 THEN v_actions := v_actions || jsonb_build_object(
        'key','eval_failed','label','Test evaluations failed','count',v_eval_failed,
        'severity','high','detail','Learners finished a test but never received a score.','tab','ai-usage'); END IF;
    IF v_cancelling > 0 THEN v_actions := v_actions || jsonb_build_object(
        'key','cancelling','label','Subscriptions set to cancel','count',v_cancelling,
        'severity','medium','detail','Will not renew at the end of the current period.','tab','users'); END IF;
    IF v_expiring > 0 THEN v_actions := v_actions || jsonb_build_object(
        'key','expiring','label','Subscriptions expiring within 7 days','count',v_expiring,
        'severity','low','detail','Renewal or outreach window.','tab','users'); END IF;

    WITH spine AS (
        SELECT generate_series((v_since AT TIME ZONE 'Asia/Dhaka')::date,
            (now() AT TIME ZONE 'Asia/Dhaka')::date, interval '1 day')::date AS day
    ), su AS (
        SELECT (created_at AT TIME ZONE 'Asia/Dhaka')::date AS day, count(*) AS n
        FROM public.users WHERE role IS DISTINCT FROM 'admin' AND created_at >= v_since GROUP BY 1
    ), testers AS (
        SELECT (ts.created_at AT TIME ZONE 'Asia/Dhaka')::date AS day,
            count(DISTINCT ts.user_id) AS n, count(*) AS sessions
        FROM public.test_sessions ts JOIN public.users u ON u.id = ts.user_id
        WHERE u.role IS DISTINCT FROM 'admin' AND ts.created_at >= v_since GROUP BY 1
    )
    SELECT jsonb_agg(jsonb_build_object('date', to_char(spine.day, 'Mon DD'),
        'signups', COALESCE(su.n, 0), 'testUsers', COALESCE(testers.n, 0),
        'sessions', COALESCE(testers.sessions, 0)) ORDER BY spine.day)
    INTO v_trend FROM spine LEFT JOIN su ON su.day = spine.day
    LEFT JOIN testers ON testers.day = spine.day;

    WITH cohort AS (
        SELECT id, date_trunc('week', created_at AT TIME ZONE 'Asia/Dhaka')::date AS wk
        FROM public.users WHERE role IS DISTINCT FROM 'admin'
          AND created_at >= (date_trunc('week', now() AT TIME ZONE 'Asia/Dhaka')
              - interval '5 weeks') AT TIME ZONE 'Asia/Dhaka'
    ), act AS (
        SELECT DISTINCT ts.user_id,
            date_trunc('week', ts.created_at AT TIME ZONE 'Asia/Dhaka')::date AS wk
        FROM public.test_sessions ts JOIN public.users u ON u.id = ts.user_id
        WHERE u.role IS DISTINCT FROM 'admin'
          AND ts.created_at >= (date_trunc('week', now() AT TIME ZONE 'Asia/Dhaka')
              - interval '5 weeks') AT TIME ZONE 'Asia/Dhaka'
    ), joined AS (
        SELECT c.wk AS cohort_wk, c.id, ((a.wk - c.wk) / 7)::int AS week_offset
        FROM cohort c LEFT JOIN act a ON a.user_id = c.id AND a.wk >= c.wk
    ), rolled AS (
        SELECT cohort_wk, count(DISTINCT id) AS size,
            count(DISTINCT id) FILTER (WHERE week_offset = 0) AS w0,
            count(DISTINCT id) FILTER (WHERE week_offset = 1) AS w1,
            count(DISTINCT id) FILTER (WHERE week_offset = 2) AS w2,
            count(DISTINCT id) FILTER (WHERE week_offset = 3) AS w3
        FROM joined GROUP BY cohort_wk
    ), current_week AS (
        SELECT date_trunc('week', now() AT TIME ZONE 'Asia/Dhaka')::date AS wk
    )
    SELECT jsonb_agg(jsonb_build_object('cohort', to_char(rolled.cohort_wk, 'Mon DD'),
        'size', rolled.size, 'w0', rolled.w0,
        'w1', CASE WHEN rolled.cohort_wk <= current_week.wk - 7 THEN rolled.w1 END,
        'w2', CASE WHEN rolled.cohort_wk <= current_week.wk - 14 THEN rolled.w2 END,
        'w3', CASE WHEN rolled.cohort_wk <= current_week.wk - 21 THEN rolled.w3 END)
        ORDER BY rolled.cohort_wk)
    INTO v_retention FROM rolled CROSS JOIN current_week;

    WITH hrs AS (SELECT generate_series(0, 23) AS h), s AS (
        SELECT extract(hour FROM ts.created_at AT TIME ZONE 'Asia/Dhaka')::int AS h,
            count(*) AS n
        FROM public.test_sessions ts JOIN public.users u ON u.id = ts.user_id
        WHERE u.role IS DISTINCT FROM 'admin' AND ts.created_at >= now() - interval '30 days'
        GROUP BY 1
    )
    SELECT jsonb_agg(jsonb_build_object('hour', hrs.h, 'sessions', COALESCE(s.n, 0))
        ORDER BY hrs.h) INTO v_hours FROM hrs LEFT JOIN s ON s.h = hrs.h;

    SELECT jsonb_agg(t ORDER BY t.sessions DESC) INTO v_modules FROM (
        SELECT initcap(lower(ts.test_type)) AS module, count(DISTINCT ts.user_id) AS users,
            count(*) AS sessions,
            COALESCE(round(100.0 * count(*) FILTER (WHERE ts.is_completed)
                / NULLIF(count(*), 0), 1), 0) AS completion
        FROM public.test_sessions ts JOIN public.users u ON u.id = ts.user_id
        WHERE u.role IS DISTINCT FROM 'admin' AND ts.test_type IS NOT NULL
        GROUP BY lower(ts.test_type)
    ) t;

    SELECT jsonb_agg(t ORDER BY t.created_at DESC) INTO v_recent FROM (
        SELECT id, full_name, email, created_at, subscription_tier, onboarding_completed
        FROM public.users WHERE role IS DISTINCT FROM 'admin'
        ORDER BY created_at DESC LIMIT 8
    ) t;

    SELECT jsonb_agg(t ORDER BY t.signups DESC) INTO v_channels FROM (
        SELECT COALESCE(signup_channel, 'unknown') AS channel, count(*) AS signups
        FROM public.users WHERE role IS DISTINCT FROM 'admin' AND created_at >= v_since
        GROUP BY COALESCE(signup_channel, 'unknown')
    ) t;

    RETURN jsonb_build_object(
        'generatedAt', now(), 'windowDays', v_days, 'trendMetric', 'testUsers',
        'hourTimezone', 'Asia/Dhaka',
        'kpis', jsonb_build_object(
            'signups', jsonb_build_object('value',v_signups,'prev',v_signups_prev),
            'active', jsonb_build_object('value',v_active,'dau',v_dau,'mau',v_mau,
                'prev',v_active_prev,'stickiness',CASE WHEN v_mau > 0
                    THEN round(100.0 * v_dau / v_mau, 1) ELSE 0 END),
            'paying', jsonb_build_object('pro',v_pro,'premium',v_premium,'total',v_f_paid,
                'conversion',CASE WHEN v_total_users > 0
                    THEN round(100.0 * v_f_paid / v_total_users, 1) ELSE 0 END),
            'revenue', jsonb_build_object('usd',v_rev_usd,'bdt',v_rev_bdt,'prevUsd',v_rev_usd_prev),
            'aiCost', jsonb_build_object('usd',round(v_ai_cost,4),'prevUsd',round(v_ai_cost_prev,4),
                'pricedCalls',v_ai_priced,'totalCalls',v_ai_total,'perActiveUser',
                CASE WHEN v_active > 0 THEN round(v_customer_ai_cost / v_active, 4) ELSE 0 END)),
        'economics', jsonb_build_object(
            'costPerCompletedTest',CASE WHEN v_completed_tests > 0
                THEN round(v_customer_ai_cost / v_completed_tests, 4) ELSE 0 END,
            'costPerPayingUser',CASE WHEN v_f_paid > 0
                THEN round(v_customer_ai_cost / v_f_paid, 4) ELSE 0 END,
            'completedTests',v_completed_tests,'costCoverage',CASE WHEN v_customer_ai_total > 0
                THEN round(100.0 * v_customer_ai_priced / v_customer_ai_total, 1) ELSE 0 END),
        'engagement', jsonb_build_object('startedUsers',v_started_users,
            'repeatUsers',v_repeat_users,'powerUsers',v_power_users,
            'repeatRate',CASE WHEN v_started_users > 0
                THEN round(100.0 * v_repeat_users / v_started_users, 1) ELSE 0 END,
            'mockSessions',v_mock,'practiceSessions',v_practice,'otherModeSessions',v_other_modes),
        'funnel', jsonb_build_array(
            jsonb_build_object('key','signed_up','label','Signed up','users',v_f_signed),
            jsonb_build_object('key','onboarded','label','Finished onboarding','users',v_f_onboarded),
            jsonb_build_object('key','started','label','Started a test','users',v_f_started),
            jsonb_build_object('key','completed','label','Completed a test','users',v_f_completed),
            jsonb_build_object('key','paid','label','Completed + subscribed','users',v_f_subscribed)),
        'actions',v_actions,'trend',COALESCE(v_trend,'[]'::jsonb),
        'retention',COALESCE(v_retention,'[]'::jsonb),'hourly',COALESCE(v_hours,'[]'::jsonb),
        'modules',COALESCE(v_modules,'[]'::jsonb),'recentSignups',COALESCE(v_recent,'[]'::jsonb),
        'channels',COALESCE(v_channels,'[]'::jsonb),
        'totals',jsonb_build_object('users',v_total_users));
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_overview(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_overview(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_overview_with_signup_sources(p_days integer DEFAULT 7)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_overview jsonb; v_recent jsonb;
BEGIN
    v_overview := public.get_admin_overview(p_days);
    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC) INTO v_recent FROM (
        SELECT id, full_name, email, created_at, subscription_tier, onboarding_completed,
            COALESCE(signup_channel, 'unknown') AS signup_channel, signup_utm_source
        FROM public.users WHERE role IS DISTINCT FROM 'admin'
        ORDER BY created_at DESC LIMIT 8
    ) t;
    RETURN v_overview || jsonb_build_object('recentSignups',COALESCE(v_recent,'[]'::jsonb));
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_overview_with_signup_sources(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_overview_with_signup_sources(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_overview_actions()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_actions jsonb := '[]'::jsonb; v_pending_pay bigint; v_stuck bigint;
    v_eval_failed bigint; v_cancelling bigint; v_expiring bigint;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
    SELECT count(*) INTO v_pending_pay FROM public.payment_requests pr
    WHERE pr.status = 'pending' AND NOT EXISTS (SELECT 1 FROM public.users u
        WHERE u.role = 'admin' AND u.auth_id = pr.auth_id);
    -- Deliberately unfiltered AI-usage operational signal.
    SELECT count(*) INTO v_stuck FROM public.ai_api_usage
    WHERE request_metadata->>'reservationStatus' = 'reserved'
      AND created_at < now() - interval '1 hour'
      AND created_at >= now() - interval '30 days';
    SELECT count(*) INTO v_eval_failed FROM public.test_sessions ts
    JOIN public.users u ON u.id = ts.user_id
    WHERE u.role IS DISTINCT FROM 'admin' AND ts.is_completed
      AND ts.evaluation_status = 'failed'
      AND COALESCE(ts.updated_at, ts.created_at) >= now() - interval '24 hours';
    SELECT count(*) FILTER (WHERE cancel_at_period_end IS TRUE
            AND subscription_tier IN ('pro','premium') AND subscription_end_date > now()),
        count(*) FILTER (WHERE subscription_tier IN ('pro','premium')
            AND subscription_end_date BETWEEN now() AND now() + interval '7 days')
    INTO v_cancelling, v_expiring FROM public.users WHERE role IS DISTINCT FROM 'admin';
    IF v_pending_pay > 0 THEN v_actions := v_actions || jsonb_build_object(
        'key','pending_payments','label','Payment requests awaiting review','count',v_pending_pay,
        'severity','high','detail','Payment evidence was submitted and is waiting for admin verification.','tab','payments'); END IF;
    IF v_stuck > 0 THEN v_actions := v_actions || jsonb_build_object(
        'key','stuck_reservations','label','Stuck AI reservations','count',v_stuck,
        'severity',CASE WHEN v_stuck >= 10 THEN 'high' ELSE 'medium' END,
        'detail','Quota was consumed but the request never completed.','tab','ai-usage'); END IF;
    IF v_eval_failed > 0 THEN v_actions := v_actions || jsonb_build_object(
        'key','eval_failed','label','Test evaluations failed','count',v_eval_failed,
        'severity','high','detail','A completed test has not received a score in the last 24 hours.','tab','ai-usage'); END IF;
    IF v_cancelling > 0 THEN v_actions := v_actions || jsonb_build_object(
        'key','cancelling','label','Subscriptions set to cancel','count',v_cancelling,
        'severity','medium','detail','Will not renew at the end of the current paid period.',
        'tab','users','subscriptionStatus','cancelling'); END IF;
    IF v_expiring > 0 THEN v_actions := v_actions || jsonb_build_object(
        'key','expiring','label','Subscriptions expiring within 7 days','count',v_expiring,
        'severity','low','detail','Renewal or outreach window.',
        'tab','users','subscriptionStatus','expiring'); END IF;
    RETURN v_actions;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_overview_actions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_overview_actions() TO authenticated;

COMMENT ON FUNCTION public.get_admin_overview(integer) IS
'Admin overview excluding role=admin profiles and their customer activity, while retaining all AI usage.';
COMMENT ON FUNCTION public.get_admin_overview_with_signup_sources(integer) IS
'Admin overview with signup attribution; admin profiles are excluded from customer reporting.';
COMMENT ON FUNCTION public.get_admin_overview_actions() IS
'Current customer action queue excluding admin test, payment, and subscription state; AI signals remain global.';

CREATE OR REPLACE FUNCTION public.get_admin_analytics_intelligence(p_range text DEFAULT '30d')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
    v_days integer; v_since timestamptz;
    v_total_users bigint; v_new_users bigint; v_active_users bigint;
    v_testers bigint; v_completed bigint; v_paying bigint;
    v_onboarded bigint; v_started bigint; v_new_user_paid bigint;
    v_trend jsonb; v_recent jsonb;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
    v_days := CASE lower(coalesce(p_range,'30d'))
        WHEN '90d' THEN 90 WHEN '1y' THEN 365 ELSE 30 END;
    v_since := (date_trunc('day',now() AT TIME ZONE 'Asia/Dhaka')
        - make_interval(days => v_days - 1)) AT TIME ZONE 'Asia/Dhaka';

    SELECT count(*), count(*) FILTER (WHERE created_at >= v_since),
        count(*) FILTER (WHERE last_active >= v_since),
        count(*) FILTER (WHERE subscription_tier IN ('pro','premium'))
    INTO v_total_users,v_new_users,v_active_users,v_paying
    FROM public.users WHERE role IS DISTINCT FROM 'admin';

    SELECT count(DISTINCT ts.user_id), count(*) FILTER (WHERE ts.is_completed)
    INTO v_testers,v_completed FROM public.test_sessions ts
    JOIN public.users u ON u.id = ts.user_id
    WHERE u.role IS DISTINCT FROM 'admin' AND ts.created_at >= v_since;

    SELECT count(*) FILTER (WHERE u.onboarding_completed),
        count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.test_sessions ts
            WHERE ts.user_id = u.id)),
        count(*) FILTER (WHERE u.subscription_tier IN ('pro','premium'))
    INTO v_onboarded,v_started,v_new_user_paid FROM public.users u
    WHERE u.role IS DISTINCT FROM 'admin' AND u.created_at >= v_since;

    WITH spine AS (
        SELECT generate_series((v_since AT TIME ZONE 'Asia/Dhaka')::date,
            (now() AT TIME ZONE 'Asia/Dhaka')::date,interval '1 day')::date AS day
    ), signups AS (
        SELECT (created_at AT TIME ZONE 'Asia/Dhaka')::date AS day,count(*) AS n
        FROM public.users WHERE role IS DISTINCT FROM 'admin' AND created_at >= v_since GROUP BY 1
    ), practice AS (
        SELECT (ts.created_at AT TIME ZONE 'Asia/Dhaka')::date AS day,
            count(DISTINCT ts.user_id) AS users,
            count(*) FILTER (WHERE ts.is_completed) AS completions
        FROM public.test_sessions ts JOIN public.users u ON u.id = ts.user_id
        WHERE u.role IS DISTINCT FROM 'admin' AND ts.created_at >= v_since GROUP BY 1
    )
    SELECT jsonb_agg(jsonb_build_object(
        'date',to_char(spine.day,CASE WHEN v_days = 365 THEN 'Mon YY' ELSE 'Mon DD' END),
        'signups',coalesce(signups.n,0),'testers',coalesce(practice.users,0),
        'completions',coalesce(practice.completions,0)) ORDER BY spine.day)
    INTO v_trend FROM spine LEFT JOIN signups USING(day) LEFT JOIN practice USING(day);

    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC) INTO v_recent FROM (
        SELECT id,full_name,email,created_at,subscription_tier,onboarding_completed
        FROM public.users WHERE role IS DISTINCT FROM 'admin'
        ORDER BY created_at DESC LIMIT 8
    ) t;

    RETURN jsonb_build_object('windowDays',v_days,'totalUsers',v_total_users,
        'newUsers',v_new_users,'activeUsers',v_active_users,'testers',v_testers,
        'completedTests',v_completed,'payingUsers',v_paying,
        'conversionRate',CASE WHEN v_total_users > 0
            THEN round(100.0*v_paying/v_total_users,1) ELSE 0 END,
        'activationRate',CASE WHEN v_new_users > 0
            THEN round(100.0*v_onboarded/v_new_users,1) ELSE 0 END,
        'funnel',jsonb_build_array(
            jsonb_build_object('label','Signed up','users',v_new_users),
            jsonb_build_object('label','Finished onboarding','users',v_onboarded),
            jsonb_build_object('label','Started practice','users',v_started),
            jsonb_build_object('label','Paid','users',v_new_user_paid)),
        'trend',coalesce(v_trend,'[]'::jsonb),'recentSignups',coalesce(v_recent,'[]'::jsonb));
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_analytics_intelligence(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics_intelligence(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_revenue_intelligence(p_range text DEFAULT '30d')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
    v_days integer; v_since timestamptz; v_prev timestamptz;
    v_usd numeric; v_bdt numeric; v_prev_usd numeric; v_prev_bdt numeric;
    v_transactions bigint; v_prev_transactions bigint;
    v_subscribers bigint; v_cancelling bigint; v_expiring bigint; v_failed bigint;
    v_trend jsonb; v_methods jsonb; v_recent jsonb;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
    v_days := CASE lower(coalesce(p_range,'30d'))
        WHEN '90d' THEN 90 WHEN '1y' THEN 365 ELSE 30 END;
    v_since := (date_trunc('day',now() AT TIME ZONE 'Asia/Dhaka')
        - make_interval(days => v_days - 1)) AT TIME ZONE 'Asia/Dhaka';
    v_prev := v_since - make_interval(days => v_days);

    WITH paid AS (
        SELECT bh.id,bh.auth_id,bh.user_id,bh.amount,upper(bh.currency) AS currency,
            bh.tier,bh.billing_interval,bh.payment_method,bh.created_at
        FROM public.billing_history bh WHERE bh.status = 'paid'
          AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.role = 'admin'
              AND (u.id = bh.user_id OR u.auth_id = bh.auth_id))
        UNION ALL
        SELECT pr.id,pr.auth_id,NULL::uuid,pr.amount,upper(pr.currency),pr.tier,
            pr.interval,pr.payment_method,pr.created_at
        FROM public.payment_requests pr WHERE pr.status = 'approved'
          AND NOT EXISTS (SELECT 1 FROM public.users u
              WHERE u.role = 'admin' AND u.auth_id = pr.auth_id)
          AND NOT EXISTS (SELECT 1 FROM public.billing_history b WHERE b.status = 'paid'
              AND b.transaction_id IS NOT NULL AND b.transaction_id = pr.transaction_id)
    )
    SELECT coalesce(sum(amount) FILTER (WHERE currency='USD' AND created_at>=v_since),0),
        coalesce(sum(amount) FILTER (WHERE currency='BDT' AND created_at>=v_since),0),
        coalesce(sum(amount) FILTER (WHERE currency='USD' AND created_at>=v_prev AND created_at<v_since),0),
        coalesce(sum(amount) FILTER (WHERE currency='BDT' AND created_at>=v_prev AND created_at<v_since),0),
        count(*) FILTER (WHERE created_at>=v_since),
        count(*) FILTER (WHERE created_at>=v_prev AND created_at<v_since)
    INTO v_usd,v_bdt,v_prev_usd,v_prev_bdt,v_transactions,v_prev_transactions FROM paid;

    SELECT count(*) FILTER (WHERE subscription_tier IN ('pro','premium')),
        count(*) FILTER (WHERE subscription_tier IN ('pro','premium')
            AND cancel_at_period_end IS TRUE AND subscription_end_date>now()),
        count(*) FILTER (WHERE subscription_tier IN ('pro','premium')
            AND subscription_end_date BETWEEN now() AND now()+interval '7 days'),
        count(*) FILTER (WHERE payment_failed_at>=now()-interval '7 days')
    INTO v_subscribers,v_cancelling,v_expiring,v_failed
    FROM public.users WHERE role IS DISTINCT FROM 'admin';

    WITH paid AS (
        SELECT bh.amount,upper(bh.currency) AS currency,bh.payment_method,bh.created_at
        FROM public.billing_history bh WHERE bh.status='paid'
          AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.role='admin'
              AND (u.id=bh.user_id OR u.auth_id=bh.auth_id))
        UNION ALL
        SELECT pr.amount,upper(pr.currency),pr.payment_method,pr.created_at
        FROM public.payment_requests pr WHERE pr.status='approved'
          AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.role='admin' AND u.auth_id=pr.auth_id)
          AND NOT EXISTS (SELECT 1 FROM public.billing_history b WHERE b.status='paid'
              AND b.transaction_id IS NOT NULL AND b.transaction_id=pr.transaction_id)
    ), spine AS (
        SELECT generate_series((v_since AT TIME ZONE 'Asia/Dhaka')::date,
            (now() AT TIME ZONE 'Asia/Dhaka')::date,interval '1 day')::date AS day
    ), daily AS (
        SELECT (created_at AT TIME ZONE 'Asia/Dhaka')::date AS day,
            sum(amount) FILTER (WHERE currency='USD') AS usd,
            sum(amount) FILTER (WHERE currency='BDT') AS bdt,count(*) AS transactions
        FROM paid WHERE created_at>=v_since GROUP BY 1
    )
    SELECT jsonb_agg(jsonb_build_object(
        'date',to_char(spine.day,CASE WHEN v_days=365 THEN 'Mon YY' ELSE 'Mon DD' END),
        'revenueUsd',coalesce(daily.usd,0),'revenueBdt',coalesce(daily.bdt,0),
        'transactions',coalesce(daily.transactions,0)) ORDER BY spine.day)
    INTO v_trend FROM spine LEFT JOIN daily USING(day);

    WITH paid AS (
        SELECT bh.amount,upper(bh.currency) AS currency,
            coalesce(nullif(bh.payment_method,''),'unknown') AS method
        FROM public.billing_history bh WHERE bh.status='paid'
          AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.role='admin'
              AND (u.id=bh.user_id OR u.auth_id=bh.auth_id))
        UNION ALL
        SELECT pr.amount,upper(pr.currency),coalesce(nullif(pr.payment_method,''),'unknown')
        FROM public.payment_requests pr WHERE pr.status='approved'
          AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.role='admin' AND u.auth_id=pr.auth_id)
          AND NOT EXISTS (SELECT 1 FROM public.billing_history b WHERE b.status='paid'
              AND b.transaction_id IS NOT NULL AND b.transaction_id=pr.transaction_id)
    )
    SELECT jsonb_agg(jsonb_build_object('method',method,'currency',currency,
        'transactions',transactions,'amount',amount) ORDER BY transactions DESC)
    INTO v_methods FROM (SELECT method,currency,count(*) AS transactions,sum(amount) AS amount
        FROM paid GROUP BY method,currency) m;

    WITH paid AS (
        SELECT bh.id,bh.auth_id,bh.user_id,bh.amount,bh.currency,bh.tier,
            bh.billing_interval,bh.payment_method,bh.created_at
        FROM public.billing_history bh WHERE bh.status='paid'
          AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.role='admin'
              AND (u.id=bh.user_id OR u.auth_id=bh.auth_id))
        UNION ALL
        SELECT pr.id,pr.auth_id,NULL::uuid,pr.amount,pr.currency,pr.tier,pr.interval,
            pr.payment_method,pr.created_at FROM public.payment_requests pr
        WHERE pr.status='approved'
          AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.role='admin' AND u.auth_id=pr.auth_id)
          AND NOT EXISTS (SELECT 1 FROM public.billing_history b WHERE b.status='paid'
              AND b.transaction_id IS NOT NULL AND b.transaction_id=pr.transaction_id)
    )
    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC) INTO v_recent FROM (
        SELECT p.id,p.amount,p.currency,p.tier,p.billing_interval,p.payment_method,p.created_at,
            coalesce(ua.full_name,ub.full_name) AS full_name,coalesce(ua.email,ub.email) AS email
        FROM paid p LEFT JOIN public.users ua ON ua.auth_id=p.auth_id
        LEFT JOIN public.users ub ON ub.id=p.user_id AND p.auth_id IS NULL
        ORDER BY p.created_at DESC LIMIT 10
    ) t;

    RETURN jsonb_build_object('windowDays',v_days,'revenueUsd',v_usd,'revenueBdt',v_bdt,
        'previousUsd',v_prev_usd,'previousBdt',v_prev_bdt,'transactions',v_transactions,
        'previousTransactions',v_prev_transactions,'activeSubscribers',v_subscribers,
        'cancellingSubscribers',v_cancelling,'expiringSubscribers',v_expiring,
        'failedPayments',v_failed,'trend',coalesce(v_trend,'[]'::jsonb),
        'paymentMethods',coalesce(v_methods,'[]'::jsonb),
        'recentTransactions',coalesce(v_recent,'[]'::jsonb));
END;
$function$;

REVOKE ALL ON FUNCTION public.get_revenue_intelligence(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_revenue_intelligence(text) TO authenticated;

COMMENT ON FUNCTION public.get_admin_analytics_intelligence(text) IS
'Admin-only customer analytics excluding role=admin profiles and their practice activity.';
COMMENT ON FUNCTION public.get_revenue_intelligence(text) IS
'Admin-only settled customer revenue and renewal metrics excluding role=admin identities.';

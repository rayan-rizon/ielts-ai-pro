-- Fix remote DB functions that still reference the dropped is_super_admin column.
-- This migration uses CREATE OR REPLACE to update all affected functions.
-- On local DB this is a no-op (already clean from db reset).
-- On remote DB this fixes the broken function definitions.

--------------------------------------------------------------------
-- 1. Drop the is_super_admin() function if it still exists
--------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.is_super_admin();

--------------------------------------------------------------------
-- 2. Fix is_admin() — remove is_super_admin reference
--------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    -- Check specific admin email from JWT directly
    (auth.jwt() ->> 'email' = 'hex.ron07@gmail.com')
    OR
    -- Check role in public.users table
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin')
    );
$$;

--------------------------------------------------------------------
-- 3. Fix is_current_user_admin() — remove is_super_admin reference
--------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."is_current_user_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = auth.uid()
    AND (role = 'admin')
  );
$$;

--------------------------------------------------------------------
-- 4. Fix get_admin_dashboard_stats()
--------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."get_admin_dashboard_stats"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
DECLARE
    v_total_users bigint;
    v_premium_users bigint;
    v_total_questions bigint;
    v_total_passages bigint;
    v_completed_tests bigint;
    v_avg_score numeric;
    v_revenue numeric;
    v_users_last_30_days json;
    v_score_distribution json;
    v_recent_signups json;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = (select auth.uid()) 
        AND (role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Basic Counts
    SELECT count(*) INTO v_total_users FROM public.users;
    
    SELECT count(*) INTO v_premium_users 
    FROM public.users 
    WHERE subscription_tier IN ('pro', 'premium');
    
    SELECT count(*) INTO v_total_questions FROM public.questions;
    
    SELECT count(*) INTO v_total_passages FROM public.passages WHERE is_active = true;
    
    SELECT count(*) INTO v_completed_tests 
    FROM public.test_sessions 
    WHERE is_completed = true;
    
    SELECT COALESCE(AVG(score), 0) INTO v_avg_score 
    FROM public.test_sessions 
    WHERE is_completed = true AND score IS NOT NULL;

    -- Calculated/Simulated Revenue
    v_revenue := v_premium_users * 29.99;

    -- User Growth (Last 30 days)
    SELECT json_agg(t) INTO v_users_last_30_days
    FROM (
        SELECT 
            to_char(date_trunc('day', created_at), 'Mon DD') as date,
            count(*) as users
        FROM public.users
        WHERE created_at >= (now() - interval '30 days')
        GROUP BY 1, date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at)
    ) t;

    -- Score Distribution
    SELECT json_agg(t) INTO v_score_distribution
    FROM (
        SELECT 
            CASE 
                WHEN score BETWEEN 0 AND 4.5 THEN '0-4.5'
                WHEN score BETWEEN 5.0 AND 6.0 THEN '5.0-6.0'
                WHEN score BETWEEN 6.5 AND 7.0 THEN '6.5-7.0'
                WHEN score BETWEEN 7.5 AND 8.0 THEN '7.5-8.0'
                WHEN score >= 8.5 THEN '8.5+'
                ELSE 'Unknown'
            END as range,
            count(*) as count,
            100 as "fullMark"
        FROM public.test_sessions
        WHERE is_completed = true AND score IS NOT NULL
        GROUP BY 1
        ORDER BY 1
    ) t;

    -- Recent Signups (Last 5)
    SELECT json_agg(t) INTO v_recent_signups
    FROM (
        SELECT id, full_name, email, created_at, subscription_tier, avatar_url
        FROM public.users
        ORDER BY created_at DESC
        LIMIT 5
    ) t;

    RETURN json_build_object(
        'totalUsers', v_total_users,
        'premiumUsers', v_premium_users,
        'totalQuestions', v_total_questions,
        'totalPassages', v_total_passages,
        'completedTests', v_completed_tests,
        'avgScore', round(v_avg_score, 1),
        'totalRevenue', v_revenue,
        'userGrowthData', COALESCE(v_users_last_30_days, '[]'::json),
        'scoreDistribution', COALESCE(v_score_distribution, '[]'::json),
        'recentSignups', COALESCE(v_recent_signups, '[]'::json)
    );
END;
$_$;

--------------------------------------------------------------------
-- 5. Fix get_ai_usage_aggs()
--------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."get_ai_usage_aggs"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_total_calls bigint;
    v_cached_calls bigint;
    v_total_tokens bigint;
    v_unique_users bigint;
BEGIN
    -- Check Admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = (select auth.uid()) 
        AND (role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT 
        count(*),
        sum(CASE WHEN cached THEN 1 ELSE 0 END),
        sum(tokens_used),
        count(DISTINCT user_id)
    INTO 
        v_total_calls,
        v_cached_calls,
        v_total_tokens,
        v_unique_users
    FROM public.ai_api_usage;

    RETURN json_build_object(
        'totalApiCalls', COALESCE(v_total_calls, 0),
        'totalCachedCalls', COALESCE(v_cached_calls, 0),
        'totalTokens', COALESCE(v_total_tokens, 0),
        'uniqueUsers', COALESCE(v_unique_users, 0)
    );
END;
$$;

--------------------------------------------------------------------
-- 6. Fix get_ai_usage_stats_paginated()
--------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."get_ai_usage_stats_paginated"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_sort_field" "text" DEFAULT 'total_calls'::"text", "p_sort_dir" "text" DEFAULT 'desc'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_offset integer;
    v_total_users bigint;
    v_users_data json;
BEGIN
    -- Check Admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = (select auth.uid()) 
        AND (role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_offset := (p_page - 1) * p_page_size;

    WITH per_user_endpoint AS (
        SELECT 
            user_id,
            endpoint,
            count(*) as usage_count
        FROM public.ai_api_usage
        GROUP BY user_id, endpoint
    ),
    user_aggs AS (
        SELECT 
            u.id as user_id,
            u.full_name,
            u.email,
            u.avatar_url,
            (SELECT count(*) FROM public.ai_api_usage WHERE user_id = u.id) as total_calls,
            (SELECT count(*) FROM public.ai_api_usage WHERE user_id = u.id AND cached = true) as cached_calls,
            (SELECT sum(COALESCE(tokens_used, 0)) FROM public.ai_api_usage WHERE user_id = u.id) as total_tokens,
            (SELECT max(created_at) FROM public.ai_api_usage WHERE user_id = u.id) as last_activity,
            (SELECT sum(COALESCE(tokens_used, 0)) * 0.0000002 FROM public.ai_api_usage WHERE user_id = u.id) as estimated_cost,
            (
                SELECT json_object_agg(endpoint, usage_count)
                FROM per_user_endpoint
                WHERE user_id = u.id
            ) as endpoints
        FROM public.users u
        WHERE EXISTS (SELECT 1 FROM public.ai_api_usage WHERE user_id = u.id)
    ),
    sorted_users AS (
        SELECT *, count(*) OVER() as full_count
        FROM user_aggs
        ORDER BY 
            CASE WHEN p_sort_dir = 'asc' THEN
                CASE 
                    WHEN p_sort_field = 'totalCalls' THEN total_calls
                    WHEN p_sort_field = 'totalTokens' THEN total_tokens
                    ELSE total_calls
                END
            END ASC,
            CASE WHEN p_sort_dir = 'desc' THEN
                CASE 
                    WHEN p_sort_field = 'totalCalls' THEN total_calls
                    WHEN p_sort_field = 'totalTokens' THEN total_tokens
                    ELSE total_calls
                END
            END DESC NULLS LAST
        LIMIT p_page_size OFFSET v_offset
    )
    SELECT json_agg(row_to_json(sorted_users.*)), max(full_count)
    INTO v_users_data, v_total_users
    FROM sorted_users;

    RETURN json_build_object(
        'data', COALESCE(v_users_data, '[]'::json),
        'total', COALESCE(v_total_users, 0),
        'page', p_page,
        'pageSize', p_page_size
    );
END;
$$;

--------------------------------------------------------------------
-- 7. Fix get_daily_api_usage_stats()
--------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."get_daily_api_usage_stats"("p_start_date" timestamp with time zone DEFAULT ("now"() - '30 days'::interval)) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_daily_data json;
BEGIN
    -- Check Admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = (select auth.uid()) 
        AND (role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT json_agg(t ORDER BY t.date)
    INTO v_daily_data
    FROM (
        SELECT 
            to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as date,
            count(*) as total,
            sum(CASE WHEN cached THEN 1 ELSE 0 END) as cached,
            json_object_agg(
                endpoint, 
                1
            ) as endpoints
        FROM public.ai_api_usage
        WHERE created_at >= p_start_date
        GROUP BY date_trunc('day', created_at)
    ) t;

    RETURN COALESCE(v_daily_data, '[]'::json);
END;
$$;

--------------------------------------------------------------------
-- 8. Fix get_revenue_analytics()
--------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."get_revenue_analytics"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_total_revenue numeric;
    v_monthly_revenue json;
    v_revenue_by_tier json;
    v_recent_transactions json;
    v_active_subscribers bigint;
    v_pro_count bigint;
    v_premium_count bigint;
    v_arpu numeric;
    v_stripe_revenue numeric;
    v_manual_revenue numeric;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = (select auth.uid()) 
        AND (role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Total revenue from billing_history
    SELECT COALESCE(SUM(amount), 0) INTO v_total_revenue 
    FROM public.billing_history
    WHERE status = 'paid';

    -- Stripe vs Manual revenue breakdown
    SELECT COALESCE(SUM(amount), 0) INTO v_stripe_revenue 
    FROM public.billing_history
    WHERE status = 'paid' AND payment_method = 'stripe';

    SELECT COALESCE(SUM(amount), 0) INTO v_manual_revenue 
    FROM public.billing_history
    WHERE status = 'paid' AND payment_method != 'stripe';

    -- Monthly revenue (last 6 months)
    SELECT json_agg(t) INTO v_monthly_revenue
    FROM (
        SELECT 
            to_char(date_trunc('month', created_at), 'Mon YYYY') as month,
            to_char(date_trunc('month', created_at), 'Mon') as label,
            SUM(amount) as revenue,
            COUNT(*) as transactions
        FROM public.billing_history
        WHERE status = 'paid' 
          AND created_at >= (now() - interval '6 months')
        GROUP BY date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at)
    ) t;

    -- Revenue by tier
    SELECT json_agg(t) INTO v_revenue_by_tier
    FROM (
        SELECT 
            tier,
            SUM(amount) as revenue,
            COUNT(*) as count
        FROM public.billing_history
        WHERE status = 'paid'
        GROUP BY tier
    ) t;

    -- Recent transactions (last 10)
    SELECT json_agg(t) INTO v_recent_transactions
    FROM (
        SELECT 
            bh.id,
            bh.amount,
            bh.currency,
            bh.tier,
            bh.billing_interval,
            bh.payment_method,
            bh.created_at,
            u.full_name,
            u.email,
            u.avatar_url
        FROM public.billing_history bh
        LEFT JOIN public.users u ON u.auth_id = bh.auth_id
        WHERE bh.status = 'paid'
        ORDER BY bh.created_at DESC
        LIMIT 10
    ) t;

    -- Active subscriber counts
    SELECT COUNT(*) INTO v_active_subscribers
    FROM public.users 
    WHERE subscription_tier IN ('pro', 'premium');

    SELECT COUNT(*) INTO v_pro_count
    FROM public.users 
    WHERE subscription_tier = 'pro';

    SELECT COUNT(*) INTO v_premium_count
    FROM public.users 
    WHERE subscription_tier = 'premium';

    -- ARPU calculation
    IF v_active_subscribers > 0 THEN
        v_arpu := ROUND(v_total_revenue / v_active_subscribers, 2);
    ELSE
        v_arpu := 0;
    END IF;

    RETURN json_build_object(
        'totalRevenue', v_total_revenue,
        'stripeRevenue', v_stripe_revenue,
        'manualRevenue', v_manual_revenue,
        'monthlyRevenue', COALESCE(v_monthly_revenue, '[]'::json),
        'revenueByTier', COALESCE(v_revenue_by_tier, '[]'::json),
        'recentTransactions', COALESCE(v_recent_transactions, '[]'::json),
        'activeSubscribers', v_active_subscribers,
        'proCount', v_pro_count,
        'premiumCount', v_premium_count,
        'arpu', v_arpu,
        'ltv', ROUND(v_arpu * 12, 2)
    );
END;
$$;

--------------------------------------------------------------------
-- 9. Fix get_system_stats()
--------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."get_system_stats"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    error_count_24h integer;
    warning_count_24h integer;
    db_size text;
    active_connections integer;
    ai_errors_24h integer;
    stripe_errors_24h integer;
    ai_total_calls integer;
begin
    -- Check Admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = (select auth.uid()) 
        AND (role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Get general error counts for last 24h
    select count(*) into error_count_24h
    from public.system_health_logs
    where level = 'error'
    and created_at > now() - interval '24 hours';

    select count(*) into warning_count_24h
    from public.system_health_logs
    where level = 'warning'
    and created_at > now() - interval '24 hours';

    -- Get Specific AI Errors (from logs)
    select count(*) into ai_errors_24h
    from public.system_health_logs
    where level = 'error'
    and component ilike '%AI%'
    and created_at > now() - interval '24 hours';

    -- Get AI calls count for last 24h
    select count(*) into ai_total_calls
    from public.ai_api_usage
    where created_at > now() - interval '24 hours';

    -- Get Stripe/Payment Errors (from logs)
    select count(*) into stripe_errors_24h
    from public.system_health_logs
    where level = 'error'
    and (component ilike '%Stripe%' or component ilike '%Payment%')
    and created_at > now() - interval '24 hours';

    -- Get DB size (approximate)
    select pg_catalog.pg_size_pretty(pg_catalog.pg_database_size(pg_catalog.current_database())) into db_size;

    -- Get active connections count
    begin
        select count(*) into active_connections
        from pg_catalog.pg_stat_activity;
    exception when others then
        active_connections := -1;
    end;
    
    return jsonb_build_object(
        'error_count_24h', error_count_24h,
        'warning_count_24h', warning_count_24h,
        'db_size', db_size,
        'active_connections', active_connections,
        'ai_errors_24h', ai_errors_24h,
        'ai_total_calls_24h', ai_total_calls,
        'payment_errors_24h', stripe_errors_24h,
        'last_updated', now()
    );
end;
$$;

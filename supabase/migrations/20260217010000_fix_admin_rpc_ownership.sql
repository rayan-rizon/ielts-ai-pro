-- =======================================================================
-- Fix AI Usage Stats — Show ALL registered users, not just those with usage
-- =======================================================================

-- 1. Rewrite get_ai_usage_stats_paginated()
--    Root cause: WHERE EXISTS(...) on line 241 of original definition
--    excluded every user who had zero AI usage records.
-- =======================================================================
CREATE OR REPLACE FUNCTION "public"."get_ai_usage_stats_paginated"(
    "p_page" integer DEFAULT 1,
    "p_page_size" integer DEFAULT 20,
    "p_sort_field" "text" DEFAULT 'total_calls'::"text",
    "p_sort_dir" "text" DEFAULT 'desc'::"text"
) RETURNS json
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
            a.user_id,
            a.endpoint,
            count(*) as usage_count
        FROM public.ai_api_usage a
        GROUP BY a.user_id, a.endpoint
    ),
    user_aggs AS (
        SELECT
            u.id as user_id,
            u.full_name,
            u.email,
            u.avatar_url,
            COALESCE((SELECT count(*) FROM public.ai_api_usage a WHERE a.user_id = u.id), 0) as total_calls,
            COALESCE((SELECT count(*) FROM public.ai_api_usage a WHERE a.user_id = u.id AND a.cached = true), 0) as cached_calls,
            COALESCE((SELECT sum(COALESCE(a.tokens_used, 0)) FROM public.ai_api_usage a WHERE a.user_id = u.id), 0) as total_tokens,
            (SELECT max(a.created_at) FROM public.ai_api_usage a WHERE a.user_id = u.id) as last_activity,
            COALESCE((SELECT sum(COALESCE(a.tokens_used, 0)) * 0.0000002 FROM public.ai_api_usage a WHERE a.user_id = u.id), 0) as estimated_cost,
            (
                SELECT json_object_agg(pe.endpoint, pe.usage_count)
                FROM per_user_endpoint pe
                WHERE pe.user_id = u.id
            ) as endpoints
        FROM public.users u
        -- *** REMOVED: WHERE EXISTS clause that filtered out zero-usage users ***
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

-- 2. Fix get_ai_usage_aggs() — add totalUsers count (all registered users)
-- =======================================================================
CREATE OR REPLACE FUNCTION "public"."get_ai_usage_aggs"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
AS $$
DECLARE
    v_total_calls bigint;
    v_cached_calls bigint;
    v_total_tokens bigint;
    v_unique_users bigint;
    v_total_users bigint;
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

    -- Count ALL registered users
    SELECT count(*) INTO v_total_users FROM public.users;

    RETURN json_build_object(
        'totalApiCalls', COALESCE(v_total_calls, 0),
        'totalCachedCalls', COALESCE(v_cached_calls, 0),
        'totalTokens', COALESCE(v_total_tokens, 0),
        'uniqueUsers', COALESCE(v_unique_users, 0),
        'totalUsers', COALESCE(v_total_users, 0)
    );
END;
$$;

-- 3. Ensure correct ownership for SECURITY DEFINER bypass
ALTER FUNCTION "public"."get_ai_usage_stats_paginated"(integer, integer, text, text) OWNER TO "postgres";
ALTER FUNCTION "public"."get_ai_usage_aggs"() OWNER TO "postgres";
ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";
ALTER FUNCTION "public"."is_current_user_admin"() OWNER TO "postgres";
ALTER FUNCTION "public"."get_admin_dashboard_stats"() OWNER TO "postgres";
ALTER FUNCTION "public"."get_daily_api_usage_stats"(timestamp with time zone) OWNER TO "postgres";
ALTER FUNCTION "public"."get_revenue_analytics"() OWNER TO "postgres";
ALTER FUNCTION "public"."get_system_stats"() OWNER TO "postgres";

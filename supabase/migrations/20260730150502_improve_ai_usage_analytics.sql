-- Make admin AI analytics truthful about request lifecycle and provider cost.
-- Historical rows without a reservation status are treated as completed legacy usage.

CREATE OR REPLACE FUNCTION public.get_ai_usage_stats_paginated(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20,
  p_sort_field text DEFAULT 'totalCalls',
  p_sort_dir text DEFAULT 'desc'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_page integer := GREATEST(COALESCE(p_page, 1), 1);
  v_page_size integer := LEAST(GREATEST(COALESCE(p_page_size, 20), 1), 100);
  v_sort_field text := CASE
    WHEN p_sort_field IN ('name', 'totalCalls', 'completedCalls', 'pendingCalls', 'failedCalls', 'cachedCalls', 'totalTokens', 'cost', 'lastActivity')
      THEN p_sort_field
    ELSE 'totalCalls'
  END;
  v_sort_dir text := CASE WHEN lower(p_sort_dir) = 'asc' THEN 'asc' ELSE 'desc' END;
  v_total_users bigint := 0;
  v_users_data json := '[]'::json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  WITH usage_rows AS (
    SELECT
      a.user_id,
      a.endpoint,
      a.cached,
      a.tokens_used,
      a.created_at,
      CASE
        WHEN a.request_metadata ->> 'reservationStatus' = 'reserved' THEN 'pending'
        WHEN a.request_metadata ->> 'reservationStatus' = 'failed' THEN 'failed'
        ELSE 'completed'
      END AS usage_status,
      CASE
        WHEN jsonb_typeof(a.request_metadata -> 'estimatedProviderCostUsd') = 'number'
          THEN (a.request_metadata ->> 'estimatedProviderCostUsd')::numeric
        WHEN jsonb_typeof(a.request_metadata -> 'estimatedProviderCostUsd') = 'string'
          AND (a.request_metadata ->> 'estimatedProviderCostUsd') ~ '^[0-9]+(\.[0-9]+)?$'
          THEN (a.request_metadata ->> 'estimatedProviderCostUsd')::numeric
        ELSE NULL
      END AS tracked_provider_cost
    FROM public.ai_api_usage a
  ),
  endpoint_counts AS (
    SELECT user_id, endpoint, count(*) AS request_count
    FROM usage_rows
    WHERE usage_status = 'completed'
    GROUP BY user_id, endpoint
  ),
  user_aggs AS (
    SELECT
      u.id AS user_id,
      u.full_name,
      u.email,
      u.avatar_url,
      count(ur.user_id) AS total_calls,
      count(ur.user_id) FILTER (WHERE ur.usage_status = 'completed') AS completed_calls,
      count(ur.user_id) FILTER (WHERE ur.usage_status = 'pending') AS pending_calls,
      count(ur.user_id) FILTER (WHERE ur.usage_status = 'failed') AS failed_calls,
      count(ur.user_id) FILTER (WHERE ur.usage_status = 'completed' AND ur.cached IS TRUE) AS cached_calls,
      COALESCE(sum(ur.tokens_used) FILTER (WHERE ur.usage_status = 'completed'), 0) AS total_tokens,
      COALESCE(sum(ur.tracked_provider_cost) FILTER (WHERE ur.usage_status = 'completed'), 0) AS tracked_provider_cost,
      count(ur.user_id) FILTER (WHERE ur.usage_status = 'completed' AND ur.tracked_provider_cost IS NULL) AS unpriced_completed_calls,
      max(ur.created_at) AS last_activity,
      COALESCE((
        SELECT json_object_agg(ec.endpoint, ec.request_count)
        FROM endpoint_counts ec
        WHERE ec.user_id = u.id
      ), '{}'::json) AS endpoints
    FROM public.users u
    LEFT JOIN usage_rows ur ON ur.user_id = u.id
    GROUP BY u.id, u.full_name, u.email, u.avatar_url
  ),
  sorted_users AS (
    SELECT *, count(*) OVER() AS full_count
    FROM user_aggs
    ORDER BY
      CASE WHEN v_sort_dir = 'asc' AND v_sort_field = 'name' THEN lower(coalesce(full_name, email, '')) END ASC,
      CASE WHEN v_sort_dir = 'desc' AND v_sort_field = 'name' THEN lower(coalesce(full_name, email, '')) END DESC,
      CASE WHEN v_sort_dir = 'asc' AND v_sort_field = 'totalCalls' THEN total_calls END ASC,
      CASE WHEN v_sort_dir = 'desc' AND v_sort_field = 'totalCalls' THEN total_calls END DESC,
      CASE WHEN v_sort_dir = 'asc' AND v_sort_field = 'completedCalls' THEN completed_calls END ASC,
      CASE WHEN v_sort_dir = 'desc' AND v_sort_field = 'completedCalls' THEN completed_calls END DESC,
      CASE WHEN v_sort_dir = 'asc' AND v_sort_field = 'pendingCalls' THEN pending_calls END ASC,
      CASE WHEN v_sort_dir = 'desc' AND v_sort_field = 'pendingCalls' THEN pending_calls END DESC,
      CASE WHEN v_sort_dir = 'asc' AND v_sort_field = 'failedCalls' THEN failed_calls END ASC,
      CASE WHEN v_sort_dir = 'desc' AND v_sort_field = 'failedCalls' THEN failed_calls END DESC,
      CASE WHEN v_sort_dir = 'asc' AND v_sort_field = 'cachedCalls' THEN cached_calls END ASC,
      CASE WHEN v_sort_dir = 'desc' AND v_sort_field = 'cachedCalls' THEN cached_calls END DESC,
      CASE WHEN v_sort_dir = 'asc' AND v_sort_field = 'totalTokens' THEN total_tokens END ASC,
      CASE WHEN v_sort_dir = 'desc' AND v_sort_field = 'totalTokens' THEN total_tokens END DESC,
      CASE WHEN v_sort_dir = 'asc' AND v_sort_field = 'cost' THEN tracked_provider_cost END ASC,
      CASE WHEN v_sort_dir = 'desc' AND v_sort_field = 'cost' THEN tracked_provider_cost END DESC,
      CASE WHEN v_sort_dir = 'asc' AND v_sort_field = 'lastActivity' THEN last_activity END ASC NULLS LAST,
      CASE WHEN v_sort_dir = 'desc' AND v_sort_field = 'lastActivity' THEN last_activity END DESC NULLS LAST,
      lower(coalesce(full_name, email, '')) ASC
    LIMIT v_page_size
    OFFSET (v_page - 1) * v_page_size
  )
  SELECT COALESCE(json_agg(row_to_json(sorted_users)), '[]'::json), COALESCE(max(full_count), 0)
  INTO v_users_data, v_total_users
  FROM sorted_users;

  RETURN json_build_object(
    'data', v_users_data,
    'total', v_total_users,
    'page', v_page,
    'pageSize', v_page_size
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ai_usage_aggs()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_data json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  WITH usage_rows AS (
    SELECT
      a.user_id,
      a.cached,
      a.tokens_used,
      CASE
        WHEN a.request_metadata ->> 'reservationStatus' = 'reserved' THEN 'pending'
        WHEN a.request_metadata ->> 'reservationStatus' = 'failed' THEN 'failed'
        ELSE 'completed'
      END AS usage_status,
      CASE
        WHEN jsonb_typeof(a.request_metadata -> 'estimatedProviderCostUsd') = 'number'
          THEN (a.request_metadata ->> 'estimatedProviderCostUsd')::numeric
        WHEN jsonb_typeof(a.request_metadata -> 'estimatedProviderCostUsd') = 'string'
          AND (a.request_metadata ->> 'estimatedProviderCostUsd') ~ '^[0-9]+(\.[0-9]+)?$'
          THEN (a.request_metadata ->> 'estimatedProviderCostUsd')::numeric
        ELSE NULL
      END AS tracked_provider_cost
    FROM public.ai_api_usage a
  )
  SELECT json_build_object(
    'totalRequests', count(*),
    'completedCalls', count(*) FILTER (WHERE usage_status = 'completed'),
    'pendingCalls', count(*) FILTER (WHERE usage_status = 'pending'),
    'failedCalls', count(*) FILTER (WHERE usage_status = 'failed'),
    'totalCachedCalls', count(*) FILTER (WHERE usage_status = 'completed' AND cached IS TRUE),
    'totalTokens', COALESCE(sum(tokens_used) FILTER (WHERE usage_status = 'completed'), 0),
    'uniqueUsers', count(DISTINCT user_id) FILTER (WHERE usage_status = 'completed'),
    'trackedProviderCost', COALESCE(sum(tracked_provider_cost) FILTER (WHERE usage_status = 'completed'), 0),
    'pricedCompletedCalls', count(*) FILTER (WHERE usage_status = 'completed' AND tracked_provider_cost IS NOT NULL),
    'unpricedCompletedCalls', count(*) FILTER (WHERE usage_status = 'completed' AND tracked_provider_cost IS NULL),
    'totalUsers', (SELECT count(*) FROM public.users)
  )
  INTO v_data
  FROM usage_rows;

  RETURN v_data;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_api_usage_stats(
  p_start_date timestamp with time zone DEFAULT (now() - interval '30 days')
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_start_date date := COALESCE((p_start_date AT TIME ZONE 'UTC')::date, (now() AT TIME ZONE 'UTC')::date - 30);
  v_daily_data json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  WITH days AS (
    SELECT generate_series(v_start_date, (now() AT TIME ZONE 'UTC')::date, interval '1 day')::date AS usage_date
  ),
  usage_rows AS (
    SELECT
      (a.created_at AT TIME ZONE 'UTC')::date AS usage_date,
      a.cached,
      a.tokens_used,
      CASE
        WHEN a.request_metadata ->> 'reservationStatus' = 'reserved' THEN 'pending'
        WHEN a.request_metadata ->> 'reservationStatus' = 'failed' THEN 'failed'
        ELSE 'completed'
      END AS usage_status
    FROM public.ai_api_usage a
    WHERE a.created_at >= v_start_date::timestamp AT TIME ZONE 'UTC'
  )
  SELECT COALESCE(json_agg(json_build_object(
    'date', to_char(d.usage_date, 'YYYY-MM-DD'),
    'total', count(ur.usage_date),
    'completed', count(ur.usage_date) FILTER (WHERE ur.usage_status = 'completed'),
    'pending', count(ur.usage_date) FILTER (WHERE ur.usage_status = 'pending'),
    'failed', count(ur.usage_date) FILTER (WHERE ur.usage_status = 'failed'),
    'cached', count(ur.usage_date) FILTER (WHERE ur.usage_status = 'completed' AND ur.cached IS TRUE),
    'tokens', COALESCE(sum(ur.tokens_used) FILTER (WHERE ur.usage_status = 'completed'), 0)
  ) ORDER BY d.usage_date), '[]'::json)
  INTO v_daily_data
  FROM days d
  LEFT JOIN usage_rows ur ON ur.usage_date = d.usage_date;

  RETURN v_daily_data;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ai_usage_endpoint_stats(
  p_start_date timestamp with time zone DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_data json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  WITH usage_rows AS (
    SELECT
      a.endpoint,
      a.cached,
      CASE
        WHEN a.request_metadata ->> 'reservationStatus' = 'reserved' THEN 'pending'
        WHEN a.request_metadata ->> 'reservationStatus' = 'failed' THEN 'failed'
        ELSE 'completed'
      END AS usage_status
    FROM public.ai_api_usage a
    WHERE p_start_date IS NULL OR a.created_at >= p_start_date
  )
  SELECT COALESCE(json_agg(json_build_object(
    'endpoint', endpoint,
    'total', total,
    'completed', completed,
    'pending', pending,
    'failed', failed,
    'cached', cached,
    'cacheHitRate', CASE WHEN completed > 0 THEN round((cached::numeric / completed) * 100, 1) ELSE 0 END
  ) ORDER BY completed DESC, total DESC, endpoint ASC), '[]'::json)
  INTO v_data
  FROM (
    SELECT
      endpoint,
      count(*) AS total,
      count(*) FILTER (WHERE usage_status = 'completed') AS completed,
      count(*) FILTER (WHERE usage_status = 'pending') AS pending,
      count(*) FILTER (WHERE usage_status = 'failed') AS failed,
      count(*) FILTER (WHERE usage_status = 'completed' AND cached IS TRUE) AS cached
    FROM usage_rows
    GROUP BY endpoint
  ) endpoint_aggs;

  RETURN v_data;
END;
$$;

ALTER FUNCTION public.get_ai_usage_stats_paginated(integer, integer, text, text) OWNER TO postgres;
ALTER FUNCTION public.get_ai_usage_aggs() OWNER TO postgres;
ALTER FUNCTION public.get_daily_api_usage_stats(timestamp with time zone) OWNER TO postgres;
ALTER FUNCTION public.get_ai_usage_endpoint_stats(timestamp with time zone) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.get_ai_usage_stats_paginated(integer, integer, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_ai_usage_aggs() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_daily_api_usage_stats(timestamp with time zone) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_ai_usage_endpoint_stats(timestamp with time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_usage_stats_paginated(integer, integer, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_ai_usage_aggs() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_daily_api_usage_stats(timestamp with time zone) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_ai_usage_endpoint_stats(timestamp with time zone) TO authenticated, service_role;

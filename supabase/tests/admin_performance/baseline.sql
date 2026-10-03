CREATE OR REPLACE FUNCTION public.get_ai_usage_stats_paginated(p_page integer DEFAULT 1, p_page_size integer DEFAULT 20, p_sort_field text DEFAULT 'totalCalls'::text, p_sort_dir text DEFAULT 'desc'::text)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$;


CREATE OR REPLACE FUNCTION public.get_marketing_dashboard(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  WITH campaign_metrics AS (
    SELECT c.id, c.name, c.status, c.objective, c.channels, c.created_at,
      count(DISTINCT d.user_id) FILTER (WHERE d.status NOT IN ('skipped','failed')) AS reach,
      count(DISTINCT d.id) FILTER (WHERE d.status IN ('delivered','viewed','clicked')) AS delivered,
      count(DISTINCT e.user_id) FILTER (WHERE e.event_type = 'viewed') AS views,
      count(DISTINCT e.user_id) FILTER (WHERE e.event_type = 'clicked') AS clicks,
      count(DISTINCT e.user_id) FILTER (WHERE e.event_type = 'checkout_started') AS checkouts,
      count(DISTINCT b.user_id) FILTER (WHERE b.status IN ('completed','paid','succeeded','approved')) AS purchases,
      count(DISTINCT d.id) FILTER (WHERE d.status = 'failed') AS failed,
      count(DISTINCT d.id) FILTER (WHERE d.status = 'skipped') AS skipped,
      count(DISTINCT d.id) FILTER (
        WHERE d.status = 'skipped' AND d.failure_reason = 'marketing_consent_required'
      ) AS consent_excluded
    FROM public.marketing_campaigns c
    LEFT JOIN public.marketing_deliveries d ON d.campaign_id = c.id
    LEFT JOIN public.marketing_events e ON e.campaign_id = c.id AND e.occurred_at >= now() - make_interval(days => GREATEST(p_days, 1))
    LEFT JOIN public.billing_history b ON b.marketing_campaign_id = c.id AND b.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
    GROUP BY c.id
  ), revenues AS (
    SELECT marketing_campaign_id AS id, currency,
      sum(amount) FILTER (WHERE status IN ('completed','paid','succeeded','approved')) AS net,
      sum(COALESCE(gross_amount, amount)) FILTER (WHERE status IN ('completed','paid','succeeded','approved')) AS gross,
      sum(discount_amount) FILTER (WHERE status IN ('completed','paid','succeeded','approved')) AS discount
    FROM public.billing_history
    WHERE marketing_campaign_id IS NOT NULL
      AND created_at >= now() - make_interval(days => GREATEST(p_days, 1))
    GROUP BY marketing_campaign_id, currency
  )
  SELECT jsonb_build_object(
    'campaigns', COALESCE((SELECT jsonb_agg(to_jsonb(cm) || jsonb_build_object(
      'ctr', CASE WHEN cm.views > 0 THEN round(100.0 * cm.clicks / cm.views, 1) ELSE 0 END,
      'conversion_rate', CASE WHEN cm.reach > 0 THEN round(100.0 * cm.purchases / cm.reach, 1) ELSE 0 END
    ) ORDER BY cm.created_at DESC) FROM campaign_metrics cm), '[]'::jsonb),
    'revenue', COALESCE((SELECT jsonb_agg(to_jsonb(r)) FROM revenues r), '[]'::jsonb),
    'totals', jsonb_build_object(
      'active', (SELECT count(*) FROM public.marketing_campaigns WHERE status IN ('active','scheduled')),
      'reach', COALESCE((SELECT sum(reach) FROM campaign_metrics), 0),
      'clicks', COALESCE((SELECT sum(clicks) FROM campaign_metrics), 0),
      'purchases', COALESCE((SELECT sum(purchases) FROM campaign_metrics), 0)
    )
  ) INTO v_result;
  RETURN v_result;
END;
$function$;

create temp table baseline_ai as select public.get_ai_usage_stats_paginated(1,20,'totalCalls','desc')::jsonb result;
create temp table baseline_marketing as select public.get_marketing_dashboard(30) result;

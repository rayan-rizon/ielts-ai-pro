-- Preserve row ownership and MFA-aware authorization; cache only within one statement.
SET lock_timeout = '5s';
CREATE INDEX IF NOT EXISTS payment_requests_history_cursor_idx
  ON public.payment_requests(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS payment_requests_status_history_cursor_idx
  ON public.payment_requests(status,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS notifications_history_cursor_idx
  ON public.notifications(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS billing_history_institution_cursor_idx
  ON public.billing_history(created_at DESC,id DESC) WHERE institution_id IS NOT NULL;
-- Admin summaries intentionally expose only aggregates/bounded pages.
-- Every entry point checks the caller's live, MFA-aware admin authorization.
ALTER POLICY users_select_policy ON public.users
  USING (auth_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
ALTER POLICY api_usage_select_policy ON public.ai_api_usage
  USING (user_id = (SELECT u.id FROM public.users u WHERE u.auth_id = (SELECT auth.uid()))
         OR (SELECT public.is_admin()));
-- An ALL policy's implicit WITH CHECK follows its USING expression. Preserve that rule.
ALTER POLICY sessions_all_policy ON public.test_sessions
  USING (user_id = (SELECT public.get_my_public_user_id()) OR (SELECT public.is_admin()));

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
      max(ur.created_at) AS last_activity
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
      lower(coalesce(full_name, email, '')) ASC, user_id ASC
    LIMIT v_page_size
    OFFSET (v_page - 1) * v_page_size
  ),
  endpoint_counts AS (
    -- Endpoint detail is needed only for the selected page, not every user.
    SELECT ur.user_id, ur.endpoint, count(*) AS request_count
    FROM usage_rows ur
    JOIN sorted_users su ON su.user_id = ur.user_id
    WHERE ur.usage_status = 'completed'
    GROUP BY ur.user_id, ur.endpoint
  ),
  page_rows AS (
    SELECT su.*, COALESCE((
      SELECT json_object_agg(ec.endpoint, ec.request_count)
      FROM endpoint_counts ec WHERE ec.user_id = su.user_id
    ), '{}'::json) AS endpoints
    FROM sorted_users su
  )
  SELECT COALESCE((SELECT json_agg(row_to_json(page_rows)) FROM page_rows), '[]'::json),
         (SELECT count(*) FROM user_aggs)
  INTO v_users_data, v_total_users;

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
  WITH delivery_metrics AS (
    SELECT d.campaign_id,
      count(DISTINCT d.user_id) FILTER (WHERE d.status NOT IN ('skipped','failed')) AS reach,
      count(*) FILTER (WHERE d.status IN ('delivered','viewed','clicked')) AS delivered,
      count(*) FILTER (WHERE d.status = 'failed') AS failed,
      count(*) FILTER (WHERE d.status = 'skipped') AS skipped,
      count(*) FILTER (WHERE d.status = 'skipped' AND d.failure_reason = 'marketing_consent_required') AS consent_excluded
    FROM public.marketing_deliveries d GROUP BY d.campaign_id
  ), event_metrics AS (
    SELECT e.campaign_id,
      count(DISTINCT e.user_id) FILTER (WHERE e.event_type = 'viewed') AS views,
      count(DISTINCT e.user_id) FILTER (WHERE e.event_type = 'clicked') AS clicks,
      count(DISTINCT e.user_id) FILTER (WHERE e.event_type = 'checkout_started') AS checkouts
    FROM public.marketing_events e
    WHERE e.occurred_at >= now() - make_interval(days => GREATEST(p_days, 1))
    GROUP BY e.campaign_id
  ), purchase_metrics AS (
    SELECT b.marketing_campaign_id AS campaign_id,
      count(DISTINCT b.user_id) FILTER (WHERE b.status IN ('completed','paid','succeeded','approved')) AS purchases
    FROM public.billing_history b
    WHERE b.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
    GROUP BY b.marketing_campaign_id
  ), campaign_metrics AS (
    SELECT c.id, c.name, c.status, c.objective, c.channels, c.created_at,
      COALESCE(d.reach,0) AS reach, COALESCE(d.delivered,0) AS delivered,
      COALESCE(e.views,0) AS views, COALESCE(e.clicks,0) AS clicks,
      COALESCE(e.checkouts,0) AS checkouts, COALESCE(b.purchases,0) AS purchases,
      COALESCE(d.failed,0) AS failed, COALESCE(d.skipped,0) AS skipped,
      COALESCE(d.consent_excluded,0) AS consent_excluded
    FROM public.marketing_campaigns c
    LEFT JOIN delivery_metrics d ON d.campaign_id = c.id
    LEFT JOIN event_metrics e ON e.campaign_id = c.id
    LEFT JOIN purchase_metrics b ON b.campaign_id = c.id
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
    ) ORDER BY cm.created_at DESC,cm.id ASC) FROM campaign_metrics cm), '[]'::jsonb),
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


CREATE OR REPLACE FUNCTION public.get_ai_coach_budget_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  cfg ai_coach_private.settings;
  spend numeric;
begin
  if auth.uid() is null or public.is_admin() is not true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  select * into strict cfg from ai_coach_private.settings where id;
  select coalesce(sum(case when state = 'pending' then reserved_cost
    else coalesce(actual_cost, reserved_cost) end), 0) into spend
    from ai_coach_private.operations
    where state in ('pending','complete','failed')
      and created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  return jsonb_build_object(
    'enabled', cfg.enabled,
    'spentUsd', spend,
    'budgetUsd', cfg.daily_budget_usd,
    'warningUsd', cfg.warning_budget_usd,
    'warning', spend >= cfg.warning_budget_usd,
    'exhausted', spend + cfg.reserved_request_cost_usd > cfg.daily_budget_usd,
    'resetsAt', date_trunc('day', now() at time zone 'UTC') at time zone 'UTC' + interval '1 day'
  );
end
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_referral_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE='42501';
  END IF;
  WITH totals AS (
    SELECT referrer_id, count(*) AS n FROM public.user_referrals GROUP BY referrer_id
  ), leaders AS (
    SELECT t.referrer_id AS id, COALESCE(u.full_name,u.email,'Unknown') AS name,
      u.email, t.n AS count FROM totals t LEFT JOIN public.users u ON u.id=t.referrer_id
    ORDER BY t.n DESC, t.referrer_id LIMIT 10
  )
  SELECT jsonb_build_object('totalReferrals',COALESCE((SELECT sum(n) FROM totals),0),
    'topReferrers',COALESCE((SELECT jsonb_agg(to_jsonb(l) ORDER BY l.count DESC,l.id) FROM leaders l),'[]'::jsonb))
  INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_admin_referral_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_referral_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_broadcast_page(
  p_before_date timestamptz DEFAULT NULL, p_before_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE entries jsonb; result jsonb;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE='42501';
  END IF;
  IF (p_before_date IS NULL) <> (p_before_id IS NULL) THEN
    RAISE EXCEPTION 'Invalid cursor' USING ERRCODE='22023';
  END IF;
  WITH page AS (
    SELECT n.* FROM public.notifications n
    WHERE p_before_date IS NULL OR (n.created_at,n.id)<(p_before_date,p_before_id)
    ORDER BY n.created_at DESC,n.id DESC LIMIT 26
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(p) || jsonb_build_object('read_count',
    (SELECT count(*) FROM public.notification_reads r WHERE r.notification_id=p.id AND r.read_at IS NOT NULL))
    ORDER BY p.created_at DESC,p.id DESC),'[]'::jsonb) INTO entries FROM page p;
  SELECT jsonb_build_object('live',count(*) FILTER (WHERE is_active IS DISTINCT FROM false
      AND (starts_at IS NULL OR starts_at<=now()) AND (expires_at IS NULL OR expires_at>now())),
    'scheduled',count(*) FILTER (WHERE is_active IS DISTINCT FROM false AND starts_at>now()),
    'paused',count(*) FILTER (WHERE is_active=false),
    'expired',count(*) FILTER (WHERE is_active IS DISTINCT FROM false
      AND (starts_at IS NULL OR starts_at<=now()) AND expires_at<=now()),
    'reads',(SELECT count(*) FROM public.notification_reads WHERE read_at IS NOT NULL))
  INTO result FROM public.notifications;
  RETURN jsonb_build_object('entries',entries,'stats',result);
END $$;
REVOKE ALL ON FUNCTION public.admin_broadcast_page(timestamptz,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_broadcast_page(timestamptz,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_payment_requests_page(
  p_status text DEFAULT 'all', p_search text DEFAULT '',
  p_before_date timestamptz DEFAULT NULL, p_before_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE entries jsonb;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE='42501';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('all','pending','approved','rejected','refunded')
    OR p_search IS NULL OR length(p_search)>160
    OR (p_before_date IS NULL)<>(p_before_id IS NULL) THEN
    RAISE EXCEPTION 'Invalid payment filters' USING ERRCODE='22023';
  END IF;
  WITH page AS (
    SELECT p.*, CASE WHEN u.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id',u.id,'full_name',u.full_name,'email',u.email) END AS "user"
    FROM public.payment_requests p LEFT JOIN public.users u ON u.auth_id=p.auth_id
    WHERE (p_status='all' OR p.status=p_status)
      AND (p_before_date IS NULL OR (p.created_at,p.id)<(p_before_date,p_before_id))
      AND (btrim(p_search)='' OR
        strpos(lower(concat_ws(' ',p.transaction_id,p.sender_phone,p.payment_method,u.full_name,u.email)),lower(btrim(p_search)))>0)
    ORDER BY p.created_at DESC,p.id DESC LIMIT 51
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC,p.id DESC),'[]'::jsonb)
  INTO entries FROM page p;
  RETURN jsonb_build_object('entries',entries);
END $$;
REVOKE ALL ON FUNCTION public.admin_payment_requests_page(text,text,timestamptz,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_payment_requests_page(text,text,timestamptz,uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';

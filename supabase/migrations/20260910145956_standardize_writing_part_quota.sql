-- The admin Writing limits are full evaluation allowances. One full evaluation
-- consists of any two completed Task 1/Task 2 reviews, even when those reviews
-- belong to different test sessions. Internally the reservation RPC therefore
-- works in part reviews while the configured limits remain human-sized values.

-- Repair this month's undercount caused by the old cache-before-quota path.
-- We only add the aggregate gap between saved task feedback and already
-- recorded usage, so provider-backed reviews are not counted twice.
WITH saved_part_reviews AS (
  SELECT ts.user_id, count(*)::integer AS part_count
  FROM public.test_sessions ts
  CROSS JOIN LATERAL jsonb_object_keys(
    COALESCE(ts.content_data -> 'ai_feedbacks', '{}'::jsonb)
  ) AS feedback_task(task_name)
  WHERE ts.test_type = 'writing'
    AND ts.evaluation_status = 'complete'
    AND ts.updated_at >= date_trunc('month', current_date)
    AND feedback_task.task_name IN ('Task 1', 'Task 2')
  GROUP BY ts.user_id
), recorded_part_reviews AS (
  SELECT user_id, count(*)::integer AS part_count
  FROM public.ai_api_usage
  WHERE endpoint = 'generateDetailedFeedback'
    AND created_at >= date_trunc('month', current_date)
    AND COALESCE(request_metadata ->> 'reservationStatus', 'completed') <> 'failed'
  GROUP BY user_id
), missing_part_reviews AS (
  SELECT
    saved.user_id,
    greatest(saved.part_count - COALESCE(recorded.part_count, 0), 0) AS part_count
  FROM saved_part_reviews saved
  LEFT JOIN recorded_part_reviews recorded USING (user_id)
)
INSERT INTO public.ai_api_usage (
  user_id,
  endpoint,
  tokens_used,
  cached,
  request_metadata,
  created_at
)
SELECT
  missing.user_id,
  'generateDetailedFeedback',
  0,
  true,
  jsonb_build_object(
    'reservationStatus', 'completed',
    'source', 'writing_cache_quota_backfill'
  ),
  timezone('utc', now())
FROM missing_part_reviews missing
CROSS JOIN LATERAL generate_series(1, missing.part_count) AS part_review(sequence_number)
WHERE missing.part_count > 0;

CREATE OR REPLACE FUNCTION public.get_user_daily_usage(
  p_user_id uuid,
  p_endpoint text DEFAULT NULL::text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.can_access_user_id(p_user_id) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  SELECT count(*)::integer INTO v_count
  FROM public.ai_api_usage
  WHERE user_id = p_user_id
    AND (p_endpoint IS NULL OR endpoint = p_endpoint)
    AND created_at >= current_date
    -- A cached Writing result still consumes a learner entitlement. Other AI
    -- features retain the existing provider-usage-only accounting contract.
    AND (p_endpoint = 'generateDetailedFeedback' OR cached = false)
    AND COALESCE(request_metadata ->> 'reservationStatus', 'completed') <> 'failed';

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_monthly_usage(
  p_user_id uuid,
  p_endpoint text DEFAULT NULL::text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.can_access_user_id(p_user_id) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  SELECT count(*)::integer INTO v_count
  FROM public.ai_api_usage
  WHERE user_id = p_user_id
    AND (p_endpoint IS NULL OR endpoint = p_endpoint)
    AND created_at >= date_trunc('month', current_date)
    AND (p_endpoint = 'generateDetailedFeedback' OR cached = false)
    AND COALESCE(request_metadata ->> 'reservationStatus', 'completed') <> 'failed';

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_user_rate_limit(
  p_user_id uuid,
  p_tier text,
  p_feature_type text DEFAULT NULL
)
RETURNS TABLE(
  allowed boolean,
  daily_remaining integer,
  monthly_remaining integer,
  daily_used integer,
  monthly_used integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_daily_limit integer;
  v_monthly_limit integer;
  v_daily_used integer;
  v_monthly_used integer;
  v_bonus_writing integer;
  v_bonus_speaking integer;
  v_bonus_expiry timestamptz;
  v_endpoint_filter text;
  v_currency text;
  v_effective_tier text;
  v_target_role text;
  v_caller_profile public.users%ROWTYPE;
BEGIN
  SELECT * INTO v_caller_profile
  FROM public.users
  WHERE auth_id = auth.uid();

  IF auth.role() <> 'service_role' THEN
    IF v_caller_profile.id IS NULL THEN
      RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
    END IF;

    IF v_caller_profile.role <> 'admin' AND v_caller_profile.id <> p_user_id THEN
      RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT
    COALESCE(lower(subscription_tier), 'free'),
    role,
    COALESCE(upper(subscription_currency), 'ALL')
  INTO v_effective_tier, v_target_role, v_currency
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_target_role = 'admin' THEN
    v_effective_tier := 'admin';
  END IF;

  IF p_feature_type = 'writing' THEN
    SELECT trl.writing_daily_limit, trl.writing_monthly_limit
    INTO v_daily_limit, v_monthly_limit
    FROM public.tier_rate_limits trl
    WHERE trl.tier = v_effective_tier
      AND (trl.currency = v_currency OR trl.currency = 'ALL')
    ORDER BY CASE WHEN trl.currency = v_currency THEN 1 ELSE 2 END
    LIMIT 1;
  ELSIF p_feature_type = 'speaking' THEN
    SELECT trl.speaking_daily_limit, trl.speaking_monthly_limit
    INTO v_daily_limit, v_monthly_limit
    FROM public.tier_rate_limits trl
    WHERE trl.tier = v_effective_tier
      AND (trl.currency = v_currency OR trl.currency = 'ALL')
    ORDER BY CASE WHEN trl.currency = v_currency THEN 1 ELSE 2 END
    LIMIT 1;
  ELSE
    SELECT trl.daily_limit, trl.monthly_limit
    INTO v_daily_limit, v_monthly_limit
    FROM public.tier_rate_limits trl
    WHERE trl.tier = v_effective_tier
      AND (trl.currency = v_currency OR trl.currency = 'ALL')
    ORDER BY CASE WHEN trl.currency = v_currency THEN 1 ELSE 2 END
    LIMIT 1;
  END IF;

  IF v_daily_limit IS NULL THEN
    IF p_feature_type = 'writing' THEN
      SELECT trl.writing_daily_limit, trl.writing_monthly_limit
      INTO v_daily_limit, v_monthly_limit
      FROM public.tier_rate_limits trl
      WHERE trl.tier = 'free'
        AND (trl.currency = v_currency OR trl.currency = 'ALL')
      ORDER BY CASE WHEN trl.currency = v_currency THEN 1 ELSE 2 END
      LIMIT 1;
    ELSIF p_feature_type = 'speaking' THEN
      SELECT trl.speaking_daily_limit, trl.speaking_monthly_limit
      INTO v_daily_limit, v_monthly_limit
      FROM public.tier_rate_limits trl
      WHERE trl.tier = 'free'
        AND (trl.currency = v_currency OR trl.currency = 'ALL')
      ORDER BY CASE WHEN trl.currency = v_currency THEN 1 ELSE 2 END
      LIMIT 1;
    ELSE
      SELECT trl.daily_limit, trl.monthly_limit
      INTO v_daily_limit, v_monthly_limit
      FROM public.tier_rate_limits trl
      WHERE trl.tier = 'free'
        AND (trl.currency = v_currency OR trl.currency = 'ALL')
      ORDER BY CASE WHEN trl.currency = v_currency THEN 1 ELSE 2 END
      LIMIT 1;
    END IF;
  END IF;

  v_daily_limit := COALESCE(v_daily_limit, 5);
  v_monthly_limit := COALESCE(v_monthly_limit, 5);

  SELECT bonus_writing_credits, bonus_speaking_credits, referral_bonus_expires_at
  INTO v_bonus_writing, v_bonus_speaking, v_bonus_expiry
  FROM public.users
  WHERE id = p_user_id;

  IF v_bonus_expiry IS NOT NULL AND v_bonus_expiry > now() THEN
    IF p_feature_type = 'writing' THEN
      v_monthly_limit := v_monthly_limit + COALESCE(v_bonus_writing, 0);
    ELSIF p_feature_type = 'speaking' THEN
      v_monthly_limit := v_monthly_limit + COALESCE(v_bonus_speaking, 0);
    ELSE
      v_monthly_limit :=
        v_monthly_limit +
        COALESCE(v_bonus_writing, 0) +
        COALESCE(v_bonus_speaking, 0);
    END IF;
  END IF;

  IF p_feature_type = 'writing' THEN
    -- Convert the admin's full-evaluation allowance into the part-review
    -- capacity used by the atomic reservation function.
    v_daily_limit := CASE
      WHEN v_daily_limit = -1 THEN 2147483647
      ELSE v_daily_limit * 2
    END;
    v_monthly_limit := CASE
      WHEN v_monthly_limit = -1 THEN 2147483647
      ELSE v_monthly_limit * 2
    END;
    v_endpoint_filter := 'generateDetailedFeedback';
  ELSIF p_feature_type = 'speaking' THEN
    v_endpoint_filter := 'processSpeakingSession_start';
  ELSE
    v_endpoint_filter := NULL;
  END IF;

  v_daily_used := public.get_user_daily_usage(p_user_id, v_endpoint_filter);
  v_monthly_used := public.get_user_monthly_usage(p_user_id, v_endpoint_filter);

  RETURN QUERY SELECT
    (v_daily_used < v_daily_limit AND v_monthly_used < v_monthly_limit),
    greatest(v_daily_limit - v_daily_used, 0),
    greatest(v_monthly_limit - v_monthly_used, 0),
    v_daily_used,
    v_monthly_used;
END;
$$;

COMMENT ON COLUMN public.tier_rate_limits.writing_daily_limit IS
  'Full Writing evaluations per day; each evaluation includes any two Task 1/Task 2 reviews.';
COMMENT ON COLUMN public.tier_rate_limits.writing_monthly_limit IS
  'Full Writing evaluations per month; each evaluation includes any two Task 1/Task 2 reviews.';

ALTER FUNCTION public.get_user_daily_usage(uuid, text) OWNER TO postgres;
ALTER FUNCTION public.get_user_monthly_usage(uuid, text) OWNER TO postgres;
ALTER FUNCTION public.check_user_rate_limit(uuid, text, text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.get_user_daily_usage(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_monthly_usage(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.check_user_rate_limit(uuid, text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_user_daily_usage(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_monthly_usage(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_user_rate_limit(uuid, text, text) TO authenticated, service_role;

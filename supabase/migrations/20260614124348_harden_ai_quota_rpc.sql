-- Ensure quota inspection is self/admin-only and derive tier server-side (live migration 20260614124348).

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
    (v_daily_limit - v_daily_used),
    (v_monthly_limit - v_monthly_used),
    v_daily_used,
    v_monthly_used;
END;
$$;

ALTER FUNCTION public.check_user_rate_limit(uuid, text, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.check_user_rate_limit(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_user_rate_limit(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_user_rate_limit(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_rate_limit(uuid, text, text) TO service_role;

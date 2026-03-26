-- Migration: Update speaking quota to count session starts instead of completed reports
-- Previously: Quota counted evaluateSpeakingTest completions (only when report was generated)
-- Now: Quota counts processSpeakingSession_start (first turn of each session)
-- This prevents users from doing unlimited Gemini calls by abandoning tests before report generation

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
SET search_path = public
AS $$
DECLARE
  v_daily_limit  integer;
  v_monthly_limit integer;
  v_daily_used   integer := 0;
  v_monthly_used integer := 0;
  v_endpoint_filter text;
  v_bonus_writing  integer;
  v_bonus_speaking integer;
BEGIN
  -- 1. Fetch tier limits
  IF p_feature_type = 'writing' THEN
    SELECT writing_daily_limit, writing_monthly_limit
      INTO v_daily_limit, v_monthly_limit
      FROM public.tier_rate_limits
     WHERE tier = p_tier;
  ELSIF p_feature_type = 'speaking' THEN
    SELECT speaking_daily_limit, speaking_monthly_limit
      INTO v_daily_limit, v_monthly_limit
      FROM public.tier_rate_limits
     WHERE tier = p_tier;
  ELSE
    SELECT daily_limit, monthly_limit
      INTO v_daily_limit, v_monthly_limit
      FROM public.tier_rate_limits
     WHERE tier = p_tier;
  END IF;

  -- Defaults if no row found or tier mismatch
  v_daily_limit  := COALESCE(v_daily_limit, 5);
  v_monthly_limit := COALESCE(v_monthly_limit, 50);

  -- 2. Add promo bonus if present
  SELECT bonus_writing_credits, bonus_speaking_credits
    INTO v_bonus_writing, v_bonus_speaking
    FROM public.users
   WHERE id = p_user_id;

  IF v_bonus_writing IS NOT NULL OR v_bonus_speaking IS NOT NULL THEN
    IF p_feature_type = 'writing' THEN
      v_monthly_limit := v_monthly_limit + COALESCE(v_bonus_writing, 0);
    ELSIF p_feature_type = 'speaking' THEN
      v_monthly_limit := v_monthly_limit + COALESCE(v_bonus_speaking, 0);
    ELSE
      -- General: add both bonuses
      v_monthly_limit := v_monthly_limit + COALESCE(v_bonus_writing, 0) + COALESCE(v_bonus_speaking, 0);
    END IF;
  END IF;

  -- 3. Determine endpoint filter for usage counting
  IF p_feature_type = 'writing' THEN
    v_endpoint_filter := 'generateDetailedFeedback';
  ELSIF p_feature_type = 'speaking' THEN
    -- Count session starts (first turn of each test), not per-turn calls or reports.
    -- The edge function logs 'processSpeakingSession_start' only on the first turn of each session.
    -- This accurately counts how many speaking sessions a user has consumed.
    v_endpoint_filter := 'processSpeakingSession_start';
  ELSE
    v_endpoint_filter := NULL;  -- count all endpoints
  END IF;

  -- Single code path for all feature types
  v_daily_used  := public.get_user_daily_usage(p_user_id, v_endpoint_filter);
  v_monthly_used := public.get_user_monthly_usage(p_user_id, v_endpoint_filter);

  -- 4. Return the result
  RETURN QUERY SELECT
    (v_daily_used < v_daily_limit AND v_monthly_used < v_monthly_limit),
    (v_daily_limit - v_daily_used),
    (v_monthly_limit - v_monthly_used),
    v_daily_used,
    v_monthly_used;
END;
$$;

-- Grant permissions
ALTER FUNCTION public.check_user_rate_limit(uuid, text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.check_user_rate_limit(uuid, text, text) TO anon;
GRANT ALL ON FUNCTION public.check_user_rate_limit(uuid, text, text) TO authenticated;
GRANT ALL ON FUNCTION public.check_user_rate_limit(uuid, text, text) TO service_role;

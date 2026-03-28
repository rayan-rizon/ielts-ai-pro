-- Migration: Add currency-based regional rate limits
-- Allows us to set lower quota limits for users paying with regional pricing (e.g. BDT)

-- 1. Add currency column and update constraint
ALTER TABLE "public"."tier_rate_limits"
  ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'ALL';

-- Drop old constraint and add new compound uniqueness
ALTER TABLE "public"."tier_rate_limits" 
  DROP CONSTRAINT IF EXISTS "tier_rate_limits_tier_key";

ALTER TABLE "public"."tier_rate_limits" 
  ADD CONSTRAINT "tier_rate_limits_tier_currency_key" UNIQUE ("tier", "currency");

-- 2. Update RPC to respect currency overrides
DROP FUNCTION IF EXISTS public.check_user_rate_limit(uuid, text, text);

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
  v_daily_limit   INTEGER;
  v_monthly_limit INTEGER;
  v_daily_used    INTEGER;
  v_monthly_used  INTEGER;
  v_bonus_writing  INTEGER;
  v_bonus_speaking INTEGER;
  v_bonus_expiry   TIMESTAMPTZ;
  v_endpoint_filter TEXT;
  v_currency TEXT;
BEGIN
  -- Get user subscription currency for regional limits
  -- Ensure currency comparison is uppercase, fallback to 'ALL' if free/null
  SELECT COALESCE(UPPER(subscription_currency), 'ALL') INTO v_currency FROM public.users WHERE id = p_user_id;

  -- 1. Select the correct limit columns based on feature type
  IF p_feature_type = 'writing' THEN
    SELECT trl.writing_daily_limit, trl.writing_monthly_limit
      INTO v_daily_limit, v_monthly_limit
      FROM public.tier_rate_limits trl
     WHERE trl.tier = p_tier AND (trl.currency = v_currency OR trl.currency = 'ALL')
     ORDER BY CASE WHEN trl.currency = v_currency THEN 1 ELSE 2 END
     LIMIT 1;
  ELSIF p_feature_type = 'speaking' THEN
    SELECT trl.speaking_daily_limit, trl.speaking_monthly_limit
      INTO v_daily_limit, v_monthly_limit
      FROM public.tier_rate_limits trl
     WHERE trl.tier = p_tier AND (trl.currency = v_currency OR trl.currency = 'ALL')
     ORDER BY CASE WHEN trl.currency = v_currency THEN 1 ELSE 2 END
     LIMIT 1;
  ELSE
    -- General / default: use overall daily_limit / monthly_limit
    SELECT trl.daily_limit, trl.monthly_limit
      INTO v_daily_limit, v_monthly_limit
      FROM public.tier_rate_limits trl
     WHERE trl.tier = p_tier AND (trl.currency = v_currency OR trl.currency = 'ALL')
     ORDER BY CASE WHEN trl.currency = v_currency THEN 1 ELSE 2 END
     LIMIT 1;
  END IF;

  -- Fallback to free tier if tier row not found
  IF v_daily_limit IS NULL THEN
    IF p_feature_type = 'writing' THEN
      SELECT trl.writing_daily_limit, trl.writing_monthly_limit
        INTO v_daily_limit, v_monthly_limit
        FROM public.tier_rate_limits trl
       WHERE trl.tier = 'free' AND (trl.currency = v_currency OR trl.currency = 'ALL')
       ORDER BY CASE WHEN trl.currency = v_currency THEN 1 ELSE 2 END
       LIMIT 1;
    ELSIF p_feature_type = 'speaking' THEN
      SELECT trl.speaking_daily_limit, trl.speaking_monthly_limit
        INTO v_daily_limit, v_monthly_limit
        FROM public.tier_rate_limits trl
       WHERE trl.tier = 'free' AND (trl.currency = v_currency OR trl.currency = 'ALL')
       ORDER BY CASE WHEN trl.currency = v_currency THEN 1 ELSE 2 END
       LIMIT 1;
    ELSE
      SELECT trl.daily_limit, trl.monthly_limit
        INTO v_daily_limit, v_monthly_limit
        FROM public.tier_rate_limits trl
       WHERE trl.tier = 'free' AND (trl.currency = v_currency OR trl.currency = 'ALL')
       ORDER BY CASE WHEN trl.currency = v_currency THEN 1 ELSE 2 END
       LIMIT 1;
    END IF;
  END IF;

  -- Hard defaults if still null (safety net)
  v_daily_limit  := COALESCE(v_daily_limit, 5);
  v_monthly_limit := COALESCE(v_monthly_limit, 5);

  -- 2. Add referral bonus credits if currently active
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
      -- General: add both bonuses
      v_monthly_limit := v_monthly_limit + COALESCE(v_bonus_writing, 0) + COALESCE(v_bonus_speaking, 0);
    END IF;
  END IF;

  -- 3. Determine endpoint filter for usage counting
  IF p_feature_type = 'writing' THEN
    v_endpoint_filter := 'generateDetailedFeedback';
  ELSIF p_feature_type = 'speaking' THEN
    -- Speaking has two endpoints; we count them separately and sum
    v_daily_used := public.get_user_daily_usage(p_user_id, 'processSpeakingSession')
                  + public.get_user_daily_usage(p_user_id, 'evaluateSpeakingTest');
    v_monthly_used := public.get_user_monthly_usage(p_user_id, 'processSpeakingSession')
                    + public.get_user_monthly_usage(p_user_id, 'evaluateSpeakingTest');
  ELSE
    v_endpoint_filter := NULL;  -- count all endpoints
  END IF;

  -- For non-speaking cases, use single call with endpoint filter
  IF p_feature_type IS DISTINCT FROM 'speaking' THEN
    v_daily_used  := public.get_user_daily_usage(p_user_id, v_endpoint_filter);
    v_monthly_used := public.get_user_monthly_usage(p_user_id, v_endpoint_filter);
  END IF;

  -- 4. Return the result
  RETURN QUERY SELECT
    (v_daily_used < v_daily_limit AND v_monthly_used < v_monthly_limit),
    (v_daily_limit - v_daily_used),
    (v_monthly_limit - v_monthly_used),
    v_daily_used,
    v_monthly_used;
END;
$$;

-- Grant permissions matching the original function
ALTER FUNCTION public.check_user_rate_limit(uuid, text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.check_user_rate_limit(uuid, text, text) TO anon;
GRANT ALL ON FUNCTION public.check_user_rate_limit(uuid, text, text) TO authenticated;
GRANT ALL ON FUNCTION public.check_user_rate_limit(uuid, text, text) TO service_role;

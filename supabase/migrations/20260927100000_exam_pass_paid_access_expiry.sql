-- The 3-Month Exam Pass and the end of paid access.
--
-- The Exam Pass (billing interval `quarterly`) is a one-time Stripe payment
-- for three months that never renews, the same shape bKash payments already
-- have. Nothing ever took such a plan away: the writing and speaking quota
-- read `subscription_tier` alone, so a learner whose paid period ended kept
-- paid limits for good. Reading, listening, the reading assistant, the AI
-- coach and paired tests already checked `subscription_end_date`; this brings
-- the AI quota and the notification audience in line with them, and moves
-- lapsed one-time plans back to Free so the pricing page offers them again.
--
-- A null end date stays open-ended, matching every existing gate: that is how
-- complimentary and admin-granted access is represented.

CREATE OR REPLACE FUNCTION public.entitled_subscription_tier(
  p_tier text,
  p_end_date timestamptz
)
RETURNS text
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
  SELECT CASE
    WHEN lower(COALESCE(p_tier, 'free')) IN ('pro', 'premium')
      AND p_end_date IS NOT NULL
      AND p_end_date <= pg_catalog.now()
    THEN 'free'
    ELSE lower(COALESCE(p_tier, 'free'))
  END;
$function$;

COMMENT ON FUNCTION public.entitled_subscription_tier(text, timestamptz) IS
  'The tier a learner is entitled to right now: an ended pro/premium period counts as free.';
REVOKE ALL ON FUNCTION public.entitled_subscription_tier(text, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.entitled_subscription_tier(text, timestamptz) TO authenticated, service_role;

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
    public.entitled_subscription_tier(subscription_tier, subscription_end_date),
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

CREATE OR REPLACE FUNCTION public.reserve_ai_api_usage(
  p_auth_id uuid,
  p_endpoint text,
  p_feature_type text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  reservation_id uuid,
  allowed boolean,
  daily_remaining integer,
  monthly_remaining integer,
  daily_used integer,
  monthly_used integer,
  already_reserved boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_user public.users%ROWTYPE;
  v_tier text;
  v_quota record;
  v_existing public.ai_api_usage%ROWTYPE;
  v_reservation_id uuid;
  v_daily_limit integer;
  v_monthly_limit integer;
  v_daily_used integer;
  v_monthly_used integer;
  v_session_id text;
  v_part integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;

  IF p_endpoint IS NULL OR btrim(p_endpoint) = '' THEN
    RAISE EXCEPTION 'endpoint is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_user
  FROM public.users
  WHERE auth_id = p_auth_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user profile not found' USING ERRCODE = 'P0002';
  END IF;

  v_tier := CASE
    WHEN v_user.role = 'admin' THEN 'admin'
    ELSE public.entitled_subscription_tier(v_user.subscription_tier, v_user.subscription_end_date)
  END;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_auth_id::text || ':' || COALESCE(p_feature_type, 'general'),
      0
    )
  );

  IF p_idempotency_key IS NOT NULL AND btrim(p_idempotency_key) <> '' THEN
    SELECT * INTO v_existing
    FROM public.ai_api_usage
    WHERE user_id = v_user.id
      AND endpoint = p_endpoint
      AND request_metadata ->> 'idempotencyKey' = p_idempotency_key
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
      IF COALESCE(v_existing.request_metadata ->> 'reservationStatus', 'completed') = 'failed'
         OR (
           v_existing.request_metadata ->> 'reservationStatus' = 'reserved'
           AND v_existing.created_at < now() - interval '15 minutes'
         ) THEN
        UPDATE public.ai_api_usage
        SET cached = false,
            tokens_used = 0,
            request_metadata = COALESCE(v_existing.request_metadata, '{}'::jsonb)
              || jsonb_build_object(
                'reservationStatus', 'reserved',
                'retryStartedAt', now()
              )
        WHERE id = v_existing.id;

        RETURN QUERY SELECT v_existing.id, true, 0, 0, 0, 0, false;
        RETURN;
      END IF;

      RETURN QUERY SELECT v_existing.id, true, 0, 0, 0, 0, true;
      RETURN;
    END IF;
  END IF;

  IF p_feature_type = 'speaking_turn' THEN
    v_session_id := p_metadata ->> 'speakingSessionId';
    v_part := (p_metadata ->> 'part')::integer;

    IF v_session_id IS NULL OR v_part NOT BETWEEN 1 AND 3 THEN
      RAISE EXCEPTION 'valid speaking session and part are required' USING ERRCODE = '22023';
    END IF;

    v_daily_limit := CASE v_part WHEN 2 THEN 4 ELSE 8 END;
    v_monthly_limit := 20;

    SELECT count(*)::integer INTO v_daily_used
    FROM public.ai_api_usage
    WHERE user_id = v_user.id
      AND endpoint = 'processSpeakingSession'
      AND request_metadata ->> 'speakingSessionId' = v_session_id
      AND (request_metadata ->> 'part')::integer = v_part;

    SELECT count(*)::integer INTO v_monthly_used
    FROM public.ai_api_usage
    WHERE user_id = v_user.id
      AND endpoint = 'processSpeakingSession'
      AND request_metadata ->> 'speakingSessionId' = v_session_id;

    SELECT
      (v_daily_used < v_daily_limit AND v_monthly_used < v_monthly_limit) AS allowed,
      v_daily_limit - v_daily_used AS daily_remaining,
      v_monthly_limit - v_monthly_used AS monthly_remaining,
      v_daily_used AS daily_used,
      v_monthly_used AS monthly_used
    INTO v_quota;
  ELSIF p_feature_type = 'tts' THEN
    SELECT
      CASE v_tier WHEN 'admin' THEN 1000 WHEN 'premium' THEN 200 WHEN 'pro' THEN 100 ELSE 30 END,
      CASE v_tier WHEN 'admin' THEN 30000 WHEN 'premium' THEN 5000 WHEN 'pro' THEN 2000 ELSE 300 END
    INTO v_daily_limit, v_monthly_limit;

    SELECT count(*)::integer INTO v_daily_used
    FROM public.ai_api_usage
    WHERE user_id = v_user.id
      AND endpoint = 'synthesizeSpeech'
      AND created_at >= date_trunc('day', now());

    SELECT count(*)::integer INTO v_monthly_used
    FROM public.ai_api_usage
    WHERE user_id = v_user.id
      AND endpoint = 'synthesizeSpeech'
      AND created_at >= date_trunc('month', now());

    SELECT
      (v_daily_used < v_daily_limit AND v_monthly_used < v_monthly_limit) AS allowed,
      v_daily_limit - v_daily_used AS daily_remaining,
      v_monthly_limit - v_monthly_used AS monthly_remaining,
      v_daily_used AS daily_used,
      v_monthly_used AS monthly_used
    INTO v_quota;
  ELSE
    SELECT * INTO v_quota
    FROM public.check_user_rate_limit(v_user.id, v_tier, p_feature_type);
  END IF;

  IF NOT COALESCE(v_quota.allowed, false) THEN
    RETURN QUERY SELECT
      NULL::uuid,
      false,
      COALESCE(v_quota.daily_remaining, 0),
      COALESCE(v_quota.monthly_remaining, 0),
      COALESCE(v_quota.daily_used, 0),
      COALESCE(v_quota.monthly_used, 0),
      false;
    RETURN;
  END IF;

  INSERT INTO public.ai_api_usage (
    user_id, endpoint, cached, tokens_used, request_metadata
  ) VALUES (
    v_user.id,
    p_endpoint,
    false,
    0,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'reservationStatus', 'reserved',
      'idempotencyKey', p_idempotency_key
    )
  )
  RETURNING id INTO v_reservation_id;

  RETURN QUERY SELECT
    v_reservation_id,
    true,
    GREATEST(COALESCE(v_quota.daily_remaining, 1) - 1, 0),
    GREATEST(COALESCE(v_quota.monthly_remaining, 1) - 1, 0),
    COALESCE(v_quota.daily_used, 0) + 1,
    COALESCE(v_quota.monthly_used, 0) + 1,
    false;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_subscription_tier()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT COALESCE(
    (SELECT public.entitled_subscription_tier(u.subscription_tier, u.subscription_end_date) FROM public.users u WHERE u.auth_id = auth.uid() LIMIT 1),
    'free'
  );
$$;

-- Stripe subscriptions end through customer.subscription.deleted. One-time
-- plans (Exam Pass, bKash) have no provider event, so they end here. Stripe
-- subscribers are left alone: during Smart Retries their end date can pass
-- before the renewal settles, and the quota check above already covers them.
CREATE SCHEMA IF NOT EXISTS billing_private;
REVOKE ALL ON SCHEMA billing_private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION billing_private.expire_lapsed_paid_access()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_expired integer;
BEGIN
  PERFORM pg_catalog.set_config('app.bypass_column_protection', 'on', true);

  UPDATE public.users
  SET subscription_tier = 'free',
      cancel_at_period_end = false,
      updated_at = pg_catalog.now()
  WHERE subscription_tier IN ('pro', 'premium')
    AND role <> 'admin'
    AND stripe_subscription_id IS NULL
    AND subscription_end_date IS NOT NULL
    AND subscription_end_date <= pg_catalog.now();
  GET DIAGNOSTICS v_expired = ROW_COUNT;

  PERFORM pg_catalog.set_config('app.bypass_column_protection', 'off', true);
  RETURN v_expired;
END
$function$;

REVOKE ALL ON FUNCTION billing_private.expire_lapsed_paid_access() FROM PUBLIC, anon, authenticated;

DO $cron$
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'expire-lapsed-paid-access';
  PERFORM cron.schedule(
    'expire-lapsed-paid-access',
    '11 * * * *',
    'select billing_private.expire_lapsed_paid_access()'
  );
END
$cron$;

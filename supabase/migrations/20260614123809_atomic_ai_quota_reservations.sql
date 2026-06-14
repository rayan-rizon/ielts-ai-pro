-- Atomically reserve AI quota before provider work begins (live migration 20260614123809).
-- Failed provider calls remain counted so malformed/failed requests cannot bypass cost controls.

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
    ELSE lower(COALESCE(v_user.subscription_tier, 'free'))
  END;

  -- Serialize reservations per user and feature across all Edge Function isolates.
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
      RETURN QUERY SELECT
        v_existing.id,
        true,
        0,
        0,
        0,
        0,
        true;
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
      CASE v_tier
        WHEN 'admin' THEN 1000
        WHEN 'premium' THEN 200
        WHEN 'pro' THEN 100
        ELSE 30
      END,
      CASE v_tier
        WHEN 'admin' THEN 30000
        WHEN 'premium' THEN 5000
        WHEN 'pro' THEN 2000
        ELSE 300
      END
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
    user_id,
    endpoint,
    cached,
    tokens_used,
    request_metadata
  )
  VALUES (
    v_user.id,
    p_endpoint,
    false,
    0,
    COALESCE(p_metadata, '{}'::jsonb) ||
      jsonb_build_object(
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

ALTER FUNCTION public.reserve_ai_api_usage(uuid, text, text, text, jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.reserve_ai_api_usage(uuid, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reserve_ai_api_usage(uuid, text, text, text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.reserve_ai_api_usage(uuid, text, text, text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_api_usage(uuid, text, text, text, jsonb) TO service_role;

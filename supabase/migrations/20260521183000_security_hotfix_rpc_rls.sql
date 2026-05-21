-- Production security hotfix:
-- - Keep existing RPC signatures for client compatibility.
-- - Add self/admin/service-role authorization inside SECURITY DEFINER functions.
-- - Remove direct authenticated access to the shared AI feedback cache.
-- - Keep system_settings public access on a strict allowlist.

CREATE OR REPLACE FUNCTION public.can_access_user_id(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT
    COALESCE((SELECT auth.role()), '') = 'service_role'
    OR public.is_admin()
    OR p_user_id = public.get_my_public_user_id();
$$;

ALTER FUNCTION public.can_access_user_id(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.can_access_user_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_access_user_id(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_access_user_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_user_id(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_referral_rewards(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_referral_count INTEGER;
    v_tier RECORD;
    v_total_days INTEGER := 0;
    v_total_writing INTEGER := 0;
    v_total_speaking INTEGER := 0;
    v_new_expiry TIMESTAMPTZ;
    v_claimed_tiers UUID[] := ARRAY[]::UUID[];
BEGIN
    IF NOT public.can_access_user_id(p_user_id) THEN
        RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
    END IF;

    SELECT COUNT(*) INTO v_referral_count
    FROM public.user_referrals
    WHERE referrer_id = p_user_id;

    IF v_referral_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No referrals found');
    END IF;

    FOR v_tier IN
        SELECT rrt.*
        FROM public.referral_reward_tiers rrt
        WHERE rrt.referrals_required <= v_referral_count
          AND rrt.is_active = true
          AND NOT EXISTS (
              SELECT 1
              FROM public.user_referral_rewards urr
              WHERE urr.user_id = p_user_id
                AND urr.tier_id = rrt.id
          )
        ORDER BY rrt.referrals_required ASC
    LOOP
        INSERT INTO public.user_referral_rewards (
            user_id,
            tier_id,
            extra_days_granted,
            writing_credits_granted,
            speaking_credits_granted
        )
        VALUES (p_user_id, v_tier.id, v_tier.extra_days, v_tier.writing_credits, v_tier.speaking_credits);

        v_total_days := v_total_days + v_tier.extra_days;
        v_total_writing := v_total_writing + v_tier.writing_credits;
        v_total_speaking := v_total_speaking + v_tier.speaking_credits;
        v_claimed_tiers := array_append(v_claimed_tiers, v_tier.id);
    END LOOP;

    IF array_length(v_claimed_tiers, 1) IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No new rewards to claim');
    END IF;

    SELECT GREATEST(referral_bonus_expires_at, now()) + (v_total_days || ' days')::INTERVAL
    INTO v_new_expiry
    FROM public.users
    WHERE id = p_user_id;

    IF v_new_expiry IS NULL THEN
        v_new_expiry := now() + (v_total_days || ' days')::INTERVAL;
    END IF;

    UPDATE public.users
    SET
        referral_bonus_expires_at = v_new_expiry,
        bonus_writing_credits = COALESCE(bonus_writing_credits, 0) + v_total_writing,
        bonus_speaking_credits = COALESCE(bonus_speaking_credits, 0) + v_total_speaking,
        updated_at = now()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'days_granted', v_total_days,
        'writing_credits_granted', v_total_writing,
        'speaking_credits_granted', v_total_speaking,
        'new_expires_at', v_new_expiry,
        'tiers_claimed', array_length(v_claimed_tiers, 1)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_resource(resource_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF COALESCE((SELECT auth.role()), '') <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.resources WHERE id = resource_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Resource not found with id: %', resource_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    IF NOT public.can_access_user_id(p_user_id) THEN
        RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
    END IF;

    SELECT referral_code INTO v_code FROM public.users WHERE id = p_user_id;
    IF v_code IS NOT NULL THEN
        RETURN v_code;
    END IF;

    LOOP
        v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
        SELECT EXISTS(SELECT 1 FROM public.users WHERE referral_code = v_code) INTO v_exists;
        EXIT WHEN NOT v_exists;
    END LOOP;

    UPDATE public.users SET referral_code = v_code WHERE id = p_user_id;

    RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_daily_usage(p_user_id uuid, p_endpoint text DEFAULT NULL::text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT public.can_access_user_id(p_user_id) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  SELECT count(*)::INTEGER INTO v_count
  FROM public.ai_api_usage
  WHERE user_id = p_user_id
    AND (p_endpoint IS NULL OR endpoint = p_endpoint)
    AND created_at >= current_date
    AND cached = FALSE;

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_monthly_usage(p_user_id uuid, p_endpoint text DEFAULT NULL::text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT public.can_access_user_id(p_user_id) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  SELECT count(*)::INTEGER INTO v_count
  FROM public.ai_api_usage
  WHERE user_id = p_user_id
    AND (p_endpoint IS NULL OR endpoint = p_endpoint)
    AND created_at >= date_trunc('month', current_date)
    AND cached = FALSE;

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_referral_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_referral_code TEXT;
    v_referral_count INTEGER;
    v_next_tier RECORD;
    v_claimed_rewards JSONB;
    v_bonus_expiry TIMESTAMPTZ;
    v_bonus_writing INTEGER;
    v_bonus_speaking INTEGER;
BEGIN
    IF NOT public.can_access_user_id(p_user_id) THEN
        RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
    END IF;

    SELECT referral_code, referral_bonus_expires_at, bonus_writing_credits, bonus_speaking_credits
    INTO v_referral_code, v_bonus_expiry, v_bonus_writing, v_bonus_speaking
    FROM public.users
    WHERE id = p_user_id;

    IF v_referral_code IS NULL THEN
        v_referral_code := public.generate_referral_code(p_user_id);
    END IF;

    SELECT COUNT(*) INTO v_referral_count
    FROM public.user_referrals
    WHERE referrer_id = p_user_id;

    SELECT * INTO v_next_tier
    FROM public.referral_reward_tiers rrt
    WHERE rrt.is_active = true
      AND NOT EXISTS (
          SELECT 1
          FROM public.user_referral_rewards urr
          WHERE urr.user_id = p_user_id
            AND urr.tier_id = rrt.id
      )
    ORDER BY rrt.referrals_required ASC
    LIMIT 1;

    SELECT jsonb_agg(jsonb_build_object(
        'tier_id', urr.tier_id,
        'days', urr.extra_days_granted,
        'writing', urr.writing_credits_granted,
        'speaking', urr.speaking_credits_granted,
        'claimed_at', urr.claimed_at,
        'referrals_required', rrt.referrals_required
    ))
    INTO v_claimed_rewards
    FROM public.user_referral_rewards urr
    JOIN public.referral_reward_tiers rrt ON rrt.id = urr.tier_id
    WHERE urr.user_id = p_user_id;

    RETURN jsonb_build_object(
        'referral_code', v_referral_code,
        'referral_count', v_referral_count,
        'bonus_expires_at', v_bonus_expiry,
        'bonus_writing_credits', COALESCE(v_bonus_writing, 0),
        'bonus_speaking_credits', COALESCE(v_bonus_speaking, 0),
        'next_tier', CASE WHEN v_next_tier IS NULL THEN NULL ELSE jsonb_build_object(
            'referrals_required', v_next_tier.referrals_required,
            'extra_days', v_next_tier.extra_days,
            'writing_credits', v_next_tier.writing_credits,
            'speaking_credits', v_next_tier.speaking_credits
        ) END,
        'claimed_rewards', COALESCE(v_claimed_rewards, '[]'::jsonb)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_weak_skills(p_user_id uuid, p_limit integer DEFAULT 5)
RETURNS TABLE(
  skill_code text,
  module text,
  mastery_probability double precision,
  practice_count integer,
  days_since_practice integer,
  priority_score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NOT public.can_access_user_id(p_user_id) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    sp.skill_code,
    sp.module,
    sp.mastery_probability,
    sp.practice_count,
    COALESCE(EXTRACT(DAY FROM NOW() - sp.last_practiced_at)::INT, 999) AS days_since_practice,
    (1 - sp.mastery_probability) * 0.6 +
      LEAST(COALESCE(EXTRACT(DAY FROM NOW() - sp.last_practiced_at), 30) / 30.0, 1.0) * 0.4 AS priority_score
  FROM public.skill_proficiency sp
  WHERE sp.user_id = p_user_id
  ORDER BY priority_score DESC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_vocabulary_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT public.can_access_user_id(p_user_id) THEN
        RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
    END IF;

    SELECT json_build_object(
        'totalWords', COALESCE(COUNT(*), 0),
        'masteredWords', COALESCE(SUM(CASE WHEN (mastery_level IS NOT NULL AND mastery_level >= 4) THEN 1 ELSE 0 END), 0),
        'dueForReviewCount', COALESCE(SUM(CASE WHEN (next_review_date IS NULL OR next_review_date <= NOW()) THEN 1 ELSE 0 END), 0)
    )
    INTO result
    FROM public.vocabulary_items
    WHERE user_id = p_user_id;

    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_stripe_checkout_completed(
  p_event_id text,
  p_auth_id uuid,
  p_user_id uuid,
  p_tier text,
  p_interval text,
  p_amount numeric,
  p_currency text,
  p_session_id text,
  p_subscription_id text,
  p_end_date timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_user_email TEXT;
BEGIN
    IF COALESCE((SELECT auth.role()), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
    END IF;

    IF EXISTS (SELECT 1 FROM public.stripe_events WHERE id = p_event_id) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Event already processed');
    END IF;

    SELECT email INTO v_user_email FROM public.users WHERE auth_id = p_auth_id;

    UPDATE public.users
    SET
        subscription_tier = p_tier,
        billing_interval = p_interval,
        stripe_subscription_id = p_subscription_id,
        subscription_start_date = NOW(),
        subscription_end_date = p_end_date,
        cancel_at_period_end = FALSE,
        updated_at = NOW()
    WHERE auth_id = p_auth_id;

    INSERT INTO public.payment_requests (
        auth_id,
        tier,
        interval,
        amount,
        currency,
        payment_method,
        transaction_id,
        sender_phone,
        status,
        admin_notes,
        created_at,
        updated_at
    ) VALUES (
        p_auth_id,
        p_tier,
        p_interval,
        p_amount,
        p_currency,
        'stripe',
        p_session_id,
        'N/A',
        'approved',
        'Stripe Checkout Session: ' || p_session_id,
        NOW(),
        NOW()
    );

    INSERT INTO public.stripe_events (id, type) VALUES (p_event_id, 'checkout.session.completed');

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.process_referral(p_new_user_id uuid, p_referral_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_referrer_id UUID;
    v_referrer_code TEXT;
BEGIN
    IF NOT public.can_access_user_id(p_new_user_id) THEN
        RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
    END IF;

    IF p_referral_code IS NULL OR p_referral_code = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'No referral code provided');
    END IF;

    SELECT id, referral_code INTO v_referrer_id, v_referrer_code
    FROM public.users
    WHERE referral_code = upper(trim(p_referral_code));

    IF v_referrer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
    END IF;

    IF v_referrer_id = p_new_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own referral code');
    END IF;

    IF EXISTS(SELECT 1 FROM public.user_referrals WHERE referred_id = p_new_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'User already referred');
    END IF;

    INSERT INTO public.user_referrals (referrer_id, referred_id)
    VALUES (v_referrer_id, p_new_user_id);

    UPDATE public.users SET referred_by = v_referrer_id WHERE id = p_new_user_id;

    RETURN jsonb_build_object('success', true, 'referrer_id', v_referrer_id);
END;
$$;

ALTER FUNCTION public.claim_referral_rewards(uuid) OWNER TO postgres;
ALTER FUNCTION public.delete_resource(uuid) OWNER TO postgres;
ALTER FUNCTION public.generate_referral_code(uuid) OWNER TO postgres;
ALTER FUNCTION public.get_user_daily_usage(uuid, text) OWNER TO postgres;
ALTER FUNCTION public.get_user_monthly_usage(uuid, text) OWNER TO postgres;
ALTER FUNCTION public.get_user_referral_stats(uuid) OWNER TO postgres;
ALTER FUNCTION public.get_user_weak_skills(uuid, integer) OWNER TO postgres;
ALTER FUNCTION public.get_vocabulary_stats(uuid) OWNER TO postgres;
ALTER FUNCTION public.handle_stripe_checkout_completed(text, uuid, uuid, text, text, numeric, text, text, text, timestamp with time zone) OWNER TO postgres;
ALTER FUNCTION public.process_referral(uuid, text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.claim_referral_rewards(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_resource(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_referral_code(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_daily_usage(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_monthly_usage(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_referral_stats(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_weak_skills(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_vocabulary_stats(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_stripe_checkout_completed(text, uuid, uuid, text, text, numeric, text, text, text, timestamp with time zone) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_referral(uuid, text) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.claim_referral_rewards(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.delete_resource(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.generate_referral_code(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_daily_usage(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_monthly_usage(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_referral_stats(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_weak_skills(uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.get_vocabulary_stats(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.handle_stripe_checkout_completed(text, uuid, uuid, text, text, numeric, text, text, text, timestamp with time zone) FROM anon;
REVOKE ALL ON FUNCTION public.handle_stripe_checkout_completed(text, uuid, uuid, text, text, numeric, text, text, text, timestamp with time zone) FROM authenticated;
REVOKE ALL ON FUNCTION public.process_referral(uuid, text) FROM anon;

GRANT EXECUTE ON FUNCTION public.claim_referral_rewards(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral_rewards(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_resource(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_resource(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_referral_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_referral_code(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_daily_usage(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_daily_usage(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_monthly_usage(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_monthly_usage(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_referral_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_referral_stats(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_weak_skills(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_weak_skills(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_vocabulary_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vocabulary_stats(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_stripe_checkout_completed(text, uuid, uuid, text, text, numeric, text, text, text, timestamp with time zone) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_referral(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_referral(uuid, text) TO service_role;

DROP POLICY IF EXISTS "Authenticated read cache" ON public.ai_feedback_cache;
DROP POLICY IF EXISTS "ai_feedback_cache_insert" ON public.ai_feedback_cache;

REVOKE ALL ON TABLE public.ai_feedback_cache FROM PUBLIC;
REVOKE ALL ON TABLE public.ai_feedback_cache FROM anon;
REVOKE ALL ON TABLE public.ai_feedback_cache FROM authenticated;
GRANT ALL ON TABLE public.ai_feedback_cache TO service_role;

DROP POLICY IF EXISTS system_settings_select_policy ON public.system_settings;
DROP POLICY IF EXISTS system_settings_public_safe_select ON public.system_settings;
DROP POLICY IF EXISTS system_settings_admin_select ON public.system_settings;

CREATE POLICY system_settings_public_safe_select
ON public.system_settings
FOR SELECT
TO anon, authenticated
USING (key IN ('maintenance_mode', 'pricing_tiers', 'public_announcement'));

CREATE POLICY system_settings_admin_select
ON public.system_settings
FOR SELECT
TO authenticated
USING (public.is_admin());

REVOKE ALL ON TABLE public.system_settings FROM PUBLIC;
REVOKE ALL ON TABLE public.system_settings FROM anon;
REVOKE ALL ON TABLE public.system_settings FROM authenticated;
GRANT SELECT ON TABLE public.system_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.system_settings TO authenticated;
GRANT ALL ON TABLE public.system_settings TO service_role;

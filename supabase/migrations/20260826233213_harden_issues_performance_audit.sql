-- Security and integrity corrections validated against the production schema.
-- Learners may read their own progress; awards and achievements are server-owned.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_points FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_achievements FROM anon, authenticated;

DROP POLICY IF EXISTS points_all_policy ON public.user_points;
CREATE POLICY user_points_select_own_or_admin
ON public.user_points
FOR SELECT TO authenticated
USING (
  user_id = (SELECT public.get_my_public_user_id())
  OR (SELECT public.is_admin())
);

DROP POLICY IF EXISTS achievements_all_policy ON public.user_achievements;
CREATE POLICY user_achievements_select_own_or_admin
ON public.user_achievements
FOR SELECT TO authenticated
USING (
  user_id = (SELECT public.get_my_public_user_id())
  OR (SELECT public.is_admin())
);

-- A referred profile can only ever be linked once. The table is empty in
-- production at the time of this migration, so this adds the invariant without
-- a data-repair path.
CREATE UNIQUE INDEX IF NOT EXISTS user_referrals_referred_id_unique
ON public.user_referrals (referred_id);

CREATE OR REPLACE FUNCTION public.process_referral(p_new_user_id uuid, p_referral_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  IF NOT public.can_access_user_id(p_new_user_id) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  IF coalesce(trim(p_referral_code), '') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'No referral code provided');
  END IF;

  -- Serialise competing first-referral requests for one learner.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_new_user_id::text, 0));
  SELECT id INTO v_referrer_id
  FROM public.users
  WHERE referral_code = upper(trim(p_referral_code));
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;
  IF v_referrer_id = p_new_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own referral code');
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_referrals WHERE referred_id = p_new_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already referred');
  END IF;

  INSERT INTO public.user_referrals (referrer_id, referred_id)
  VALUES (v_referrer_id, p_new_user_id);
  PERFORM set_config('app.bypass_column_protection', 'on', true);
  UPDATE public.users SET referred_by = v_referrer_id WHERE id = p_new_user_id;
  RETURN jsonb_build_object('success', true, 'referrer_id', v_referrer_id);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('success', false, 'error', 'User already referred');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_session_counts(p_ids uuid[])
RETURNS TABLE(passage_id uuid, count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT ts.passage_id, count(*)
  FROM public.test_sessions AS ts
  WHERE ts.passage_id = ANY(p_ids)
  GROUP BY ts.passage_id;
$$;

CREATE OR REPLACE FUNCTION public.get_writing_session_with_task(
  p_session_id uuid DEFAULT NULL,
  p_task_id text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_session record;
  v_task record;
  v_effective_task_id text;
BEGIN
  IF p_session_id IS NOT NULL THEN
    SELECT * INTO v_session
    FROM public.test_sessions
    WHERE id = p_session_id AND (p_user_id IS NULL OR user_id = p_user_id)
    LIMIT 1;
    IF v_session IS NOT NULL THEN
      v_effective_task_id := coalesce(
        v_session.passage_id::text,
        v_session.content_data->>'id',
        v_session.content_data->>'passage_id',
        p_task_id
      );
    END IF;
  ELSE
    v_effective_task_id := p_task_id;
  END IF;
  IF v_effective_task_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No task ID provided or found in session', 'session', NULL, 'task', NULL);
  END IF;
  SELECT * INTO v_task FROM public.passages
  WHERE id = v_effective_task_id::uuid AND is_active = true LIMIT 1;
  IF v_task IS NULL THEN
    RETURN jsonb_build_object('error', 'Task not found or inactive', 'session', CASE WHEN v_session IS NOT NULL THEN row_to_json(v_session)::jsonb ELSE NULL END, 'task', NULL);
  END IF;
  IF v_session IS NULL AND p_user_id IS NOT NULL AND p_session_id IS NULL THEN
    SELECT * INTO v_session FROM public.test_sessions
    WHERE user_id = p_user_id AND test_type = 'writing'
      AND (passage_id::text = v_effective_task_id OR content_data->>'id' = v_effective_task_id)
    ORDER BY created_at DESC LIMIT 1;
  END IF;
  RETURN jsonb_build_object('error', NULL, 'session', CASE WHEN v_session IS NOT NULL THEN row_to_json(v_session)::jsonb ELSE NULL END, 'task', row_to_json(v_task)::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_inactive_users(
  days_inactive integer DEFAULT 30,
  page_limit integer DEFAULT 50,
  page_offset integer DEFAULT 0,
  subscription_filter text DEFAULT NULL
)
RETURNS TABLE(id uuid, auth_id uuid, email text, full_name text, subscription_tier text, last_active timestamptz, created_at timestamptz, inactive_days integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users AS requesting_user
    WHERE requesting_user.auth_id = (SELECT auth.uid()) AND requesting_user.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN QUERY
  SELECT u.id, u.auth_id, u.email, u.full_name, u.subscription_tier, u.last_active, u.created_at,
    extract(day FROM now() - coalesce(u.last_active, u.created_at))::integer
  FROM public.users AS u
  WHERE coalesce(u.last_active, u.created_at) < now() - (days_inactive || ' days')::interval
    AND u.role <> 'admin'
    AND (subscription_filter IS NULL OR u.subscription_tier = subscription_filter)
  ORDER BY u.last_active ASC NULLS FIRST
  LIMIT page_limit OFFSET page_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_referral_rewards(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_referral_count integer;
  v_tier record;
  v_total_days integer := 0;
  v_total_writing integer := 0;
  v_total_speaking integer := 0;
  v_new_expiry timestamptz;
  v_claimed_tiers uuid[] := ARRAY[]::uuid[];
BEGIN
  IF NOT public.can_access_user_id(p_user_id) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_referral_count
  FROM public.user_referrals
  WHERE referrer_id = p_user_id;
  IF v_referral_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No referrals found');
  END IF;

  FOR v_tier IN
    SELECT rrt.*
    FROM public.referral_reward_tiers AS rrt
    WHERE rrt.referrals_required <= v_referral_count
      AND rrt.is_active
      AND NOT EXISTS (
        SELECT 1 FROM public.user_referral_rewards AS urr
        WHERE urr.user_id = p_user_id AND urr.tier_id = rrt.id
      )
    ORDER BY rrt.referrals_required ASC
  LOOP
    INSERT INTO public.user_referral_rewards (
      user_id, tier_id, extra_days_granted, writing_credits_granted, speaking_credits_granted
    ) VALUES (
      p_user_id, v_tier.id, v_tier.extra_days, v_tier.writing_credits, v_tier.speaking_credits
    );
    v_total_days := v_total_days + v_tier.extra_days;
    v_total_writing := v_total_writing + v_tier.writing_credits;
    v_total_speaking := v_total_speaking + v_tier.speaking_credits;
    v_claimed_tiers := array_append(v_claimed_tiers, v_tier.id);
  END LOOP;
  IF array_length(v_claimed_tiers, 1) IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No new rewards to claim');
  END IF;

  SELECT greatest(referral_bonus_expires_at, now()) + (v_total_days || ' days')::interval
  INTO v_new_expiry
  FROM public.users
  WHERE id = p_user_id;
  v_new_expiry := coalesce(v_new_expiry, now() + (v_total_days || ' days')::interval);

  PERFORM set_config('app.bypass_column_protection', 'on', true);
  UPDATE public.users
  SET referral_bonus_expires_at = v_new_expiry,
      bonus_writing_credits = coalesce(bonus_writing_credits, 0) + v_total_writing,
      bonus_speaking_credits = coalesce(bonus_speaking_credits, 0) + v_total_speaking,
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

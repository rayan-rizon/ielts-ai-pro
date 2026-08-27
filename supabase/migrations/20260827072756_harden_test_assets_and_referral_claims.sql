-- The test-assets bucket retained bootstrap policies that gave every anonymous
-- visitor full access. Its existing objects are owner-scoped, so retain only
-- authenticated owners' access rather than making the bucket public.
DROP POLICY IF EXISTS "Allow All yxpi5a_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow All yxpi5a_1" ON storage.objects;
DROP POLICY IF EXISTS "Allow All yxpi5a_2" ON storage.objects;
DROP POLICY IF EXISTS "Allow All yxpi5a_3" ON storage.objects;

CREATE POLICY "Authenticated owners can read test assets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'test-assets' AND owner_id = (select auth.uid()::text));

CREATE POLICY "Authenticated owners can upload test assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'test-assets' AND owner_id = (select auth.uid()::text));

CREATE POLICY "Authenticated owners can update test assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'test-assets' AND owner_id = (select auth.uid()::text))
WITH CHECK (bucket_id = 'test-assets' AND owner_id = (select auth.uid()::text));

CREATE POLICY "Authenticated owners can delete test assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'test-assets' AND owner_id = (select auth.uid()::text));

-- Referral claims derive credit balances and expiry dates from the reward rows.
-- Both the schema and function must serialize a claim, so concurrent requests
-- cannot create duplicate reward rows or double-credit an account.
CREATE UNIQUE INDEX IF NOT EXISTS user_referral_rewards_user_tier_key
ON public.user_referral_rewards (user_id, tier_id);

CREATE INDEX IF NOT EXISTS idx_marketing_events_delivery_id_fk
ON public.marketing_events (delivery_id);

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

  -- A per-user transaction advisory lock closes the select-then-insert window
  -- and keeps the calculated balance update in the same critical section.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

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
    ) ON CONFLICT (user_id, tier_id) DO NOTHING;

    IF FOUND THEN
      v_total_days := v_total_days + v_tier.extra_days;
      v_total_writing := v_total_writing + v_tier.writing_credits;
      v_total_speaking := v_total_speaking + v_tier.speaking_credits;
      v_claimed_tiers := array_append(v_claimed_tiers, v_tier.id);
    END IF;
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

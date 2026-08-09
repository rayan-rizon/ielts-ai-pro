-- Checkout recovery: send a consent-aware, single-use 15% offer roughly two
-- hours after the learner's *latest* unfinished checkout. Offers are issued to
-- one public profile only; a forwarded email code cannot be redeemed elsewhere.

ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS marketing_delivery_id uuid REFERENCES public.marketing_deliveries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS offer_expires_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_checkout_recovery_recipient_idx
  ON public.promo_codes (marketing_campaign_id, assigned_user_id)
  WHERE assigned_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS promo_codes_checkout_recovery_expiry_idx
  ON public.promo_codes (offer_expires_at)
  WHERE offer_expires_at IS NOT NULL;

-- A checkout recovery audience is based on the latest checkout event, never an
-- older abandoned attempt. This prevents a new checkout from receiving its
-- reminder early because of a previous incomplete attempt.
CREATE OR REPLACE FUNCTION public.marketing_segment_members(
  p_segment_id uuid,
  p_require_marketing_consent boolean DEFAULT false,
  p_limit integer DEFAULT 1000
)
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  subscription_tier text,
  consent_marketing boolean,
  triggered_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rules jsonb;
BEGIN
  IF NOT public.is_admin() AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  SELECT rules INTO v_rules FROM public.marketing_segments WHERE id = p_segment_id AND is_active;
  IF v_rules IS NULL THEN RETURN; END IF;

  RETURN QUERY
  WITH usage_month AS (
    SELECT a.user_id, count(*)::integer AS used
    FROM public.ai_api_usage a
    WHERE a.created_at >= date_trunc('month', now())
    GROUP BY a.user_id
  ), completed AS (
    SELECT t.user_id, max(COALESCE(t.completed_at, t.created_at)) AS completed_at
    FROM public.test_sessions t
    WHERE t.is_completed = true OR t.completed_at IS NOT NULL
    GROUP BY t.user_id
  ), quota AS (
    SELECT u.id,
      COALESCE(um.used, 0) AS used,
      COALESCE(trl.writing_monthly_limit, 0) + COALESCE(trl.speaking_monthly_limit, 0)
        + COALESCE(u.bonus_writing_credits, 0) + COALESCE(u.bonus_speaking_credits, 0) AS allowed
    FROM public.users u
    LEFT JOIN usage_month um ON um.user_id = u.id
    LEFT JOIN public.tier_rate_limits trl ON trl.tier = u.subscription_tier
  ), latest_checkout AS (
    SELECT me.user_id, max(me.occurred_at) AS started_at
    FROM public.marketing_events me
    WHERE me.event_type = 'checkout_started'
    GROUP BY me.user_id
  )
  SELECT u.id, u.email, u.full_name, u.subscription_tier, COALESCE(u.consent_marketing, false),
    CASE
      WHEN v_rules ? 'checkout_abandoned_hours_min' THEN COALESCE(lc.started_at, u.created_at)
      WHEN v_rules ? 'payment_failed' THEN COALESCE(u.payment_failed_at, u.updated_at, u.created_at)
      WHEN v_rules ? 'inactive_days_min' THEN COALESCE(u.last_active, u.created_at)
      WHEN v_rules ? 'has_completed_test' AND (v_rules->>'has_completed_test')::boolean
        THEN COALESCE(c.completed_at, u.created_at)
      ELSE u.created_at
    END AS triggered_at
  FROM public.users u
  LEFT JOIN completed c ON c.user_id = u.id
  LEFT JOIN quota q ON q.id = u.id
  LEFT JOIN latest_checkout lc ON lc.user_id = u.id
  WHERE u.role <> 'admin'
    AND (NOT p_require_marketing_consent OR COALESCE(u.consent_marketing, false))
    AND (NOT (v_rules ? 'subscription_tiers') OR u.subscription_tier IN (
      SELECT jsonb_array_elements_text(v_rules->'subscription_tiers')
    ))
    AND (NOT (v_rules ? 'signup_channels') OR COALESCE(u.signup_channel, 'unknown') IN (
      SELECT jsonb_array_elements_text(v_rules->'signup_channels')
    ))
    AND (NOT (v_rules ? 'utm_sources') OR COALESCE(u.signup_utm_source, '') IN (
      SELECT jsonb_array_elements_text(v_rules->'utm_sources')
    ))
    AND (NOT (v_rules ? 'utm_campaigns') OR COALESCE(u.signup_utm_campaign, '') IN (
      SELECT jsonb_array_elements_text(v_rules->'utm_campaigns')
    ))
    AND (NOT (v_rules ? 'landing_pages') OR COALESCE(u.signup_landing_page, '') IN (
      SELECT jsonb_array_elements_text(v_rules->'landing_pages')
    ))
    AND (NOT (v_rules ? 'onboarding_completed') OR u.onboarding_completed = (v_rules->>'onboarding_completed')::boolean)
    AND (NOT (v_rules ? 'has_completed_test') OR (c.user_id IS NOT NULL) = (v_rules->>'has_completed_test')::boolean)
    AND (NOT (v_rules ? 'created_days_max') OR u.created_at >= now() - make_interval(days => (v_rules->>'created_days_max')::integer))
    AND (NOT (v_rules ? 'inactive_days_min') OR COALESCE(u.last_active, u.created_at) <= now() - make_interval(days => (v_rules->>'inactive_days_min')::integer))
    AND (NOT (v_rules ? 'inactive_days_max') OR COALESCE(u.last_active, u.created_at) >= now() - make_interval(days => (v_rules->>'inactive_days_max')::integer))
    AND (NOT (v_rules ? 'payment_failed') OR (u.payment_failed_at IS NOT NULL) = (v_rules->>'payment_failed')::boolean)
    AND (NOT (v_rules ? 'cancel_at_period_end') OR COALESCE(u.cancel_at_period_end, false) = (v_rules->>'cancel_at_period_end')::boolean)
    AND (NOT (v_rules ? 'referral_expiry_days_max') OR u.referral_bonus_expires_at BETWEEN now() AND now() + make_interval(days => (v_rules->>'referral_expiry_days_max')::integer))
    AND (NOT (v_rules ? 'test_date_days_max') OR u.test_date BETWEEN current_date AND current_date + (v_rules->>'test_date_days_max')::integer)
    AND (NOT (v_rules ? 'target_band_min') OR u.target_band_score >= (v_rules->>'target_band_min')::numeric)
    AND (NOT (v_rules ? 'target_band_max') OR u.target_band_score <= (v_rules->>'target_band_max')::numeric)
    AND (NOT (v_rules ? 'weak_modules') OR COALESCE(u.weak_area, '') IN (
      SELECT jsonb_array_elements_text(v_rules->'weak_modules')
    ))
    AND (NOT (v_rules ? 'quota_states') OR
      CASE
        WHEN q.allowed <= q.used THEN 'exhausted'
        WHEN q.allowed - q.used <= 1 THEN 'low'
        ELSE 'available'
      END IN (SELECT jsonb_array_elements_text(v_rules->'quota_states'))
    )
    AND (NOT (v_rules ? 'exclude_active_promo') OR u.promo_discount IS NULL)
    AND (NOT (v_rules ? 'checkout_abandoned_hours_min') OR (
      lc.started_at IS NOT NULL
      AND lc.started_at <= now() - make_interval(hours => (v_rules->>'checkout_abandoned_hours_min')::integer)
      AND NOT EXISTS (
        SELECT 1 FROM public.marketing_events purchase_event
        WHERE purchase_event.user_id = u.id
          AND purchase_event.event_type = 'purchased'
          AND purchase_event.occurred_at > lc.started_at
      )
    ))
    AND (NOT (v_rules ? 'exclude_user_ids') OR NOT (u.id::text = ANY (
      ARRAY(SELECT jsonb_array_elements_text(v_rules->'exclude_user_ids'))
    )))
  ORDER BY u.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 1000), 1), 10000);
END;
$$;

-- The dispatcher can issue an offer, but no browser role can mint one. A
-- recipient may receive only one offer for this campaign, valid for seven days.
CREATE OR REPLACE FUNCTION public.provision_checkout_recovery_offer(
  p_campaign_id uuid,
  p_user_id uuid,
  p_delivery_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing public.promo_codes%ROWTYPE;
  v_user public.users%ROWTYPE;
  v_code text;
  v_expires_at timestamptz := now() + interval '7 days';
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_user
  FROM public.users
  WHERE id = p_user_id AND role <> 'admin' AND subscription_tier = 'free';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('available', false, 'reason', 'not_free');
  END IF;
  IF v_user.promo_discount IS NOT NULL THEN
    RETURN jsonb_build_object('available', false, 'reason', 'active_promo');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.marketing_deliveries
    WHERE id = p_delivery_id AND campaign_id = p_campaign_id AND user_id = p_user_id AND channel = 'email'
  ) THEN
    RAISE EXCEPTION 'Recovery delivery does not match campaign recipient' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing
  FROM public.promo_codes
  WHERE marketing_campaign_id = p_campaign_id AND assigned_user_id = p_user_id
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'available', v_existing.is_active AND (v_existing.offer_expires_at IS NULL OR v_existing.offer_expires_at > now()),
      'code', v_existing.code,
      'expires_at', v_existing.offer_expires_at
    );
  END IF;

  v_code := 'BACK15-' || upper(substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 10));
  INSERT INTO public.promo_codes (
    code, discount_type, discount_value, is_active, valid_from, valid_until,
    max_uses, current_uses, marketing_campaign_id, marketing_delivery_id, label,
    assigned_user_id, offer_expires_at
  ) VALUES (
    v_code, 'percentage', 15, true, now(), v_expires_at,
    1, 0, p_campaign_id, p_delivery_id, 'Checkout recovery · 15% · single use',
    p_user_id, v_expires_at
  );

  RETURN jsonb_build_object('available', true, 'code', v_code, 'expires_at', v_expires_at);
END;
$$;

REVOKE ALL ON FUNCTION public.provision_checkout_recovery_offer(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_checkout_recovery_offer(uuid, uuid, uuid) TO service_role;

-- Bind personalised offers to their intended profile during redemption and at
-- checkout validation. The second check protects against any legacy path that
-- could otherwise write promo_discount without the redemption RPC.
CREATE OR REPLACE FUNCTION public.redeem_promo_code(code_lookup text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_auth_id uuid;
  v_profile_id uuid;
  v_promo public.promo_codes%ROWTYPE;
  v_already_used boolean;
BEGIN
  v_auth_id := auth.uid();
  IF v_auth_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not logged in');
  END IF;
  SELECT id INTO v_profile_id FROM public.users WHERE auth_id = v_auth_id;
  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE upper(code) = upper(trim(code_lookup))
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > now())
    AND (offer_expires_at IS NULL OR offer_expires_at > now())
    AND (assigned_user_id IS NULL OR assigned_user_id = v_profile_id)
    AND (max_uses IS NULL OR current_uses < max_uses);
  IF v_promo IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired promo code');
  END IF;

  SELECT (v_promo.id::text = ANY(COALESCE(used_promo_codes, ARRAY[]::text[])))
  INTO v_already_used
  FROM public.users
  WHERE auth_id = v_auth_id;
  IF COALESCE(v_already_used, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already used this promo code');
  END IF;

  IF v_promo.grants_subscription IS NOT NULL THEN
    UPDATE public.users
    SET subscription_tier = v_promo.grants_subscription,
        promo_discount = NULL,
        used_promo_codes = array_append(COALESCE(used_promo_codes, ARRAY[]::text[]), v_promo.id::text),
        updated_at = now()
    WHERE auth_id = v_auth_id;
    UPDATE public.promo_codes SET current_uses = COALESCE(current_uses, 0) + 1 WHERE id = v_promo.id;
    RETURN jsonb_build_object('success', true, 'type', 'grant', 'subscription', v_promo.grants_subscription,
      'message', 'Subscription ' || initcap(v_promo.grants_subscription) || ' activated successfully!');
  END IF;

  UPDATE public.users
  SET promo_discount = jsonb_build_object(
        'code', v_promo.code,
        'discount_type', v_promo.discount_type,
        'discount_value', v_promo.discount_value,
        'applied_date', now()
      ),
      used_promo_codes = array_append(COALESCE(used_promo_codes, ARRAY[]::text[]), v_promo.id::text),
      updated_at = now()
  WHERE auth_id = v_auth_id;
  UPDATE public.promo_codes SET current_uses = COALESCE(current_uses, 0) + 1 WHERE id = v_promo.id;
  RETURN jsonb_build_object('success', true, 'type', 'discount',
    'discount_type', v_promo.discount_type, 'discount_value', v_promo.discount_value,
    'code', v_promo.code, 'message', 'Discount applied successfully!');
END;
$$;

-- Give the recovery engine a live admin view. Counts are based on the current
-- latest checkout state, while sent and recovered counts are server-attributed.
CREATE OR REPLACE FUNCTION public.get_checkout_recovery_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_campaign_id uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  SELECT id INTO v_campaign_id
  FROM public.marketing_campaigns
  WHERE metadata->>'system_key' = 'journey:checkout_abandoned'
  LIMIT 1;

  RETURN (
    WITH latest_checkout AS (
      SELECT user_id, max(occurred_at) AS started_at
      FROM public.marketing_events
      WHERE event_type = 'checkout_started'
      GROUP BY user_id
    ), open_checkouts AS (
      SELECT lc.user_id, lc.started_at
      FROM latest_checkout lc
      JOIN public.users u ON u.id = lc.user_id
      WHERE u.role <> 'admin'
        AND u.subscription_tier = 'free'
        AND NOT EXISTS (
          SELECT 1 FROM public.marketing_events p
          WHERE p.user_id = lc.user_id AND p.event_type = 'purchased' AND p.occurred_at > lc.started_at
        )
    ), sent AS (
      SELECT DISTINCT user_id
      FROM public.marketing_deliveries
      WHERE campaign_id = v_campaign_id AND channel = 'email' AND status NOT IN ('skipped', 'failed')
    ), recovered AS (
      SELECT DISTINCT user_id
      FROM public.marketing_events
      WHERE campaign_id = v_campaign_id AND event_type = 'purchased'
    )
    SELECT jsonb_build_object(
      'campaign_id', v_campaign_id,
      'waiting', count(*) FILTER (WHERE started_at > now() - interval '2 hours'),
      'eligible', count(*) FILTER (WHERE started_at <= now() - interval '2 hours'),
      'sent', (SELECT count(*) FROM sent),
      'recovered', (SELECT count(*) FROM recovered),
      'conversion_rate', CASE WHEN (SELECT count(*) FROM sent) > 0
        THEN round(100.0 * (SELECT count(*) FROM recovered) / (SELECT count(*) FROM sent), 1)
        ELSE 0 END
    )
    FROM open_checkouts
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_checkout_recovery_dashboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_checkout_recovery_dashboard() TO authenticated, service_role;

UPDATE public.marketing_segments
SET description = 'Free learners whose latest checkout started at least two hours ago without a purchase or active promo.',
    rules = '{"subscription_tiers":["free"],"checkout_abandoned_hours_min":2,"exclude_active_promo":true}'::jsonb,
    is_active = true,
    updated_at = now()
WHERE name = 'Checkout abandoned';

UPDATE public.marketing_campaigns
SET name = 'Checkout recovery · 15% offer',
    status = 'active',
    channels = ARRAY['email']::text[],
    subject = 'Your 15% IELTS plan offer is ready',
    title = 'Your 15% plan offer is ready',
    message = 'You were close to choosing a plan. We saved a one-time 15% offer for you so you can continue with consistent AI feedback and focused IELTS practice when the time is right.',
    cta_label = 'Claim 15% off',
    cta_url = '/pricing',
    promo_code_id = NULL,
    frequency_cap = 1,
    cooldown_hours = 168,
    activated_at = COALESCE(activated_at, now()),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'checkout_recovery_offer_percent', 15,
      'checkout_recovery_offer_expiry_days', 7,
      'configured_by', 'checkout_recovery_engine'
    ),
    updated_at = now()
WHERE metadata->>'system_key' = 'journey:checkout_abandoned';

UPDATE public.marketing_journeys
SET is_active = true,
    delay_hours = 0,
    cooldown_hours = 168,
    config = COALESCE(config, '{}'::jsonb) || jsonb_build_object(
      'exit_on', 'purchase',
      'automatic_discount', true,
      'discount_percent', 15,
      'offer_expiry_days', 7,
      'minimum_hours_after_checkout', 2
    ),
    updated_at = now()
WHERE trigger_type = 'checkout_abandoned';

UPDATE public.marketing_campaign_templates
SET description = 'Consent-aware checkout recovery email sent about two hours after the latest unfinished checkout. Issues a one-use 15% offer valid for seven days.',
    channels = ARRAY['email']::text[],
    subject = 'Your 15% IELTS plan offer is ready',
    title = 'Your 15% plan offer is ready',
    message = 'You were close to choosing a plan. We saved a one-time 15% offer for you so you can continue with consistent AI feedback and focused IELTS practice when the time is right.',
    cta_label = 'Claim 15% off',
    cta_url = '/pricing',
    is_active = true,
    updated_at = now()
WHERE name = 'Auto: checkout reminder';

DO $cron$
DECLARE v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'hourly-marketing-journeys';
  IF v_job_id IS NOT NULL THEN PERFORM cron.unschedule(v_job_id); END IF;
  SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'quarter-hour-marketing-journeys';
  IF v_job_id IS NOT NULL THEN PERFORM cron.unschedule(v_job_id); END IF;
END;
$cron$;

SELECT cron.schedule(
  'quarter-hour-marketing-journeys',
  '7,22,37,52 * * * *',
  $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
      || '/functions/v1/marketing-campaign-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Scheduler-Secret',
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'scheduled_email_token')
    ),
    body := '{"process_journeys":true}'::jsonb,
    timeout_milliseconds := 55000
  ) AS request_id;
  $cron$
);

NOTIFY pgrst, 'reload schema';

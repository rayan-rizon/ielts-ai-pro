-- Checkout recovery email: make the "checkout abandoned" audience real.
--
-- The recovery journey existed but could never reach anyone: its audience read
-- `checkout_started` / `purchased` rows from marketing_events, and none are
-- ever written there (checkout is tracked in marketing_checkout_intents). It
-- also excluded every learner who had applied a promo code, which is most of
-- the people who start checkout. This migration
--   1. reads checkout starts and purchases from marketing_checkout_intents,
--   2. adds a `checkout_abandoned_hours_max` rule so a months-old attempt is
--      not chased,
--   3. lets the personal signup offer be reused or issued for a checkout
--      recovery delivery (the issuer already returns an existing code),
--   4. points the "Checkout recovery" journey at a new campaign. The campaign
--      is created PAUSED: nothing is sent until it is activated.

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
  triggered_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
    -- Checkout starts are recorded as intents when a Stripe session is created;
    -- the legacy marketing event is kept so older rows still count.
    SELECT x.user_id, max(x.started_at) AS started_at
    FROM (
      SELECT me.user_id, me.occurred_at AS started_at
      FROM public.marketing_events me
      WHERE me.event_type = 'checkout_started'
      UNION ALL
      SELECT i.user_id, i.initiated_at
      FROM public.marketing_checkout_intents i
      WHERE i.status = 'initiated'
    ) x
    GROUP BY x.user_id
  )
  SELECT u.id, u.email, u.full_name, u.subscription_tier,
    (u.marketing_email_unsubscribed_at IS NULL),
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
    AND (NOT p_require_marketing_consent OR u.marketing_email_unsubscribed_at IS NULL)
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
      AND NOT EXISTS (
        SELECT 1 FROM public.marketing_checkout_intents paid_intent
        WHERE paid_intent.user_id = u.id
          AND paid_intent.status = 'settled'
          AND paid_intent.updated_at > lc.started_at
      )
    ))
    AND (NOT (v_rules ? 'checkout_abandoned_hours_max') OR (
      lc.started_at IS NOT NULL
      AND lc.started_at >= now() - make_interval(hours => (v_rules->>'checkout_abandoned_hours_max')::integer)
    ))
    AND (NOT (v_rules ? 'exclude_user_ids') OR NOT (u.id::text = ANY (
      ARRAY(SELECT jsonb_array_elements_text(v_rules->'exclude_user_ids'))
    )))
  ORDER BY u.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 1000), 1), 10000);
END;
$function$;

-- The same offer machinery serves the checkout-recovery stage. The issuer reuses
-- a learner's existing personal code and never issues a second one.
CREATE OR REPLACE FUNCTION public.provision_signup_subscription_offer(p_campaign_id uuid, p_user_id uuid, p_delivery_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.marketing_deliveries d JOIN public.marketing_campaigns c ON c.id=d.campaign_id
    WHERE d.id=p_delivery_id AND d.user_id=p_user_id AND d.campaign_id=p_campaign_id AND d.channel IN ('email','in_app','banner')
      AND ((c.metadata->>'lifecycle_stage' IN ('signup','first_result','quota','checkout') AND c.metadata->>'signup_offer_percent'='20') OR EXISTS(SELECT 1 FROM public.promo_codes p WHERE p.id=c.promo_code_id AND p.is_signup_offer_template))
  ) THEN RAISE EXCEPTION 'Signup offer delivery mismatch' USING ERRCODE='42501'; END IF;
  RETURN public.issue_signup_subscription_offer(p_user_id,p_campaign_id,p_delivery_id);
END $function$;

-- Anyone who started checkout in the last 14 days and is still free, one hour
-- after they left. Learners who already applied a code stay in: that code is
-- the strongest reason to come back.
UPDATE public.marketing_segments
SET rules = jsonb_build_object(
      'subscription_tiers', jsonb_build_array('free'),
      'checkout_abandoned_hours_min', 1,
      'checkout_abandoned_hours_max', 336
    ),
    description = 'Free learners who started checkout between one hour and fourteen days ago without purchasing.',
    updated_at = now()
WHERE name = 'Checkout abandoned';

-- One email, sent once per abandoned checkout. Created paused.
INSERT INTO public.marketing_campaigns
  (name, objective, status, segment_id, channels, subject, title, message,
   cta_label, cta_url, frequency_cap, cooldown_hours, metadata)
SELECT
  'Checkout recovery · plan saved', 'paid_conversion', 'paused', s.id, ARRAY['email'],
  'Your plan is saved — finish in one click',
  'You were one step away',
  'You started checkout but did not finish, so we kept your plan ready. Pick it up where you left it, with your practice history already in your account.',
  'Finish your plan', '/pricing', 1, 168,
  jsonb_build_object(
    'system_key', 'journey:checkout_abandoned:plan_saved',
    'configured_by', 'checkout_recovery_email',
    'lifecycle_stage', 'checkout',
    'signup_offer_percent', 20
  )
FROM public.marketing_segments s
WHERE s.name = 'Checkout abandoned'
  AND NOT EXISTS (
    SELECT 1 FROM public.marketing_campaigns c WHERE c.metadata->>'system_key' = 'journey:checkout_abandoned:plan_saved'
  );

-- The journey that watches for abandoned checkouts now sends the new email.
UPDATE public.marketing_journeys j
SET campaign_id = c.id, updated_at = now()
FROM public.marketing_campaigns c
WHERE j.trigger_type = 'checkout_abandoned'
  AND c.metadata->>'system_key' = 'journey:checkout_abandoned:plan_saved';

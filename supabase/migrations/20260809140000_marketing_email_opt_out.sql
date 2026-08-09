-- Marketing email: move from opt-in to opt-out, and make unsubscribe real.
--
-- Two problems this fixes.
--
-- 1. The gate was the wrong column. Email eligibility was reading
--    `users.consent_marketing`, which is the *cookie banner's* marketing
--    toggle. It is written only by CookieConsent.jsx / CookieSettings.jsx, no
--    signup step ever set it, and 189 of 190 users had it false — so every
--    marketing email was skipped with 'marketing_consent_required' and the
--    funnel could never move. It also means a learner accepting or rejecting
--    marketing *cookies* silently changed their *email* subscription, which is
--    not what either control claims to do.
--
--    Email now has its own column, `marketing_email_unsubscribed_at`. NULL
--    means subscribed, so every existing and future user is reachable by
--    default and the cookie banner no longer touches email at all.
--
-- 2. Unsubscribe did not work. Every email footer linked to
--    `/settings?tab=preferences`, which is not one of the Settings tabs — the
--    page silently fell back to Profile, so a learner clicking "Unsubscribe"
--    got their profile page and no way to opt out. `unsubscribe_marketing_email`
--    below gives the email a token-authenticated, no-login opt-out that works
--    from the message itself.

-- 1. Opt-out column ---------------------------------------------------------

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS marketing_email_unsubscribed_at timestamptz;

COMMENT ON COLUMN public.users.marketing_email_unsubscribed_at IS
  'When the learner opted out of marketing email. NULL means subscribed. '
  'Distinct from consent_marketing, which is the cookie banner''s toggle and '
  'must never gate email.';

-- Partial index: the dispatcher filters on "still subscribed", which is the
-- overwhelming majority, so index the opted-out minority instead.
CREATE INDEX IF NOT EXISTS users_marketing_unsubscribed_idx
  ON public.users (marketing_email_unsubscribed_at)
  WHERE marketing_email_unsubscribed_at IS NOT NULL;

-- 2. Record unsubscribes as first-class funnel events ------------------------

ALTER TABLE public.marketing_events
  DROP CONSTRAINT IF EXISTS marketing_events_event_type_check;
ALTER TABLE public.marketing_events
  ADD CONSTRAINT marketing_events_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'delivered', 'viewed', 'clicked', 'checkout_started',
    'purchased', 'exited', 'failed', 'unsubscribed'
  ]));

-- 3. Segment membership now gates on the email opt-out ----------------------
--
-- The returned `consent_marketing` column keeps its name so the dispatcher and
-- the admin estimate RPC keep working unchanged, but it now answers the only
-- question the caller actually asks of it: may we email this person?

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
    SELECT me.user_id, max(me.occurred_at) AS started_at
    FROM public.marketing_events me
    WHERE me.event_type = 'checkout_started'
    GROUP BY me.user_id
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
    ))
    AND (NOT (v_rules ? 'exclude_user_ids') OR NOT (u.id::text = ANY (
      ARRAY(SELECT jsonb_array_elements_text(v_rules->'exclude_user_ids'))
    )))
  ORDER BY u.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 1000), 1), 10000);
END;
$function$;

-- 4. Token-authenticated unsubscribe ----------------------------------------
--
-- Authenticated by the delivery's own tracking_token, so it works straight from
-- the email with no login — which is the only way an unsubscribe link is
-- actually usable. Idempotent: clicking twice is not an error, and the opt-out
-- timestamp is not overwritten on a repeat click.

CREATE OR REPLACE FUNCTION public.unsubscribe_marketing_email(
  p_delivery_id uuid,
  p_token uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_delivery record;
  v_already boolean;
BEGIN
  SELECT d.id, d.campaign_id, d.user_id
    INTO v_delivery
  FROM public.marketing_deliveries d
  WHERE d.id = p_delivery_id AND d.tracking_token = p_token;

  IF v_delivery.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_token');
  END IF;

  SELECT marketing_email_unsubscribed_at IS NOT NULL INTO v_already
  FROM public.users WHERE id = v_delivery.user_id;

  UPDATE public.users
  SET marketing_email_unsubscribed_at = COALESCE(marketing_email_unsubscribed_at, now())
  WHERE id = v_delivery.user_id;

  INSERT INTO public.marketing_events (
    campaign_id, delivery_id, user_id, event_type, channel, dedupe_key, metadata
  ) VALUES (
    v_delivery.campaign_id, v_delivery.id, v_delivery.user_id,
    'unsubscribed', 'email',
    v_delivery.id || ':unsubscribed',
    jsonb_build_object('source', 'email_footer_link')
  )
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'already', COALESCE(v_already, false));
END;
$function$;

REVOKE ALL ON FUNCTION public.unsubscribe_marketing_email(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unsubscribe_marketing_email(uuid, uuid) TO service_role;

-- 5. Logged-in self-service toggle ------------------------------------------

CREATE OR REPLACE FUNCTION public.set_my_marketing_email_subscription(p_subscribed boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := public.get_my_public_user_id();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  UPDATE public.users
  SET marketing_email_unsubscribed_at = CASE WHEN p_subscribed THEN NULL ELSE now() END
  WHERE id = v_user_id;

  RETURN p_subscribed;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_my_marketing_email_subscription(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_marketing_email_subscription(boolean) TO authenticated;

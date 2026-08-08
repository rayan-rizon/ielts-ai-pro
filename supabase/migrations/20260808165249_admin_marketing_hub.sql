-- Admin Marketing Hub: consent-aware campaigns, reusable audiences, journeys,
-- delivery telemetry, and Stripe-confirmed attribution.

CREATE TABLE public.marketing_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 100),
  description text,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(rules) = 'object'),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  objective text NOT NULL DEFAULT 'paid_conversion'
    CHECK (objective IN ('paid_conversion', 'activation', 'retention', 'referral', 'announcement')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  segment_id uuid REFERENCES public.marketing_segments(id) ON DELETE SET NULL,
  channels text[] NOT NULL DEFAULT ARRAY['in_app']::text[]
    CHECK (channels <@ ARRAY['in_app', 'banner', 'email']::text[] AND cardinality(channels) > 0),
  subject text,
  title text NOT NULL,
  message text NOT NULL,
  cta_label text,
  cta_url text,
  promo_code_id uuid REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  frequency_cap integer NOT NULL DEFAULT 1 CHECK (frequency_cap BETWEEN 1 AND 20),
  cooldown_hours integer NOT NULL DEFAULT 72 CHECK (cooldown_hours BETWEEN 0 AND 8760),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  activated_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketing_campaign_window CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  CONSTRAINT marketing_campaign_audience_required CHECK (
    status IN ('draft', 'cancelled') OR segment_id IS NOT NULL
  ),
  CONSTRAINT marketing_campaign_email_subject CHECK (
    NOT ('email' = ANY(channels)) OR char_length(trim(COALESCE(subject, ''))) > 0
  ),
  CONSTRAINT marketing_campaign_cta_url CHECK (
    cta_url IS NULL OR cta_url ~ '^/'
    OR cta_url ~* '^https://([a-z0-9-]+\.)?ieltsai\.pro(/|$)'
  )
);

CREATE TABLE public.marketing_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  journey_id uuid,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('in_app', 'banner', 'email')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'accepted', 'delivered', 'viewed', 'clicked', 'skipped', 'failed')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(content) = 'object'),
  provider_message_id text,
  failure_reason text,
  attempt integer NOT NULL DEFAULT 1 CHECK (attempt >= 1),
  tracking_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  delivered_at timestamptz,
  viewed_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, user_id, channel, attempt)
);

CREATE TABLE public.marketing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  delivery_id uuid REFERENCES public.marketing_deliveries(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  event_type text NOT NULL
    CHECK (event_type IN ('delivered', 'viewed', 'clicked', 'checkout_started', 'purchased', 'exited', 'failed')),
  channel text CHECK (channel IS NULL OR channel IN ('in_app', 'banner', 'email', 'checkout', 'stripe')),
  dedupe_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX marketing_events_dedupe_idx
  ON public.marketing_events (dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX marketing_events_campaign_time_idx ON public.marketing_events (campaign_id, occurred_at DESC);
CREATE INDEX marketing_deliveries_user_status_idx ON public.marketing_deliveries (user_id, status, created_at DESC);
CREATE INDEX marketing_deliveries_campaign_status_idx ON public.marketing_deliveries (campaign_id, status);
CREATE INDEX marketing_deliveries_journey_status_idx ON public.marketing_deliveries (journey_id, status)
  WHERE journey_id IS NOT NULL;
CREATE INDEX marketing_campaigns_schedule_idx ON public.marketing_campaigns (status, starts_at, ends_at);

CREATE TABLE public.marketing_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 100),
  trigger_type text NOT NULL CHECK (trigger_type IN (
    'signup_incomplete', 'first_practice_completed', 'low_quota', 'inactivity',
    'trial_expiry', 'checkout_abandoned', 'payment_failed', 'cancel_scheduled', 'exam_upcoming'
  )),
  segment_id uuid REFERENCES public.marketing_segments(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT false,
  delay_hours integer NOT NULL DEFAULT 0 CHECK (delay_hours BETWEEN 0 AND 8760),
  cooldown_hours integer NOT NULL DEFAULT 168 CHECK (cooldown_hours BETWEEN 1 AND 8760),
  config jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(config) = 'object'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trigger_type)
);

ALTER TABLE public.marketing_deliveries
  ADD CONSTRAINT marketing_deliveries_journey_id_fkey
  FOREIGN KEY (journey_id) REFERENCES public.marketing_journeys(id) ON DELETE SET NULL;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS marketing_campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE public.billing_history
  ADD COLUMN IF NOT EXISTS marketing_campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS marketing_delivery_id uuid REFERENCES public.marketing_deliveries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS gross_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.payment_requests
  ADD COLUMN IF NOT EXISTS marketing_campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS marketing_delivery_id uuid REFERENCES public.marketing_deliveries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS billing_history_marketing_campaign_idx
  ON public.billing_history (marketing_campaign_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS promo_codes_marketing_campaign_idx
  ON public.promo_codes (marketing_campaign_id);

ALTER TABLE public.marketing_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketing_segments_admin_all ON public.marketing_segments
  FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY marketing_campaigns_admin_all ON public.marketing_campaigns
  FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY marketing_campaigns_learner_select ON public.marketing_campaigns
  FOR SELECT TO authenticated USING (status IN ('active', 'scheduled'));
CREATE POLICY marketing_journeys_admin_all ON public.marketing_journeys
  FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY marketing_deliveries_admin_all ON public.marketing_deliveries
  FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY marketing_deliveries_owner_select ON public.marketing_deliveries
  FOR SELECT TO authenticated
  USING (user_id = (SELECT public.get_my_public_user_id()));
CREATE POLICY marketing_events_admin_select ON public.marketing_events
  FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY marketing_events_owner_insert ON public.marketing_events
  FOR INSERT TO authenticated WITH CHECK (
    user_id = (SELECT public.get_my_public_user_id())
    AND delivery_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.marketing_deliveries d
      WHERE d.id = delivery_id AND d.user_id = (SELECT public.get_my_public_user_id())
        AND d.campaign_id = campaign_id
    )
  );

REVOKE ALL ON public.marketing_segments, public.marketing_campaigns,
  public.marketing_deliveries, public.marketing_events, public.marketing_journeys FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_segments, public.marketing_campaigns,
  public.marketing_deliveries, public.marketing_journeys TO authenticated;
GRANT SELECT ON public.marketing_deliveries TO authenticated;
GRANT SELECT, INSERT ON public.marketing_events TO authenticated;
GRANT ALL ON public.marketing_segments, public.marketing_campaigns, public.marketing_deliveries,
  public.marketing_events, public.marketing_journeys TO service_role;

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
  -- SECURITY DEFINER executes as the function owner, so current_user cannot
  -- identify the calling Edge Function. The JWT role remains available via
  -- auth.role(), allowing the service-role dispatcher while every browser
  -- caller remains subject to the admin check.
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
  )
  SELECT u.id, u.email, u.full_name, u.subscription_tier, COALESCE(u.consent_marketing, false),
    CASE
      WHEN v_rules ? 'checkout_abandoned_hours_min' THEN COALESCE((
        SELECT max(me.occurred_at) FROM public.marketing_events me
        WHERE me.user_id = u.id AND me.event_type = 'checkout_started'
      ), u.created_at)
      WHEN v_rules ? 'payment_failed' THEN COALESCE(u.payment_failed_at, u.updated_at, u.created_at)
      WHEN v_rules ? 'inactive_days_min' THEN COALESCE(u.last_active, u.created_at)
      WHEN v_rules ? 'has_completed_test' AND (v_rules->>'has_completed_test')::boolean
        THEN COALESCE(c.completed_at, u.created_at)
      ELSE u.created_at
    END AS triggered_at
  FROM public.users u
  LEFT JOIN completed c ON c.user_id = u.id
  LEFT JOIN quota q ON q.id = u.id
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
    AND (NOT (v_rules ? 'checkout_abandoned_hours_min') OR EXISTS (
      SELECT 1 FROM public.marketing_events checkout_event
      WHERE checkout_event.user_id = u.id
        AND checkout_event.event_type = 'checkout_started'
        AND checkout_event.occurred_at <= now() - make_interval(hours => (v_rules->>'checkout_abandoned_hours_min')::integer)
        AND NOT EXISTS (
          SELECT 1 FROM public.marketing_events purchase_event
          WHERE purchase_event.user_id = u.id
            AND purchase_event.event_type = 'purchased'
            AND purchase_event.occurred_at > checkout_event.occurred_at
        )
    ))
    AND (NOT (v_rules ? 'exclude_user_ids') OR NOT (u.id::text = ANY (
      ARRAY(SELECT jsonb_array_elements_text(v_rules->'exclude_user_ids'))
    )))
  ORDER BY u.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 1000), 1), 10000);
END;
$$;

CREATE OR REPLACE FUNCTION public.estimate_marketing_segment(p_segment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_total integer; v_email integer;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  SELECT count(*) INTO v_total FROM public.marketing_segment_members(p_segment_id, false, 10000);
  SELECT count(*) INTO v_email FROM public.marketing_segment_members(p_segment_id, true, 10000);
  RETURN jsonb_build_object('total', v_total, 'email_eligible', v_email, 'email_suppressed', v_total - v_email);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_marketing_dashboard(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  WITH campaign_metrics AS (
    SELECT c.id, c.name, c.status, c.objective, c.channels, c.created_at,
      count(DISTINCT d.user_id) FILTER (WHERE d.status NOT IN ('skipped','failed')) AS reach,
      count(DISTINCT d.id) FILTER (WHERE d.status IN ('delivered','viewed','clicked')) AS delivered,
      count(DISTINCT e.user_id) FILTER (WHERE e.event_type = 'viewed') AS views,
      count(DISTINCT e.user_id) FILTER (WHERE e.event_type = 'clicked') AS clicks,
      count(DISTINCT e.user_id) FILTER (WHERE e.event_type = 'checkout_started') AS checkouts,
      count(DISTINCT b.user_id) FILTER (WHERE b.status IN ('completed','paid','succeeded','approved')) AS purchases,
      count(DISTINCT d.id) FILTER (WHERE d.status = 'failed') AS failed,
      count(DISTINCT d.id) FILTER (WHERE d.status = 'skipped') AS skipped,
      count(DISTINCT d.id) FILTER (
        WHERE d.status = 'skipped' AND d.failure_reason = 'marketing_consent_required'
      ) AS consent_excluded
    FROM public.marketing_campaigns c
    LEFT JOIN public.marketing_deliveries d ON d.campaign_id = c.id
    LEFT JOIN public.marketing_events e ON e.campaign_id = c.id AND e.occurred_at >= now() - make_interval(days => GREATEST(p_days, 1))
    LEFT JOIN public.billing_history b ON b.marketing_campaign_id = c.id AND b.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
    GROUP BY c.id
  ), revenues AS (
    SELECT marketing_campaign_id AS id, currency,
      sum(amount) FILTER (WHERE status IN ('completed','paid','succeeded','approved')) AS net,
      sum(COALESCE(gross_amount, amount)) FILTER (WHERE status IN ('completed','paid','succeeded','approved')) AS gross,
      sum(discount_amount) FILTER (WHERE status IN ('completed','paid','succeeded','approved')) AS discount
    FROM public.billing_history
    WHERE marketing_campaign_id IS NOT NULL
      AND created_at >= now() - make_interval(days => GREATEST(p_days, 1))
    GROUP BY marketing_campaign_id, currency
  )
  SELECT jsonb_build_object(
    'campaigns', COALESCE((SELECT jsonb_agg(to_jsonb(cm) || jsonb_build_object(
      'ctr', CASE WHEN cm.views > 0 THEN round(100.0 * cm.clicks / cm.views, 1) ELSE 0 END,
      'conversion_rate', CASE WHEN cm.reach > 0 THEN round(100.0 * cm.purchases / cm.reach, 1) ELSE 0 END
    ) ORDER BY cm.created_at DESC) FROM campaign_metrics cm), '[]'::jsonb),
    'revenue', COALESCE((SELECT jsonb_agg(to_jsonb(r)) FROM revenues r), '[]'::jsonb),
    'totals', jsonb_build_object(
      'active', (SELECT count(*) FROM public.marketing_campaigns WHERE status IN ('active','scheduled')),
      'reach', COALESCE((SELECT sum(reach) FROM campaign_metrics), 0),
      'clicks', COALESCE((SELECT sum(clicks) FROM campaign_metrics), 0),
      'purchases', COALESCE((SELECT sum(purchases) FROM campaign_metrics), 0)
    )
  ) INTO v_result;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_marketing_offer_intelligence()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'promos', COALESCE((SELECT jsonb_agg(to_jsonb(row_data) ORDER BY code) FROM (
      SELECT p.id, p.code, p.label, p.marketing_campaign_id, p.current_uses AS redemptions,
        (SELECT count(DISTINCT b.user_id) FROM public.billing_history b
          WHERE b.promo_code = p.code AND b.status IN ('completed','paid','succeeded','approved')) AS purchasers,
        CASE WHEN COALESCE(p.current_uses, 0) > 0 THEN round(100.0 * (
          SELECT count(DISTINCT b.user_id) FROM public.billing_history b
          WHERE b.promo_code = p.code AND b.status IN ('completed','paid','succeeded','approved')
        ) / p.current_uses, 1) ELSE 0 END AS conversion_rate,
        COALESCE((SELECT jsonb_object_agg(currency, net) FROM (
          SELECT b.currency, sum(b.amount) AS net FROM public.billing_history b
          WHERE b.promo_code = p.code AND b.status IN ('completed','paid','succeeded','approved')
          GROUP BY b.currency
        ) revenue), '{}'::jsonb) AS net_revenue,
        COALESCE((SELECT jsonb_object_agg(currency, discount) FROM (
          SELECT b.currency, sum(b.discount_amount) AS discount FROM public.billing_history b
          WHERE b.promo_code = p.code AND b.status IN ('completed','paid','succeeded','approved')
          GROUP BY b.currency
        ) discounts), '{}'::jsonb) AS discount_cost
        , COALESCE((SELECT jsonb_agg(to_jsonb(plan_row)) FROM (
          SELECT b.tier AS plan, count(DISTINCT b.user_id) AS purchasers
          FROM public.billing_history b
          WHERE b.promo_code = p.code AND b.status IN ('completed','paid','succeeded','approved')
          GROUP BY b.tier
        ) plan_row), '[]'::jsonb) AS plan_performance
        , COALESCE((SELECT jsonb_agg(to_jsonb(source_row)) FROM (
          SELECT COALESCE(u.signup_channel, 'unknown') AS source,
            count(DISTINCT b.user_id) AS purchasers
          FROM public.billing_history b
          JOIN public.users u ON u.id = b.user_id
          WHERE b.promo_code = p.code AND b.status IN ('completed','paid','succeeded','approved')
          GROUP BY COALESCE(u.signup_channel, 'unknown')
        ) source_row), '[]'::jsonb) AS acquisition_performance
      FROM public.promo_codes p
    ) row_data), '[]'::jsonb),
    'referrals', COALESCE((SELECT jsonb_agg(row_data ORDER BY paid DESC, signups DESC) FROM (
      SELECT r.referrer_id, max(referrer.full_name) AS name, max(referrer.email) AS email,
        count(*) AS signups,
        count(*) FILTER (WHERE referred.onboarding_completed OR EXISTS (
          SELECT 1 FROM public.test_sessions ts WHERE ts.user_id = referred.id AND (ts.is_completed OR ts.completed_at IS NOT NULL)
        )) AS activated,
        count(DISTINCT referred.id) FILTER (WHERE EXISTS (
          SELECT 1 FROM public.billing_history bh WHERE bh.user_id = referred.id AND bh.status IN ('completed','paid','succeeded','approved')
        )) AS paid,
        array_remove(ARRAY[
          CASE WHEN count(*) FILTER (WHERE r.referrer_id = r.referred_id) > 0 THEN 'self_referral' END,
          CASE WHEN count(*) FILTER (WHERE referred.created_at < referrer.created_at) > 0 THEN 'chronology' END,
          CASE WHEN count(*) FILTER (WHERE referred.signup_gclid IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.users du WHERE du.id <> referred.id AND du.signup_gclid = referred.signup_gclid
          )) > 0 THEN 'duplicate_google_click' END,
          CASE WHEN count(*) FILTER (WHERE referred.signup_fbclid IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.users du WHERE du.id <> referred.id AND du.signup_fbclid = referred.signup_fbclid
          )) > 0 THEN 'duplicate_meta_click' END
        ], NULL) AS risk_flags
      FROM public.user_referrals r
      JOIN public.users referrer ON referrer.id = r.referrer_id
      JOIN public.users referred ON referred.id = r.referred_id
      GROUP BY r.referrer_id
      LIMIT 100
    ) row_data), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_marketing_breakdowns(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'delivery_channels', COALESCE((
      SELECT jsonb_agg(to_jsonb(channel_row) ORDER BY recipients DESC)
      FROM (
        SELECT d.channel, count(DISTINCT d.user_id) AS recipients,
          count(DISTINCT e.user_id) FILTER (WHERE e.event_type = 'viewed') AS views,
          count(DISTINCT e.user_id) FILTER (WHERE e.event_type = 'clicked') AS clicks
        FROM public.marketing_deliveries d
        LEFT JOIN public.marketing_events e ON e.delivery_id = d.id
          AND e.occurred_at >= now() - make_interval(days => GREATEST(p_days, 1))
        WHERE d.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
        GROUP BY d.channel
      ) channel_row
    ), '[]'::jsonb),
    'acquisition_sources', COALESCE((
      SELECT jsonb_agg(to_jsonb(source_row) ORDER BY recipients DESC)
      FROM (
        SELECT COALESCE(u.signup_channel, 'unknown') AS source,
          count(DISTINCT d.user_id) AS recipients,
          count(DISTINCT b.user_id) FILTER (WHERE b.status IN ('completed','paid','succeeded','approved')) AS purchases
        FROM public.marketing_deliveries d
        JOIN public.users u ON u.id = d.user_id
        LEFT JOIN public.billing_history b ON b.marketing_campaign_id = d.campaign_id AND b.user_id = d.user_id
          AND b.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
        WHERE d.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
        GROUP BY COALESCE(u.signup_channel, 'unknown')
      ) source_row
    ), '[]'::jsonb),
    'plans', COALESCE((
      SELECT jsonb_agg(to_jsonb(plan_row) ORDER BY purchases DESC)
      FROM (
        SELECT b.tier AS plan, b.currency,
          count(DISTINCT b.user_id) AS purchases, sum(b.amount) AS net_revenue
        FROM public.billing_history b
        WHERE b.marketing_campaign_id IS NOT NULL
          AND b.status IN ('completed','paid','succeeded','approved')
          AND b.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
        GROUP BY b.tier, b.currency
      ) plan_row
    ), '[]'::jsonb),
    'first_touch', COALESCE((
      SELECT jsonb_agg(to_jsonb(touch_row) ORDER BY purchases DESC)
      FROM (
        SELECT COALESCE(u.signup_utm_campaign, u.signup_utm_source, u.signup_channel, 'unknown') AS source,
          count(DISTINCT b.user_id) AS purchases
        FROM public.billing_history b
        JOIN public.users u ON u.id = b.user_id
        WHERE b.marketing_campaign_id IS NOT NULL
          AND b.status IN ('completed','paid','succeeded','approved')
          AND b.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
        GROUP BY COALESCE(u.signup_utm_campaign, u.signup_utm_source, u.signup_channel, 'unknown')
      ) touch_row
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_marketing_journey_metrics(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(metric_row) ORDER BY name)
    FROM (
      SELECT j.id, j.name, j.is_active,
        count(DISTINCT d.user_id) FILTER (WHERE d.status <> 'skipped') AS enrolled,
        count(DISTINCT e.user_id) FILTER (WHERE e.event_type = 'purchased') AS converted,
        count(DISTINCT e.user_id) FILTER (WHERE e.event_type = 'exited') AS exited,
        count(DISTINCT d.id) FILTER (WHERE d.status = 'failed') AS failures,
        count(DISTINCT d.id) FILTER (WHERE d.status = 'skipped' AND d.failure_reason = 'cooldown') AS cooldown_skips
      FROM public.marketing_journeys j
      LEFT JOIN public.marketing_deliveries d ON d.journey_id = j.id
        AND d.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
      LEFT JOIN public.marketing_events e ON e.delivery_id = d.id
      GROUP BY j.id
    ) metric_row
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_marketing_delivery_from_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.delivery_id IS NULL THEN RETURN NEW; END IF;
  UPDATE public.marketing_deliveries SET
    status = CASE NEW.event_type WHEN 'clicked' THEN 'clicked' WHEN 'viewed' THEN 'viewed' WHEN 'delivered' THEN 'delivered' ELSE status END,
    delivered_at = CASE WHEN NEW.event_type = 'delivered' THEN COALESCE(delivered_at, NEW.occurred_at) ELSE delivered_at END,
    viewed_at = CASE WHEN NEW.event_type = 'viewed' THEN COALESCE(viewed_at, NEW.occurred_at) ELSE viewed_at END,
    clicked_at = CASE WHEN NEW.event_type = 'clicked' THEN COALESCE(clicked_at, NEW.occurred_at) ELSE clicked_at END,
    updated_at = now()
  WHERE id = NEW.delivery_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER marketing_event_sync_delivery
  AFTER INSERT ON public.marketing_events FOR EACH ROW EXECUTE FUNCTION public.sync_marketing_delivery_from_event();
REVOKE ALL ON FUNCTION public.sync_marketing_delivery_from_event() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.attribute_approved_manual_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id uuid;
BEGIN
  IF OLD.status IS DISTINCT FROM 'approved' AND NEW.status = 'approved'
     AND NEW.marketing_campaign_id IS NOT NULL AND NEW.marketing_delivery_id IS NOT NULL THEN
    SELECT id INTO v_user_id FROM public.users WHERE auth_id = NEW.auth_id;
    IF NOT EXISTS (
      SELECT 1 FROM public.marketing_deliveries d
      WHERE d.id = NEW.marketing_delivery_id
        AND d.campaign_id = NEW.marketing_campaign_id
        AND d.user_id = v_user_id
    ) THEN
      RETURN NEW;
    END IF;
    UPDATE public.billing_history SET
      marketing_campaign_id = NEW.marketing_campaign_id,
      marketing_delivery_id = NEW.marketing_delivery_id,
      gross_amount = COALESCE(gross_amount, NEW.amount),
      discount_amount = COALESCE(discount_amount, 0)
    WHERE transaction_id = NEW.transaction_id;
    INSERT INTO public.marketing_events (
      campaign_id, delivery_id, user_id, event_type, channel, dedupe_key, metadata
    ) VALUES (
      NEW.marketing_campaign_id, NEW.marketing_delivery_id, v_user_id, 'purchased', 'checkout',
      NEW.transaction_id || ':manual-purchased',
      jsonb_build_object('transaction_id', NEW.transaction_id, 'amount', NEW.amount, 'currency', NEW.currency, 'payment_method', NEW.payment_method)
    ) ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER marketing_attribute_manual_payment
  AFTER UPDATE OF status ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.attribute_approved_manual_payment();
REVOKE ALL ON FUNCTION public.attribute_approved_manual_payment() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.marketing_segment_members(uuid, boolean, integer),
  public.estimate_marketing_segment(uuid), public.get_marketing_dashboard(integer),
  public.get_marketing_offer_intelligence(), public.get_marketing_breakdowns(integer),
  public.get_marketing_journey_metrics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_segment_members(uuid, boolean, integer),
  public.estimate_marketing_segment(uuid), public.get_marketing_dashboard(integer),
  public.get_marketing_offer_intelligence(), public.get_marketing_breakdowns(integer),
  public.get_marketing_journey_metrics(integer) TO authenticated, service_role;

INSERT INTO public.marketing_segments (name, description, rules, is_active)
VALUES
  ('New learners not activated', 'Signed up but has not completed onboarding or a test.', '{"onboarding_completed":false,"has_completed_test":false}'::jsonb, true),
  ('First practice completed', 'Free learners who have completed at least one practice.', '{"subscription_tiers":["free"],"has_completed_test":true}'::jsonb, true),
  ('Free learners near quota', 'Free learners with one or fewer AI practices remaining.', '{"subscription_tiers":["free"],"quota_states":["low","exhausted"]}'::jsonb, true),
  ('Inactive free learners', 'Free learners inactive for at least seven days.', '{"subscription_tiers":["free"],"inactive_days_min":7}'::jsonb, true),
  ('Referral bonus expiring', 'Learners whose referral bonus expires within three days.', '{"referral_expiry_days_max":3}'::jsonb, true),
  ('Checkout abandoned', 'Learners who started checkout at least twenty-four hours ago without purchasing.', '{"checkout_abandoned_hours_min":24}'::jsonb, true),
  ('Payment recovery', 'Subscribers with a failed payment.', '{"payment_failed":true}'::jsonb, true),
  ('Cancellation recovery', 'Subscribers scheduled to cancel.', '{"cancel_at_period_end":true}'::jsonb, true),
  ('Exam approaching', 'Learners with an exam date in the next fourteen days.', '{"test_date_days_max":14}'::jsonb, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.marketing_journeys (name, trigger_type, segment_id, is_active, delay_hours, cooldown_hours, config)
SELECT seed.name, seed.trigger_type, s.id, false, seed.delay_hours, seed.cooldown_hours, seed.config
FROM (VALUES
  ('Signup activation', 'signup_incomplete', 'New learners not activated', 24, 168, '{"exit_on":"first_practice"}'::jsonb),
  ('First-practice upgrade', 'first_practice_completed', 'First practice completed', 0, 168, '{"exit_on":"purchase"}'::jsonb),
  ('Low quota upgrade', 'low_quota', 'Free learners near quota', 0, 168, '{"exit_on":"purchase"}'::jsonb),
  ('Return to study', 'inactivity', 'Inactive free learners', 0, 336, '{"exit_on":"activity"}'::jsonb),
  ('Referral expiry upgrade', 'trial_expiry', 'Referral bonus expiring', 0, 168, '{"exit_on":"purchase"}'::jsonb),
  ('Checkout recovery', 'checkout_abandoned', 'Checkout abandoned', 0, 168, '{"exit_on":"purchase","automatic_discount":false}'::jsonb),
  ('Payment recovery', 'payment_failed', 'Payment recovery', 0, 72, '{"exit_on":"payment_recovered"}'::jsonb),
  ('Cancellation retention', 'cancel_scheduled', 'Cancellation recovery', 0, 168, '{"exit_on":"cancellation_reversed"}'::jsonb),
  ('Exam countdown', 'exam_upcoming', 'Exam approaching', 0, 168, '{"exit_on":"exam_date_passed"}'::jsonb)
) AS seed(name, trigger_type, segment_name, delay_hours, cooldown_hours, config)
JOIN public.marketing_segments s ON s.name = seed.segment_name
ON CONFLICT (trigger_type) DO NOTHING;

-- The endpoint performs its own admin-JWT or Vault-token authentication.
-- Running hourly keeps journeys responsive while campaign cooldowns and
-- per-user frequency caps prevent repeated delivery.
DO $block$
DECLARE v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'hourly-marketing-journeys';
  IF v_job_id IS NOT NULL THEN PERFORM cron.unschedule(v_job_id); END IF;
END;
$block$;

SELECT cron.schedule(
  'hourly-marketing-journeys',
  '7 * * * *',
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

-- Personalized Learning & Retention Autopilot
-- Adds an auditable, learner-controlled decision layer on top of the existing
-- campaigns, journeys, deliveries, and server-confirmed outcome attribution.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS test_date_source text NOT NULL DEFAULT 'unknown'
    CHECK (test_date_source IN ('unknown', 'estimated', 'confirmed')),
  ADD COLUMN IF NOT EXISTS test_date_confirmed_at timestamptz;

CREATE TABLE public.marketing_autopilot_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_key text NOT NULL UNIQUE CHECK (playbook_key IN (
    'score_plateau', 'incomplete_test', 'exam_countdown', 'checkout_recovery'
  )),
  name text NOT NULL,
  objective text NOT NULL CHECK (objective IN ('activation', 'retention', 'paid_conversion')),
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  enabled boolean NOT NULL DEFAULT false,
  mode text NOT NULL DEFAULT 'review' CHECK (mode IN ('review', 'guardrailed_auto')),
  allowed_channels text[] NOT NULL DEFAULT ARRAY['in_app']::text[]
    CHECK (allowed_channels <@ ARRAY['in_app', 'banner', 'email', 'push']::text[]),
  priority integer NOT NULL DEFAULT 50 CHECK (priority BETWEEN 1 AND 100),
  cooldown_hours integer NOT NULL DEFAULT 72 CHECK (cooldown_hours BETWEEN 24 AND 8760),
  max_contacts_7d integer NOT NULL DEFAULT 2 CHECK (max_contacts_7d BETWEEN 1 AND 7),
  min_evidence_samples integer NOT NULL DEFAULT 10 CHECK (min_evidence_samples BETWEEN 1 AND 1000),
  experiment_holdout_percent integer NOT NULL DEFAULT 10 CHECK (experiment_holdout_percent BETWEEN 0 AND 50),
  config jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(config) = 'object'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.learner_marketing_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT false,
  timezone text NOT NULL DEFAULT 'Asia/Dhaka' CHECK (char_length(timezone) BETWEEN 1 AND 80),
  quiet_start time NOT NULL DEFAULT '19:00',
  quiet_end time NOT NULL DEFAULT '09:00',
  proactive_paused_until timestamptz,
  feeling text CHECK (feeling IS NULL OR feeling IN ('going_well', 'stuck', 'short_on_time', 'taking_a_break')),
  feeling_recorded_at timestamptz,
  workload_preference text NOT NULL DEFAULT 'standard' CHECK (workload_preference IN ('light', 'standard')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.learner_marketing_preferences.feeling IS
  'Optional learner-reported practice state. It must not be used to target commercial offers.';

CREATE TABLE public.learner_context_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  context_hash text NOT NULL,
  reason text NOT NULL,
  context jsonb NOT NULL CHECK (jsonb_typeof(context) = 'object'),
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence) = 'array'),
  fresh_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, context_hash)
);

CREATE TABLE public.marketing_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_key text NOT NULL REFERENCES public.marketing_autopilot_policies(playbook_key) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  primary_outcome text NOT NULL CHECK (primary_outcome IN (
    'practice_return_7d', 'test_completion_48h', 'plan_adoption_7d', 'settled_purchase_7d'
  )),
  holdout_percent integer NOT NULL DEFAULT 10 CHECK (holdout_percent BETWEEN 1 AND 50),
  minimum_sample_size integer NOT NULL DEFAULT 100 CHECK (minimum_sample_size >= 20),
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_experiment_assignments (
  experiment_id uuid NOT NULL REFERENCES public.marketing_experiments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  variant text NOT NULL CHECK (variant IN ('holdout', 'intervention')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (experiment_id, user_id)
);

CREATE TABLE public.marketing_interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  playbook_key text NOT NULL REFERENCES public.marketing_autopilot_policies(playbook_key) ON DELETE RESTRICT,
  context_snapshot_id uuid REFERENCES public.learner_context_snapshots(id) ON DELETE SET NULL,
  experiment_id uuid REFERENCES public.marketing_experiments(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  journey_id uuid REFERENCES public.marketing_journeys(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'prepared' CHECK (status IN (
    'prepared', 'needs_approval', 'approved', 'queued', 'sent', 'suppressed', 'cancelled', 'expired', 'failed'
  )),
  objective text NOT NULL CHECK (objective IN ('activation', 'retention', 'paid_conversion')),
  recommended_channel text CHECK (recommended_channel IS NULL OR recommended_channel IN ('in_app', 'banner', 'email', 'push')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(content) = 'object'),
  model_metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(model_metadata) = 'object'),
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence) = 'array'),
  rationale text NOT NULL,
  destination text,
  eligible_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  suppression_reason text,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  sent_at timestamptz,
  outcome_window_ends_at timestamptz,
  outcome jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(outcome) = 'object'),
  dedupe_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (destination IS NULL OR destination ~ '^/' OR destination ~* '^https://([a-z0-9-]+\.)?ieltsai\.pro(/|$)')
);

ALTER TABLE public.marketing_deliveries
  ADD COLUMN intervention_id uuid REFERENCES public.marketing_interventions(id) ON DELETE SET NULL;

-- Push becomes a first-class channel only after subscription storage and the
-- delivery worker exist in this migration/release.
ALTER TABLE public.marketing_deliveries
  DROP CONSTRAINT IF EXISTS marketing_deliveries_channel_check,
  ADD CONSTRAINT marketing_deliveries_channel_check
    CHECK (channel IN ('in_app', 'banner', 'email', 'push'));
ALTER TABLE public.marketing_events
  DROP CONSTRAINT IF EXISTS marketing_events_channel_check,
  ADD CONSTRAINT marketing_events_channel_check
    CHECK (channel IS NULL OR channel IN ('in_app', 'banner', 'email', 'push', 'checkout', 'stripe'));

CREATE INDEX marketing_deliveries_intervention_idx
  ON public.marketing_deliveries(intervention_id) WHERE intervention_id IS NOT NULL;
CREATE INDEX marketing_interventions_user_status_idx
  ON public.marketing_interventions(user_id, status, eligible_at DESC);
CREATE INDEX marketing_interventions_playbook_status_idx
  ON public.marketing_interventions(playbook_key, status, created_at DESC);
CREATE INDEX learner_context_snapshots_user_created_idx
  ON public.learner_context_snapshots(user_id, created_at DESC);

CREATE TABLE public.marketing_contact_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  intervention_id uuid REFERENCES public.marketing_interventions(id) ON DELETE CASCADE,
  delivery_id uuid REFERENCES public.marketing_deliveries(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('viewed', 'clicked', 'dismissed', 'not_interested', 'snoozed', 'useful', 'not_useful')),
  snoozed_until timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (intervention_id IS NOT NULL OR delivery_id IS NOT NULL)
);

CREATE UNIQUE INDEX marketing_contact_feedback_once_idx
  ON public.marketing_contact_feedback(user_id, COALESCE(intervention_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(delivery_id, '00000000-0000-0000-0000-000000000000'::uuid), action)
  WHERE action <> 'snoozed';

CREATE TABLE public.marketing_admin_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('messaging', 'journey', 'product', 'payment', 'channel')),
  severity text NOT NULL DEFAULT 'opportunity' CHECK (severity IN ('opportunity', 'attention', 'urgent')),
  title text NOT NULL,
  summary text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence) = 'array'),
  sample_size integer NOT NULL DEFAULT 0 CHECK (sample_size >= 0),
  measurement_window tstzrange,
  proposed_action text NOT NULL,
  validation_outcome text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'accepted', 'dismissed', 'implemented', 'measuring', 'resolved')),
  source text NOT NULL DEFAULT 'deterministic' CHECK (source IN ('deterministic', 'ai')),
  model_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_autopilot_analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_hash text NOT NULL UNIQUE,
  recommendation_count integer NOT NULL DEFAULT 0 CHECK (recommendation_count >= 0),
  model_metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(model_metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth_secret text NOT NULL,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true,
  last_success_at timestamptz,
  failure_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_contact_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  intervention_id uuid NOT NULL UNIQUE REFERENCES public.marketing_interventions(id) ON DELETE CASCADE,
  objective text NOT NULL CHECK (objective IN ('activation', 'retention', 'paid_conversion')),
  reserved_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  consumed_at timestamptz
);
CREATE INDEX marketing_contact_reservations_active_idx
  ON public.marketing_contact_reservations(user_id, expires_at)
  WHERE consumed_at IS NULL;

CREATE TABLE public.marketing_checkout_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('stripe', 'manual')),
  external_session_id text NOT NULL UNIQUE,
  plan_tier text NOT NULL CHECK (plan_tier IN ('pro', 'premium')),
  billing_interval text NOT NULL CHECK (billing_interval IN ('monthly', 'quarterly')),
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN (
    'initiated', 'pending', 'manual_review', 'settled', 'failed', 'expired'
  )),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  initiated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX marketing_checkout_intents_user_status_idx
  ON public.marketing_checkout_intents(user_id, status, initiated_at DESC);

ALTER TABLE public.marketing_autopilot_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_marketing_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_context_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_contact_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_admin_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_autopilot_analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_contact_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_checkout_intents ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.marketing_autopilot_policies, public.learner_marketing_preferences,
  public.learner_context_snapshots, public.marketing_experiments, public.marketing_experiment_assignments,
  public.marketing_interventions, public.marketing_contact_feedback,
  public.marketing_admin_recommendations, public.marketing_autopilot_analysis_runs,
  public.marketing_push_subscriptions,
  public.marketing_contact_reservations, public.marketing_checkout_intents
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON public.learner_marketing_preferences TO authenticated;
GRANT SELECT ON public.marketing_interventions, public.marketing_contact_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_push_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_autopilot_policies,
  public.marketing_experiments, public.marketing_admin_recommendations TO authenticated;
GRANT ALL ON public.marketing_autopilot_policies, public.learner_marketing_preferences,
  public.learner_context_snapshots, public.marketing_experiments, public.marketing_experiment_assignments,
  public.marketing_interventions, public.marketing_contact_feedback,
  public.marketing_admin_recommendations, public.marketing_autopilot_analysis_runs,
  public.marketing_push_subscriptions,
  public.marketing_contact_reservations, public.marketing_checkout_intents TO service_role;

CREATE POLICY autopilot_policies_admin_select ON public.marketing_autopilot_policies FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY autopilot_policies_admin_insert ON public.marketing_autopilot_policies FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY autopilot_policies_admin_update ON public.marketing_autopilot_policies FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY autopilot_policies_admin_delete ON public.marketing_autopilot_policies FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY learner_preferences_owner_select ON public.learner_marketing_preferences FOR SELECT TO authenticated
  USING (user_id = public.get_my_public_user_id() OR public.is_admin());
CREATE POLICY learner_preferences_owner_insert ON public.learner_marketing_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_my_public_user_id());
CREATE POLICY learner_preferences_owner_update ON public.learner_marketing_preferences FOR UPDATE TO authenticated
  USING (user_id = public.get_my_public_user_id()) WITH CHECK (user_id = public.get_my_public_user_id());

CREATE POLICY interventions_owner_select ON public.marketing_interventions FOR SELECT TO authenticated
  USING (user_id = public.get_my_public_user_id() OR public.is_admin());
CREATE POLICY feedback_owner_select ON public.marketing_contact_feedback FOR SELECT TO authenticated
  USING (user_id = public.get_my_public_user_id() OR public.is_admin());

CREATE POLICY push_owner_select ON public.marketing_push_subscriptions FOR SELECT TO authenticated
  USING (user_id = public.get_my_public_user_id() OR public.is_admin());
CREATE POLICY push_owner_insert ON public.marketing_push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_my_public_user_id());
CREATE POLICY push_owner_update ON public.marketing_push_subscriptions FOR UPDATE TO authenticated
  USING (user_id = public.get_my_public_user_id()) WITH CHECK (user_id = public.get_my_public_user_id());
CREATE POLICY push_owner_delete ON public.marketing_push_subscriptions FOR DELETE TO authenticated
  USING (user_id = public.get_my_public_user_id());

CREATE POLICY experiments_admin_all ON public.marketing_experiments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY recommendations_admin_all ON public.marketing_admin_recommendations FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY analysis_runs_admin_select ON public.marketing_autopilot_analysis_runs FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY checkout_intents_admin_select ON public.marketing_checkout_intents FOR SELECT TO authenticated
  USING (public.is_admin());
GRANT SELECT ON public.marketing_checkout_intents TO authenticated;

CREATE OR REPLACE FUNCTION public.reserve_marketing_contact(p_intervention_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_intervention public.marketing_interventions%ROWTYPE;
  v_reservation_id uuid;
  v_contacts_7d integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;
  SELECT * INTO v_intervention
  FROM public.marketing_interventions
  WHERE id = p_intervention_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('reserved', false, 'reason', 'intervention_missing'); END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_intervention.user_id::text, 0));
  IF EXISTS (
    SELECT 1 FROM public.marketing_contact_reservations
    WHERE intervention_id = p_intervention_id AND consumed_at IS NOT NULL
  ) THEN
    RETURN jsonb_build_object('reserved', false, 'reason', 'already_dispatched');
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.learner_marketing_preferences
    WHERE user_id = v_intervention.user_id AND proactive_paused_until > now()
  ) THEN
    RETURN jsonb_build_object('reserved', false, 'reason', 'learner_paused');
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.marketing_deliveries
    WHERE user_id = v_intervention.user_id
      AND status IN ('processing', 'accepted', 'delivered', 'viewed', 'clicked')
      AND created_at >= now() - interval '72 hours'
      AND intervention_id IS DISTINCT FROM p_intervention_id
  ) OR EXISTS (
    SELECT 1 FROM public.marketing_contact_reservations
    WHERE user_id = v_intervention.user_id AND intervention_id <> p_intervention_id
      AND consumed_at IS NULL AND expires_at > now()
  ) THEN
    RETURN jsonb_build_object('reserved', false, 'reason', 'cross_channel_cooldown');
  END IF;

  SELECT count(*) INTO v_contacts_7d
  FROM public.marketing_deliveries
  WHERE user_id = v_intervention.user_id
    AND status IN ('processing', 'accepted', 'delivered', 'viewed', 'clicked')
    AND created_at >= now() - interval '7 days';
  IF v_contacts_7d >= 2 THEN
    RETURN jsonb_build_object('reserved', false, 'reason', 'cross_channel_contact_cap');
  END IF;
  IF v_intervention.objective = 'paid_conversion' AND EXISTS (
    SELECT 1
    FROM public.marketing_deliveries d
    JOIN public.marketing_interventions i ON i.id = d.intervention_id
    WHERE d.user_id = v_intervention.user_id
      AND i.objective = 'paid_conversion'
      AND d.status IN ('processing', 'accepted', 'delivered', 'viewed', 'clicked')
      AND d.created_at >= now() - interval '7 days'
  ) THEN
    RETURN jsonb_build_object('reserved', false, 'reason', 'upgrade_promotion_cap');
  END IF;

  INSERT INTO public.marketing_contact_reservations(user_id, intervention_id, objective)
  VALUES (v_intervention.user_id, v_intervention.id, v_intervention.objective)
  ON CONFLICT (intervention_id) DO UPDATE
    SET reserved_at = now(), expires_at = now() + interval '10 minutes'
    WHERE public.marketing_contact_reservations.consumed_at IS NULL
  RETURNING id INTO v_reservation_id;
  IF v_reservation_id IS NULL THEN
    RETURN jsonb_build_object('reserved', false, 'reason', 'already_dispatched');
  END IF;
  RETURN jsonb_build_object('reserved', true, 'reservation_id', v_reservation_id);
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_marketing_contact(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_marketing_contact(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.record_marketing_contact_feedback(
  p_delivery_id uuid,
  p_action text,
  p_snoozed_until timestamptz DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile_id uuid := public.get_my_public_user_id();
  v_delivery public.marketing_deliveries%ROWTYPE;
  v_negative_count integer;
BEGIN
  IF v_profile_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  IF p_action NOT IN ('viewed', 'clicked', 'dismissed', 'not_interested', 'snoozed', 'useful', 'not_useful') THEN
    RAISE EXCEPTION 'Invalid feedback action' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(COALESCE(p_metadata, '{}'::jsonb)) <> 'object' THEN
    RAISE EXCEPTION 'Metadata must be an object' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_delivery FROM public.marketing_deliveries
  WHERE id = p_delivery_id AND user_id = v_profile_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Delivery not found' USING ERRCODE = 'P0002'; END IF;

  INSERT INTO public.marketing_contact_feedback(user_id, intervention_id, delivery_id, action, snoozed_until, metadata)
  VALUES (v_profile_id, v_delivery.intervention_id, v_delivery.id, p_action, p_snoozed_until, COALESCE(p_metadata, '{}'::jsonb))
  ON CONFLICT DO NOTHING;

  IF p_action IN ('dismissed', 'not_interested', 'not_useful') THEN
    SELECT count(*) INTO v_negative_count FROM public.marketing_contact_feedback
    WHERE user_id = v_profile_id AND action IN ('dismissed', 'not_interested', 'not_useful')
      AND created_at >= now() - interval '14 days';
    IF v_negative_count >= 2 THEN
      INSERT INTO public.learner_marketing_preferences(user_id, proactive_paused_until)
      VALUES (v_profile_id, now() + interval '30 days')
      ON CONFLICT (user_id) DO UPDATE SET proactive_paused_until = GREATEST(
        COALESCE(public.learner_marketing_preferences.proactive_paused_until, '-infinity'::timestamptz),
        EXCLUDED.proactive_paused_until
      ), updated_at = now();
    END IF;
  END IF;

  RETURN jsonb_build_object('recorded', true, 'paused_until', (
    SELECT proactive_paused_until FROM public.learner_marketing_preferences WHERE user_id = v_profile_id
  ));
END;
$$;

CREATE OR REPLACE FUNCTION public.replace_my_marketing_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth_secret text,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := public.get_my_public_user_id();
  v_subscription_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  IF p_endpoint !~ '^https://' OR char_length(p_endpoint) > 2048
     OR char_length(p_p256dh) NOT BETWEEN 20 AND 512
     OR char_length(p_auth_secret) NOT BETWEEN 8 AND 512 THEN
    RAISE EXCEPTION 'Invalid push subscription' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.marketing_push_subscriptions(
    user_id, endpoint, p256dh, auth_secret, user_agent, is_active, failure_count, updated_at
  ) VALUES (
    v_user_id, p_endpoint, p_p256dh, p_auth_secret, left(p_user_agent, 500), true, 0, now()
  )
  ON CONFLICT (endpoint) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    p256dh = EXCLUDED.p256dh,
    auth_secret = EXCLUDED.auth_secret,
    user_agent = EXCLUDED.user_agent,
    is_active = true,
    failure_count = 0,
    updated_at = now()
  RETURNING id INTO v_subscription_id;
  RETURN v_subscription_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_marketing_autopilot_snapshot(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'policies', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.priority DESC) FROM public.marketing_autopilot_policies p), '[]'::jsonb),
    'recommendations', COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC)
      FROM (SELECT * FROM public.marketing_admin_recommendations WHERE status NOT IN ('dismissed', 'resolved') LIMIT 30) r), '[]'::jsonb),
    'interventions', COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.created_at DESC)
      FROM (SELECT id, playbook_key, status, objective, recommended_channel, content, model_metadata,
          rationale, evidence, destination, expires_at, created_at, sent_at, outcome
        FROM public.marketing_interventions WHERE created_at >= now() - make_interval(days => GREATEST(p_days, 1)) LIMIT 200) i), '[]'::jsonb),
    'channels', COALESCE((SELECT jsonb_agg(to_jsonb(c)) FROM (
      SELECT d.channel, count(DISTINCT d.id) AS deliveries,
        count(DISTINCT d.id) FILTER (WHERE d.viewed_at IS NOT NULL) AS exposed,
        count(DISTINCT d.id) FILTER (WHERE d.clicked_at IS NOT NULL) AS clicked,
        count(DISTINCT d.id) FILTER (WHERE f.action IN ('dismissed', 'not_interested', 'not_useful')) AS negative
      FROM public.marketing_deliveries d
      LEFT JOIN public.marketing_contact_feedback f ON f.delivery_id = d.id
      WHERE d.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
      GROUP BY d.channel ORDER BY d.channel
    ) c), '[]'::jsonb),
    'counts', jsonb_build_object(
      'prepared', (SELECT count(*) FROM public.marketing_interventions WHERE status IN ('prepared', 'needs_approval')),
      'approved', (SELECT count(*) FROM public.marketing_interventions WHERE status IN ('approved', 'queued')),
      'sent', (SELECT count(*) FROM public.marketing_interventions WHERE status = 'sent' AND created_at >= now() - make_interval(days => GREATEST(p_days, 1))),
      'suppressed', (SELECT count(*) FROM public.marketing_interventions WHERE status IN ('suppressed', 'cancelled', 'expired') AND created_at >= now() - make_interval(days => GREATEST(p_days, 1)))
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.provision_autopilot_checkout_offer(
  p_intervention_id uuid,
  p_delivery_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_intervention public.marketing_interventions%ROWTYPE;
  v_delivery public.marketing_deliveries%ROWTYPE;
  v_existing public.promo_codes%ROWTYPE;
  v_checkout_intent_id uuid;
  v_checkout_status text;
  v_code text;
  v_expires_at timestamptz := now() + interval '7 days';
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_intervention FROM public.marketing_interventions WHERE id = p_intervention_id AND playbook_key = 'checkout_recovery';
  SELECT * INTO v_delivery FROM public.marketing_deliveries WHERE id = p_delivery_id AND intervention_id = p_intervention_id;
  IF v_intervention.id IS NULL OR v_delivery.id IS NULL THEN RAISE EXCEPTION 'Intervention delivery mismatch' USING ERRCODE = '42501'; END IF;
  SELECT (item->>'value')::uuid INTO v_checkout_intent_id
  FROM jsonb_array_elements(v_intervention.evidence) item
  WHERE item->>'metric' = 'checkout_intent_id' LIMIT 1;
  SELECT status INTO v_checkout_status FROM public.marketing_checkout_intents
  WHERE id = v_checkout_intent_id AND user_id = v_intervention.user_id;
  IF v_checkout_status IS DISTINCT FROM 'initiated' THEN
    RETURN jsonb_build_object('available', false, 'reason', 'checkout_not_offer_eligible');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_intervention.user_id AND subscription_tier = 'free' AND role <> 'admin' AND promo_discount IS NULL) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'not_eligible');
  END IF;
  SELECT * INTO v_existing FROM public.promo_codes WHERE marketing_campaign_id = v_intervention.campaign_id AND assigned_user_id = v_intervention.user_id LIMIT 1;
  IF FOUND THEN RETURN jsonb_build_object('available', v_existing.is_active AND COALESCE(v_existing.offer_expires_at, now()) > now(), 'code', v_existing.code, 'expires_at', v_existing.offer_expires_at); END IF;
  v_code := 'BACK15-' || upper(substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 10));
  INSERT INTO public.promo_codes(code, discount_type, discount_value, is_active, valid_from, valid_until, max_uses, current_uses, marketing_campaign_id, marketing_delivery_id, label, assigned_user_id, offer_expires_at)
  VALUES (v_code, 'percentage', 15, true, now(), v_expires_at, 1, 0, v_intervention.campaign_id, v_delivery.id, 'Checkout recovery · 15% · single use', v_intervention.user_id, v_expires_at);
  RETURN jsonb_build_object('available', true, 'code', v_code, 'expires_at', v_expires_at);
END;
$$;

REVOKE ALL ON FUNCTION public.record_marketing_contact_feedback(uuid, text, timestamptz, jsonb),
  public.replace_my_marketing_push_subscription(text, text, text, text),
  public.get_marketing_autopilot_snapshot(integer), public.provision_autopilot_checkout_offer(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_marketing_contact_feedback(uuid, text, timestamptz, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.replace_my_marketing_push_subscription(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketing_autopilot_snapshot(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_marketing_contact_feedback(uuid, text, timestamptz, jsonb),
  public.replace_my_marketing_push_subscription(text, text, text, text),
  public.get_marketing_autopilot_snapshot(integer), public.provision_autopilot_checkout_offer(uuid, uuid) TO service_role;

INSERT INTO public.marketing_autopilot_policies
  (playbook_key, name, objective, allowed_channels, priority, cooldown_hours, min_evidence_samples, config)
VALUES
  ('score_plateau', 'Score Plateau Breaker', 'retention', ARRAY['in_app','email','push'], 80, 168, 10,
    '{"completed_tests":3,"window_days":30,"inactive_days":4,"max_band_range":0.5,"require_distinct_tests":true}'::jsonb),
  ('incomplete_test', 'Incomplete Test Rescue', 'activation', ARRAY['in_app','email','push'], 90, 72, 1,
    '{"inactive_hours":2,"outcome_hours":48,"minimum_answered":5}'::jsonb),
  ('exam_countdown', 'Exam Countdown & Momentum', 'retention', ARRAY['in_app','email','push'], 70, 168, 1,
    '{"milestones":[30,15,7],"require_confirmed_date":true}'::jsonb),
  ('checkout_recovery', 'High-Intent Checkout Recovery', 'paid_conversion', ARRAY['in_app','email','push'], 100, 168, 1,
    '{"assist_after_minutes":30,"offer_after_minutes":120,"offer_percent":15,"offer_valid_days":7}'::jsonb)
ON CONFLICT (playbook_key) DO NOTHING;

INSERT INTO public.marketing_segments(name, description, rules, is_active)
VALUES (
  'Autopilot eligible learners',
  'Internal audience marker. The retention worker performs final per-learner eligibility and contact-policy checks.',
  '{}'::jsonb,
  true
)
ON CONFLICT DO NOTHING;

WITH segment AS (
  SELECT id FROM public.marketing_segments WHERE name = 'Autopilot eligible learners' ORDER BY created_at LIMIT 1
), seeds(name, objective, title, message, cta_label, cta_url, playbook_key) AS (
  VALUES
    ('Autopilot · Score Plateau', 'retention', 'A focused next step is ready', 'Review a recent pattern and continue with a short targeted activity.', 'Review my next step', '/dashboard', 'score_plateau'),
    ('Autopilot · Incomplete Test', 'activation', 'Your progress is saved', 'Continue your saved test whenever you are ready.', 'Continue test', '/dashboard', 'incomplete_test'),
    ('Autopilot · Exam Countdown', 'retention', 'Your preparation plan is ready', 'Review a practice plan fitted to your goal and available time.', 'View my plan', '/learning-path', 'exam_countdown'),
    ('Autopilot · Checkout Recovery', 'paid_conversion', 'Need help completing your upgrade?', 'Return to checkout or review the plan when you are ready.', 'Return to plans', '/pricing', 'checkout_recovery')
)
INSERT INTO public.marketing_campaigns(
  name, objective, status, segment_id, channels, title, message, cta_label, cta_url, metadata
)
SELECT s.name, s.objective, 'draft', segment.id, ARRAY['in_app']::text[], s.title, s.message,
  s.cta_label, s.cta_url, jsonb_build_object('autopilot_playbook', s.playbook_key, 'internal_execution_only', true)
FROM seeds s CROSS JOIN segment
WHERE NOT EXISTS (SELECT 1 FROM public.marketing_campaigns c WHERE c.name = s.name);

UPDATE public.marketing_autopilot_policies p
SET campaign_id = c.id
FROM public.marketing_campaigns c
WHERE c.metadata->>'autopilot_playbook' = p.playbook_key
  AND p.campaign_id IS NULL;

DO $cron$
DECLARE v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'quarter-hour-retention-autopilot';
  IF v_job_id IS NOT NULL THEN PERFORM cron.unschedule(v_job_id); END IF;
  SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'daily-retention-autopilot-analysis';
  IF v_job_id IS NOT NULL THEN PERFORM cron.unschedule(v_job_id); END IF;
END;
$cron$;

SELECT cron.schedule(
  'quarter-hour-retention-autopilot',
  '4,19,34,49 * * * *',
  $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/retention-autopilot',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Scheduler-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'scheduled_email_token')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  ) AS request_id;
  $cron$
);

SELECT cron.schedule(
  'daily-retention-autopilot-analysis',
  '25 2 * * *',
  $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/retention-autopilot',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Scheduler-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'scheduled_email_token')
    ),
    body := '{"action":"analyze"}'::jsonb,
    timeout_milliseconds := 55000
  ) AS request_id;
  $cron$
);

NOTIFY pgrst, 'reload schema';

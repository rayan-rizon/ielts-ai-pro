-- Complete the learner-journey coverage promised by the Retention Autopilot
-- plan. Policies remain disabled and review-first. Each policy declares an
-- ordered channel strategy; the worker selects one channel per learner.

CREATE OR REPLACE FUNCTION public.get_marketing_autopilot_snapshot(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (public.is_admin() OR current_setting('request.jwt.claim.role', true) = 'service_role') THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'policies', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.priority DESC) FROM public.marketing_autopilot_policies p), '[]'::jsonb),
    'recommendations', COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC) FROM (SELECT * FROM public.marketing_admin_recommendations WHERE status NOT IN ('dismissed', 'resolved') LIMIT 30) r), '[]'::jsonb),
    'interventions', COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.created_at DESC) FROM (SELECT id, playbook_key, status, objective, recommended_channel, content, model_metadata, rationale, evidence, destination, expires_at, created_at, sent_at, outcome FROM public.marketing_interventions WHERE created_at >= now() - make_interval(days => GREATEST(p_days, 1)) LIMIT 200) i), '[]'::jsonb),
    'channels', COALESCE((SELECT jsonb_agg(to_jsonb(c)) FROM (
      SELECT d.channel,
        count(DISTINCT d.id) AS deliveries,
        count(DISTINCT d.id) FILTER (WHERE d.status = 'failed') AS failed,
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

REVOKE ALL ON FUNCTION public.get_marketing_autopilot_snapshot(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketing_autopilot_snapshot(integer) TO authenticated, service_role;

ALTER TABLE public.marketing_autopilot_policies
  DROP CONSTRAINT IF EXISTS marketing_autopilot_policies_playbook_key_check;
ALTER TABLE public.marketing_autopilot_policies
  ADD CONSTRAINT marketing_autopilot_policies_playbook_key_check CHECK (playbook_key IN (
    'first_practice', 'next_practice', 'subscriber_feature_help', 'quota_upgrade',
    're_engagement', 'cancellation_support', 'referral_bonus_reminder',
    'score_plateau', 'incomplete_test', 'exam_countdown', 'checkout_recovery'
  ));

INSERT INTO public.marketing_autopilot_policies
  (playbook_key, name, objective, allowed_channels, priority, cooldown_hours, min_evidence_samples, config)
VALUES
  ('first_practice', 'First practice guide', 'activation', ARRAY['in_app','email'], 55, 168, 1,
    '{"account_age_hours":24,"account_age_days_max":7,"channel_priority":["in_app","email"]}'::jsonb),
  ('next_practice', 'Next practice suggestion', 'retention', ARRAY['in_app'], 65, 168, 1,
    '{"completed_tests":1,"window_days":7,"channel_priority":["in_app"]}'::jsonb),
  ('subscriber_feature_help', 'Subscriber feature guide', 'retention', ARRAY['in_app'], 75, 168, 1,
    '{"inactive_days":4,"lookback_days":7,"channel_priority":["in_app"]}'::jsonb),
  ('quota_upgrade', 'AI feedback limit help', 'paid_conversion', ARRAY['in_app','banner'], 90, 168, 2,
    '{"quota_days_required":2,"window_days":7,"channel_priority":["in_app","banner"]}'::jsonb),
  ('re_engagement', 'Return to practice', 'retention', ARRAY['push','email','in_app'], 70, 336, 2,
    '{"inactive_days":7,"history_days":30,"channel_priority":["push","email","in_app"]}'::jsonb),
  ('cancellation_support', 'Plan ending support', 'retention', ARRAY['in_app','email'], 98, 168, 1,
    '{"ending_days_max":14,"channel_priority":["in_app","email"]}'::jsonb),
  ('referral_bonus_reminder', 'Referral bonus reminder', 'retention', ARRAY['in_app'], 60, 168, 1,
    '{"expiry_days_max":3,"channel_priority":["in_app"]}'::jsonb)
ON CONFLICT (playbook_key) DO UPDATE SET
  name = EXCLUDED.name,
  objective = EXCLUDED.objective,
  allowed_channels = EXCLUDED.allowed_channels,
  priority = EXCLUDED.priority,
  cooldown_hours = EXCLUDED.cooldown_hours,
  min_evidence_samples = EXCLUDED.min_evidence_samples,
  config = public.marketing_autopilot_policies.config || EXCLUDED.config,
  updated_at = now();

UPDATE public.marketing_autopilot_policies
SET allowed_channels = CASE playbook_key
      WHEN 'score_plateau' THEN ARRAY['in_app','email']::text[]
      WHEN 'incomplete_test' THEN ARRAY['push','in_app']::text[]
      WHEN 'exam_countdown' THEN ARRAY['in_app','email']::text[]
      WHEN 'checkout_recovery' THEN ARRAY['in_app','email']::text[]
      ELSE allowed_channels
    END,
    config = config || jsonb_build_object(
      'channel_priority', CASE playbook_key
        WHEN 'score_plateau' THEN jsonb_build_array('in_app','email')
        WHEN 'incomplete_test' THEN jsonb_build_array('push','in_app')
        WHEN 'exam_countdown' THEN jsonb_build_array('in_app','email')
        WHEN 'checkout_recovery' THEN jsonb_build_array('in_app','email')
        ELSE COALESCE(config->'channel_priority', to_jsonb(allowed_channels))
      END
    ),
    updated_at = now()
WHERE playbook_key IN ('score_plateau', 'incomplete_test', 'exam_countdown', 'checkout_recovery');

WITH segment AS (
  SELECT id FROM public.marketing_segments
  WHERE name = 'Autopilot eligible learners'
  ORDER BY created_at LIMIT 1
), seeds(name, objective, title, message, cta_label, cta_url, playbook_key) AS (
  VALUES
    ('Autopilot · First Practice', 'activation', 'Choose your first practice', 'Start with one suitable activity to establish a useful baseline.', 'Choose practice', '/dashboard', 'first_practice'),
    ('Autopilot · Next Practice', 'retention', 'Build on your first result', 'Use your saved result to choose one useful next activity.', 'Review next step', '/analytics', 'next_practice'),
    ('Autopilot · Subscriber Feature', 'retention', 'Make more of your plan', 'A feature included with your plan may help with your next practice.', 'View my dashboard', '/dashboard', 'subscriber_feature_help'),
    ('Autopilot · AI Feedback Limit', 'paid_conversion', 'Keep using AI feedback', 'Your recent usage shows that a paid plan may be relevant to your practice.', 'Compare plans', '/pricing', 'quota_upgrade'),
    ('Autopilot · Return to Practice', 'retention', 'A short next step is ready', 'Continue with one activity based on your saved progress.', 'Continue learning', '/dashboard', 're_engagement'),
    ('Autopilot · Plan Ending Support', 'retention', 'Review your plan before it ends', 'Your access remains available. Review your progress and plan options when ready.', 'Review my plan', '/settings?tab=subscription', 'cancellation_support'),
    ('Autopilot · Referral Bonus Reminder', 'retention', 'Your referral bonus is still available', 'Review the remaining bonus time and use it if it supports your study plan.', 'View my rewards', '/settings?tab=referrals', 'referral_bonus_reminder')
)
INSERT INTO public.marketing_campaigns(
  name, objective, status, segment_id, channels, title, message, cta_label, cta_url, metadata
)
SELECT s.name, s.objective, 'draft', segment.id, ARRAY['in_app']::text[], s.title, s.message,
  s.cta_label, s.cta_url, jsonb_build_object('autopilot_playbook', s.playbook_key, 'internal_execution_only', true)
FROM seeds s CROSS JOIN segment
WHERE NOT EXISTS (SELECT 1 FROM public.marketing_campaigns c WHERE c.name = s.name);

UPDATE public.marketing_autopilot_policies p
SET campaign_id = c.id,
    updated_at = now()
FROM public.marketing_campaigns c
WHERE c.metadata->>'autopilot_playbook' = p.playbook_key
  AND p.campaign_id IS NULL;

-- A single switch transfers a lifecycle trigger from the older journey runner
-- to Autopilot. Disabling it restores only the journey that Autopilot paused.
CREATE OR REPLACE FUNCTION public.set_marketing_autopilot_policy_state(
  p_policy_id uuid,
  p_enabled boolean DEFAULT NULL,
  p_mode text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_policy public.marketing_autopilot_policies%ROWTYPE;
  v_trigger text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  IF p_mode IS NOT NULL AND p_mode NOT IN ('review', 'guardrailed_auto') THEN
    RAISE EXCEPTION 'Invalid automation mode' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_policy
  FROM public.marketing_autopilot_policies
  WHERE id = p_policy_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Automation not found' USING ERRCODE = 'P0002';
  END IF;

  v_trigger := CASE v_policy.playbook_key
    WHEN 'first_practice' THEN 'signup_incomplete'
    WHEN 'next_practice' THEN 'first_practice_completed'
    WHEN 'quota_upgrade' THEN 'low_quota'
    WHEN 're_engagement' THEN 'inactivity'
    WHEN 'referral_bonus_reminder' THEN 'trial_expiry'
    WHEN 'cancellation_support' THEN 'cancel_scheduled'
    WHEN 'checkout_recovery' THEN 'checkout_abandoned'
    WHEN 'exam_countdown' THEN 'exam_upcoming'
    ELSE NULL
  END;

  IF p_enabled IS TRUE AND v_trigger IS NOT NULL THEN
    UPDATE public.marketing_journeys
    SET is_active = false,
        config = config || jsonb_build_object(
          'superseded_by_autopilot', v_policy.playbook_key,
          'autopilot_previous_active', is_active
        ),
        updated_at = now()
    WHERE trigger_type = v_trigger
      AND is_active = true
      AND NOT (config ? 'superseded_by_autopilot');
  ELSIF p_enabled IS FALSE AND v_trigger IS NOT NULL THEN
    UPDATE public.marketing_journeys
    SET is_active = COALESCE((config->>'autopilot_previous_active')::boolean, false),
        config = config - 'superseded_by_autopilot' - 'autopilot_previous_active',
        updated_at = now()
    WHERE trigger_type = v_trigger
      AND config->>'superseded_by_autopilot' = v_policy.playbook_key;
  END IF;

  UPDATE public.marketing_autopilot_policies
  SET enabled = COALESCE(p_enabled, enabled),
      mode = COALESCE(p_mode, mode),
      updated_at = now()
  WHERE id = p_policy_id
  RETURNING * INTO v_policy;

  RETURN to_jsonb(v_policy);
END;
$$;

REVOKE ALL ON FUNCTION public.set_marketing_autopilot_policy_state(uuid, boolean, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_marketing_autopilot_policy_state(uuid, boolean, text)
  TO authenticated;

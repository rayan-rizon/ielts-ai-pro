-- Keep Autopilot atomic: it may prepare and monitor actions, but a learner
-- contact is sent only after an admin approves the exact stored revision.
UPDATE public.marketing_autopilot_policies
SET mode = 'review',
    updated_at = now()
WHERE mode <> 'review';

ALTER TABLE public.marketing_autopilot_policies
  DROP CONSTRAINT IF EXISTS marketing_autopilot_policies_mode_check;
ALTER TABLE public.marketing_autopilot_policies
  ADD CONSTRAINT marketing_autopilot_policies_mode_check CHECK (mode = 'review');

-- Retain delivery history for reporting, but prevent messages from older
-- journeys resurfacing after Autopilot becomes the owner. An approved active
-- intervention still renders through the learner delivery service.
UPDATE public.marketing_campaigns AS campaign
SET status = 'paused',
    metadata = COALESCE(campaign.metadata, '{}'::jsonb) || jsonb_build_object(
      'superseded_by_autopilot', true,
      'superseded_at', now()
    ),
    updated_at = now()
WHERE EXISTS (
  SELECT 1
  FROM public.marketing_journeys AS journey
  WHERE journey.campaign_id = campaign.id
    AND journey.config ? 'superseded_by_autopilot'
);

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
  IF p_mode IS NOT NULL AND p_mode <> 'review' THEN
    RAISE EXCEPTION 'Only review mode is supported' USING ERRCODE = '22023';
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

    UPDATE public.marketing_campaigns AS campaign
    SET status = 'paused',
        metadata = COALESCE(campaign.metadata, '{}'::jsonb) || jsonb_build_object(
          'superseded_by_autopilot', true,
          'superseded_at', now()
        ),
        updated_at = now()
    WHERE campaign.id = v_policy.campaign_id
       OR campaign.metadata->>'system_key' = 'journey:' || v_trigger;
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
      mode = 'review',
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

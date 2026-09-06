-- Allow the trusted retention worker to reuse the same snapshot RPC used by
-- authenticated admins. Browser callers still need public.is_admin(); only the
-- server-held service-role credential gets the worker path.
CREATE OR REPLACE FUNCTION public.get_marketing_autopilot_snapshot(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (
    public.is_admin()
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

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

REVOKE ALL ON FUNCTION public.get_marketing_autopilot_snapshot(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketing_autopilot_snapshot(integer)
  TO authenticated, service_role;

-- A single switch transfers ownership atomically. When an AI automation takes
-- over a trigger, an older journey cannot continue sending the same message.
-- Disabling it restores only journeys that this function previously paused.
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

-- Familiar admin-facing names; playbook_key remains the stable internal key.
UPDATE public.marketing_autopilot_policies
SET name = CASE playbook_key
  WHEN 'score_plateau' THEN 'Score improvement support'
  WHEN 'incomplete_test' THEN 'Saved test reminder'
  WHEN 'exam_countdown' THEN 'Exam-day study plan'
  WHEN 'checkout_recovery' THEN 'Checkout follow-up'
  ELSE name
END,
updated_at = now()
WHERE playbook_key IN ('score_plateau', 'incomplete_test', 'exam_countdown', 'checkout_recovery');

-- Generic inactivity mail duplicates the evidence-led retention workflow, and
-- trial-expiry mail already has a coordinated multi-channel journey. Keep
-- transactional welcome, renewal, confirmation, and payment mail unchanged.
UPDATE public.system_settings
SET value = jsonb_set(
      jsonb_set(COALESCE(value, '{}'::jsonb), '{inactivity_warning}', 'false'::jsonb, true),
      '{trial_expiry}', 'false'::jsonb, true
    ),
    updated_at = now()
WHERE key = 'email_preferences';

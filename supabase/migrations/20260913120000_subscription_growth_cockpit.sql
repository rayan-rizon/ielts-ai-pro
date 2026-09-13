-- First-party, account-scoped subscription intent telemetry and an admin-only
-- growth read model. Historical account, practice, checkout, and payment facts
-- can be counted from August; pricing views and plan selections are explicitly
-- marked as available only from this migration onward.

CREATE TABLE public.subscription_funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'pricing_viewed', 'plan_selected', 'checkout_started', 'checkout_failed'
  )),
  plan_tier text CHECK (plan_tier IS NULL OR plan_tier IN ('free', 'pro', 'premium')),
  billing_interval text CHECK (
    billing_interval IS NULL OR billing_interval IN ('monthly', 'quarterly')
  ),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  dedupe_key text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_type, dedupe_key)
);

CREATE INDEX subscription_funnel_events_time_idx
  ON public.subscription_funnel_events (occurred_at DESC);
CREATE INDEX subscription_funnel_events_user_time_idx
  ON public.subscription_funnel_events (user_id, occurred_at DESC);

ALTER TABLE public.subscription_funnel_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.subscription_funnel_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.subscription_funnel_events TO service_role;

CREATE OR REPLACE FUNCTION public.record_subscription_funnel_event(
  p_event_type text,
  p_plan_tier text DEFAULT NULL,
  p_billing_interval text DEFAULT NULL,
  p_dedupe_key text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_key text;
BEGIN
  v_user_id := public.get_my_public_user_id();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authenticated learner required' USING ERRCODE = '42501';
  END IF;
  IF p_event_type NOT IN ('pricing_viewed', 'plan_selected', 'checkout_started', 'checkout_failed') THEN
    RAISE EXCEPTION 'Unsupported funnel event' USING ERRCODE = '22023';
  END IF;
  IF p_plan_tier IS NOT NULL AND p_plan_tier NOT IN ('free', 'pro', 'premium') THEN
    RAISE EXCEPTION 'Unsupported plan tier' USING ERRCODE = '22023';
  END IF;
  IF p_billing_interval IS NOT NULL AND p_billing_interval NOT IN ('monthly', 'quarterly') THEN
    RAISE EXCEPTION 'Unsupported billing interval' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(COALESCE(p_metadata, '{}'::jsonb)) <> 'object' THEN
    RAISE EXCEPTION 'Metadata must be an object' USING ERRCODE = '22023';
  END IF;

  v_key := COALESCE(
    NULLIF(left(trim(p_dedupe_key), 160), ''),
    concat_ws(':', COALESCE(p_plan_tier, 'none'), COALESCE(p_billing_interval, 'none'), current_date::text)
  );

  INSERT INTO public.subscription_funnel_events (
    user_id, event_type, plan_tier, billing_interval, metadata, dedupe_key
  ) VALUES (
    v_user_id,
    p_event_type,
    p_plan_tier,
    p_billing_interval,
    COALESCE(p_metadata, '{}'::jsonb) - 'email' - 'name' - 'user_id',
    v_key
  )
  ON CONFLICT (user_id, event_type, dedupe_key) DO NOTHING;

  RETURN jsonb_build_object('recorded', FOUND);
END;
$$;

REVOKE ALL ON FUNCTION public.record_subscription_funnel_event(text, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_subscription_funnel_event(text, text, text, text, jsonb)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_subscription_growth_dashboard(
  p_since timestamptz DEFAULT '2026-08-01 00:00:00+00'::timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
  v_since timestamptz := GREATEST(
    COALESCE(p_since, '2026-08-01 00:00:00+00'::timestamptz),
    now() - interval '730 days'
  );
  v_tracking_started timestamptz := '2026-09-13 12:00:00+00'::timestamptz;
BEGIN
  IF NOT (
    public.is_admin()
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  WITH learner_base AS (
    SELECT
      u.id,
      u.created_at,
      u.onboarding_completed,
      u.subscription_tier,
      u.last_active,
      u.test_date,
      GREATEST(
        COALESCE(u.current_streak, 0),
        COALESCE(u.longest_streak, 0),
        COALESCE(u.study_streak_days, 0)
      ) AS best_streak,
      CASE
        WHEN upper(trim(u.country)) ~ '^[A-Z]{2}$'
          AND upper(trim(u.country)) NOT IN ('XX', 'T1')
          THEN upper(trim(u.country))
        ELSE 'unknown'
      END AS country
    FROM public.users u
    WHERE u.role <> 'admin'
      AND u.created_at >= v_since
  ), practice AS (
    SELECT ts.user_id,
      count(*) FILTER (WHERE ts.is_completed OR ts.completed_at IS NOT NULL) AS completed,
      min(ts.band_score) FILTER (WHERE ts.band_score IS NOT NULL) AS min_band,
      max(ts.band_score) FILTER (WHERE ts.band_score IS NOT NULL) AS max_band,
      avg(ts.band_score) FILTER (WHERE ts.band_score IS NOT NULL) AS avg_band
    FROM public.test_sessions ts
    JOIN learner_base u ON u.id = ts.user_id
    WHERE COALESCE(ts.completed_at, ts.created_at) >= v_since
    GROUP BY ts.user_id
  ), intent AS (
    SELECT e.user_id,
      bool_or(e.event_type = 'pricing_viewed') AS pricing_viewed,
      bool_or(e.event_type = 'plan_selected') AS plan_selected
    FROM public.subscription_funnel_events e
    JOIN learner_base u ON u.id = e.user_id
    WHERE e.occurred_at >= v_since
    GROUP BY e.user_id
  ), checkout AS (
    SELECT c.user_id, true AS checkout_started
    FROM public.marketing_checkout_intents c
    JOIN learner_base u ON u.id = c.user_id
    WHERE c.initiated_at >= v_since
    GROUP BY c.user_id
  ), purchase AS (
    SELECT b.user_id, true AS purchased
    FROM public.billing_history b
    JOIN learner_base u ON u.id = b.user_id
    WHERE b.created_at >= v_since
      AND b.status IN ('completed', 'paid', 'succeeded', 'approved')
    GROUP BY b.user_id
  ), milestones AS (
    SELECT u.*,
      COALESCE(p.completed, 0) AS completed_tests,
      COALESCE(p.min_band, 0) AS min_band,
      COALESCE(p.max_band, 0) AS max_band,
      COALESCE(p.avg_band, 0) AS avg_band,
      COALESCE(i.pricing_viewed, false) AS pricing_viewed,
      COALESCE(i.plan_selected, false) AS plan_selected,
      COALESCE(c.checkout_started, false) AS checkout_started,
      COALESCE(b.purchased, false) AS purchased
    FROM learner_base u
    LEFT JOIN practice p ON p.user_id = u.id
    LEFT JOIN intent i ON i.user_id = u.id
    LEFT JOIN checkout c ON c.user_id = u.id
    LEFT JOIN purchase b ON b.user_id = u.id
  ), country_rows AS (
    SELECT country,
      count(*) AS signups,
      count(*) FILTER (WHERE onboarding_completed) AS onboarded,
      count(*) FILTER (WHERE completed_tests > 0) AS practiced,
      count(*) FILTER (
        WHERE pricing_viewed OR plan_selected OR checkout_started OR purchased
      ) AS pricing_interest,
      count(*) FILTER (WHERE checkout_started) AS checkouts,
      count(*) FILTER (WHERE purchased) AS paid
    FROM milestones
    GROUP BY country
  ), current_learners AS (
    SELECT u.*,
      GREATEST(
        COALESCE(u.current_streak, 0),
        COALESCE(u.longest_streak, 0),
        COALESCE(u.study_streak_days, 0)
      ) AS best_streak,
      COALESCE(stats.completed, 0) AS completed_tests,
      COALESCE(stats.min_band, 0) AS min_band,
      COALESCE(stats.max_band, 0) AS max_band,
      COALESCE(stats.avg_band, 0) AS avg_band
    FROM public.users u
    LEFT JOIN LATERAL (
      SELECT count(*) AS completed,
        min(ts.band_score) FILTER (WHERE ts.band_score IS NOT NULL) AS min_band,
        max(ts.band_score) FILTER (WHERE ts.band_score IS NOT NULL) AS max_band,
        avg(ts.band_score) FILTER (WHERE ts.band_score IS NOT NULL) AS avg_band
      FROM public.test_sessions ts
      WHERE ts.user_id = u.id
        AND (ts.is_completed OR ts.completed_at IS NOT NULL)
        AND COALESCE(ts.completed_at, ts.created_at) >= now() - interval '90 days'
    ) stats ON true
    WHERE u.role <> 'admin'
  ), cohort_counts AS (
    SELECT
      count(*) FILTER (
        WHERE subscription_tier IN ('pro', 'premium')
          AND COALESCE(last_active, created_at) < now() - interval '10 days'
      ) AS at_risk_paid,
      count(*) FILTER (
        WHERE best_streak >= 5
          AND COALESCE(last_active, created_at) < now() - interval '72 hours'
      ) AS broken_streak,
      count(*) FILTER (
        WHERE test_date BETWEEN current_date AND current_date + 14
      ) AS exam_countdown,
      count(*) FILTER (
        WHERE subscription_tier = 'free'
          AND completed_tests >= 3
          AND COALESCE(last_active, created_at) >= now() - interval '48 hours'
      ) AS high_intent_free,
      count(*) FILTER (
        WHERE completed_tests >= 3
          AND avg_band > 0 AND avg_band <= 6.0
          AND max_band - min_band <= 0.5
      ) AS score_plateau
    FROM current_learners
  ), selected_plans AS (
    SELECT plan_tier AS plan, count(DISTINCT user_id) AS learners
    FROM (
      SELECT e.user_id, e.plan_tier
      FROM public.subscription_funnel_events e
      WHERE e.event_type = 'plan_selected'
        AND e.occurred_at >= v_since
        AND e.plan_tier IN ('pro', 'premium')
      UNION ALL
      SELECT c.user_id, c.plan_tier
      FROM public.marketing_checkout_intents c
      WHERE c.initiated_at >= v_since
    ) selections
    GROUP BY plan_tier
  )
  SELECT jsonb_build_object(
    'since', v_since,
    'generated_at', now(),
    'tracking_started_at', v_tracking_started,
    'stages', jsonb_build_array(
      jsonb_build_object('key', 'signed_up', 'label', 'Signed up', 'value', count(*)),
      jsonb_build_object('key', 'onboarded', 'label', 'Onboarded', 'value', count(*) FILTER (WHERE onboarding_completed)),
      jsonb_build_object('key', 'practiced', 'label', 'Practiced', 'value', count(*) FILTER (WHERE completed_tests > 0)),
      jsonb_build_object('key', 'pricing_interest', 'label', 'Pricing interest', 'value', count(*) FILTER (WHERE pricing_viewed OR plan_selected OR checkout_started OR purchased)),
      jsonb_build_object('key', 'checkout_started', 'label', 'Checkout', 'value', count(*) FILTER (WHERE checkout_started)),
      jsonb_build_object('key', 'paid', 'label', 'Paid', 'value', count(*) FILTER (WHERE purchased))
    ),
    'countries', COALESCE((
      SELECT jsonb_agg(to_jsonb(c) || jsonb_build_object(
        'signup_to_paid_rate', CASE WHEN c.signups > 0 THEN round(100.0 * c.paid / c.signups, 1) ELSE 0 END,
        'interest_to_paid_rate', CASE WHEN c.pricing_interest > 0 THEN round(100.0 * c.paid / c.pricing_interest, 1) ELSE 0 END
      ) ORDER BY c.paid DESC, c.pricing_interest DESC, c.signups DESC, c.country)
      FROM country_rows c
    ), '[]'::jsonb),
    'selected_plans', COALESCE((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.learners DESC) FROM selected_plans s), '[]'::jsonb),
    'cohorts', (SELECT jsonb_build_array(
      jsonb_build_object('key', 'at_risk_paid', 'label', 'At-risk paying', 'count', at_risk_paid, 'priority', 'urgent', 'channel', 'in_app_then_email', 'timing', 'Now; email only when away', 'action', 'Offer plan help or a check-in, not an automatic discount'),
      jsonb_build_object('key', 'high_intent_free', 'label', 'High-intent free', 'count', high_intent_free, 'priority', 'high', 'channel', 'in_app', 'timing', 'Next active session', 'action', 'Explain the most relevant paid benefit at the moment of need'),
      jsonb_build_object('key', 'exam_countdown', 'label', 'Exam within 14 days', 'count', exam_countdown, 'priority', 'high', 'channel', 'in_app_then_email', 'timing', 'At 14, 7, and 3 days', 'action', 'Offer a final-stretch study plan using the confirmed exam date'),
      jsonb_build_object('key', 'broken_streak', 'label', 'Broken streak', 'count', broken_streak, 'priority', 'medium', 'channel', 'email_when_away', 'timing', 'After 72 quiet hours', 'action', 'Make the next practice step small and resumable'),
      jsonb_build_object('key', 'score_plateau', 'label', 'Score plateau', 'count', score_plateau, 'priority', 'medium', 'channel', 'in_app', 'timing', 'After the next result', 'action', 'Show one evidence-backed weak area and focused practice')
    ) FROM cohort_counts),
    'coverage', jsonb_build_object(
      'historical_from', v_since,
      'historical_sources', jsonb_build_array('users', 'test_sessions', 'marketing_checkout_intents', 'billing_history'),
      'intent_tracking_from', v_tracking_started,
      'note', 'Pricing views and plan selections are first-party only from the tracking start; checkout and payment facts can predate it.'
    )
  ) INTO v_result
  FROM milestones;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_subscription_growth_dashboard(timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_growth_dashboard(timestamptz)
  TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

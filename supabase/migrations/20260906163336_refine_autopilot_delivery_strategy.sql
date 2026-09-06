-- Deliver exactly one useful message. Learners active in the product see a
-- contextual surface; learners away from the product receive email first if
-- they have consented. Push remains an explicit, lower-priority opt-in.
WITH strategies(playbook_key, allowed_channels, active_channels, away_channels) AS (
  VALUES
    ('first_practice', ARRAY['in_app', 'email']::text[], '["in_app"]'::jsonb, '["email"]'::jsonb),
    ('next_practice', ARRAY['in_app', 'email']::text[], '["in_app"]'::jsonb, '["email"]'::jsonb),
    ('subscriber_feature_help', ARRAY['in_app', 'email']::text[], '["in_app"]'::jsonb, '["email"]'::jsonb),
    ('quota_upgrade', ARRAY['in_app', 'email']::text[], '["in_app"]'::jsonb, '["email"]'::jsonb),
    ('re_engagement', ARRAY['in_app', 'email', 'push']::text[], '["in_app"]'::jsonb, '["email", "push"]'::jsonb),
    ('cancellation_support', ARRAY['banner', 'email']::text[], '["banner"]'::jsonb, '["email"]'::jsonb),
    ('referral_bonus_reminder', ARRAY['in_app', 'email']::text[], '["in_app"]'::jsonb, '["email"]'::jsonb),
    ('score_plateau', ARRAY['in_app', 'email']::text[], '["in_app"]'::jsonb, '["email"]'::jsonb),
    ('incomplete_test', ARRAY['in_app', 'email', 'push']::text[], '["in_app"]'::jsonb, '["email", "push"]'::jsonb),
    ('exam_countdown', ARRAY['banner', 'email']::text[], '["banner"]'::jsonb, '["email"]'::jsonb),
    ('checkout_recovery', ARRAY['in_app', 'email']::text[], '["in_app"]'::jsonb, '["email"]'::jsonb)
)
UPDATE public.marketing_autopilot_policies AS policy
SET
  allowed_channels = strategies.allowed_channels,
  config = policy.config || jsonb_build_object(
    'channel_priority', strategies.allowed_channels,
    'delivery_strategy', jsonb_build_object(
      'active_channels', strategies.active_channels,
      'away_channels', strategies.away_channels
    )
  ),
  updated_at = now()
FROM strategies
WHERE policy.playbook_key = strategies.playbook_key;

-- Familiar names for the compact admin control room. Stable playbook keys stay
-- internal and are never shown to learners or admins.
UPDATE public.marketing_autopilot_policies
SET name = CASE playbook_key
  WHEN 'first_practice' THEN 'First practice'
  WHEN 'next_practice' THEN 'Next practice'
  WHEN 'subscriber_feature_help' THEN 'Plan feature guide'
  WHEN 'quota_upgrade' THEN 'More AI feedback'
  WHEN 're_engagement' THEN 'Return to practice'
  WHEN 'cancellation_support' THEN 'Plan ending'
  WHEN 'referral_bonus_reminder' THEN 'Referral credit reminder'
  WHEN 'score_plateau' THEN 'Improve a steady score'
  WHEN 'incomplete_test' THEN 'Continue a saved test'
  WHEN 'exam_countdown' THEN 'Exam study plan'
  WHEN 'checkout_recovery' THEN 'Finish your upgrade'
  ELSE name
END,
updated_at = now();

-- Safe, editable starting points for the Admin Marketing Hub. Every campaign
-- starts paused and no journey is enabled here, so this migration cannot send
-- a learner message. An admin must explicitly activate and dispatch it.

INSERT INTO public.marketing_segments (name, description, rules, is_active)
SELECT
  seed.name,
  seed.description,
  seed.rules,
  true
FROM (
  VALUES
    (
      'Free learners ready to upgrade',
      'Free learners with completed practice and a low or exhausted AI feedback quota.',
      '{"subscription_tiers":["free"],"has_completed_test":true,"quota_states":["low","exhausted"]}'::jsonb
    ),
    (
      'Returning learners after two weeks',
      'Free learners who have not been active for at least fourteen days.',
      '{"subscription_tiers":["free"],"inactive_days_min":14}'::jsonb
    )
) AS seed(name, description, rules)
WHERE NOT EXISTS (
  SELECT 1 FROM public.marketing_segments existing WHERE existing.name = seed.name
);

INSERT INTO public.marketing_campaigns (
  name,
  objective,
  status,
  segment_id,
  channels,
  title,
  message,
  cta_label,
  cta_url,
  frequency_cap,
  cooldown_hours,
  metadata
)
SELECT
  seed.name,
  seed.objective,
  'paused',
  segment.id,
  seed.channels,
  seed.title,
  seed.message,
  seed.cta_label,
  seed.cta_url,
  1,
  seed.cooldown_hours,
  jsonb_build_object('built_in', true, 'safe_default', 'paused')
FROM (
  VALUES
    (
      'Welcome: complete your first practice',
      'activation',
      'New learners not activated',
      ARRAY['in_app', 'banner']::text[],
      'Your first IELTS practice is waiting',
      'Complete one focused practice today to get a clear baseline and your next recommended step.',
      'Start practice',
      '/tests',
      168
    ),
    (
      'Upgrade: keep AI feedback flowing',
      'paid_conversion',
      'Free learners ready to upgrade',
      ARRAY['in_app', 'banner']::text[],
      'Keep your IELTS feedback flowing',
      'You have made progress. Choose a plan when you want more consistent AI feedback and practice support.',
      'View plans',
      '/pricing',
      336
    ),
    (
      'Retention: restart your progress',
      'retention',
      'Returning learners after two weeks',
      ARRAY['in_app', 'banner']::text[],
      'A small practice can restart your IELTS progress',
      'Your learning plan is ready. A short practice session today is enough to rebuild momentum.',
      'Continue learning',
      '/dashboard',
      336
    )
) AS seed(name, objective, segment_name, channels, title, message, cta_label, cta_url, cooldown_hours)
JOIN public.marketing_segments segment ON segment.name = seed.segment_name
WHERE NOT EXISTS (
  SELECT 1 FROM public.marketing_campaigns existing WHERE existing.name = seed.name
);

NOTIFY pgrst, 'reload schema';

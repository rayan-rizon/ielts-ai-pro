-- Reviewable signup funnel. This migration does not activate any campaign,
-- journey, policy or scheduler. Existing delivery caps and opt-out checks apply.
BEGIN;

INSERT INTO public.marketing_segments (name, description, rules)
SELECT 'Signup feedback starters',
  'Free accounts created in the last seven days, before their first completed practice.',
  '{"subscription_tiers":["free"],"created_days_max":7,"has_completed_test":false}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.marketing_segments WHERE name = 'Signup feedback starters');

WITH copy(trigger_type, subject, title, message, cta_label, cta_url, stage) AS (
  VALUES
    ('signup_incomplete', 'Welcome to IELTS AI Pro — start with one useful result',
     'Your first IELTS result starts here',
     'Welcome to IELTS AI Pro. Start with Free practice and find one thing to improve. Your dashboard brings your practice, progress and next steps together. When you want a regular feedback routine, Pro adds more AI evaluations and an adaptive Learning Path.',
     'Start my first practice', '/dashboard', 'signup'),
    ('first_practice_completed', 'Your first IELTS result is in — save 20% on your next step',
     'Turn your first result into a practice routine',
     'Use your latest result to choose one correction, then try again. Pro gives you more room for AI Writing and Speaking feedback, a Learning Path built around your goals, and advanced analytics to guide your next session. Choose Premium if you need higher practice capacity.',
     'Compare Pro and Premium', '/upgrade', 'first_result'),
    ('low_quota', 'Keep practising with AI feedback — your 20% offer is ready',
     'Keep your feedback routine going',
     'When your Free allowance is running low, a subscription gives you more room to practise, review feedback and try again. Choose the plan that fits your study routine. Reading and Listening practice remains available on Free.',
     'See my upgrade options', '/upgrade', 'quota')
)
UPDATE public.marketing_campaigns c
SET subject = copy.subject, title = copy.title, message = copy.message,
    cta_label = copy.cta_label, cta_url = copy.cta_url,
    channels = ARRAY['email']::text[], frequency_cap = 1, cooldown_hours = 72,
    metadata = c.metadata || jsonb_build_object('lifecycle_stage', copy.stage, 'signup_offer_percent', 20),
    updated_at = now()
FROM public.marketing_journeys j JOIN copy ON copy.trigger_type = j.trigger_type
WHERE c.id = j.campaign_id AND c.status IN ('paused', 'draft') AND NOT j.is_active;

-- Bound the first-result offer to recent signups so activation cannot send an
-- old-account backlog. The existing cross-channel cooldown separates contacts.
INSERT INTO public.marketing_segments (name, description, rules)
SELECT 'Signup first results', 'Free learners with a completed result, within fourteen days of signup.',
  '{"subscription_tiers":["free"],"created_days_max":14,"has_completed_test":true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.marketing_segments WHERE name = 'Signup first results');
UPDATE public.marketing_journeys j
SET segment_id = s.id, cooldown_hours = 72, updated_at = now()
FROM public.marketing_segments s
WHERE j.trigger_type = 'first_practice_completed' AND NOT j.is_active
  AND s.name = 'Signup first results';
UPDATE public.marketing_campaigns c
SET segment_id = j.segment_id, updated_at = now()
FROM public.marketing_journeys j
WHERE c.id = j.campaign_id AND j.trigger_type = 'first_practice_completed'
  AND NOT j.is_active AND c.status IN ('paused', 'draft');

-- Include learners who completed onboarding but have not tried a task. The
-- welcome is eligible at signup; the runner polls every 15 minutes and respects
-- each learner's 09:00–19:00 contact window. It is not an instant auth email.
UPDATE public.marketing_journeys j
SET segment_id = s.id, delay_hours = 0, cooldown_hours = 72, updated_at = now()
FROM public.marketing_segments s
WHERE j.trigger_type = 'signup_incomplete' AND NOT j.is_active
  AND s.name = 'Signup feedback starters';

UPDATE public.marketing_campaigns c
SET segment_id = j.segment_id, updated_at = now()
FROM public.marketing_journeys j
WHERE c.id = j.campaign_id AND j.trigger_type = 'signup_incomplete'
  AND NOT j.is_active AND c.status IN ('paused', 'draft');

-- Use the admin-created shared offer. Campaigns remain paused and journeys inactive.
UPDATE public.marketing_campaigns c
SET promo_code_id = p.id, updated_at = now()
FROM public.promo_codes p
WHERE p.code = 'START20' AND p.is_active AND p.discount_type = 'percentage'
  AND p.discount_value = 20 AND c.metadata->>'signup_offer_percent' = '20'
  AND c.status IN ('paused','draft');
COMMIT;

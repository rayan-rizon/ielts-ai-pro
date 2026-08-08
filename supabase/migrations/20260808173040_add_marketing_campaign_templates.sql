-- Editable campaign blueprints. Templates are never dispatched: they only
-- prefill an admin's campaign draft and remain fully editable before use.
CREATE TABLE public.marketing_campaign_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 100),
  description text,
  objective text NOT NULL DEFAULT 'paid_conversion'
    CHECK (objective IN ('paid_conversion', 'activation', 'retention', 'referral', 'announcement')),
  channels text[] NOT NULL DEFAULT ARRAY['in_app']::text[]
    CHECK (channels <@ ARRAY['in_app', 'banner', 'email']::text[] AND cardinality(channels) > 0),
  subject text,
  title text NOT NULL,
  message text NOT NULL,
  cta_label text,
  cta_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketing_template_email_subject CHECK (
    NOT ('email' = ANY(channels)) OR char_length(trim(COALESCE(subject, ''))) > 0
  ),
  CONSTRAINT marketing_template_cta_url CHECK (
    cta_url IS NULL OR cta_url ~ '^/'
    OR cta_url ~* '^https://([a-z0-9-]+\\.)?ieltsai\\.pro(/|$)'
  )
);

ALTER TABLE public.marketing_campaign_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketing_templates_admin_all ON public.marketing_campaign_templates
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

REVOKE ALL ON public.marketing_campaign_templates FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaign_templates TO authenticated;
GRANT ALL ON public.marketing_campaign_templates TO service_role;

INSERT INTO public.marketing_campaign_templates (
  name, description, objective, channels, subject, title, message, cta_label, cta_url
) VALUES
  (
    'Finish your first practice',
    'Activation prompt for new learners who have not completed a practice test.',
    'activation', ARRAY['in_app', 'banner']::text[], NULL,
    'Your first IELTS practice is waiting',
    'Take one focused practice today to get a clear baseline and a practical next step for improvement.',
    'Start practice', '/tests'
  ),
  (
    'Continue your IELTS progress',
    'Retention reminder for learners who have been away from practice.',
    'retention', ARRAY['in_app', 'email']::text[],
    'A small step can restart your IELTS progress',
    'A small step can restart your IELTS progress',
    'Your saved learning plan is ready when you are. A short practice session today is enough to keep momentum.',
    'Continue learning', '/dashboard'
  ),
  (
    'Use your next AI feedback',
    'Upgrade-oriented template for free learners with low remaining practice quota.',
    'paid_conversion', ARRAY['in_app', 'banner', 'email']::text[],
    'Keep your IELTS feedback flowing',
    'Keep your IELTS feedback flowing',
    'Use your next practice with detailed AI feedback, then choose a plan when you need more consistent support.',
    'View plans', '/pricing'
  ),
  (
    'Referral bonus reminder',
    'Time-sensitive referral template. Attach a relevant promo code before activating if appropriate.',
    'referral', ARRAY['in_app', 'email']::text[],
    'Your referral bonus is nearly over',
    'Your referral bonus is nearly over',
    'Use your available referral bonus before it expires and keep building toward your IELTS target.',
    'View my rewards', '/settings?tab=referrals'
  )
ON CONFLICT DO NOTHING;

-- Make the new marketing tables immediately visible through the Data API.
NOTIFY pgrst, 'reload schema';

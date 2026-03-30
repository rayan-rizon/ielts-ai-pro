-- Enable pg_cron if not enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Seed system_settings table with email_preferences
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'email_preferences',
    '{
        "welcome": true,
        "renewal_confirmation": true,
        "payment_failed": true,
        "quota_conversion": true,
        "renewal_reminder": true,
        "trial_expiry": true,
        "inactivity_warning": true
    }'::jsonb,
    'Toggles to enable or disable specific automated emails.'
) ON CONFLICT (key) DO UPDATE SET 
    description = EXCLUDED.description,
    value = COALESCE(public.system_settings.value, '{}'::jsonb) || EXCLUDED.value;

-- Schedule the Edge Function to run daily at midnight UTC
-- IMPORTANT: To run Edge Functions from pg_cron, you must replace your project URL and anon key.
-- Alternatively, if you use a database webhook, use pg_net.
-- Here we create a placeholder cron job using pg_net.

SELECT cron.schedule(
  'daily-scheduled-emails',
  '0 0 * * *', -- Every day at 00:00 midnight
  $$
    SELECT net.http_post(
        url := 'https://' || current_setting('request.jwt.claim.aud', true) || '.supabase.co/functions/v1/scheduled-emails',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('request.jwt.claim.role', true) -- This is typically the ANON or SERVICE ROLE key in production
        ),
        body := '{}'::jsonb
    );
  $$
);

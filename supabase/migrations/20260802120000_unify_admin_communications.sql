-- Unify the three global "the platform is talking to its users" surfaces:
-- broadcast notifications, the site-wide banner, and maintenance mode.
--
-- Before this migration:
-- * `notifications` rows were readable by every authenticated user regardless
--   of audience, schedule or expiry, and read state lived in a single global
--   `is_read` boolean shared by all users — so it could never work per person.
-- * `maintenance_mode` was a bare boolean with nowhere to put a message, an
--   ETA, or an operator allowlist.
-- * `public_announcement` had no schedule, link, or audience.
--
-- All three now carry the options the admin panel needs, and the old shapes are
-- migrated in place so nothing has to be re-entered.

-- ---------------------------------------------------------------------------
-- Broadcast notifications: scheduling, links, priority, pause
-- ---------------------------------------------------------------------------

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS starts_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS link_label text,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

UPDATE public.notifications SET starts_at = created_at WHERE starts_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_priority_check'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_priority_check
      CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text]));
  END IF;
END $$;

COMMENT ON COLUMN public.notifications.starts_at IS
  'When the broadcast becomes visible. Lets an admin queue an announcement ahead of a launch.';
COMMENT ON COLUMN public.notifications.is_active IS
  'Pause switch. Hides the broadcast from learners without deleting the record or its read history.';

CREATE INDEX IF NOT EXISTS idx_notifications_delivery_window
  ON public.notifications USING btree (is_active, starts_at, expires_at);

-- The old global `is_read` column could never represent per-user state; it is
-- superseded by notification_reads below and kept only so any straggling
-- client that still selects it does not error.
COMMENT ON COLUMN public.notifications.is_read IS
  'DEPRECATED - global flag, never per-user. Use public.notification_reads instead.';

-- ---------------------------------------------------------------------------
-- Per-user read / dismiss state
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notification_reads (
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamp with time zone DEFAULT now(),
  dismissed_at timestamp with time zone,
  PRIMARY KEY (notification_id, user_id)
);

COMMENT ON TABLE public.notification_reads IS
  'Per-user read and dismiss state for broadcast notifications.';

CREATE INDEX IF NOT EXISTS idx_notification_reads_user
  ON public.notification_reads USING btree (user_id);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_reads_owner_select ON public.notification_reads;
CREATE POLICY notification_reads_owner_select
  ON public.notification_reads FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS notification_reads_owner_insert ON public.notification_reads;
CREATE POLICY notification_reads_owner_insert
  ON public.notification_reads FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS notification_reads_owner_update ON public.notification_reads;
CREATE POLICY notification_reads_owner_update
  ON public.notification_reads FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS notification_reads_owner_delete ON public.notification_reads;
CREATE POLICY notification_reads_owner_delete
  ON public.notification_reads FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON TABLE public.notification_reads FROM PUBLIC;
REVOKE ALL ON TABLE public.notification_reads FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notification_reads TO authenticated;
GRANT ALL ON TABLE public.notification_reads TO service_role;

-- ---------------------------------------------------------------------------
-- Audience-aware delivery
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so the notifications policy can read the caller's tier
-- without depending on public.users' own row-level policies.
CREATE OR REPLACE FUNCTION public.current_subscription_tier()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT u.subscription_tier FROM public.users u WHERE u.auth_id = auth.uid() LIMIT 1),
    'free'
  );
$$;

COMMENT ON FUNCTION public.current_subscription_tier() IS
  'Subscription tier of the calling user, defaulting to free. Used by notification audience targeting.';

REVOKE ALL ON FUNCTION public.current_subscription_tier() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_subscription_tier() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_subscription_tier() TO service_role;

-- Previously `USING (true)`: every signed-in user could read every broadcast,
-- including ones scheduled for the future, already expired, or aimed at a tier
-- they are not on. Audience targeting was applied in the browser only.
DROP POLICY IF EXISTS notifications_select_policy ON public.notifications;
CREATE POLICY notifications_select_policy
  ON public.notifications FOR SELECT TO authenticated
  USING (
    (SELECT public.is_admin())
    OR (
      is_active
      AND (starts_at IS NULL OR starts_at <= now())
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        target_audience = 'all'
        OR target_audience = (SELECT public.current_subscription_tier())
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Maintenance mode: boolean -> configurable object
-- ---------------------------------------------------------------------------

INSERT INTO public.system_settings (key, value, description)
VALUES (
  'maintenance_mode',
  jsonb_build_object(
    'enabled', false,
    'title', 'We''ll be right back',
    'message', 'IELTS AI Pro is undergoing scheduled maintenance. Your progress is safe and everything will be exactly where you left it.',
    'starts_at', NULL,
    'ends_at', NULL,
    'auto_resume', false,
    'allow_admins', true,
    'allowed_emails', '[]'::jsonb,
    'contact_email', '',
    'status_url', ''
  ),
  'Site-wide maintenance mode: enablement, learner-facing copy, window, and bypass allowlist.'
)
ON CONFLICT (key) DO UPDATE
SET
  description = EXCLUDED.description,
  value = CASE
    -- Legacy shape: a bare JSON boolean. Preserve whether it was switched on.
    WHEN jsonb_typeof(public.system_settings.value) = 'boolean'
      THEN jsonb_set(EXCLUDED.value, '{enabled}', public.system_settings.value)
    -- Already an object: keep the operator's values, add any missing keys.
    WHEN jsonb_typeof(public.system_settings.value) = 'object'
      THEN EXCLUDED.value || public.system_settings.value
    ELSE EXCLUDED.value
  END;

-- ---------------------------------------------------------------------------
-- Public announcement: add schedule, link, audience, dismissibility
-- ---------------------------------------------------------------------------

INSERT INTO public.system_settings (key, value, description)
VALUES (
  'public_announcement',
  jsonb_build_object(
    'enabled', false,
    'title', '',
    'message', '',
    'type', 'info',
    'link_url', '',
    'link_label', '',
    'dismissible', true,
    'starts_at', NULL,
    'ends_at', NULL,
    'audience', 'all'
  ),
  'Site-wide announcement banner: copy, severity, call to action, schedule, and audience.'
)
ON CONFLICT (key) DO UPDATE
SET
  description = EXCLUDED.description,
  value = CASE
    WHEN jsonb_typeof(public.system_settings.value) = 'object'
      THEN EXCLUDED.value || public.system_settings.value
    ELSE EXCLUDED.value
  END;

-- The banner used to store 'error' as its most severe level while broadcast
-- notifications used 'warning'; one vocabulary now (info/success/warning/critical).
UPDATE public.system_settings
SET value = jsonb_set(value, '{type}', '"critical"'::jsonb)
WHERE key = 'public_announcement'
  AND jsonb_typeof(value) = 'object'
  AND value ->> 'type' = 'error';

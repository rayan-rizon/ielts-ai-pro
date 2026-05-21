-- Safe follow-up fixes for Supabase advisor findings.
-- Scope:
-- - Add missing foreign-key indexes reported by the Performance Advisor.
-- - Remove public listing from the public tts-cache bucket while keeping public
--   object URLs functional.
-- - Collapse system_settings SELECT policies so authenticated reads evaluate
--   one policy instead of two.
--
-- Intentionally not included:
-- - Bulk RPC EXECUTE revokes. Several SECURITY DEFINER RPCs are part of the
--   app's authenticated feature surface and need per-function integration
--   tests before changing grants.
-- - Bulk anon table SELECT revokes. Public landing/pricing/blog flows still
--   depend on a small set of public reads, so those grants need a separate
--   endpoint-by-endpoint rollout.

-- ---------------------------------------------------------------------------
-- Performance Advisor: unindexed foreign keys
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_billing_history_auth_id_fk
  ON public.billing_history USING btree (auth_id);

CREATE INDEX IF NOT EXISTS idx_billing_history_user_id_fk
  ON public.billing_history USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_daily_focus_primary_activity_id_fk
  ON public.daily_focus USING btree (primary_activity_id);

CREATE INDEX IF NOT EXISTS idx_referral_reward_tiers_updated_by_fk
  ON public.referral_reward_tiers USING btree (updated_by);

CREATE INDEX IF NOT EXISTS idx_system_health_logs_user_id_fk
  ON public.system_health_logs USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_user_referral_rewards_tier_id_fk
  ON public.user_referral_rewards USING btree (tier_id);

CREATE INDEX IF NOT EXISTS idx_user_referral_rewards_user_id_fk
  ON public.user_referral_rewards USING btree (user_id);

-- ---------------------------------------------------------------------------
-- Security Advisor: public bucket listing
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "tts_cache_public_read" ON storage.objects;

-- ---------------------------------------------------------------------------
-- Performance Advisor: multiple permissive SELECT policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS system_settings_select_policy ON public.system_settings;
DROP POLICY IF EXISTS system_settings_public_safe_select ON public.system_settings;
DROP POLICY IF EXISTS system_settings_admin_select ON public.system_settings;
DROP POLICY IF EXISTS system_settings_anon_safe_select ON public.system_settings;
DROP POLICY IF EXISTS system_settings_authenticated_select ON public.system_settings;

CREATE POLICY system_settings_anon_safe_select
ON public.system_settings
FOR SELECT
TO anon
USING (key IN ('maintenance_mode', 'pricing_tiers', 'public_announcement'));

CREATE POLICY system_settings_authenticated_select
ON public.system_settings
FOR SELECT
TO authenticated
USING (
  key IN ('maintenance_mode', 'pricing_tiers', 'public_announcement')
  OR (SELECT public.is_admin())
);

REVOKE ALL ON TABLE public.system_settings FROM PUBLIC;
REVOKE ALL ON TABLE public.system_settings FROM anon;
REVOKE ALL ON TABLE public.system_settings FROM authenticated;
GRANT SELECT ON TABLE public.system_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.system_settings TO authenticated;
GRANT ALL ON TABLE public.system_settings TO service_role;

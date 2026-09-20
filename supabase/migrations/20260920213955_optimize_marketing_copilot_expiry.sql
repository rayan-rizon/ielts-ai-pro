-- Keep the admin review queue and learner delivery expiry checks fast as the
-- intervention history grows. Expiry remains authoritative in Postgres; the
-- UI countdown is only a presentation of this stored timestamp.
CREATE INDEX IF NOT EXISTS marketing_interventions_active_expiry_idx
  ON public.marketing_interventions (expires_at, created_at, id)
  WHERE status IN ('prepared', 'needs_approval', 'approved', 'queued', 'sent');

COMMENT ON INDEX public.marketing_interventions_active_expiry_idx IS
  'Supports active Copilot queue and learner-delivery expiry checks.';

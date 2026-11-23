-- The quarter-hour dispatcher used to reserve a new delivery and mark it skipped
-- every scan for learners the offer no longer applied to (too old, already paid,
-- starter offer ended). One learner collected 1,700+ identical rows, and about
-- 66,000 of the 72,000 deliveries were these repeats. The dispatcher now records
-- each skip reason once per learner; this removes the existing repeats.
--
-- Kept per (campaign, learner, channel, reason): the highest-attempt skipped row,
-- so attempt numbering and every "already recorded" check behave as before.
-- Nothing that was sent, viewed, clicked or failed is touched, and a skipped row
-- that anything references (events, feedback, promo codes, payments) is kept.
WITH keep AS (
  SELECT DISTINCT ON (campaign_id, user_id, channel, failure_reason) id
  FROM public.marketing_deliveries
  WHERE status = 'skipped'
  ORDER BY campaign_id, user_id, channel, failure_reason, attempt DESC, id
)
DELETE FROM public.marketing_deliveries d
WHERE d.status = 'skipped'
  AND d.id NOT IN (SELECT id FROM keep)
  AND NOT EXISTS (SELECT 1 FROM public.marketing_events e WHERE e.delivery_id = d.id)
  AND NOT EXISTS (SELECT 1 FROM public.marketing_contact_feedback f WHERE f.delivery_id = d.id)
  AND NOT EXISTS (SELECT 1 FROM public.promo_codes p WHERE p.marketing_delivery_id = d.id)
  AND NOT EXISTS (SELECT 1 FROM public.billing_history b WHERE b.marketing_delivery_id = d.id)
  AND NOT EXISTS (SELECT 1 FROM public.payment_requests r WHERE r.marketing_delivery_id = d.id)
  AND NOT EXISTS (SELECT 1 FROM public.nagad_payments n WHERE n.marketing_delivery_id = d.id);

ANALYZE public.marketing_deliveries;

-- Put the verified deadline in the headline and CTA so the learner sees the
-- real urgency before reading the body. Only unsent offer interventions are
-- rewritten; delivered history remains unchanged.
UPDATE public.marketing_interventions
SET content = content || jsonb_build_object(
      'title', CASE
        WHEN playbook_key = 'checkout_recovery'
          THEN 'Your 20% plan offer ends in 48 hours'
        ELSE '20% off — your 48-hour offer is live'
      END,
      'subject', CASE
        WHEN recommended_channel = 'email'
          THEN '20% off: your offer ends in 48 hours'
        ELSE content->>'subject'
      END,
      'message', CASE
        WHEN playbook_key = 'checkout_recovery'
          THEN 'You already chose your plan. Complete your upgrade in the next 48 hours to save 20% on your first subscription payment.'
        ELSE 'Choose the plan that fits your practice in the next 48 hours to save 20% on your first subscription payment.'
      END,
      'cta_label', 'Claim 20% before it ends'
    ),
    updated_at = now()
WHERE status IN ('prepared', 'needs_approval')
  AND expires_at > now()
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(evidence, '[]'::jsonb)) item
    WHERE item->>'metric' = 'offer_discount_percent'
      AND item->>'value' = '20'
  );

UPDATE public.marketing_campaigns c
SET subject = '20% off: your offer ends in 48 hours',
    title = 'Your 20% plan offer ends in 48 hours',
    message = 'You already chose your plan. Complete your upgrade in the next 48 hours to save 20% on your first subscription payment.',
    cta_label = 'Claim 20% before it ends',
    updated_at = now()
FROM public.marketing_autopilot_policies p
WHERE p.playbook_key = 'checkout_recovery'
  AND p.campaign_id = c.id;

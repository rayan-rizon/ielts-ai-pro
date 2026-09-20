-- Pending review items were prepared before the 20% offer became available.
-- Upgrade only unsent, unexpired high-intent items so the admin reviews the
-- exact learner promise that will be provisioned after approval.
UPDATE public.marketing_interventions
SET content = content || jsonb_build_object(
      'title', CASE
        WHEN playbook_key = 'checkout_recovery' THEN 'Save 20% on your selected plan'
        ELSE 'Save 20% on the plan you choose'
      END,
      'message', CASE
        WHEN playbook_key = 'checkout_recovery'
          THEN 'Complete your upgrade within 48 hours to save 20% on your first subscription payment.'
        ELSE 'Use this one-time offer within 48 hours to save 20% on your first subscription payment.'
      END,
      'context_label', CASE
        WHEN playbook_key = 'checkout_recovery' THEN 'Based on your unfinished checkout'
        WHEN EXISTS (
          SELECT 1 FROM jsonb_array_elements(evidence) item
          WHERE item->>'metric' = 'plan_selected'
        ) THEN 'Based on the plan you selected'
        ELSE 'Based on your recent plan comparison'
      END,
      'cta_label', 'Apply my 20% offer',
      'cta_url', '/pricing'
    ),
    evidence = evidence
      || CASE WHEN NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(evidence) item
        WHERE item->>'metric' = 'offer_discount_percent'
      ) THEN jsonb_build_array(jsonb_build_object('metric', 'offer_discount_percent', 'value', 20))
      ELSE '[]'::jsonb END
      || CASE WHEN NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(evidence) item
        WHERE item->>'metric' = 'offer_duration_hours'
      ) THEN jsonb_build_array(jsonb_build_object('metric', 'offer_duration_hours', 'value', 48))
      ELSE '[]'::jsonb END,
    updated_at = now()
WHERE status IN ('prepared', 'needs_approval')
  AND expires_at > now()
  AND (
    playbook_key = 'checkout_recovery'
    OR (
      playbook_key = 'quota_upgrade'
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(evidence) item
        WHERE item->>'metric' IN ('plan_selected', 'pricing_visits')
      )
    )
  );

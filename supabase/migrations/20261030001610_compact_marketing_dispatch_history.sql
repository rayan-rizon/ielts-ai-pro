-- The dispatcher needs every contact/cap row, but only the existence of each
-- skip reason and the highest attempt. Do not transfer duplicate skipped rows
-- or unrelated failures on every quarter-hour scan. No deliveries are deleted.
CREATE OR REPLACE FUNCTION public.marketing_dispatch_history(
  p_campaign_id uuid,
  p_user_ids uuid[]
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  channel text,
  campaign_id uuid,
  attempt integer,
  status text,
  failure_reason text,
  created_at timestamptz,
  campaign jsonb
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  WITH audience_history AS MATERIALIZED (
    SELECT d.id, d.user_id, d.channel, d.campaign_id, d.attempt,
           d.status, d.failure_reason, d.created_at
    FROM public.marketing_deliveries d
    WHERE d.user_id = ANY(p_user_ids)
      AND (d.campaign_id = p_campaign_id
           OR d.status IN ('accepted', 'delivered', 'viewed', 'clicked'))
  ), highest_attempt AS (
    SELECT DISTINCT ON (h.user_id, h.channel) h.id
    FROM audience_history h
    WHERE h.campaign_id = p_campaign_id
    ORDER BY h.user_id, h.channel, h.attempt DESC, h.id
  ), skip_reasons AS (
    SELECT DISTINCT ON (h.user_id, h.channel, h.failure_reason) h.id
    FROM audience_history h
    WHERE h.campaign_id = p_campaign_id AND h.status = 'skipped'
    ORDER BY h.user_id, h.channel, h.failure_reason, h.attempt DESC, h.id
  ), retained AS (
    -- Preserve all successful contacts, even old ones, and every current
    -- campaign row counted by the existing frequency cap (including processing).
    SELECT h.id FROM audience_history h
    WHERE h.status IN ('accepted', 'delivered', 'viewed', 'clicked')
       OR (h.campaign_id = p_campaign_id AND h.status NOT IN ('skipped', 'failed'))
    UNION SELECT h.id FROM highest_attempt h
    UNION SELECT h.id FROM skip_reasons h
  )
  SELECT h.id, h.user_id, h.channel, h.campaign_id, h.attempt,
         h.status, h.failure_reason, h.created_at,
         jsonb_build_object('objective', c.objective) AS campaign
  FROM audience_history h
  JOIN retained r ON r.id = h.id
  LEFT JOIN public.marketing_campaigns c ON c.id = h.campaign_id;
$function$;

-- Called only by the authenticated Edge dispatcher using its service role.
REVOKE ALL ON FUNCTION public.marketing_dispatch_history(uuid, uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.marketing_dispatch_history(uuid, uuid[]) TO service_role;

-- Provider feedback is address-scoped, service-only and idempotent on replay.
CREATE TABLE public.marketing_email_feedback (
  email text NOT NULL CHECK (email = lower(btrim(email))),
  provider_message_id text NOT NULL,
  occurred_at timestamptz NOT NULL,
  reason text NOT NULL,
  permanent boolean NOT NULL DEFAULT false,
  bounce_type text,
  diagnostic_code jsonb,
  PRIMARY KEY (email, provider_message_id)
);
ALTER TABLE public.marketing_email_feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.marketing_email_feedback FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.marketing_email_feedback TO service_role;

CREATE OR REPLACE FUNCTION public.marketing_email_block_reason(p_email text)
RETURNS text LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT CASE
    WHEN coalesce(bool_or(permanent), false) THEN 'email_permanently_blocked'
    WHEN max(occurred_at) + CASE WHEN count(*) FILTER (
      WHERE occurred_at > now() - interval '30 days') >= 2
      THEN interval '30 days' ELSE interval '7 days' END > now()
      THEN 'email_bounce_cooldown'
    ELSE NULL END
  FROM public.marketing_email_feedback
  WHERE email = lower(btrim(p_email));
$$;
REVOKE ALL ON FUNCTION public.marketing_email_block_reason(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.marketing_email_block_reason(text) TO service_role;

-- Cover existing bounced campaign recipients immediately; never re-send to backfill.
INSERT INTO public.marketing_email_feedback
  (email, provider_message_id, occurred_at, reason, permanent)
SELECT DISTINCT ON (lower(btrim(u.email)), d.provider_message_id)
  lower(btrim(u.email)), d.provider_message_id, d.updated_at, d.failure_reason,
  d.failure_reason IN ('email.complained', 'email.suppressed')
FROM public.marketing_deliveries d JOIN public.users u ON u.id = d.user_id
WHERE d.channel = 'email' AND d.provider_message_id IS NOT NULL AND u.email IS NOT NULL
  AND d.failure_reason IN ('email.bounced', 'email.complained', 'email.suppressed')
ORDER BY lower(btrim(u.email)), d.provider_message_id, d.updated_at DESC
ON CONFLICT DO NOTHING;

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
           CASE WHEN d.provider_message_id IS NOT NULL AND d.status = 'failed'
                THEN 'accepted' ELSE d.status END AS status, d.failure_reason, d.created_at
    FROM public.marketing_deliveries d
    WHERE d.user_id = ANY(p_user_ids)
      AND (d.campaign_id = p_campaign_id
           OR d.status IN ('accepted', 'delivered', 'viewed', 'clicked')
           OR d.provider_message_id IS NOT NULL)
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

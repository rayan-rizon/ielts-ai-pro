-- Standalone regression test: run with psql -X -v ON_ERROR_STOP=1 -f this_file
-- against an empty, disposable database. All fixtures and the function roll back.
BEGIN;
DO $$ BEGIN
  ASSERT to_regclass('public.marketing_deliveries') IS NULL,
    'Use an empty disposable database for this standalone test';
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role; END IF;
END $$;
CREATE TABLE public.marketing_campaigns (id uuid PRIMARY KEY, objective text);
CREATE TABLE public.marketing_deliveries (
  id uuid PRIMARY KEY, user_id uuid NOT NULL, channel text NOT NULL,
  campaign_id uuid NOT NULL, attempt integer NOT NULL, status text NOT NULL,
  failure_reason text, created_at timestamptz NOT NULL
);
CREATE INDEX ON public.marketing_deliveries(user_id, status, created_at DESC);
CREATE UNIQUE INDEX ON public.marketing_deliveries(campaign_id, user_id, channel, attempt);
INSERT INTO public.marketing_campaigns VALUES
  ('00000000-0000-0000-0000-000000000001', 'paid_conversion'),
  ('00000000-0000-0000-0000-000000000002', 'activation');
INSERT INTO public.marketing_deliveries
SELECT md5('duplicate-' || g)::uuid,
       '00000000-0000-0000-0000-000000001001', 'email',
       '00000000-0000-0000-0000-000000000001', g, 'skipped',
       CASE WHEN g % 2 = 0 THEN 'cooldown' ELSE 'no_eligible_channel' END,
       now() - interval '1 day'
FROM generate_series(1,40000) g;
INSERT INTO public.marketing_deliveries
SELECT md5('special-' || g)::uuid,
       '00000000-0000-0000-0000-000000001001',
       CASE WHEN g = 8 THEN 'in_app' ELSE 'email' END,
       CASE WHEN g IN (6,7) THEN '00000000-0000-0000-0000-000000000002'::uuid
            ELSE '00000000-0000-0000-0000-000000000001'::uuid END,
       40000 + g,
       CASE g WHEN 1 THEN 'processing' WHEN 2 THEN 'accepted' WHEN 3 THEN 'delivered'
              WHEN 4 THEN 'viewed' WHEN 5 THEN 'clicked' WHEN 6 THEN 'accepted'
              WHEN 7 THEN 'failed' WHEN 8 THEN 'skipped' WHEN 9 THEN 'failed'
              WHEN 10 THEN 'skipped' WHEN 11 THEN 'failed' END,
       CASE WHEN g = 8 THEN 'learner_paused' END,
       CASE WHEN g = 2 THEN now() - interval '400 days' ELSE now() END
FROM generate_series(1,11) g;
-- A different learner must never leak into the requested audience.
INSERT INTO public.marketing_deliveries VALUES (
  md5('other-learner')::uuid, '00000000-0000-0000-0000-000000001002', 'email',
  '00000000-0000-0000-0000-000000000001', 1, 'accepted', NULL, now()
);
\ir ../migrations/20261030001610_compact_marketing_dispatch_history.sql
GRANT SELECT ON public.marketing_campaigns, public.marketing_deliveries TO service_role;
SET LOCAL ROLE service_role;
CREATE TEMP TABLE compact AS
SELECT * FROM public.marketing_dispatch_history(
  '00000000-0000-0000-0000-000000000001',
  ARRAY['00000000-0000-0000-0000-000000001001']::uuid[]
);
RESET ROLE;

DO $$ BEGIN
  ASSERT (SELECT count(*) FROM compact) < 20, 'Duplicate skips were not compacted';
  ASSERT NOT EXISTS (SELECT FROM compact WHERE user_id <> '00000000-0000-0000-0000-000000001001'),
    'Audience isolation changed';
  ASSERT NOT EXISTS (
    WITH raw_summary AS (
      SELECT user_id, channel, max(attempt) AS max_attempt,
             count(*) FILTER (WHERE status NOT IN ('skipped','failed')) AS cap_count,
             array_agg(DISTINCT failure_reason ORDER BY failure_reason) FILTER (WHERE status='skipped') AS reasons
      FROM public.marketing_deliveries
      WHERE campaign_id='00000000-0000-0000-0000-000000000001'
        AND user_id='00000000-0000-0000-0000-000000001001'
      GROUP BY user_id,channel
    ), compact_summary AS (
      SELECT user_id, channel, max(attempt) AS max_attempt,
             count(*) FILTER (WHERE status NOT IN ('skipped','failed')) AS cap_count,
             array_agg(DISTINCT failure_reason ORDER BY failure_reason) FILTER (WHERE status='skipped') AS reasons
      FROM compact WHERE campaign_id='00000000-0000-0000-0000-000000000001'
      GROUP BY user_id,channel
    )
    (SELECT * FROM raw_summary EXCEPT SELECT * FROM compact_summary)
    UNION ALL
    (SELECT * FROM compact_summary EXCEPT SELECT * FROM raw_summary)
  ), 'Attempt allocation, lifetime frequency cap or skip deduplication changed';
  ASSERT NOT EXISTS (
    SELECT id FROM public.marketing_deliveries
    WHERE user_id='00000000-0000-0000-0000-000000001001'
      AND status IN ('accepted','delivered','viewed','clicked')
    EXCEPT SELECT id FROM compact
  ), 'Contact history was truncated: cooldown/contact/upgrade caps could change';
  ASSERT NOT EXISTS (
    SELECT FROM compact h JOIN public.marketing_campaigns c ON c.id=h.campaign_id
    WHERE h.campaign->>'objective' IS DISTINCT FROM c.objective
  ), 'Upgrade-promotion objective lost';
  ASSERT NOT has_function_privilege('anon','public.marketing_dispatch_history(uuid,uuid[])','EXECUTE'),
    'Anonymous role can access history';
  ASSERT NOT has_function_privilege('authenticated','public.marketing_dispatch_history(uuid,uuid[])','EXECUTE'),
    'Learner role can access history';
  ASSERT has_function_privilege('service_role','public.marketing_dispatch_history(uuid,uuid[])','EXECUTE'),
    'Dispatcher cannot read history';
  ASSERT NOT EXISTS (
    SELECT FROM pg_proc WHERE oid='public.marketing_dispatch_history(uuid,uuid[])'::regprocedure AND prosecdef
  ), 'Function must not bypass RLS';
  ASSERT (SELECT count(*) FROM public.marketing_dispatch_history(
    '00000000-0000-0000-0000-000000000001', ARRAY[]::uuid[])) = 0,
    'Empty audience returned history';
END $$;
SELECT 40011 AS raw_audience_rows, count(*) AS compact_rows FROM compact;
ROLLBACK;

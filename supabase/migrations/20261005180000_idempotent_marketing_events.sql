-- Full uniqueness has the same non-null dedupe behavior as the partial index;
-- PostgreSQL still permits multiple NULL keys. A full index also lets PostgREST
-- target dedupe_key for atomic ON CONFLICT DO NOTHING writes.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
CREATE UNIQUE INDEX marketing_events_dedupe_idx_full
  ON public.marketing_events (dedupe_key);
DROP INDEX public.marketing_events_dedupe_idx;
ALTER INDEX public.marketing_events_dedupe_idx_full RENAME TO marketing_events_dedupe_idx;
COMMIT;

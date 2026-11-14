-- Operational prerequisite on the target database, outside a transaction:
--   REINDEX (VERBOSE) DATABASE CONCURRENTLY postgres;
-- Completed successfully on production on 2026-11-14 before this migration.
-- This rebuilds non-system indexes, including Supabase-managed schemas, using
-- PostgreSQL 17's database-owner maintenance permissions. Confirm that no
-- invalid or not-ready indexes remain before refreshing the recorded version.
-- Do not refresh template1 here: it is owned by Supabase's supabase_admin role
-- and requires provider maintenance in that database.
ALTER DATABASE postgres REFRESH COLLATION VERSION;

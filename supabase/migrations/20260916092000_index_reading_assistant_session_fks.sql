-- Both reading-assistant side tables cascade from `test_sessions(id)` but had no
-- index on `session_id`. Postgres has to sequentially scan the referencing table
-- once per deleted session to enforce the cascade, and the same gap makes any
-- lookup by session a scan.
--
-- Both tables are small today (167 and 160 rows), so this is cheap insurance
-- rather than a fix for a live problem: the scan cost grows with the table while
-- the index keeps it constant. Supabase's performance advisor flags both as
-- `unindexed_foreign_keys`.
--
-- CREATE INDEX (without CONCURRENTLY) takes a brief ACCESS EXCLUSIVE lock. At
-- these row counts that is milliseconds, and CONCURRENTLY cannot run inside the
-- transaction a migration executes in.

create index if not exists reading_assistant_operations_session_id
  on reading_assistant_private.operations (session_id);

create index if not exists reading_assistant_unlocks_session_id
  on reading_assistant_private.unlocks (session_id);

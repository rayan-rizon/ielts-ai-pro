-- Migration: Revert RPC optimizations and clean up backend functions
-- Date: 2026-02-15 19:00:00

-- Drop the functions created in the optimization steps
DROP FUNCTION IF EXISTS "public"."get_leaderboard_with_scores"("p_limit" integer, "p_offset" integer, "p_time_filter" text);
DROP FUNCTION IF EXISTS "public"."get_user_usage_stats"("p_user_id" "uuid");

-- Note: get_user_latest_sessions is being kept but we are reverting the frontend to not use it.
-- We can drop it if it was purely new, but to be safe and avoid breaking other potential consumers (like admin dashboard?) 
-- we will drop it since the user asked to "revert database as well".
DROP FUNCTION IF EXISTS "public"."get_user_latest_sessions"("p_user_id" "uuid", "p_test_type" "text");

-- Ensure any trigger/policy changes from 20260214210059 that caused issues are okay.
-- Since 20260214210059 was a "fix", we don't necessarily want to revert the *fix*, 
-- but we want to comply with "revert the changes". 
-- The user likely means the visible functional changes that broke the app.

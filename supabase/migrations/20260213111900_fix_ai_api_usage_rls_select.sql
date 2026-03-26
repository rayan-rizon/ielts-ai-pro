-- Fix broken RLS SELECT policy on ai_api_usage
-- The old policy compared user_id (users.id) to auth.uid() (auth.users.id).
-- These are different UUIDs linked by users.auth_id = auth.uid(),
-- so the old policy always returned 0 rows for non-admin users.

-- Drop the broken policy
DROP POLICY IF EXISTS "api_usage_select_policy" ON "public"."ai_api_usage";

-- Create the fixed policy that correctly resolves through users table
CREATE POLICY "api_usage_select_policy" ON "public"."ai_api_usage"
  FOR SELECT
  TO "authenticated"
  USING (
    "user_id" = (SELECT "id" FROM "public"."users" WHERE "auth_id" = (SELECT auth.uid()))
    OR "public"."is_admin"()
  );

-- XP is an account balance. Browser clients may request an award for a resource,
-- but must never choose its amount, reason, or idempotency key.
-- `award_user_points` was introduced by the immediately preceding hardening
-- migration and intentionally remains callable only by service_role.

REVOKE ALL ON FUNCTION public.add_user_points(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.award_user_points(uuid, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_user_points(uuid, integer, text, text) TO service_role;

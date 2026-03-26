-- Tighten grants for get_test_taken_counts to authenticated users only
-- This hardening ensures that even though the data is public aggregate counts, 
-- we only allow logged-in users to invoke the function.

REVOKE ALL ON FUNCTION public.get_test_taken_counts(text) FROM anon;
REVOKE ALL ON FUNCTION public.get_test_taken_counts(text) FROM authenticated;
REVOKE ALL ON FUNCTION public.get_test_taken_counts(text) FROM service_role;

GRANT EXECUTE ON FUNCTION public.get_test_taken_counts(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_test_taken_counts(text) TO service_role;

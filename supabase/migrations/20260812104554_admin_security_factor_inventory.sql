-- The Auth list-factors response can lag behind a just-updated browser session.
-- This admin-only inventory is a display and step-up fallback; Auth remains the
-- authority that verifies the TOTP challenge and issues the AAL2 session.
CREATE OR REPLACE FUNCTION public.get_admin_security_factors()
RETURNS TABLE (
  id uuid,
  factor_type text,
  friendly_name text,
  status text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    factor.id,
    factor.factor_type::text,
    factor.friendly_name,
    factor.status::text,
    factor.created_at
  FROM auth.mfa_factors AS factor
  WHERE factor.user_id = (SELECT auth.uid())
    AND public.has_admin_role()
  ORDER BY factor.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_admin_security_factors() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_security_factors() TO authenticated, service_role;

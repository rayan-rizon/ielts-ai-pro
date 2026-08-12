CREATE OR REPLACE FUNCTION public.get_admin_active_security_sessions()
RETURNS TABLE (
  session_id uuid,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  last_event text,
  authentication_methods jsonb,
  user_agent text,
  revoked_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    observed.session_id,
    observed.first_seen_at,
    observed.last_seen_at,
    observed.last_event,
    observed.authentication_methods,
    observed.user_agent,
    observed.revoked_at
  FROM public.admin_security_sessions AS observed
  INNER JOIN auth.sessions AS live
    ON live.id = observed.session_id
   AND live.user_id = observed.user_id
  WHERE observed.user_id = (SELECT auth.uid())
    AND observed.revoked_at IS NULL
    AND public.has_admin_role()
  ORDER BY observed.last_seen_at DESC
  LIMIT 12;
$$;

REVOKE ALL ON FUNCTION public.get_admin_active_security_sessions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_active_security_sessions() TO authenticated, service_role;

COMMENT ON FUNCTION public.get_admin_active_security_sessions() IS
  'Returns observed administrator sessions that still exist in Supabase Auth.';

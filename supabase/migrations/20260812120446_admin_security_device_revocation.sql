ALTER TABLE public.admin_security_events
  DROP CONSTRAINT IF EXISTS admin_security_events_event_type_check;

ALTER TABLE public.admin_security_events
  ADD CONSTRAINT admin_security_events_event_type_check CHECK (
    event_type IN (
      'admin_sign_in', 'admin_passkey_sign_in', 'admin_session_observed',
      'passkey_registered', 'passkey_removed', 'mfa_enrolled', 'mfa_verified',
      'mfa_enforcement_enabled', 'recovery_codes_rotated', 'recovery_code_redeemed',
      'password_changed', 'all_sessions_signed_out', 'session_signed_out'
    )
  );

CREATE OR REPLACE FUNCTION public.revoke_admin_security_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_session_id uuid := ((SELECT auth.jwt()) ->> 'session_id')::uuid;
BEGIN
  IF NOT public.has_admin_role() OR ((SELECT auth.jwt()) ->> 'aal') <> 'aal2' THEN
    RAISE EXCEPTION 'A verified administrator session is required' USING ERRCODE = '42501';
  END IF;

  IF p_session_id = v_current_session_id THEN
    RAISE EXCEPTION 'Use the current-device sign out control for this session' USING ERRCODE = '22023';
  END IF;

  DELETE FROM auth.sessions
  WHERE id = p_session_id
    AND user_id = (SELECT auth.uid());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'That active administrator session was not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.admin_security_sessions
  SET revoked_at = now(), last_event = 'session_signed_out'
  WHERE session_id = p_session_id
    AND user_id = (SELECT auth.uid());

  INSERT INTO public.admin_security_events (user_id, session_id, event_type)
  VALUES ((SELECT auth.uid()), p_session_id, 'session_signed_out');
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_admin_security_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_admin_security_session(uuid) TO authenticated, service_role;

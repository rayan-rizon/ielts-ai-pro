-- Admin passkeys are a first factor. This migration adds the second-factor,
-- recovery, and session-audit controls that make them appropriate for a
-- privileged account. The existing single `admin` role remains unchanged.

CREATE OR REPLACE FUNCTION public.has_admin_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE auth_id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

CREATE TABLE IF NOT EXISTS public.admin_security_controls (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_required boolean NOT NULL DEFAULT false,
  mfa_enforced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_security_sessions (
  session_id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  last_event text NOT NULL DEFAULT 'admin_session_observed',
  authentication_methods jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_agent text,
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS admin_security_sessions_user_last_seen_idx
  ON public.admin_security_sessions (user_id, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid,
  event_type text NOT NULL CHECK (
    event_type IN (
      'admin_sign_in',
      'admin_passkey_sign_in',
      'admin_session_observed',
      'passkey_registered',
      'passkey_removed',
      'mfa_enrolled',
      'mfa_verified',
      'mfa_enforcement_enabled',
      'recovery_codes_rotated',
      'recovery_code_redeemed',
      'password_changed',
      'all_sessions_signed_out'
    )
  ),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_security_events_user_created_idx
  ON public.admin_security_events (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash bytea NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);

CREATE INDEX IF NOT EXISTS admin_recovery_codes_active_idx
  ON public.admin_recovery_codes (user_id, created_at DESC)
  WHERE used_at IS NULL;

CREATE TABLE IF NOT EXISTS public.admin_recovery_attempts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);

CREATE TABLE IF NOT EXISTS public.admin_recovery_sessions (
  session_id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_recovery_sessions_active_idx
  ON public.admin_recovery_sessions (user_id, expires_at DESC);

ALTER TABLE public.admin_security_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_security_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_recovery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_recovery_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read their security controls" ON public.admin_security_controls;
CREATE POLICY "Admins can read their security controls"
  ON public.admin_security_controls
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id AND public.has_admin_role());

DROP POLICY IF EXISTS "Admins can read their security sessions" ON public.admin_security_sessions;
CREATE POLICY "Admins can read their security sessions"
  ON public.admin_security_sessions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id AND public.has_admin_role());

DROP POLICY IF EXISTS "Admins can read their security events" ON public.admin_security_events;
CREATE POLICY "Admins can read their security events"
  ON public.admin_security_events
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id AND public.has_admin_role());

-- Recovery codes, attempts, and temporary recovery grants are intentionally
-- never readable through the Data API. SECURITY DEFINER functions below are
-- their only interface.

CREATE OR REPLACE FUNCTION public.has_active_admin_recovery_session()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_recovery_sessions
    WHERE user_id = (SELECT auth.uid())
      AND session_id = ((SELECT auth.jwt()) ->> 'session_id')::uuid
      AND expires_at > now()
  );
$$;

-- Every existing policy and privileged RPC already calls is_admin(). Once an
-- admin opts into enforcement, this function makes AAL2 (or a short-lived,
-- single-use recovery grant) the database boundary instead of trusting React.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.has_admin_role()
    AND (
      NOT EXISTS (
        SELECT 1
        FROM public.admin_security_controls
        WHERE user_id = (SELECT auth.uid())
          AND mfa_required
      )
      OR ((SELECT auth.jwt()) ->> 'aal') = 'aal2'
      OR public.has_active_admin_recovery_session()
    );
$$;

CREATE OR REPLACE FUNCTION public.current_admin_authentication_methods()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((SELECT auth.jwt()) -> 'amr', '[]'::jsonb);
$$;

CREATE OR REPLACE FUNCTION public.record_admin_security_event(
  p_event_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_session_id uuid := (((SELECT auth.jwt()) ->> 'session_id')::uuid);
  v_user_agent text := NULLIF(left(trim(COALESCE(p_user_agent, '')), 400), '');
BEGIN
  IF NOT public.has_admin_role() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  IF p_event_type NOT IN (
    'admin_sign_in', 'admin_passkey_sign_in', 'admin_session_observed',
    'passkey_registered', 'passkey_removed', 'mfa_enrolled', 'mfa_verified',
    'mfa_enforcement_enabled', 'recovery_codes_rotated', 'password_changed',
    'all_sessions_signed_out'
  ) THEN
    RAISE EXCEPTION 'Unsupported admin security event' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.admin_security_sessions (
    session_id, user_id, first_seen_at, last_seen_at, last_event,
    authentication_methods, user_agent, revoked_at
  )
  VALUES (
    v_session_id, (SELECT auth.uid()), now(), now(), p_event_type,
    public.current_admin_authentication_methods(), v_user_agent, NULL
  )
  ON CONFLICT (session_id) DO UPDATE
  SET last_seen_at = EXCLUDED.last_seen_at,
      last_event = EXCLUDED.last_event,
      authentication_methods = EXCLUDED.authentication_methods,
      user_agent = COALESCE(EXCLUDED.user_agent, public.admin_security_sessions.user_agent),
      revoked_at = NULL;

  INSERT INTO public.admin_security_events (user_id, session_id, event_type, metadata)
  VALUES (
    (SELECT auth.uid()), v_session_id, p_event_type,
    COALESCE(p_metadata, '{}'::jsonb) - 'user_agent'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.enable_admin_mfa_enforcement()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.has_admin_role() OR ((SELECT auth.jwt()) ->> 'aal') <> 'aal2' THEN
    RAISE EXCEPTION 'A verified second factor is required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.admin_security_controls (user_id, mfa_required, mfa_enforced_at, updated_at)
  VALUES ((SELECT auth.uid()), true, now(), now())
  ON CONFLICT (user_id) DO UPDATE
  SET mfa_required = true,
      mfa_enforced_at = COALESCE(public.admin_security_controls.mfa_enforced_at, now()),
      updated_at = now();

  PERFORM public.record_admin_security_event('mfa_enforcement_enabled');
END;
$$;

CREATE OR REPLACE FUNCTION public.rotate_admin_recovery_codes()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_codes text[] := ARRAY[]::text[];
  v_code text;
  v_index integer;
BEGIN
  IF NOT public.has_admin_role() OR ((SELECT auth.jwt()) ->> 'aal') <> 'aal2' THEN
    RAISE EXCEPTION 'A verified second factor is required' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.admin_recovery_codes
  WHERE user_id = (SELECT auth.uid()) AND used_at IS NULL;

  FOR v_index IN 1..10 LOOP
    v_code := upper(substr(encode(extensions.gen_random_bytes(12), 'hex'), 1, 24));
    v_code := substr(v_code, 1, 6) || '-' || substr(v_code, 7, 6) || '-' || substr(v_code, 13, 6) || '-' || substr(v_code, 19, 6);
    INSERT INTO public.admin_recovery_codes (user_id, code_hash)
    VALUES ((SELECT auth.uid()), extensions.digest(v_code, 'sha256'));
    v_codes := array_append(v_codes, v_code);
  END LOOP;

  PERFORM public.record_admin_security_event('recovery_codes_rotated');
  RETURN v_codes;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_admin_recovery_code(p_code text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_session_id uuid := (((SELECT auth.jwt()) ->> 'session_id')::uuid);
  v_attempt public.admin_recovery_attempts%ROWTYPE;
  v_code_id uuid;
  v_expires_at timestamptz := now() + interval '15 minutes';
  v_normalized_code text := upper(trim(COALESCE(p_code, '')));
BEGIN
  IF NOT public.has_admin_role() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.admin_recovery_attempts (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_attempt
  FROM public.admin_recovery_attempts
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until > now() THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_code_id
  FROM public.admin_recovery_codes
  WHERE user_id = v_user_id
    AND used_at IS NULL
    AND code_hash = extensions.digest(v_normalized_code, 'sha256')
  FOR UPDATE;

  IF v_code_id IS NULL THEN
    UPDATE public.admin_recovery_attempts
    SET failed_count = CASE
          WHEN window_started_at < now() - interval '15 minutes' THEN 1
          ELSE failed_count + 1
        END,
        window_started_at = CASE
          WHEN window_started_at < now() - interval '15 minutes' THEN now()
          ELSE window_started_at
        END,
        locked_until = CASE
          WHEN (CASE WHEN window_started_at < now() - interval '15 minutes' THEN 1 ELSE failed_count + 1 END) >= 5
            THEN now() + interval '15 minutes'
          ELSE NULL
        END
    WHERE user_id = v_user_id;
    -- Return NULL rather than raising so the failed-attempt counter and lockout
    -- update commit with the RPC transaction.
    RETURN NULL;
  END IF;

  UPDATE public.admin_recovery_codes SET used_at = now() WHERE id = v_code_id;
  UPDATE public.admin_recovery_attempts
  SET failed_count = 0, window_started_at = now(), locked_until = NULL
  WHERE user_id = v_user_id;

  INSERT INTO public.admin_recovery_sessions (session_id, user_id, expires_at)
  VALUES (v_session_id, v_user_id, v_expires_at)
  ON CONFLICT (session_id) DO UPDATE
  SET user_id = EXCLUDED.user_id, expires_at = EXCLUDED.expires_at, created_at = now();

  INSERT INTO public.admin_security_events (user_id, session_id, event_type, metadata)
  VALUES (v_user_id, v_session_id, 'recovery_code_redeemed', jsonb_build_object('expires_at', v_expires_at));

  RETURN v_expires_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_security_status()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE WHEN public.has_admin_role() THEN jsonb_build_object(
    'mfa_required', COALESCE((
      SELECT mfa_required
      FROM public.admin_security_controls
      WHERE user_id = (SELECT auth.uid())
    ), false),
    'recovery_session_expires_at', (
      SELECT expires_at
      FROM public.admin_recovery_sessions
      WHERE user_id = (SELECT auth.uid())
        AND session_id = ((SELECT auth.jwt()) ->> 'session_id')::uuid
        AND expires_at > now()
    ),
    'session_id', (SELECT auth.jwt()) ->> 'session_id',
    'aal', COALESCE((SELECT auth.jwt()) ->> 'aal', 'aal1'),
    'authentication_methods', public.current_admin_authentication_methods()
  ) ELSE NULL END;
$$;

CREATE OR REPLACE FUNCTION public.end_all_admin_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'A verified administrator session is required' USING ERRCODE = '42501';
  END IF;

  PERFORM public.record_admin_security_event('all_sessions_signed_out');

  -- Record first: the audit helper refreshes the current session row. Marking
  -- sessions afterwards ensures the audit write cannot accidentally clear the
  -- signed-out state on the current row.
  UPDATE public.admin_security_sessions
  SET revoked_at = now(), last_event = 'all_sessions_signed_out'
  WHERE user_id = (SELECT auth.uid()) AND revoked_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.has_admin_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_active_admin_recovery_session() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_admin_authentication_methods() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_admin_security_event(text, jsonb, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.enable_admin_mfa_enforcement() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rotate_admin_recovery_codes() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.redeem_admin_recovery_code(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_security_status() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.end_all_admin_sessions() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_admin_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_active_admin_recovery_session() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_admin_authentication_methods() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_admin_security_event(text, jsonb, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enable_admin_mfa_enforcement() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rotate_admin_recovery_codes() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_admin_recovery_code(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_security_status() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.end_all_admin_sessions() TO authenticated, service_role;

COMMENT ON TABLE public.admin_security_sessions IS
  'Observed admin sessions. Auth remains the authority for live session validity.';
COMMENT ON TABLE public.admin_recovery_codes IS
  'Single-use admin recovery codes stored only as SHA-256 hashes.';

-- Duplicate or stale part-advance attempts are an expected client race, not a
-- database error. Return the authoritative state promptly so callers can
-- reconcile without creating error-log storms or waiting on repeated retries.
CREATE OR REPLACE FUNCTION public.advance_speaking_v2_part(
  p_auth_id uuid,
  p_test_session_id uuid,
  p_expected_revision integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE v_state public.speaking_session_state%ROWTYPE;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;

  SELECT s.* INTO v_state FROM public.speaking_session_state s
  JOIN public.users u ON u.id = s.user_id
  WHERE s.test_session_id = p_test_session_id AND u.auth_id = p_auth_id
  FOR UPDATE OF s;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'session_not_found');
  END IF;
  IF v_state.revision <> p_expected_revision OR v_state.status <> 'part_complete' THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'state_conflict',
      'state', to_jsonb(v_state)
    );
  END IF;
  IF v_state.current_part >= 3 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'final_part', 'state', to_jsonb(v_state));
  END IF;

  UPDATE public.speaking_session_state SET
    current_part = current_part + 1,
    current_question_index = 0,
    clarification_count = 0,
    revision = revision + 1,
    status = 'active',
    updated_at = now()
  WHERE test_session_id = p_test_session_id
  RETURNING * INTO v_state;

  RETURN to_jsonb(v_state);
END;
$$;

-- Speaking Practice: 10 active minutes (was 8). Turn limit (10), the learner
-- audio budget (480 s) and Exam mode are unchanged.
--
-- Practice time counts every active second, including the AI coach's spoken
-- reply after each answer, so the coach now uses part of the learner's time.
-- New sessions only; sessions already started keep their limits.

ALTER TABLE public.speaking_session_state
  DROP CONSTRAINT speaking_session_state_remaining_active_seconds_check,
  ADD CONSTRAINT speaking_session_state_remaining_active_seconds_check
    CHECK (remaining_active_seconds >= 0 AND remaining_active_seconds <= 600);

CREATE OR REPLACE FUNCTION public.start_speaking_v2_session(p_auth_id uuid, p_test_session_id uuid, p_mode text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_session public.test_sessions%ROWTYPE;
  v_profile public.users%ROWTYPE;
  v_state public.speaking_session_state%ROWTYPE;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;
  IF p_mode NOT IN ('exam', 'practice') THEN
    RAISE EXCEPTION 'invalid speaking mode' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_session FROM public.test_sessions WHERE id = p_test_session_id;
  IF NOT FOUND OR v_session.test_type <> 'speaking' THEN
    RAISE EXCEPTION 'speaking session not found' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO v_profile FROM public.users
  WHERE id = v_session.user_id AND auth_id = p_auth_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'speaking session access denied' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.speaking_session_state (
    test_session_id, user_id, passage_id, mode, turn_limit, audio_limit_ms,
    remaining_active_seconds, expires_at, resume_expires_at, last_heartbeat_at
  ) VALUES (
    v_session.id, v_session.user_id, v_session.passage_id, p_mode,
    CASE WHEN p_mode = 'exam' THEN 20 ELSE 10 END,
    CASE WHEN p_mode = 'exam' THEN 840000 ELSE 480000 END,
    CASE WHEN p_mode = 'practice' THEN 600 ELSE NULL END,
    CASE WHEN p_mode = 'exam' THEN now() + interval '14 minutes' ELSE NULL END,
    CASE WHEN p_mode = 'practice' THEN now() + interval '24 hours' ELSE NULL END,
    now()
  )
  ON CONFLICT (test_session_id) DO NOTHING;

  SELECT * INTO v_state FROM public.speaking_session_state
  WHERE test_session_id = p_test_session_id;
  IF v_state.user_id <> v_session.user_id THEN
    RAISE EXCEPTION 'speaking state ownership mismatch' USING ERRCODE = '42501';
  END IF;

  RETURN to_jsonb(v_state);
END;
$function$;

-- Practice lifecycle calls must never erase a completed-part boundary. The
-- learner can pause on the transition card and resume later, but only the
-- explicit part-advance RPC may move that state back to active.
CREATE OR REPLACE FUNCTION public.touch_speaking_v2_practice(
  p_auth_id uuid,
  p_test_session_id uuid,
  p_action text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_state public.speaking_session_state%ROWTYPE;
  v_elapsed integer;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;
  IF p_action NOT IN ('heartbeat', 'pause', 'resume') THEN
    RAISE EXCEPTION 'invalid practice action' USING ERRCODE = '22023';
  END IF;

  SELECT s.* INTO v_state FROM public.speaking_session_state s
  JOIN public.users u ON u.id = s.user_id
  WHERE s.test_session_id = p_test_session_id AND u.auth_id = p_auth_id
  FOR UPDATE OF s;
  IF NOT FOUND OR v_state.mode <> 'practice' THEN
    RAISE EXCEPTION 'practice session not found' USING ERRCODE = 'P0002';
  END IF;

  IF now() >= v_state.resume_expires_at THEN
    UPDATE public.speaking_session_state SET status = 'expired', updated_at = now()
    WHERE test_session_id = p_test_session_id RETURNING * INTO v_state;
    RETURN to_jsonb(v_state);
  END IF;

  v_elapsed := CASE
    WHEN v_state.status = 'active' AND v_state.last_heartbeat_at IS NOT NULL
      THEN LEAST(30, GREATEST(0, floor(extract(epoch FROM now() - v_state.last_heartbeat_at))::integer))
    ELSE 0
  END;

  UPDATE public.speaking_session_state SET
    remaining_active_seconds = GREATEST(0, remaining_active_seconds - v_elapsed),
    status = CASE
      WHEN v_state.status = 'part_complete' THEN 'part_complete'
      WHEN v_state.status = 'ready_for_evaluation' THEN 'ready_for_evaluation'
      WHEN v_state.status IN ('expired', 'completed') THEN v_state.status
      WHEN remaining_active_seconds - v_elapsed <= 0 THEN 'ready_for_evaluation'
      WHEN p_action = 'pause' THEN 'paused'
      WHEN p_action = 'resume' AND v_state.status = 'paused' THEN 'active'
      ELSE v_state.status
    END,
    last_heartbeat_at = CASE
      WHEN v_state.status IN ('part_complete', 'ready_for_evaluation', 'expired', 'completed')
        THEN NULL
      WHEN p_action = 'pause' THEN NULL
      WHEN p_action IN ('resume', 'heartbeat') THEN now()
      ELSE last_heartbeat_at
    END,
    updated_at = now()
  WHERE test_session_id = p_test_session_id
  RETURNING * INTO v_state;

  RETURN to_jsonb(v_state);
END;
$$;

-- Repair only from the authoritative turn ledger. Client summary flags are
-- deliberately ignored.
UPDATE public.speaking_session_state AS state
SET status = 'part_complete', last_heartbeat_at = NULL, updated_at = now()
WHERE state.current_part < 3
  AND state.status IN ('active', 'paused')
  AND EXISTS (
    SELECT 1
    FROM public.speaking_turns AS turn
    WHERE turn.test_session_id = state.test_session_id
      AND turn.part_number = state.current_part
      AND turn.reservation_status = 'completed'
      AND turn.action = 'complete_part'
      AND NOT EXISTS (
        SELECT 1
        FROM public.speaking_turns AS newer_turn
        WHERE newer_turn.test_session_id = turn.test_session_id
          AND newer_turn.sequence_number > turn.sequence_number
          AND newer_turn.part_number = turn.part_number
      )
  );

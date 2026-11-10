-- Finalization is idempotent. Stale work returns an explicit terminal conflict
-- rather than SQLSTATE 40001, which incorrectly describes a retriable transaction.
SET lock_timeout = '5s';
SET statement_timeout = '30s';

CREATE OR REPLACE FUNCTION public.finalize_speaking_v2_turn(
  p_auth_id uuid,
  p_turn_id uuid,
  p_result jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_turn public.speaking_turns%ROWTYPE;
  v_state public.speaking_session_state%ROWTYPE;
  v_status text;
  v_next_part integer;
  v_next_question integer;
  v_next_clarification integer;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;

  SELECT t.* INTO v_turn
  FROM public.speaking_turns t
  JOIN public.users u ON u.id = t.user_id
  WHERE t.id = p_turn_id AND u.auth_id = p_auth_id
  FOR UPDATE OF t;
  IF NOT FOUND THEN RAISE EXCEPTION 'turn not found' USING ERRCODE = 'P0002'; END IF;

  SELECT * INTO v_state FROM public.speaking_session_state
  WHERE test_session_id = v_turn.test_session_id FOR UPDATE;
  -- A delivery retry returns the original answer without consuming quota again.
  IF v_turn.reservation_status = 'completed' THEN
    RETURN jsonb_build_object('replayed', true, 'response', v_turn.response_payload,
      'state', to_jsonb(v_state));
  END IF;
  -- Business conflicts are terminal outcomes, not retryable serialization errors.
  IF v_state.processing_turn_id IS DISTINCT FROM v_turn.id
     OR v_turn.reservation_status <> 'reserved'
     OR v_state.status NOT IN ('active', 'paused') THEN
    RETURN jsonb_build_object('code', 'speaking_turn_inactive', 'retryable', false,
      'state', to_jsonb(v_state));
  END IF;

  v_next_part := COALESCE((p_result -> 'state' ->> 'part')::integer, v_state.current_part);
  v_next_question := COALESCE((p_result -> 'state' ->> 'questionNumber')::integer, v_state.current_question_index);
  v_next_clarification := COALESCE((p_result -> 'state' ->> 'clarificationCount')::integer, 0);
  v_status := COALESCE(p_result -> 'state' ->> 'status', 'active');
  IF v_next_part NOT BETWEEN 1 AND 3 OR v_next_question < 0 OR v_next_clarification NOT BETWEEN 0 AND 1 THEN
    RAISE EXCEPTION 'invalid next speaking state' USING ERRCODE = '22023';
  END IF;
  IF v_status NOT IN ('active', 'part_complete', 'ready_for_evaluation') THEN
    RAISE EXCEPTION 'invalid speaking state status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.speaking_turns SET
    revision_after = v_state.revision + 1,
    question_id = NULLIF(p_result ->> 'questionId', '')::uuid,
    transcript = left(COALESCE(p_result ->> 'transcript', ''), 6000),
    transcript_status = COALESCE(p_result ->> 'transcriptStatus', 'ready'),
    classification = p_result ->> 'classification',
    relevance = NULLIF(p_result ->> 'relevance', '')::numeric,
    answer_depth = p_result ->> 'answerDepth',
    action = p_result ->> 'action',
    is_valid_answer = COALESCE((p_result ->> 'isValidAnswer')::boolean, false),
    semantic_degraded = COALESCE((p_result ->> 'semanticDegraded')::boolean, false),
    evidence_quote = left(NULLIF(p_result ->> 'evidenceQuote', ''), 180),
    coaching_code = left(NULLIF(p_result ->> 'coachingCode', ''), 40),
    provider_metadata = COALESCE(p_result -> 'provider', '{}'::jsonb),
    latency_metadata = COALESCE(p_result -> 'latency', '{}'::jsonb),
    response_payload = p_result -> 'response',
    reservation_status = 'completed',
    completed_at = now()
  WHERE id = v_turn.id;

  UPDATE public.speaking_session_state SET
    current_part = v_next_part,
    current_question_index = v_next_question,
    clarification_count = v_next_clarification,
    revision = revision + 1,
    turns_used = turns_used + 1,
    audio_ms_used = audio_ms_used + v_turn.audio_duration_ms,
    remaining_active_seconds = remaining_active_seconds,
    status = CASE
      WHEN status = 'paused' THEN 'paused'
      WHEN mode = 'practice' AND turns_used + 1 >= turn_limit THEN 'ready_for_evaluation'
      ELSE v_status
    END,
    processing_turn_id = NULL,
    last_heartbeat_at = now(),
    updated_at = now()
  WHERE test_session_id = v_turn.test_session_id
  RETURNING * INTO v_state;

  RETURN to_jsonb(v_state);
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_speaking_v2_turn(uuid, uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_speaking_v2_turn(uuid, uuid, jsonb) TO service_role;
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
  IF NOT FOUND THEN RAISE EXCEPTION 'session not found' USING ERRCODE = 'P0002'; END IF;
  IF v_state.revision <> p_expected_revision OR v_state.status <> 'part_complete' THEN
    RETURN jsonb_build_object('allowed', false, 'code', 'speaking_state_conflict',
      'retryable', false, 'state', to_jsonb(v_state));
  END IF;
  IF v_state.current_part >= 3 THEN
    RAISE EXCEPTION 'final part cannot advance' USING ERRCODE = '22023';
  END IF;
  UPDATE public.speaking_session_state SET
    current_part = current_part + 1, current_question_index = 0,
    clarification_count = 0, revision = revision + 1, status = 'active', updated_at = now()
  WHERE test_session_id = p_test_session_id RETURNING * INTO v_state;
  RETURN to_jsonb(v_state);
END;
$$;
REVOKE ALL ON FUNCTION public.advance_speaking_v2_part(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.advance_speaking_v2_part(uuid, uuid, integer) TO service_role;
RESET lock_timeout;
RESET statement_timeout;

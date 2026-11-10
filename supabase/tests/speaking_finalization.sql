-- Rollback-only regression probes, also runnable against the linked database.
BEGIN;
SET LOCAL statement_timeout = '10s';
DO $test$
DECLARE
  fixture record;
  result jsonb;
  original_state jsonb;
  saved_response jsonb := '{"success":true,"userTranscript":"A saved answer","examinerText":"Saved question"}';
BEGIN
  SELECT t.id, t.test_session_id, u.auth_id INTO STRICT fixture
  FROM public.speaking_turns t JOIN public.users u ON u.id = t.user_id
  WHERE t.reservation_status = 'completed'
  ORDER BY t.created_at LIMIT 1;
  PERFORM set_config('request.jwt.claims', '{"role":"service_role"}', true);
  UPDATE public.speaking_session_state SET processing_turn_id = NULL
  WHERE test_session_id = fixture.test_session_id;
  UPDATE public.speaking_turns SET response_payload = saved_response
  WHERE id = fixture.id;
  SELECT to_jsonb(s) INTO original_state FROM public.speaking_session_state s
  WHERE test_session_id = fixture.test_session_id;

  -- A lost HTTP response must not turn a completed answer into a failure.
  result := public.finalize_speaking_v2_turn(fixture.auth_id, fixture.id, '{}');
  ASSERT result->>'replayed' = 'true', 'Completed finalization must replay';
  ASSERT result->'response' = saved_response, 'Replay must return the saved response';
  ASSERT result->'state' = original_state, 'Replay must preserve authoritative state';
  ASSERT (SELECT to_jsonb(s) = original_state FROM public.speaking_session_state s
    WHERE test_session_id = fixture.test_session_id), 'Replay must not charge quota twice';

  -- A failed or superseded turn is a terminal conflict, never SQLSTATE 40001.
  UPDATE public.speaking_turns SET reservation_status = 'reserved' WHERE id = fixture.id;
  result := public.finalize_speaking_v2_turn(fixture.auth_id, fixture.id, '{}');
  ASSERT result->>'code' = 'speaking_turn_inactive', 'Inactive turn needs a stable code';
  ASSERT result->>'retryable' = 'false', 'Inactive turn must not be retried';
  ASSERT result->'state' = original_state, 'Conflict must return authoritative state';
  ASSERT (SELECT reservation_status = 'reserved' FROM public.speaking_turns
    WHERE id = fixture.id), 'Conflict must not overwrite the turn';

  -- A reserved turn can complete exactly once.
  UPDATE public.speaking_session_state SET processing_turn_id = fixture.id,
    status = 'active', turns_used = 0, revision = 0, audio_ms_used = 0
  WHERE test_session_id = fixture.test_session_id;
  result := public.finalize_speaking_v2_turn(fixture.auth_id, fixture.id,
    jsonb_build_object('transcript', 'A saved answer', 'transcriptStatus', 'ready',
      'state', jsonb_build_object('part', 1, 'questionNumber', 1, 'status', 'active'),
      'response', saved_response));
  ASSERT COALESCE(result->'state', result)->>'revision' = '1', 'First completion advances once';
  result := public.finalize_speaking_v2_turn(fixture.auth_id, fixture.id, '{}');
  ASSERT result->>'replayed' = 'true', 'Second completion must replay';
  ASSERT result->'state'->>'turns_used' = '1', 'Duplicate must not consume another turn';

  -- Expired/finished sessions cannot be revived by a late provider response.
  UPDATE public.speaking_turns SET reservation_status = 'reserved' WHERE id = fixture.id;
  UPDATE public.speaking_session_state SET status = 'expired', processing_turn_id = fixture.id
  WHERE test_session_id = fixture.test_session_id;
  result := public.finalize_speaking_v2_turn(fixture.auth_id, fixture.id, '{}');
  ASSERT result->>'code' = 'speaking_turn_inactive', 'Late response must not revive an expired session';
  ASSERT result->'state'->>'status' = 'expired', 'Session must stay expired';

  result := public.advance_speaking_v2_part(fixture.auth_id, fixture.test_session_id, -1);
  ASSERT result->>'allowed' = 'false', 'Stale part transition must return a terminal conflict';
  ASSERT result->>'retryable' = 'false', 'Stale part transition must not be retried';

  -- Authorization is checked before any result is replayed.
  BEGIN
    PERFORM public.finalize_speaking_v2_turn(gen_random_uuid(), fixture.id, '{}');
    RAISE EXCEPTION 'Other users must not read a saved answer';
  EXCEPTION WHEN no_data_found THEN NULL;
  END;
  PERFORM set_config('request.jwt.claims', '{"role":"authenticated"}', true);
  BEGIN
    PERFORM public.finalize_speaking_v2_turn(fixture.auth_id, fixture.id, '{}');
    RAISE EXCEPTION 'Unprivileged callers must be rejected';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$test$;
ROLLBACK;

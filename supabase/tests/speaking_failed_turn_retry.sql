-- Run against a database containing at least one failed Speaking V2 attempt.
-- Every probe is rolled back by the nested exception block, including assertions.
DO $test$
DECLARE
  candidate record;
  reservation jsonb;
  second_reservation jsonb;
  key text;
  expected_sequence integer;
  actual_sequence integer;
  tested integer := 0;
BEGIN
  FOR candidate IN
    SELECT s.*, u.auth_id
    FROM public.speaking_session_state s
    JOIN public.users u ON u.id = s.user_id
    WHERE EXISTS (
      SELECT 1 FROM public.speaking_turns t
      WHERE t.test_session_id = s.test_session_id AND t.reservation_status = 'failed'
    )
  LOOP
    BEGIN
      PERFORM set_config('request.jwt.claims', '{"role":"service_role"}', true);
      -- Make the fixture resumable inside this rollback-only probe.
      UPDATE public.speaking_session_state
      SET status = 'active', last_heartbeat_at = now(),
          expires_at = CASE WHEN mode = 'exam' THEN now() + interval '1 hour' ELSE NULL END,
          resume_expires_at = now() + interval '1 hour',
          processing_turn_id = NULL,
          turn_limit = GREATEST(turn_limit, turns_used + 2),
          audio_limit_ms = GREATEST(audio_limit_ms, audio_ms_used + 4000)
      WHERE test_session_id = candidate.test_session_id;
      SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO expected_sequence
      FROM public.speaking_turns WHERE test_session_id = candidate.test_session_id;
      key := 'regression-' || gen_random_uuid()::text;
      reservation := public.reserve_speaking_v2_turn(
        candidate.auth_id, candidate.test_session_id, candidate.revision, key, 1000
      );
      ASSERT (reservation->>'allowed')::boolean, 'Retry must be accepted after a failed turn';
      SELECT sequence_number INTO actual_sequence FROM public.speaking_turns
      WHERE id = (reservation->>'turnId')::uuid;
      ASSERT actual_sequence = expected_sequence, 'Sequence must include failed ledger entries';
      second_reservation := public.reserve_speaking_v2_turn(
        candidate.auth_id, candidate.test_session_id, candidate.revision, key, 1000
      );
      ASSERT second_reservation->>'turnId' = reservation->>'turnId',
        'Replayed idempotency key must reuse the reservation';
      PERFORM public.fail_speaking_v2_turn(
        candidate.auth_id, (reservation->>'turnId')::uuid, 'regression failure'
      );
      second_reservation := public.reserve_speaking_v2_turn(
        candidate.auth_id, candidate.test_session_id, candidate.revision,
        'regression-' || gen_random_uuid()::text, 1000
      );
      ASSERT (second_reservation->>'allowed')::boolean, 'Repeated failures must remain retryable';
      ASSERT (SELECT turns_used = candidate.turns_used AND audio_ms_used = candidate.audio_ms_used
        FROM public.speaking_session_state WHERE test_session_id = candidate.test_session_id),
        'Failed attempts must not consume successful-turn or audio quota';
      tested := tested + 1;
      RAISE EXCEPTION 'rollback successful probe' USING ERRCODE = 'P0002';
    EXCEPTION WHEN SQLSTATE 'P0002' THEN NULL;
    END;
  END LOOP;
  ASSERT tested > 0, 'No failed-attempt fixtures found';
END
$test$;

-- Failed attempts remain in the ledger but do not increment turns_used.
-- Allocate the next ledger sequence independently of the successful-turn quota.
-- The existing per-session advisory lock serializes this allocation.
DO $migration$
DECLARE
  definition text;
  old_expression constant text := 'p_test_session_id, v_state.user_id, p_idempotency_key, v_state.turns_used + 1,';
  new_expression constant text := 'p_test_session_id, v_state.user_id, p_idempotency_key,
    (SELECT COALESCE(MAX(t.sequence_number), 0) + 1
     FROM public.speaking_turns t WHERE t.test_session_id = p_test_session_id),';
BEGIN
  SELECT pg_get_functiondef(
    'public.reserve_speaking_v2_turn(uuid,uuid,integer,text,integer)'::regprocedure
  ) INTO definition;
  IF position(old_expression IN definition) = 0 THEN
    RAISE EXCEPTION 'Unexpected reserve_speaking_v2_turn definition; refusing to change it';
  END IF;
  EXECUTE replace(definition, old_expression, new_expression);
END
$migration$;

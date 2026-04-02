-- ============================================================
-- Backfill writing and speaking test skills
-- ============================================================
-- This migration simulates a re-completion of legacy writing
-- and speaking tests to trigger the newly updated
-- update_skill_proficiency_from_test() logic and populate the
-- missing criteria-based skill proficiencies.

DO $$
DECLARE
  v_session_id UUID;
BEGIN
  -- We order by completed_at ASC so that early tests are
  -- factored into the learning curve first, preserving
  -- the chronological mastery progression.
  FOR v_session_id IN (
      SELECT id 
      FROM public.test_sessions 
      WHERE is_completed = true 
        AND test_type IN ('writing', 'speaking') 
      ORDER BY completed_at ASC
  ) LOOP
     -- Temporarily toggling is_completed fires the trigger securely
     -- because the trigger condition checks if OLD.is_completed was false
     UPDATE public.test_sessions SET is_completed = false WHERE id = v_session_id;
     UPDATE public.test_sessions SET is_completed = true WHERE id = v_session_id;
  END LOOP;
END;
$$;

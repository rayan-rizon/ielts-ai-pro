-- All application relations in these bodies are already schema-qualified.
-- Keep SECURITY INVOKER and existing grants; only pin name resolution.
ALTER FUNCTION public.validate_writing_coaching_insert() SET search_path TO '';
ALTER FUNCTION public.claim_writing_transformation(uuid) SET search_path TO '';
ALTER FUNCTION public.claim_writing_revision_check(uuid, text) SET search_path TO '';

-- Live tables contain 2-136 rows; bound lock waiting during index creation.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';
CREATE INDEX IF NOT EXISTS idx_ai_coach_messages_user_id_fk ON public.ai_coach_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_action_proposals_conversation_id_fk ON public.ai_coach_action_proposals (conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_action_proposals_message_id_fk ON public.ai_coach_action_proposals (message_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_activity_links_conversation_id_fk ON public.ai_coach_activity_links (conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_activity_links_proposal_id_fk ON public.ai_coach_activity_links (proposal_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_activity_links_source_session_id_fk ON public.ai_coach_activity_links (source_session_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_activity_links_completed_session_id_fk ON public.ai_coach_activity_links (completed_session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_answers_user_id_fk ON ai_coach_private.exercise_answers (user_id);
CREATE INDEX IF NOT EXISTS idx_operations_conversation_id_fk ON ai_coach_private.operations (conversation_id);

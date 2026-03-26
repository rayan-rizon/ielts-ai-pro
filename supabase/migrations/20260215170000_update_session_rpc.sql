-- Migration: Fix RPC to return latest session per passage and make remote_schema idempotent
-- Date: 2026-02-15 17:00:00

-- 1. Correct get_user_latest_sessions to return latest session PER PASSAGE
CREATE OR REPLACE FUNCTION "public"."get_user_latest_sessions"(
    p_user_id uuid,
    p_test_type text,
    p_passage_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(session_id uuid, passage_id uuid, is_completed boolean, score numeric, progress_percentage numeric, created_at timestamp with time zone, completed_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    -- Ensure the user can only access their own sessions
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND auth_id = auth.uid()) THEN
        RAISE EXCEPTION 'Permission denied: User cannot access another user''s sessions.';
    END IF;

    RETURN QUERY
    SELECT DISTINCT ON (ts.passage_id)
        ts.id AS session_id,
        ts.passage_id,
        ts.is_completed,
        ts.score,
        ts.progress_percentage,
        ts.created_at,
        ts.completed_at
    FROM public.test_sessions ts
    WHERE ts.user_id = p_user_id
      AND ts.test_type = p_test_type
      AND (p_passage_id IS NULL OR ts.passage_id = p_passage_id)
    ORDER BY ts.passage_id, ts.created_at DESC;
END;
$function$;

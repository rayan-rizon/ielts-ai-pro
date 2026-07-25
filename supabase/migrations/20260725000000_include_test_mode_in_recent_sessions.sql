-- Surface the persisted attempt mode in learner-facing test history.
DROP FUNCTION IF EXISTS public.get_recent_sessions(integer);

CREATE FUNCTION public.get_recent_sessions(p_limit integer DEFAULT 8)
RETURNS TABLE(
    id uuid,
    passage_id uuid,
    passage_title text,
    test_type text,
    test_mode text,
    score numeric,
    completed_at timestamp with time zone,
    duration_minutes integer
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT u.id INTO v_user_id
    FROM public.users u
    WHERE u.auth_id = auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated or user not found';
    END IF;

    RETURN QUERY
    SELECT
        ts.id,
        ts.passage_id,
        p.title AS passage_title,
        ts.test_type,
        ts.test_mode,
        ts.score,
        ts.completed_at,
        ts.duration_minutes
    FROM public.test_sessions ts
    LEFT JOIN public.passages p ON p.id = ts.passage_id
    WHERE ts.user_id = v_user_id
      AND ts.is_completed = true
      AND ts.score IS NOT NULL
    ORDER BY ts.completed_at DESC
    LIMIT p_limit;
END;
$$;

ALTER FUNCTION public.get_recent_sessions(integer) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_recent_sessions(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_recent_sessions(integer) TO authenticated, service_role;


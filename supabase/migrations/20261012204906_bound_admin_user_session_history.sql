-- created_at is nullable in the live schema; normalize null to the oldest key.
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_history_cursor
ON public.test_sessions (user_id, (coalesce(created_at, '-infinity'::timestamptz)) DESC, id DESC);

-- Metadata-only keyset history; lifetime summaries are independent of the page.
CREATE OR REPLACE FUNCTION public.admin_user_session_history(
    p_user_id uuid, p_before_date timestamptz DEFAULT NULL,
    p_before_id uuid DEFAULT NULL, p_limit integer DEFAULT 25
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
    v_limit integer := greatest(1, least(coalesce(p_limit, 25), 50));
    v_result jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
    END IF;
    IF (p_before_date IS NULL) <> (p_before_id IS NULL) THEN
        RAISE EXCEPTION 'Both cursor fields are required' USING ERRCODE = '22023';
    END IF;
    WITH candidates AS (
        SELECT ts.id, ts.test_type, ts.score, ts.completed_at, ts.created_at, ts.is_completed,
               coalesce(ts.created_at, '-infinity'::timestamptz) cursor_date
        FROM public.test_sessions ts
        WHERE ts.user_id = p_user_id
          AND (p_before_date IS NULL OR (coalesce(ts.created_at, '-infinity'::timestamptz), ts.id) < (p_before_date, p_before_id))
        ORDER BY coalesce(ts.created_at, '-infinity'::timestamptz) DESC, ts.id DESC LIMIT v_limit + 1
    ), page AS (
        SELECT * FROM candidates ORDER BY cursor_date DESC, id DESC LIMIT v_limit
    ), measured AS (
        -- Preserve the existing admin summary's completed, nonzero-score rule.
        SELECT id, test_type, score, completed_at FROM public.test_sessions
        WHERE user_id = p_user_id AND is_completed AND score <> 0
    ), modules AS (
        SELECT test_type, count(*) total, max(score) best, avg(score) average
        FROM measured GROUP BY test_type
    ), recent AS (
        SELECT * FROM measured ORDER BY completed_at DESC NULLS LAST, id DESC LIMIT 10
    ), trend AS (
        SELECT row_number() OVER (ORDER BY completed_at ASC NULLS FIRST, id ASC) session,
               score, completed_at date, test_type module
        FROM recent
    )
    SELECT jsonb_build_object(
        'sessions', coalesce((SELECT jsonb_agg(to_jsonb(p) - 'cursor_date' ORDER BY cursor_date DESC, id DESC) FROM page p), '[]'::jsonb),
        'nextCursor', CASE WHEN (SELECT count(*) FROM candidates) > v_limit THEN
            (SELECT jsonb_build_object('created_at', cursor_date, 'id', id)
             FROM page ORDER BY cursor_date ASC, id ASC LIMIT 1) ELSE NULL END,
        'stats', jsonb_build_object(
            'overallAverage', coalesce((SELECT to_char(avg(score), 'FM999990.0') FROM measured), '0.0'),
            'totalCompleted', (SELECT count(*) FROM measured),
            'moduleBreakdown', coalesce((SELECT jsonb_object_agg(test_type, jsonb_build_object(
                'total', total, 'best', best, 'average', average)) FROM modules WHERE test_type IS NOT NULL), '{}'::jsonb),
            'recentTrend', coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY session) FROM trend t), '[]'::jsonb)
        )
    ) INTO v_result;
    RETURN v_result;
END;
$function$;
REVOKE ALL ON FUNCTION public.admin_user_session_history(uuid, timestamptz, uuid, integer)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_user_session_history(uuid, timestamptz, uuid, integer)
    TO authenticated;

-- Keep the public leaderboard learner-only. The filter must happen before
-- ordering, LIMIT, and OFFSET so admins cannot occupy ranks or page slots.
DROP FUNCTION IF EXISTS public.get_leaderboard(integer, integer, text);

CREATE OR REPLACE FUNCTION public.get_leaderboard(
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0,
  time_filter text DEFAULT 'all_time'
)
RETURNS TABLE (
  full_name text,
  avatar_url text,
  points integer,
  current_streak integer,
  real_avg_score numeric,
  country text,
  is_me boolean,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_users AS (
    SELECT
      up.user_id,
      up.points,
      up.current_streak,
      COUNT(*) OVER () AS total_count
    FROM public.user_points up
    JOIN public.users u ON u.id = up.user_id
    WHERE u.role IS DISTINCT FROM 'admin'
      AND CASE
        WHEN time_filter = 'weekly' THEN up.updated_at >= (now() - interval '7 days')
        WHEN time_filter = 'monthly' THEN up.updated_at >= (now() - interval '30 days')
        ELSE true
      END
    ORDER BY up.points DESC
    LIMIT limit_count
    OFFSET offset_count
  )
  SELECT
    u.full_name,
    u.avatar_url,
    fu.points,
    COALESCE(fu.current_streak, 0),
    COALESCE(
      (
        SELECT ROUND(AVG(ts.score), 1)
        FROM public.test_sessions ts
        WHERE ts.user_id = fu.user_id
          AND ts.is_completed = true
          AND ts.score IS NOT NULL
      ),
      0.0
    ),
    COALESCE(u.country, 'Global'),
    u.auth_id = auth.uid(),
    fu.total_count
  FROM filtered_users fu
  JOIN public.users u ON u.id = fu.user_id
  ORDER BY fu.points DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(integer, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer, integer, text) TO authenticated, anon, service_role;

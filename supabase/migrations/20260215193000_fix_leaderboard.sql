-- Safe, simple RPC to fetch leaderboard data, bypassing RLS but returning safe fields
DROP FUNCTION IF EXISTS get_leaderboard(int, int, text);

CREATE OR REPLACE FUNCTION get_leaderboard(
  limit_count int DEFAULT 50,
  offset_count int DEFAULT 0,
  time_filter text DEFAULT 'all_time'
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  points int,
  current_streak int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.user_id,
    u.full_name,
    u.avatar_url,
    up.points,
    up.current_streak
  FROM user_points up
  JOIN users u ON u.id = up.user_id
  WHERE
    CASE
      WHEN time_filter = 'weekly' THEN up.updated_at >= (now() - interval '7 days')
      WHEN time_filter = 'monthly' THEN up.updated_at >= (now() - interval '30 days')
      ELSE true
    END
  ORDER BY up.points DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

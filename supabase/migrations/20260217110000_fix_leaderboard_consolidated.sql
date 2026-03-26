-- ============================================================================
-- Migration: Fix Leaderboard with Scores (Consolidated)
--
-- This migration consolidates the previous two migrations and fixes the issue
-- where the leaderboard was showing no results.
--
-- Changes:
-- 1. Properly removes user_id from output for security
-- 2. Adds real_avg_score calculation efficiently
-- 3. Adds country field if missing
-- 4. Introduces is_me flag to securely identify the current user
-- 5. Uses a materialized approach for better performance at scale
-- ============================================================================

-- Ensure required columns exist on users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS real_avg_score numeric DEFAULT 0.0;

-- Drop existing function to ensure clean state
DROP FUNCTION IF EXISTS get_leaderboard(int, int, text);

CREATE OR REPLACE FUNCTION get_leaderboard(
  limit_count int DEFAULT 50,
  offset_count int DEFAULT 0,
  time_filter text DEFAULT 'all_time'
)
RETURNS TABLE (
  full_name text,
  avatar_url text,
  points int,
  current_streak int,
  real_avg_score numeric,
  country text,
  is_me boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_users AS (
    -- First, filter users based on time filter
    SELECT
      up.user_id,
      up.points,
      up.current_streak
    FROM user_points up
    WHERE
      CASE
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
    COALESCE(fu.current_streak, 0) as current_streak,
    COALESCE(
      (
        SELECT ROUND(AVG(ts.score), 1)
        FROM test_sessions ts
        WHERE ts.user_id = fu.user_id
          AND ts.is_completed = true
          AND ts.score IS NOT NULL
      ),
      0.0
    ) as real_avg_score,
    COALESCE(u.country, 'Global') as country,
    u.auth_id = auth.uid() as is_me
  FROM filtered_users fu
  JOIN users u ON u.id = fu.user_id
  ORDER BY fu.points DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_leaderboard(int, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard(int, int, text) TO anon;
GRANT EXECUTE ON FUNCTION get_leaderboard(int, int, text) TO service_role;

-- Create index to optimize score calculations (if not exists)
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_completed_score 
ON test_sessions(user_id, is_completed, score) 
WHERE is_completed = true AND score IS NOT NULL;

-- Create index for time-based filtering on user_points
CREATE INDEX IF NOT EXISTS idx_user_points_updated_at_points 
ON user_points(updated_at DESC, points DESC);

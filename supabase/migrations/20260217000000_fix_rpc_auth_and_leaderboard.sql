-- ============================================================================
-- Migration: Fix RPC Auth Bypass & Leaderboard User ID Exposure
--
-- Issues Fixed:
-- 1. add_user_points() accepted arbitrary p_user_id — any authenticated user
--    could manipulate anyone's points. Now derives user from auth.uid().
-- 2. update_user_streak() same issue — now derives user from auth.uid().
-- 3. get_leaderboard() exposed user_id UUIDs — removed from output.
-- ============================================================================

-- ============================================================
-- 1. Fix add_user_points: Remove p_user_id, derive from JWT
-- ============================================================
DROP FUNCTION IF EXISTS add_user_points(UUID, INT);

CREATE OR REPLACE FUNCTION add_user_points(
  p_points INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Derive the user's public ID from their JWT auth identity
  SELECT id INTO v_user_id
  FROM users
  WHERE auth_id = (SELECT auth.uid());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for current session';
  END IF;

  UPDATE user_points
  SET points = points + p_points,
      updated_at = NOW()
  WHERE user_id = v_user_id;
END;
$$;

-- ============================================================
-- 2. Fix update_user_streak: Remove p_user_id, derive from JWT
-- ============================================================
DROP FUNCTION IF EXISTS update_user_streak(UUID);

CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TABLE (
  new_streak INT,
  new_longest INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_last_activity DATE;
  v_current_streak INT;
  v_longest_streak INT;
  v_today DATE := CURRENT_DATE;
  v_diff INT;
BEGIN
  -- Derive the user's public ID from their JWT auth identity
  SELECT id INTO v_user_id
  FROM users
  WHERE auth_id = (SELECT auth.uid());

  IF v_user_id IS NULL THEN
    new_streak := 0;
    new_longest := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Lock the row to prevent concurrent updates
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM user_points
  WHERE user_id = v_user_id
  FOR UPDATE;

  -- If no record found, do nothing
  IF NOT FOUND THEN
    new_streak := 0;
    new_longest := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Already logged activity today
  IF v_last_activity = v_today THEN
    new_streak := COALESCE(v_current_streak, 0);
    new_longest := COALESCE(v_longest_streak, 0);
    RETURN NEXT;
    RETURN;
  END IF;

  -- Calculate new streak
  IF v_last_activity IS NOT NULL THEN
    v_diff := v_today - v_last_activity;
    IF v_diff = 1 THEN
      v_current_streak := COALESCE(v_current_streak, 0) + 1;
    ELSE
      v_current_streak := 1;
    END IF;
  ELSE
    v_current_streak := 1;
  END IF;

  v_longest_streak := GREATEST(COALESCE(v_longest_streak, 0), v_current_streak);

  -- Atomic update
  UPDATE user_points
  SET current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_activity_date = v_today,
      updated_at = NOW()
  WHERE user_id = v_user_id;

  new_streak := v_current_streak;
  new_longest := v_longest_streak;
  RETURN NEXT;
END;
$$;

-- ============================================================
-- 3. Fix get_leaderboard: Remove user_id from output
-- ============================================================
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
  current_streak int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
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

-- ============================================================
-- 4. Re-grant permissions
-- ============================================================
GRANT EXECUTE ON FUNCTION add_user_points(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_points(INT) TO service_role;
GRANT EXECUTE ON FUNCTION update_user_streak() TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_streak() TO service_role;
-- get_leaderboard permissions remain as before (public/authenticated)

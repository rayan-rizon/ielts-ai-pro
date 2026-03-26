-- Atomic RPC functions for user points and streak updates
-- Prevents race conditions from client-side read-modify-write patterns

-- Atomically add points to a user's account
CREATE OR REPLACE FUNCTION add_user_points(
  p_user_id UUID,
  p_points INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_points
  SET points = points + p_points,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Atomically update a user's streak
-- Returns the updated record so the client can use the new values
CREATE OR REPLACE FUNCTION update_user_streak(
  p_user_id UUID
)
RETURNS TABLE (
  new_streak INT,
  new_longest INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INT;
  v_longest_streak INT;
  v_today DATE := CURRENT_DATE;
  v_diff INT;
BEGIN
  -- Lock the row to prevent concurrent updates
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM user_points
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no record found, do nothing (getOrCreate should have been called first)
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
      -- Consecutive day
      v_current_streak := COALESCE(v_current_streak, 0) + 1;
    ELSE
      -- Streak broken
      v_current_streak := 1;
    END IF;
  ELSE
    -- First activity ever
    v_current_streak := 1;
  END IF;

  v_longest_streak := GREATEST(COALESCE(v_longest_streak, 0), v_current_streak);

  -- Atomic update
  UPDATE user_points
  SET current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_activity_date = v_today,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  new_streak := v_current_streak;
  new_longest := v_longest_streak;
  RETURN NEXT;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_user_points(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_points(UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION update_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_streak(UUID) TO service_role;

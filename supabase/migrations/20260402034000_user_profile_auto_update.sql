-- ============================================================
-- Auto-Update User Profile After Test Completion
-- ============================================================
-- Creates a trigger that fires after a test_session is completed.
-- Updates the user's profile with:
--   - current_estimated_band (average of latest score per module)
--   - total_study_time (sum of all completed session durations)
--   - strengths (modules with avg >= 7.0)
--   - weaknesses (modules with avg < 6.0)
--   - current_streak / longest_streak (consecutive days with tests)
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."update_user_profile_after_test"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id         UUID;
  v_module_scores   RECORD;
  v_estimated_band  FLOAT;
  v_total_minutes   INT;
  v_strengths       TEXT[];
  v_weaknesses      TEXT[];
  v_module_count    INT := 0;
  v_score_sum       FLOAT := 0;
  v_streak          INT;
  v_longest_streak  INT;
  v_last_study      DATE;
  v_today           DATE := CURRENT_DATE;
BEGIN
  -- Only run when a test transitions to completed
  IF NOT (NEW.is_completed = true AND (OLD IS NULL OR OLD.is_completed = false)) THEN
    RETURN NEW;
  END IF;

  v_user_id := NEW.user_id;
  v_strengths := ARRAY[]::TEXT[];
  v_weaknesses := ARRAY[]::TEXT[];

  -- Calculate latest average score per module
  FOR v_module_scores IN
    SELECT test_type,
           AVG(score) as avg_score,
           MAX(score) as best_score
    FROM (
      SELECT test_type, score,
             ROW_NUMBER() OVER (PARTITION BY test_type ORDER BY completed_at DESC) as rn
      FROM test_sessions
      WHERE user_id = v_user_id AND is_completed = true AND score > 0
    ) recent
    WHERE rn <= 5  -- Use last 5 tests per module for average
    GROUP BY test_type
  LOOP
    v_module_count := v_module_count + 1;
    v_score_sum := v_score_sum + v_module_scores.avg_score;

    IF v_module_scores.avg_score >= 7.0 THEN
      v_strengths := array_append(v_strengths, v_module_scores.test_type);
    ELSIF v_module_scores.avg_score < 6.0 THEN
      v_weaknesses := array_append(v_weaknesses, v_module_scores.test_type);
    END IF;
  END LOOP;

  -- Calculate estimated band (average of module averages)
  IF v_module_count > 0 THEN
    v_estimated_band := ROUND((v_score_sum / v_module_count * 2)::NUMERIC) / 2.0;
  ELSE
    v_estimated_band := NULL;
  END IF;

  -- Calculate total study time in minutes
  SELECT COALESCE(SUM(
    CASE
      WHEN duration_minutes > 0 THEN duration_minutes
      WHEN completed_at IS NOT NULL AND created_at IS NOT NULL THEN
        LEAST(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60, 240)::INT
      ELSE 20  -- Default estimate
    END
  ), 0)
  INTO v_total_minutes
  FROM test_sessions
  WHERE user_id = v_user_id AND is_completed = true;

  -- Calculate streak
  SELECT current_streak, longest_streak, last_study_date
  INTO v_streak, v_longest_streak, v_last_study
  FROM users WHERE id = v_user_id;

  v_streak := COALESCE(v_streak, 0);
  v_longest_streak := COALESCE(v_longest_streak, 0);

  IF v_last_study IS NULL OR v_last_study < v_today - 1 THEN
    -- Streak broken or first time
    v_streak := 1;
  ELSIF v_last_study = v_today - 1 THEN
    -- Consecutive day
    v_streak := v_streak + 1;
  END IF;
  -- If v_last_study = v_today, streak stays the same (already counted today)

  IF v_streak > v_longest_streak THEN
    v_longest_streak := v_streak;
  END IF;

  -- Update user profile
  UPDATE users SET
    current_estimated_band = v_estimated_band,
    total_study_time = v_total_minutes,
    strengths = CASE WHEN array_length(v_strengths, 1) > 0 THEN v_strengths ELSE strengths END,
    weaknesses = CASE WHEN array_length(v_weaknesses, 1) > 0 THEN v_weaknesses ELSE weaknesses END,
    current_streak = v_streak,
    longest_streak = v_longest_streak,
    last_study_date = v_today,
    updated_at = NOW()
  WHERE id = v_user_id;

  RETURN NEW;
END;
$$;

-- Create trigger (drop if exists to be safe)
DROP TRIGGER IF EXISTS trigger_update_user_profile ON test_sessions;
CREATE TRIGGER trigger_update_user_profile
  AFTER INSERT OR UPDATE ON test_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_after_test();


-- ============================================================
-- Seed skill_proficiency from onboarding weak_area
-- ============================================================
-- When a user completes onboarding with a weak_area set,
-- seed initial low-mastery skill_proficiency records for ALL
-- modules so the learning path has data to work with.
-- The weak_area module gets especially low mastery.
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."seed_skills_from_onboarding"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_weak_area TEXT;
  v_module TEXT;
  v_skills TEXT[];
  v_skill TEXT;
  v_mastery FLOAT;
  v_existing INT;
BEGIN
  -- Only fire when onboarding_completed transitions to true
  IF NOT (
    NEW.onboarding_completed = true
    AND (OLD IS NULL OR OLD.onboarding_completed IS DISTINCT FROM true)
  ) THEN
    RETURN NEW;
  END IF;

  v_weak_area := COALESCE(NEW.weak_area, 'speaking');

  -- Check if user already has skill_proficiency records (re-onboarding safety)
  SELECT COUNT(*) INTO v_existing
  FROM skill_proficiency WHERE user_id = NEW.id;

  IF v_existing > 0 THEN
    RETURN NEW;  -- Don't overwrite existing proficiency data
  END IF;

  -- Seed skills for each module
  -- Reading skills
  FOREACH v_skill IN ARRAY ARRAY[
    'reading_true_false_not_given',
    'reading_matching_headings',
    'reading_sentence_completion',
    'reading_multiple_choice',
    'reading_summary_completion'
  ]
  LOOP
    v_mastery := CASE WHEN v_weak_area = 'reading' THEN 0.25 ELSE 0.45 END;
    INSERT INTO skill_proficiency
      (user_id, skill_code, module, mastery_probability, confidence_level,
       practice_count, correct_count, last_practiced_at, next_review_at)
    VALUES
      (NEW.id, v_skill, 'reading', v_mastery, 0.05,
       0, 0, NOW(), NOW() + INTERVAL '1 day')
    ON CONFLICT (user_id, skill_code) DO NOTHING;
  END LOOP;

  -- Listening skills
  FOREACH v_skill IN ARRAY ARRAY[
    'listening_gap_fill',
    'listening_multiple_choice',
    'listening_matching_features',
    'listening_table_completion',
    'listening_notes_completion'
  ]
  LOOP
    v_mastery := CASE WHEN v_weak_area = 'listening' THEN 0.25 ELSE 0.45 END;
    INSERT INTO skill_proficiency
      (user_id, skill_code, module, mastery_probability, confidence_level,
       practice_count, correct_count, last_practiced_at, next_review_at)
    VALUES
      (NEW.id, v_skill, 'listening', v_mastery, 0.05,
       0, 0, NOW(), NOW() + INTERVAL '1 day')
    ON CONFLICT (user_id, skill_code) DO NOTHING;
  END LOOP;

  -- Writing skills (criteria-based)
  FOREACH v_skill IN ARRAY ARRAY[
    'writing_taskAchievement',
    'writing_coherence',
    'writing_lexicalResource',
    'writing_grammar'
  ]
  LOOP
    v_mastery := CASE WHEN v_weak_area = 'writing' THEN 0.25 ELSE 0.45 END;
    INSERT INTO skill_proficiency
      (user_id, skill_code, module, mastery_probability, confidence_level,
       practice_count, correct_count, last_practiced_at, next_review_at)
    VALUES
      (NEW.id, v_skill, 'writing', v_mastery, 0.05,
       0, 0, NOW(), NOW() + INTERVAL '1 day')
    ON CONFLICT (user_id, skill_code) DO NOTHING;
  END LOOP;

  -- Speaking skills (criteria-based)
  FOREACH v_skill IN ARRAY ARRAY[
    'speaking_fluency',
    'speaking_lexicalResource',
    'speaking_grammar',
    'speaking_pronunciation'
  ]
  LOOP
    v_mastery := CASE WHEN v_weak_area = 'speaking' THEN 0.25 ELSE 0.45 END;
    INSERT INTO skill_proficiency
      (user_id, skill_code, module, mastery_probability, confidence_level,
       practice_count, correct_count, last_practiced_at, next_review_at)
    VALUES
      (NEW.id, v_skill, 'speaking', v_mastery, 0.05,
       0, 0, NOW(), NOW() + INTERVAL '1 day')
    ON CONFLICT (user_id, skill_code) DO NOTHING;
  END LOOP;

  -- Cross-module vocabulary and grammar seeds
  FOREACH v_skill IN ARRAY ARRAY[
    'vocabulary_writing',
    'vocabulary_speaking',
    'grammar_writing',
    'grammar_speaking'
  ]
  LOOP
    v_module := CASE
      WHEN v_skill LIKE 'vocabulary_%' THEN 'vocabulary'
      ELSE 'grammar'
    END;
    INSERT INTO skill_proficiency
      (user_id, skill_code, module, mastery_probability, confidence_level,
       practice_count, correct_count, last_practiced_at, next_review_at)
    VALUES
      (NEW.id, v_skill, v_module, 0.40, 0.05,
       0, 0, NOW(), NOW() + INTERVAL '1 day')
    ON CONFLICT (user_id, skill_code) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger on users table
DROP TRIGGER IF EXISTS trigger_seed_skills_onboarding ON users;
CREATE TRIGGER trigger_seed_skills_onboarding
  AFTER INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION seed_skills_from_onboarding();


-- ============================================================
-- Auto-Complete Learning Path Activities on Test Completion
-- ============================================================
-- When a test is completed, find a matching learning_path_activity
-- for the same module and today's day, and auto-complete it.
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."auto_complete_learning_activity"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_day_name    TEXT;
  v_activity_id UUID;
  v_score_normalized FLOAT;
BEGIN
  -- Only run when a test transitions to completed
  IF NOT (NEW.is_completed = true AND (OLD IS NULL OR OLD.is_completed = false)) THEN
    RETURN NEW;
  END IF;

  -- Get today's day name (Monday, Tuesday, etc.)
  v_day_name := INITCAP(TO_CHAR(CURRENT_DATE, 'FMDay'));

  -- Normalize score for outcome (0-1 range)
  v_score_normalized := CASE
    WHEN NEW.score > 0 AND NEW.score <= 9 THEN NEW.score / 9.0
    ELSE 0.5
  END;

  -- Find the first matching uncompleted activity for today
  SELECT id INTO v_activity_id
  FROM learning_path_activities
  WHERE user_id = NEW.user_id
    AND is_completed = false
    AND LOWER(module) = LOWER(NEW.test_type)
    AND LOWER(scheduled_day) = LOWER(v_day_name)
    AND learning_path_id = (
      SELECT id FROM learning_paths
      WHERE user_id = NEW.user_id
      ORDER BY created_at DESC
      LIMIT 1
    )
  ORDER BY priority = 'high' DESC, created_at ASC
  LIMIT 1;

  -- If found, mark it as completed
  IF v_activity_id IS NOT NULL THEN
    UPDATE learning_path_activities SET
      is_completed = true,
      completed_at = NOW(),
      outcome_score = v_score_normalized,
      outcome_data = jsonb_build_object(
        'auto_completed', true,
        'test_session_id', NEW.id,
        'test_score', NEW.score,
        'test_type', NEW.test_type
      ),
      updated_at = NOW()
    WHERE id = v_activity_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_complete_activity ON test_sessions;
CREATE TRIGGER trigger_auto_complete_activity
  AFTER INSERT OR UPDATE ON test_sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_learning_activity();

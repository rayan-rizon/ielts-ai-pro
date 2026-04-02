-- ============================================================
-- Cross-Module Skill Transfer
-- ============================================================
-- Extends update_skill_proficiency_from_test() so that:
--
--  1. Writing & Speaking tests now create proper skill_proficiency
--     records from content_data.criteriaScores (previously nothing
--     was written for these test types because they have no typeStats).
--
--  2. For the skills that overlap across all IELTS modules —
--     lexical resource (vocabulary) and grammar — a secondary
--     "cross-module" record is upserted under module='vocabulary'
--     or module='grammar'. These records are picked up by the
--     adaptive learning path scheduler alongside reading/listening
--     skills, so students get vocabulary/grammar drills based on
--     their actual writing & speaking performance.
--
-- Skill codes created by this migration:
--   writing_taskAchievement   (module = writing)
--   writing_coherence          (module = writing)
--   writing_lexicalResource    (module = writing)
--   writing_grammar            (module = writing)
--   speaking_fluency           (module = speaking)
--   speaking_lexicalResource   (module = speaking)
--   speaking_grammar           (module = speaking)
--   speaking_pronunciation     (module = speaking)
--   vocabulary_writing         (module = vocabulary)  ← cross-module
--   vocabulary_speaking        (module = vocabulary)  ← cross-module
--   grammar_writing            (module = grammar)     ← cross-module
--   grammar_speaking           (module = grammar)     ← cross-module
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."update_skill_proficiency_from_test"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  -- Shared
  v_skill_record    RECORD;
  v_skill_code      TEXT;
  v_accuracy        FLOAT;
  v_lr              FLOAT;
  v_old_mastery     FLOAT;
  v_old_conf        FLOAT;
  v_new_mastery     FLOAT;
  v_new_conf        FLOAT;
  v_interval_days   INT;

  -- Reading / Listening typeStats
  v_type_stats JSONB;
  v_total      INT;
  v_correct    INT;

  -- Writing / Speaking criteriaScores
  v_criteria_scores  JSONB;
  v_raw_score        FLOAT;
  v_cross_skill_code TEXT;
  v_cross_module     TEXT;
BEGIN
  -- Only run when a test transitions from incomplete → complete
  IF NOT (NEW.is_completed = true AND (OLD IS NULL OR OLD.is_completed = false)) THEN
    RETURN NEW;
  END IF;

  -- ──────────────────────────────────────────────────────────
  -- PART 1: Reading / Listening  →  process typeStats
  -- (unchanged logic from original trigger)
  -- ──────────────────────────────────────────────────────────
  v_type_stats := COALESCE(NEW.content_data -> 'typeStats', '{}'::JSONB);

  FOR v_skill_record IN SELECT * FROM jsonb_each(v_type_stats)
  LOOP
    v_skill_code := NEW.test_type || '_' || REPLACE(v_skill_record.key, ' ', '_');
    v_total      := COALESCE((v_skill_record.value ->> 'total')::INT, 0);
    v_correct    := COALESCE((v_skill_record.value ->> 'correct')::INT, 0);

    CONTINUE WHEN v_total <= 0;

    v_accuracy := LEAST(GREATEST(v_correct::FLOAT / v_total, 0), 1);
    v_lr       := LEAST(GREATEST(v_total::FLOAT / 40.0, 0.05), 0.35);

    SELECT mastery_probability, confidence_level
      INTO v_old_mastery, v_old_conf
      FROM skill_proficiency
     WHERE user_id = NEW.user_id AND skill_code = v_skill_code;

    IF FOUND THEN
      v_old_mastery   := COALESCE(v_old_mastery, 0.5);
      v_old_conf      := COALESCE(v_old_conf, 0.0);
      v_new_mastery   := LEAST(GREATEST((v_old_mastery * (1 - v_lr)) + (v_accuracy * v_lr), 0.01), 0.99);
      v_new_conf      := LEAST(v_old_conf + LEAST(0.05 + v_total::FLOAT / 200.0, 0.2), 1.0);
      v_interval_days := CASE WHEN v_accuracy < 0.5 THEN 1
                         ELSE 1 + FLOOR(v_new_mastery * 10)::INT + FLOOR(v_new_conf * 4)::INT END;

      UPDATE skill_proficiency SET
        mastery_probability = v_new_mastery,
        confidence_level    = v_new_conf,
        practice_count      = practice_count + v_total,
        correct_count       = correct_count + v_correct,
        last_practiced_at   = NOW(),
        next_review_at      = NOW() + (v_interval_days || ' days')::INTERVAL,
        streak_count        = CASE WHEN last_practiced_at >= NOW() - INTERVAL '2 days'
                                   THEN streak_count + 1 ELSE 1 END,
        updated_at          = NOW()
      WHERE user_id = NEW.user_id AND skill_code = v_skill_code;
    ELSE
      v_new_mastery   := LEAST(GREATEST((0.5 * (1 - v_lr)) + (v_accuracy * v_lr), 0.01), 0.99);
      v_new_conf      := LEAST(0.15 + v_total::FLOAT / 150.0, 1.0);
      v_interval_days := CASE WHEN v_accuracy < 0.5 THEN 1
                         ELSE 1 + FLOOR(v_new_mastery * 10)::INT + FLOOR(v_new_conf * 4)::INT END;

      INSERT INTO skill_proficiency
        (user_id, skill_code, module, mastery_probability, confidence_level,
         practice_count, correct_count, last_practiced_at, next_review_at)
      VALUES
        (NEW.user_id, v_skill_code, NEW.test_type, v_new_mastery, v_new_conf,
         v_total, v_correct, NOW(), NOW() + (v_interval_days || ' days')::INTERVAL);
    END IF;
  END LOOP;

  -- ──────────────────────────────────────────────────────────
  -- PART 2: Writing / Speaking  →  process criteriaScores
  -- ──────────────────────────────────────────────────────────
  IF NEW.test_type NOT IN ('writing', 'speaking') THEN
    RETURN NEW;
  END IF;

  v_criteria_scores := COALESCE(NEW.content_data -> 'criteriaScores', '{}'::JSONB);
  v_lr := 0.15; -- fixed learning rate for criteria-based skills

  FOR v_skill_record IN SELECT * FROM jsonb_each(v_criteria_scores)
  LOOP
    -- criteriaScores values are plain numbers (e.g. 6.5), not objects
    v_raw_score := COALESCE((v_skill_record.value #>> '{}')::FLOAT, 0);
    CONTINUE WHEN v_raw_score <= 0;

    -- Normalise IELTS 0-9 band score → 0-1 accuracy
    v_accuracy   := LEAST(GREATEST(v_raw_score / 9.0, 0), 1);

    -- ── 2a. Primary skill  (e.g. writing_lexicalResource) ──────────────
    v_skill_code := NEW.test_type || '_' || v_skill_record.key;

    SELECT mastery_probability, confidence_level
      INTO v_old_mastery, v_old_conf
      FROM skill_proficiency
     WHERE user_id = NEW.user_id AND skill_code = v_skill_code;

    IF FOUND THEN
      v_old_mastery   := COALESCE(v_old_mastery, 0.5);
      v_old_conf      := COALESCE(v_old_conf, 0.0);
      v_new_mastery   := LEAST(GREATEST((v_old_mastery * (1 - v_lr)) + (v_accuracy * v_lr), 0.01), 0.99);
      v_new_conf      := LEAST(v_old_conf + 0.08, 1.0);
      v_interval_days := CASE WHEN v_accuracy < 0.56 THEN 1
                         ELSE 2 + FLOOR(v_new_mastery * 8)::INT END;

      UPDATE skill_proficiency SET
        mastery_probability = v_new_mastery,
        confidence_level    = v_new_conf,
        practice_count      = practice_count + 1,
        correct_count       = correct_count + CASE WHEN v_accuracy >= 0.67 THEN 1 ELSE 0 END,
        last_practiced_at   = NOW(),
        next_review_at      = NOW() + (v_interval_days || ' days')::INTERVAL,
        streak_count        = CASE WHEN last_practiced_at >= NOW() - INTERVAL '2 days'
                                   THEN streak_count + 1 ELSE 1 END,
        updated_at          = NOW()
      WHERE user_id = NEW.user_id AND skill_code = v_skill_code;
    ELSE
      v_new_mastery   := LEAST(GREATEST((0.5 * (1 - v_lr)) + (v_accuracy * v_lr), 0.01), 0.99);
      v_interval_days := CASE WHEN v_accuracy < 0.56 THEN 1
                         ELSE 2 + FLOOR(v_new_mastery * 8)::INT END;

      INSERT INTO skill_proficiency
        (user_id, skill_code, module, mastery_probability, confidence_level,
         practice_count, correct_count, last_practiced_at, next_review_at)
      VALUES
        (NEW.user_id, v_skill_code, NEW.test_type, v_new_mastery, 0.18,
         1, CASE WHEN v_accuracy >= 0.67 THEN 1 ELSE 0 END,
         NOW(), NOW() + (v_interval_days || ' days')::INTERVAL);
    END IF;

    -- ── 2b. Cross-module transfer ───────────────────────────────────────
    -- lexicalResource and grammar are language-wide skills that overlap
    -- across all IELTS modules. A writing or speaking test score for
    -- these criteria is evidence about the same underlying skill, so we
    -- write a secondary record into the 'vocabulary' or 'grammar' module.
    -- A softer learning rate (0.10) keeps the influence gradual.
    IF v_skill_record.key = 'lexicalResource' THEN
      v_cross_skill_code := 'vocabulary_' || NEW.test_type;
      v_cross_module     := 'vocabulary';
    ELSIF v_skill_record.key = 'grammar' THEN
      v_cross_skill_code := 'grammar_' || NEW.test_type;
      v_cross_module     := 'grammar';
    ELSE
      CONTINUE; -- taskAchievement, coherence, fluency, pronunciation are module-specific
    END IF;

    SELECT mastery_probability, confidence_level
      INTO v_old_mastery, v_old_conf
      FROM skill_proficiency
     WHERE user_id = NEW.user_id AND skill_code = v_cross_skill_code;

    IF FOUND THEN
      v_old_mastery   := COALESCE(v_old_mastery, 0.5);
      v_new_mastery   := LEAST(GREATEST((v_old_mastery * 0.9) + (v_accuracy * 0.1), 0.01), 0.99);
      v_new_conf      := LEAST(COALESCE(v_old_conf, 0.0) + 0.05, 1.0);
      v_interval_days := CASE WHEN v_accuracy < 0.56 THEN 1
                         ELSE 2 + FLOOR(v_new_mastery * 7)::INT END;

      UPDATE skill_proficiency SET
        mastery_probability = v_new_mastery,
        confidence_level    = v_new_conf,
        practice_count      = practice_count + 1,
        correct_count       = correct_count + CASE WHEN v_accuracy >= 0.67 THEN 1 ELSE 0 END,
        last_practiced_at   = NOW(),
        next_review_at      = NOW() + (v_interval_days || ' days')::INTERVAL,
        updated_at          = NOW()
      WHERE user_id = NEW.user_id AND skill_code = v_cross_skill_code;
    ELSE
      v_new_mastery   := LEAST(GREATEST((0.5 * 0.9) + (v_accuracy * 0.1), 0.01), 0.99);
      v_interval_days := CASE WHEN v_accuracy < 0.56 THEN 1
                         ELSE 2 + FLOOR(v_new_mastery * 7)::INT END;

      INSERT INTO skill_proficiency
        (user_id, skill_code, module, mastery_probability, confidence_level,
         practice_count, correct_count, last_practiced_at, next_review_at)
      VALUES
        (NEW.user_id, v_cross_skill_code, v_cross_module, v_new_mastery, 0.12,
         1, CASE WHEN v_accuracy >= 0.67 THEN 1 ELSE 0 END,
         NOW(), NOW() + (v_interval_days || ' days')::INTERVAL);
    END IF;

  END LOOP;

  RETURN NEW;
END;
$$;

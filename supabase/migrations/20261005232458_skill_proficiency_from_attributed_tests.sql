-- ============================================================================
-- Skill evidence from tests: count only tests that were sat, and credit
-- listening matching-features answers.
--
-- update_skill_proficiency_from_test copies a finished test's typeStats into
-- skill_proficiency. Two inputs were wrong:
--
-- 1. Listening matching-features items are keyed by their own ids (mq_17, q1,
--    mq1770221890756 …) rather than the question id, so results graded before
--    commit 900b4efc stored matching_features.correct = 0 even when the
--    learner answered correctly. Every such learner ended up with
--    listening_matching_features at 0 correct and near-zero mastery, which the
--    learning path and analytics then ranked as a confirmed weakness.
--    objective_skill_type_stats() applies the same guarded repair as
--    repairUnattributedListeningItems() in
--    supabase/functions/_shared/objective-scoring/resultEvidence.js, so a
--    result graded by an older client bundle is still credited correctly.
--
-- 2. Tests opened and walked away from (is_abandoned_test_session) were
--    counted as zero-accuracy practice. Every analytics average already
--    excludes them; skill evidence now does too.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.objective_skill_type_stats(
    p_test_type TEXT,
    p_content_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO ''
AS $$
DECLARE
    v_stats JSONB := CASE
        WHEN jsonb_typeof(p_content_data -> 'typeStats') = 'object' THEN p_content_data -> 'typeStats'
        ELSE '{}'::JSONB
    END;
    v_matching JSONB := v_stats -> 'matching_features';
    v_map JSONB := COALESCE(p_content_data -> 'correctAnswersMap', p_content_data -> 'answersMap');
    v_details JSONB := CASE
        WHEN jsonb_typeof(p_content_data -> 'responseDetails') = 'array' THEN p_content_data -> 'responseDetails'
        ELSE '[]'::JSONB
    END;
    v_orphans INTEGER;
    v_orphans_without_number INTEGER;
    v_orphan_correct INTEGER;
    v_type_correct INTEGER;
    v_stored_correct NUMERIC;
    v_matching_correct INTEGER;
BEGIN
    IF LOWER(COALESCE(p_test_type, '')) <> 'listening'
       OR jsonb_typeof(v_matching) <> 'object'
       OR jsonb_typeof(v_map) <> 'object' THEN
        RETURN v_stats;
    END IF;

    -- Items not keyed by a question UUID (only matching features does that),
    -- and not already attributed by a per-question record.
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE COALESCE(item.value ->> 'questionNumber', '') !~ '^[1-9][0-9]*$'),
        COUNT(*) FILTER (WHERE item.value ->> 'isCorrect' = 'true')
    INTO v_orphans, v_orphans_without_number, v_orphan_correct
    FROM jsonb_each(v_map) AS item
    WHERE item.key !~* '^(map_)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(_|$)'
      AND NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(v_details) AS detail
          WHERE detail ->> 'questionId' = item.key
      );

    IF v_orphans = 0 OR v_orphans_without_number > 0 THEN
        RETURN v_stats;
    END IF;

    SELECT COALESCE(SUM(COALESCE(NULLIF(stat.value ->> 'correct', '')::NUMERIC, 0)), 0)::INTEGER
    INTO v_type_correct
    FROM jsonb_each(v_stats) AS stat;

    v_stored_correct := NULLIF(p_content_data ->> 'correctAnswers', '')::NUMERIC;
    v_matching_correct := COALESCE(NULLIF(v_matching ->> 'correct', '')::NUMERIC, 0)::INTEGER + v_orphan_correct;

    -- Repair only when the orphaned answers are exactly the missing marks.
    IF v_stored_correct IS NULL
       OR v_type_correct + v_orphan_correct <> v_stored_correct
       OR v_matching_correct > COALESCE(NULLIF(v_matching ->> 'total', '')::NUMERIC, 0) THEN
        RETURN v_stats;
    END IF;

    RETURN jsonb_set(v_stats, '{matching_features,correct}', to_jsonb(v_matching_correct));
EXCEPTION WHEN OTHERS THEN
    -- Malformed evidence must never block completing a test.
    RETURN v_stats;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_skill_proficiency_from_test()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_skill record;
  v_skill_code text;
  v_total integer;
  v_correct integer;
  v_accuracy double precision;
begin
  if not (
    new.is_completed is true
    and (tg_op = 'INSERT' or coalesce(old.is_completed, false) is false)
    and lower(new.test_type) in ('reading', 'listening')
  ) then
    return new;
  end if;

  -- A walk-away is not a measurement of any skill.
  if public.is_abandoned_test_session(
    new.test_type, new.score, new.actual_duration_seconds, new.content_data
  ) then
    return new;
  end if;

  for v_skill in
    select * from jsonb_each(public.objective_skill_type_stats(new.test_type, new.content_data))
  loop
    v_total := coalesce((v_skill.value ->> 'total')::integer, 0);
    v_correct := coalesce((v_skill.value ->> 'correct')::integer, 0);
    continue when v_total <= 0;
    v_accuracy := least(greatest(v_correct::double precision / v_total, 0), 1);
    v_skill_code := lower(new.test_type) || '_' || replace(lower(v_skill.key), ' ', '_');

    insert into public.skill_proficiency (
      user_id, skill_code, module, mastery_probability, confidence_level,
      practice_count, correct_count, last_practiced_at, next_review_at, updated_at
    )
    values (
      new.user_id, v_skill_code, lower(new.test_type),
      least(greatest((0.5 * 0.8) + (v_accuracy * 0.2), 0.01), 0.99),
      least(0.15 + v_total::double precision / 150.0, 1),
      v_total, v_correct, now(),
      now() + (case when v_accuracy < 0.5 then 1 else 5 end || ' days')::interval,
      now()
    )
    on conflict (user_id, skill_code) do update set
      mastery_probability = least(greatest(
        public.skill_proficiency.mastery_probability * 0.8 + v_accuracy * 0.2,
        0.01
      ), 0.99),
      confidence_level = least(coalesce(public.skill_proficiency.confidence_level, 0) + 0.1, 1),
      practice_count = coalesce(public.skill_proficiency.practice_count, 0) + v_total,
      correct_count = coalesce(public.skill_proficiency.correct_count, 0) + v_correct,
      last_practiced_at = now(),
      next_review_at = excluded.next_review_at,
      updated_at = now();
  end loop;
  return new;
end;
$function$;

REVOKE ALL ON FUNCTION public.objective_skill_type_stats(TEXT, JSONB) FROM PUBLIC, anon, authenticated;

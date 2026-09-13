-- Cambridge 21 Listening Test 4 stores nine question groups, but those groups
-- expand to 40 scoreable answers. The catalog card and paired-practice gate use
-- passages.total_questions, so restore that denormalized value from its source.
DO $repair_cambridge_21_test_4_question_total$
DECLARE
  scored_question_total integer;
  affected_rows integer;
BEGIN
  SELECT COALESCE(SUM(question_count), 0)::integer
    INTO scored_question_total
  FROM public.questions
  WHERE passage_id = '323f05a4-f218-4177-80af-1eb85e98365b'::uuid;

  IF scored_question_total <> 40 THEN
    RAISE EXCEPTION
      'Expected 40 scoreable questions for Cambridge 21 Listening Test 4, found %',
      scored_question_total;
  END IF;

  UPDATE public.passages
  SET total_questions = scored_question_total,
      duration_minutes = COALESCE(duration_minutes, 30),
      updated_at = now()
  WHERE id = '323f05a4-f218-4177-80af-1eb85e98365b'::uuid
    AND title = 'IELTS 21 Listening 2026 Test 4'
    AND test_type = 'listening'
    AND cambridge_year = 2026
    AND cambridge_test_number = 4;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows <> 1 THEN
    RAISE EXCEPTION 'Expected one Cambridge 21 Listening Test 4 passage, updated %', affected_rows;
  END IF;
END
$repair_cambridge_21_test_4_question_total$;

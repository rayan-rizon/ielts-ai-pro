-- The passage content stores question groups. A group can contain several
-- scoreable answers, so its array length is not the Reading/Listening total.
-- Question rows are authoritative once they exist; keep the content fallback
-- for an initial passage insert before its question rows have been saved.
CREATE OR REPLACE FUNCTION public.update_passage_questions_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  scored_total integer;
BEGIN
  IF TG_OP = 'INSERT' OR NEW.content::text IS DISTINCT FROM OLD.content::text THEN
    IF NEW.test_type IN ('reading', 'listening') THEN
      SELECT SUM(q.question_count)::integer
        INTO scored_total
      FROM public.questions AS q
      WHERE q.passage_id = NEW.id;
    END IF;

    IF scored_total IS NOT NULL THEN
      NEW.total_questions := scored_total;
    ELSE
      BEGIN
        NEW.total_questions := public.calculate_total_questions(NEW.content::jsonb);
      EXCEPTION WHEN OTHERS THEN
        NEW.total_questions := 0;
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Repair only active, complete papers with 40 scoreable answers spread over
-- all three Reading or four Listening sections. Incomplete tests stay as-is.
WITH complete_papers AS (
  SELECT p.id, SUM(q.question_count)::integer AS scored_total
  FROM public.passages AS p
  JOIN public.questions AS q ON q.passage_id = p.id
  WHERE p.is_active
    AND p.test_type IN ('reading', 'listening')
    AND jsonb_typeof(p.content::jsonb) = 'array'
    AND jsonb_array_length(p.content::jsonb) =
      CASE WHEN p.test_type = 'reading' THEN 3 ELSE 4 END
  GROUP BY p.id
  HAVING SUM(q.question_count) = 40
    AND COUNT(DISTINCT COALESCE(q.section, q.part_number, 1)) =
      CASE WHEN MAX(p.test_type) = 'reading' THEN 3 ELSE 4 END
)
UPDATE public.passages AS p
SET total_questions = complete_papers.scored_total,
    updated_at = now()
FROM complete_papers
WHERE p.id = complete_papers.id
  AND p.total_questions IS DISTINCT FROM complete_papers.scored_total;

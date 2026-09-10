-- The previous backfill counted JSON object keys, but legacy sessions can keep
-- an unused task key with a null value. Remove only the synthetic rows created
-- by that backfill, then reconstruct the gap from non-null saved band scores.
DELETE FROM public.ai_api_usage
WHERE endpoint = 'generateDetailedFeedback'
  AND request_metadata ->> 'source' = 'writing_cache_quota_backfill';

WITH saved_part_reviews AS (
  SELECT
    ts.user_id,
    sum(
      CASE WHEN jsonb_typeof(ts.content_data -> 'task1Band') = 'number' THEN 1 ELSE 0 END +
      CASE WHEN jsonb_typeof(ts.content_data -> 'task2Band') = 'number' THEN 1 ELSE 0 END
    )::integer AS part_count
  FROM public.test_sessions ts
  WHERE ts.test_type = 'writing'
    AND ts.evaluation_status = 'complete'
    AND ts.updated_at >= date_trunc('month', current_date)
  GROUP BY ts.user_id
), recorded_part_reviews AS (
  SELECT user_id, count(*)::integer AS part_count
  FROM public.ai_api_usage
  WHERE endpoint = 'generateDetailedFeedback'
    AND created_at >= date_trunc('month', current_date)
    AND COALESCE(request_metadata ->> 'reservationStatus', 'completed') <> 'failed'
  GROUP BY user_id
), missing_part_reviews AS (
  SELECT
    saved.user_id,
    greatest(saved.part_count - COALESCE(recorded.part_count, 0), 0) AS part_count
  FROM saved_part_reviews saved
  LEFT JOIN recorded_part_reviews recorded USING (user_id)
)
INSERT INTO public.ai_api_usage (
  user_id,
  endpoint,
  tokens_used,
  cached,
  request_metadata,
  created_at
)
SELECT
  missing.user_id,
  'generateDetailedFeedback',
  0,
  true,
  jsonb_build_object(
    'reservationStatus', 'completed',
    'source', 'writing_cache_quota_backfill_v2'
  ),
  timezone('utc', now())
FROM missing_part_reviews missing
CROSS JOIN LATERAL generate_series(1, missing.part_count) AS part_review(sequence_number)
WHERE missing.part_count > 0;

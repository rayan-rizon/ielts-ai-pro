-- Build daily aggregates before serialising them to JSON.
-- PostgreSQL does not permit aggregate calls inside another aggregate call.

CREATE OR REPLACE FUNCTION public.get_daily_api_usage_stats(
  p_start_date timestamp with time zone DEFAULT (now() - interval '30 days')
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_start_date date := COALESCE((p_start_date AT TIME ZONE 'UTC')::date, (now() AT TIME ZONE 'UTC')::date - 30);
  v_daily_data json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  WITH days AS (
    SELECT generate_series(v_start_date, (now() AT TIME ZONE 'UTC')::date, interval '1 day')::date AS usage_date
  ),
  usage_rows AS (
    SELECT
      (a.created_at AT TIME ZONE 'UTC')::date AS usage_date,
      a.cached,
      a.tokens_used,
      CASE
        WHEN a.request_metadata ->> 'reservationStatus' = 'reserved' THEN 'pending'
        WHEN a.request_metadata ->> 'reservationStatus' = 'failed' THEN 'failed'
        ELSE 'completed'
      END AS usage_status
    FROM public.ai_api_usage a
    WHERE a.created_at >= v_start_date::timestamp AT TIME ZONE 'UTC'
  ),
  daily_aggs AS (
    SELECT
      d.usage_date,
      count(ur.usage_date) AS total,
      count(ur.usage_date) FILTER (WHERE ur.usage_status = 'completed') AS completed,
      count(ur.usage_date) FILTER (WHERE ur.usage_status = 'pending') AS pending,
      count(ur.usage_date) FILTER (WHERE ur.usage_status = 'failed') AS failed,
      count(ur.usage_date) FILTER (WHERE ur.usage_status = 'completed' AND ur.cached IS TRUE) AS cached,
      COALESCE(sum(ur.tokens_used) FILTER (WHERE ur.usage_status = 'completed'), 0) AS tokens
    FROM days d
    LEFT JOIN usage_rows ur ON ur.usage_date = d.usage_date
    GROUP BY d.usage_date
  )
  SELECT COALESCE(json_agg(json_build_object(
    'date', to_char(usage_date, 'YYYY-MM-DD'),
    'total', total,
    'completed', completed,
    'pending', pending,
    'failed', failed,
    'cached', cached,
    'tokens', tokens
  ) ORDER BY usage_date), '[]'::json)
  INTO v_daily_data
  FROM daily_aggs;

  RETURN v_daily_data;
END;
$$;

ALTER FUNCTION public.get_daily_api_usage_stats(timestamp with time zone) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_daily_api_usage_stats(timestamp with time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_api_usage_stats(timestamp with time zone) TO authenticated, service_role;

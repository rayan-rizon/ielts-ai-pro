-- Make the Reading assistant's daily provider budget visible to admins.
--
-- When the budget is spent, learners stop getting new explanations. Until now
-- that only produced a server log line, so nobody found out. The reading_assistant
-- health card now carries the day's spend against the budget and escalates:
-- 80% of budget -> "Needs action", budget spent -> "Down". Both show on the admin
-- Overview status strip, which is the first screen an admin sees.
ALTER FUNCTION public.get_platform_health(integer)
  RENAME TO get_platform_health_core_v12;
REVOKE ALL ON FUNCTION public.get_platform_health_core_v12(integer)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_platform_health(p_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_base jsonb;
  v_hours integer;
  v_day_start timestamptz;
  v_budget numeric;
  v_free_daily integer;
  v_spend numeric;
  v_used_pct numeric;
  v_exhausted_at timestamptz;
  v_warned_at timestamptz;
  v_blocked_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  v_hours := LEAST(GREATEST(COALESCE(p_hours, 24), 1), 24 * 90);
  v_base := public.get_platform_health_core_v12(v_hours);

  v_day_start := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  SELECT daily_budget, free_daily_assists
  INTO v_budget, v_free_daily
  FROM reading_assistant_private.settings WHERE id;

  SELECT COALESCE(sum(
    CASE WHEN state = 'pending' THEN reserved_cost ELSE COALESCE(actual_cost, reserved_cost) END
  ), 0)
  INTO v_spend
  FROM reading_assistant_private.operations
  WHERE created_at >= v_day_start AND state IN ('pending', 'complete');

  SELECT
    max(created_at) FILTER (WHERE level = 'exhausted'),
    max(created_at) FILTER (WHERE level = 'warning')
  INTO v_exhausted_at, v_warned_at
  FROM reading_assistant_private.budget_events
  WHERE day = v_day_start::date;

  v_used_pct := CASE WHEN COALESCE(v_budget, 0) > 0
    THEN round(100.0 * v_spend / v_budget, 1) ELSE NULL END;

  -- Budget exhausted means learners get nothing new today: that is an outage of
  -- the feature, not a warning. Never soften a status the core already set.
  v_blocked_status := CASE
    WHEN v_exhausted_at IS NOT NULL THEN 'down'
    WHEN v_warned_at IS NOT NULL THEN 'attention'
    ELSE NULL
  END;

  v_base := jsonb_set(
    v_base,
    '{services}',
    COALESCE((
      SELECT jsonb_agg(
        CASE WHEN service->>'key' = 'reading_assistant' THEN
          service || jsonb_build_object(
            'status', CASE
              WHEN v_blocked_status = 'down' THEN 'down'
              WHEN service->>'status' IN ('down', 'unconfigured', 'degraded') THEN service->>'status'
              WHEN v_blocked_status IS NOT NULL THEN v_blocked_status
              ELSE service->>'status'
            END,
            'metrics', COALESCE(service->'metrics', '{}'::jsonb) || jsonb_build_object(
              'dailyBudgetUsd', v_budget,
              'budgetSpentTodayUsd', round(v_spend, 4),
              'budgetUsedPct', v_used_pct,
              'budgetExhaustedAt', v_exhausted_at,
              'budgetWarningAt', v_warned_at,
              'freeDailyAssistsPerAction', v_free_daily
            ),
            'impact', CASE
              WHEN v_exhausted_at IS NOT NULL THEN
                'Daily Reading AI budget of $' || trim(to_char(v_budget, 'FM999990.00')) ||
                ' was spent at ' || to_char(v_exhausted_at AT TIME ZONE 'UTC', 'HH24:MI') ||
                ' UTC. Learners get no new Simplify, Translate, or Breakdown results until 00:00 UTC. Raise the budget in reading_assistant_private.settings if this is premature.'
              WHEN v_warned_at IS NOT NULL THEN
                'Reading AI spend is at ' || COALESCE(v_used_pct, 0) || '% of the $' ||
                trim(to_char(v_budget, 'FM999990.00')) ||
                ' daily budget. New explanations stop when it is fully spent.'
              ELSE COALESCE(service->>'impact', 'Reading assistance requests completed normally.')
            END
          )
        ELSE service END
      )
      FROM jsonb_array_elements(COALESCE(v_base->'services', '[]'::jsonb)) service
    ), '[]'::jsonb),
    true
  );
  v_base := jsonb_set(v_base, '{contractVersion}', '12'::jsonb, true);
  RETURN v_base;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health(integer) TO authenticated;

COMMENT ON FUNCTION public.get_platform_health(integer) IS
'Admin-only operational health from persisted telemetry. The Reading Assistant card reports the day''s AI spend against the daily budget and reads Down once that budget is spent.';

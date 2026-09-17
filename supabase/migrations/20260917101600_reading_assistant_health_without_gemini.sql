-- Reading assistance no longer falls back to Gemini, and the daily spend it
-- reports has to match the gate in reading_assistant_reserve now that billed-
-- but-rejected attempts are charged.
--
-- Both layers of the health chain are patched in place rather than wrapped
-- again: core_v12 owns the Reading provider label and per-model counts, and
-- get_platform_health owns the budget figures. Wrapping would have re-stated
-- the budget logic in a third place.

-- 1. Provider chain: GPT OSS -> Luna -> DeepSeek -> GLM, no Gemini leg, plus
--    what was paid for answers that never reached a learner.
CREATE OR REPLACE FUNCTION public.get_platform_health_core_v12(p_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_base jsonb;
  v_hours integer;
  v_since timestamptz;
  v_deepseek bigint;
  v_luna bigint;
  v_gpt_oss bigint;
  v_glm bigint;
  v_fallbacks bigint;
  v_wasted numeric;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  v_hours := LEAST(GREATEST(COALESCE(p_hours, 24), 1), 24 * 90);
  v_since := now() - make_interval(hours => v_hours);
  v_base := public.get_platform_health_core_v11(v_hours);

  SELECT
    count(*) FILTER (WHERE request_metadata->>'model' = 'deepseek/deepseek-v4-flash-0731'),
    count(*) FILTER (WHERE request_metadata->>'model' = 'openai/gpt-5.6-luna'),
    count(*) FILTER (WHERE request_metadata->>'model' = 'openai/gpt-oss-120b'),
    count(*) FILTER (WHERE request_metadata->>'model' = 'z-ai/glm-5.3-flash'),
    count(*) FILTER (WHERE request_metadata->>'fallbackUsed' = 'true'),
    COALESCE(sum(
      CASE
        WHEN request_metadata->>'wastedProviderCostUsd'
             ~ '^[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?$'
          THEN (request_metadata->>'wastedProviderCostUsd')::numeric
        ELSE 0
      END
    ), 0)
  INTO v_deepseek, v_luna, v_gpt_oss, v_glm, v_fallbacks, v_wasted
  FROM public.ai_api_usage
  WHERE endpoint = 'reading-assistant' AND created_at >= v_since;

  v_base := jsonb_set(
    v_base,
    '{services}',
    COALESCE((
      SELECT jsonb_agg(
        CASE WHEN service->>'key' = 'reading_assistant' THEN
          service || jsonb_build_object(
            'provider', 'GPT OSS 120B -> GPT-5.6 Luna -> DeepSeek V4 Flash -> GLM 5.3 Flash',
            -- geminiCalls came from the older telemetry layer and is now always
            -- zero for this service, so it is dropped rather than shown as 0.
            'metrics', (COALESCE(service->'metrics', '{}'::jsonb) - 'geminiCalls')
              || jsonb_build_object(
                'deepseekCalls', v_deepseek,
                'lunaCalls', v_luna,
                'gptOssCalls', v_gpt_oss,
                'glmCalls', v_glm,
                'wastedCostUsd', CASE WHEN v_wasted > 0 THEN round(v_wasted, 6) END
              ),
            'impact', CASE
              WHEN v_fallbacks > 0 THEN v_fallbacks || ' request(s) used a Reading provider fallback after the primary model did not return a usable result.'
              ELSE COALESCE(service->>'impact', 'Reading assistance requests completed normally.')
            END
          )
        ELSE service END
      )
      FROM jsonb_array_elements(COALESCE(v_base->'services', '[]'::jsonb)) service
    ), '[]'::jsonb),
    true
  );
  v_base := jsonb_set(v_base, '{contractVersion}', '11'::jsonb, true);
  RETURN v_base;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health_core_v12(integer)
  FROM PUBLIC, anon, authenticated;

-- 2. Budget figures. The spend shown to the admin must be the same number the
--    reserve gate compares against, so it counts failed rows at their recorded
--    cost too.
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

  -- Mirrors reading_assistant_reserve: a failed attempt is charged only what it
  -- actually cost, never the pending reservation estimate.
  SELECT COALESCE(sum(
    CASE
      WHEN state = 'pending' THEN reserved_cost
      WHEN state = 'failed' THEN COALESCE(actual_cost, 0)
      ELSE COALESCE(actual_cost, reserved_cost)
    END
  ), 0)
  INTO v_spend
  FROM reading_assistant_private.operations
  WHERE created_at >= v_day_start AND state IN ('pending', 'complete', 'failed');

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
'Admin-only operational health from persisted telemetry. The Reading Assistant card reports the day''s AI spend -- including billed-but-rejected provider attempts -- against the daily budget and reads Down once that budget is spent.';

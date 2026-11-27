-- Writing report help (translations, Band 7/8 versions) is priced in its cache,
-- not in ai_api_usage, because rows there count against learner quotas.
-- Admin-only and read-only; the existing overview function is not changed.
create or replace function public.get_report_assist_cost(p_days integer default 7)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_days integer;
  v_since timestamptz;
  v_prev timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  -- The same Dhaka-day window as get_admin_overview.
  v_days := least(greatest(coalesce(p_days, 7), 1), 90);
  v_since := (date_trunc('day', now() at time zone 'Asia/Dhaka')
      - make_interval(days => v_days - 1)) at time zone 'Asia/Dhaka';
  v_prev := v_since - make_interval(days => v_days);

  return (
    select jsonb_build_object(
      'usd', round(coalesce(sum(priced.cost) filter (where priced.created_at >= v_since), 0), 6),
      'prevUsd', round(coalesce(sum(priced.cost) filter (where priced.created_at < v_since), 0), 6),
      'calls', count(*) filter (where priced.created_at >= v_since))
    from (
      select c.created_at,
        case when jsonb_typeof(c.feedback_json->'meta'->'costUsd') = 'number'
          then (c.feedback_json->'meta'->>'costUsd')::numeric
          else 0
        end as cost
      from public.ai_feedback_cache as c
      where c.input_hash like 'wra:%' and c.created_at >= v_prev
    ) as priced
  );
end;
$function$;

revoke all on function public.get_report_assist_cost(integer) from public, anon;
grant execute on function public.get_report_assist_cost(integer) to authenticated, service_role;

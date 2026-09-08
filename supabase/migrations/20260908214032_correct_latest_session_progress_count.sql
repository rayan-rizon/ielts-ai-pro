set lock_timeout = '2s';
set statement_timeout = '30s';

create or replace function public.get_user_latest_sessions(
  p_user_id uuid,
  p_test_type text,
  p_passage_id uuid default null
)
returns table (
  session_id uuid,
  passage_id uuid,
  is_completed boolean,
  score numeric,
  progress_percentage numeric,
  created_at timestamptz,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path to ''
as $$
begin
  if not public.can_access_user_id(p_user_id) then
    raise exception 'Access denied' using errcode = '42501';
  end if;

  return query
  select distinct on (ts.passage_id)
    ts.id,
    ts.passage_id,
    ts.is_completed,
    ts.score,
    case
      when ts.is_completed then 100::numeric
      when jsonb_typeof(ts.user_responses) = 'object' then
        round(
          (
            select count(*)::numeric
            from jsonb_object_keys(ts.user_responses)
          ) * 100.0 /
          greatest(
            case
              when coalesce(ts.content_data ->> 'total_questions', '') ~ '^[0-9]+$'
                then (ts.content_data ->> 'total_questions')::numeric
              else 40::numeric
            end,
            1::numeric
          ),
          0
        )
      else 0::numeric
    end,
    ts.created_at,
    ts.completed_at
  from public.test_sessions ts
  where ts.user_id = p_user_id
    and ts.test_type = p_test_type
    and (p_passage_id is null or ts.passage_id = p_passage_id)
  order by ts.passage_id, ts.created_at desc;
end;
$$;

revoke all on function public.get_user_latest_sessions(uuid, text, uuid)
from public, anon;
grant execute on function public.get_user_latest_sessions(uuid, text, uuid)
to authenticated, service_role;

reset lock_timeout;
reset statement_timeout;

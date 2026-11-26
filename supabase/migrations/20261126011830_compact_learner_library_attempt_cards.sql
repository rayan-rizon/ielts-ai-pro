-- Reuse the existing web RPC and index. All four native library modules need
-- one card per passage, while full answers and feedback stay in the attempt.
create or replace function public.get_learner_latest_sessions(
  p_user_id uuid, p_test_type text, p_passage_ids uuid[]
) returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
  if not public.can_access_user_id(p_user_id) then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  if p_test_type is null or p_test_type not in ('reading', 'listening', 'writing', 'speaking')
    or cardinality(p_passage_ids) > 100 then
    raise exception 'Invalid session list parameters' using errcode = '22023';
  end if;

  return coalesce((
    select jsonb_agg(to_jsonb(card) order by card.passage_id)
    from (
      select ts.id, ts.user_id, ts.test_type, ts.passage_id, ts.is_completed, ts.score, ts.band_score,
        coalesce(ts.paired_room_id::text, ts.content_data->>'paired_room_id') as paired_room_id,
        ts.created_at, ts.completed_at,
        case jsonb_typeof(ts.user_responses)
          when 'object' then (select count(*)::integer from jsonb_object_keys(ts.user_responses))
          when 'array' then jsonb_array_length(ts.user_responses)
          else 0 end as completed_questions,
        case when not ts.is_completed then (
          select count(*)::integer
          from (
            select value from jsonb_each(case jsonb_typeof(ts.user_responses)
              when 'object' then ts.user_responses else '{}'::jsonb end)
            union all
            select value from jsonb_array_elements(case jsonb_typeof(ts.user_responses)
              when 'array' then ts.user_responses else '[]'::jsonb end)
          ) answers
          where value not in ('null'::jsonb, '""'::jsonb, '[]'::jsonb)
        ) end as answered_questions,
        jsonb_build_object(
          'passage_id', ts.passage_id, 'total_questions', ts.content_data->'total_questions'
        ) as content_data
      from (select distinct unnest(p_passage_ids) as id) paper
      cross join lateral (
        select attempt.*
        from public.test_sessions attempt
        where attempt.user_id = p_user_id and attempt.test_type = p_test_type
          and attempt.passage_id = paper.id
        order by attempt.created_at desc nulls last, attempt.id desc
        limit 1
      ) ts
    ) card
  ), '[]'::jsonb);
end $$;

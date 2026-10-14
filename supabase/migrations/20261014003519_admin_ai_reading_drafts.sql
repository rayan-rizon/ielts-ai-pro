-- Additive only: no policy/trigger changes, backfill, existing test updates or
-- publication. One transaction creates a new inactive Reading test and its rows.
create function public.admin_create_ai_reading_draft(p_request_id uuid, p_draft jsonb)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_section jsonb;
  v_group jsonb;
  v_question jsonb;
  v_sections jsonb := '[]';
  v_groups jsonb;
  v_questions jsonb;
  v_section_index integer := 0;
  v_row_count integer := 0;
  v_question_id uuid;
  v_inserted_id uuid;
  v_existing public.passages%rowtype;
  v_title text := pg_catalog.btrim(p_draft->>'title');
  v_format text := p_draft->>'test_format';
  v_tier text := p_draft->>'access_tier';
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_request_id is null or pg_catalog.jsonb_typeof(p_draft) is distinct from 'object'
      or v_title is null or pg_catalog.length(v_title) not between 1 and 200
      or v_format is null or v_format not in ('Academic', 'General')
      or v_tier is null or v_tier not in ('free', 'pro')
      or pg_catalog.jsonb_typeof(p_draft->'sections') is distinct from 'array' then
    raise exception 'Invalid Reading draft' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_array_length(p_draft->'sections') not between 1 and 3
      or pg_catalog.pg_column_size(p_draft) > 524288 then
    raise exception 'Invalid draft size' using errcode = '22023';
  end if;

  for v_section in select value from pg_catalog.jsonb_array_elements(p_draft->'sections') loop
    v_section_index := v_section_index + 1;
    if coalesce(pg_catalog.length(v_section->>'content'), 0) = 0
        or pg_catalog.jsonb_typeof(v_section->'question_groups') is distinct from 'array' then
      raise exception 'Passage content and question groups are required' using errcode = '22023';
    end if;
    v_groups := '[]';
    for v_group in select value from pg_catalog.jsonb_array_elements(v_section->'question_groups') loop
      if pg_catalog.jsonb_typeof(v_group->'questions') is distinct from 'array'
          or pg_catalog.jsonb_array_length(v_group->'questions') = 0 then
        raise exception 'Questions are required' using errcode = '22023';
      end if;
      v_questions := '[]';
      for v_question in select value from pg_catalog.jsonb_array_elements(v_group->'questions') loop
        v_row_count := v_row_count + 1;
        if v_row_count > 40 or coalesce((v_question->>'question_number')::integer, 0) not between 1 and 40
            or coalesce(v_question->>'type', '') not in (
              'multiple_choice', 'true_false_not_given', 'yes_no_not_given',
              'short_answer', 'sentence_completion', 'summary_completion',
              'notes_completion', 'matching_features', 'table_completion', 'flowchart')
            or pg_catalog.jsonb_typeof(v_question->'explanation_data') is distinct from 'object' then
          raise exception 'Invalid question or missing explanation' using errcode = '22023';
        end if;
        -- IDs are deterministic for retry safety and never taken from model data.
        v_question_id := pg_catalog.md5(p_request_id::text || ':' || v_row_count::text)::uuid;
        v_question := v_question || pg_catalog.jsonb_build_object(
          'id', v_question_id, 'passage_id', p_request_id, 'section', v_section_index);
        v_questions := v_questions || pg_catalog.jsonb_build_array(v_question);
      end loop;
      v_groups := v_groups || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
        'id', v_group->>'id', 'instructions', v_group->>'instructions',
        'isCollapsed', false, 'questions', v_questions));
    end loop;
    v_sections := v_sections || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
      'section_number', v_section_index, 'title', v_section->>'title',
      'passage_name', v_section->>'title', 'content', v_section->>'content',
      'question_groups', v_groups));
  end loop;
  if v_row_count = 0 then raise exception 'Questions are required' using errcode = '22023'; end if;

  insert into public.passages (id, title, content, test_type, test_format, topic,
    access_tier, is_official_cambridge, is_active)
  values (p_request_id, v_title, v_sections::text, 'reading', v_format, 'AI import', v_tier, false, false)
  on conflict (id) do nothing returning id into v_inserted_id;

  if v_inserted_id is null then
    select * into v_existing from public.passages where id = p_request_id;
    if not found or v_existing.is_active or v_existing.test_type <> 'reading'
        or v_existing.topic <> 'AI import' or v_existing.is_official_cambridge
        or v_existing.title <> v_title or v_existing.test_format <> v_format
        or v_existing.access_tier <> v_tier or v_existing.content::jsonb is distinct from v_sections then
      raise exception 'This request cannot replace an existing test. Start a new draft.' using errcode = '22023';
    end if;
    return p_request_id; -- Same successful request retried; no writes to its rows.
  end if;

  insert into public.questions (id, passage_id, question_text, type, options,
    correct_answer, group_instructions, section, question_number, allow_multiple,
    question_count, table_data, matching_features, gap_fill, flowchart, explanation_data)
  select (q->>'id')::uuid, p_request_id, coalesce(q->>'question_text', ''), q->>'type', q->'options',
    q->>'correct_answer', g->>'instructions', (s->>'section_number')::integer,
    (q->>'question_number')::integer, coalesce((q->>'allow_multiple')::boolean, false),
    coalesce((q->>'question_count')::integer, 1), q->'table_data', q->'matching_features',
    q->'gap_fill', q->'flowchart', q->'explanation_data'
  from pg_catalog.jsonb_array_elements(v_sections) s,
    lateral pg_catalog.jsonb_array_elements(s->'question_groups') g,
    lateral pg_catalog.jsonb_array_elements(g->'questions') q;
  return p_request_id;
end;
$$;

revoke all on function public.admin_create_ai_reading_draft(uuid, jsonb) from public, anon;
grant execute on function public.admin_create_ai_reading_draft(uuid, jsonb) to authenticated;

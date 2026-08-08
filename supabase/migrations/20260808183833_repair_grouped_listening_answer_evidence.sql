-- Restore the four grouped evidence phrases that are visible in the official
-- Cambridge 21 Test 1 Part 3 transcript image. The previous OCR pass attached
-- the whole block to question 25 and dropped the 21-24 markers.
do $migration$
declare
  affected_rows integer;
begin
  update public.passages
  set content = jsonb_set(
    content::jsonb,
    '{2,transcript_highlights}',
    jsonb_build_array(
      jsonb_build_object(
        'question_number', 21,
        'question_numbers', jsonb_build_array(21, 22),
        'phrase', 'But I especially liked the way her lecture focused on more long-term issues.'
      ),
      jsonb_build_object(
        'question_number', 21,
        'question_numbers', jsonb_build_array(21, 22),
        'phrase', 'The examples she gave were at a more global level, and they really made it clear to me just how wide-ranging the threats to ocean biodiversity are.'
      ),
      jsonb_build_object(
        'question_number', 23,
        'question_numbers', jsonb_build_array(23, 24),
        'phrase', 'I''d have thought it was quite unusual to have so many experts working together.'
      ),
      jsonb_build_object(
        'question_number', 23,
        'question_numbers', jsonb_build_array(23, 24),
        'phrase', 'And her description of how robotics can be used to investigate threats to biodiversity.'
      )
    ) || coalesce(
      (
        select jsonb_agg(item order by item_order)
        from jsonb_array_elements(coalesce(content::jsonb -> 2 -> 'transcript_highlights', '[]'::jsonb))
          with ordinality as items(item, item_order)
        where item ->> 'phrase' not in (
          'But I especially liked the way her lecture focused on more long-term issues.',
          'The examples she gave were at a more global level, and they really made it clear to me just how wide-ranging the threats to ocean biodiversity are.',
          'I''d have thought it was quite unusual to have so many experts working together.',
          'And her description of how robotics can be used to investigate threats to biodiversity.'
        )
      ),
      '[]'::jsonb
    ),
    true
  )::text,
  updated_at = now()
  where id = '39a67669-db5c-43f3-9d40-846ab35cb7d2'::uuid
    and test_type = 'listening'
    and cambridge_year = 2026
    and cambridge_test_number = 1
    and jsonb_typeof(content::jsonb) = 'array'
    and jsonb_array_length(content::jsonb) = 4;

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Expected one Cambridge 21 Test 1 Listening passage, updated %', affected_rows;
  end if;
end
$migration$;

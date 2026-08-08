-- Keep the listening JSON contract safe when content is imported again.
-- The source-image phrases and audio-aligned SRT repairs are produced by the
-- audited scripts in scripts/; this migration supplies the idempotent shape and
-- removes the two placeholder forms that previously leaked into the learner UI.
do $$
declare
  passage_row record;
  sections jsonb;
  section_index integer;
  section_value jsonb;
begin
  for passage_row in
    select id, content
    from public.passages
    where test_type = 'listening'
  loop
    sections := passage_row.content::jsonb;
    if jsonb_typeof(sections) <> 'array' then
      continue;
    end if;

    for section_index in 0..jsonb_array_length(sections) - 1 loop
      section_value := sections -> section_index;
      section_value := jsonb_set(
        section_value,
        '{title}',
        to_jsonb(coalesce(nullif(btrim(section_value ->> 'title'), ''), 'Part ' || (section_index + 1))),
        true
      );
      section_value := jsonb_set(
        section_value,
        '{transcript_highlights}',
        case
          when jsonb_typeof(section_value -> 'transcript_highlights') = 'array'
            then section_value -> 'transcript_highlights'
          else '[]'::jsonb
        end,
        true
      );
      section_value := jsonb_set(
        section_value,
        '{srt_content}',
        to_jsonb(regexp_replace(coalesce(section_value ->> 'srt_content', ''),
          '(?im)^\s*(\[silence\]|\(silence\))\s*$', '', 'g')),
        true
      );
      section_value := jsonb_set(
        section_value,
        '{transcript}',
        to_jsonb(regexp_replace(coalesce(section_value ->> 'transcript', ''),
          '(?im)^\s*(\[silence\]|\(silence\))\s*$', '', 'g')),
        true
      );
      sections := jsonb_set(sections, array[section_index::text], section_value, false);
    end loop;

    update public.passages
    set content = sections::text
    where id = passage_row.id
      and content is distinct from sections::text;
  end loop;
end
$$;

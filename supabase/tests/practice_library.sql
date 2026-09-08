-- Run against a disposable migrated database. Everything rolls back.
begin;
do $$
begin
 if has_function_privilege('authenticated','public.practice_library_state(uuid,text,uuid,jsonb)','execute') then
  raise exception 'Browser can access private snapshots'; end if;
 if has_function_privilege('anon','public.practice_library_catalogue(uuid)','execute') then
  raise exception 'Anonymous catalogue access'; end if;
 if has_function_privilege('authenticated','public.practice_library_index(jsonb)','execute') then
  raise exception 'Browser can mutate the index'; end if;
 if has_function_privilege('authenticated','public.practice_library_ai_reserve(uuid,uuid,uuid,text)','execute') then
  raise exception 'Browser can reserve AI operations directly'; end if;
 if has_table_privilege('authenticated','public.practice_library_exposure','INSERT') then
  raise exception 'Browser can forge exposure'; end if;
 if has_function_privilege('authenticated','public.skill_lab_legacy_action(text,uuid,jsonb)','execute') then
  raise exception 'Browser can bypass the legacy-start gate'; end if;
end $$;
rollback;

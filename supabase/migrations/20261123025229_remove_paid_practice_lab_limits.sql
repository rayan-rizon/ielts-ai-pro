-- Keep numeric dashboard fields for older clients that use remaining to enable Start.
-- The unlimited flag is authoritative for new clients. Only Free starts are capped.
set local lock_timeout = '3s';

do $$
declare
  signature regprocedure;
  definition text;
  updated text;
  patch record;
begin
  foreach signature in array array[
    'public.practice_library_state(uuid,text,uuid,jsonb)'::regprocedure,
    'public.skill_lab_legacy_action(text,uuid,jsonb)'::regprocedure
  ] loop
    definition := pg_get_functiondef(signature);
    for patch in select * from (values
      ($old$'remaining',greatest(0,allowance-used)$old$,
       $new$'unlimited',tier in ('pro','premium'),'remaining',greatest(case when tier in ('pro','premium') then 1 else 0 end,allowance-used)$new$),
      ($old$if used>=allowance then$old$,
       $new$if tier not in ('pro','premium') and used>=allowance then$new$)
    ) as patches(old_text, new_text)
    loop
      updated := replace(definition, patch.old_text, patch.new_text);
      if updated = definition then
        raise exception 'Expected Practice Lab allowance logic missing in %: %', signature, patch.old_text;
      end if;
      definition := updated;
    end loop;
    execute definition;
  end loop;
end $$;

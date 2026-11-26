-- Free learners can start 5 Practice Lab sets a day (was 2).
-- Pro and Premium stay unlimited; the reset time does not change.
set local lock_timeout = '3s';

do $$
declare
  signature regprocedure;
  definition text;
  updated text;
begin
  foreach signature in array array[
    'public.practice_library_state(uuid,text,uuid,jsonb)'::regprocedure,
    'public.skill_lab_legacy_action(text,uuid,jsonb)'::regprocedure
  ] loop
    definition := pg_get_functiondef(signature);
    updated := replace(
      definition,
      $old$when 'pro' then 10 else 2 end$old$,
      $new$when 'pro' then 10 else 5 end$new$
    );
    if updated = definition then
      raise exception 'Expected Free Practice Lab allowance missing in %', signature;
    end if;
    execute updated;
  end loop;
end $$;

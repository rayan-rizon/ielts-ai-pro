-- Rollback-only permission and expiry checks. Does not enable the public rollout.
begin;
do $$
declare a uuid := gen_random_uuid();
begin
  if has_table_privilege('authenticated','skill_lab_private.library_preview_users','INSERT') then raise exception 'Browser can grant preview access'; end if;
  if has_function_privilege('authenticated','skill_lab_private.library_available(uuid)','EXECUTE') then raise exception 'Browser can query preview identities'; end if;
  update skill_lab_private.settings set library_enabled=false;
  if skill_lab_private.library_available(a) then raise exception 'Unlisted account allowed'; end if;
  -- A real auth row is required by the FK; use one existing row inside this rollback.
  select id into a from auth.users limit 1;
  if a is not null then
    insert into skill_lab_private.library_preview_users values(a,now()+interval '5 minutes') on conflict(auth_id) do update set expires_at=excluded.expires_at;
    if not skill_lab_private.library_available(a) then raise exception 'Preview account blocked'; end if;
    update skill_lab_private.library_preview_users set expires_at=now()-interval '1 second' where auth_id=a;
    if skill_lab_private.library_available(a) then raise exception 'Expired preview allowed'; end if;
  end if;
end $$;
rollback;

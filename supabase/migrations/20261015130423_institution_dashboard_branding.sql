-- Logos are public brand assets. Only institution managers can create/remove
-- objects in their own institution folder; replacement uses a fresh object key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('institution-logos', 'institution-logos', true, 2097152,
        array['image/png', 'image/jpeg', 'image/webp']);

create policy institution_logo_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'institution-logos'
  and exists (
    select 1 from public.institutions i
    where i.id::text = (storage.foldername(storage.objects.name))[1]
      and institution_private.can_manage(i.id, (select auth.uid()))
      and (institution_private.is_admin((select auth.uid())) or i.status = 'active')
  )
);

-- Storage removal also needs SELECT; listing stays scoped to managers.
create policy institution_logo_select on storage.objects
for select to authenticated using (
  bucket_id = 'institution-logos'
  and exists (
    select 1 from public.institutions i
    where i.id::text = (storage.foldername(storage.objects.name))[1]
      and institution_private.can_manage(i.id, (select auth.uid()))
  )
);

create policy institution_logo_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'institution-logos'
  and exists (
    select 1 from public.institutions i
    where i.id::text = (storage.foldername(storage.objects.name))[1]
      and institution_private.can_manage(i.id, (select auth.uid()))
  )
);

-- Enrich the existing POST RPC without changing entitlement reconciliation or
-- exposing institution contact, billing or owner data to students.
create or replace function public.get_my_institution_access()
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare access_data jsonb; branding jsonb;
begin
  if auth.uid() is null then return null; end if;
  access_data := institution_private.access(auth.uid());
  select jsonb_build_object('institution_id', i.id, 'name', i.name, 'logo_url', i.logo_url)
  into branding from public.institutions i
  where i.id::text = access_data->'institution_access'->>'institution_id'
    and i.status = 'active'
    and access_data->'institution_access'->>'status' in ('active', 'waiting');
  return access_data || jsonb_build_object('institution_branding', branding);
end $$;
revoke all on function public.get_my_institution_access() from public, anon;
grant execute on function public.get_my_institution_access() to authenticated;

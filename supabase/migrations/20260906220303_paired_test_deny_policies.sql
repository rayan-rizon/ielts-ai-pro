-- Keep the paired tables service-role-only while making the deny-by-default
-- RLS contract explicit to database advisors and future maintainers.
create policy paired_rooms_deny_client on public.paired_test_rooms
  as restrictive for all to anon, authenticated
  using (false) with check (false);

create policy paired_members_deny_client on public.paired_test_members
  as restrictive for all to anon, authenticated
  using (false) with check (false);

create policy paired_limits_deny_client on public.paired_test_limits
  as restrictive for all to anon, authenticated
  using (false) with check (false);

create policy paired_events_deny_client on public.paired_test_events
  as restrictive for all to anon, authenticated
  using (false) with check (false);

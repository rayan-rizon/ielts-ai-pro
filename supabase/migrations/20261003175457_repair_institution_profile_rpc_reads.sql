-- The institution profile view resolves entitlements with seat reconciliation.
-- PostgREST GET requests run read-only, so querying the view directly fails with
-- SQLSTATE 25006. Keep reconciliation atomic and use this POST RPC instead.
create or replace function public.get_institution_learner_profile(p_auth uuid)
returns setof public.institution_learner_profiles
language sql volatile security definer
set search_path = ''
as $$
  select profile.* from public.institution_learner_profiles profile
  where profile.auth_id = p_auth;
$$;

revoke all on function public.get_institution_learner_profile(uuid) from public, anon, authenticated;
grant execute on function public.get_institution_learner_profile(uuid) to service_role;

comment on function public.get_institution_learner_profile(uuid) is
  'Service-only profile lookup with institution entitlement reconciliation in a writable POST transaction. Callers must derive p_auth from a verified bearer token.';

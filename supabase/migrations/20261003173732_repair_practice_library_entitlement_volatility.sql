-- Institution entitlements reconcile seat activation/expiry while resolving a
-- learner's effective tier. These catalogue callers previously remained STABLE
-- after skill_lab_private.tier became VOLATILE, forcing that reconciliation
-- into a read-only transaction and failing with SQLSTATE 25006.
-- Correct every catalogue entry point, including the uncached fallback, without
-- changing entitlement rules, saved practice sessions, or execution grants.
alter function public.practice_library_catalogue_version(uuid) volatile;
alter function public.practice_library_catalogue_static(uuid, boolean) volatile;
alter function public.practice_library_catalogue_for_sources(uuid, uuid[], boolean) volatile;
alter function public.practice_library_dashboard_groups_uncached(uuid) volatile;
alter function public.practice_library_dashboard_groups(uuid) volatile;

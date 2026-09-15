-- `resolve_study_timezone` only exists to serve `get_grammar_dashboard()` and
-- `start_grammar_attempt()`. Both are SECURITY DEFINER and owned by `postgres`,
-- so they execute this helper as the definer regardless of who called them —
-- the `authenticated` grant added alongside it is never exercised.
--
-- It is harmless in itself (text in, text out, no data access), but it was
-- reachable at /rest/v1/rpc/resolve_study_timezone for every signed-in user.
-- Locking it down matches how every other internal helper in this schema is
-- granted, and removes API surface that nothing needs.

revoke execute on function public.resolve_study_timezone(text) from authenticated;

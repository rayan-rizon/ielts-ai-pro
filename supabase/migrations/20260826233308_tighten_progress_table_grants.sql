-- Keep learner progress readable through the authenticated API while making
-- every mutation and table-level privilege server-owned.
REVOKE ALL ON TABLE public.user_points FROM anon, authenticated;
REVOKE ALL ON TABLE public.user_achievements FROM anon, authenticated;
GRANT SELECT ON TABLE public.user_points TO authenticated;
GRANT SELECT ON TABLE public.user_achievements TO authenticated;

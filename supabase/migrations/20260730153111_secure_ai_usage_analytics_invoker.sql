-- Existing RLS policies grant admin reads on ai_api_usage and users.
-- Run analytics as the caller so the dashboard does not expand the
-- SECURITY DEFINER API surface beyond the already-hardened is_admin() check.

ALTER FUNCTION public.get_ai_usage_stats_paginated(integer, integer, text, text) SECURITY INVOKER;
ALTER FUNCTION public.get_ai_usage_aggs() SECURITY INVOKER;
ALTER FUNCTION public.get_daily_api_usage_stats(timestamp with time zone) SECURITY INVOKER;
ALTER FUNCTION public.get_ai_usage_endpoint_stats(timestamp with time zone) SECURITY INVOKER;

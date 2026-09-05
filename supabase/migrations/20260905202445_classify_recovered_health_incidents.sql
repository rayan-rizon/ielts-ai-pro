-- Preserve all historical evidence while identifying confirmed usable fallbacks.
ALTER FUNCTION public.get_platform_health_incidents(integer, integer)
  RENAME TO get_platform_health_incidents_before_recovery_labels;
REVOKE ALL ON FUNCTION public.get_platform_health_incidents_before_recovery_labels(integer, integer)
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.get_platform_health_incidents(p_hours integer DEFAULT 24, p_limit integer DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  SELECT COALESCE(jsonb_agg(
    incident || jsonb_build_object('outcome', CASE
      WHEN incident->>'service' = 'ai_text_providers'
        AND EXISTS (
          SELECT 1 FROM public.ai_api_usage u
          WHERE u.created_at >= now() - make_interval(hours => LEAST(GREATEST(COALESCE(p_hours,24),1),2160))
            AND u.endpoint IN ('generateAdaptiveLearningPath','generateStudyRecommendations')
            AND u.request_metadata->>'reservationStatus' = 'failed'
            AND left(COALESCE(u.request_metadata->>'fallbackReason',u.request_metadata->>'failureReason'),500) = incident->>'message'
          HAVING bool_and(COALESCE(u.request_metadata->>'deterministicFallback','false') = 'true')
        ) THEN 'recovered'
      ELSE 'unresolved'
    END) ORDER BY ordinal
  ),'[]'::jsonb) INTO result
  FROM jsonb_array_elements(public.get_platform_health_incidents_before_recovery_labels(p_hours,p_limit))
    WITH ORDINALITY AS entries(incident,ordinal);
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_platform_health_incidents(integer,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health_incidents(integer,integer) TO authenticated;

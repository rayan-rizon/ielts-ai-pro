-- Examiner Voice (TTS) health described traffic it cannot see.
--
-- synthesizeSpeech serves a cache hit and returns *before* reserving quota, so
-- a cached phrase never writes an ai_api_usage row. Two consequences:
--
--   1. `cacheHits` counted rows where cached = true, and the function only ever
--      finalises with cached = false. The panel therefore always displayed 0 —
--      a number that could never be anything else.
--   2. Speaking tests reuse the same examiner prompts, so nearly all playback
--      is cached. The panel reported "No completed TTS attempts in this window"
--      (idle) while the examiner voice was in constant use.
--
-- Logging cache hits is not the fix: learner quota is counted as rows in
-- ai_api_usage, so recording them would bill learners for cached audio. The
-- service is instead described for what it actually measures — new synthesis —
-- and the unknowable metric is dropped rather than shown as zero.

ALTER FUNCTION public.get_platform_health(integer)
    RENAME TO get_platform_health_core_v6;
REVOKE ALL ON FUNCTION public.get_platform_health_core_v6(integer)
    FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_platform_health(p_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_base jsonb;
    v_services jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_base := public.get_platform_health_core_v6(p_hours);

    SELECT COALESCE(jsonb_agg(
        CASE WHEN service->>'key' = 'speech_synthesis' THEN
            jsonb_set(
                service || jsonb_build_object(
                    'label', 'Examiner Voice (new audio)',
                    'source', 'ai_api_usage synthesizeSpeech rows (cache misses only)',
                    'impact', CASE
                        WHEN COALESCE((service->'metrics'->>'attempts')::bigint, 0) = 0 THEN
                            'No new examiner audio was synthesised in this window. Repeated prompts play from cache without recording usage, so this does not mean the examiner voice was silent.'
                        WHEN COALESCE((service->'metrics'->>'errors')::bigint, 0) > 0 THEN
                            (service->'metrics'->>'errors') ||
                            ' synthesis attempt(s) failed and fell back to browser speech. Already-cached prompts are unaffected.'
                        ELSE
                            'Every newly synthesised examiner phrase completed. Cached playback is served without a usage row and is not counted here.'
                    END
                ),
                '{metrics}',
                -- Structurally unknowable from this table; a permanent 0 reads
                -- as "the cache is never used", which is the opposite of true.
                (service->'metrics') - 'cacheHits',
                true
            )
        ELSE service END
    ), '[]'::jsonb)
    INTO v_services
    FROM jsonb_array_elements(COALESCE(v_base->'services', '[]'::jsonb)) service;

    v_base := jsonb_set(v_base, '{services}', v_services, true);
    v_base := jsonb_set(v_base, '{contractVersion}', '7'::jsonb, true);

    RETURN v_base;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health(integer) TO authenticated;

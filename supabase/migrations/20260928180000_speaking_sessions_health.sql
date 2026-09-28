-- Speaking sessions in admin System Health.
--
-- Speaking V2 turns (exam and practice), the practice coach reply and the
-- practice coach voice had no row in System Health: a failing turn, a coach
-- that silently fell back to its scripted tip, or a broken coach voice was
-- invisible. This adds one `speaking_sessions` service and its incidents.
--
-- Sources
--   public.speaking_turns
--     reservation_status = 'failed' with failureReason 'transcription_failed'
--       -> the learner was not heard (silence, mic). Counted as "unheard",
--          not as a system error, unless it becomes the majority.
--     any other failed turn -> a system error the learner felt.
--     provider_metadata.coach.source: 'ai' | 'fallback' (coach on but failed,
--       scripted tip played; .error holds the reason) | 'scripted' (coach off).
--   public.ai_api_usage endpoint 'synthesizeSpeech', request_metadata.route =
--     'practice-tts' -> the practice coach voice. `interrupted` lines are the
--     learner speaking over the coach, which is normal use.

ALTER FUNCTION public.get_platform_health(integer)
  RENAME TO get_platform_health_core_v15;
REVOKE ALL ON FUNCTION public.get_platform_health_core_v15(integer)
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
  v_hours integer := LEAST(GREATEST(COALESCE(p_hours, 24), 1), 2160);
  v_since timestamptz;
  v_turns bigint;
  v_errors bigint;
  v_unheard bigint;
  v_in_flight bigint;
  v_coach_ai bigint;
  v_coach_fallback bigint;
  v_voice_lines bigint;
  v_voice_errors bigint;
  v_voice_interrupted bigint;
  v_voice_p50 numeric;
  v_error_rate numeric;
  v_unheard_rate numeric;
  v_coach_fallback_rate numeric;
  v_voice_error_rate numeric;
  v_status text;
  v_impact text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  v_base := public.get_platform_health_core_v15(p_hours);
  v_since := now() - make_interval(hours => v_hours);

  SELECT
    count(*) FILTER (WHERE t.reservation_status <> 'reserved'),
    count(*) FILTER (WHERE t.reservation_status = 'failed'
      AND COALESCE(t.provider_metadata->>'failureReason', '') <> 'transcription_failed'),
    count(*) FILTER (WHERE t.reservation_status = 'failed'
      AND t.provider_metadata->>'failureReason' = 'transcription_failed'),
    count(*) FILTER (WHERE t.reservation_status = 'reserved'
      AND t.created_at >= now() - interval '10 minutes'),
    count(*) FILTER (WHERE t.provider_metadata->'coach'->>'source' = 'ai'),
    count(*) FILTER (WHERE t.provider_metadata->'coach'->>'source' = 'fallback')
  INTO v_turns, v_errors, v_unheard, v_in_flight, v_coach_ai, v_coach_fallback
  FROM public.speaking_turns t
  WHERE t.created_at >= v_since;

  SELECT
    count(*) FILTER (WHERE u.request_metadata->>'reservationStatus' IN ('completed', 'failed')),
    count(*) FILTER (WHERE u.request_metadata->>'reservationStatus' = 'failed'),
    count(*) FILTER (WHERE u.request_metadata->>'interrupted' = 'true'),
    percentile_cont(0.5) WITHIN GROUP (ORDER BY (u.request_metadata->>'firstAudioMs')::numeric)
      FILTER (WHERE u.request_metadata->>'firstAudioMs' ~ '^[0-9]+$'
        AND (u.request_metadata->>'firstAudioMs')::numeric > 0)
  INTO v_voice_lines, v_voice_errors, v_voice_interrupted, v_voice_p50
  FROM public.ai_api_usage u
  WHERE u.created_at >= v_since
    AND u.endpoint = 'synthesizeSpeech'
    AND u.request_metadata->>'route' = 'practice-tts';

  v_error_rate := CASE WHEN v_turns > 0 THEN round(100.0 * v_errors / v_turns, 1) ELSE 0 END;
  v_unheard_rate := CASE WHEN v_turns > 0 THEN round(100.0 * v_unheard / v_turns, 1) ELSE 0 END;
  v_coach_fallback_rate := CASE WHEN v_coach_ai + v_coach_fallback > 0
    THEN round(100.0 * v_coach_fallback / (v_coach_ai + v_coach_fallback), 1) ELSE 0 END;
  v_voice_error_rate := CASE WHEN v_voice_lines > 0
    THEN round(100.0 * v_voice_errors / v_voice_lines, 1) ELSE 0 END;

  v_status := CASE
    WHEN v_turns = 0 AND v_in_flight = 0 AND v_voice_lines = 0 THEN 'idle'
    WHEN (v_turns >= 5 AND v_error_rate >= 25)
      OR (v_voice_lines >= 5 AND v_voice_error_rate >= 25)
      OR (v_coach_ai + v_coach_fallback >= 5 AND v_coach_fallback_rate >= 50) THEN 'down'
    WHEN v_errors > 0
      OR v_voice_errors > 0
      OR (v_coach_ai + v_coach_fallback >= 5 AND v_coach_fallback_rate >= 20)
      OR (v_turns >= 10 AND v_unheard_rate >= 40) THEN 'degraded'
    ELSE 'operational'
  END;

  v_impact := CASE
    WHEN v_status = 'idle' THEN 'No speaking turns in this window.'
    WHEN v_errors > 0 THEN v_errors || ' speaking turn(s) failed with a system error; the learner had to answer again.'
    WHEN v_voice_errors > 0 THEN v_voice_errors || ' practice coach line(s) fell back to the standard examiner voice.'
    WHEN v_coach_fallback > 0 AND v_coach_fallback_rate >= 20 THEN
      v_coach_fallback || ' practice answer(s) got the scripted tip because the AI coach failed.'
    WHEN v_turns >= 10 AND v_unheard_rate >= 40 THEN
      v_unheard_rate || '% of answers were not heard; check transcription and microphone capture.'
    ELSE 'Speaking turns, coach replies and coach voice completed normally.'
  END;

  RETURN jsonb_set(
    v_base,
    '{services}',
    COALESCE(v_base->'services', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'key', 'speaking_sessions',
      'label', 'Speaking Sessions & Practice Coach',
      'category', 'ai',
      'provider', 'Speech-to-text, DeepSeek V4.1 Flash / GPT-6 Luna coach, Gemini TTS voice',
      'status', v_status,
      'source', 'speaking_turns outcomes and practice-tts usage',
      'metrics', jsonb_build_object(
        'turns', v_turns,
        'errors', v_errors,
        'errorRate', v_error_rate,
        'unheardTurns', v_unheard,
        'inFlight', v_in_flight,
        'coachReplies', v_coach_ai,
        'coachFallbacks', v_coach_fallback,
        'coachFallbackRate', v_coach_fallback_rate,
        'practiceVoiceLines', v_voice_lines,
        'practiceVoiceErrors', v_voice_errors,
        'interruptedLines', v_voice_interrupted,
        'p50FirstAudioMs', round(COALESCE(v_voice_p50, 0))
      ),
      'impact', v_impact
    )),
    true
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_health(integer) TO authenticated;

COMMENT ON FUNCTION public.get_platform_health(integer) IS
'Admin-only operational health. Adds speaking_sessions (Speaking V2 turns, practice coach fallbacks and practice coach voice) on top of get_platform_health_core_v15.';

-- Incidents: the reason behind each failed speaking turn and coach fallback.
ALTER FUNCTION public.get_platform_health_incidents(integer, integer)
  RENAME TO get_platform_health_incidents_core_v5;
REVOKE ALL ON FUNCTION public.get_platform_health_incidents_core_v5(integer, integer)
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.get_platform_health_incidents(p_hours integer DEFAULT 24, p_limit integer DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_hours integer := LEAST(GREATEST(COALESCE(p_hours, 24), 1), 2160);
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
  v_since timestamptz;
  v_speaking jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  v_since := now() - make_interval(hours => v_hours);

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'service', 'speaking_sessions',
      'message', message,
      'occurrences', occurrences,
      'last_seen', last_seen,
      'first_seen', first_seen,
      'outcome', outcome
    ) ORDER BY last_seen DESC), '[]'::jsonb)
  INTO v_speaking
  FROM (
    SELECT message, outcome, count(*) AS occurrences, max(seen_at) AS last_seen, min(seen_at) AS first_seen
    FROM (
      SELECT 'Speaking turn failed: ' || left(COALESCE(NULLIF(btrim(t.provider_metadata->>'failureReason'), ''), 'unknown'), 400) AS message,
             'unresolved' AS outcome,
             t.created_at AS seen_at
      FROM public.speaking_turns t
      WHERE t.created_at >= v_since
        AND t.reservation_status = 'failed'
        AND COALESCE(t.provider_metadata->>'failureReason', '') <> 'transcription_failed'
      UNION ALL
      -- The learner still heard the scripted tip, so this is recovered.
      SELECT 'Practice coach fell back to the scripted tip: ' || left(COALESCE(NULLIF(btrim(t.provider_metadata->'coach'->>'error'), ''), 'no usable reply'), 400),
             'recovered',
             t.created_at
      FROM public.speaking_turns t
      WHERE t.created_at >= v_since
        AND t.provider_metadata->'coach'->>'source' = 'fallback'
      UNION ALL
      -- The browser played the standard examiner voice instead.
      SELECT 'Practice coach voice failed: ' || left(COALESCE(NULLIF(btrim(u.request_metadata->>'ttsError'), ''), 'provider error'), 400),
             'recovered',
             u.created_at
      FROM public.ai_api_usage u
      WHERE u.created_at >= v_since
        AND u.endpoint = 'synthesizeSpeech'
        AND u.request_metadata->>'route' = 'practice-tts'
        AND u.request_metadata->>'reservationStatus' = 'failed'
    ) raw
    GROUP BY message, outcome
    ORDER BY max(seen_at) DESC
    LIMIT v_limit
  ) grouped;

  RETURN (
    SELECT COALESCE(jsonb_agg(incident ORDER BY (incident->>'last_seen')::timestamptz DESC NULLS LAST), '[]'::jsonb)
    FROM (
      SELECT incident
      FROM jsonb_array_elements(
        public.get_platform_health_incidents_core_v5(p_hours, p_limit) || v_speaking
      ) AS incident
      ORDER BY (incident->>'last_seen')::timestamptz DESC NULLS LAST
      LIMIT v_limit
    ) limited
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_platform_health_incidents(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_health_incidents(integer, integer) TO authenticated;

-- Speaking V2 keeps exam progress and transcript evidence server-owned.
-- This migration is additive so V1 remains a safe rollback path.

CREATE TABLE IF NOT EXISTS public.speaking_session_state (
  test_session_id uuid PRIMARY KEY REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  passage_id uuid NOT NULL REFERENCES public.passages(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('exam', 'practice')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'part_complete', 'ready_for_evaluation', 'expired', 'completed')),
  current_part smallint NOT NULL DEFAULT 1 CHECK (current_part BETWEEN 1 AND 3),
  current_question_index integer NOT NULL DEFAULT 0 CHECK (current_question_index >= 0),
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  clarification_count smallint NOT NULL DEFAULT 0 CHECK (clarification_count BETWEEN 0 AND 1),
  turns_used integer NOT NULL DEFAULT 0 CHECK (turns_used >= 0),
  turn_limit integer NOT NULL CHECK (turn_limit BETWEEN 1 AND 20),
  audio_ms_used bigint NOT NULL DEFAULT 0 CHECK (audio_ms_used >= 0),
  audio_limit_ms bigint NOT NULL CHECK (audio_limit_ms BETWEEN 60000 AND 840000),
  remaining_active_seconds integer CHECK (remaining_active_seconds BETWEEN 0 AND 480),
  processing_turn_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  resume_expires_at timestamptz,
  last_heartbeat_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT speaking_v2_exam_expiry CHECK (
    (mode = 'exam' AND expires_at IS NOT NULL AND remaining_active_seconds IS NULL)
    OR
    (mode = 'practice' AND expires_at IS NULL AND remaining_active_seconds IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.speaking_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_session_id uuid NOT NULL REFERENCES public.speaking_session_state(test_session_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 16 AND 100),
  sequence_number integer NOT NULL CHECK (sequence_number > 0),
  revision_before integer NOT NULL CHECK (revision_before >= 0),
  revision_after integer CHECK (revision_after >= 0),
  part_number smallint NOT NULL CHECK (part_number BETWEEN 1 AND 3),
  question_id uuid REFERENCES public.questions(id) ON DELETE SET NULL,
  question_index integer NOT NULL CHECK (question_index >= 0),
  transcript text,
  transcript_status text NOT NULL DEFAULT 'processing'
    CHECK (transcript_status IN ('processing', 'ready', 'inaudible', 'failed')),
  classification text CHECK (
    classification IS NULL OR classification IN (
      'relevant', 'partial', 'off_topic', 'meta_ielts', 'meta_microphone', 'unrelated', 'prompt_injection', 'non_english'
    )
  ),
  relevance numeric(4,3) CHECK (relevance IS NULL OR relevance BETWEEN 0 AND 1),
  answer_depth text CHECK (answer_depth IS NULL OR answer_depth IN ('insufficient', 'adequate', 'extended')),
  action text CHECK (
    action IS NULL OR action IN (
      'advance', 'clarify_once', 'repeat_prompt', 'redirect_ielts_only', 'continue_part2', 'complete_part'
    )
  ),
  is_valid_answer boolean NOT NULL DEFAULT false,
  semantic_degraded boolean NOT NULL DEFAULT false,
  evidence_quote text CHECK (evidence_quote IS NULL OR char_length(evidence_quote) <= 180),
  coaching_code text CHECK (coaching_code IS NULL OR char_length(coaching_code) <= 40),
  audio_duration_ms integer NOT NULL DEFAULT 0 CHECK (audio_duration_ms BETWEEN 0 AND 120000),
  provider_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  latency_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_payload jsonb,
  reservation_status text NOT NULL DEFAULT 'reserved'
    CHECK (reservation_status IN ('reserved', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (test_session_id, idempotency_key),
  UNIQUE (test_session_id, sequence_number)
);

CREATE TABLE IF NOT EXISTS public.speaking_testing_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  safety_session_budget integer NOT NULL CHECK (safety_session_budget BETWEEN 1 AND 100),
  sessions_used integer NOT NULL DEFAULT 0 CHECK (sessions_used >= 0),
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 8 AND 240),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.speaking_testing_override_sessions (
  override_id uuid NOT NULL REFERENCES public.speaking_testing_overrides(id) ON DELETE CASCADE,
  test_session_id uuid PRIMARY KEY REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.speaking_session_state
  ADD CONSTRAINT speaking_session_state_processing_turn_fkey
  FOREIGN KEY (processing_turn_id) REFERENCES public.speaking_turns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_speaking_turns_user_created
  ON public.speaking_turns(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_speaking_turns_session_completed
  ON public.speaking_turns(test_session_id, sequence_number)
  WHERE reservation_status = 'completed';

ALTER TABLE public.speaking_session_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_testing_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_testing_override_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.speaking_session_state FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.speaking_turns FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.speaking_testing_overrides FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.speaking_testing_override_sessions FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.speaking_session_state TO service_role;
GRANT ALL ON TABLE public.speaking_turns TO service_role;
GRANT ALL ON TABLE public.speaking_testing_overrides TO service_role;
GRANT ALL ON TABLE public.speaking_testing_override_sessions TO service_role;

CREATE OR REPLACE FUNCTION public.consume_speaking_testing_override(
  p_auth_id uuid,
  p_test_session_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_user public.users%ROWTYPE;
  v_override public.speaking_testing_overrides%ROWTYPE;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_user FROM public.users WHERE auth_id = p_auth_id;
  IF NOT FOUND OR v_user.role <> 'admin' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'admin_required');
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.speaking_testing_override_sessions s
    JOIN public.speaking_testing_overrides o ON o.id = s.override_id
    WHERE s.test_session_id = p_test_session_id AND o.user_id = v_user.id
  ) THEN
    RETURN jsonb_build_object('allowed', true, 'alreadyConsumed', true);
  END IF;
  SELECT * INTO v_override FROM public.speaking_testing_overrides
  WHERE user_id = v_user.id AND expires_at > now()
  ORDER BY expires_at ASC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'testing_override_required');
  END IF;
  IF v_override.sessions_used >= v_override.safety_session_budget THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'testing_safety_budget_exhausted');
  END IF;
  INSERT INTO public.speaking_testing_override_sessions(override_id, test_session_id)
  VALUES (v_override.id, p_test_session_id);
  UPDATE public.speaking_testing_overrides SET sessions_used = sessions_used + 1
  WHERE id = v_override.id;
  RETURN jsonb_build_object(
    'allowed', true,
    'expiresAt', v_override.expires_at,
    'remainingSessions', v_override.safety_session_budget - v_override.sessions_used - 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.start_speaking_v2_session(
  p_auth_id uuid,
  p_test_session_id uuid,
  p_mode text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_session public.test_sessions%ROWTYPE;
  v_profile public.users%ROWTYPE;
  v_state public.speaking_session_state%ROWTYPE;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;
  IF p_mode NOT IN ('exam', 'practice') THEN
    RAISE EXCEPTION 'invalid speaking mode' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_session FROM public.test_sessions WHERE id = p_test_session_id;
  IF NOT FOUND OR v_session.test_type <> 'speaking' THEN
    RAISE EXCEPTION 'speaking session not found' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO v_profile FROM public.users
  WHERE id = v_session.user_id AND auth_id = p_auth_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'speaking session access denied' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.speaking_session_state (
    test_session_id, user_id, passage_id, mode, turn_limit, audio_limit_ms,
    remaining_active_seconds, expires_at, resume_expires_at, last_heartbeat_at
  ) VALUES (
    v_session.id, v_session.user_id, v_session.passage_id, p_mode,
    CASE WHEN p_mode = 'exam' THEN 20 ELSE 10 END,
    CASE WHEN p_mode = 'exam' THEN 840000 ELSE 480000 END,
    CASE WHEN p_mode = 'practice' THEN 480 ELSE NULL END,
    CASE WHEN p_mode = 'exam' THEN now() + interval '14 minutes' ELSE NULL END,
    CASE WHEN p_mode = 'practice' THEN now() + interval '24 hours' ELSE NULL END,
    now()
  )
  ON CONFLICT (test_session_id) DO NOTHING;

  SELECT * INTO v_state FROM public.speaking_session_state
  WHERE test_session_id = p_test_session_id;
  IF v_state.user_id <> v_session.user_id THEN
    RAISE EXCEPTION 'speaking state ownership mismatch' USING ERRCODE = '42501';
  END IF;

  RETURN to_jsonb(v_state);
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_speaking_v2_turn(
  p_auth_id uuid,
  p_test_session_id uuid,
  p_expected_revision integer,
  p_idempotency_key text,
  p_audio_duration_ms integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_state public.speaking_session_state%ROWTYPE;
  v_profile public.users%ROWTYPE;
  v_existing public.speaking_turns%ROWTYPE;
  v_turn public.speaking_turns%ROWTYPE;
  v_burst_limit integer := 10;
  v_recent integer := 0;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;
  IF p_audio_duration_ms < 0 OR p_audio_duration_ms > 120000 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'audio_duration_invalid');
  END IF;
  IF char_length(COALESCE(p_idempotency_key, '')) NOT BETWEEN 16 AND 100 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'idempotency_key_invalid');
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_auth_id::text || ':speaking-v2', 0)
  );
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_test_session_id::text, 0)
  );

  SELECT s.* INTO v_state
  FROM public.speaking_session_state s
  JOIN public.users u ON u.id = s.user_id
  WHERE s.test_session_id = p_test_session_id AND u.auth_id = p_auth_id
  FOR UPDATE OF s;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'session_not_found');
  END IF;

  SELECT * INTO v_existing FROM public.speaking_turns
  WHERE test_session_id = p_test_session_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'allowed', v_existing.reservation_status = 'completed',
      'alreadyReserved', true,
      'status', v_existing.reservation_status,
      'turnId', v_existing.id,
      'response', v_existing.response_payload,
      'state', to_jsonb(v_state)
    );
  END IF;

  IF v_state.status <> 'active' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', v_state.status, 'state', to_jsonb(v_state));
  END IF;
  IF v_state.mode = 'exam' AND now() >= v_state.expires_at THEN
    UPDATE public.speaking_session_state SET status = 'expired', updated_at = now()
    WHERE test_session_id = p_test_session_id;
    RETURN jsonb_build_object('allowed', false, 'reason', 'expired');
  END IF;
  IF v_state.mode = 'practice' AND now() >= v_state.resume_expires_at THEN
    UPDATE public.speaking_session_state SET status = 'expired', updated_at = now()
    WHERE test_session_id = p_test_session_id;
    RETURN jsonb_build_object('allowed', false, 'reason', 'expired');
  END IF;
  IF v_state.mode = 'practice' AND v_state.last_heartbeat_at < now() - interval '45 seconds' THEN
    UPDATE public.speaking_session_state SET status = 'paused', last_heartbeat_at = NULL, updated_at = now()
    WHERE test_session_id = p_test_session_id;
    RETURN jsonb_build_object('allowed', false, 'reason', 'paused', 'state', to_jsonb(v_state));
  END IF;
  IF v_state.revision <> p_expected_revision THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'revision_conflict', 'state', to_jsonb(v_state));
  END IF;
  IF v_state.processing_turn_id IS NOT NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'turn_in_progress', 'state', to_jsonb(v_state));
  END IF;
  IF v_state.turns_used >= v_state.turn_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'turn_limit', 'state', to_jsonb(v_state));
  END IF;
  IF v_state.audio_ms_used + p_audio_duration_ms > v_state.audio_limit_ms THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'audio_limit', 'state', to_jsonb(v_state));
  END IF;

  SELECT u.* INTO v_profile FROM public.users u WHERE u.auth_id = p_auth_id;
  SELECT COALESCE(trl.burst_limit, 10) INTO v_burst_limit
  FROM public.tier_rate_limits trl
  WHERE trl.tier = CASE WHEN v_profile.role = 'admin' THEN 'admin' ELSE lower(COALESCE(v_profile.subscription_tier, 'free')) END
    AND (trl.currency = COALESCE(upper(v_profile.subscription_currency), 'ALL') OR trl.currency = 'ALL')
  ORDER BY CASE WHEN trl.currency = COALESCE(upper(v_profile.subscription_currency), 'ALL') THEN 1 ELSE 2 END
  LIMIT 1;

  SELECT count(*)::integer INTO v_recent
  FROM public.speaking_turns
  WHERE user_id = v_state.user_id AND created_at >= now() - interval '1 minute';
  IF v_recent >= COALESCE(v_burst_limit, 10) THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'burst_limit', 'retryAfterSeconds', 60);
  END IF;

  INSERT INTO public.speaking_turns (
    test_session_id, user_id, idempotency_key, sequence_number, revision_before,
    part_number, question_index, audio_duration_ms
  ) VALUES (
    p_test_session_id, v_state.user_id, p_idempotency_key, v_state.turns_used + 1,
    v_state.revision, v_state.current_part, v_state.current_question_index, p_audio_duration_ms
  ) RETURNING * INTO v_turn;

  UPDATE public.speaking_session_state
  SET processing_turn_id = v_turn.id, status = 'active', last_heartbeat_at = now(), updated_at = now()
  WHERE test_session_id = p_test_session_id;

  RETURN jsonb_build_object('allowed', true, 'turnId', v_turn.id, 'state', to_jsonb(v_state));
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_speaking_v2_turn(
  p_auth_id uuid,
  p_turn_id uuid,
  p_result jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_turn public.speaking_turns%ROWTYPE;
  v_state public.speaking_session_state%ROWTYPE;
  v_status text;
  v_next_part integer;
  v_next_question integer;
  v_next_clarification integer;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;

  SELECT t.* INTO v_turn
  FROM public.speaking_turns t
  JOIN public.users u ON u.id = t.user_id
  WHERE t.id = p_turn_id AND u.auth_id = p_auth_id
  FOR UPDATE OF t;
  IF NOT FOUND THEN RAISE EXCEPTION 'turn not found' USING ERRCODE = 'P0002'; END IF;

  SELECT * INTO v_state FROM public.speaking_session_state
  WHERE test_session_id = v_turn.test_session_id FOR UPDATE;
  IF v_state.processing_turn_id IS DISTINCT FROM v_turn.id THEN
    RAISE EXCEPTION 'turn is not active' USING ERRCODE = '40001';
  END IF;

  v_next_part := COALESCE((p_result -> 'state' ->> 'part')::integer, v_state.current_part);
  v_next_question := COALESCE((p_result -> 'state' ->> 'questionNumber')::integer, v_state.current_question_index);
  v_next_clarification := COALESCE((p_result -> 'state' ->> 'clarificationCount')::integer, 0);
  v_status := COALESCE(p_result -> 'state' ->> 'status', 'active');
  IF v_next_part NOT BETWEEN 1 AND 3 OR v_next_question < 0 OR v_next_clarification NOT BETWEEN 0 AND 1 THEN
    RAISE EXCEPTION 'invalid next speaking state' USING ERRCODE = '22023';
  END IF;
  IF v_status NOT IN ('active', 'part_complete', 'ready_for_evaluation') THEN
    RAISE EXCEPTION 'invalid speaking state status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.speaking_turns SET
    revision_after = v_state.revision + 1,
    question_id = NULLIF(p_result ->> 'questionId', '')::uuid,
    transcript = left(COALESCE(p_result ->> 'transcript', ''), 6000),
    transcript_status = COALESCE(p_result ->> 'transcriptStatus', 'ready'),
    classification = p_result ->> 'classification',
    relevance = NULLIF(p_result ->> 'relevance', '')::numeric,
    answer_depth = p_result ->> 'answerDepth',
    action = p_result ->> 'action',
    is_valid_answer = COALESCE((p_result ->> 'isValidAnswer')::boolean, false),
    semantic_degraded = COALESCE((p_result ->> 'semanticDegraded')::boolean, false),
    evidence_quote = left(NULLIF(p_result ->> 'evidenceQuote', ''), 180),
    coaching_code = left(NULLIF(p_result ->> 'coachingCode', ''), 40),
    provider_metadata = COALESCE(p_result -> 'provider', '{}'::jsonb),
    latency_metadata = COALESCE(p_result -> 'latency', '{}'::jsonb),
    response_payload = p_result -> 'response',
    reservation_status = 'completed',
    completed_at = now()
  WHERE id = v_turn.id;

  UPDATE public.speaking_session_state SET
    current_part = v_next_part,
    current_question_index = v_next_question,
    clarification_count = v_next_clarification,
    revision = revision + 1,
    turns_used = turns_used + 1,
    audio_ms_used = audio_ms_used + v_turn.audio_duration_ms,
    remaining_active_seconds = remaining_active_seconds,
    status = CASE
      WHEN mode = 'practice' AND turns_used + 1 >= turn_limit THEN 'ready_for_evaluation'
      ELSE v_status
    END,
    processing_turn_id = NULL,
    last_heartbeat_at = now(),
    updated_at = now()
  WHERE test_session_id = v_turn.test_session_id
  RETURNING * INTO v_state;

  RETURN to_jsonb(v_state);
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_speaking_v2_turn(
  p_auth_id uuid,
  p_turn_id uuid,
  p_reason text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_turn public.speaking_turns%ROWTYPE;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;
  SELECT t.* INTO v_turn FROM public.speaking_turns t
  JOIN public.users u ON u.id = t.user_id
  WHERE t.id = p_turn_id AND u.auth_id = p_auth_id FOR UPDATE OF t;
  IF NOT FOUND THEN RETURN false; END IF;

  UPDATE public.speaking_turns SET
    transcript_status = 'failed', reservation_status = 'failed',
    provider_metadata = jsonb_build_object('failureReason', left(COALESCE(p_reason, 'failed'), 240)),
    completed_at = now()
  WHERE id = p_turn_id AND reservation_status = 'reserved';
  UPDATE public.speaking_session_state SET processing_turn_id = NULL, updated_at = now()
  WHERE test_session_id = v_turn.test_session_id AND processing_turn_id = p_turn_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.advance_speaking_v2_part(
  p_auth_id uuid,
  p_test_session_id uuid,
  p_expected_revision integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE v_state public.speaking_session_state%ROWTYPE;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;
  SELECT s.* INTO v_state FROM public.speaking_session_state s
  JOIN public.users u ON u.id = s.user_id
  WHERE s.test_session_id = p_test_session_id AND u.auth_id = p_auth_id
  FOR UPDATE OF s;
  IF NOT FOUND THEN RAISE EXCEPTION 'session not found' USING ERRCODE = 'P0002'; END IF;
  IF v_state.revision <> p_expected_revision OR v_state.status <> 'part_complete' THEN
    RAISE EXCEPTION 'speaking state conflict' USING ERRCODE = '40001';
  END IF;
  IF v_state.current_part >= 3 THEN
    RAISE EXCEPTION 'final part cannot advance' USING ERRCODE = '22023';
  END IF;
  UPDATE public.speaking_session_state SET
    current_part = current_part + 1, current_question_index = 0,
    clarification_count = 0, revision = revision + 1, status = 'active', updated_at = now()
  WHERE test_session_id = p_test_session_id RETURNING * INTO v_state;
  RETURN to_jsonb(v_state);
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_speaking_v2_practice(
  p_auth_id uuid,
  p_test_session_id uuid,
  p_action text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_state public.speaking_session_state%ROWTYPE;
  v_elapsed integer;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;
  IF p_action NOT IN ('heartbeat', 'pause', 'resume') THEN
    RAISE EXCEPTION 'invalid practice action' USING ERRCODE = '22023';
  END IF;
  SELECT s.* INTO v_state FROM public.speaking_session_state s
  JOIN public.users u ON u.id = s.user_id
  WHERE s.test_session_id = p_test_session_id AND u.auth_id = p_auth_id
  FOR UPDATE OF s;
  IF NOT FOUND OR v_state.mode <> 'practice' THEN
    RAISE EXCEPTION 'practice session not found' USING ERRCODE = 'P0002';
  END IF;
  IF now() >= v_state.resume_expires_at THEN
    UPDATE public.speaking_session_state SET status = 'expired', updated_at = now()
    WHERE test_session_id = p_test_session_id RETURNING * INTO v_state;
    RETURN to_jsonb(v_state);
  END IF;

  v_elapsed := CASE
    WHEN v_state.status = 'active' AND v_state.last_heartbeat_at IS NOT NULL
      THEN LEAST(30, GREATEST(0, floor(extract(epoch FROM now() - v_state.last_heartbeat_at))::integer))
    ELSE 0
  END;
  UPDATE public.speaking_session_state SET
    remaining_active_seconds = GREATEST(0, remaining_active_seconds - v_elapsed),
    status = CASE
      WHEN remaining_active_seconds - v_elapsed <= 0 THEN 'ready_for_evaluation'
      WHEN p_action = 'pause' THEN 'paused'
      ELSE 'active'
    END,
    last_heartbeat_at = CASE WHEN p_action = 'pause' THEN NULL ELSE now() END,
    updated_at = now()
  WHERE test_session_id = p_test_session_id RETURNING * INTO v_state;
  RETURN to_jsonb(v_state);
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_speaking_v2_exam(
  p_auth_id uuid,
  p_test_session_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE v_state public.speaking_session_state%ROWTYPE;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;
  SELECT s.* INTO v_state FROM public.speaking_session_state s
  JOIN public.users u ON u.id = s.user_id
  WHERE s.test_session_id = p_test_session_id AND u.auth_id = p_auth_id
  FOR UPDATE OF s;
  IF NOT FOUND OR v_state.mode <> 'exam' THEN
    RAISE EXCEPTION 'exam session not found' USING ERRCODE = 'P0002';
  END IF;
  IF now() < v_state.expires_at AND v_state.status <> 'ready_for_evaluation' THEN
    RAISE EXCEPTION 'exam is still active' USING ERRCODE = '22023';
  END IF;
  UPDATE public.speaking_session_state SET
    status = 'ready_for_evaluation', revision = revision + 1,
    processing_turn_id = NULL, updated_at = now()
  WHERE test_session_id = p_test_session_id RETURNING * INTO v_state;
  RETURN to_jsonb(v_state);
END;
$$;

REVOKE ALL ON FUNCTION public.start_speaking_v2_session(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_speaking_testing_override(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_speaking_v2_turn(uuid, uuid, integer, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finalize_speaking_v2_turn(uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_speaking_v2_turn(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.advance_speaking_v2_part(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_speaking_v2_practice(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_speaking_v2_exam(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_speaking_v2_session(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_speaking_testing_override(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_speaking_v2_turn(uuid, uuid, integer, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_speaking_v2_turn(uuid, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_speaking_v2_turn(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.advance_speaking_v2_part(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.touch_speaking_v2_practice(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_speaking_v2_exam(uuid, uuid) TO service_role;

COMMENT ON TABLE public.speaking_session_state IS 'Server-owned Speaking V2 progression, clocks, and abuse budgets.';
COMMENT ON TABLE public.speaking_turns IS 'Authoritative Speaking V2 transcript and semantic-decision ledger; raw audio is never retained.';

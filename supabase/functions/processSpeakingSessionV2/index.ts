// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  finalizeApiUsage,
  getCorsHeaders,
  quotaExceededResponse,
  reserveDatabaseQuota,
} from '../_shared/security.ts';
import {
  assessPronunciationWithAzure,
  buildBrowserTranscriptHint,
  canRecoverFromBrowserTranscript,
  chooseVerifiedTranscript,
  createBrowserTranscriptRecovery,
  getTranscriptVerificationReason,
  shouldGuardSilentSpeech,
  transcribeWithCloudflare,
  transcribeWithGeminiFallback,
} from '../_shared/speakingProviders.ts';
import {
  buildSpeakingExaminerText,
  decideSpeakingTurn,
  getDeterministicSpeakingDecision,
  resolveSpeakingAction,
  SPEAKING_COACHING_TEXT,
  type SpeakingMode,
} from '../_shared/speakingTurnDecision.ts';
import {
  composePracticeSpokenReply,
  generatePracticeCoachReply,
  type PracticeCoachResult,
  shouldSpeakPracticeCoach,
} from '../_shared/practiceCoach.ts';
import { isPracticeTtsAllowed, parsePracticeTtsRollout } from '../_shared/practiceTts.ts';
import { buildSpeakingV2ControlResponse } from '../_shared/speakingV2ControlResponse.ts';
import {
  isSpeakingSessionExpired,
  prepareSpeakingTurnState,
  SPEAKING_EXPIRED_MESSAGE,
  toExpiredSpeakingState,
} from '../_shared/speakingV2Availability.ts';
import {
  parseSpeakingQuestionRows,
  type SpeakingQuestion,
} from '../_shared/speakingV2Questions.ts';

declare const Deno: any;
declare const EdgeRuntime: any;

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const MAX_PRONUNCIATION_BYTES = Math.round(1.2 * 1024 * 1024);

type StateRow = {
  test_session_id: string;
  passage_id: string;
  mode: SpeakingMode;
  status: string;
  current_part: number;
  current_question_index: number;
  revision: number;
  clarification_count: number;
  turns_used: number;
  turn_limit: number;
  remaining_active_seconds: number | null;
  expires_at: string | null;
  resume_expires_at: string | null;
};

type Question = SpeakingQuestion;

function responseJson(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string>
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

function publicState(state: StateRow, questionCount?: number) {
  return {
    part: Number(state.current_part),
    questionNumber: Number(state.current_question_index),
    revision: Number(state.revision),
    status: state.status,
    mode: state.mode,
    remainingTurns: Math.max(0, Number(state.turn_limit) - Number(state.turns_used)),
    expiresAt: state.expires_at,
    resumeExpiresAt: state.resume_expires_at,
    remainingActiveSeconds: state.remaining_active_seconds,
    ...(questionCount && questionCount > 0 ? { questionCount } : {}),
  };
}

function decodeState(value: any): StateRow {
  return (value?.state || value) as StateRow;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function isFailedTranscript(value: string) {
  const clean = String(value || '').trim();
  return !clean || clean === '(Inaudible)' || clean.includes('(Unable to transcribe');
}

async function getOwnedState(supabase: any, authId: string, sessionId: string) {
  const { data, error } = await supabase
    .from('speaking_session_state')
    .select('*, users!inner(auth_id)')
    .eq('test_session_id', sessionId)
    .eq('users.auth_id', authId)
    .maybeSingle();
  if (error || !data) return null;
  return data as StateRow;
}

async function loadQuestions(supabase: any, state: StateRow) {
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_text, correct_answer, question_number')
    .eq('passage_id', state.passage_id)
    .eq('question_number', state.current_part)
    .order('id', { ascending: true });
  if (error) throw new Error(`Could not load speaking questions: ${error.message}`);
  const questions = parseSpeakingQuestionRows(data || [], state.current_part);
  if (questions.length === 0) throw new Error('No speaking questions found for this part');
  return questions;
}

function firstQuestionResponse(state: StateRow, questions: Question[]) {
  return buildSpeakingV2ControlResponse({
    state: publicState(state, questions.length),
    questions,
  });
}

/**
 * Keep the learner-facing session summary aligned with the private V2 state.
 * This repairs the learner-facing summary after an ownership-checked server
 * operation; it deliberately never trusts a browser progress or evaluation flag.
 */
async function synchronizeV2SessionSummary(supabase: any, state: StateRow, questions: Question[]) {
  const { data: session, error } = await supabase
    .from('test_sessions')
    .select('content_data, answers, is_completed, evaluation_status')
    .eq('id', state.test_session_id)
    .maybeSingle();
  if (error || !session) return;

  const isInProgress = ['active', 'paused', 'part_complete'].includes(state.status);
  const isAwaitingEvaluation = state.status === 'ready_for_evaluation';
  const shouldKeepLearnerSessionOpen = isInProgress || isAwaitingEvaluation;
  const contentData = {
    ...(session.content_data || {}),
    speakingVersion: 'v2',
    currentPart: state.current_part,
    isPartComplete: state.status === 'part_complete',
    speakingV2State: publicState(state, questions.length),
    ...(shouldKeepLearnerSessionOpen ? { evaluationPending: false } : {}),
  };
  const answers = {
    ...(session.answers || {}),
    currentQuestionIndex: state.current_question_index,
  };
  const { error: updateError } = await supabase
    .from('test_sessions')
    .update({
      content_data: contentData,
      answers,
      ...(shouldKeepLearnerSessionOpen
        ? { is_completed: false, evaluation_status: 'not_requested' }
        : {}),
    })
    .eq('id', state.test_session_id);
  if (updateError)
    console.warn('Could not synchronize Speaking V2 session summary', updateError.message);
}

async function synchronizeExpiredV2SessionSummary(supabase: any, state: StateRow) {
  const { data: session, error } = await supabase
    .from('test_sessions')
    .select('content_data, answers')
    .eq('id', state.test_session_id)
    .maybeSingle();
  if (error || !session) return;

  const expiredState = toExpiredSpeakingState(publicState(state));
  const { error: updateError } = await supabase
    .from('test_sessions')
    .update({
      content_data: {
        ...(session.content_data || {}),
        speakingVersion: 'v2',
        currentPart: state.current_part,
        isPartComplete: false,
        evaluationPending: false,
        speakingV2State: expiredState,
      },
      answers: {
        ...(session.answers || {}),
        currentQuestionIndex: state.current_question_index,
      },
    })
    .eq('id', state.test_session_id);
  if (updateError) {
    console.warn('Could not synchronize expired Speaking V2 session summary', updateError.message);
  }
}

async function handleStart(params: {
  body: any;
  supabase: any;
  authId: string;
  corsHeaders: Record<string, string>;
}) {
  const mode: SpeakingMode = params.body.mode === 'practice' ? 'practice' : 'exam';
  const sessionId = String(params.body.sessionId || '');
  if (!sessionId) return responseJson({ error: 'sessionId is required' }, 400, params.corsHeaders);

  const { data: profile } = await params.supabase
    .from('users')
    .select('id')
    .eq('auth_id', params.authId)
    .maybeSingle();
  const { data: ownedSession } = profile
    ? await params.supabase
        .from('test_sessions')
        .select('id')
        .eq('id', sessionId)
        .eq('user_id', profile.id)
        .eq('test_type', 'speaking')
        .maybeSingle()
    : { data: null };
  if (!ownedSession) {
    return responseJson({ error: 'Speaking session not found' }, 404, params.corsHeaders);
  }

  const quota = await reserveDatabaseQuota(
    params.supabase,
    params.authId,
    'processSpeakingSession_start',
    'speaking',
    `speaking-session:${sessionId}`,
    { speakingSessionId: sessionId, mode, speakingVersion: 'v2' }
  );
  if (!quota.allowed) return quotaExceededResponse(quota, params.corsHeaders);
  const { data, error } = await params.supabase.rpc('start_speaking_v2_session', {
    p_auth_id: params.authId,
    p_test_session_id: sessionId,
    p_mode: mode,
  });
  if (error) {
    if (!quota.alreadyReserved && quota.reservationId) {
      await finalizeApiUsage(
        params.supabase,
        quota.reservationId,
        0,
        false,
        { speakingSessionId: sessionId, failureReason: 'state_start_failed' },
        'failed'
      );
    }
    throw new Error(error.message);
  }
  if (!quota.alreadyReserved && quota.reservationId) {
    await finalizeApiUsage(params.supabase, quota.reservationId, 0, false, {
      speakingSessionId: sessionId,
      mode,
      speakingVersion: 'v2',
      sessionStarted: true,
    });
  }
  const state = decodeState(data);
  if (isSpeakingSessionExpired(state)) {
    await synchronizeExpiredV2SessionSummary(params.supabase, state);
    return responseJson(
      { error: SPEAKING_EXPIRED_MESSAGE, state: toExpiredSpeakingState(publicState(state)) },
      410,
      params.corsHeaders
    );
  }
  const questions = await loadQuestions(params.supabase, state);
  await synchronizeV2SessionSummary(params.supabase, state, questions);
  return responseJson(firstQuestionResponse(state, questions), 200, params.corsHeaders);
}

async function handleControl(params: {
  body: any;
  supabase: any;
  authId: string;
  corsHeaders: Record<string, string>;
}) {
  const sessionId = String(params.body.sessionId || '');
  const action = String(params.body.action || 'resume');
  if (!sessionId) return responseJson({ error: 'sessionId is required' }, 400, params.corsHeaders);

  let state: StateRow | null = null;
  if (action === 'advance_part') {
    const currentState = await getOwnedState(params.supabase, params.authId, sessionId);
    if (!currentState)
      return responseJson({ error: 'Speaking V2 session not found' }, 404, params.corsHeaders);
    if (
      currentState.status !== 'part_complete' ||
      currentState.revision !== Number(params.body.expectedRevision)
    ) {
      return responseJson(
        { error: 'Speaking state conflict', state: publicState(currentState) },
        409,
        params.corsHeaders
      );
    }
    const { data, error } = await params.supabase.rpc('advance_speaking_v2_part', {
      p_auth_id: params.authId,
      p_test_session_id: sessionId,
      p_expected_revision: Number(params.body.expectedRevision),
    });
    if (error || data?.allowed === false) {
      const conflictState = data?.state ? decodeState(data.state) : currentState;
      return responseJson(
        { error: 'Speaking state conflict', state: publicState(conflictState) },
        409,
        params.corsHeaders
      );
    }
    state = decodeState(data);
  } else if (action === 'finish_exam') {
    const { data, error } = await params.supabase.rpc('finish_speaking_v2_exam', {
      p_auth_id: params.authId,
      p_test_session_id: sessionId,
    });
    if (error) return responseJson({ error: error.message }, 409, params.corsHeaders);
    state = decodeState(data);
  } else if (['heartbeat', 'pause', 'resume_practice'].includes(action)) {
    const { data, error } = await params.supabase.rpc('touch_speaking_v2_practice', {
      p_auth_id: params.authId,
      p_test_session_id: sessionId,
      p_action: action === 'resume_practice' ? 'resume' : action,
    });
    if (error) return responseJson({ error: error.message }, 409, params.corsHeaders);
    state = decodeState(data);
  } else {
    state = await getOwnedState(params.supabase, params.authId, sessionId);
  }
  if (!state)
    return responseJson({ error: 'Speaking V2 session not found' }, 404, params.corsHeaders);
  if (isSpeakingSessionExpired(state)) {
    await synchronizeExpiredV2SessionSummary(params.supabase, state);
    return responseJson(
      { error: SPEAKING_EXPIRED_MESSAGE, state: toExpiredSpeakingState(publicState(state)) },
      410,
      params.corsHeaders
    );
  }
  const questions = await loadQuestions(params.supabase, state);
  await synchronizeV2SessionSummary(params.supabase, state, questions);
  return responseJson(firstQuestionResponse(state, questions), 200, params.corsHeaders);
}

function mapReservationFailure(reason: string) {
  if (reason === 'expired') return { status: 410, error: 'Speaking session expired' };
  if (reason === 'burst_limit') return { status: 429, error: 'Too many speaking turns' };
  if (reason === 'turn_limit' || reason === 'audio_limit') {
    return { status: 429, error: 'Speaking response limit reached for this test' };
  }
  return { status: 409, error: 'Speaking state conflict' };
}

async function transcribeAudio(params: {
  audioBase64: string;
  audioMimeType: string;
  audioDurationMs: number;
  browserHint: { transcript: string; confidence: number } | null;
}) {
  const startedAt = Date.now();
  let transcript = '';
  let provider = 'cloudflare';
  let model = '';
  let tokensUsed = 0;
  let verificationReason: string | null = null;
  let attempts = 0;
  try {
    const result = await transcribeWithCloudflare({
      accountId: Deno.env.get('CLOUDFLARE_ACCOUNT_ID') || '',
      apiToken: Deno.env.get('CLOUDFLARE_AI_API_TOKEN') || '',
      audioBase64: params.audioBase64,
      audioDurationMs: params.audioDurationMs,
    });
    transcript = result.transcript;
    provider = result.provider;
    model = result.model;
    tokensUsed = result.tokensUsed;
    attempts = result.attempts;
    verificationReason = getTranscriptVerificationReason({
      cloudflareTranscript: transcript,
      browserHint: params.browserHint,
      audioDurationMs: params.audioDurationMs,
    });
    if (verificationReason && Deno.env.get('GEMINI_API_KEY')) {
      const verification = await transcribeWithGeminiFallback({
        apiKey: Deno.env.get('GEMINI_API_KEY'),
        audioBase64: params.audioBase64,
        audioMimeType: params.audioMimeType,
        browserTranscriptHint: params.browserHint?.transcript,
        audioDurationMs: params.audioDurationMs,
      });
      tokensUsed += verification.tokensUsed;
      const selected = chooseVerifiedTranscript({
        cloudflareTranscript: transcript,
        geminiTranscript: verification.transcript,
        browserHint: params.browserHint,
        reason: verificationReason,
        audioDurationMs: params.audioDurationMs,
      });
      if (selected === 'gemini-fallback') {
        transcript = verification.transcript;
        provider = verification.provider;
        model = verification.model;
      }
    }
  } catch (cloudflareError) {
    let providerError = cloudflareError;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (geminiApiKey) {
      try {
        const fallback = await transcribeWithGeminiFallback({
          apiKey: geminiApiKey,
          audioBase64: params.audioBase64,
          audioMimeType: params.audioMimeType,
          browserTranscriptHint: params.browserHint?.transcript,
          audioDurationMs: params.audioDurationMs,
        });
        transcript = fallback.transcript;
        provider = fallback.provider;
        model = fallback.model;
        tokensUsed = fallback.tokensUsed;
      } catch (fallbackError) {
        providerError = fallbackError;
      }
    }

    if (!transcript) {
      const browserRecovery = createBrowserTranscriptRecovery(params.browserHint);
      if (!browserRecovery) {
        // Silence or noise is not a provider outage. Report the answer as
        // unheard so the turn fails cleanly ("I didn't catch that", 200)
        // instead of a 500 that hands-free mode keeps retrying.
        if (/no intelligible speech/i.test(String((providerError as any)?.message || ''))) {
          transcript = '(Inaudible)';
        } else {
          throw providerError;
        }
      } else {
        transcript = browserRecovery.transcript;
        provider = browserRecovery.provider;
        model = browserRecovery.model;
      }
    }
  }
  if (isFailedTranscript(transcript) && canRecoverFromBrowserTranscript(params.browserHint)) {
    transcript = params.browserHint.transcript;
    provider = 'browser-recovery';
    model = 'web-speech-api';
  }
  return {
    transcript: transcript.trim(),
    provider,
    model,
    tokensUsed,
    attempts,
    verificationReason,
    latencyMs: Date.now() - startedAt,
  };
}

function queuePronunciationEvidence(params: {
  supabase: any;
  turnId: string;
  wavBase64: string;
  transcript: string;
  durationMs: number;
}) {
  const endpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT') || '';
  const apiKey = Deno.env.get('AZURE_SPEECH_KEY') || '';
  if (!endpoint || !apiKey) return;

  const job = assessPronunciationWithAzure({
    endpoint,
    apiKey,
    wavBase64: params.wavBase64,
    transcript: params.transcript,
    durationMs: params.durationMs,
  })
    .then(async (pronunciationData) => {
      const { data } = await params.supabase
        .from('speaking_turns')
        .select('provider_metadata')
        .eq('id', params.turnId)
        .maybeSingle();
      await params.supabase
        .from('speaking_turns')
        .update({
          provider_metadata: {
            ...(data?.provider_metadata || {}),
            pronunciationData,
          },
        })
        .eq('id', params.turnId);
    })
    .catch((error) => console.warn('Speaking V2 pronunciation evidence failed', error?.message));
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(job);
  else void job;
}

/**
 * The spoken AI coach is behind PRACTICE_COACH_ROLLOUT (off | admin | all,
 * default off). Off speaks the scripted coaching line instead.
 */
async function isPracticeCoachEnabled(supabase: any, authId: string) {
  const rollout = parsePracticeTtsRollout(Deno.env.get('PRACTICE_COACH_ROLLOUT'));
  if (rollout === 'off' || !Deno.env.get('OPENROUTER_API_KEY')) return false;
  if (rollout === 'all') return true;
  const { data } = await supabase.from('users').select('role').eq('auth_id', authId).maybeSingle();
  return isPracticeTtsAllowed(rollout, data?.role === 'admin');
}

async function handleTurn(params: {
  req: Request;
  supabase: any;
  authId: string;
  corsHeaders: Record<string, string>;
}) {
  const form = await params.req.formData();
  const sessionId = String(form.get('sessionId') || '');
  const expectedRevision = Number(form.get('expectedRevision'));
  const idempotencyKey = String(form.get('idempotencyKey') || '');
  const audio = form.get('audio');
  const pronunciationAudio = form.get('pronunciationAudio');
  const audioDurationMs = Math.max(0, Number(form.get('audioDurationMs')) || 0);
  const speechDetected = String(form.get('speechDetected') || '') === 'false' ? false : null;
  let hintInput: any[] = [];
  try {
    const parsed = JSON.parse(String(form.get('browserSpeechHint') || 'null'));
    hintInput = parsed ? [parsed] : [];
  } catch {
    hintInput = [];
  }
  const browserHint = buildBrowserTranscriptHint(hintInput);

  if (!sessionId || !Number.isInteger(expectedRevision) || !idempotencyKey) {
    return responseJson({ error: 'Invalid Speaking V2 turn request' }, 400, params.corsHeaders);
  }
  if (!(audio instanceof File) || audio.size < 1000 || audio.size > MAX_AUDIO_BYTES) {
    return responseJson(
      { error: 'Audio payload is missing or too large' },
      413,
      params.corsHeaders
    );
  }
  if (pronunciationAudio instanceof File && pronunciationAudio.size > MAX_PRONUNCIATION_BYTES) {
    return responseJson({ error: 'Pronunciation sample is too large' }, 413, params.corsHeaders);
  }

  let state = await getOwnedState(params.supabase, params.authId, sessionId);
  if (!state)
    return responseJson({ error: 'Speaking V2 session not found' }, 404, params.corsHeaders);
  if (isSpeakingSessionExpired(state)) {
    await synchronizeExpiredV2SessionSummary(params.supabase, state);
    return responseJson(
      { error: SPEAKING_EXPIRED_MESSAGE, state: toExpiredSpeakingState(publicState(state)) },
      410,
      params.corsHeaders
    );
  }
  state = await prepareSpeakingTurnState(state, expectedRevision, async () => {
    const { data, error } = await params.supabase.rpc('touch_speaking_v2_practice', {
      p_auth_id: params.authId,
      p_test_session_id: sessionId,
      p_action: 'resume',
    });
    if (error) throw new Error(error.message);
    return decodeState(data);
  });
  if (isSpeakingSessionExpired(state)) {
    await synchronizeExpiredV2SessionSummary(params.supabase, state);
    return responseJson(
      { error: SPEAKING_EXPIRED_MESSAGE, state: toExpiredSpeakingState(publicState(state)) },
      410,
      params.corsHeaders
    );
  }
  const questions = await loadQuestions(params.supabase, state);
  const questionIndex = Math.min(state.current_question_index, questions.length - 1);
  const question = questions[questionIndex];

  if (state.revision !== expectedRevision || state.status !== 'active') {
    return responseJson(
      { error: 'Speaking state conflict', state: publicState(state, questions.length) },
      409,
      params.corsHeaders
    );
  }
  if (state.mode === 'exam' && state.expires_at && Date.now() >= Date.parse(state.expires_at)) {
    return responseJson({ error: 'Speaking session expired' }, 410, params.corsHeaders);
  }

  if (shouldGuardSilentSpeech(speechDetected, browserHint)) {
    return responseJson(
      {
        success: true,
        revision: state.revision,
        transcriptStatus: 'inaudible',
        action: 'repeat_prompt',
        examinerText: "I didn't hear an answer. Please try again.",
        examinerResponse: "I didn't hear an answer. Please try again.",
        userTranscript: '(Inaudible)',
        state: publicState(state, questions.length),
      },
      200,
      params.corsHeaders
    );
  }

  const { data: reservation, error: reservationError } = await params.supabase.rpc(
    'reserve_speaking_v2_turn',
    {
      p_auth_id: params.authId,
      p_test_session_id: sessionId,
      p_expected_revision: expectedRevision,
      p_idempotency_key: idempotencyKey,
      p_audio_duration_ms: audioDurationMs,
    }
  );
  if (reservationError) throw new Error(reservationError.message);
  if (reservation?.alreadyReserved && reservation?.response) {
    return responseJson({ ...reservation.response, cached: true }, 200, params.corsHeaders);
  }
  if (!reservation?.allowed) {
    const failure = mapReservationFailure(String(reservation?.reason || 'conflict'));
    return responseJson(
      {
        error: failure.error,
        rateLimitType:
          reservation?.reason === 'turn_limit' || reservation?.reason === 'audio_limit'
            ? 'speaking_turn'
            : reservation?.reason === 'burst_limit'
              ? 'burst'
              : 'state',
        retryAfterSeconds: reservation?.retryAfterSeconds,
        state: reservation?.state ? publicState(reservation.state, questions.length) : undefined,
      },
      failure.status,
      params.corsHeaders
    );
  }

  const turnId = String(reservation.turnId);
  try {
    const uploadStartedAt = Date.now();
    const audioBytes = new Uint8Array(await audio.arrayBuffer());
    const uploadLatencyMs = Date.now() - uploadStartedAt;
    const transcription = await transcribeAudio({
      audioBase64: bytesToBase64(audioBytes),
      audioMimeType: audio.type || 'audio/webm',
      audioDurationMs,
      browserHint,
    });
    if (isFailedTranscript(transcription.transcript)) {
      await params.supabase.rpc('fail_speaking_v2_turn', {
        p_auth_id: params.authId,
        p_turn_id: turnId,
        p_reason: 'transcription_failed',
      });
      return responseJson(
        {
          success: true,
          revision: state.revision,
          transcriptStatus: 'failed',
          action: 'repeat_prompt',
          examinerText: "I didn't catch that. Please repeat your answer.",
          examinerResponse: "I didn't catch that. Please repeat your answer.",
          userTranscript: '(Inaudible)',
          state: publicState(state, questions.length),
        },
        200,
        params.corsHeaders
      );
    }

    // The coach reply runs alongside the turn decision so the learner waits
    // for the slower of the two, not both. Meta requests ("can you repeat")
    // never reach the coach.
    const coachEnabled =
      state.mode === 'practice' && (await isPracticeCoachEnabled(params.supabase, params.authId));
    let coachError = '';
    const coachPromise: Promise<PracticeCoachResult | null> =
      coachEnabled && !getDeterministicSpeakingDecision(transcription.transcript)
        ? generatePracticeCoachReply({
            apiKey: Deno.env.get('OPENROUTER_API_KEY') || '',
            partNumber: state.current_part,
            question: question.text,
            transcript: transcription.transcript,
          }).catch((error: any) => {
            console.warn('[PracticeCoach] Falling back to the scripted line:', error?.message);
            coachError = String(error?.message || error || 'Practice coach failed').slice(0, 240);
            return null;
          })
        : Promise.resolve(null);
    const decision = await decideSpeakingTurn({
      transcript: transcription.transcript,
      question: question.text,
      partNumber: state.current_part,
      mode: state.mode,
      geminiApiKey: Deno.env.get('GEMINI_API_KEY'),
    });
    const isLastQuestion = questionIndex >= questions.length - 1;
    const resolved = resolveSpeakingAction({
      decision,
      transcript: transcription.transcript,
      audioDurationMs,
      partNumber: state.current_part,
      isLastQuestion,
      clarificationCount: state.clarification_count,
    });
    const completesPart = resolved.action === 'complete_part';
    const advancesQuestion = resolved.action === 'advance';
    const nextQuestionIndex = advancesQuestion
      ? Math.min(questionIndex + 1, questions.length - 1)
      : questionIndex;
    const nextQuestion = advancesQuestion ? questions[nextQuestionIndex]?.text : null;
    const nextStatus = completesPart
      ? state.current_part === 3
        ? 'ready_for_evaluation'
        : 'part_complete'
      : 'active';
    let examinerText = buildSpeakingExaminerText({
      action: resolved.action,
      question: question.text,
      nextQuestion,
      partNumber: state.current_part,
      classification: decision.classification,
    });
    // Practice mode: the coach speaks (react, correct, suggest), then the
    // bank's next question, or the examiner asking again when the answer
    // missed it. There is no written card. When the AI coach is off or fails,
    // the scripted tip is spoken instead. Meta requests and a Part 2 long turn
    // in progress keep the examiner script alone.
    let coachReply: PracticeCoachResult | null = null;
    // Health telemetry: 'ai' replied; 'fallback' means the coach was on but
    // failed, so the scripted tip played; 'scripted' means the coach is off.
    let coachSource: 'ai' | 'fallback' | 'scripted' | 'none' = 'none';
    if (
      state.mode === 'practice' &&
      shouldSpeakPracticeCoach(resolved.action, decision.classification)
    ) {
      coachReply = coachEnabled ? await coachPromise : null;
      const scripted = decision.coachingCode ? SPEAKING_COACHING_TEXT[decision.coachingCode] : '';
      const coachSpoken = coachReply?.spoken || scripted || '';
      coachSource = coachReply
        ? 'ai'
        : coachEnabled
          ? 'fallback'
          : coachSpoken
            ? 'scripted'
            : 'none';
      if (coachSpoken) {
        examinerText = composePracticeSpokenReply({
          coachSpoken,
          action: resolved.action,
          nextQuestion,
          examinerText,
          questionIndex: nextQuestionIndex,
          partNumber: state.current_part,
        });
      }
    }
    const projectedState = {
      ...publicState(state, questions.length),
      revision: state.revision + 1,
      questionNumber: nextQuestionIndex,
      status: nextStatus,
      remainingTurns: Math.max(0, state.turn_limit - state.turns_used - 1),
    };
    const responsePayload = {
      success: true,
      revision: state.revision + 1,
      transcriptStatus: 'ready',
      action: resolved.action,
      examinerText,
      examinerResponse: examinerText,
      userTranscript: transcription.transcript,
      nextQuestionIndex,
      isPartComplete: completesPart,
      state: projectedState,
    };
    const { data: finalized, error: finalizeError } = await params.supabase.rpc(
      'finalize_speaking_v2_turn',
      {
        p_auth_id: params.authId,
        p_turn_id: turnId,
        p_result: {
          questionId: question.id,
          transcript: transcription.transcript,
          transcriptStatus: 'ready',
          classification: decision.classification,
          relevance: decision.relevance,
          answerDepth: decision.answerDepth,
          isValidAnswer: resolved.isValidAnswer,
          semanticDegraded: decision.semanticDegraded,
          evidenceQuote: decision.evidenceQuote,
          coachingCode: decision.coachingCode,
          action: resolved.action,
          provider: {
            transcriptionProvider: transcription.provider,
            transcriptionModel: transcription.model,
            semantic: decision.provider,
            ...(state.mode === 'practice'
              ? {
                  coach: coachReply
                    ? {
                        source: 'ai',
                        model: coachReply.model,
                        estimatedProviderCostUsd: coachReply.estimatedProviderCostUsd,
                      }
                    : {
                        source: coachSource,
                        ...(coachSource === 'fallback'
                          ? { error: coachError || 'No usable coach reply' }
                          : {}),
                      },
                }
              : {}),
          },
          latency: {
            uploadMs: uploadLatencyMs,
            transcriptionMs: transcription.latencyMs,
            semanticDecisionMs: decision.latencyMs,
            ...(coachReply ? { coachMs: coachReply.latencyMs } : {}),
          },
          state: {
            part: state.current_part,
            questionNumber: nextQuestionIndex,
            clarificationCount: resolved.clarificationCount,
            status: nextStatus,
          },
          response: responsePayload,
        },
      }
    );
    if (finalizeError) throw new Error(finalizeError.message);
    const authoritativeState = decodeState(finalized);

    if (pronunciationAudio instanceof File && pronunciationAudio.size > 0) {
      const wavBytes = new Uint8Array(await pronunciationAudio.arrayBuffer());
      queuePronunciationEvidence({
        supabase: params.supabase,
        turnId,
        wavBase64: bytesToBase64(wavBytes),
        transcript: transcription.transcript,
        durationMs: audioDurationMs,
      });
    }
    if (['part_complete', 'ready_for_evaluation'].includes(authoritativeState.status)) {
      await synchronizeV2SessionSummary(params.supabase, authoritativeState, questions);
    }
    return responseJson(
      {
        ...responsePayload,
        revision: authoritativeState.revision,
        state: publicState(authoritativeState, questions.length),
      },
      200,
      params.corsHeaders
    );
  } catch (error: any) {
    await params.supabase.rpc('fail_speaking_v2_turn', {
      p_auth_id: params.authId,
      p_turn_id: turnId,
      p_reason: error?.message || 'turn_failed',
    });
    throw error;
  }
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return responseJson({ error: 'Method not allowed' }, 405, corsHeaders);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );
  try {
    const authHeader = req.headers.get('Authorization');
    const { data, error } = await supabase.auth.getUser(authHeader?.split(' ')[1]);
    if (error || !data.user) return responseJson({ error: 'Unauthorized' }, 401, corsHeaders);

    if ((req.headers.get('content-type') || '').includes('multipart/form-data')) {
      return await handleTurn({ req, supabase, authId: data.user.id, corsHeaders });
    }
    const body = await req.json();
    return body.action === 'start'
      ? await handleStart({ body, supabase, authId: data.user.id, corsHeaders })
      : await handleControl({ body, supabase, authId: data.user.id, corsHeaders });
  } catch (error: any) {
    console.error('Speaking V2 failed', error?.message || error);
    return responseJson(
      { success: false, error: 'Unable to process this speaking turn. Please try again.' },
      500,
      corsHeaders
    );
  }
});

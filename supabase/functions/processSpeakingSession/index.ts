// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  getCorsHeaders,
  checkRateLimit,
  getRateLimitIdentifier,
  getBurstLimitConfig,
  checkTierAccess,
  reserveDatabaseQuota,
  finalizeApiUsage,
  quotaExceededResponse,
} from '../_shared/security.ts';
import {
  assessPronunciationWithAzure,
  buildDeterministicExaminerResponse,
  CLOUDFLARE_COST_PER_AUDIO_MINUTE_USD,
  transcribeWithCloudflare,
  transcribeWithGeminiFallback,
} from '../_shared/speakingProviders.ts';

declare const Deno: any;

const MAX_TURNS_PER_PART: Record<number, number> = { 1: 8, 2: 2, 3: 8 };
const MAX_TOTAL_TURNS = 20;
const MAX_AUDIO_PAYLOAD_BYTES = 5 * 1024 * 1024;
const MAX_PRONUNCIATION_AUDIO_BYTES = Math.round(1.2 * 1024 * 1024);
const MAX_TRANSCRIPT_CHARS = 6000;
const MAX_HISTORY_ENTRY_CHARS = 2000;
const MAX_QUESTION_CONTEXT_CHARS = 2000;
const MIN_PRONUNCIATION_DURATION_MS = 6000;
const MAX_PRONUNCIATION_DURATION_MS = 30000;

interface SpeakingQuestion {
  id: string;
  question_text: string;
  part_number: number;
}

function jsonResponse(data: Record<string, unknown>, status: number, corsHeaders: HeadersInit) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function estimatedBase64Bytes(value: unknown): number {
  return typeof value === 'string' ? Math.ceil(value.length * 0.75) : 0;
}

function parseSpeakingQuestions(rows: any[], partNumber: number): SpeakingQuestion[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const first = rows[0];
  const source = first.correct_answer || '';

  try {
    const parsed = JSON.parse(source);
    if (Array.isArray(parsed)) {
      return parsed
        .map((question: any, index: number) => ({
          id: `${first.id}-${index}`,
          question_text:
            typeof question === 'string' ? question : question?.text || question?.question || '',
          part_number: partNumber,
        }))
        .filter((question) => question.question_text.trim());
    }
  } catch {
    // Fall through to the legacy newline format.
  }

  return rows.flatMap((row: any) => {
    const text = row.correct_answer || row.question_text || '';
    return String(text)
      .split('\n')
      .map((line: string, index: number) => ({
        id: `${row.id}-${index}`,
        question_text: line.trim(),
        part_number: row.question_number || partNumber,
      }))
      .filter((question: SpeakingQuestion) => question.question_text);
  });
}

function isFailedTranscript(value: string): boolean {
  const clean = String(value || '').trim();
  return (
    !clean ||
    clean === '(Inaudible)' ||
    clean.includes('(Unable to transcribe') ||
    clean.includes('(Audio received but transcription failed)')
  );
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method === 'POST') {
    try {
      const pingBody = await req.clone().json();
      if (pingBody?.ping === true) return jsonResponse({ pong: true }, 200, corsHeaders);
    } catch {
      // Continue with the authenticated request.
    }
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  let activeReservationId: string | undefined;

  try {
    const authHeader = req.headers.get('Authorization');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader?.split(' ')[1]);
    if (authError || !user) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);

    const { data: userProfile } = await supabase
      .from('users')
      .select('id, subscription_tier')
      .eq('auth_id', user.id)
      .single();
    if (!userProfile?.id)
      return jsonResponse({ error: 'User profile not found' }, 404, corsHeaders);

    const tier = String(userProfile.subscription_tier || 'free').toLowerCase();
    const tierDenied = checkTierAccess(
      tier,
      ['free', 'pro', 'premium', 'admin'],
      corsHeaders,
      'Speaking Practice'
    );
    if (tierDenied) return tierDenied;

    const burstCheck = checkRateLimit(
      getRateLimitIdentifier(req, user.id),
      getBurstLimitConfig(tier)
    );
    if (!burstCheck.allowed) {
      return jsonResponse(
        {
          error: 'Rate limit exceeded (Burst)',
          message: 'Too many requests in a short period. Please wait a moment.',
        },
        429,
        corsHeaders
      );
    }

    const {
      testId,
      speakingSessionId: requestedSpeakingSessionId,
      turnId,
      partNumber: rawPartNumber,
      audioBase64,
      audioMimeType = 'audio/webm',
      audioDurationMs = null,
      userTranscript,
      conversationHistory = [],
      currentQuestionIndex = 0,
      questionContext = '',
      pronunciationAudioBase64 = null,
      pronunciationDurationMs = null,
      requestPronunciation = false,
    } = await req.json();
    const partNumber = Number(rawPartNumber);

    if (!testId || ![1, 2, 3].includes(partNumber)) {
      return jsonResponse(
        { error: 'A valid testId and partNumber are required' },
        400,
        corsHeaders
      );
    }
    if (!Array.isArray(conversationHistory)) {
      return jsonResponse({ error: 'conversationHistory must be an array' }, 400, corsHeaders);
    }

    const promptTextSize =
      String(userTranscript || '').length +
      String(questionContext || '').length +
      conversationHistory.reduce(
        (total: number, entry: { text?: unknown }) => total + String(entry?.text || '').length,
        0
      );
    const hasOversizedHistoryEntry = conversationHistory.some(
      (entry: { text?: unknown }) => String(entry?.text || '').length > MAX_HISTORY_ENTRY_CHARS
    );
    if (
      promptTextSize > MAX_TRANSCRIPT_CHARS ||
      String(questionContext || '').length > MAX_QUESTION_CONTEXT_CHARS ||
      hasOversizedHistoryEntry
    ) {
      return jsonResponse(
        { error: 'Speaking input exceeds maximum allowed size' },
        413,
        corsHeaders
      );
    }

    if (estimatedBase64Bytes(audioBase64) > MAX_AUDIO_PAYLOAD_BYTES) {
      return jsonResponse(
        {
          error: 'Audio too large',
          message: 'Your recording is too long. Please keep responses under 2 minutes.',
          success: false,
        },
        400,
        corsHeaders
      );
    }
    if (estimatedBase64Bytes(pronunciationAudioBase64) > MAX_PRONUNCIATION_AUDIO_BYTES) {
      return jsonResponse(
        {
          error: 'Pronunciation sample too large',
          message: 'Pronunciation samples must be no longer than 30 seconds.',
          success: false,
        },
        400,
        corsHeaders
      );
    }

    let sessionQuery = supabase
      .from('test_sessions')
      .select('id, passage_id, test_type')
      .eq('user_id', userProfile.id)
      .eq('test_type', 'speaking');
    sessionQuery = requestedSpeakingSessionId
      ? sessionQuery.eq('id', requestedSpeakingSessionId)
      : sessionQuery.eq('passage_id', testId).order('created_at', { ascending: false }).limit(1);
    const { data: ownedSession, error: sessionError } = await sessionQuery.maybeSingle();
    if (sessionError || !ownedSession) {
      return jsonResponse({ error: 'Speaking session not found' }, 404, corsHeaders);
    }
    if (ownedSession.passage_id && ownedSession.passage_id !== testId) {
      return jsonResponse({ error: 'Speaking session does not match this test' }, 400, corsHeaders);
    }
    const speakingSessionId = ownedSession.id;

    const sessionReservation = await reserveDatabaseQuota(
      supabase,
      user.id,
      'processSpeakingSession_start',
      'speaking',
      `speaking-session:${speakingSessionId}`,
      { testId, speakingSessionId }
    );
    if (!sessionReservation.allowed) return quotaExceededResponse(sessionReservation, corsHeaders);

    const userTurnsInHistory = conversationHistory.filter(
      (entry: { speaker?: string }) => entry?.speaker === 'user'
    ).length;
    const maxForThisPart = MAX_TURNS_PER_PART[partNumber] || 8;
    if (userTurnsInHistory >= maxForThisPart || userTurnsInHistory >= MAX_TOTAL_TURNS) {
      return jsonResponse(
        {
          error: 'Turn limit reached',
          message: `Maximum responses for Part ${partNumber} reached. Please proceed to the next part.`,
          isPartComplete: true,
          nextQuestionIndex: -1,
          success: false,
        },
        200,
        corsHeaders
      );
    }

    const { data: questionRows, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_text, correct_answer, question_number')
      .eq('passage_id', testId)
      .eq('question_number', partNumber)
      .order('id', { ascending: true });
    if (questionsError) throw new Error(`Failed to fetch questions: ${questionsError.message}`);

    let questions = parseSpeakingQuestions(questionRows || [], partNumber);
    if (partNumber === 2 && questions.length > 1) questions = [questions[0]];
    if (questions.length === 0) {
      return jsonResponse({ error: 'No questions found for this test part' }, 404, corsHeaders);
    }

    const stableTurnId =
      typeof turnId === 'string' && turnId.length >= 16 && turnId.length <= 100
        ? turnId
        : `${partNumber}:${currentQuestionIndex}:${userTurnsInHistory}`;
    const turnReservation = await reserveDatabaseQuota(
      supabase,
      user.id,
      'processSpeakingSession',
      'speaking_turn',
      `speaking-turn:${speakingSessionId}:${stableTurnId}`,
      { testId, speakingSessionId, part: partNumber, questionIndex: currentQuestionIndex }
    );
    if (!turnReservation.allowed) return quotaExceededResponse(turnReservation, corsHeaders);
    activeReservationId = turnReservation.reservationId;

    const safeQuestionIndex =
      Number(currentQuestionIndex) < 0
        ? 0
        : Math.min(Number(currentQuestionIndex), questions.length - 1);
    const isLastQuestion = safeQuestionIndex >= questions.length - 1;
    const nextQuestionIndex = isLastQuestion ? -1 : safeQuestionIndex + 1;
    const nextQuestion = nextQuestionIndex >= 0 ? questions[nextQuestionIndex] : null;

    let transcript = String(userTranscript || '')
      .replace(/\s+/g, ' ')
      .trim();
    let transcriptionProvider = transcript ? 'client-text' : 'none';
    let transcriptionModel = transcript ? 'browser' : 'none';
    let transcriptionLatencyMs = 0;
    let tokensUsed = 0;
    let transcriptionError: string | null = null;

    if (audioBase64 && !transcript) {
      try {
        if (!Deno.env.get('CLOUDFLARE_ACCOUNT_ID') || !Deno.env.get('CLOUDFLARE_AI_API_TOKEN')) {
          throw new Error('Cloudflare Workers AI credentials are not configured');
        }
        const result = await transcribeWithCloudflare({
          accountId: Deno.env.get('CLOUDFLARE_ACCOUNT_ID') || '',
          apiToken: Deno.env.get('CLOUDFLARE_AI_API_TOKEN') || '',
          audioBase64,
        });
        transcript = result.transcript;
        transcriptionProvider = result.provider;
        transcriptionModel = result.model;
        transcriptionLatencyMs = result.latencyMs;
      } catch (cloudflareError: any) {
        transcriptionError = cloudflareError?.message || 'Cloudflare transcription failed';
        console.warn(transcriptionError);
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';
        if (geminiApiKey) {
          try {
            const fallback = await transcribeWithGeminiFallback({
              apiKey: geminiApiKey,
              audioBase64,
              audioMimeType,
            });
            transcript = fallback.transcript;
            transcriptionProvider = fallback.provider;
            transcriptionModel = fallback.model;
            transcriptionLatencyMs = fallback.latencyMs;
            tokensUsed = fallback.tokensUsed;
          } catch (fallbackError: any) {
            transcriptionError = fallbackError?.message || transcriptionError;
          }
        }
      }
    }

    const transcriptionFailed = isFailedTranscript(transcript);
    if (transcriptionFailed) transcript = '(Inaudible)';

    let pronunciationData: Record<string, unknown> | null = null;
    let pronunciationError: string | null = null;
    const pronunciationDuration = Number(pronunciationDurationMs);
    const shouldAssessPronunciation =
      !transcriptionFailed &&
      requestPronunciation === true &&
      [1, 3].includes(partNumber) &&
      typeof pronunciationAudioBase64 === 'string' &&
      pronunciationAudioBase64.length > 0 &&
      Number.isFinite(pronunciationDuration) &&
      pronunciationDuration >= MIN_PRONUNCIATION_DURATION_MS &&
      pronunciationDuration <= MAX_PRONUNCIATION_DURATION_MS;

    if (shouldAssessPronunciation) {
      const azureSpeechKey = Deno.env.get('AZURE_SPEECH_KEY') || '';
      const azureSpeechRegion = Deno.env.get('AZURE_SPEECH_REGION') || '';
      const azureSpeechEndpoint =
        Deno.env.get('AZURE_SPEECH_ENDPOINT') ||
        (azureSpeechRegion ? `https://${azureSpeechRegion}.stt.speech.microsoft.com` : '');
      if (azureSpeechKey && azureSpeechEndpoint) {
        try {
          pronunciationData = await assessPronunciationWithAzure({
            endpoint: azureSpeechEndpoint,
            apiKey: azureSpeechKey,
            wavBase64: pronunciationAudioBase64,
            transcript,
            durationMs: pronunciationDuration,
          });
        } catch (error: any) {
          pronunciationError = error?.message || 'Pronunciation assessment failed';
          console.warn(pronunciationError);
        }
      } else {
        pronunciationError = 'Azure Speech credentials are not configured';
      }
    }

    const examinerResponse = transcriptionFailed
      ? "I'm sorry, I didn't quite catch that. Could you please say that again?"
      : buildDeterministicExaminerResponse({
          partNumber,
          currentQuestionIndex: safeQuestionIndex,
          nextQuestion: nextQuestion?.question_text,
          isLastQuestion,
        });
    const normalizedAudioDurationMs = Math.max(0, Number(audioDurationMs) || 0);
    const transcriptionCostUsd =
      transcriptionProvider === 'cloudflare'
        ? (normalizedAudioDurationMs / 60000) * CLOUDFLARE_COST_PER_AUDIO_MINUTE_USD
        : 0;
    const pronunciationCostUsd = Number(pronunciationData?.estimatedCostUsd) || 0;
    const estimatedProviderCostUsd = transcriptionCostUsd + pronunciationCostUsd;

    await finalizeApiUsage(supabase, activeReservationId, tokensUsed, false, {
      part: partNumber,
      isPartComplete: isLastQuestion && !transcriptionFailed,
      hasAudio: Boolean(audioBase64),
      audioDurationMs: normalizedAudioDurationMs,
      transcriptionFailed,
      transcriptionProvider,
      transcriptionModel,
      transcriptionLatencyMs,
      transcriptionCostUsd,
      transcriptionError,
      pronunciationRequested: requestPronunciation === true,
      pronunciationCompleted: Boolean(pronunciationData),
      pronunciationProvider: pronunciationData?.provider || null,
      pronunciationDurationMs: pronunciationData?.durationMs || 0,
      pronunciationLatencyMs: pronunciationData?.latencyMs || 0,
      pronunciationCostUsd,
      pronunciationError,
      estimatedProviderCostUsd,
      examinerMode: 'deterministic-v1',
      examinerVoice: 'en-GB-Neural2-B',
      speakingSessionId,
    });
    activeReservationId = undefined;

    return jsonResponse(
      {
        success: true,
        examinerResponse,
        userTranscript: transcript,
        currentQuestionIndex,
        nextQuestionIndex: transcriptionFailed ? currentQuestionIndex : nextQuestionIndex,
        isPartComplete: isLastQuestion && !transcriptionFailed,
        totalQuestions: questions.length,
        pronunciationData,
        processing: {
          transcriptionProvider,
          transcriptionLatencyMs,
          pronunciationCompleted: Boolean(pronunciationData),
          estimatedProviderCostUsd,
        },
      },
      200,
      corsHeaders
    );
  } catch (error: any) {
    console.error('Error in processSpeakingSession:', error);
    if (activeReservationId) {
      await finalizeApiUsage(
        supabase,
        activeReservationId,
        0,
        false,
        { failureReason: error?.message || 'Internal server error' },
        'failed'
      );
    }
    return jsonResponse(
      { error: error?.message || 'Internal server error', success: false },
      500,
      corsHeaders
    );
  }
});

// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore - Use npm: specifier for Node compatibility
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  getCorsHeaders,
  checkRateLimit,
  getRateLimitIdentifier,
  getBurstLimitConfig,
  checkTierAccess,
  reserveDatabaseQuota,
  finalizeApiUsage,
  getFinalizedReservationResult,
  duplicateReservationResponse,
  quotaExceededResponse,
} from '../_shared/security.ts';
import {
  generateEvaluationPrompt,
  SPEAKING_EVALUATION_SYSTEM_PROMPT,
} from '../_shared/bandDescriptors.ts';
import {
  aggregatePronunciationEvidence,
  buildSpeakingTranscript,
  escapePromptXml,
  normalizeSpeakingEvaluation,
} from '../_shared/evaluationUtils.ts';
import { requestSpeakingEvaluation } from '../_shared/speakingEvaluationProvider.ts';
import { SPEAKING_EVALUATION_RESPONSE_SCHEMA } from '../_shared/speakingEvaluationSchema.ts';

declare const Deno: any;
const CURRENT_EVALUATION_VERSION = '2026-07-29-v5';

function buildAuthoritativeConversation(turns: Array<{ request_metadata: Record<string, any> }>) {
  const parts: Record<string, Array<{ speaker: 'user' | 'ai'; text: string }>> = {};
  const completedParts = new Set<number>();

  for (const turn of turns) {
    const metadata = turn.request_metadata || {};
    const part = Number(metadata.part);
    const response = metadata.response;
    if (!Number.isInteger(part) || part < 1 || part > 3 || !response?.success) continue;
    const transcript = String(response.userTranscript || '').trim();
    if (!transcript || transcript === '(Inaudible)') continue;
    parts[part] = parts[part] || [];
    parts[part].push({ speaker: 'user', text: transcript });
    if (response.examinerResponse) {
      parts[part].push({ speaker: 'ai', text: String(response.examinerResponse) });
    }
    if (metadata.isPartComplete === true) completedParts.add(part);
  }

  return { parts, completedParts };
}

/**
 * evaluateSpeakingTest - Final evaluation endpoint
 *
 * This endpoint is called ONLY after ALL 3 parts of the speaking test are complete.
 * It generates a comprehensive evaluation using official IELTS Band Descriptors.
 */
serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  let quotaReservationId: string | undefined;
  let tokensUsed = 0;
  let promptTokens = 0;
  let outputTokens = 0;
  let providerCalls = 0;

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader?.split(' ')[1]);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, subscription_tier')
      .eq('auth_id', user.id)
      .single();

    const tier = (userProfile?.subscription_tier || 'free').toLowerCase();

    // Tier gate: Speaking evaluation requires pro or higher
    const tierDenied = checkTierAccess(
      tier,
      ['free', 'pro', 'premium', 'admin'],
      corsHeaders,
      'Speaking Evaluation'
    );
    if (tierDenied) return tierDenied;

    const burstConfig = getBurstLimitConfig(tier);
    const rateLimitId = getRateLimitIdentifier(req, user.id);
    const burstCheck = checkRateLimit(rateLimitId, burstConfig);

    if (!burstCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Please wait a moment before requesting evaluation.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the full conversation from all 3 parts
    const {
      testId,
      speakingSessionId: requestedSpeakingSessionId,
      partContexts = {},
    } = await req.json();

    if (!testId) {
      return new Response(
        JSON.stringify({
          error: 'testId is required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sessionQuery = supabase
      .from('test_sessions')
      .select('id, passage_id, content_data, started_at, created_at, evaluation_status')
      .eq('user_id', userProfile?.id)
      .eq('test_type', 'speaking');
    sessionQuery = requestedSpeakingSessionId
      ? sessionQuery.eq('id', requestedSpeakingSessionId)
      : sessionQuery.eq('passage_id', testId).order('created_at', { ascending: false }).limit(1);
    const { data: ownedSession, error: sessionError } = await sessionQuery.maybeSingle();
    if (
      sessionError ||
      !ownedSession ||
      (ownedSession.passage_id && ownedSession.passage_id !== testId)
    ) {
      return new Response(JSON.stringify({ error: 'Speaking session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const speakingSessionId = ownedSession.id;
    const { data: recordedTurns, error: recordedTurnsError } = await supabase
      .from('ai_api_usage')
      .select('request_metadata, created_at')
      .eq('user_id', user.id)
      .eq('endpoint', 'processSpeakingSession')
      .filter('request_metadata->>speakingSessionId', 'eq', speakingSessionId)
      .eq('request_metadata->>reservationStatus', 'completed')
      .order('created_at', { ascending: true });
    if (recordedTurnsError) {
      throw new Error(`Could not verify speaking turns: ${recordedTurnsError.message}`);
    }
    const authoritativeConversation = buildAuthoritativeConversation(recordedTurns || []);
    if (![1, 2, 3].every((part) => authoritativeConversation.completedParts.has(part))) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'incomplete_authoritative_speaking_turns',
          message: 'Complete each speaking part before requesting final feedback.',
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const persistedPronunciation = ownedSession.content_data?.allPartsAcousticMetrics || {};
    const quotaReservation = await reserveDatabaseQuota(
      supabase,
      user.id,
      'evaluateSpeakingTest',
      'speaking',
      `speaking-evaluation:${speakingSessionId}`,
      { testId, speakingSessionId }
    );
    if (!quotaReservation.allowed) {
      return quotaExceededResponse(quotaReservation, corsHeaders);
    }
    if (quotaReservation.alreadyReserved) {
      const cachedResponse = await getFinalizedReservationResult<Record<string, unknown>>(
        supabase,
        quotaReservation.reservationId
      );
      if (cachedResponse) {
        return new Response(JSON.stringify({ ...cachedResponse, cached: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return duplicateReservationResponse(
        corsHeaders,
        'This Speaking evaluation is already being processed or has already completed.'
      );
    }
    quotaReservationId = quotaReservation.reservationId;

    // SECURITY: Cap transcript size to prevent token-draining attacks
    const MAX_TRANSCRIPT_CHARS = 20000; // ~3500 spoken words — well above any IELTS test
    const transcriptSize =
      JSON.stringify(authoritativeConversation.parts).length +
      JSON.stringify(partContexts).length +
      JSON.stringify(persistedPronunciation).length;
    if (transcriptSize > MAX_TRANSCRIPT_CHARS) {
      await finalizeApiUsage(
        supabase,
        quotaReservationId,
        0,
        false,
        { testId, speakingSessionId, failureReason: 'Transcript exceeds maximum size' },
        'failed'
      );
      quotaReservationId = undefined;
      return new Response(
        JSON.stringify({ error: `Conversation transcript exceeds maximum allowed size.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transcriptEvidence = buildSpeakingTranscript(
      authoritativeConversation.parts,
      partContexts
    );
    // Pronunciation is security-sensitive grading evidence. Only use metrics
    // persisted for this owned session; never trust a request-body override.
    const pronunciationEvidence = aggregatePronunciationEvidence(persistedPronunciation);
    let pronunciationSummary = '';
    if (pronunciationEvidence.score !== null) {
      pronunciationSummary = `\n\n<audio_evidence>${escapePromptXml(
        pronunciationEvidence.summary
      )}`;
      if (pronunciationEvidence.problematicSounds.length > 0) {
        pronunciationSummary += `\nRecurring problematic sounds: ${escapePromptXml(
          pronunciationEvidence.problematicSounds.join(', ')
        )}`;
      }
      if (pronunciationEvidence.wordIssues.length > 0) {
        const wordIssues = pronunciationEvidence.wordIssues
          .filter((item) => item.severity === 'major' || item.severity === 'moderate')
          .slice(0, 8)
          .map((item) => `"${item.word}" (${item.issue})`)
          .join(', ');
        pronunciationSummary += `\nKey word-level issues: ${escapePromptXml(wordIssues)}`;
      }
      pronunciationSummary += '</audio_evidence>';
    }

    // Generate evaluation prompt with official Band Descriptors
    const evaluationPrompt = generateEvaluationPrompt(
      transcriptEvidence.transcript + pronunciationSummary,
      'full'
    );
    const providerResult = await requestSpeakingEvaluation({
      prompt: evaluationPrompt,
      systemPrompt: SPEAKING_EVALUATION_SYSTEM_PROMPT,
      responseSchema: SPEAKING_EVALUATION_RESPONSE_SCHEMA,
      hasPronunciationEvidence: pronunciationEvidence.score !== null,
      openRouterApiKey: Deno.env.get('OPENROUTER_API_KEY'),
      geminiApiKey: Deno.env.get('GEMINI_API_KEY'),
      timeoutMs: 15_000,
    });
    tokensUsed = providerResult.usage.tokensUsed;
    promptTokens = providerResult.usage.promptTokens;
    outputTokens = providerResult.usage.outputTokens;
    providerCalls = providerResult.providerCalls;
    let evaluation;

    try {
      evaluation = normalizeSpeakingEvaluation(
        providerResult.parsed,
        transcriptEvidence.partStats,
        pronunciationEvidence
      );
      evaluation = {
        ...evaluation,
        model: providerResult.model,
        generatedAt: new Date().toISOString(),
        speakingSessionId,
      };
    } catch (parseError) {
      console.error('Failed to parse evaluation:', parseError);
      console.error('Speaking evaluation response could not be parsed', {
        responseLength: providerResult.text?.length || 0,
        provider: providerResult.provider,
        model: providerResult.model,
      });

      await finalizeApiUsage(
        supabase,
        quotaReservationId,
        tokensUsed,
        false,
        {
          testId,
          speakingSessionId,
          failureReason: 'evaluation_parse_failed',
          promptTokens,
          outputTokens,
          providerCalls,
        },
        'failed'
      );
      quotaReservationId = undefined;

      return new Response(
        JSON.stringify({
          success: false,
          error: 'evaluation_parse_failed',
          message: 'AI evaluation could not be parsed. Please retry.',
          debug: {
            evalTextLength: providerResult.text?.length || 0,
            provider: providerResult.provider,
            model: providerResult.model,
          },
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Completion and its reward are server-owned. A browser can display the
    // result, but it cannot turn a fabricated session row into XP.
    const evaluatedAt = new Date().toISOString();
    const startedAt = ownedSession.started_at || ownedSession.created_at;
    const elapsedSeconds = startedAt
      ? Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)
      : null;
    const actualDurationSeconds =
      Number.isFinite(elapsedSeconds) && elapsedSeconds > 0 && elapsedSeconds <= 14_400
        ? elapsedSeconds
        : null;
    const criteriaScores = {
      fluency: evaluation.fluency ?? null,
      lexicalResource: evaluation.lexical ?? null,
      grammar: evaluation.grammar ?? null,
      pronunciation: evaluation.pronunciation ?? null,
    };
    const { data: persistedSession, error: persistError } = await supabase
      .from('test_sessions')
      .update({
        is_completed: true,
        score: evaluation.overallBand ?? null,
        completed_at: evaluatedAt,
        evaluation_status: 'complete',
        evaluation_version: CURRENT_EVALUATION_VERSION,
        evaluated_at: evaluatedAt,
        actual_duration_seconds: actualDurationSeconds,
        content_data: {
          ...(ownedSession.content_data || {}),
          finalEvaluation: {
            ...evaluation,
            evaluationVersion: CURRENT_EVALUATION_VERSION,
            speakingSessionId,
          },
          allPartsConversation: authoritativeConversation.parts,
          criteriaScores,
          evaluationVersion: CURRENT_EVALUATION_VERSION,
          evaluatedAt,
          evaluationPending: false,
          timeMetrics: {
            ...(ownedSession.content_data?.timeMetrics || {}),
            ...(actualDurationSeconds ? { totalTimeSpent: actualDurationSeconds } : {}),
          },
        },
      })
      .eq('id', speakingSessionId)
      .eq('user_id', userProfile?.id)
      .eq('evaluation_status', 'pending')
      .select('id')
      .maybeSingle();
    if (persistError || !persistedSession) {
      throw new Error(persistError?.message || 'Speaking evaluation session is no longer pending');
    }

    const { data: xpAward, error: xpAwardError } = await supabase.rpc('award_user_points', {
      p_auth_id: user.id,
      p_points: 140,
      p_action_key: `speaking-test:${speakingSessionId}`,
      p_reason: 'speaking_evaluation',
    });
    if (xpAwardError) throw new Error(`Could not record speaking XP: ${xpAwardError.message}`);

    const responsePayload = {
      success: true,
      evaluation,
      sessionPersisted: true,
      xpAward: {
        awarded: Boolean(xpAward?.awarded),
        awardedPoints: xpAward?.awarded ? 140 : 0,
        newPoints: Number(xpAward?.new_points) || 0,
      },
    };

    // Log successful usage
    const estimatedProviderCostUsd = providerResult.usage.estimatedProviderCostUsd;
    await finalizeApiUsage(supabase, quotaReservationId, tokensUsed, false, {
      testId,
      speakingSessionId,
      promptTokens,
      outputTokens,
      providerCalls,
      provider: providerResult.provider,
      model: providerResult.model,
      fallbackUsed: providerResult.fallbackUsed,
      fallbackReason: providerResult.fallbackReason,
      routingReason: providerResult.routingReason,
      estimatedProviderCostUsd,
      response: responsePayload,
    });
    quotaReservationId = undefined;
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in evaluateSpeakingTest:', error);
    if (quotaReservationId) {
      await finalizeApiUsage(
        supabase,
        quotaReservationId,
        0,
        false,
        { failureReason: error?.message || 'Internal server error' },
        'failed'
      );
    }
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({
        error: 'Unable to evaluate this speaking test. Please try again.',
        success: false,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

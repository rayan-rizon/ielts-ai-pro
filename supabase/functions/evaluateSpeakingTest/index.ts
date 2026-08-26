// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore - Use npm: specifier for Node compatibility
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  getCorsHeaders,
  logApiUsage,
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
import { generateEvaluationPrompt } from '../_shared/bandDescriptors.ts';
import {
  aggregatePronunciationEvidence,
  buildSpeakingTranscript,
  normalizeSpeakingEvaluation,
} from '../_shared/evaluationUtils.ts';
import { requestSpeakingEvaluation } from '../_shared/speakingEvaluationProvider.ts';
import { SPEAKING_EVALUATION_RESPONSE_SCHEMA } from '../_shared/speakingEvaluationSchema.ts';

declare const Deno: any;

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
  let authenticatedUserId: string | undefined;
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
    authenticatedUserId = user.id;

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
      allPartsConversation,
      allPartsPronunciation,
      partContexts = {},
    } = await req.json();

    if (!testId || !allPartsConversation) {
      return new Response(
        JSON.stringify({
          error: 'testId and allPartsConversation are required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sessionQuery = supabase
      .from('test_sessions')
      .select('id, passage_id')
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
      JSON.stringify(allPartsConversation).length +
      JSON.stringify(partContexts).length +
      JSON.stringify(allPartsPronunciation || {}).length;
    if (transcriptSize > MAX_TRANSCRIPT_CHARS) {
      await finalizeApiUsage(
        supabase,
        quotaReservationId,
        0,
        false,
        { testId, speakingSessionId, failureReason: 'Transcript exceeds maximum size' },
        'failed'
      );
      await logApiUsage(supabase, user.id, 'evaluateSpeakingTest', false, tokensUsed, {
        testId,
        speakingSessionId,
        reservationStatus: 'failed',
        failureReason: 'transcript_size_exceeded',
        promptTokens,
        outputTokens,
        providerCalls,
      });
      quotaReservationId = undefined;
      return new Response(
        JSON.stringify({ error: `Conversation transcript exceeds maximum allowed size.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transcriptEvidence = buildSpeakingTranscript(allPartsConversation, partContexts);
    const pronunciationEvidence = aggregatePronunciationEvidence(allPartsPronunciation);
    let pronunciationSummary = '';
    if (pronunciationEvidence.score !== null) {
      pronunciationSummary =
        '\n\n=== PRONUNCIATION & FLUENCY ASSESSMENT (from audio analysis) ===\n' +
        pronunciationEvidence.summary;
      if (pronunciationEvidence.problematicSounds.length > 0) {
        pronunciationSummary += `\nRecurring problematic sounds: ${pronunciationEvidence.problematicSounds.join(', ')}`;
      }
      if (pronunciationEvidence.wordIssues.length > 0) {
        pronunciationSummary += `\nKey word-level issues: ${pronunciationEvidence.wordIssues
          .filter((item) => item.severity === 'major' || item.severity === 'moderate')
          .slice(0, 8)
          .map((item) => `"${item.word}" (${item.issue})`)
          .join(', ')}`;
      }
    }

    // Generate evaluation prompt with official Band Descriptors
    const evaluationPrompt = generateEvaluationPrompt(
      transcriptEvidence.transcript + pronunciationSummary,
      'full'
    );
    const providerResult = await requestSpeakingEvaluation({
      prompt: evaluationPrompt,
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

    const responsePayload = { success: true, evaluation };

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
    await logApiUsage(supabase, user.id, 'evaluateSpeakingTest', false, tokensUsed, {
      testId,
      speakingSessionId,
      partsCompleted: Object.keys(allPartsConversation).length,
      provider: providerResult.provider,
      model: providerResult.model,
      promptTokens,
      outputTokens,
      providerCalls,
      fallbackUsed: providerResult.fallbackUsed,
      fallbackReason: providerResult.fallbackReason,
      routingReason: providerResult.routingReason,
      estimatedProviderCostUsd,
    });

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
    if (authenticatedUserId) {
      await logApiUsage(supabase, authenticatedUserId, 'evaluateSpeakingTest', false, 0, {
        reservationStatus: 'failed',
        failureReason: error?.message || 'Internal server error',
      });
    }
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

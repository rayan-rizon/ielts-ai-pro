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
  quotaExceededResponse,
} from '../_shared/security.ts';
import { generateEvaluationPrompt } from '../_shared/bandDescriptors.ts';
import {
  aggregatePronunciationEvidence,
  buildSpeakingTranscript,
  normalizeSpeakingEvaluation,
  parseStructuredJson,
} from '../_shared/evaluationUtils.ts';

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
      'processSpeakingSession_start',
      'speaking',
      `speaking-session:${speakingSessionId}`,
      { testId, speakingSessionId }
    );
    if (!quotaReservation.allowed) {
      return quotaExceededResponse(quotaReservation, corsHeaders);
    }

    // SECURITY: Cap transcript size to prevent token-draining attacks
    const MAX_TRANSCRIPT_CHARS = 20000; // ~3500 spoken words — well above any IELTS test
    const transcriptSize =
      JSON.stringify(allPartsConversation).length +
      JSON.stringify(partContexts).length +
      JSON.stringify(allPartsPronunciation || {}).length;
    if (transcriptSize > MAX_TRANSCRIPT_CHARS) {
      return new Response(
        JSON.stringify({ error: `Conversation transcript exceeds maximum allowed size.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
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
    const speakingResponseSchema = {
      type: 'OBJECT',
      properties: {
        fluency: { type: 'NUMBER' },
        lexical: { type: 'NUMBER' },
        grammar: { type: 'NUMBER' },
        pronunciation: { type: 'NUMBER', nullable: true },
        feedback: { type: 'STRING' },
        partScores: {
          type: 'OBJECT',
          properties: {
            part1: {
              type: 'OBJECT',
              properties: {
                band: { type: 'NUMBER', nullable: true },
                keyObservation: { type: 'STRING' },
              },
              required: ['band', 'keyObservation'],
            },
            part2: {
              type: 'OBJECT',
              properties: {
                band: { type: 'NUMBER', nullable: true },
                keyObservation: { type: 'STRING' },
              },
              required: ['band', 'keyObservation'],
            },
            part3: {
              type: 'OBJECT',
              properties: {
                band: { type: 'NUMBER', nullable: true },
                keyObservation: { type: 'STRING' },
              },
              required: ['band', 'keyObservation'],
            },
          },
          required: ['part1', 'part2', 'part3'],
        },
        criterionNotes: {
          type: 'OBJECT',
          properties: {
            fluency: { type: 'STRING' },
            lexical: { type: 'STRING' },
            grammar: { type: 'STRING' },
            pronunciation: { type: 'STRING' },
          },
          required: ['fluency', 'lexical', 'grammar', 'pronunciation'],
        },
        strengths: { type: 'ARRAY', items: { type: 'STRING' } },
        improvements: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              area: { type: 'STRING' },
              tip: { type: 'STRING' },
            },
            required: ['area', 'tip'],
          },
        },
        targetBandTips: { type: 'STRING' },
      },
      required: [
        'fluency',
        'lexical',
        'grammar',
        'pronunciation',
        'feedback',
        'partScores',
        'criterionNotes',
        'strengths',
        'improvements',
        'targetBandTips',
      ],
    };

    const requestGeminiEvaluation = async (temperature: number) => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: evaluationPrompt }] }],
            generationConfig: {
              temperature,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
              responseSchema: speakingResponseSchema,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const usage = data.usageMetadata || {};
      return {
        data,
        text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        tokens: usage.totalTokenCount || 0,
        promptTokens: usage.promptTokenCount || 0,
        outputTokens: (usage.candidatesTokenCount || 0) + (usage.thoughtsTokenCount || 0),
      };
    };

    let providerResult = await requestGeminiEvaluation(0.2);
    let tokensUsed = providerResult.tokens;
    let promptTokens = providerResult.promptTokens;
    let outputTokens = providerResult.outputTokens;
    let providerCalls = 1;
    let evaluation;

    try {
      let parsed;
      try {
        parsed = parseStructuredJson(providerResult.text);
      } catch (firstParseError) {
        console.warn('Gemini returned invalid speaking JSON; retrying once:', firstParseError);
        providerResult = await requestGeminiEvaluation(0);
        tokensUsed += providerResult.tokens;
        promptTokens += providerResult.promptTokens;
        outputTokens += providerResult.outputTokens;
        providerCalls += 1;
        parsed = parseStructuredJson(providerResult.text);
      }

      evaluation = normalizeSpeakingEvaluation(
        parsed,
        transcriptEvidence.partStats,
        pronunciationEvidence
      );
    } catch (parseError) {
      console.error('Failed to parse evaluation:', parseError);
      console.error('Speaking evaluation response could not be parsed', {
        responseLength: providerResult.text?.length || 0,
        finishReason: providerResult.data?.candidates?.[0]?.finishReason || 'unknown',
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'evaluation_parse_failed',
          message: 'AI evaluation could not be parsed. Please retry.',
          debug: {
            evalTextLength: providerResult.text?.length || 0,
            finishReason: providerResult.data?.candidates?.[0]?.finishReason || 'unknown',
            candidatesCount: providerResult.data?.candidates?.length || 0,
          },
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful usage
    const estimatedProviderCostUsd = promptTokens * 0.0000003 + outputTokens * 0.0000025;
    await logApiUsage(supabase, user.id, 'evaluateSpeakingTest', false, tokensUsed, {
      testId,
      speakingSessionId,
      partsCompleted: Object.keys(allPartsConversation).length,
      model: 'gemini-2.5-flash',
      promptTokens,
      outputTokens,
      providerCalls,
      estimatedProviderCostUsd,
    });

    return new Response(
      JSON.stringify({
        success: true,
        evaluation,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in evaluateSpeakingTest:', error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

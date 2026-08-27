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
import {
  buildSpeakingTranscript,
  FEEDBACK_EVALUATOR_VERSION,
  normalizeDetailedSpeakingEvaluation,
} from '../_shared/evaluationUtils.ts';

declare const Deno: any;

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

    // Rate limiting and Tier Checks
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, subscription_tier, role')
      .eq('auth_id', user.id)
      .single();

    let tier = (userProfile?.subscription_tier || 'free').toLowerCase();
    if (userProfile?.role === 'admin') tier = 'admin';

    // Tier gate removed - Deep dive available for all users because of overall test usage limits
    // const tierDenied = checkTierAccess(tier, ['pro', 'premium', 'admin'], corsHeaders, 'Detailed Speaking Analytics');
    // if (tierDenied) return tierDenied;

    // Uses burst limits
    const burstConfig = getBurstLimitConfig(tier);
    const rateLimitId = getRateLimitIdentifier(req, user.id);
    const burstCheck = checkRateLimit(rateLimitId, burstConfig);

    if (!burstCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Please wait a moment before requesting detailed analysis.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      testId,
      speakingSessionId: requestedSpeakingSessionId,
      allPartsConversation,
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
      .select('id, passage_id, content_data')
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
    const cachedDeepDive = ownedSession.content_data?.detailedFeedback;
    if (
      cachedDeepDive?.evaluationVersion === FEEDBACK_EVALUATOR_VERSION &&
      cachedDeepDive?.speakingSessionId === speakingSessionId
    ) {
      return new Response(
        JSON.stringify({ success: true, detailedAnalysis: cachedDeepDive, cached: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const quotaReservation = await reserveDatabaseQuota(
      supabase,
      user.id,
      'generateDetailedSpeakingFeedback',
      'speaking',
      `speaking-deep-dive:${speakingSessionId}:${FEEDBACK_EVALUATOR_VERSION}`,
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
        'This Speaking deep dive is already being generated or has already completed.'
      );
    }
    quotaReservationId = quotaReservation.reservationId;

    // SECURITY: Cap transcript size to prevent token-draining attacks
    const MAX_TRANSCRIPT_CHARS = 20000; // ~3500 spoken words — well above any IELTS test
    const transcriptSize =
      JSON.stringify(allPartsConversation).length + JSON.stringify(partContexts).length;
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

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const transcriptEvidence = buildSpeakingTranscript(allPartsConversation, partContexts);
    const fullTranscript = transcriptEvidence.transcript;

    const promptText = `
You are a senior IELTS examiner and speaking coach. Analyse the following speaking test transcript question-by-question and produce a structured JSON feedback report.

**TONE INSTRUCTION:** Write feedback in a warm, encouraging coaching voice — not a clinical assessment report. Use direct address ('you', 'your'). Acknowledge effort before identifying issues. Frame improvements as achievable next steps, not deficits. Example tone: 'You've got solid foundations here — your grammar holds up well. The main lever to pull now is extending your Part 2 answers to the full 1–2 minutes.'

**IELTS SPEAKING TEST STRUCTURE — CONTEXT:**
- Part 1 (Introduction & Interview): Short, personal questions about familiar topics. Candidates should give 2–3 sentence answers that are natural and conversational, not over-rehearsed.
- Part 2 (Individual Long Turn): Candidate speaks for 1–2 minutes on a cue card topic. Band 6+ requires at least 90 seconds of sustained, organised speech. Band 7+ requires fluent, fully developed discourse with no major gaps or halting.
- Part 3 (Two-Way Discussion): Abstract, analytical questions related to the Part 2 topic. Candidate should express opinions, analyse issues, and develop ideas at length. Short yes/no answers are penalised.

**CRITICAL RULES FOR ANALYSIS:**

1. Grammar error detection (non-negotiable):
   - Identify genuine grammatical errors in the candidate's response.
   - Report each error with the exact incorrect phrase and its correct form.
   - Do NOT state 'grammatical structures are used accurately' if any error exists — this is a hallucination and misleads the student.
   - The transcript is ASR-generated. Do not treat punctuation, capitalization, spelling, or a likely transcription error as evidence of the candidate's grammar.
   - Return an empty grammaticalErrors array when there is no clear error. Never invent a correction to fill the array.

2. Topic adherence check:
   - Verify the candidate answered the specific question asked.
   - If the candidate drifted to a related but different topic (e.g., asked about theatre but spoke about cinema), flag this as 'Topic Drift' in the topicDrift field with a specific note.

3. Response length calibration (Part 2 especially):
   - The transcript contains the candidate responses and task context available to the app. If Part 2 is brief, flag the limited development prominently without converting word count directly into a band.

4. Band 9 sample responses — spoken register (critical):
   - Band 9 samples must sound like NATURAL SPOKEN ENGLISH, not written essays.
   - USE: contractions (I'd, it's, there's, I've), discourse markers (Well, To be honest, I suppose, I mean, Actually), natural hedging (I think, It seems to me, I'd say, probably), self-correction for naturalness.
   - DO NOT USE: academic essay collocations ('theatrical landscape', 'demographic gravitating', 'nuanced narrative'), overly formal transitions ('Furthermore', 'Notwithstanding'), or formally written phrases.
   - A Band 9 speaker sounds articulate and natural — not like a memorised essay being recited.

5. Improvement advice calibration:
   - Match advice to the candidate's ACTUAL observed performance level.
   - If responses were brief: first tip must address extending length.
   - If grammar errors detected: correct them specifically before suggesting stylistic improvements.
   - If topic drift detected: address adherence before vocabulary tips.

6. Part-specific register coaching:
   - Note how the candidate should shift their communication style between parts:
     * Part 1: Natural, conversational — short but complete answers. Brevity is less penalised here.
     * Part 2: Extended monologue — organised delivery using the cue card bullet points. Length is critical.
     * Part 3: Analytical and abstract — hedging language ('it could be argued that...', 'it rather depends on...'), speculation, and justification are expected and rewarded.
   - If the candidate uses the same register across all parts (e.g., short Part 1-style answers in Part 3), flag this in feedback.

**TRANSCRIPT:**
${fullTranscript}

**OUTPUT FORMAT:**
Return ONLY a valid JSON array. Do not include markdown code block formatting.

[
  {
    "part": 1,
    "question": "The exact examiner question",
    "candidateAnswer": "The candidate's verbatim response",
    "grammaticalErrors": [
      { "incorrect": "exact phrase from transcript", "correct": "corrected form", "explanation": "brief grammar note" }
    ],
    "topicDrift": "null or a string describing any topic drift detected",
    "suggestedAnswer": "A stronger sample response in NATURAL SPOKEN ENGLISH with contractions and discourse markers",
    "feedback": "2–3 sentence examiner note: cite SPECIFIC language from the candidate's answer, identify 1 concrete error or gap, explain what the Band 9 sample does better"
  }
]

Return an empty grammaticalErrors array [] if no errors are found. Return the string 'null' for topicDrift if the candidate answered on-topic.
`;
    const detailedResponseSchema = {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          part: { type: 'INTEGER' },
          question: { type: 'STRING' },
          candidateAnswer: { type: 'STRING' },
          grammaticalErrors: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                incorrect: { type: 'STRING' },
                correct: { type: 'STRING' },
                explanation: { type: 'STRING' },
              },
              required: ['incorrect', 'correct', 'explanation'],
            },
          },
          topicDrift: { type: 'STRING' },
          suggestedAnswer: { type: 'STRING' },
          feedback: { type: 'STRING' },
        },
        required: [
          'part',
          'question',
          'candidateAnswer',
          'grammaticalErrors',
          'topicDrift',
          'suggestedAnswer',
          'feedback',
        ],
      },
    };

    const requestBody = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 6144,
        responseMimeType: 'application/json',
        responseSchema: detailedResponseSchema,
        thinkingConfig: { thinkingBudget: 0 },
      },
    };
    let evalResponse: Response | undefined;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        evalResponse = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
            body: JSON.stringify(requestBody),
          }
        );
        if (evalResponse.ok || ![429, 500, 502, 503, 504].includes(evalResponse.status)) break;
      } catch (error) {
        if (attempt === 1) throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }

    if (!evalResponse?.ok) {
      const errorText = evalResponse ? await evalResponse.text() : 'No response';
      throw new Error(`Gemini API error: ${evalResponse?.status ?? 'network'} - ${errorText}`);
    }

    const evalData = await evalResponse.json();
    const evalText = evalData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokensUsed = evalData.usageMetadata?.totalTokenCount || 0;
    console.log(`[Detailed Eval] Gemini length: ${evalText.length} chars, tokens: ${tokensUsed}`);

    let detailedAnalysis;
    try {
      // Extract a fenced or bare JSON array even when Gemini prepends a short
      // conversational sentence before the response.
      let cleanText = evalText.trim();
      const fencedJson = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fencedJson?.[1]) cleanText = fencedJson[1];
      const arrayJson = cleanText.match(/\[[\s\S]*\]/);
      if (arrayJson?.[0]) cleanText = arrayJson[0];
      const detailedQuestions = normalizeDetailedSpeakingEvaluation(
        JSON.parse(cleanText.trim()),
        transcriptEvidence.candidateSource
      );
      detailedAnalysis = {
        questions: detailedQuestions,
        evaluationVersion: FEEDBACK_EVALUATOR_VERSION,
        generatedAt: new Date().toISOString(),
        model: 'gemini-2.5-flash',
        speakingSessionId,
      };
    } catch (parseError) {
      console.error('Failed to parse detailed analysis from Gemini:', parseError);
      console.error('Detailed speaking response could not be parsed', {
        responseLength: evalText?.length || 0,
      });
      throw new Error('Failed to parse AI response into JSON');
    }

    const responsePayload = { success: true, detailedAnalysis };

    // Log successful usage
    await finalizeApiUsage(supabase, quotaReservationId, tokensUsed, false, {
      testId,
      speakingSessionId,
      partsAnalyzed: [1, 2, 3].filter((p) => !!allPartsConversation[p]).length,
      model: 'gemini-2.5-flash',
      response: responsePayload,
    });
    quotaReservationId = undefined;
    await logApiUsage(supabase, user.id, 'generateDetailedSpeakingFeedback', false, tokensUsed, {
      testId,
      partsAnalyzed: [1, 2, 3].filter((p) => !!allPartsConversation[p]).length,
    });

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generateDetailedSpeakingFeedback:', error);
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
      await logApiUsage(
        supabase,
        authenticatedUserId,
        'generateDetailedSpeakingFeedback',
        false,
        0,
        {
          reservationStatus: 'failed',
          failureReason: error?.message || 'Internal server error',
        }
      );
    }
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

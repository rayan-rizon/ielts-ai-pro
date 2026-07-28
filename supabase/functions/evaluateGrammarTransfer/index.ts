// @ts-ignore Deno URL imports are resolved by the Supabase Edge runtime.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  checkRateLimit,
  checkTierAccess,
  errorResponse,
  finalizeApiUsage,
  getBurstLimitConfig,
  getCorsHeaders,
  getRateLimitIdentifier,
  handleCorsPrelight,
  quotaExceededResponse,
  rateLimitedResponse,
  reserveDatabaseQuota,
  validateCsrfProtection,
} from '../_shared/security.ts';
import { buildSpeakingTranscript } from '../_shared/evaluationUtils.ts';

declare const Deno: any;

const MODEL = 'gemini-2.5-flash-lite';
const VALID_TRANSFER_TYPES = new Set(['writing', 'speaking']);
const VALID_SKILLS = new Set([
  'grammar_sentence_boundaries',
  'grammar_verb_forms',
  'grammar_agreement_number',
  'grammar_articles_determiners',
  'grammar_clause_control',
  'grammar_word_forms',
]);

const compactText = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, maxLength) : '';

function parseProviderJson(value: string) {
  const stripped = value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(stripped);
}

function normalizeEvaluation(raw: any, sourceText: string, transferType: string, skills: string[]) {
  const groundedExamples = (Array.isArray(raw?.groundedExamples) ? raw.groundedExamples : [])
    .map((item: any) => {
      const quote = compactText(item?.quote, 240);
      const targetSkill = String(item?.targetSkill || '');
      const correction = compactText(item?.correction, 280);
      if (!quote || !correction || !sourceText.includes(quote) || !skills.includes(targetSkill)) {
        return null;
      }
      return {
        quote,
        targetSkill,
        issue: compactText(item?.issue, 220),
        correction,
      };
    })
    .filter(Boolean)
    .slice(0, 8);

  const observations = skills.map((skillCode) => {
    const item = (Array.isArray(raw?.observations) ? raw.observations : []).find(
      (candidate: any) => candidate?.skillCode === skillCode
    );
    const quotes = (Array.isArray(item?.evidenceQuotes) ? item.evidenceQuotes : [])
      .map((quote: unknown) => compactText(quote, 220))
      .filter((quote: string) => quote && sourceText.includes(quote))
      .slice(0, 3);
    const requestedOutcome = String(item?.outcome || 'not_observed');
    const outcome =
      requestedOutcome === 'needs_repair' && quotes.length === 0
        ? 'not_observed'
        : ['pass', 'needs_repair', 'not_observed'].includes(requestedOutcome)
          ? requestedOutcome
          : 'not_observed';
    return {
      skillCode,
      outcome,
      evidenceQuotes: quotes,
      explanation: compactText(item?.explanation, 260),
    };
  });

  const hasGroundedRepair = groundedExamples.length > 0;
  const requestedOutcome = String(raw?.outcome || '');
  const outcome =
    requestedOutcome === 'needs_repair' && hasGroundedRepair ? 'needs_repair' : 'pass';
  const correctedVersion = groundedExamples.reduce(
    (text: string, example: any) => text.replace(example.quote, example.correction),
    sourceText
  );

  return {
    outcome,
    groundedExamples,
    correctedVersion,
    observations,
    explanation:
      compactText(raw?.explanation, 700) ||
      (outcome === 'pass'
        ? 'No clearly grounded error was found in the selected grammar targets.'
        : 'Review the exact examples before completing another transfer task.'),
    transferType,
    transcriptCaveat:
      transferType === 'speaking'
        ? 'This feedback is transcript-based. Punctuation, capitalization, spelling, and likely transcription errors were not treated as spoken grammar evidence.'
        : null,
    evaluatedAt: new Date().toISOString(),
    evaluatorVersion: 'grammar-transfer-1.0.0',
  };
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return handleCorsPrelight(req);
  let reservedClient: any = null;
  let reservationId: string | undefined;
  let usageFinalized = false;

  try {
    const csrf = validateCsrfProtection(req);
    if (!csrf.valid) return errorResponse(csrf.error || 'CSRF validation failed', 403, corsHeaders);

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    reservedClient = serviceClient;
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    const {
      data: { user },
      error: authError,
    } = await serviceClient.auth.getUser(token);
    if (authError || !user) return errorResponse('Unauthorized', 401, corsHeaders);

    const { data: profile, error: profileError } = await serviceClient
      .from('users')
      .select('id, subscription_tier, role')
      .eq('auth_id', user.id)
      .single();
    if (profileError || !profile)
      return errorResponse('Learner profile not found', 404, corsHeaders);

    const tier =
      String(profile.role).toLowerCase() === 'admin'
        ? 'admin'
        : String(profile.subscription_tier || 'free').toLowerCase();
    const tierDenied = checkTierAccess(
      tier,
      ['pro', 'premium', 'admin'],
      corsHeaders,
      'Grammar transfer evaluation'
    );
    if (tierDenied) return tierDenied;

    const burst = checkRateLimit(getRateLimitIdentifier(req, user.id), getBurstLimitConfig(tier));
    if (!burst.allowed) return rateLimitedResponse(burst.resetIn, corsHeaders);

    const body = await req.json();
    const attemptId = String(body?.attemptId || '');
    const transferType = String(body?.transferType || '').toLowerCase();
    if (!attemptId || !VALID_TRANSFER_TYPES.has(transferType)) {
      return errorResponse('attemptId and a valid transferType are required', 400, corsHeaders);
    }

    const { data: attempt, error: attemptError } = await serviceClient
      .from('grammar_attempts')
      .select(
        'id, user_id, mode, target_skills, completion_state, transfer_evaluation, learning_path_activity_id'
      )
      .eq('id', attemptId)
      .eq('user_id', profile.id)
      .maybeSingle();
    if (attemptError || !attempt || attempt.mode !== 'transfer') {
      return errorResponse('Grammar transfer attempt not found', 404, corsHeaders);
    }
    if (attempt.completion_state === 'completed' && attempt.transfer_evaluation) {
      return new Response(
        JSON.stringify({ success: true, data: attempt.transfer_evaluation, cached: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (attempt.completion_state !== 'in_progress') {
      return errorResponse('This Grammar transfer attempt is no longer active', 409, corsHeaders);
    }

    const targetSkills = (Array.isArray(attempt.target_skills) ? attempt.target_skills : [])
      .map(String)
      .filter((skill) => VALID_SKILLS.has(skill));
    if (!targetSkills.length) {
      return errorResponse('The transfer attempt has no valid target skills', 400, corsHeaders);
    }

    let sourceText = '';
    let taskContext = '';
    if (transferType === 'writing') {
      sourceText = compactText(body?.writingText, 5000);
      taskContext = compactText(body?.taskContext, 900);
      if (sourceText.length < 80) {
        return errorResponse(
          'Write at least 80 characters before requesting feedback',
          400,
          corsHeaders
        );
      }
    } else {
      const speakingSessionId = String(body?.speakingSessionId || '');
      if (!speakingSessionId) {
        return errorResponse('Choose an existing Speaking response', 400, corsHeaders);
      }
      const { data: speakingSession, error: speakingError } = await serviceClient
        .from('test_sessions')
        .select('id, content_data, passage_id')
        .eq('id', speakingSessionId)
        .eq('user_id', profile.id)
        .eq('test_type', 'speaking')
        .maybeSingle();
      if (speakingError || !speakingSession) {
        return errorResponse('Speaking response not found', 404, corsHeaders);
      }
      const conversations = speakingSession.content_data?.allPartsConversation || {};
      const contexts = speakingSession.content_data?.partContexts || {};
      const transcript = buildSpeakingTranscript(conversations, contexts);
      sourceText = compactText(transcript.transcript, 12000);
      taskContext = `Existing Speaking session ${speakingSession.id}`;
      if (transcript.totalCandidateWords < 12) {
        return errorResponse(
          'The selected Speaking response does not contain enough intelligible transcript evidence',
          400,
          corsHeaders
        );
      }
    }

    const quotaEndpoint =
      transferType === 'writing' ? 'generateDetailedFeedback' : 'processSpeakingSession_start';
    const quota = await reserveDatabaseQuota(
      serviceClient,
      user.id,
      quotaEndpoint,
      transferType,
      `grammar-transfer:${attempt.id}`,
      {
        attemptId: attempt.id,
        transferType,
        targetSkills,
        sourceEndpoint: 'evaluateGrammarTransfer',
      }
    );
    if (!quota.allowed) return quotaExceededResponse(quota, corsHeaders);
    reservationId = quota.reservationId;

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      await finalizeApiUsage(
        serviceClient,
        quota.reservationId,
        0,
        false,
        { failure: 'provider_not_configured' },
        'failed'
      );
      usageFinalized = true;
      return errorResponse('Grammar transfer evaluation is not configured', 503, corsHeaders);
    }

    const speakingRules =
      transferType === 'speaking'
        ? `This is an ASR transcript. Do not treat punctuation, capitalization, spelling, or a likely transcription error as spoken grammar evidence. Do not judge pronunciation.`
        : `This is learner-written text. Comment only on the selected grammar targets.`;
    const prompt = `You are a constrained Academic IELTS grammar transfer evaluator.
Assess only these target skills: ${targetSkills.join(', ')}.
${speakingRules}

Non-negotiable rules:
- Never output an IELTS band, predicted score, pronunciation judgement, confidence claim, or generic praise.
- Every claimed error must include an exact verbatim quote copied from SOURCE TEXT.
- Do not infer an error when the exact text could reasonably be grammatical.
- Keep Writing and Speaking criterion judgements out of scope; this is targeted transfer feedback.
- Use "needs_repair" only when at least one exact grounded example exists.
- Return JSON only.

Required JSON shape:
{
  "outcome": "pass" | "needs_repair",
  "groundedExamples": [
    {"quote":"exact source quote","targetSkill":"one supplied skill code","issue":"short explanation","correction":"corrected wording"}
  ],
  "correctedVersion":"the complete source with only grounded grammar repairs",
  "observations":[
    {"skillCode":"one supplied skill code","outcome":"pass|needs_repair|not_observed","evidenceQuotes":["exact source quote"],"explanation":"short explanation"}
  ],
  "explanation":"max 90 words"
}

TASK CONTEXT:
${taskContext || 'Academic IELTS grammar transfer'}

SOURCE TEXT:
${sourceText}`;

    const providerResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2200,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );
    if (!providerResponse.ok) {
      await finalizeApiUsage(
        serviceClient,
        quota.reservationId,
        0,
        false,
        { providerStatus: providerResponse.status },
        'failed'
      );
      usageFinalized = true;
      return errorResponse(
        'Grammar transfer evaluation is temporarily unavailable',
        502,
        corsHeaders
      );
    }

    const providerData = await providerResponse.json();
    const providerText = providerData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!providerText) throw new Error('Grammar transfer evaluator returned no content');
    const evaluation = normalizeEvaluation(
      parseProviderJson(providerText),
      sourceText,
      transferType,
      targetSkills
    );
    const tokensUsed = Number(providerData.usageMetadata?.totalTokenCount || 0);

    const { data: updatedAttempt, error: updateError } = await serviceClient
      .from('grammar_attempts')
      .update({
        completion_state: 'completed',
        transfer_evaluation: evaluation,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', attempt.id)
      .eq('completion_state', 'in_progress')
      .select('id')
      .maybeSingle();
    if (updateError || !updatedAttempt) {
      await finalizeApiUsage(
        serviceClient,
        quota.reservationId,
        tokensUsed,
        false,
        { failure: 'attempt_update_conflict' },
        'failed'
      );
      usageFinalized = true;
      return errorResponse(
        'The transfer attempt was already completed elsewhere',
        409,
        corsHeaders
      );
    }

    if (attempt.learning_path_activity_id) {
      await serviceClient
        .from('learning_path_activities')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          outcome_data: {
            source: 'grammar_lab_transfer',
            attemptId: attempt.id,
            transferType,
            outcome: evaluation.outcome,
            targetSkills,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', attempt.learning_path_activity_id)
        .eq('user_id', profile.id)
        .eq('is_completed', false);
    }

    await finalizeApiUsage(serviceClient, quota.reservationId, tokensUsed, false, {
      attemptId: attempt.id,
      transferType,
      outcome: evaluation.outcome,
      targetSkillCount: targetSkills.length,
    });
    usageFinalized = true;

    return new Response(JSON.stringify({ success: true, data: evaluation, cached: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    if (reservedClient && reservationId && !usageFinalized) {
      await finalizeApiUsage(
        reservedClient,
        reservationId,
        0,
        false,
        { failure: 'unexpected_evaluator_error' },
        'failed'
      );
    }
    return errorResponse(
      error?.message || 'Grammar transfer evaluation failed',
      500,
      getCorsHeaders(req)
    );
  }
});

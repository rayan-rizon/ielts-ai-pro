import {
  GEMINI_SCORING_MODEL,
  requestGeminiJson,
  requestOpenRouterDeepSeekJson,
  TextAiProviderError,
  type TextAiResult,
} from './textAiProvider.ts';

export type SpeakingEvaluationProviderRequest = {
  prompt: string;
  systemPrompt?: string;
  responseSchema: Record<string, unknown>;
  hasPronunciationEvidence: boolean;
  openRouterApiKey?: string | null;
  geminiApiKey?: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export type SpeakingEvaluationProviderResult = TextAiResult & {
  providerCalls: number;
  routingReason: 'deepseek_primary' | 'gemini_missing_audio_evidence' | 'gemini_fallback';
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isSpeakingEvaluationShape(value: any): boolean {
  const validPart = (part: any) =>
    part &&
    (part.band === null || isFiniteNumber(part.band)) &&
    typeof part.keyObservation === 'string';

  return Boolean(
    value &&
    isFiniteNumber(value.fluency) &&
    isFiniteNumber(value.lexical) &&
    isFiniteNumber(value.grammar) &&
    (value.pronunciation === null || isFiniteNumber(value.pronunciation)) &&
    typeof value.feedback === 'string' &&
    validPart(value.partScores?.part1) &&
    validPart(value.partScores?.part2) &&
    validPart(value.partScores?.part3) &&
    typeof value.criterionNotes?.fluency === 'string' &&
    typeof value.criterionNotes?.lexical === 'string' &&
    typeof value.criterionNotes?.grammar === 'string' &&
    typeof value.criterionNotes?.pronunciation === 'string' &&
    Array.isArray(value.strengths) &&
    value.strengths.every((item: unknown) => typeof item === 'string') &&
    Array.isArray(value.improvements) &&
    value.improvements.every(
      (item: any) => typeof item?.area === 'string' && typeof item?.tip === 'string'
    ) &&
    typeof value.targetBandTips === 'string'
  );
}

function describeDeepSeekFailure(error: unknown): string {
  if (!(error instanceof TextAiProviderError)) return 'deepseek_provider_failure';
  const status = error.status ? `_http_${error.status}` : '';
  return `openrouter_deepseek_${error.code}${status}`;
}

async function requestGeminiSpeakingEvaluation(
  request: SpeakingEvaluationProviderRequest,
  temperature: number
) {
  if (!request.geminiApiKey) {
    throw new TextAiProviderError('Gemini scoring fallback is not configured', {
      provider: 'gemini',
      code: 'provider_not_configured',
    });
  }

  return requestGeminiJson({
    prompt: request.prompt,
    systemPrompt: request.systemPrompt,
    apiKey: request.geminiApiKey,
    geminiModel: GEMINI_SCORING_MODEL,
    responseSchema: request.responseSchema,
    temperature,
    maxOutputTokens: 4096,
    timeoutMs: request.timeoutMs,
    fetchImpl: request.fetchImpl,
    validateJson: isSpeakingEvaluationShape,
  });
}

export async function requestSpeakingEvaluation(
  request: SpeakingEvaluationProviderRequest
): Promise<SpeakingEvaluationProviderResult> {
  let providerCalls = 0;
  const deepSeekFailureReasons: string[] = [];

  // The production flow normally has bounded Azure pronunciation evidence.
  // Keep transcript-only evaluations on the calibrated Gemini route because
  // DeepSeek is the explicitly benchmarked audio-backed primary route.
  if (request.hasPronunciationEvidence) {
    if (request.openRouterApiKey) {
      providerCalls += 1;
      try {
        const result = await requestOpenRouterDeepSeekJson({
          prompt: request.prompt,
          systemPrompt: request.systemPrompt,
          apiKey: request.openRouterApiKey,
          maxOutputTokens: 4096,
          timeoutMs: Math.min(request.timeoutMs || 15_000, 7_000),
          fetchImpl: request.fetchImpl,
          validateJson: isSpeakingEvaluationShape,
        });
        return {
          ...result,
          providerCalls,
          routingReason: 'deepseek_primary',
        };
      } catch (error) {
        const reason = describeDeepSeekFailure(error);
        deepSeekFailureReasons.push(reason);
        console.warn('OpenRouter DeepSeek speaking evaluation failed; trying Gemini:', reason);
      }
    } else {
      deepSeekFailureReasons.push('openrouter_deepseek_provider_not_configured');
    }
  }

  providerCalls += 1;
  let geminiResult: TextAiResult;
  try {
    geminiResult = await requestGeminiSpeakingEvaluation(request, 0.2);
  } catch (firstError) {
    if (
      firstError instanceof TextAiProviderError &&
      firstError.code === 'provider_not_configured'
    ) {
      throw firstError;
    }
    // Preserve the current scorer's one bounded repair attempt for malformed
    // or transient provider responses.
    console.warn('Gemini speaking evaluation failed; retrying once:', firstError);
    providerCalls += 1;
    geminiResult = await requestGeminiSpeakingEvaluation(request, 0);
  }

  const usedAsFallback = deepSeekFailureReasons.length > 0;
  return {
    ...geminiResult,
    fallbackUsed: usedAsFallback,
    fallbackReason: deepSeekFailureReasons.length > 0 ? deepSeekFailureReasons.join(',') : null,
    providerCalls,
    routingReason: usedAsFallback ? 'gemini_fallback' : 'gemini_missing_audio_evidence',
  };
}

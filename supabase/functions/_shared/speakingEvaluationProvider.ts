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
  routingReason:
    'deepseek_primary' | 'gemini_missing_audio_evidence' | 'gemini_fallback' | 'deepseek_fallback';
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

function describeGeminiFailure(error: unknown): string {
  if (!(error instanceof TextAiProviderError)) return 'gemini_provider_failure';
  const status = error.status ? `_http_${error.status}` : '';
  return `gemini_${error.code}${status}`;
}

function shouldChangeProvider(error: unknown) {
  if (!(error instanceof TextAiProviderError)) return true;
  return (
    error.code === 'timeout' ||
    (error.code === 'http_error' &&
      (error.status === 408 || error.status === 429 || (error.status || 0) >= 500))
  );
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
  let deepSeekAttempted = false;

  const requestDeepSeek = async () => {
    providerCalls += 1;
    deepSeekAttempted = true;
    return requestOpenRouterDeepSeekJson({
      prompt: request.prompt,
      systemPrompt: request.systemPrompt,
      apiKey: request.openRouterApiKey || '',
      maxOutputTokens: 4096,
      timeoutMs: Math.min(request.timeoutMs || 15_000, 7_000),
      fetchImpl: request.fetchImpl,
      validateJson: isSpeakingEvaluationShape,
    });
  };

  // The production flow normally has bounded Azure pronunciation evidence.
  // Keep transcript-only evaluations on the calibrated Gemini route because
  // DeepSeek is the explicitly benchmarked audio-backed primary route.
  if (request.hasPronunciationEvidence) {
    if (request.openRouterApiKey) {
      try {
        const result = await requestDeepSeek();
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
    const firstGeminiFailure = describeGeminiFailure(firstError);

    // A same-provider retry amplifies rate limits and outages. Transcript-only
    // scoring can instead recover through the configured DeepSeek route; it
    // still uses the same strict IELTS response schema before being accepted.
    if (!deepSeekAttempted && request.openRouterApiKey && shouldChangeProvider(firstError)) {
      console.warn('Gemini speaking evaluation unavailable; trying DeepSeek:', firstGeminiFailure);
      const result = await requestDeepSeek();
      return {
        ...result,
        fallbackUsed: true,
        fallbackReason: firstGeminiFailure,
        providerCalls,
        routingReason: 'deepseek_fallback',
      };
    }
    // Preserve the current scorer's one bounded repair attempt for malformed
    // JSON. If that repair also fails, use the other provider when available.
    console.warn('Gemini speaking evaluation failed; retrying once:', firstError);
    providerCalls += 1;
    try {
      geminiResult = await requestGeminiSpeakingEvaluation(request, 0);
    } catch (secondError) {
      if (!deepSeekAttempted && request.openRouterApiKey) {
        const result = await requestDeepSeek();
        return {
          ...result,
          fallbackUsed: true,
          fallbackReason: [firstGeminiFailure, describeGeminiFailure(secondError)].join(','),
          providerCalls,
          routingReason: 'deepseek_fallback',
        };
      }
      throw secondError;
    }
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

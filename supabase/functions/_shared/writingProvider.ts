import { estimateTokenCostUsd } from './aiModelRegistry.ts';
import { parseStructuredJson } from './evaluationUtils.ts';

type WritingContentPart = {
  text?: string;
  inline_data?: { mime_type: string; data: string };
};

type WritingProviderUsage = {
  tokensUsed: number;
  promptTokens: number;
  cachedPromptTokens: number;
  outputTokens: number;
  estimatedProviderCostUsd: number;
};

export type WritingFeedbackPass =
  | ({
      ok: true;
      parsedFeedback: Record<string, any>;
    } & WritingProviderUsage)
  | ({
      ok: false;
      failureReason: string;
      providerStatus: number | null;
    } & WritingProviderUsage);

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function buildOpenRouterMessageContent(
  systemInstruction: string,
  userContentParts: WritingContentPart[],
  schemaText: string
) {
  const content: any[] = [{ type: 'text', text: `${systemInstruction}\n${schemaText}` }];
  for (const part of userContentParts) {
    if (part.text) content.push({ type: 'text', text: part.text });
    if (part.inline_data) {
      content.push({
        type: 'image_url',
        image_url: { url: `data:${part.inline_data.mime_type};base64,${part.inline_data.data}` },
      });
    }
  }
  return content;
}

function positiveNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function readUsage(data: any, model: string): WritingProviderUsage {
  const promptTokens = positiveNumber(data?.usage?.prompt_tokens);
  const cachedPromptTokens = Math.min(
    promptTokens,
    positiveNumber(data?.usage?.prompt_tokens_details?.cached_tokens)
  );
  const outputTokens = positiveNumber(data?.usage?.completion_tokens);
  const tokensUsed = positiveNumber(data?.usage?.total_tokens) || promptTokens + outputTokens;
  const reportedCost = positiveNumber(data?.usage?.cost ?? data?.cost);

  return {
    tokensUsed,
    promptTokens,
    cachedPromptTokens,
    outputTokens,
    estimatedProviderCostUsd:
      reportedCost ||
      estimateTokenCostUsd(model, {
        promptTokens,
        cachedPromptTokens,
        outputTokens,
      }),
  };
}

function emptyUsage(): WritingProviderUsage {
  return {
    tokensUsed: 0,
    promptTokens: 0,
    cachedPromptTokens: 0,
    outputTokens: 0,
    estimatedProviderCostUsd: 0,
  };
}

function failed(
  code: string,
  status: number | null = null,
  usage: WritingProviderUsage = emptyUsage()
): WritingFeedbackPass {
  return {
    ok: false,
    failureReason: `openrouter_luna_${code}${status ? `_http_${status}` : ''}`,
    providerStatus: status,
    ...usage,
  };
}

/**
 * Call Luna for one Writing marking pass.
 *
 * Luna's OpenRouter catalog does not advertise temperature or top_p. Sending
 * either while require_parameters is true makes OpenRouter reject the request
 * before Luna receives it, so this route deliberately keeps only parameters
 * Luna's catalog supports and still requires the upstream to honor them.
 */
export async function requestOpenRouterWritingFeedback({
  model,
  apiKey,
  systemInstruction,
  userContentParts,
  schemaText,
  requiredCriterionKey,
  seed,
  fetchImpl = fetch,
  timeoutMs = 25_000,
}: {
  model: string;
  apiKey?: string | null;
  systemInstruction: string;
  userContentParts: WritingContentPart[];
  schemaText: string;
  requiredCriterionKey: string;
  seed: number;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<WritingFeedbackPass> {
  if (!apiKey) return failed('provider_not_configured');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'IELTS Ai Pro',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: buildOpenRouterMessageContent(systemInstruction, userContentParts, schemaText),
          },
        ],
        response_format: { type: 'json_object' },
        reasoning: { effort: 'none', exclude: true },
        seed,
        max_tokens: 4096,
        provider: { sort: 'throughput', require_parameters: true },
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`${model} writing pass (seed ${seed}) failed with HTTP ${response.status}`);
      return failed('http_error', response.status);
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      return failed('malformed_response');
    }

    const usage = readUsage(data, model);
    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      return failed('empty_content', null, usage);
    }

    let parsedFeedback: Record<string, any>;
    try {
      parsedFeedback = parseStructuredJson(text);
    } catch {
      return failed('malformed_json', null, usage);
    }

    const criteria = parsedFeedback?.criteriaScores;
    const hasRequiredScores =
      criteria &&
      [
        requiredCriterionKey,
        'CoherenceAndCohesion',
        'LexicalResource',
        'GrammaticalRangeAndAccuracy',
      ].every((key) => Number.isFinite(Number(criteria[key])));
    const hasRequiredTaskAnalysis =
      requiredCriterionKey !== 'TaskAchievement' ||
      (parsedFeedback?.taskAnalysis &&
        typeof parsedFeedback.taskAnalysis.visualType === 'string' &&
        typeof parsedFeedback.taskAnalysis.visualReadable === 'boolean' &&
        Array.isArray(parsedFeedback.taskAnalysis.observedFeatures));

    if (!hasRequiredScores || !hasRequiredTaskAnalysis) {
      console.warn(`${model} writing pass (seed ${seed}) failed schema validation`);
      return failed('invalid_schema', null, usage);
    }

    return { ok: true, parsedFeedback, ...usage };
  } catch (error: any) {
    const code = error?.name === 'AbortError' ? 'timeout' : 'provider_error';
    console.warn(`${model} writing pass (seed ${seed}) threw ${code}`);
    return failed(code);
  } finally {
    clearTimeout(timeoutId);
  }
}

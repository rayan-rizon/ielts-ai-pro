export const DEEPSEEK_TEXT_MODEL = 'deepseek-v4-flash';
export const OPENROUTER_DEEPSEEK_MODEL = 'deepseek/deepseek-v4-flash-0731';
export const OPENROUTER_LUNA_MODEL = 'openai/gpt-5.6-luna';
export const VERCEL_GATEWAY_LUNA_MODEL = 'openai/gpt-5.6-luna';
export const GEMINI_TEXT_FALLBACK_MODEL = 'gemini-2.5-flash-lite';
export const GEMINI_SCORING_MODEL = 'gemini-2.5-flash';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_TIMEOUT_MS = 20_000;

type ProviderName =
  | 'openrouter-deepseek'
  | 'openrouter-luna'
  | 'vercel-ai-gateway-luna'
  | 'deepseek'
  | 'gemini';

export type TextAiUsage = {
  promptTokens: number;
  cachedPromptTokens: number;
  outputTokens: number;
  tokensUsed: number;
  estimatedProviderCostUsd: number;
};

export type TextAiResult = {
  parsed: any;
  text: string;
  provider: ProviderName;
  model: string;
  mode: 'non-thinking' | 'low-reasoning';
  fallbackUsed: boolean;
  fallbackReason: string | null;
  usage: TextAiUsage;
};

type TextAiRequest = {
  prompt: string;
  openRouterApiKey?: string | null;
  deepseekApiKey?: string | null;
  geminiApiKey?: string | null;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  validateJson?: (value: any) => boolean;
  geminiModel?: string;
  responseSchema?: Record<string, unknown>;
};

type ProviderRequest = Omit<
  TextAiRequest,
  'openRouterApiKey' | 'deepseekApiKey' | 'geminiApiKey'
> & {
  apiKey: string;
};

export class TextAiProviderError extends Error {
  provider: ProviderName | 'none';
  status: number | null;
  code: string;

  constructor(
    message: string,
    options: {
      provider: ProviderName | 'none';
      status?: number | null;
      code: string;
    }
  ) {
    super(message);
    this.name = 'TextAiProviderError';
    this.provider = options.provider;
    this.status = options.status ?? null;
    this.code = options.code;
  }
}

function positiveNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

export function parseJsonText(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TextAiProviderError('AI provider returned empty content', {
      provider: 'none',
      code: 'empty_content',
    });
  }

  const stripped = value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  try {
    return JSON.parse(stripped);
  } catch {
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Fall through to the sanitized provider error below.
      }
    }
    throw new TextAiProviderError('AI provider returned malformed JSON', {
      provider: 'none',
      code: 'malformed_json',
    });
  }
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  input: string,
  init: RequestInit,
  timeoutMs: number
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(input, { ...init, signal: controller.signal });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new TextAiProviderError('AI provider request timed out', {
        provider: 'none',
        code: 'timeout',
      });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function providerFailure(provider: ProviderName, error: unknown, defaultCode = 'provider_failure') {
  if (error instanceof TextAiProviderError) {
    error.provider = provider;
    return error;
  }
  return new TextAiProviderError(`${provider} request failed`, {
    provider,
    code: defaultCode,
  });
}

function assertValidJsonShape(
  provider: ProviderName,
  parsed: any,
  validateJson?: (value: any) => boolean
) {
  if (!validateJson) return;
  let valid = false;
  try {
    valid = validateJson(parsed);
  } catch {
    valid = false;
  }
  if (!valid) {
    throw new TextAiProviderError('AI provider returned an invalid JSON schema', {
      provider,
      code: 'invalid_schema',
    });
  }
}

export async function requestDeepSeekJson(request: ProviderRequest): Promise<TextAiResult> {
  const fetchImpl = request.fetchImpl || fetch;
  try {
    const response = await fetchWithTimeout(
      fetchImpl,
      DEEPSEEK_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${request.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: DEEPSEEK_TEXT_MODEL,
          messages: [{ role: 'user', content: request.prompt }],
          response_format: { type: 'json_object' },
          thinking: { type: 'disabled' },
          temperature: request.temperature ?? 0.2,
          max_tokens: request.maxOutputTokens,
          stream: false,
        }),
      },
      request.timeoutMs || DEFAULT_TIMEOUT_MS
    );
    if (!response.ok) {
      throw new TextAiProviderError(`DeepSeek returned HTTP ${response.status}`, {
        provider: 'deepseek',
        status: response.status,
        code: 'http_error',
      });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    const parsed = parseJsonText(text);
    assertValidJsonShape('deepseek', parsed, request.validateJson);
    const promptTokens = positiveNumber(data?.usage?.prompt_tokens);
    const cachedPromptTokens = Math.min(
      promptTokens,
      positiveNumber(data?.usage?.prompt_cache_hit_tokens)
    );
    const uncachedPromptTokens = Math.max(0, promptTokens - cachedPromptTokens);
    const outputTokens = positiveNumber(data?.usage?.completion_tokens);
    const tokensUsed = positiveNumber(data?.usage?.total_tokens) || promptTokens + outputTokens;

    return {
      parsed,
      text,
      provider: 'deepseek',
      model: DEEPSEEK_TEXT_MODEL,
      mode: 'non-thinking',
      fallbackUsed: false,
      fallbackReason: null,
      usage: {
        promptTokens,
        cachedPromptTokens,
        outputTokens,
        tokensUsed,
        estimatedProviderCostUsd:
          cachedPromptTokens * 0.0000000028 +
          uncachedPromptTokens * 0.00000014 +
          outputTokens * 0.00000028,
      },
    };
  } catch (error) {
    throw providerFailure('deepseek', error);
  }
}

export async function requestOpenRouterDeepSeekJson(
  request: ProviderRequest
): Promise<TextAiResult> {
  const fetchImpl = request.fetchImpl || fetch;
  try {
    const response = await fetchWithTimeout(
      fetchImpl,
      OPENROUTER_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${request.apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'IELTS Ai Pro',
        },
        body: JSON.stringify({
          model: OPENROUTER_DEEPSEEK_MODEL,
          messages: [{ role: 'user', content: request.prompt }],
          response_format: { type: 'json_object' },
          // This endpoint supports an explicit no-reasoning mode. Using a token cap
          // alone is not reliable: the model can still consume the entire completion
          // budget with hidden reasoning and return no JSON content.
          reasoning: { effort: 'none', exclude: true },
          // OpenRouter defaults to price-weighted load balancing. Sort by its
          // rolling latency metrics so user-facing evaluations use the fastest
          // currently healthy endpoint, while retaining provider fallbacks.
          provider: { sort: 'latency', require_parameters: true },
          temperature: request.temperature ?? 0.2,
          // With reasoning disabled, keep the completion budget aligned with the
          // requested JSON size instead of paying for unused hidden tokens.
          max_tokens: request.maxOutputTokens,
          stream: false,
        }),
      },
      request.timeoutMs || DEFAULT_TIMEOUT_MS
    );
    if (!response.ok) {
      throw new TextAiProviderError(`OpenRouter returned HTTP ${response.status}`, {
        provider: 'openrouter-deepseek',
        status: response.status,
        code: 'http_error',
      });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    const parsed = parseJsonText(text);
    assertValidJsonShape('openrouter-deepseek', parsed, request.validateJson);
    const promptTokens = positiveNumber(data?.usage?.prompt_tokens);
    const cachedPromptTokens = positiveNumber(
      data?.usage?.prompt_cache_hit_tokens ?? data?.usage?.cache_read_input_tokens
    );
    const outputTokens = positiveNumber(data?.usage?.completion_tokens);
    const tokensUsed = positiveNumber(data?.usage?.total_tokens) || promptTokens + outputTokens;
    const reportedCost = positiveNumber(data?.usage?.cost ?? data?.cost);
    const uncachedPromptTokens = Math.max(0, promptTokens - cachedPromptTokens);

    return {
      parsed,
      text,
      provider: 'openrouter-deepseek',
      model: data?.model || OPENROUTER_DEEPSEEK_MODEL,
      mode: 'non-thinking',
      fallbackUsed: false,
      fallbackReason: null,
      usage: {
        promptTokens,
        cachedPromptTokens,
        outputTokens,
        tokensUsed,
        // Prefer OpenRouter's reported charge; otherwise use its catalog base price.
        estimatedProviderCostUsd:
          reportedCost ||
          cachedPromptTokens * 0.000000018 +
            uncachedPromptTokens * 0.00000009 +
            outputTokens * 0.00000018,
      },
    };
  } catch (error) {
    throw providerFailure('openrouter-deepseek', error);
  }
}

export async function requestOpenRouterLunaJson(request: ProviderRequest): Promise<TextAiResult> {
  const fetchImpl = request.fetchImpl || fetch;
  try {
    const response = await fetchWithTimeout(
      fetchImpl,
      OPENROUTER_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${request.apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'IELTS Ai Pro',
        },
        body: JSON.stringify({
          model: OPENROUTER_LUNA_MODEL,
          messages: [{ role: 'user', content: request.prompt }],
          response_format: { type: 'json_object' },
          reasoning: { effort: 'none', exclude: true },
          provider: { sort: 'latency', require_parameters: true },
          max_tokens: request.maxOutputTokens,
          stream: false,
        }),
      },
      request.timeoutMs || DEFAULT_TIMEOUT_MS
    );
    if (!response.ok) {
      throw new TextAiProviderError(`OpenRouter returned HTTP ${response.status}`, {
        provider: 'openrouter-luna',
        status: response.status,
        code: 'http_error',
      });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    const parsed = parseJsonText(text);
    assertValidJsonShape('openrouter-luna', parsed, request.validateJson);
    const promptTokens = positiveNumber(data?.usage?.prompt_tokens);
    const cachedPromptTokens = Math.min(
      promptTokens,
      positiveNumber(data?.usage?.prompt_cache_hit_tokens ?? data?.usage?.cache_read_input_tokens)
    );
    const outputTokens = positiveNumber(data?.usage?.completion_tokens);
    const tokensUsed = positiveNumber(data?.usage?.total_tokens) || promptTokens + outputTokens;
    const reportedCost = positiveNumber(data?.usage?.cost ?? data?.cost);
    const uncachedPromptTokens = Math.max(0, promptTokens - cachedPromptTokens);

    return {
      parsed,
      text,
      provider: 'openrouter-luna',
      model: data?.model || OPENROUTER_LUNA_MODEL,
      mode: 'non-thinking',
      fallbackUsed: false,
      fallbackReason: null,
      usage: {
        promptTokens,
        cachedPromptTokens,
        outputTokens,
        tokensUsed,
        // Prefer OpenRouter's billed cost. These catalog rates are only a
        // fallback for responses that omit cost metadata and may change.
        estimatedProviderCostUsd:
          reportedCost ||
          cachedPromptTokens * 0.00000001 +
            uncachedPromptTokens * 0.0000001 +
            outputTokens * 0.0000006,
      },
    };
  } catch (error) {
    throw providerFailure('openrouter-luna', error);
  }
}

export async function requestVercelGatewayLunaJson(
  request: ProviderRequest
): Promise<TextAiResult> {
  const fetchImpl = request.fetchImpl || fetch;
  try {
    const response = await fetchWithTimeout(
      fetchImpl,
      'https://ai-gateway.vercel.sh/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${request.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: VERCEL_GATEWAY_LUNA_MODEL,
          messages: [{ role: 'user', content: request.prompt }],
          // Gateway's Luna access currently rejects response_format on free
          // keys. The production prompt still requires JSON, and the shared
          // shape validator prevents accepting an incomplete response.
          reasoning: { effort: 'none', exclude: true },
          max_tokens: request.maxOutputTokens,
          stream: false,
        }),
      },
      request.timeoutMs || DEFAULT_TIMEOUT_MS
    );
    if (!response.ok) {
      throw new TextAiProviderError(`Vercel AI Gateway returned HTTP ${response.status}`, {
        provider: 'vercel-ai-gateway-luna',
        status: response.status,
        code: 'http_error',
      });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    const parsed = parseJsonText(text);
    assertValidJsonShape('vercel-ai-gateway-luna', parsed, request.validateJson);
    const promptTokens = positiveNumber(data?.usage?.prompt_tokens);
    const cachedPromptTokens = Math.min(
      promptTokens,
      positiveNumber(data?.usage?.prompt_cache_hit_tokens ?? data?.usage?.cache_read_input_tokens)
    );
    const outputTokens = positiveNumber(data?.usage?.completion_tokens);
    const tokensUsed = positiveNumber(data?.usage?.total_tokens) || promptTokens + outputTokens;
    const reportedCost = positiveNumber(data?.usage?.cost ?? data?.cost);
    const uncachedPromptTokens = Math.max(0, promptTokens - cachedPromptTokens);

    return {
      parsed,
      text,
      provider: 'vercel-ai-gateway-luna',
      model: data?.model || VERCEL_GATEWAY_LUNA_MODEL,
      mode: 'non-thinking',
      fallbackUsed: false,
      fallbackReason: null,
      usage: {
        promptTokens,
        cachedPromptTokens,
        outputTokens,
        tokensUsed,
        estimatedProviderCostUsd:
          reportedCost ||
          cachedPromptTokens * 0.00000001 +
            uncachedPromptTokens * 0.0000001 +
            outputTokens * 0.0000006,
      },
    };
  } catch (error) {
    throw providerFailure('vercel-ai-gateway-luna', error);
  }
}

export async function requestGeminiJson(request: ProviderRequest): Promise<TextAiResult> {
  const fetchImpl = request.fetchImpl || fetch;
  try {
    const response = await fetchWithTimeout(
      fetchImpl,
      `${GEMINI_BASE_URL}/${request.geminiModel || GEMINI_TEXT_FALLBACK_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': request.apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
          generationConfig: {
            temperature: request.temperature ?? 0.2,
            ...(request.topK === undefined ? {} : { topK: request.topK }),
            ...(request.topP === undefined ? {} : { topP: request.topP }),
            maxOutputTokens: request.maxOutputTokens,
            responseMimeType: 'application/json',
            ...(request.responseSchema ? { responseSchema: request.responseSchema } : {}),
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      },
      request.timeoutMs || DEFAULT_TIMEOUT_MS
    );
    if (!response.ok) {
      throw new TextAiProviderError(`Gemini returned HTTP ${response.status}`, {
        provider: 'gemini',
        status: response.status,
        code: 'http_error',
      });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = parseJsonText(text);
    assertValidJsonShape('gemini', parsed, request.validateJson);
    const promptTokens = positiveNumber(data?.usageMetadata?.promptTokenCount);
    const outputTokens =
      positiveNumber(data?.usageMetadata?.candidatesTokenCount) +
      positiveNumber(data?.usageMetadata?.thoughtsTokenCount);
    const tokensUsed =
      positiveNumber(data?.usageMetadata?.totalTokenCount) || promptTokens + outputTokens;
    const model = request.geminiModel || GEMINI_TEXT_FALLBACK_MODEL;
    const inputCostPerToken = model === GEMINI_SCORING_MODEL ? 0.0000003 : 0.0000001;
    const outputCostPerToken = model === GEMINI_SCORING_MODEL ? 0.0000025 : 0.0000004;

    return {
      parsed,
      text,
      provider: 'gemini',
      model,
      mode: 'non-thinking',
      fallbackUsed: false,
      fallbackReason: null,
      usage: {
        promptTokens,
        cachedPromptTokens: 0,
        outputTokens,
        tokensUsed,
        estimatedProviderCostUsd:
          promptTokens * inputCostPerToken + outputTokens * outputCostPerToken,
      },
    };
  } catch (error) {
    throw providerFailure('gemini', error);
  }
}

function fallbackReason(error: unknown) {
  if (!(error instanceof TextAiProviderError)) return 'deepseek_provider_failure';
  const status = error.status ? `_http_${error.status}` : '';
  const prefix = error.provider === 'openrouter-deepseek' ? 'openrouter_deepseek' : 'deepseek';
  return `${prefix}_${error.code}${status}`;
}

export async function requestJsonWithGeminiFallback(request: TextAiRequest): Promise<TextAiResult> {
  let primaryFailure: unknown = null;

  if (request.openRouterApiKey) {
    try {
      return await requestOpenRouterDeepSeekJson({
        ...request,
        apiKey: request.openRouterApiKey,
      });
    } catch (error) {
      primaryFailure = error;
    }
  }

  if (request.deepseekApiKey) {
    try {
      const result = await requestDeepSeekJson({
        ...request,
        apiKey: request.deepseekApiKey,
      });
      return {
        ...result,
        fallbackUsed: Boolean(primaryFailure),
        fallbackReason: primaryFailure ? fallbackReason(primaryFailure) : null,
      };
    } catch (error) {
      primaryFailure = error;
    }
  }

  if (request.geminiApiKey) {
    const result = await requestGeminiJson({
      ...request,
      apiKey: request.geminiApiKey,
    });
    return {
      ...result,
      fallbackUsed: Boolean(request.openRouterApiKey || request.deepseekApiKey),
      fallbackReason: primaryFailure ? fallbackReason(primaryFailure) : null,
    };
  }

  if (primaryFailure) throw primaryFailure;
  throw new TextAiProviderError('No text AI provider is configured', {
    provider: 'none',
    code: 'provider_not_configured',
  });
}

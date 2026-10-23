import { estimateTokenCostUsd } from './aiModelRegistry.ts';

export const DEEPSEEK_TEXT_MODEL = 'deepseek-v4-flash';
export const OPENROUTER_DEEPSEEK_MODEL = 'deepseek/deepseek-v4-flash-0731';
export const OPENROUTER_LUNA_MODEL = 'openai/gpt-6-luna';
export const VERCEL_GATEWAY_LUNA_MODEL = 'openai/gpt-6-luna';
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
  | 'gemini'
  | 'openrouter';

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
  systemPrompt?: string;
  openRouterApiKey?: string | null;
  /** Optional route-specific OpenRouter model. Defaults to the shared DeepSeek primary. */
  openRouterModel?: string;
  /** Route-specific compatibility switches for models that cannot disable reasoning. */
  openRouterDisableReasoning?: boolean;
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

function chatMessages(request: Pick<TextAiRequest, 'prompt' | 'systemPrompt'>) {
  return [
    ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
    { role: 'user', content: request.prompt },
  ];
}

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
  /**
   * What the rejected attempt still cost.
   *
   * A provider bills a response it has already generated even when we throw its
   * content away for being malformed or off-contract, so a caller that walks a
   * fallback chain can add this up instead of recording only the call that
   * finally worked.
   */
  usage: TextAiUsage | null;

  constructor(
    message: string,
    options: {
      provider: ProviderName | 'none';
      status?: number | null;
      code: string;
      usage?: TextAiUsage | null;
    }
  ) {
    super(message);
    this.name = 'TextAiProviderError';
    this.provider = options.provider;
    this.status = options.status ?? null;
    this.code = options.code;
    this.usage = options.usage ?? null;
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
    const arrayStart = stripped.indexOf('[');
    const arrayEnd = stripped.lastIndexOf(']');
    const objectStart = stripped.indexOf('{');
    if (arrayStart >= 0 && arrayEnd > arrayStart && (objectStart < 0 || arrayStart < objectStart)) {
      try {
        return JSON.parse(stripped.slice(arrayStart, arrayEnd + 1));
      } catch {
        // Try an object next; malformed array text stays rejected below.
      }
    }
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

/**
 * Read the billed usage from an OpenAI-shaped response body.
 *
 * This is deliberately computed before the content is parsed or validated: the
 * charge is already incurred by then, and `parseBilledJson` needs the figure to
 * attach to a rejection.
 */
function openAiShapedUsage(data: any, costModel: string): TextAiUsage {
  const promptTokens = positiveNumber(data?.usage?.prompt_tokens);
  const cachedPromptTokens = Math.min(
    promptTokens,
    positiveNumber(data?.usage?.prompt_cache_hit_tokens ?? data?.usage?.cache_read_input_tokens)
  );
  const outputTokens = positiveNumber(data?.usage?.completion_tokens);
  const tokensUsed = positiveNumber(data?.usage?.total_tokens) || promptTokens + outputTokens;
  const reportedCost = positiveNumber(data?.usage?.cost ?? data?.cost);
  return {
    promptTokens,
    cachedPromptTokens,
    outputTokens,
    tokensUsed,
    // Prefer the provider's own billed figure; the catalog rate is only used for
    // responses that omit cost metadata, and stays 0 for unpriced models.
    estimatedProviderCostUsd:
      reportedCost ||
      estimateTokenCostUsd(costModel, { promptTokens, cachedPromptTokens, outputTokens }),
  };
}

/** Parse and shape-check a generated answer, tagging a rejection with its cost. */
function parseBilledJson(
  provider: ProviderName,
  text: unknown,
  usage: TextAiUsage,
  validateJson?: (value: any) => boolean
) {
  try {
    const parsed = parseJsonText(text);
    assertValidJsonShape(provider, parsed, validateJson);
    return parsed;
  } catch (error) {
    if (error instanceof TextAiProviderError) error.usage = usage;
    throw error;
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
          messages: chatMessages(request),
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
    // The direct API never reports a cost, so this always uses the catalog rate.
    const usage = openAiShapedUsage(data, DEEPSEEK_TEXT_MODEL);
    const parsed = parseBilledJson('deepseek', text, usage, request.validateJson);

    return {
      parsed,
      text,
      provider: 'deepseek',
      model: DEEPSEEK_TEXT_MODEL,
      mode: 'non-thinking',
      fallbackUsed: false,
      fallbackReason: null,
      usage,
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
          messages: chatMessages(request),
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
          usage: { include: true },
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
    // Prefers OpenRouter's reported charge; otherwise its catalog base price.
    const usage = openAiShapedUsage(data, OPENROUTER_DEEPSEEK_MODEL);
    const parsed = parseBilledJson('openrouter-deepseek', text, usage, request.validateJson);

    return {
      parsed,
      text,
      provider: 'openrouter-deepseek',
      model: data?.model || OPENROUTER_DEEPSEEK_MODEL,
      mode: 'non-thinking',
      fallbackUsed: false,
      fallbackReason: null,
      usage,
    };
  } catch (error) {
    throw providerFailure('openrouter-deepseek', error);
  }
}

export async function requestOpenRouterLunaJson(
  request: ProviderRequest & { jsonMode?: boolean }
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
          model: OPENROUTER_LUNA_MODEL,
          messages: chatMessages(request),
          ...(request.jsonMode === false ? {} : { response_format: { type: 'json_object' } }),
          reasoning: { effort: 'none', exclude: true },
          provider: { sort: 'latency', require_parameters: true },
          max_tokens: request.maxOutputTokens,
          usage: { include: true },
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
    // Prefers OpenRouter's billed cost; the catalog rate is only a fallback for
    // responses that omit cost metadata.
    const usage = openAiShapedUsage(data, OPENROUTER_LUNA_MODEL);
    const parsed = parseBilledJson('openrouter-luna', text, usage, request.validateJson);

    return {
      parsed,
      text,
      provider: 'openrouter-luna',
      model: data?.model || OPENROUTER_LUNA_MODEL,
      mode: 'non-thinking',
      fallbackUsed: false,
      fallbackReason: null,
      usage,
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
          messages: chatMessages(request),
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
    // The gateway serves the same model, so it is priced from the Luna entry.
    const usage = openAiShapedUsage(data, OPENROUTER_LUNA_MODEL);
    const parsed = parseBilledJson('vercel-ai-gateway-luna', text, usage, request.validateJson);

    return {
      parsed,
      text,
      provider: 'vercel-ai-gateway-luna',
      model: data?.model || VERCEL_GATEWAY_LUNA_MODEL,
      mode: 'non-thinking',
      fallbackUsed: false,
      fallbackReason: null,
      usage,
    };
  } catch (error) {
    throw providerFailure('vercel-ai-gateway-luna', error);
  }
}

export type OpenRouterModelRequest = ProviderRequest & {
  /** Provider-qualified OpenRouter model id, e.g. "z-ai/glm-5.3-flash". */
  model: string;
  /** Ask OpenRouter for the billed cost in usage.cost instead of estimating it. */
  includeUsageAccounting?: boolean;
  /** Route only to upstreams that honour response_format/reasoning verbatim. */
  requireParameters?: boolean;
  /** Some models reject the explicit no-reasoning switch; drop it for those. */
  disableReasoning?: boolean;
  /**
   * Reasoning effort to request. Defaults to 'none'. Models that mandate
   * reasoning reject 'none' but accept 'low'/'minimal', which in practice still
   * yields zero reasoning tokens — use those instead of dropping the switch.
   */
  reasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high';
  /** Some models reject response_format: json_object. */
  jsonMode?: boolean;
  /**
   * Pin the upstream endpoints, best first. This model family is served by ~30
   * OpenRouter endpoints of very uneven quality, so benchmarks and any promoted
   * route need to name the ones they actually measured. Unset keeps the default
   * latency-sorted routing.
   */
  providerOrder?: string[];
};

/**
 * Model-agnostic OpenRouter JSON call. The named production routes above stay
 * pinned to their benchmarked models; this is what `npm run ai:bench` drives to
 * measure a candidate model on the same prompts before it is promoted.
 */
export async function requestOpenRouterJson(
  request: OpenRouterModelRequest
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
          model: request.model,
          messages: chatMessages(request),
          ...(request.jsonMode === false ? {} : { response_format: { type: 'json_object' } }),
          ...(request.disableReasoning === false
            ? {}
            : { reasoning: { effort: request.reasoningEffort || 'none', exclude: true } }),
          provider: {
            ...(request.providerOrder?.length
              ? { order: request.providerOrder, allow_fallbacks: false }
              : { sort: 'latency' }),
            require_parameters: request.requireParameters ?? true,
          },
          ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
          max_tokens: request.maxOutputTokens,
          ...(request.includeUsageAccounting ? { usage: { include: true } } : {}),
          stream: false,
        }),
      },
      request.timeoutMs || DEFAULT_TIMEOUT_MS
    );
    if (!response.ok) {
      throw new TextAiProviderError(`OpenRouter returned HTTP ${response.status}`, {
        provider: 'openrouter',
        status: response.status,
        code: 'http_error',
      });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    // Unknown candidate models are absent from the registry, so an unreported
    // cost stays 0 rather than silently guessing a rate.
    const usage = openAiShapedUsage(data, request.model);
    const parsed = parseBilledJson('openrouter', text, usage, request.validateJson);

    return {
      parsed,
      text,
      provider: 'openrouter',
      model: data?.model || request.model,
      mode: 'non-thinking',
      fallbackUsed: false,
      fallbackReason: null,
      usage,
    };
  } catch (error) {
    throw providerFailure('openrouter', error);
  }
}

/**
 * Streaming variant of `requestOpenRouterJson`. `onText` receives the whole reply text
 * so far after every delta; the final text is still parsed and shape-checked exactly
 * like the non-streaming call, and a rejection carries the billed cost when the
 * provider reported one. The deadline covers the whole stream, not just the headers.
 */
export async function requestOpenRouterJsonStream(
  request: OpenRouterModelRequest & { onText?: (textSoFar: string) => void }
): Promise<TextAiResult> {
  const fetchImpl = request.fetchImpl || fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), request.timeoutMs || DEFAULT_TIMEOUT_MS);
  let text = '';
  let usageChunk: any = null;
  let servedModel: string | null = null;
  try {
    const response = await fetchImpl(OPENROUTER_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${request.apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'IELTS Ai Pro',
      },
      body: JSON.stringify({
        model: request.model,
        messages: chatMessages(request),
        ...(request.jsonMode === false ? {} : { response_format: { type: 'json_object' } }),
        ...(request.disableReasoning === false
          ? {}
          : { reasoning: { effort: request.reasoningEffort || 'none', exclude: true } }),
        provider: {
          ...(request.providerOrder?.length
            ? { order: request.providerOrder, allow_fallbacks: false }
            : { sort: 'latency' }),
          require_parameters: request.requireParameters ?? true,
        },
        ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
        max_tokens: request.maxOutputTokens,
        usage: { include: true },
        stream: true,
        stream_options: { include_usage: true },
      }),
    });
    if (!response.ok || !response.body) {
      throw new TextAiProviderError(`OpenRouter returned HTTP ${response.status}`, {
        provider: 'openrouter',
        status: response.status,
        code: 'http_error',
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let done = false;
    const handleLine = (line: string) => {
      const trimmed = line.trim();
      // Comment lines such as ": OPENROUTER PROCESSING" keep the connection alive.
      if (!trimmed.startsWith('data:')) return;
      const payload = trimmed.slice(5).trim();
      if (!payload) return;
      if (payload === '[DONE]') {
        done = true;
        return;
      }
      let chunk: any;
      try {
        chunk = JSON.parse(payload);
      } catch {
        return;
      }
      if (chunk?.usage) usageChunk = chunk.usage;
      if (chunk?.model) servedModel = chunk.model;
      if (chunk?.error) {
        throw new TextAiProviderError('OpenRouter stream failed', {
          provider: 'openrouter',
          status: Number(chunk.error?.code) || null,
          code: 'stream_error',
        });
      }
      const delta = chunk?.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta) {
        text += delta;
        try {
          request.onText?.(text);
        } catch {
          // A display callback must never break generation or its cost accounting.
        }
      }
    };
    while (!done) {
      const { value, done: finished } = await reader.read();
      if (finished) break;
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf('\n');
      while (newline >= 0) {
        handleLine(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf('\n');
      }
    }
    if (buffer) handleLine(buffer);

    // Some upstreams omit the usage chunk on a stream. Never record that as free: fall
    // back to a deliberately generous character-based estimate priced at the registry rate.
    const usage = openAiShapedUsage(
      {
        usage:
          usageChunk ||
          (() => {
            const prompt = Math.ceil(
              ((request.systemPrompt || '').length + request.prompt.length) / 3
            );
            const output = Math.ceil(text.length / 3);
            return {
              prompt_tokens: prompt,
              completion_tokens: output,
              total_tokens: prompt + output,
            };
          })(),
      },
      request.model
    );
    const parsed = parseBilledJson('openrouter', text, usage, request.validateJson);
    return {
      parsed,
      text,
      provider: 'openrouter',
      model: servedModel || request.model,
      mode: 'non-thinking',
      fallbackUsed: false,
      fallbackReason: null,
      usage,
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw providerFailure(
        'openrouter',
        new TextAiProviderError('AI provider request timed out', {
          provider: 'openrouter',
          code: 'timeout',
          usage: usageChunk ? openAiShapedUsage({ usage: usageChunk }, request.model) : null,
        })
      );
    }
    throw providerFailure('openrouter', error);
  } finally {
    clearTimeout(timeout);
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
          ...(request.systemPrompt
            ? { systemInstruction: { parts: [{ text: request.systemPrompt }] } }
            : {}),
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
    const promptTokens = positiveNumber(data?.usageMetadata?.promptTokenCount);
    const outputTokens =
      positiveNumber(data?.usageMetadata?.candidatesTokenCount) +
      positiveNumber(data?.usageMetadata?.thoughtsTokenCount);
    const tokensUsed =
      positiveNumber(data?.usageMetadata?.totalTokenCount) || promptTokens + outputTokens;
    const model = request.geminiModel || GEMINI_TEXT_FALLBACK_MODEL;
    const usage: TextAiUsage = {
      promptTokens,
      cachedPromptTokens: 0,
      outputTokens,
      tokensUsed,
      estimatedProviderCostUsd: estimateTokenCostUsd(model, {
        promptTokens,
        cachedPromptTokens: 0,
        outputTokens,
      }),
    };
    const parsed = parseBilledJson('gemini', text, usage, request.validateJson);

    return {
      parsed,
      text,
      provider: 'gemini',
      model,
      mode: 'non-thinking',
      fallbackUsed: false,
      fallbackReason: null,
      usage,
    };
  } catch (error) {
    throw providerFailure('gemini', error);
  }
}

function fallbackReason(error: unknown) {
  if (!(error instanceof TextAiProviderError)) return 'deepseek_provider_failure';
  const status = error.status ? `_http_${error.status}` : '';
  const prefix =
    error.provider === 'openrouter-deepseek'
      ? 'openrouter_deepseek'
      : error.provider === 'openrouter'
        ? 'openrouter'
        : 'deepseek';
  return `${prefix}_${error.code}${status}`;
}

function isRepairableJsonError(error: unknown) {
  return (
    error instanceof TextAiProviderError &&
    (error.code === 'malformed_json' || error.code === 'invalid_schema')
  );
}

export async function requestJsonWithGeminiFallback(request: TextAiRequest): Promise<TextAiResult> {
  let primaryFailure: unknown = null;

  if (request.openRouterApiKey) {
    try {
      return request.openRouterModel
        ? await requestOpenRouterJson({
            ...request,
            apiKey: request.openRouterApiKey,
            model: request.openRouterModel,
            includeUsageAccounting: true,
            disableReasoning: request.openRouterDisableReasoning,
          })
        : await requestOpenRouterDeepSeekJson({
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
    let result: TextAiResult;
    try {
      result = await requestGeminiJson({ ...request, apiKey: request.geminiApiKey });
    } catch (error) {
      if (!isRepairableJsonError(error)) throw error;
      result = await requestGeminiJson({
        ...request,
        apiKey: request.geminiApiKey,
        temperature: 0,
      });
    }
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

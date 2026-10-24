import {
  requestOpenRouterDeepSeekJson,
  requestOpenRouterLunaJson,
  requestOpenRouterJson,
  TextAiProviderError,
} from '../_shared/textAiProvider.ts';
import {
  VOCAB_DEFINE_DEEPSEEK_FALLBACK_MODEL,
  VOCAB_DEFINE_GLM_FALLBACK_MODEL,
  VOCAB_DEFINE_LUNA_FALLBACK_MODEL,
  VOCAB_DEFINE_MAX_OUTPUT_TOKENS,
  VOCAB_DEFINE_PRIMARY_MODEL,
} from '../_shared/aiModelRegistry.ts';
import { buildDefinePrompt, validateRawDefine } from './validation.ts';

const SYSTEM_PROMPT =
  'You are a careful IELTS vocabulary tutor for non-native English learners. Return only valid JSON.';

/** A real dictionary's phonetic is better evidence than the model's own IPA. */
export async function fetchDictionaryPhonetic(
  word: string,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  if (word.includes(' ')) return '';
  try {
    const res = await fetchImpl(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: AbortSignal.timeout(2_000) }
    );
    if (!res.ok) return '';
    const data = await res.json();
    const entry = Array.isArray(data) ? data[0] : null;
    return (
      entry?.phonetic || entry?.phonetics?.find((item: { text?: string }) => item?.text)?.text || ''
    );
  } catch {
    return '';
  }
}

export type CardFailure = { model: string; error: unknown };

/**
 * Walk the model chain until one returns a card that passes the contract.
 * Every attempt that was billed is returned in `failures` so the budget can be
 * charged for the whole chain, not just the call that worked.
 */
export async function generateCard(
  input: { word: string; hint: string; language: string },
  apiKey: string | undefined,
  fetchImpl?: typeof fetch
) {
  const failures: CardFailure[] = [];
  if (!apiKey) {
    failures.push({
      model: VOCAB_DEFINE_PRIMARY_MODEL,
      error: new TextAiProviderError('OpenRouter API key is not configured', {
        provider: 'openrouter',
        code: 'missing_api_key',
      }),
    });
    return { generated: null, failures };
  }

  const prompt = buildDefinePrompt(input);
  const validateJson = (value: any) => validateRawDefine(value, input.language, input.word);
  const attempts: Array<[string, () => Promise<any>]> = [
    [
      VOCAB_DEFINE_PRIMARY_MODEL,
      () =>
        requestOpenRouterJson({
          apiKey,
          fetchImpl,
          model: VOCAB_DEFINE_PRIMARY_MODEL,
          prompt,
          systemPrompt: SYSTEM_PROMPT,
          maxOutputTokens: Math.min(VOCAB_DEFINE_MAX_OUTPUT_TOKENS * 2, 2048),
          timeoutMs: 8_000,
          includeUsageAccounting: true,
          disableReasoning: true,
          reasoningEffort: 'low',
          temperature: 0.2,
          validateJson,
        }),
    ],
    [
      VOCAB_DEFINE_LUNA_FALLBACK_MODEL,
      () =>
        requestOpenRouterLunaJson({
          apiKey,
          fetchImpl,
          prompt,
          systemPrompt: SYSTEM_PROMPT,
          maxOutputTokens: VOCAB_DEFINE_MAX_OUTPUT_TOKENS,
          timeoutMs: 8_000,
          validateJson,
        }),
    ],
    [
      VOCAB_DEFINE_DEEPSEEK_FALLBACK_MODEL,
      () =>
        requestOpenRouterDeepSeekJson({
          apiKey,
          fetchImpl,
          prompt,
          systemPrompt: SYSTEM_PROMPT,
          maxOutputTokens: VOCAB_DEFINE_MAX_OUTPUT_TOKENS,
          timeoutMs: 10_000,
          validateJson,
        }),
    ],
    [
      VOCAB_DEFINE_GLM_FALLBACK_MODEL,
      () =>
        requestOpenRouterJson({
          apiKey,
          fetchImpl,
          model: VOCAB_DEFINE_GLM_FALLBACK_MODEL,
          prompt,
          systemPrompt: SYSTEM_PROMPT,
          maxOutputTokens: Math.min(VOCAB_DEFINE_MAX_OUTPUT_TOKENS * 2, 2048),
          timeoutMs: 10_000,
          includeUsageAccounting: true,
          disableReasoning: true,
          reasoningEffort: 'low',
          temperature: 0.2,
          validateJson,
        }),
    ],
  ];

  for (const [model, request] of attempts) {
    try {
      return { generated: await request(), failures };
    } catch (error) {
      failures.push({ model, error });
    }
  }
  return { generated: null, failures };
}

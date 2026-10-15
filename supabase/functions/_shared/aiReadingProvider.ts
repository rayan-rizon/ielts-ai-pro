import {
  READING_EXPLANATION_SYSTEM_PROMPT,
  validateReadingExplanations,
} from './aiReadingExplanations.js';
import { AI_ROUTES, estimateTokenCostUsd } from './aiModelRegistry.ts';
import { parseJsonText } from './textAiProvider.ts';
import { validateAiReadingDraft } from './aiReadingDraft.js';
import { AI_READING_SYSTEM_PROMPT, buildAiReadingPrompt } from './aiReadingPrompt.ts';

type ReadingInput = {
  action?: string;
  passages?: any[];
  passageText: string;
  questionText: string;
  answerText: string;
  expectedQuestions: number;
  suppliedAnswers: Record<string, string>;
  images: Array<{ role: string; dataUrl: string; sectionNumber?: number | null }>;
};
type Usage = { tokensUsed: number; estimatedProviderCostUsd: number };
export class AiReadingGenerationError extends Error {
  usage: Usage;
  constructor(message: string, usage: Usage) {
    super(message);
    this.usage = usage;
  }
}

function usageFor(data: any, model: string): Usage {
  const positive = (value: unknown) =>
    Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  const promptTokens = positive(data.usage?.prompt_tokens);
  const outputTokens = positive(data.usage?.completion_tokens);
  const cachedPromptTokens = Math.min(
    promptTokens,
    positive(data.usage?.prompt_tokens_details?.cached_tokens)
  );
  return {
    tokensUsed: positive(data.usage?.total_tokens) || promptTokens + outputTokens,
    estimatedProviderCostUsd:
      positive(data.usage?.cost) ||
      estimateTokenCostUsd(model, { promptTokens, outputTokens, cachedPromptTokens }),
  };
}

async function attempt(
  input: ReadingInput,
  model: string,
  apiKey: string,
  fetchImpl: typeof fetch,
  route: any,
  adapter: any,
  reasoningEffort: 'none' | 'low'
) {
  const content: any[] = [
    {
      type: 'text',
      text:
        input.action === 'explanations'
          ? JSON.stringify(input.passages)
          : buildAiReadingPrompt(input),
    },
  ];
  input.images.forEach((image, i) =>
    content.push(
      {
        type: 'text',
        text: `Screenshot ${i + 1}: ${image.sectionNumber ? `passage ${image.sectionNumber}, ` : ''} ${image.role} source. Inspect coloured highlights. For passage source images, include every visibly highlighted answer phrase in section.highlights with its corresponding question_numbers. Do not omit highlight data.`,
      },
      { type: 'image_url', image_url: { url: image.dataUrl } }
    )
  );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), route.timeoutMs);
  try {
    const response = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'IELTS AI Pro - Admin test import',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              input.action === 'explanations'
                ? READING_EXPLANATION_SYSTEM_PROMPT
                : adapter.systemPrompt,
          },
          { role: 'user', content },
        ],
        response_format: { type: 'json_object' },
        provider: { sort: 'throughput', require_parameters: true },
        usage: { include: true },
        reasoning: { effort: reasoningEffort, exclude: true },
        // The completion includes entire passages, not just question answers.
        max_tokens: route.maxOutputTokens,
        stream: false,
      }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const detail =
        typeof error.error?.message === 'string'
          ? error.error.message
              .replaceAll(apiKey, '[redacted]')
              .replace(/data:image[^\s]+/g, '[image]')
              .slice(0, 240)
          : '';
      throw new Error(`Provider returned HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
    }
    const data = await response.json();
    const usage = usageFor(data, model);
    try {
      if (data.choices?.[0]?.finish_reason === 'length')
        throw new Error('Output was incomplete. Try fewer passages.');
      if (input.action === 'explanations')
        return {
          explanations: validateReadingExplanations(
            parseJsonText(data.choices?.[0]?.message?.content),
            input
          ),
          usage,
        };
      const draft = adapter.validateDraft(
        parseJsonText(data.choices?.[0]?.message?.content),
        input
      );
      if (!input.images.some((image) => image.role === 'passage')) {
        const source = input.passageText.replace(/\s+/g, ' ').trim();
        for (const section of draft.sections) {
          if (!source.includes(section.content.replace(/\s+/g, ' ').trim())) {
            throw new Error('The imported passage differs from your supplied text.');
          }
        }
      }
      return { draft, usage };
    } catch (error) {
      throw new AiReadingGenerationError(
        error instanceof Error ? error.message : 'Invalid draft.',
        usage
      );
    }
  } finally {
    clearTimeout(timer);
  }
}

// Exactly one primary and one inexpensive fallback. A rejection is still billed.
// This function has no database client and cannot write or publish a test.
export async function generateAiReadingDraft(
  input: ReadingInput,
  apiKey: string,
  fetchImpl = fetch,
  adapter = {
    routeId: 'admin-reading-draft',
    systemPrompt: AI_READING_SYSTEM_PROMPT,
    validateDraft: validateAiReadingDraft,
  }
) {
  const route = AI_ROUTES.find((value) => value.id === adapter.routeId);
  if (!route || !apiKey) throw new Error('Admin test AI is not configured.');
  const totals = { tokensUsed: 0, estimatedProviderCostUsd: 0 };
  const failures: string[] = [];
  for (const [index, step] of route.steps.entries()) {
    try {
      const result = await attempt(
        input,
        step.model,
        apiKey,
        fetchImpl,
        route,
        adapter,
        step.reasoningEffort || 'none'
      );
      return {
        ...(input.action === 'explanations'
          ? { explanations: result.explanations }
          : { draft: result.draft }),
        model: step.model,
        answerSource:
          input.action === 'explanations'
            ? 'supplied'
            : input.answerText || input.images.some((image) => image.role === 'answers')
              ? 'supplied'
              : 'inferred',
        fallbackUsed: index > 0,
        usage: {
          tokensUsed: totals.tokensUsed + result.usage.tokensUsed,
          estimatedProviderCostUsd:
            totals.estimatedProviderCostUsd + result.usage.estimatedProviderCostUsd,
        },
      };
    } catch (error) {
      failures.push(
        `${step.model}: ${error instanceof Error ? error.message : 'Generation failed.'}`
      );
      if (error instanceof AiReadingGenerationError) {
        totals.tokensUsed += error.usage.tokensUsed;
        totals.estimatedProviderCostUsd += error.usage.estimatedProviderCostUsd;
      }
    }
  }
  throw new AiReadingGenerationError(
    `Could not create a complete, validated draft. ${failures.join('; ')}`,
    totals
  );
}

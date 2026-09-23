import { describe, expect, it, vi } from 'vitest';
import { requestOpenRouterWritingFeedback } from '../../../supabase/functions/_shared/writingProvider';

const model = 'openai/gpt-6-luna';
const request = {
  model,
  apiKey: 'openrouter-test-key',
  systemInstruction: 'Mark the essay.',
  userContentParts: [{ text: 'Essay text.' }],
  schemaText: 'Return JSON.',
  requiredCriterionKey: 'TaskResponse',
  seed: 17,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const validFeedback = {
  criteriaScores: {
    TaskResponse: 7,
    CoherenceAndCohesion: 7,
    LexicalResource: 7,
    GrammaticalRangeAndAccuracy: 7,
  },
};

describe('Writing OpenRouter provider contract', () => {
  it('sends only Luna-compatible parameters while retaining strict provider routing', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        model,
        choices: [{ message: { content: JSON.stringify(validFeedback) } }],
        usage: { prompt_tokens: 100, completion_tokens: 40, total_tokens: 140 },
      })
    );

    const result = await requestOpenRouterWritingFeedback({ ...request, fetchImpl });
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);

    expect(body).toMatchObject({
      model,
      response_format: { type: 'json_object' },
      reasoning: { effort: 'none', exclude: true },
      seed: 17,
      max_tokens: 4096,
      provider: { sort: 'throughput', require_parameters: true },
      usage: { include: true },
    });
    expect(body).not.toHaveProperty('temperature');
    expect(body).not.toHaveProperty('top_p');
    expect(result).toMatchObject({ ok: true, parsedFeedback: validFeedback });
  });

  it('preserves the HTTP status so an upstream contract rejection is diagnosable', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: 'no compatible endpoint' }, 400));

    const result = await requestOpenRouterWritingFeedback({ ...request, fetchImpl });

    expect(result).toMatchObject({
      ok: false,
      failureReason: 'openrouter_luna_http_error_http_400',
      providerStatus: 400,
    });
  });

  it('classifies invalid JSON and retains billed usage for rejected output', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        model,
        choices: [{ message: { content: '{not json' } }],
        usage: { prompt_tokens: 100, completion_tokens: 40, total_tokens: 140, cost: 0.0004 },
      })
    );

    const result = await requestOpenRouterWritingFeedback({ ...request, fetchImpl });

    expect(result).toMatchObject({
      ok: false,
      failureReason: 'openrouter_luna_malformed_json',
      tokensUsed: 140,
      estimatedProviderCostUsd: 0.0004,
    });
  });
});

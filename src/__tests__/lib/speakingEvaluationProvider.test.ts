import { describe, expect, it, vi } from 'vitest';
import { requestSpeakingEvaluation } from '../../../supabase/functions/_shared/speakingEvaluationProvider';
import {
  GEMINI_SCORING_MODEL,
  OPENROUTER_DEEPSEEK_MODEL,
} from '../../../supabase/functions/_shared/textAiProvider';

const validEvaluation = {
  fluency: 7,
  lexical: 7,
  grammar: 7,
  pronunciation: 7,
  feedback: 'A clear response.',
  partScores: {
    part1: { band: 7, keyObservation: 'Clear.' },
    part2: { band: 7, keyObservation: 'Developed.' },
    part3: { band: 7, keyObservation: 'Reasoned.' },
  },
  criterionNotes: {
    fluency: 'Mostly fluent.',
    lexical: 'Flexible.',
    grammar: 'Varied.',
    pronunciation: 'Clear.',
  },
  strengths: ['Clear organization.'],
  improvements: [{ area: 'Fluency', tip: 'Reduce hesitation.' }],
  targetBandTips: 'Develop examples further.',
};

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function deepSeekResponse() {
  return jsonResponse({
    model: OPENROUTER_DEEPSEEK_MODEL,
    choices: [{ message: { content: JSON.stringify(validEvaluation) } }],
    usage: { prompt_tokens: 1000, completion_tokens: 400, total_tokens: 1400, cost: 0.00034 },
  });
}

function geminiResponse() {
  return jsonResponse({
    candidates: [{ content: { parts: [{ text: JSON.stringify(validEvaluation) }] } }],
    usageMetadata: {
      promptTokenCount: 1000,
      candidatesTokenCount: 400,
      totalTokenCount: 1400,
    },
  });
}

const baseRequest = {
  prompt: 'Evaluate this speaking test.',
  responseSchema: { type: 'OBJECT' },
  openRouterApiKey: 'openrouter-test-key',
  geminiApiKey: 'gemini-test-key',
};

describe('speaking evaluation provider routing', () => {
  it('uses OpenRouter DeepSeek first for a normal audio-backed test', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(deepSeekResponse());

    const result = await requestSpeakingEvaluation({
      ...baseRequest,
      hasPronunciationEvidence: true,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(result).toMatchObject({
      provider: 'openrouter-deepseek',
      model: OPENROUTER_DEEPSEEK_MODEL,
      fallbackUsed: false,
      providerCalls: 1,
      routingReason: 'deepseek_primary',
    });
  });

  it('falls through DeepSeek to Gemini', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'OpenRouter unavailable' }, 503))
      .mockResolvedValueOnce(geminiResponse());

    const result = await requestSpeakingEvaluation({
      ...baseRequest,
      hasPronunciationEvidence: true,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      provider: 'gemini',
      fallbackUsed: true,
      fallbackReason: 'openrouter_deepseek_http_error_http_503',
      providerCalls: 2,
      routingReason: 'gemini_fallback',
    });
  });

  it('falls back to Gemini when DeepSeek is unavailable', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'unavailable' }, 503))
      .mockResolvedValueOnce(geminiResponse());

    const result = await requestSpeakingEvaluation({
      ...baseRequest,
      hasPronunciationEvidence: true,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1][0]).toContain(`${GEMINI_SCORING_MODEL}:generateContent`);
    expect(result).toMatchObject({
      provider: 'gemini',
      model: GEMINI_SCORING_MODEL,
      fallbackUsed: true,
      fallbackReason: 'openrouter_deepseek_http_error_http_503',
      providerCalls: 2,
      routingReason: 'gemini_fallback',
    });
  });

  it('falls back to Gemini when DeepSeek returns incomplete scoring JSON', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [{ message: { content: '{"fluency":7}' } }],
          usage: {},
        })
      )
      .mockResolvedValueOnce(geminiResponse());

    const result = await requestSpeakingEvaluation({
      ...baseRequest,
      hasPronunciationEvidence: true,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      provider: 'gemini',
      fallbackUsed: true,
      fallbackReason: 'openrouter_deepseek_invalid_schema',
      providerCalls: 2,
    });
  });

  it('routes transcript-only evidence directly to Gemini', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(geminiResponse());

    const result = await requestSpeakingEvaluation({
      ...baseRequest,
      hasPronunciationEvidence: false,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toContain(`${GEMINI_SCORING_MODEL}:generateContent`);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).generationConfig).toMatchObject({
      responseSchema: { type: 'OBJECT' },
      thinkingConfig: { thinkingBudget: 0 },
    });
    expect(result).toMatchObject({
      provider: 'gemini',
      fallbackUsed: false,
      fallbackReason: null,
      providerCalls: 1,
      routingReason: 'gemini_missing_audio_evidence',
    });
  });

  it('retries Gemini once when its first JSON response is malformed', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ candidates: [{ content: { parts: [{ text: 'not-json' }] } }] })
      )
      .mockResolvedValueOnce(geminiResponse());

    const result = await requestSpeakingEvaluation({
      ...baseRequest,
      hasPronunciationEvidence: false,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.providerCalls).toBe(2);
    expect(result.provider).toBe('gemini');
  });

  it('moves a rate-limited transcript-only evaluation to another provider', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'RESOURCE_EXHAUSTED' }, 429))
      .mockResolvedValueOnce(deepSeekResponse());

    const result = await requestSpeakingEvaluation({
      ...baseRequest,
      hasPronunciationEvidence: false,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][0]).toContain(`${GEMINI_SCORING_MODEL}:generateContent`);
    expect(fetchImpl.mock.calls[1][0]).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(result).toMatchObject({
      provider: 'openrouter-deepseek',
      fallbackUsed: true,
      fallbackReason: 'gemini_http_error_http_429',
      providerCalls: 2,
      routingReason: 'deepseek_fallback',
    });
  });
});

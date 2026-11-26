import { describe, expect, it, vi } from 'vitest';

import {
  composePracticeSpokenReply,
  generatePracticeCoachReply,
  PRACTICE_COACH_MODELS,
  sanitizePracticeCoachReply,
  shouldSpeakPracticeCoach,
} from '../../../supabase/functions/_shared/practiceCoach.ts';
import { MODELS } from '../../../supabase/functions/_shared/aiModelRegistry.ts';

const transcript =
  'my hometown is dhaka it is very big city and there is many peoples living there';

function okResult(parsed: unknown, model: string) {
  return {
    parsed,
    text: JSON.stringify(parsed),
    provider: 'openrouter',
    model,
    mode: 'non-thinking',
    fallbackUsed: false,
    fallbackReason: null,
    usage: {
      promptTokens: 400,
      cachedPromptTokens: 0,
      outputTokens: 200,
      tokensUsed: 600,
      estimatedProviderCostUsd: 0.0002,
    },
  } as any;
}

const goodReply = {
  spoken:
    "Dhaka sounds busy. You said there is many peoples; it's better to say there are many people.",
};

describe('practice coach reply validation', () => {
  it('keeps the spoken reply and strips markdown', () => {
    expect(sanitizePracticeCoachReply(goodReply)).toEqual(goodReply);
    expect(sanitizePracticeCoachReply({ spoken: '**Nice** answer about _Dhaka_ today.' })).toEqual({
      spoken: 'Nice answer about Dhaka today.',
    });
  });

  it('rejects empty or missing spoken text', () => {
    expect(sanitizePracticeCoachReply({ spoken: '' })).toBeNull();
    expect(sanitizePracticeCoachReply({ spoken: 'Okay.' })).toBeNull();
    expect(sanitizePracticeCoachReply(null)).toBeNull();
  });
});

describe('practice coach model chain', () => {
  it('uses registered models, fastest first', () => {
    for (const model of PRACTICE_COACH_MODELS) expect(MODELS[model], model).toBeDefined();
    expect(PRACTICE_COACH_MODELS[0]).toBe('deepseek/deepseek-v4.1-flash');
  });

  it('falls back to the next model and never sends temperature to Luna', async () => {
    const requestJson = vi
      .fn()
      .mockRejectedValueOnce(new Error('HTTP 503'))
      .mockImplementationOnce(async (request: any) => {
        expect(request.validateJson(goodReply)).toBe(true);
        return okResult(goodReply, request.model);
      });

    const result = await generatePracticeCoachReply({
      apiKey: 'key',
      partNumber: 1,
      question: 'Where is your hometown?',
      transcript,
      requestJson,
    });

    expect(requestJson).toHaveBeenCalledTimes(2);
    expect(requestJson.mock.calls[0][0]).toMatchObject({ temperature: 0.6 });
    expect(requestJson.mock.calls[1][0].model).toBe('openai/gpt-6-luna');
    expect(requestJson.mock.calls[1][0]).not.toHaveProperty('temperature');
    // The first model's attempt leaves room for the fallback.
    expect(requestJson.mock.calls[0][0].timeoutMs).toBeLessThanOrEqual(4000);
    expect(result.source).toBe('ai');
    expect(result.spoken).toBe(goodReply.spoken);
  });

  it('throws when every model fails so the caller can use the scripted line', async () => {
    const requestJson = vi.fn().mockRejectedValue(new Error('down'));
    await expect(
      generatePracticeCoachReply({
        apiKey: 'key',
        partNumber: 1,
        question: 'Q',
        transcript,
        requestJson,
      })
    ).rejects.toThrow('down');
  });
});

describe('practice coach spoken reply', () => {
  it('appends the bank question after the coach, never inventing one', () => {
    const text = composePracticeSpokenReply({
      coachSpoken: 'Nice detail.',
      action: 'advance',
      nextQuestion: 'Do you work or study?',
      questionIndex: 1,
      partNumber: 1,
    });
    expect(text.startsWith('Nice detail.')).toBe(true);
    expect(text.endsWith('Do you work or study?')).toBe(true);
    expect(
      composePracticeSpokenReply({
        coachSpoken: 'Good.',
        action: 'complete_part',
        questionIndex: 0,
        partNumber: 2,
      })
    ).toContain('end of Part 2');
  });

  it('asks the last question like any other, then closes the part', () => {
    expect(
      composePracticeSpokenReply({
        coachSpoken: 'Nice.',
        action: 'advance',
        nextQuestion: 'Do you like fruit?',
        questionIndex: 3,
        partNumber: 1,
      })
    ).not.toContain('last question');
    expect(
      composePracticeSpokenReply({
        coachSpoken: '',
        action: 'complete_part',
        questionIndex: 3,
        partNumber: 1,
      })
    ).toBe("That's the end of Part 1. Well done. When you're ready, we'll move on to Part 2.");
    expect(
      composePracticeSpokenReply({
        coachSpoken: 'Good.',
        action: 'complete_part',
        questionIndex: 3,
        partNumber: 3,
      })
    ).toContain('end of your speaking practice');
  });

  it('only coaches real answers', () => {
    expect(shouldSpeakPracticeCoach('advance')).toBe(true);
    expect(shouldSpeakPracticeCoach('complete_part')).toBe(true);
    expect(shouldSpeakPracticeCoach('repeat_prompt')).toBe(false);
    expect(shouldSpeakPracticeCoach('continue_part2')).toBe(false);
    // An answer that missed the question is still coached, then asked again.
    expect(shouldSpeakPracticeCoach('clarify_once', 'off_topic')).toBe(true);
    expect(shouldSpeakPracticeCoach('clarify_once', 'meta_microphone')).toBe(false);
    // An irrelevant request is never coached as if it were an answer.
    expect(shouldSpeakPracticeCoach('advance', 'unrelated')).toBe(false);
    expect(shouldSpeakPracticeCoach('advance', 'prompt_injection')).toBe(false);
    expect(
      composePracticeSpokenReply({
        coachSpoken: 'You said I am enjoy it; say I enjoy it.',
        action: 'clarify_once',
        examinerText: 'Please answer the question directly: When do you eat bread?',
        questionIndex: 0,
        partNumber: 1,
      })
    ).toBe(
      'You said I am enjoy it; say I enjoy it. Please answer the question directly: When do you eat bread?'
    );
  });
});

import { describe, expect, it, vi } from 'vitest';

import {
  composePracticeSpokenReply,
  generatePracticeCoachReply,
  PRACTICE_COACH_MODELS,
  sanitizePracticeCoachReply,
  shouldSpeakPracticeCoach,
} from '../../../supabase/functions/_shared/practiceCoach.ts';
import { MODELS } from '../../../supabase/functions/_shared/aiModelRegistry.ts';
import { createBargeInDetector } from '@/features/testing/speaking/utils/bargeInDetector';

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

  it('only coaches real answers', () => {
    expect(shouldSpeakPracticeCoach('advance')).toBe(true);
    expect(shouldSpeakPracticeCoach('complete_part')).toBe(true);
    expect(shouldSpeakPracticeCoach('repeat_prompt')).toBe(false);
    expect(shouldSpeakPracticeCoach('continue_part2')).toBe(false);
    // An answer that missed the question is still coached, then asked again.
    expect(shouldSpeakPracticeCoach('clarify_once', 'off_topic')).toBe(true);
    expect(shouldSpeakPracticeCoach('clarify_once', 'meta_microphone')).toBe(false);
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

describe('barge-in detector', () => {
  const run = (
    detector: ReturnType<typeof createBargeInDetector>,
    levels: number[],
    clock: { now: number }
  ) => {
    let fired = false;
    for (const rms of levels) {
      clock.now += 50;
      fired = detector.push(rms, clock.now) || fired;
    }
    return fired;
  };

  it('ignores the coach echo and a cough, then detects real speech', () => {
    const detector = createBargeInDetector();
    const clock = { now: 0 };
    expect(run(detector, Array(14).fill(0.03), clock)).toBe(false); // learn the echo
    expect(run(detector, Array(20).fill(0.05), clock)).toBe(false); // echo < 2.6x
    expect(run(detector, [0.2, 0.2, 0.2, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01], clock)).toBe(
      false
    ); // a cough
    // Real speech: loud syllables with quiet gaps between them.
    expect(run(detector, [0.2, 0.01, 0.2, 0.2, 0.01, 0.2, 0.2, 0.2, 0.01, 0.2], clock)).toBe(true);
  });

  it('fires on the measured loudness of a real spoken answer', () => {
    const detector = createBargeInDetector();
    const clock = { now: 0 };
    const measured = [
      0, 0, 0, 0, 0.005, 0.005, 0.005, 0.03, 0.063, 0.005, 0.053, 0.049, 0.038, 0.006, 0.033, 0.02,
      0.007, 0.007, 0.065, 0.016,
    ];
    // Each value stands for four frames in the recording it was sampled from.
    expect(
      run(
        detector,
        measured.flatMap((value) => [value, value, value, value]),
        clock
      )
    ).toBe(true);
  });

  it('keeps an absolute floor in a silent room', () => {
    const detector = createBargeInDetector();
    const clock = { now: 0 };
    run(detector, Array(14).fill(0), clock);
    run(detector, Array(10).fill(0.02), clock);
    expect(detector.threshold).toBeGreaterThanOrEqual(0.025);
  });
});

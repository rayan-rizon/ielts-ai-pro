import { describe, expect, it } from 'vitest';

import { normalizeSpeakingDeepDive } from './speakingDeepDive';

const question = {
  part: 1,
  question: 'Where did you grow up?',
  candidateAnswer: 'I grew up in Dhaka.',
};

describe('normalizeSpeakingDeepDive', () => {
  it('keeps the current array representation', () => {
    expect(normalizeSpeakingDeepDive([question])).toEqual([question]);
  });

  it('restores historical metadata-bearing objects with numeric question keys', () => {
    expect(
      normalizeSpeakingDeepDive({
        0: question,
        1: { ...question, part: 2, question: 'Describe a journey.' },
        model: 'gemini-2.5-flash',
        evaluationVersion: '2026-07-29-v5',
      })
    ).toEqual([question, { ...question, part: 2, question: 'Describe a journey.' }]);
  });

  it('accepts the explicit questions collection used by new responses', () => {
    expect(normalizeSpeakingDeepDive({ questions: [question], model: 'gemini-2.5-flash' })).toEqual(
      [question]
    );
  });

  it('returns null for metadata-only or malformed feedback', () => {
    expect(normalizeSpeakingDeepDive({ model: 'gemini-2.5-flash' })).toBeNull();
  });
});

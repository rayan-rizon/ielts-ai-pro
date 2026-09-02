import { describe, expect, it } from 'vitest';

import { computeSpeakingProgress } from './SpeakingGrid';

describe('Speaking test-card progress', () => {
  it('never shows a Part 3 session as 100% before it has completed', () => {
    expect(
      computeSpeakingProgress(
        {
          is_completed: false,
          answers: { currentQuestionIndex: 1 },
          content_data: { currentPart: 3, speakingVersion: 'v2' },
        },
        { total_questions: 3 },
        3
      )
    ).toBe(83);
  });

  it('uses the authoritative question count once the V2 state has been saved', () => {
    expect(
      computeSpeakingProgress(
        {
          is_completed: false,
          answers: { currentQuestionIndex: 1 },
          content_data: {
            currentPart: 3,
            speakingVersion: 'v2',
            speakingV2State: { questionCount: 3 },
          },
        },
        { total_questions: 3 },
        3
      )
    ).toBe(89);
  });

  it('does not label a resumable legacy Part 3 snapshot as complete', () => {
    expect(
      computeSpeakingProgress(
        {
          is_completed: false,
          content_data: { currentPart: 3 },
        },
        { total_questions: 3 },
        3
      )
    ).toBe(83);
  });
});

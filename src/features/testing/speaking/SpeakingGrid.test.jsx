import { describe, expect, it } from 'vitest';

import { computeSpeakingProgress } from './SpeakingGrid';
import { resolveSpeakingAttemptState } from './speakingCardHelpers';

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

describe('Speaking test-card attempt state', () => {
  it('does not offer resume for an expired unfinished V2 session', () => {
    expect(
      resolveSpeakingAttemptState({
        is_completed: false,
        content_data: {
          speakingVersion: 'v2',
          speakingV2State: { status: 'expired' },
        },
      })
    ).toEqual({ isResuming: false, isCompleted: false, needsRestart: true });
  });

  it('treats an elapsed practice resume deadline as restartable even before refresh syncs status', () => {
    expect(
      resolveSpeakingAttemptState(
        {
          is_completed: false,
          content_data: {
            speakingVersion: 'v2',
            speakingV2State: {
              status: 'paused',
              resumeExpiresAt: '2026-09-13T00:00:00.000Z',
            },
          },
        },
        Date.parse('2026-09-14T00:00:00.000Z')
      )
    ).toEqual({ isResuming: false, isCompleted: false, needsRestart: true });
  });
});

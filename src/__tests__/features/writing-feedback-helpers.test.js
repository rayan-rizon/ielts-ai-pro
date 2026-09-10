import { describe, expect, it } from 'vitest';
import {
  getWritingFeedbacks,
  getWritingEvaluationCreditMessage,
  hasValidAiFeedback,
  isStalePendingWritingEvaluation,
  resolveWritingSessionState,
  summarizeWritingEvaluationFailure,
} from '@/features/testing/writing/writingFeedbackHelpers';

describe('writing feedback session helpers', () => {
  it('recognizes a saved report that should be restored instead of re-analyzed', () => {
    const content = { ai_feedbacks: { 'Task 2': { overallBand: 7 } } };

    expect(getWritingFeedbacks(content)).toEqual(content.ai_feedbacks);
    expect(hasValidAiFeedback(content)).toBe(true);
  });

  it('only unlocks a pending evaluation after the recovery window', () => {
    const now = Date.parse('2026-07-29T12:02:00.000Z');
    const session = {
      evaluation_status: 'pending',
      content_data: { evaluationRequestedAt: '2026-07-29T12:00:00.000Z' },
    };

    expect(isStalePendingWritingEvaluation(session, now - 1)).toBe(false);
    expect(isStalePendingWritingEvaluation(session, now)).toBe(true);
    expect(
      isStalePendingWritingEvaluation({ ...session, evaluation_status: 'complete' }, now)
    ).toBe(false);
  });

  it('keeps a failed partial evaluation resumable instead of presenting it as a result', () => {
    const session = {
      is_completed: true,
      evaluation_status: 'failed',
      score: null,
      content_data: { ai_feedbacks: { 'Task 1': { overallBand: 6.5 } } },
    };

    expect(resolveWritingSessionState(session)).toMatchObject({
      activeSession: session,
      completedSession: undefined,
      isEffectivelyCompleted: false,
    });
  });

  it('explains a multi-task quota shortfall before evaluating either task', () => {
    expect(
      getWritingEvaluationCreditMessage(2, { daily_remaining: 1, monthly_remaining: 3 })
    ).toContain('includes 2 task reviews, but you have 1 task review remaining');
    expect(
      getWritingEvaluationCreditMessage(2, { daily_remaining: 1, monthly_remaining: 3 })
    ).toContain('Every 2 task reviews count as 1 Writing evaluation');
  });

  it('stores safe, actionable evaluation failure evidence', () => {
    expect(summarizeWritingEvaluationFailure({ status: 429 }, ['Task 1', 'Task 2'])).toMatchObject({
      category: 'quota',
      status: 429,
      attemptedTasks: ['Task 1', 'Task 2'],
    });
  });
});

import { describe, expect, it } from 'vitest';
import {
  getWritingFeedbacks,
  hasValidAiFeedback,
  isStalePendingWritingEvaluation,
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
});

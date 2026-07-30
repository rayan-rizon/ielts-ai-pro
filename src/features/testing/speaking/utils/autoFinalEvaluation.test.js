import { describe, expect, it } from 'vitest';

import { shouldAutomaticallyFinalizeSpeaking } from './autoFinalEvaluation';

const readyState = {
  allParts: { 1: {}, 2: {}, 3: {} },
  currentPartNumber: 3,
  isPartComplete: true,
  isTestComplete: false,
  isEvaluating: false,
  evaluationStatus: 'not_requested',
  evaluationPending: false,
  alreadyRequested: false,
};

describe('automatic speaking report generation', () => {
  it('starts evaluation as soon as the final part completes', () => {
    expect(shouldAutomaticallyFinalizeSpeaking(readyState)).toBe(true);
  });

  it('does not duplicate an evaluation that is already queued or running', () => {
    expect(shouldAutomaticallyFinalizeSpeaking({ ...readyState, evaluationPending: true })).toBe(
      false
    );
    expect(
      shouldAutomaticallyFinalizeSpeaking({ ...readyState, evaluationStatus: 'processing' })
    ).toBe(false);
    expect(shouldAutomaticallyFinalizeSpeaking({ ...readyState, alreadyRequested: true })).toBe(
      false
    );
  });

  it('does not auto-finalize between speaking parts', () => {
    expect(shouldAutomaticallyFinalizeSpeaking({ ...readyState, currentPartNumber: 2 })).toBe(
      false
    );
  });
});

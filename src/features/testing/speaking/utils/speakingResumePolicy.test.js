import { describe, expect, it } from 'vitest';

import { shouldResumeSpeakingFinalEvaluation } from './speakingResumePolicy';

describe('Speaking V2 resume policy', () => {
  it('does not replace an active server-authoritative session with the evaluation screen', () => {
    expect(
      shouldResumeSpeakingFinalEvaluation({
        isSpeakingV2: true,
        serverStatus: 'active',
        evaluationPending: true,
        hasSavedConversation: true,
      })
    ).toBe(false);
  });

  it('evaluates only after the server marks the full test ready', () => {
    expect(
      shouldResumeSpeakingFinalEvaluation({
        isSpeakingV2: true,
        serverStatus: 'ready_for_evaluation',
        evaluationPending: false,
        hasSavedConversation: true,
      })
    ).toBe(true);
  });
});

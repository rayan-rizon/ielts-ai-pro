import { describe, expect, it } from 'vitest';

import { shouldStartUninitializedSpeakingV2Session } from './speakingV2ResumeRecovery';

describe('Speaking V2 resume recovery', () => {
  it('starts a V2 session that was created but never received server state', () => {
    expect(
      shouldStartUninitializedSpeakingV2Session({
        isSpeakingV2: true,
        error: new Error('practice session not found'),
      })
    ).toBe(true);
  });

  it('does not hide other resume errors by starting a new session', () => {
    expect(
      shouldStartUninitializedSpeakingV2Session({
        isSpeakingV2: true,
        error: new Error('Speaking session expired'),
      })
    ).toBe(false);
  });
});

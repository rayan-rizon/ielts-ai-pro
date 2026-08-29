import { describe, expect, it } from 'vitest';

import { buildSpeakingV2ControlResponse } from '../../../supabase/functions/_shared/speakingV2ControlResponse';

const questions = [
  { id: 'q-1', text: 'Where did you grow up?' },
  { id: 'q-2', text: 'What was it like living there?' },
];

describe('Speaking V2 control responses', () => {
  it('does not repeat the final question when a completed part is resumed', () => {
    expect(
      buildSpeakingV2ControlResponse({
        state: { part: 1, questionNumber: 1, revision: 7, status: 'part_complete' },
        questions,
      })
    ).toEqual({
      success: true,
      action: 'complete_part',
      state: { part: 1, questionNumber: 1, revision: 7, status: 'part_complete' },
    });
  });

  it('returns the current question while the part is active', () => {
    expect(
      buildSpeakingV2ControlResponse({
        state: { part: 2, questionNumber: 0, revision: 8, status: 'active' },
        questions,
      })
    ).toMatchObject({
      examinerText: 'Where did you grow up?',
      examinerResponse: 'Where did you grow up?',
    });
  });
});

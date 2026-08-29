import { describe, expect, it } from 'vitest';

import { parseSpeakingQuestionRows } from '../../../supabase/functions/_shared/speakingV2Questions';

describe('Speaking V2 question parsing', () => {
  it('uses the complete cue-card body rather than the internal Part 2 title', () => {
    expect(
      parseSpeakingQuestionRows(
        [
          {
            id: 'part-2-cue-card',
            question_text: 'Long Turn',
            correct_answer:
              'Describe an occasion when you had to do something in a hurry.\n\nYou should say:\nwhat you had to do',
          },
        ],
        2
      )
    ).toEqual([
      {
        id: 'part-2-cue-card',
        text: 'Describe an occasion when you had to do something in a hurry.\n\nYou should say:\nwhat you had to do',
      },
    ]);
  });
});

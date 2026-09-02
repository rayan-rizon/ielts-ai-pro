import { describe, expect, it } from 'vitest';

import { resolvePartTwoTurn } from '../../../supabase/functions/_shared/speakingTurnPolicy';
import { shouldShowPart2CueCard } from '@/features/testing/speaking/utils/speakingTestUtils';

describe('Speaking Part 2 flow', () => {
  it('keeps the cue card hidden until preparation starts, and hides it when speaking begins', () => {
    expect(
      shouldShowPart2CueCard({ currentPartNumber: 2, isPart2Prep: false, cueCardTopic: {} })
    ).toBe(false);
    expect(
      shouldShowPart2CueCard({ currentPartNumber: 2, isPart2Prep: true, cueCardTopic: {} })
    ).toBe(true);
    expect(
      shouldShowPart2CueCard({ currentPartNumber: 1, isPart2Prep: true, cueCardTopic: {} })
    ).toBe(false);
  });

  it('does not complete Part 2 for a short clarification, then accepts a substantive answer', () => {
    expect(
      resolvePartTwoTurn({
        audioDurationMs: 4_000,
        transcript: 'Can you hear me right now?',
      })
    ).toEqual({ complete: false, examinerResponse: expect.stringContaining('continue') });

    expect(
      resolvePartTwoTurn({
        audioDurationMs: 42_000,
        transcript:
          'I would like to describe my older sister. She is extremely competitive in sport and work. She trains every morning before work, sets clear goals, and carefully measures her progress. Last year she prepared for a marathon while completing a difficult project at her office. She motivated our family to join a charity race. I admire her because she remains kind even when she wants to win, and she uses competition to improve rather than to put anyone else down.',
      })
    ).toEqual({ complete: true, examinerResponse: null });
  });
});

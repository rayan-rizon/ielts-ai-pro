import { describe, expect, it } from 'vitest';
import {
  isCoachResponse,
  resolveCoachRanking,
} from '../../../supabase/functions/_shared/learningPathCoach';

describe('bounded learning path coach response', () => {
  it('ranks selected activities without dropping any of a long plan', () => {
    const keys = Array.from({ length: 40 }, (_, i) => `v2:2026-09-06:grammar:activity:${i}`);
    expect(resolveCoachRanking(keys, [39, 2, 5])).toEqual([
      keys[39],
      keys[2],
      keys[5],
      ...keys.filter((_, i) => ![39, 2, 5].includes(i)),
    ]);
  });
  it('does not allow invented or duplicated activities', () => {
    expect(resolveCoachRanking(['a', 'b', 'c'], [2, 2, -1, 100, 0.5])).toEqual(['c', 'a', 'b']);
  });
  it('requires bounded integer indices and nonempty coaching', () => {
    const valid = {
      headline: 'Focus today',
      explanation: 'Review your evidence.',
      rankedActivityIndices: [0, 2],
    };
    expect(isCoachResponse(valid)).toBe(true);
    for (const rankedActivityIndices of [[0, 1, 2, 3], ['0'], [-1], [0.2], null]) {
      expect(isCoachResponse({ ...valid, rankedActivityIndices })).toBe(false);
    }
    expect(isCoachResponse({ ...valid, headline: ' ' })).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  calculateRetentionProgress,
  getRetentionMessage,
  getRetentionPeriodRange,
} from '@/features/vocabulary/services/vocabularyRetention';

describe('vocabulary retention progress', () => {
  it('counts ratings 3 through 5 as retained', () => {
    expect(calculateRetentionProgress([{ quality: 5 }, { quality: 3 }, { quality: 2 }])).toEqual({
      reviewed: 3,
      retained: 2,
      forgotten: 1,
      retention: 67,
    });
  });

  it('returns an honest empty state when nothing was reviewed', () => {
    expect(calculateRetentionProgress([])).toEqual({
      reviewed: 0,
      retained: 0,
      forgotten: 0,
      retention: 0,
    });
    expect(getRetentionMessage(0, 0)).toContain('Complete a review session');
  });

  it('uses Monday through Sunday for this week', () => {
    const range = getRetentionPeriodRange('thisWeek', new Date(2026, 6, 29, 12));
    expect(range.start?.getDay()).toBe(1);
    expect(range.start?.getHours()).toBe(0);
    expect(range.end?.getDay()).toBe(1);
    expect(range.end!.getTime() - range.start!.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

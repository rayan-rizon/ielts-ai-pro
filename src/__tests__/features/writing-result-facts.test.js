import { describe, expect, it } from 'vitest';
import {
  compareWithLast,
  lastBandIn,
  reportDate,
  timeUsed,
} from '@/features/testing/writing/report/resultFacts';

describe('timeUsed', () => {
  it('reads as minutes and seconds', () => {
    expect(timeUsed(2292)).toBe('38:12');
    expect(timeUsed(3600)).toBe('60:00');
  });

  it('is left out for a pasted answer or a missing time', () => {
    expect(timeUsed(8)).toBeNull();
    expect(timeUsed(null)).toBeNull();
    expect(timeUsed(undefined)).toBeNull();
  });
});

describe('reportDate', () => {
  it('writes day, short month and year', () => {
    expect(reportDate('2026-11-27T12:00:00Z', 'en')).toBe('27 Nov 2026');
  });

  it('keeps the ordinary calendar in Persian', () => {
    expect(reportDate('2026-11-27T12:00:00Z', 'fa')).toMatch(/۲۰۲۶/);
  });

  it('is empty when the date is unknown', () => {
    expect(reportDate(undefined, 'en')).toBe('');
    expect(reportDate('not a date', 'en')).toBe('');
  });
});

describe('lastBandIn', () => {
  const rows = [
    { evaluated_at: '2026-11-20T00:00:00Z', task1: 7, task2: null },
    { evaluated_at: '2026-11-18T00:00:00Z', task1: null, task2: 6.5 },
  ];

  it('takes the newest earlier attempt that marked the same task', () => {
    expect(lastBandIn(rows, 'Task 2')).toEqual({ band: 6.5, at: '2026-11-18T00:00:00Z' });
    expect(lastBandIn(rows, 'Task 1')).toEqual({ band: 7, at: '2026-11-20T00:00:00Z' });
  });

  it('finds nothing for a first essay', () => {
    expect(lastBandIn([], 'Task 2')).toBeNull();
  });
});

describe('compareWithLast', () => {
  it.each([
    [6.5, 6.5, 'sameAsLast', 0],
    [7, 6.5, 'upFromLast', 1],
    [6, 7, 'downFromLast', -1],
  ])('compares %s with %s', (band, previous, key, direction) => {
    expect(compareWithLast(band, { band: previous })).toMatchObject({ key, direction });
  });

  it('gives the size of the move', () => {
    expect(compareWithLast(6, { band: 7 }).delta).toBe('1.0');
  });

  it('says nothing without an earlier band', () => {
    expect(compareWithLast(6.5, null)).toBeNull();
    expect(compareWithLast(undefined, { band: 6 })).toBeNull();
  });
});

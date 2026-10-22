import { describe, expect, it } from 'vitest';
import {
  describeUsage,
  freeTestsPhrase,
  summariseObjectiveQuota,
} from '@/features/testing/shared/quota/objectiveQuota';

describe('summariseObjectiveQuota', () => {
  it('treats unlimited and missing status as not limited', () => {
    expect(summariseObjectiveQuota({ limit: -1, used: 12 })).toMatchObject({
      limited: false,
      exhausted: false,
    });
    expect(summariseObjectiveQuota(undefined).limited).toBe(false);
    expect(summariseObjectiveQuota({}).limited).toBe(false);
  });

  it('reports how many free tests are left without blocking', () => {
    expect(summariseObjectiveQuota({ limit: 5, used: 2 })).toMatchObject({
      limited: true,
      exhausted: false,
      remaining: 3,
      limit: 5,
      used: 2,
    });
  });

  it('blocks once the free total is used', () => {
    expect(summariseObjectiveQuota({ limit: 5, used: 5 })).toMatchObject({
      exhausted: true,
      remaining: 0,
    });
    expect(summariseObjectiveQuota({ limit: 5, used: 7 }).remaining).toBe(0);
  });

  it('treats a limit of zero as no free tests', () => {
    expect(summariseObjectiveQuota({ limit: 0, used: 0 })).toMatchObject({
      limited: true,
      exhausted: true,
      limit: 0,
    });
  });
});

describe('copy helpers', () => {
  it('describes usage without overshooting the limit', () => {
    expect(describeUsage(summariseObjectiveQuota({ limit: 5, used: 2 }))).toBe('2 of 5');
    expect(describeUsage(summariseObjectiveQuota({ limit: 2, used: 3 }))).toBe('2 of 2');
    expect(describeUsage(summariseObjectiveQuota({ limit: -1, used: 3 }))).toBe('');
  });

  it('pluralises free tests', () => {
    expect(freeTestsPhrase(1, 'Reading')).toBe('1 free Reading test');
    expect(freeTestsPhrase(5, 'Listening')).toBe('5 free Listening tests');
  });
});

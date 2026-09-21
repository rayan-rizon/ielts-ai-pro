import { describe, expect, it } from 'vitest';

import {
  matchUniversities,
  matchUniversity,
  skillMinimum,
  verificationStatus,
  type UniversityEntry,
} from './universityMatch';

const NOW = new Date('2026-09-21T12:00:00Z');

function entry(overrides: Partial<UniversityEntry> = {}): UniversityEntry {
  return {
    id: 'gb-test',
    name: 'Test University',
    country: 'GB',
    ieltsAccepted: true,
    scope: 'university',
    requirements: {
      postgraduate: { overall: 6.5, minComponent: 6 },
    },
    sourceUrl: 'https://example.ac.uk/english-requirements',
    lastVerified: '2026-09-01',
    ...overrides,
  };
}

describe('matchUniversity', () => {
  it('treats a met overall band with a failed skill floor as a reach, not a match', () => {
    // The real-world rejection: 6.5 overall looks qualifying until you read
    // the writing band. This must never surface as a university they can enter.
    const result = matchUniversity(
      entry(),
      'postgraduate',
      {
        overall: 6.5,
        skills: { listening: 7, reading: 7, writing: 5.5, speaking: 6.5 },
      },
      NOW
    );

    expect(result.outcome).toBe('reach');
    expect(result.overallGap).toBe(0);
    expect(result.shortfalls).toEqual([{ skill: 'writing', required: 6, actual: 5.5, gap: 0.5 }]);
  });

  it('matches when every skill clears its floor', () => {
    const result = matchUniversity(
      entry(),
      'postgraduate',
      {
        overall: 6.5,
        skills: { listening: 6.5, reading: 6.5, writing: 6, speaking: 6.5 },
      },
      NOW
    );

    expect(result.outcome).toBe('match');
    expect(result.shortfalls).toEqual([]);
    expect(result.unverifiedSkills).toEqual([]);
  });

  it('only calls a result safe when a full skill breakdown was supplied', () => {
    const comfortable = { overall: 7.5 };
    const withoutSkills = matchUniversity(entry(), 'postgraduate', comfortable, NOW);
    expect(withoutSkills.outcome).toBe('match');
    expect(withoutSkills.unverifiedSkills).toEqual(['listening', 'reading', 'writing', 'speaking']);

    const withSkills = matchUniversity(
      entry(),
      'postgraduate',
      {
        overall: 7.5,
        skills: { listening: 7.5, reading: 7.5, writing: 7, speaking: 7.5 },
      },
      NOW
    );
    expect(withSkills.outcome).toBe('safe');
  });

  it('lets a per-skill minimum override the blanket component floor', () => {
    const nursing = entry({
      requirements: {
        postgraduate: { overall: 7, minComponent: 6.5, skills: { writing: 7 } },
      },
    });

    expect(skillMinimum(nursing.requirements.postgraduate!, 'writing')).toBe(7);
    expect(skillMinimum(nursing.requirements.postgraduate!, 'reading')).toBe(6.5);

    const result = matchUniversity(
      nursing,
      'postgraduate',
      {
        overall: 7,
        skills: { listening: 7, reading: 6.5, writing: 6.5, speaking: 7 },
      },
      NOW
    );

    expect(result.outcome).toBe('reach');
    expect(result.shortfalls).toEqual([{ skill: 'writing', required: 7, actual: 6.5, gap: 0.5 }]);
  });

  it('compares half bands exactly rather than by float arithmetic', () => {
    const result = matchUniversity(
      entry({ requirements: { postgraduate: { overall: 6.5 } } }),
      'postgraduate',
      { overall: 6.5 },
      NOW
    );

    expect(result.outcome).toBe('match');
    expect(result.overallGap).toBe(0);
  });

  it('reports a shortfall of more than one band as unlikely', () => {
    const result = matchUniversity(entry(), 'postgraduate', { overall: 5 }, NOW);

    expect(result.outcome).toBe('unlikely');
    expect(result.overallGap).toBe(1.5);
  });

  it('never invents a band for a university that does not accept IELTS', () => {
    const result = matchUniversity(
      entry({ ieltsAccepted: false, requirements: {} }),
      'postgraduate',
      { overall: 9 },
      NOW
    );

    expect(result.outcome).toBe('not-accepted');
    expect(result.requirement).toBeNull();
  });

  it('returns unknown rather than guessing when the level has no entry', () => {
    const result = matchUniversity(entry(), 'undergraduate', { overall: 8 }, NOW);

    expect(result.outcome).toBe('unknown');
    expect(result.requirement).toBeNull();
  });

  it('flags skills the learner left out instead of assuming they pass', () => {
    const result = matchUniversity(
      entry(),
      'postgraduate',
      { overall: 6.5, skills: { writing: 6 } },
      NOW
    );

    expect(result.shortfalls).toEqual([]);
    expect(result.unverifiedSkills).toEqual(['listening', 'reading', 'speaking']);
    expect(result.outcome).toBe('match');
  });
});

describe('published ranges', () => {
  const varies = entry({
    scope: 'programme',
    requirements: {
      postgraduate: { overall: 6.5, range: { min: 5.5, max: 7.5 } },
    },
  });

  it('separates clearing the typical course from clearing the hardest one', () => {
    const typical = matchUniversity(varies, 'postgraduate', { overall: 6.5 }, NOW);
    expect(typical.outcome).toBe('match');
    expect(typical.clearsWholeRange).toBe(false);

    const top = matchUniversity(varies, 'postgraduate', { overall: 7.5 }, NOW);
    expect(top.clearsWholeRange).toBe(true);
  });

  it('reports no range judgement when the university publishes a single figure', () => {
    const result = matchUniversity(entry(), 'postgraduate', { overall: 7 }, NOW);
    expect(result.clearsWholeRange).toBeNull();
  });
});

describe('verificationStatus', () => {
  it('ages an entry through fresh, review-due and stale', () => {
    expect(verificationStatus({ lastVerified: '2026-09-01' }, NOW)).toBe('fresh');
    expect(verificationStatus({ lastVerified: '2026-01-01' }, NOW)).toBe('review-due');
    expect(verificationStatus({ lastVerified: '2024-01-01' }, NOW)).toBe('stale');
  });

  it('treats an unparseable date as stale rather than trusting it', () => {
    expect(verificationStatus({ lastVerified: 'unknown' }, NOW)).toBe('stale');
  });
});

describe('matchUniversities', () => {
  it('orders best fit first and breaks ties by name', () => {
    const entries = [
      entry({ id: 'c', name: 'Charlie', requirements: { postgraduate: { overall: 8 } } }),
      entry({ id: 'b', name: 'Bravo', requirements: { postgraduate: { overall: 6 } } }),
      entry({ id: 'a', name: 'Alpha', requirements: { postgraduate: { overall: 6 } } }),
      entry({ id: 'd', name: 'Delta', ieltsAccepted: false, requirements: {} }),
    ];

    const results = matchUniversities(entries, 'postgraduate', { overall: 6.5 }, NOW);

    expect(results.map((result) => result.entry.name)).toEqual([
      'Alpha',
      'Bravo',
      'Charlie',
      'Delta',
    ]);
    // 6.5 against a 6.0 floor is one half step clear, which is a match rather
    // than safe: a single band of headroom is not a comfortable margin.
    expect(results.map((result) => result.outcome)).toEqual([
      'match',
      'match',
      'unlikely',
      'not-accepted',
    ]);
  });
});

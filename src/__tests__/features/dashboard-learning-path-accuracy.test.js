import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  aggregateReadiness,
  findRecurringObjectiveMistakes,
  isScoredLearningSession,
  objectiveTypeStats,
} from '../../../supabase/functions/_shared/learningPathV2';
import { calculateListeningTestResults } from '@/features/testing/listening/components/ListeningTest/utils/scoreCalculator';
import { computeQuestionNumbers } from '@/features/testing/listening/components/ListeningTest/utils/questionProcessing';
import { buildRoadmapData } from '@/features/learning/components/dashboard/dashboardUtils';
import {
  groupScoredTestsByModule,
  moduleChange,
} from '@/features/dashboard/components/bandTrajectoryModel';
import { calculateDaysUntilExam } from '@/services/adaptiveLearningService';

const now = new Date('2026-10-06T12:00:00Z');
const session = (test_type, score, extra = {}) => ({
  test_type,
  score,
  is_completed: true,
  completed_at: '2026-10-01T10:00:00Z',
  actual_duration_seconds: 1800,
  ...extra,
});

describe('writing and speaking evidence', () => {
  it('counts every evaluation status the database stores for a finished score', () => {
    expect(isScoredLearningSession(session('writing', 6, { evaluation_status: 'complete' }))).toBe(
      true
    );
    expect(isScoredLearningSession(session('speaking', 6, { evaluation_status: 'legacy' }))).toBe(
      true
    );
    for (const status of ['pending', 'failed', 'not_requested']) {
      expect(isScoredLearningSession(session('writing', 6, { evaluation_status: status }))).toBe(
        false
      );
    }
  });

  it('gives a learner with scored writing and speaking a starting score in both', () => {
    const readiness = aggregateReadiness(
      [
        session('writing', 6, { evaluation_status: 'complete' }),
        session('writing', 6.5, { evaluation_status: 'legacy' }),
        session('speaking', 6, { evaluation_status: 'complete' }),
        session('speaking', 7, { evaluation_status: 'complete' }),
      ],
      now
    );
    expect(readiness.modules.writing.sample_count).toBe(2);
    expect(readiness.modules.speaking.sample_count).toBe(2);
    expect(readiness.missing_diagnostics).toEqual(['reading', 'listening']);
  });
});

describe('learning path stages', () => {
  const module = (count) => ({ sample_count: count, sufficient: count >= 2, mode_counts: {} });
  const phase = (key, context) =>
    buildRoadmapData({ days: [], targetBand: 7, ...context }).find((item) => item.key === key);

  it('labels the repair stage with the average its bar draws', () => {
    const skills = [0.7, 0.6, 0.5, 0.4].map((mastery) => ({ mastery, observations: 30 }));
    const repair = phase('repair', { evidence: { measured_priorities: skills, maintenance: [] } });
    expect(repair.progressPercent).toBe(73);
    expect(repair.progressLabel).toBe('4 measured skills are 73% of the way to 75% · 0 repaired');
  });

  it('never completes the repair stage while a skill lacks enough answers', () => {
    const repair = phase('repair', {
      evidence: {
        measured_priorities: [],
        maintenance: [
          { mastery: 0.9, observations: 40 },
          { mastery: 0.9, observations: 8 },
        ],
      },
    });
    expect(repair.progressPercent).toBeLessThan(100);
    expect(repair.checklist[2].done).toBe(false);
  });

  it('does not tick "subjects have two recent scores" at three of four', () => {
    const foundation = phase('foundation', {
      readiness: {
        modules: {
          reading: module(2),
          writing: module(2),
          listening: module(2),
          speaking: module(1),
        },
        missing_diagnostics: ['speaking'],
      },
    });
    expect(foundation.checklist[0]).toEqual({
      label: '3 of 4 subjects have two recent scores',
      done: false,
    });
  });
});

describe('dashboard band progress', () => {
  const test = (test_type, score, day) => ({
    test_type,
    score,
    completed_at: `2026-10-0${day}T10:00:00Z`,
  });

  it('never compares one module with another', () => {
    const grouped = groupScoredTestsByModule([
      test('reading', 8, 1),
      test('writing', 5, 2),
      test('reading', 8, 3),
    ]);
    expect(grouped.latestModule).toBe('reading');
    expect(moduleChange(grouped.byModule.reading)).toBe(0);
    expect(moduleChange(grouped.byModule.writing)).toBeNull();
  });

  it('measures change within the selected module, oldest to newest', () => {
    const grouped = groupScoredTestsByModule([
      test('listening', 7, 3),
      test('listening', 6, 1),
      test('reading', 5, 2),
    ]);
    expect(grouped.byModule.listening.map((point) => point.score)).toEqual([6, 7]);
    expect(moduleChange(grouped.byModule.listening)).toBe(1);
    expect(grouped.modules).toEqual(['reading', 'listening']);
  });
});

describe('days until the exam', () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTz;
    vi.useRealTimers();
  });

  it.each([
    ['2026-10-30T12:00:00Z', '2026-11-02', 3],
    ['2026-03-06T12:00:00Z', '2026-03-09', 3],
    ['2026-11-02T12:00:00Z', '2026-10-30', -3],
    ['2026-10-30T12:00:00Z', '2026-10-30', 0],
  ])('counts local calendar days from %s to %s across DST', (today, examDate, days) => {
    process.env.TZ = 'America/New_York';
    vi.useFakeTimers();
    vi.setSystemTime(new Date(today));
    expect(calculateDaysUntilExam(examDate)).toBe(days);
  });
});

describe('dashboard database functions', () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      'supabase/migrations/20261006000411_restore_learner_dashboard_accuracy.sql'
    ),
    'utf8'
  ).toLowerCase();

  it('groups consecutive newest-first dates into one streak', () => {
    expect(sql).toContain(
      'practice_date + (row_number() over (order by practice_date desc))::integer as grp'
    );
    expect(sql).not.toContain('practice_date - (row_number()');
  });

  it('dates activity in the learner timezone and skips walk-away tests and duplicates', () => {
    expect(sql).toContain('get_dashboard_stats(p_timezone text default null)');
    expect(sql).toContain('at time zone v_timezone');
    expect(sql.match(/not public\.is_abandoned_test_session/g)?.length).toBeGreaterThanOrEqual(7);
    expect(sql).toContain("lpa.completion_source is distinct from 'test_session'");
  });

  it('keeps the dashboard functions away from anonymous callers', () => {
    expect(sql).toContain(
      'revoke all on function public.get_dashboard_stats(text) from public, anon'
    );
    expect(sql).toContain(
      'revoke all on function public.get_recent_sessions(integer) from public, anon'
    );
  });
});

describe('legacy listening matching-features totals', () => {
  // Three matching-features items, all answered correctly, stored the way an
  // older bundle stored them: under no type, so typeStats says 0 of 3.
  const fresh = () => {
    const questions = computeQuestionNumbers([
      {
        id: '22222222-2222-4222-8222-222222222222',
        type: 'matching_features',
        section: 1,
        question_number: 1,
        matching_features: {
          questions: [
            { id: 'mq_1', answer: 'A', questionNumber: 1 },
            { id: 'q2', answer: 'B', questionNumber: 2 },
            { id: 'mq_3', answer: 'C', questionNumber: 3 },
          ],
        },
      },
    ]);
    return calculateListeningTestResults(questions, { mq_1: 'A', q2: 'B', mq_3: 'C' }, [
      { section_number: 1, title: 'Part 1' },
    ]);
  };
  const legacySession = (id, day) => {
    const result = fresh();
    return {
      id,
      test_type: 'listening',
      score: 6,
      is_completed: true,
      completed_at: `2026-10-0${day}T10:00:00Z`,
      content_data: {
        ...result,
        correctAnswersMap: result.answersMap,
        answersMap: undefined,
        typeStats: { matching_features: { correct: 0, total: 3 } },
        sectionStats: [{ ...result.sectionStats[0], correct: 0 }],
        responseDetails: [],
      },
    };
  };

  it('credits the repaired totals before the plan or the trend uses them', () => {
    const sessions = [legacySession('a', 1), legacySession('b', 2), legacySession('c', 3)];
    expect(objectiveTypeStats(sessions[0]).matching_features).toMatchObject({
      correct: 3,
      total: 3,
    });
    expect(findRecurringObjectiveMistakes(sessions)).toEqual([]);
  });
});

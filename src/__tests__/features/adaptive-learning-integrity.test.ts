import { describe, expect, it } from 'vitest';
import {
  aggregateReadiness,
  findRecurringObjectiveMistakes,
  buildSevenDaySchedule,
  isLearningPlanExpired,
  normalizeStudyAvailability,
  recommendAssessmentMode,
  scheduleRecurringRepair,
  summarizeEvidence,
} from '../../../supabase/functions/_shared/learningPathV2';
import {
  computeEvidence,
  rankBestNextTask,
  getFriendlyTaskTitle,
  getPlanRefreshTrigger,
  getSnapshotReadiness,
} from '@/features/learning/components/dashboard/dashboardUtils';

const now = new Date('2026-09-17T12:00:00Z');
const modules = ['reading', 'writing', 'listening', 'speaking'];
const session = (module = 'reading', score: any = 6, extra = {}) => ({
  test_type: module,
  score,
  completed_at: '2026-09-16T12:00:00Z',
  test_mode: 'practice',
  ...extra,
});
const availability = normalizeStudyAvailability({
  timezone: 'Asia/Dhaka',
  days: { monday: 90, tuesday: 90, wednesday: 90, thursday: 90, friday: 90 },
});
const plan = {
  version: 2,
  generator_version: '2.4.4',
  input_fingerprint: 'same',
  generated_at: '2026-09-17T00:00:00Z',
  goal_snapshot: { target_band: 7, test_date: null, study_availability: availability },
};

describe('adaptive evidence integrity', () => {
  it('ignores missing, unfinished, failed, future and abandoned results while retaining real zeroes', () => {
    const readiness = aggregateReadiness(
      [
        session('reading', ''),
        session('reading', null),
        session('reading', false),
        session('reading', 7, { is_completed: false }),
        session('reading', 9, { completed_at: '2026-09-18T12:00:00Z' }),
        session('writing', 8, { evaluation_status: 'failed' }),
        session('reading', 0, { actual_duration_seconds: 20 }),
        session('reading', 0, { actual_duration_seconds: 1800 }),
      ],
      now
    );
    expect(readiness.modules.reading.sample_count).toBe(1);
    expect(readiness.modules.reading.median).toBe(0);
    expect(readiness.modules.writing.sample_count).toBe(0);
  });

  it('finds the latest exam result independently of input order and accepts both persisted mode names', () => {
    const readiness = aggregateReadiness(
      [
        session('reading', 5, { test_mode: 'mock', completed_at: '2026-09-14T12:00:00Z' }),
        session('reading', 7, { test_mode: 'exam' }),
      ],
      now
    );
    expect(readiness.modules.reading.latest_exam_score).toBe(7);
    expect(readiness.modules.reading.mode_counts.exam).toBe(2);
  });

  it('recomputes current priorities instead of retaining an old weakness', () => {
    const evidence = computeEvidence(
      { evidence_summary: { measured_priorities: [{ skill_code: 'reading_old' }] } },
      {
        byModule: {
          reading: [
            {
              skill_code: 'reading_headings',
              module: 'reading',
              mastery: 0.9,
              confidence: 0.8,
              practice_count: 30,
            },
          ],
        },
      }
    );
    expect(evidence.measured_priorities).toEqual([]);
    expect(evidence.maintenance[0].skill_code).toBe('reading_headings');
    expect(getSnapshotReadiness({ old: true }, [])).not.toHaveProperty('old');
  });

  it('renews at the learner-local seven-day boundary, including rest days', () => {
    expect(isLearningPlanExpired(plan, '2026-09-23T17:59:00Z')).toBe(false);
    expect(isLearningPlanExpired(plan, '2026-09-23T18:00:00Z')).toBe(true);
    expect(
      getPlanRefreshTrigger({
        path: plan,
        user: { target_band_score: 7 },
        sessions: [],
        currentAvailability: availability,
        now: new Date('2026-09-24T12:00:00Z'),
      })
    ).toBe('schedule_expired');
    expect(normalizeStudyAvailability({ timezone: 'invalid' }).timezone).toBe('UTC');
  });

  it('detects Practice Lab evidence even without a new full-test score', () => {
    expect(
      getPlanRefreshTrigger({
        path: plan,
        user: { target_band_score: 7 },
        sessions: [],
        currentAvailability: availability,
        now,
        skillMap: { byModule: { reading: [{ last_practiced_at: '2026-09-17T10:00:00Z' }] } },
      })
    ).toBe('practice_completed');
  });

  it('replaces identity and completion metadata when repurposing an exam task', () => {
    const result = scheduleRecurringRepair(
      {
        thursday: [
          {
            activity_key: 'exam',
            scheduled_date: '2026-09-17',
            module: 'writing',
            stage_key: 'readiness',
            requested_mode: 'exam',
            evidence_key: 'exam:writing',
            estimated_time: 60,
          },
        ],
      },
      { module: 'reading', type: 'headings', sessionCount: 2 }
    );
    expect(result.thursday[0]).toMatchObject({
      stage_key: 'repair',
      requested_mode: 'practice',
      evidence_key: 'recurring:reading:headings',
      completion_policy: 'verified',
    });
    expect(result.thursday[0].activity_key).not.toBe('exam');
    expect(
      getFriendlyTaskTitle({
        module: 'reading',
        activity_type: 'targeted_drill',
        skill_targets: ['reading_matching_headings'],
      })
    ).toContain('Matching headings');
  });
});

describe('next-task ranking', () => {
  const task = (key: string, extra = {}) => ({
    activity_key: key,
    module: 'reading',
    priority: 'high',
    ...extra,
  });
  it('uses real median scores to prioritize the larger target gap', () => {
    const days = [
      { capacity: 60, tasks: [task('reading'), task('writing', { module: 'writing' })] },
    ];
    expect(
      rankBestNextTask(days, {
        targetBand: 7,
        readiness: { modules: { reading: { median: 6.5 }, writing: { median: 4 } } },
      }).activity_key
    ).toBe('writing');
  });
  it('does not reward a null AI rank over an actual first-ranked task', () => {
    const days = [
      {
        capacity: 60,
        tasks: [task('unranked', { ai_rank: null }), task('ranked', { ai_rank: 1 })],
      },
    ];
    expect(rankBestNextTask(days).activity_key).toBe('ranked');
  });
  it('does not invent exam urgency when no exam date exists', () => {
    const days = [
      {
        capacity: 60,
        tasks: [task('a-practice'), task('b-exam', { activity_type: 'exam_assessment' })],
      },
    ];
    expect(rankBestNextTask(days, { daysLeft: null }).activity_key).toBe('a-practice');
    expect(rankBestNextTask(days, { daysLeft: 10 }).activity_key).toBe('b-exam');
  });
});

describe('recurring mistakes', () => {
  it('drops historical mistakes after the latest successful practice', () => {
    const attempt = (id: string, correct: number, day: number) => ({
      ...session('reading', 6),
      id,
      is_completed: true,
      completed_at: `2026-09-${day}T12:00:00Z`,
      content_data: { typeStats: { headings: { correct, total: 5 } } },
    });
    expect(
      findRecurringObjectiveMistakes([
        attempt('old', 2, 12),
        attempt('middle', 3, 13),
        attempt('new', 5, 16),
      ])
    ).toEqual([]);
    expect(
      findRecurringObjectiveMistakes([
        attempt('old', 5, 12),
        attempt('middle', 3, 13),
        attempt('new', 2, 16),
      ])
    ).toEqual([{ module: 'reading', type: 'headings', sessionCount: 2 }]);
  });
});

describe('Practice Mode to Exam Mode progression', () => {
  it('starts with practice even for a close exam, then introduces exam checks from repeated results', () => {
    expect(recommendAssessmentMode({ sample_count: 1, median: 8 }, 7, 2).mode).toBe('practice');
    expect(recommendAssessmentMode({ sample_count: 2, median: 5 }, 7).mode).toBe('practice');
    expect(recommendAssessmentMode({ sample_count: 3, median: 6 }, 7).mode).toBe('exam');
    expect(recommendAssessmentMode({ sample_count: 5, median: 4 }, 7).mode).toBe('exam');
    expect(recommendAssessmentMode({ sample_count: 2, median: 5 }, 7, 10).mode).toBe('exam');
  });

  it('covers missing subjects without inventing strengths or incompatible skill targets', () => {
    const result = buildSevenDaySchedule({
      availability,
      evidence: summarizeEvidence([]),
      readiness: aggregateReadiness([session()], now),
      now,
    });
    const tasks = Object.values(result.schedule).flat();
    expect(new Set(tasks.map((task) => task.module)).size).toBe(4);
    expect(tasks.every((task) => task.requested_mode === 'practice')).toBe(true);
    expect(tasks.every((task) => task.activity_type !== 'maintenance')).toBe(true);
  });

  it('introduces real exam routes per subject and keeps the schedule inside daily capacity', () => {
    const sessions = modules.flatMap((module) =>
      Array.from({ length: module === 'writing' ? 2 : 3 }, () =>
        session(module, module === 'writing' ? 4 : 6.5)
      )
    );
    const result = buildSevenDaySchedule({
      availability,
      evidence: summarizeEvidence([]),
      readiness: aggregateReadiness(sessions, now),
      now,
      targetBand: 7,
    });
    const tasks = Object.values(result.schedule).flat();
    expect(tasks.some((task) => task.requested_mode === 'exam')).toBe(true);
    expect(
      tasks
        .filter((task) => task.module === 'writing')
        .every((task) => task.requested_mode === 'practice')
    ).toBe(true);
    for (const [day, list] of Object.entries(result.schedule)) {
      expect(list.reduce((sum, task) => sum + task.estimated_time, 0)).toBeLessThanOrEqual(
        availability.days[day] || 0
      );
      for (const task of list.filter((task) => task.requested_mode === 'exam')) {
        expect(task.routing.mode).toBe('exam');
        expect(task.estimated_time).toBeGreaterThanOrEqual(
          task.module === 'speaking' ? 20 : task.module === 'listening' ? 40 : 60
        );
      }
    }
  });

  it("alternates Writing Task 1 and Task 2 from the learner's latest scored writing work", () => {
    const readiness = aggregateReadiness(
      [
        session('writing', 6, {
          content_data: { activeType: 'Task 1' },
          evaluation_status: 'completed',
        }),
      ],
      now
    );
    expect(readiness.modules.writing.next_practice_task).toBe('Task 2');

    const result = buildSevenDaySchedule({
      availability,
      evidence: summarizeEvidence([]),
      readiness,
      now,
    });
    const writingTask = Object.values(result.schedule)
      .flat()
      .find((task) => task.module === 'writing');
    expect(writingTask).toMatchObject({
      title: 'Writing Task 2 Practice Mode',
      estimated_time: 40,
      routing: expect.objectContaining({ writing_task: 'Task 2' }),
    });
  });

  it('keeps Task Achievement with Task 1 and uses its official 20-minute practice time', () => {
    const result = buildSevenDaySchedule({
      availability,
      evidence: summarizeEvidence([
        {
          skill_code: 'writing_taskachievement',
          module: 'writing',
          mastery_probability: 0.4,
          confidence_level: 0.8,
          practice_count: 10,
        },
      ]),
      readiness: aggregateReadiness([session('writing', 6)], now),
      now,
    });
    const writingTask = Object.values(result.schedule)
      .flat()
      .find(
        (task) =>
          task.module === 'writing' && task.skill_targets?.includes('writing_taskachievement')
      );
    expect(writingTask).toMatchObject({
      estimated_time: 20,
      routing: expect.objectContaining({ writing_task: 'Task 1' }),
    });
  });

  it('keeps short sessions as practice rather than promising an impossible full exam', () => {
    const result = buildSevenDaySchedule({
      availability: normalizeStudyAvailability({ days: { thursday: 20 } }),
      evidence: summarizeEvidence([]),
      readiness: aggregateReadiness(
        Array.from({ length: 5 }, () => session()),
        now
      ),
      now,
    });
    expect(result.schedule.thursday[0].requested_mode).toBe('practice');
    expect(result.schedule.thursday[0].estimated_time).toBe(20);
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildPlanSchedule,
  buildRoadmap,
  getAllocation,
  getAverageBandGap,
  normalizeStudyAvailability,
  recommendAssessmentMode,
} from '../../../supabase/functions/_shared/learningPathV2';

const TODAY = '2026-11-23';
const addDays = (key: string, days: number) =>
  new Date(Date.parse(`${key}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
const MODULES = ['reading', 'writing', 'listening', 'speaking'];

const availability = normalizeStudyAvailability({
  timezone: 'UTC',
  days: { monday: 60, tuesday: 60, wednesday: 60, thursday: 60, friday: 60, saturday: 90 },
});
const skill = (code: string, module: string, mastery: number) => ({
  skill_code: code,
  module,
  mastery,
  observations: 12,
  confidence: 0.7,
});
const weak = {
  measured_priorities: [
    skill('reading_matching_features', 'reading', 0.35),
    skill('listening_gap_fill', 'listening', 0.4),
    skill('writing_task_response', 'writing', 0.4),
  ],
  due_reviews: [],
  early_signals: [],
  maintenance: [],
  criterion_signals: [],
};
const strong = {
  measured_priorities: [],
  due_reviews: [],
  early_signals: [],
  maintenance: [
    skill('reading_tfng', 'reading', 0.85),
    skill('listening_gap_fill', 'listening', 0.88),
  ],
  criterion_signals: [],
};
const readinessAt = (median: number | null, count = 3) => ({
  missing_diagnostics: median === null ? MODULES : [],
  modules: Object.fromEntries(
    MODULES.map((module) => [
      module,
      { sample_count: median === null ? 0 : count, median, latest_exam_score: null },
    ])
  ),
});

const planFor = (daysToExam: number, median: number | null, target = 7, evidence: any = weak) =>
  buildPlanSchedule({
    availability,
    evidence,
    readiness: readinessAt(median),
    testDate: addDays(TODAY, daysToExam),
    targetBand: target,
    now: TODAY,
  });
const minutesBy = (result: any, type: string) =>
  Object.values(result.schedule as Record<string, any[]>)
    .flat()
    .filter((task) => task.activity_type === type)
    .reduce((total, task) => total + task.estimated_time, 0);
const allTasks = (result: any) => Object.values(result.schedule as Record<string, any[]>).flat();

describe('exam two weeks away', () => {
  it('plans exactly up to the day before the exam', () => {
    const result = planFor(14, 5.5);
    expect(result.horizon_days).toBe(14);
    expect(allTasks(result).every((task) => task.scheduled_date < addDays(TODAY, 14))).toBe(true);
  });

  it('keeps a learner more than a band short on repair, not a wall of Exam Mode', () => {
    const lowBand = planFor(14, 5.5);
    const atTarget = planFor(14, 7, 7, strong);
    expect(minutesBy(lowBand, 'targeted_drill')).toBeGreaterThan(
      minutesBy(lowBand, 'exam_assessment')
    );
    expect(minutesBy(lowBand, 'exam_assessment')).toBeLessThan(
      minutesBy(atTarget, 'exam_assessment')
    );
  });

  it('does not run no-hints Exam Mode on a far-below module until the final week', () => {
    const early = allTasks(planFor(14, 5.5)).filter(
      (task) => task.scheduled_date < addDays(TODAY, 7) && task.activity_type === 'exam_assessment'
    );
    expect(early).toEqual([]);
  });

  it('still rehearses exam pacing in the final week', () => {
    const late = allTasks(planFor(14, 5.5)).filter(
      (task) => task.scheduled_date >= addDays(TODAY, 7) && task.activity_type === 'exam_assessment'
    );
    expect(late.length).toBeGreaterThan(0);
  });

  it('uses Exam Mode freely for a learner within a band of the target', () => {
    expect(recommendAssessmentMode({ sample_count: 3, median: 6.5 }, 7, 10).mode).toBe('exam');
    expect(recommendAssessmentMode({ sample_count: 3, median: 5.5 }, 7, 10).mode).toBe('practice');
    expect(recommendAssessmentMode({ sample_count: 3, median: 5.5 }, 7, 5).mode).toBe('exam');
    expect(recommendAssessmentMode({ sample_count: 1, median: 6.5 }, 7, 5).mode).toBe('practice');
  });
});

describe('band gap shapes the plan', () => {
  it('shifts minutes from assessment to repair when the gap is a band or more', () => {
    const near = getAllocation(14, 0.5);
    const far = getAllocation(14, 1.5);
    expect(far.measured_priority).toBeGreaterThan(near.measured_priority);
    expect(far.assessment).toBeLessThan(near.assessment);
    expect(Object.values(far).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('measures the gap only from scored modules', () => {
    expect(getAverageBandGap(readinessAt(null), 7)).toBe(0);
    expect(getAverageBandGap(readinessAt(5.5), 7)).toBe(1.5);
    expect(getAverageBandGap(readinessAt(7.5), 7)).toBe(0);
  });

  it('lets maintenance in when other categories have no evidence', () => {
    expect(minutesBy(planFor(14, 7, 7, strong), 'maintenance')).toBeGreaterThan(0);
  });
});

describe('the day before the exam', () => {
  it('is a short recap with no full Exam Mode attempt', () => {
    const result = planFor(1, 5.5);
    const tasks = allTasks(result);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.some((task) => task.activity_type === 'exam_assessment')).toBe(false);
    expect(tasks.reduce((total, task) => total + task.estimated_time, 0)).toBeLessThanOrEqual(30);
  });

  it('stays light on exam day too', () => {
    const tasks = allTasks(planFor(0, 7, 7, strong));
    expect(tasks.some((task) => task.activity_type === 'exam_assessment')).toBe(false);
  });
});

describe('roadmap against the exam date and band', () => {
  const stages = (roadmap: any[]) => roadmap.map((phase) => phase.key);

  it('treats an exam today as a dated exam, not a 12-week journey', () => {
    const roadmap = buildRoadmap(TODAY, TODAY);
    expect(stages(roadmap)).toEqual(['readiness']);
    expect(roadmap[0].end_date).toBe(TODAY);
  });

  it('keeps focused practice in a two-week roadmap for a learner far below target', () => {
    const roadmap = buildRoadmap(addDays(TODAY, 14), TODAY, {
      targetBand: 7,
      readiness: readinessAt(5.5),
    });
    expect(stages(roadmap)).toEqual(['repair', 'readiness']);
    expect(roadmap.at(-1)!.end_date).toBe(addDays(TODAY, 14));
  });

  it('keeps get-clear-results when there are no scored tests yet', () => {
    const roadmap = buildRoadmap(addDays(TODAY, 14), TODAY, {
      targetBand: 7,
      readiness: readinessAt(null),
    });
    expect(stages(roadmap)[0]).toBe('foundation');
  });

  it('still jumps to timed integration for a learner near the target', () => {
    const roadmap = buildRoadmap(addDays(TODAY, 14), TODAY, {
      targetBand: 7,
      readiness: readinessAt(6.5),
    });
    expect(stages(roadmap)).toEqual(['integration', 'readiness']);
  });

  it('is unchanged without context', () => {
    expect(stages(buildRoadmap(addDays(TODAY, 14), TODAY))).toEqual(['integration', 'readiness']);
    expect(stages(buildRoadmap(addDays(TODAY, 3), TODAY))).toEqual(['readiness']);
  });
});

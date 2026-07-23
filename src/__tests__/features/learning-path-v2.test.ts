import { describe, expect, it } from 'vitest';
import {
  adaptLearningPathV1,
  aggregateReadiness,
  buildRoadmap,
  buildSevenDaySchedule,
  classifyEvidence,
  fingerprintLearningPathInputs,
  getAllocation,
  getWeeklyCapacity,
  normalizeStudyAvailability,
  summarizeEvidence,
} from '../../../supabase/functions/_shared/learningPathV2';

const now = new Date('2026-07-22T12:00:00.000Z');

describe('Learning Path evidence policy', () => {
  it('never promotes onboarding seeds to measured weaknesses', () => {
    expect(classifyEvidence({ practice_count: 0, confidence_level: 0.05 })).toBe('diagnostic');
    expect(classifyEvidence({ practice_count: 8, confidence_level: 0.14 })).toBe('diagnostic');
    expect(classifyEvidence({ practice_count: 4, confidence_level: 0.8 })).toBe('early_signal');
    expect(classifyEvidence({ practice_count: 5, confidence_level: 0.4 })).toBe(
      'measured_priority'
    );
  });

  it('ranks only sufficiently observed low-mastery skills as measured priorities', () => {
    const summary = summarizeEvidence(
      [
        {
          skill_code: 'reading_seed',
          module: 'reading',
          mastery_probability: 0.1,
          confidence_level: 0.05,
          practice_count: 0,
        },
        {
          skill_code: 'writing_cohesion',
          module: 'writing',
          mastery_probability: 0.55,
          confidence_level: 0.6,
          practice_count: 12,
        },
      ],
      now
    );
    expect(summary.measured_priorities.map((skill) => skill.skill_code)).toEqual([
      'writing_cohesion',
    ]);
    expect(summary.diagnostics.map((skill) => skill.skill_code)).toContain('reading_seed');
  });
});

describe('practice readiness range', () => {
  const session = (test_type: string, score: number, day: number) => ({
    test_type,
    score,
    completed_at: `2026-07-${String(day).padStart(2, '0')}T12:00:00.000Z`,
  });

  it('shows module medians but withholds the overall range when diagnostics are missing', () => {
    const readiness = aggregateReadiness(
      [session('reading', 6.5, 20), session('reading', 7, 18)],
      now
    );
    expect(readiness.modules.reading.median).toBe(7);
    expect(readiness.overall.available).toBe(false);
    expect(readiness.missing_diagnostics).toEqual(['writing', 'listening', 'speaking']);
  });

  it('creates a transparent overall observed range only with all four modules', () => {
    const sessions = ['reading', 'writing', 'listening', 'speaking'].flatMap((module) => [
      session(module, 6.5, 20),
      session(module, 7, 18),
    ]);
    const readiness = aggregateReadiness(sessions, now);
    expect(readiness.overall.available).toBe(true);
    expect(readiness.overall.range).toEqual([6.5, 7]);
    expect(readiness.overall.disclaimer).toContain('not a score prediction');
  });

  it('ignores scored attempts older than 90 days', () => {
    const readiness = aggregateReadiness(
      [{ test_type: 'reading', score: 8, completed_at: '2026-01-01T00:00:00Z' }],
      now
    );
    expect(readiness.modules.reading.sample_count).toBe(0);
  });
});

describe('exam roadmap and capacity allocation', () => {
  it('compresses early phases for a seven-day deadline', () => {
    const roadmap = buildRoadmap('2026-07-29', now);
    expect(roadmap).toHaveLength(1);
    expect(roadmap[0].key).toBe('readiness');
  });

  it('keeps all four phases when there is sufficient time', () => {
    expect(buildRoadmap('2026-11-22', now).map((phase) => phase.key)).toEqual([
      'foundation',
      'repair',
      'integration',
      'readiness',
    ]);
  });

  it('shifts the final 14 days toward timed assessment without inventing more capacity', () => {
    expect(getAllocation(14)).toEqual({
      measured_priority: 25,
      due_review: 15,
      assessment: 45,
      maintenance: 15,
    });
  });

  it('uses explicit selected days, preserves rest days, dates keys, and never exceeds capacity', () => {
    const availability = normalizeStudyAvailability(
      {
        version: 1,
        timezone: 'Asia/Dhaka',
        days: { wednesday: 45, friday: 90 },
      },
      10,
      'Asia/Dhaka'
    );
    const evidence = summarizeEvidence(
      [
        {
          skill_code: 'reading_inference',
          module: 'reading',
          mastery_probability: 0.5,
          confidence_level: 0.7,
          practice_count: 10,
        },
      ],
      now
    );
    const readiness = aggregateReadiness([], now);
    const { schedule } = buildSevenDaySchedule({ availability, evidence, readiness, now });

    expect(getWeeklyCapacity(availability)).toBe(135);
    expect(schedule.thursday).toEqual([]);
    expect(schedule.wednesday).toHaveLength(1);
    expect(schedule.friday).toHaveLength(3);
    Object.entries(schedule).forEach(([day, tasks]) => {
      const used = tasks.reduce((sum, task) => sum + task.estimated_time, 0);
      expect(used).toBeLessThanOrEqual(availability.days[day] || 0);
      expect(tasks.length).toBeLessThanOrEqual(3);
      tasks.forEach((task) => {
        expect(task.scheduled_date).toMatch(/^2026-07-/);
        expect(task.activity_key).toContain(task.scheduled_date);
        expect(task.estimated_time).toBeGreaterThanOrEqual(20);
        expect(task.estimated_time).toBeLessThanOrEqual(60);
        expect(task.reason).toBeTruthy();
        expect(task.success_criterion).toBeTruthy();
      });
    });
  });
});

describe('V1 compatibility and fingerprint caching', () => {
  it('adapts a historical V1 row without rewriting it', () => {
    const adapted = adaptLearningPathV1({
      target_level: 7,
      motivation_message: 'Keep going',
      milestones: [{ goal: 'Timed reading', assessment: 'Finish in 60 minutes' }],
    });
    expect(adapted.version).toBe(1);
    expect(adapted.generator_version).toBe('legacy-v1');
    expect(adapted.roadmap[0].legacy).toBe(true);
  });

  it('produces the same fingerprint for unchanged inputs regardless of object key order', async () => {
    const first = await fingerprintLearningPathInputs({
      goal: { target: 7, date: null },
      tests: [1, 2],
    });
    const second = await fingerprintLearningPathInputs({
      tests: [1, 2],
      goal: { date: null, target: 7 },
    });
    expect(first).toBe(second);
  });
});

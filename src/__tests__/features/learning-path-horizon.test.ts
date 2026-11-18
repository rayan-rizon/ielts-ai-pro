import { describe, expect, it } from 'vitest';
import {
  buildPlanSchedule,
  getPlanEndDate,
  getPlanHorizonDays,
  normalizeStudyAvailability,
  rollScheduleForward,
} from '../../../supabase/functions/_shared/learningPathV2';

const availability = normalizeStudyAvailability({
  timezone: 'UTC',
  days: { monday: 60, wednesday: 60, friday: 60, saturday: 60 },
});
const evidence = {
  measured_priorities: [
    { skill_code: 'reading_matching_features', module: 'reading', mastery: 0.4, observations: 12 },
    { skill_code: 'listening_gap_fill', module: 'listening', mastery: 0.45, observations: 10 },
    { skill_code: 'reading_notes_completion', module: 'reading', mastery: 0.5, observations: 9 },
    { skill_code: 'listening_map_labelling', module: 'listening', mastery: 0.52, observations: 8 },
  ],
  due_reviews: [],
  early_signals: [],
  maintenance: [],
  criterion_signals: [],
};
const readiness = {
  missing_diagnostics: [],
  modules: Object.fromEntries(
    ['reading', 'writing', 'listening', 'speaking'].map((module) => [
      module,
      { sample_count: 3, median: 6 },
    ])
  ),
};
const START = '2026-11-19';
const addDays = (dateKey: string, days: number) =>
  new Date(Date.parse(`${dateKey}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
const plan = (extra = {}) =>
  buildPlanSchedule({ availability, evidence, readiness, targetBand: 7, now: START, ...extra });
const tasksOf = (schedule: Record<string, any[]>) => Object.values(schedule).flat();

describe('getPlanHorizonDays', () => {
  it('plans up to 30 days, and never past the day before the exam', () => {
    expect(getPlanHorizonDays(null, START)).toBe(30);
    expect(getPlanHorizonDays(addDays(START, 90), START)).toBe(30);
    expect(getPlanHorizonDays(addDays(START, 30), START)).toBe(30);
    expect(getPlanHorizonDays(addDays(START, 15), START)).toBe(15);
    expect(getPlanHorizonDays(addDays(START, 1), START)).toBe(1);
  });

  it('always covers at least today, even on exam day', () => {
    expect(getPlanHorizonDays(START, START)).toBe(1);
  });
});

describe('buildPlanSchedule', () => {
  it('fills a 30-day window keyed by date, with no task outside it', () => {
    const result = plan();
    const dates = Object.keys(result.schedule);
    expect(result.horizon_days).toBe(30);
    expect(dates.every((date) => date >= START && date <= addDays(START, 29))).toBe(true);
    expect(tasksOf(result.schedule).every((task) => task.scheduled_date in result.schedule)).toBe(
      true
    );
    expect(tasksOf(result.schedule).length).toBeGreaterThan(12);
  });

  it('shortens the plan when the exam is 15 days away, ending the day before it', () => {
    const result = plan({ testDate: addDays(START, 15) });
    const dates = tasksOf(result.schedule).map((task) => task.scheduled_date);
    expect(result.horizon_days).toBe(15);
    expect(Math.max(...dates.map((date) => Date.parse(date)))).toBeLessThan(
      Date.parse(addDays(START, 15))
    );
    expect(dates).not.toContain(addDays(START, 15));
  });

  it('respects each weekday’s study time on every date, and gives every task a unique key', () => {
    const tasks = tasksOf(plan().schedule);
    const keys = tasks.map((task) => task.activity_key);
    expect(new Set(keys).size).toBe(keys.length);
    const byDate: Record<string, number> = {};
    tasks.forEach((task) => {
      byDate[task.scheduled_date] = (byDate[task.scheduled_date] || 0) + task.estimated_time;
    });
    Object.entries(byDate).forEach(([date, minutes]) => {
      const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
      expect(minutes).toBeLessThanOrEqual(
        weekday === 1 || weekday === 3 || weekday === 5 || weekday === 6 ? 60 : 0
      );
    });
  });

  it('rotates through the focus skills instead of repeating week one four times', () => {
    const tasks = tasksOf(plan().schedule);
    const firstWeek = new Set(
      tasks.filter((task) => task.scheduled_date < addDays(START, 7)).map((t) => t.evidence_key)
    );
    const allWeeks = new Set(tasks.map((task) => task.evidence_key));
    expect(allWeeks.size).toBeGreaterThan(firstWeek.size);
  });

  it('keeps weekly totals as one week, not the whole window', () => {
    const result = plan();
    const firstWeekMinutes = tasksOf(result.schedule)
      .filter((task) => task.scheduled_date < addDays(START, 7))
      .reduce((total, task) => total + task.estimated_time, 0);
    expect(result.weekly_planned_minutes).toBe(firstWeekMinutes);
  });
});

describe('plan window length', () => {
  const path = (extra = {}) => ({
    version: 2,
    schedule_start_date: START,
    goal_snapshot: { study_availability: availability },
    ...extra,
  });

  it('ends on the last planned day, and treats plans without a length as seven days', () => {
    expect(getPlanEndDate(path({ plan_days: 30 }))).toBe(addDays(START, 29));
    expect(getPlanEndDate(path({ plan_days: 15 }))).toBe(addDays(START, 14));
    expect(getPlanEndDate(path())).toBe(addDays(START, 6));
  });
});

describe('rollScheduleForward over a longer plan', () => {
  const today = addDays(START, 2);
  const previous = plan().schedule;
  const fresh = buildPlanSchedule({
    availability,
    evidence,
    readiness,
    targetBand: 7,
    now: today,
    horizonDays: 30,
  }).schedule;

  it('keeps the days already shown and only fills the days past the old plan’s end', () => {
    const rolled = rollScheduleForward({
      previousSchedule: previous,
      previousStartDate: START,
      previousHorizonDays: 30,
      horizonDays: 30,
      freshSchedule: fresh,
      today,
      availability,
    });
    expect(rolled.freshDates).toEqual([addDays(START, 30), addDays(START, 31)]);
    const keptKeys = new Set(
      tasksOf(previous)
        .filter((task) => task.scheduled_date >= today)
        .map((task) => task.activity_key)
    );
    const rolledKeys = new Set(tasksOf(rolled.schedule).map((task) => task.activity_key));
    keptKeys.forEach((key) => expect(rolledKeys.has(key)).toBe(true));
  });

  it('shrinks the window as an exam gets closer', () => {
    const rolled = rollScheduleForward({
      previousSchedule: previous,
      previousStartDate: START,
      previousHorizonDays: 30,
      horizonDays: 13,
      freshSchedule: fresh,
      today,
      availability,
    });
    const dates = tasksOf(rolled.schedule).map((task) => task.scheduled_date);
    expect(Math.max(...dates.map((date) => Date.parse(date)))).toBeLessThanOrEqual(
      Date.parse(addDays(today, 12))
    );
  });
});

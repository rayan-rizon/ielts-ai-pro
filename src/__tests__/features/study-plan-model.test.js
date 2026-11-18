import { describe, expect, it } from 'vitest';
import {
  buildHeatmap,
  buildSessionChecklist,
  buildHistoryDays,
  buildMonthGrid,
  getPlanMonths,
  buildPracticeLog,
  buildWeeklyMinutes,
  computeRunway,
  getDaysSincePractice,
  getPlanAttention,
  getPracticeStreak,
  isFarBelow,
  summarizeWeek,
} from '@/features/learning/components/dashboard/studyPlanModel';

const TODAY = '2026-11-19'; // a Thursday
const session = (completedAt, overrides = {}) => ({
  is_completed: true,
  test_type: 'reading',
  score: 5,
  actual_duration_seconds: 1800,
  completed_at: completedAt,
  ...overrides,
});
const allDays = (minutes) => ({
  timezone: 'UTC',
  days: Object.fromEntries(
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => [
      day,
      minutes,
    ])
  ),
});

describe('buildPracticeLog', () => {
  it('groups completed sessions by the learner’s local day with real minutes', () => {
    const log = buildPracticeLog({
      sessions: [
        session('2026-11-18T09:00:00Z'),
        session('2026-11-18T20:00:00Z', { test_type: 'listening', actual_duration_seconds: 900 }),
      ],
      timezone: 'UTC',
    });
    expect(log['2026-11-18']).toMatchObject({ count: 2, minutes: 45 });
    expect(log['2026-11-18'].modules.sort()).toEqual(['listening', 'reading']);
  });

  it('uses the learner’s timezone, not the browser’s, to pick the day', () => {
    // 23:30 UTC on the 18th is already the 19th in Dhaka (UTC+6).
    const log = buildPracticeLog({
      sessions: [session('2026-11-18T23:30:00Z')],
      timezone: 'Asia/Dhaka',
    });
    expect(Object.keys(log)).toEqual(['2026-11-19']);
  });

  it('ignores sessions that were never completed or have no timestamp', () => {
    const log = buildPracticeLog({
      sessions: [session('2026-11-18T09:00:00Z', { is_completed: false }), session(null)],
      timezone: 'UTC',
    });
    expect(log).toEqual({});
  });

  it('counts finished plan activities as practice without inventing minutes', () => {
    const log = buildPracticeLog({
      sessions: [],
      activityByKey: {
        a: { is_completed: true, completed_at: '2026-11-17T10:00:00Z', module: 'writing' },
        b: { is_completed: false, completed_at: '2026-11-17T10:00:00Z', module: 'reading' },
      },
      timezone: 'UTC',
    });
    expect(log['2026-11-17']).toMatchObject({ count: 1, minutes: 0, modules: ['writing'] });
  });
});

describe('practice streak and gaps', () => {
  const log = (...days) => Object.fromEntries(days.map((day) => [day, { count: 1, minutes: 30 }]));

  it('counts consecutive practised days ending today', () => {
    expect(getPracticeStreak(log('2026-11-19', '2026-11-18', '2026-11-17'), TODAY)).toBe(3);
  });

  it('does not break the streak just because today has not been practised yet', () => {
    expect(getPracticeStreak(log('2026-11-18', '2026-11-17'), TODAY)).toBe(2);
  });

  it('is zero once a full day has been skipped', () => {
    expect(getPracticeStreak(log('2026-11-17'), TODAY)).toBe(0);
  });

  it('reports days since the last practice, or null when there is none', () => {
    expect(getDaysSincePractice(log('2026-11-19'), TODAY)).toBe(0);
    expect(getDaysSincePractice(log('2026-11-10'), TODAY)).toBe(9);
    expect(getDaysSincePractice({}, TODAY)).toBeNull();
  });
});

describe('buildHistoryDays', () => {
  it('marks a planned study day with no practice as missed, and a free day as rest', () => {
    const base = allDays(40);
    const availability = { ...base, days: { ...base.days, monday: 0 } }; // Monday is a rest day
    const log = { '2026-11-17': { count: 1, minutes: 30, modules: ['reading'] } };
    const days = buildHistoryDays({ log, availability, todayKey: TODAY, days: 7 });

    expect(days).toHaveLength(7);
    expect(days[0].dateKey).toBe('2026-11-12');
    expect(days[6].dateKey).toBe('2026-11-18');
    const byKey = Object.fromEntries(days.map((day) => [day.dateKey, day.status]));
    expect(byKey['2026-11-17']).toBe('practised');
    expect(byKey['2026-11-16']).toBe('rest');
    expect(byKey['2026-11-18']).toBe('missed');
  });

  it('never calls a day missed when the learner had no time set for it', () => {
    const days = buildHistoryDays({ log: {}, availability: allDays(0), todayKey: TODAY, days: 7 });
    expect(days.every((day) => day.status === 'rest')).toBe(true);
  });
});

describe('buildWeeklyMinutes', () => {
  it('buckets minutes into rolling seven-day windows ending today, oldest first', () => {
    const log = {
      '2026-11-19': { count: 1, minutes: 30 },
      '2026-11-13': { count: 1, minutes: 20 },
      '2026-11-12': { count: 1, minutes: 50 },
    };
    const weeks = buildWeeklyMinutes({ log, todayKey: TODAY, weeks: 3 });
    expect(weeks.map((week) => week.minutes)).toEqual([0, 50, 50]);
    expect(weeks[2].endKey).toBe(TODAY);
    expect(weeks[2].startKey).toBe('2026-11-13');
  });
});

describe('buildHeatmap', () => {
  it('returns five columns of seven days ending today, with practice levels', () => {
    const log = {
      '2026-11-19': { count: 1, minutes: 20 },
      '2026-11-18': { count: 3, minutes: 90 },
    };
    const grid = buildHeatmap({ log, todayKey: TODAY, weeks: 5 });
    expect(grid).toHaveLength(5);
    expect(grid.every((column) => column.length === 7)).toBe(true);
    const last = grid[4][6];
    expect(last).toMatchObject({ dateKey: TODAY, isToday: true, level: 1 });
    expect(grid[4][5]).toMatchObject({ dateKey: '2026-11-18', level: 3 });
    expect(grid[0][0].level).toBe(0);
  });
});

describe('getPlanAttention', () => {
  it('stays quiet for a learner with no history yet', () => {
    expect(getPlanAttention({ daysSincePractice: null, missedDays: 0 })).toBeNull();
  });

  it('stays quiet when practice is recent and nothing was skipped', () => {
    expect(getPlanAttention({ daysSincePractice: 1, missedDays: 0 })).toBeNull();
  });

  it('warns after three quiet days and escalates after a week', () => {
    expect(getPlanAttention({ daysSincePractice: 3, missedDays: 3 })).toMatchObject({
      kind: 'inactive',
      tone: 'warn',
      title: 'No practice for 3 days',
    });
    expect(getPlanAttention({ daysSincePractice: 9, missedDays: 5 })).toMatchObject({
      kind: 'inactive',
      tone: 'fault',
      title: 'No practice for 9 days',
    });
  });

  it('flags repeated skipped study days even when the learner practised recently', () => {
    expect(getPlanAttention({ daysSincePractice: 1, missedDays: 3 })).toMatchObject({
      kind: 'missed',
      tone: 'warn',
      title: 'You skipped 3 planned study days this past week',
    });
  });

  it('does not nag about a single skipped day', () => {
    expect(getPlanAttention({ daysSincePractice: 1, missedDays: 1 })).toBeNull();
  });
});

describe('computeRunway', () => {
  const readiness = {
    modules: {
      reading: { median: 1 },
      writing: { median: 7.5 },
      listening: { median: 4 },
      speaking: { median: null },
    },
  };
  const days = [{ tasks: [{}] }, { tasks: [] }, { tasks: [{}] }, { tasks: [{}] }];

  it('turns days left and saved study time into weeks, sessions and minutes', () => {
    const runway = computeRunway({
      daysLeft: 70,
      weeklyCapacity: 120,
      days,
      readiness,
      targetBand: 7,
    });
    expect(runway).toMatchObject({ weeks: 10, sessions: 30, minutes: 1200 });
  });

  it('names the biggest scored gap and counts unscored subjects as below target', () => {
    const runway = computeRunway({
      daysLeft: 70,
      weeklyCapacity: 120,
      days,
      readiness,
      targetBand: 7,
    });
    expect(runway.belowCount).toBe(3);
    expect(runway.largest).toMatchObject({ module: 'reading', gap: 6 });
  });

  it('lists every subject still to close, biggest gap first, unscored last', () => {
    const runway = computeRunway({
      daysLeft: 70,
      weeklyCapacity: 120,
      days,
      readiness,
      targetBand: 7,
    });
    expect(runway.below.map((item) => item.module)).toEqual(['reading', 'listening', 'speaking']);
    expect(runway.below[2]).toMatchObject({ scored: false, gap: null });
  });

  it('has no runway once the exam date has passed', () => {
    const runway = computeRunway({
      daysLeft: 0,
      weeklyCapacity: 120,
      days,
      readiness,
      targetBand: 7,
    });
    expect(runway).toMatchObject({ weeks: 0, sessions: 0, minutes: 0 });
  });
});

describe('summarizeWeek', () => {
  const task = (key, extra = {}) => ({ activity_key: key, estimated_time: 40, ...extra });
  const days = [
    {
      tasks: [
        task('a', { is_completed: true }),
        task('extra', { is_optional: true, is_completed: true }),
      ],
    },
    { tasks: [task('b')] },
  ];

  it('counts only main tasks, so finished extras never inflate progress', () => {
    const week = summarizeWeek({ days, primaryTask: null, selectedKey: null });
    expect(week.mainTasks).toHaveLength(2);
    expect(week.doneTasks).toHaveLength(1);
    expect(week.plannedMinutes).toBe(80);
    expect(week.doneMinutes).toBe(40);
  });

  it('selects the chosen task and its day, else the best next task', () => {
    const chosen = summarizeWeek({ days, primaryTask: task('a'), selectedKey: 'b' });
    expect(chosen.selectedTask.activity_key).toBe('b');
    expect(chosen.selectedDay).toBe(days[1]);
    const fallback = summarizeWeek({ days, primaryTask: task('a'), selectedKey: 'gone' });
    expect(fallback.selectedTask.activity_key).toBe('a');
  });
});

describe('isFarBelow', () => {
  it('flags only scores more than two bands under target', () => {
    expect(isFarBelow(1, 7)).toBe(true);
    expect(isFarBelow(4.5, 7)).toBe(true);
    expect(isFarBelow(5, 7)).toBe(false);
    expect(isFarBelow(7.5, 7)).toBe(false);
    expect(isFarBelow(null, 7)).toBe(false);
  });
});

describe('buildSessionChecklist', () => {
  const verified = (extra = {}) => ({
    completion_policy: 'verified',
    success_criterion: 'Complete the set at 80%+ accuracy with steady timing.',
    ...extra,
  });

  it('starts with every step pending for a session that has not been done', () => {
    const steps = buildSessionChecklist(verified());
    expect(steps.map((step) => [step.id, step.state])).toEqual([
      ['attempt', 'pending'],
      ['goal', 'pending'],
    ]);
    expect(steps[0].label).toBe('Complete the practice set');
    expect(steps[1].label).toBe('Get 80% or more correct');
  });

  it('ticks both steps from the recorded result when the goal is met', () => {
    const steps = buildSessionChecklist(verified({ is_completed: true, outcome_accuracy: 85 }));
    expect(steps.map((step) => step.state)).toEqual(['done', 'done']);
    expect(steps[1].detail).toBe('85%');
  });

  it('shows a finished attempt that missed the goal as missed, with the real number', () => {
    const steps = buildSessionChecklist(verified({ is_completed: true, outcome_accuracy: 60 }));
    expect(steps.map((step) => step.state)).toEqual(['done', 'missed']);
    expect(steps[1].detail).toBe('60% · goal 80%');
  });

  it('never claims a goal result that was not recorded', () => {
    const steps = buildSessionChecklist(verified({ is_completed: true }));
    expect(steps[1]).toMatchObject({ state: 'unknown', detail: 'Result not recorded' });
  });

  it('reads an x/y goal as a percentage, and a band goal against the band', () => {
    const ratio = buildSessionChecklist({
      completion_policy: 'verified',
      success_criterion: 'Score 8/10 without notes.',
      is_completed: true,
      outcome_accuracy: 80,
    });
    expect(ratio[1]).toMatchObject({ state: 'done', label: 'Get 8 of 10 correct' });
    const band = buildSessionChecklist({
      completion_policy: 'verified',
      success_criterion: 'Reach band 6.5 on a timed attempt.',
      is_completed: true,
      outcome_band: 6,
    });
    expect(band[1]).toMatchObject({ state: 'missed', detail: 'Band 6.0 · goal 6.5' });
  });

  it('has only the attempt step when the goal has no number to check', () => {
    const steps = buildSessionChecklist({
      completion_policy: 'verified',
      success_criterion: 'Complete the activity and review the evidence it produces.',
    });
    expect(steps.map((step) => step.id)).toEqual(['attempt']);
  });

  it('labels a manual session’s attempt as practice, not a scored attempt', () => {
    const steps = buildSessionChecklist({ success_criterion: 'Finish the drill.' });
    expect(steps[0].label).toBe('Finish the session');
  });
});

describe('summarizeWeek over a longer plan', () => {
  const task = (key) => ({ activity_key: key, estimated_time: 40 });
  const week = [{ tasks: [task('a')] }];
  const plan = [...week, { tasks: [task('later')] }];

  it('counts only the week, but can select a session further along the plan', () => {
    const summary = summarizeWeek({
      days: week,
      selectableDays: plan,
      primaryTask: null,
      selectedKey: 'later',
    });
    expect(summary.plannedMinutes).toBe(40);
    expect(summary.selectedTask.activity_key).toBe('later');
    expect(summary.selectedDay).toBe(plan[1]);
  });
});

describe('month view', () => {
  const task = (key) => ({ activity_key: key, estimated_time: 40 });
  const planDay = (dateKey, tasks = [], extra = {}) => ({ dateKey, tasks, ...extra });
  const days = [
    planDay('2026-11-19'),
    planDay('2026-11-21', [task('a')]),
    planDay('2026-12-03', [task('b')]),
    planDay('2026-12-04', [], { isExamDay: true }),
  ];
  const history = [
    { dateKey: '2026-11-17', status: 'missed' },
    { dateKey: '2026-11-18', status: 'practised' },
  ];

  it('lists each month the plan touches, from the month it starts in', () => {
    expect(getPlanMonths(days, '2026-11-19')).toEqual(['2026-11-01', '2026-12-01']);
  });

  it('lays a month out Monday-first with leading and trailing blanks', () => {
    const grid = buildMonthGrid({
      monthKey: '2026-11-01',
      days,
      historyDays: history,
      todayKey: '2026-11-19',
    });
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(grid[0][5].dateKey).toBeNull(); // Nov 1 2026 is a Sunday
    expect(grid[0][6].dateKey).toBe('2026-11-01');
    expect(grid.flat().filter((cell) => cell.dateKey).length).toBe(30);
  });

  it('puts plan tasks, practice and skipped days on their own dates', () => {
    const cells = buildMonthGrid({
      monthKey: '2026-11-01',
      days,
      historyDays: history,
      todayKey: '2026-11-19',
    })
      .flat()
      .filter((cell) => cell.dateKey);
    const byDate = Object.fromEntries(cells.map((cell) => [cell.dateKey, cell]));
    expect(byDate['2026-11-21'].tasks).toHaveLength(1);
    expect(byDate['2026-11-19'].isToday).toBe(true);
    expect(byDate['2026-11-17'].status).toBe('missed');
    expect(byDate['2026-11-18'].status).toBe('practised');
    expect(byDate['2026-11-20'].tasks).toEqual([]);
  });

  it('marks exam day', () => {
    const cells = buildMonthGrid({
      monthKey: '2026-12-01',
      days,
      historyDays: [],
      todayKey: '2026-11-19',
    }).flat();
    expect(cells.find((cell) => cell.dateKey === '2026-12-04').isExamDay).toBe(true);
  });
});

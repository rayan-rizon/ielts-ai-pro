import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildPlanSchedule,
  buildSevenDaySchedule,
  getPlanEndDate,
  getPlanStartDate,
  getRolledScheduleStart,
  isLearningPlanBehind,
  isLearningPlanExpired,
  normalizeStudyAvailability,
  rollScheduleForward,
} from '../../../supabase/functions/_shared/learningPathV2';
import {
  computePlanDays,
  getPlanRefreshTrigger,
  getFriendlyPlanText,
  getTaskModeLabel,
  getTaskPurpose,
} from '@/features/learning/components/dashboard/dashboardUtils';
import PlanCalendar from '@/features/learning/components/dashboard/PlanCalendar';

const availability = normalizeStudyAvailability({
  timezone: 'Asia/Dhaka',
  days: { monday: 60, wednesday: 60, friday: 60, saturday: 60 },
});
const evidence = {
  measured_priorities: [
    { skill_code: 'reading_matching_features', module: 'reading', mastery: 0.4, observations: 12 },
    { skill_code: 'listening_gap_fill', module: 'listening', mastery: 0.45, observations: 10 },
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
const schedule = (start) =>
  buildSevenDaySchedule({ availability, evidence, readiness, targetBand: 7, now: start }).schedule;
const tasksOf = (weekly) => Object.values(weekly).flat();
const plan = (start, extra = {}) => ({
  version: 2,
  generator_version: '2.5.1',
  input_fingerprint: 'same',
  generated_at: `${start}T02:00:00Z`,
  schedule_start_date: start,
  goal_snapshot: { target_band: 7, test_date: null, study_availability: availability },
  ...extra,
});

describe('plan window', () => {
  it('derives the window from the saved start date, or the generation day for older plans', () => {
    expect(getPlanStartDate(plan('2026-10-03'))).toBe('2026-10-03');
    expect(getPlanEndDate(plan('2026-10-03'))).toBe('2026-10-09');
    // 20:00 UTC on Oct 2 is already Oct 3 in Dhaka.
    expect(
      getPlanStartDate({
        generated_at: '2026-10-02T20:00:00Z',
        goal_snapshot: { study_availability: availability },
      })
    ).toBe('2026-10-03');
    expect(getPlanStartDate({})).toBeNull();
  });

  it('is behind from the day after it starts, and expired only after its seventh day', () => {
    const saved = plan('2026-10-03');
    expect(isLearningPlanBehind(saved, '2026-10-03T17:00:00Z')).toBe(false);
    expect(isLearningPlanBehind(saved, '2026-10-03T18:00:00Z')).toBe(true); // Oct 4 in Dhaka
    expect(isLearningPlanExpired(saved, '2026-10-06T06:00:00Z')).toBe(false);
    expect(isLearningPlanExpired(saved, '2026-10-09T17:59:00Z')).toBe(false);
    expect(isLearningPlanExpired(saved, '2026-10-09T18:00:00Z')).toBe(true);
  });

  it('asks the server to roll a plan that is behind, without calling it a new week', () => {
    const args = {
      user: { target_band_score: 7 },
      sessions: [],
      currentAvailability: availability,
    };
    const saved = plan('2026-10-03');
    expect(
      getPlanRefreshTrigger({ ...args, path: saved, now: new Date('2026-10-03T08:00:00Z') })
    ).toBeNull();
    expect(
      getPlanRefreshTrigger({ ...args, path: saved, now: new Date('2026-10-06T08:00:00Z') })
    ).toBe('schedule_rolled');
    expect(
      getPlanRefreshTrigger({ ...args, path: saved, now: new Date('2026-10-10T08:00:00Z') })
    ).toBe('schedule_expired');
  });
});

describe('rolling a week forward', () => {
  it('fills new days from the following week, or from today once nothing is kept', () => {
    expect(getRolledScheduleStart('2026-10-03', '2026-10-06')).toBe('2026-10-10');
    expect(getRolledScheduleStart('2026-10-03', '2026-10-09')).toBe('2026-10-10');
    expect(getRolledScheduleStart('2026-10-03', '2026-10-10')).toBe('2026-10-10');
    expect(getRolledScheduleStart('2026-10-03', '2026-10-15')).toBe('2026-10-15');
  });

  it('keeps the days already shown and only adds tasks for the new days', () => {
    const previous = schedule('2026-10-03');
    const fresh = schedule(getRolledScheduleStart('2026-10-03', '2026-10-06'));
    const { schedule: rolled, freshDates } = rollScheduleForward({
      previousSchedule: previous,
      previousStartDate: '2026-10-03',
      freshSchedule: fresh,
      today: '2026-10-06',
      availability,
    });

    expect(freshDates).toEqual(['2026-10-10', '2026-10-11', '2026-10-12']);
    // Weekday keys run in date order from today and match each task's date.
    expect(Object.keys(rolled)).toEqual([
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
      'monday',
    ]);
    Object.entries(rolled).forEach(([day, tasks]) =>
      tasks.forEach((task) => expect(task.scheduled_day).toBe(day))
    );

    const previousKeys = new Set(tasksOf(previous).map((task) => task.activity_key));
    const keptDays = ['wednesday', 'friday'];
    keptDays.forEach((day) => {
      expect(rolled[day].length).toBeGreaterThan(0);
      rolled[day].forEach((task) => expect(previousKeys.has(task.activity_key)).toBe(true));
    });
    // Oct 3 (Sat) and Oct 5 (Mon) are past and dropped; the new Sat and Mon are fresh.
    ['saturday', 'monday'].forEach((day) => {
      expect(rolled[day].length).toBeGreaterThan(0);
      rolled[day].forEach((task) => {
        expect(previousKeys.has(task.activity_key)).toBe(false);
        expect(task.scheduled_date >= '2026-10-10').toBe(true);
      });
    });
    expect(rolled.tuesday).toEqual([]);
    expect(rolled.sunday).toEqual([]);
    tasksOf(rolled).forEach((task) => expect(task.scheduled_date >= '2026-10-06').toBe(true));
    // New days continue the rotation (they are what next week's plan would
    // hold), so the week does not repeat the kept days' focus.
    const freshKeys = new Set(tasksOf(fresh).map((task) => task.activity_key));
    ['saturday', 'monday'].forEach((day) =>
      rolled[day].forEach((task) => expect(freshKeys.has(task.activity_key)).toBe(true))
    );
    const primaryFocus = tasksOf(rolled)
      .filter((task) => !task.is_optional)
      .map((task) => task.evidence_key);
    expect(new Set(primaryFocus).size).toBe(primaryFocus.length);
    // Every study day stays within its saved time.
    Object.entries(rolled).forEach(([day, tasks]) =>
      expect(tasks.reduce((sum, task) => sum + task.estimated_time, 0)).toBeLessThanOrEqual(
        availability.days[day] || 0
      )
    );
  });

  it('follows a task the learner moved, and fits new tasks around it', () => {
    const previous = schedule('2026-10-03');
    const moved = previous.wednesday[0];
    const { schedule: rolled } = rollScheduleForward({
      previousSchedule: previous,
      previousStartDate: '2026-10-03',
      freshSchedule: schedule('2026-10-10'),
      today: '2026-10-06',
      availability,
      activityDates: { [moved.activity_key]: '2026-10-10' },
    });

    expect(rolled.wednesday.map((task) => task.activity_key)).not.toContain(moved.activity_key);
    expect(rolled.saturday[0]).toMatchObject({
      activity_key: moved.activity_key,
      scheduled_date: '2026-10-10',
      scheduled_day: 'saturday',
    });
    expect(rolled.saturday.reduce((sum, task) => sum + task.estimated_time, 0)).toBeLessThanOrEqual(
      60
    );
  });

  it('builds a whole new week once the previous one has fully passed', () => {
    const fresh = schedule('2026-10-12');
    const { schedule: rolled, freshDates } = rollScheduleForward({
      previousSchedule: schedule('2026-10-03'),
      previousStartDate: '2026-10-03',
      freshSchedule: fresh,
      today: '2026-10-12',
      availability,
    });
    expect(freshDates).toHaveLength(7);
    expect(tasksOf(rolled).map((task) => task.activity_key)).toEqual(
      tasksOf(fresh).map((task) => task.activity_key)
    );
  });
});

describe('week view against the plan window', () => {
  afterEach(() => vi.useRealTimers());

  const pinDhakaDay = (day) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${day}T06:00:00Z`));
  };

  it('flags days past the plan end instead of treating them as rest days', () => {
    pinDhakaDay('2026-10-06');
    const saved = plan('2026-10-03', { weekly_schedule: schedule('2026-10-03') });
    const days = computePlanDays(saved, {}, availability);

    expect(days.map((day) => day.dateKey)).toEqual([
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
      '2026-10-12',
    ]);
    expect(days.map((day) => day.inPlan)).toEqual([true, true, true, true, false, false, false]);
    expect(days[4]).toMatchObject({ capacity: 60, tasks: [] });
  });

  it('treats a current plan and legacy weekday plans as fully planned', () => {
    pinDhakaDay('2026-10-06');
    const current = computePlanDays(
      plan('2026-10-06', { weekly_schedule: schedule('2026-10-06') }),
      {},
      availability
    );
    expect(current.every((day) => day.inPlan)).toBe(true);
    expect(computePlanDays({ weekly_schedule: {} }, {}, availability).every((d) => d.inPlan)).toBe(
      true
    );
  });
});

describe('plan days for a longer plan', () => {
  const pinDhakaDay = (day) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${day}T06:00:00Z`));
  };
  const longPlan = (start, planDays, testDate = null) => {
    const built = buildPlanSchedule({
      availability,
      evidence,
      readiness,
      targetBand: 7,
      now: start,
      testDate,
    });
    return plan(start, { plan_days: built.horizon_days, weekly_schedule: built.schedule });
  };

  it('shows the whole 30-day plan, each planned day with its own tasks', () => {
    pinDhakaDay('2026-10-06');
    const days = computePlanDays(longPlan('2026-10-06', 30), {}, availability);
    expect(days).toHaveLength(30);
    expect(days.every((day) => day.inPlan)).toBe(true);
    expect(days.filter((day) => day.tasks.length > 0).length).toBeGreaterThan(12);
    days.forEach((day) =>
      day.tasks.forEach((task) => expect(task.scheduled_date).toBe(day.dateKey))
    );
  });

  it('stops at the exam: a 15-day plan shows the planned days, then exam day, then nothing', () => {
    pinDhakaDay('2026-10-06');
    const saved = longPlan('2026-10-06', 15, '2026-10-21');
    const days = computePlanDays(saved, {}, availability, { examDate: '2026-10-21' });
    expect(days).toHaveLength(16);
    expect(days.at(-1)).toMatchObject({ dateKey: '2026-10-21', isExamDay: true, tasks: [] });
    expect(days.slice(0, 15).every((day) => day.inPlan && !day.isExamDay)).toBe(true);
  });

  it('keeps a plan saved before 30-day plans at seven days', () => {
    pinDhakaDay('2026-10-06');
    const days = computePlanDays(
      plan('2026-10-06', { weekly_schedule: schedule('2026-10-06') }),
      {},
      availability
    );
    expect(days).toHaveLength(7);
  });

  it('never shows fewer than a week for an unrolled plan, flagging days past its end', () => {
    pinDhakaDay('2026-10-12');
    const days = computePlanDays(
      plan('2026-10-03', { weekly_schedule: schedule('2026-10-03') }),
      {},
      availability
    );
    expect(days).toHaveLength(7);
    expect(days.map((day) => day.inPlan)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });
});

describe('PlanCalendar display', () => {
  const day = (dateKey, tasks = [], inPlan = true) => ({
    dateKey,
    date: new Date(`${dateKey}T12:00:00`),
    capacity: 60,
    inPlan,
    tasks,
  });
  const task = (key, extra = {}) => ({
    id: `id-${key}`,
    activity_key: key,
    title: 'Matching Features repair',
    module: 'reading',
    estimated_time: 35,
    scheduled_date: '2026-10-07',
    ...extra,
  });
  const history = (status, dateKey = '2026-10-05') => ({
    dateKey,
    status,
    capacity: 60,
    count: status === 'practised' ? 1 : 0,
    minutes: status === 'practised' ? 30 : 0,
    modules: status === 'practised' ? ['reading'] : [],
    sessions: [],
  });
  const renderCalendar = (days, historyDays = [history('missed')], overrides = {}) =>
    render(
      <PlanCalendar
        days={days}
        historyDays={historyDays}
        todayKey="2026-10-06"
        selectedKey=""
        canReschedule
        onSelect={vi.fn()}
        onReschedule={vi.fn()}
        doneMinutes={0}
        plannedMinutes={35}
        completedCount={0}
        taskCount={1}
        {...overrides}
      />
    );

  it('names empty days for what they are, apart from days not planned yet', () => {
    renderCalendar([
      day('2026-10-06'),
      day('2026-10-07', [task('a')]),
      day('2026-10-08', [], false),
    ]);
    expect(screen.getAllByText('Rest day')).toHaveLength(1);
    expect(screen.getAllByText('Not planned yet')).toHaveLength(1);
  });

  it('lets only an unfinished saved task be dragged to another day', () => {
    renderCalendar([
      day('2026-10-06', [task('open')]),
      day('2026-10-07', [task('done', { title: 'Done task', is_completed: true })]),
    ]);
    expect(screen.getByRole('button', { name: /Matching Features/ })).toHaveAttribute(
      'draggable',
      'true'
    );
    expect(screen.getByRole('button', { name: /Done/ })).toHaveAttribute('draggable', 'false');
  });

  it('shows finished tasks as done', () => {
    renderCalendar([day('2026-10-06', [task('done', { is_completed: true })])]);
    expect(screen.getByLabelText('Done')).toBeInTheDocument();
  });

  it('pages a long plan a week at a time, and ends it on exam day', () => {
    const longDays = Array.from({ length: 16 }, (_, index) => {
      const dateKey = `2026-10-${String(6 + index).padStart(2, '0')}`;
      return {
        ...day(
          dateKey,
          index === 9 ? [task('later', { title: 'Writing Task 2 Practice Mode' })] : []
        ),
        isExamDay: index === 15,
      };
    });
    renderCalendar(longDays);
    expect(screen.getByText('Week 1 of 3')).toBeVisible();
    expect(screen.queryByText(/Writing Task 2/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(screen.getByText('Week 2 of 3')).toBeVisible();
    expect(screen.getByText(/Writing Task 2/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(screen.getByText('Exam day')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Next week' })).toBeDisabled();
    expect(screen.getByText(/plan ends the day before your exam/)).toBeVisible();
  });

  it('shows the whole plan as a month, with sessions on their dates and a way to switch back', () => {
    const planDays = Array.from({ length: 16 }, (_, index) => {
      const dateKey = `2026-10-${String(6 + index).padStart(2, '0')}`;
      return {
        ...day(
          dateKey,
          index === 9 ? [task('later', { title: 'Writing Task 2 Practice Mode' })] : []
        ),
        isExamDay: index === 15,
      };
    });
    renderCalendar(planDays);
    fireEvent.click(screen.getByRole('button', { name: 'Month' }));
    expect(screen.getByText(/October 2026/)).toBeVisible();
    expect(screen.getByText(/Writing Task 2/)).toBeVisible();
    expect(screen.getByText('Exam')).toBeVisible();
    expect(screen.getByText(/16-day plan|15-day plan/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(screen.getByText('Week 1 of 3')).toBeVisible();
  });

  it('shows a skipped study day in the last 7 days instead of dropping it', () => {
    renderCalendar(
      [day('2026-10-06')],
      [history('missed', '2026-10-04'), history('practised', '2026-10-05')]
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show last 7 days' }));
    expect(screen.getByText('No practice')).toBeVisible();
    expect(screen.getByText('Practised')).toBeVisible();
    expect(screen.getByText(/1 practised · 1 skipped/)).toBeVisible();
  });
});

describe('plain-language task reasons', () => {
  it('explains each kind of task without planner jargon', () => {
    const cases = [
      [{ activity_type: 'targeted_drill', module: 'reading' }, /A weak Reading area/],
      [
        { activity_type: 'targeted_repair', module: 'listening', evidence: { observations: 3 } },
        /Missed in 3 recent tests/,
      ],
      [{ activity_type: 'targeted_repair', evidence: {} }, /keep missing/],
      [{ activity_type: 'grammar_diagnostic', module: 'grammar' }, /grammar level/],
      [{ activity_type: 'diagnostic', module: 'speaking' }, /Sets your Speaking score/],
      [{ activity_type: 'practice_assessment', module: 'writing' }, /Scored, with feedback/],
      [{ activity_type: 'exam_assessment', module: 'reading' }, /Timed, no hints/],
      [{ activity_type: 'maintenance', module: 'writing' }, /strong skill sharp/],
      [{ activity_type: 'vocabulary_review', module: 'vocabulary' }, /Saved words/],
      [{}, /Part of this week/],
    ];
    cases.forEach(([task, expected]) => {
      const purpose = getTaskPurpose(task);
      expect(purpose).toMatch(expected);
      expect(purpose).not.toMatch(/mastery|skill progress|results makes|confirmed focus/i);
    });
  });

  it('names how a task opens', () => {
    expect(getTaskModeLabel({ requested_mode: 'exam' })).toBe('Exam Mode');
    expect(getTaskModeLabel({ routing: { mode: 'review' } })).toBe('Review');
    expect(getTaskModeLabel({ requested_mode: 'practice' })).toBe('Practice Mode');
    expect(getTaskModeLabel({})).toBe('Practice Mode');
  });
});

describe('planner reasons shown to students', () => {
  it('restates the confirmed-focus statistic without the raw answer count', () => {
    const text = getFriendlyPlanText(
      '1% skill progress across 2147 results makes this a confirmed focus.'
    );
    expect(text).toBe(
      'Your estimated level on this skill is 1%, one of your lowest, so it is a focus for now.'
    );
    expect(text).not.toMatch(/2147/);
  });

  it('explains a due review in plain words', () => {
    expect(
      getFriendlyPlanText(
        'This previously practised skill is due for recall; it is not being inferred as a new weakness.'
      )
    ).toBe(
      'You practised this before and it is due for a quick refresher. It is not a new weakness.'
    );
  });
});

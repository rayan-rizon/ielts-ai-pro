import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
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
  computeSevenDays,
  getPlanRefreshTrigger,
  getFriendlyPlanText,
  getTaskModeLabel,
  getTaskPurpose,
} from '@/features/learning/components/dashboard/dashboardUtils';
import WeekPlan from '@/features/learning/components/dashboard/WeekPlan';
import { TooltipProvider } from '@/components/ui/tooltip';

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
  generator_version: '2.4.4',
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
    const days = computeSevenDays(saved, {}, availability);

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
    const current = computeSevenDays(
      plan('2026-10-06', { weekly_schedule: schedule('2026-10-06') }),
      {},
      availability
    );
    expect(current.every((day) => day.inPlan)).toBe(true);
    expect(computeSevenDays({ weekly_schedule: {} }, {}, availability).every((d) => d.inPlan)).toBe(
      true
    );
  });
});

describe('WeekPlan display', () => {
  const day = (dateKey, capacity, tasks = [], inPlan = true) => ({
    dateKey,
    date: new Date(`${dateKey}T12:00:00`),
    capacity,
    inPlan,
    tasks,
  });
  const task = (key, extra = {}) => ({
    activity_key: key,
    title: 'Matching Features repair',
    module: 'reading',
    estimated_time: 35,
    priority: 'high',
    completion_policy: 'verified',
    ...extra,
  });
  const renderWeek = (days) =>
    render(
      <TooltipProvider>
        <WeekPlan
          days={days}
          canReschedule
          expandedTask={null}
          setExpandedTask={vi.fn()}
          onToggle={vi.fn()}
          onStart={vi.fn()}
          onReschedule={vi.fn()}
        />
      </TooltipProvider>
    );

  it('names empty days for what they are and counts unplanned days separately', () => {
    renderWeek([
      day('2026-10-06', 0),
      day('2026-10-07', 60, [task('a'), task('b', { is_optional: true, estimated_time: 25 })]),
      day('2026-10-08', 0),
      day('2026-10-09', 60),
      day('2026-10-10', 60, [], false),
      day('2026-10-11', 0, [], false),
      day('2026-10-12', 60, [], false),
    ]);

    expect(screen.getByRole('button', { name: /Tuesday, Oct 6\. Rest day\./ })).toBeVisible();
    expect(
      screen.getByRole('button', { name: /Friday, Oct 9\. Nothing scheduled\./ })
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: /Saturday, Oct 10\. Not planned yet\./ })
    ).toBeVisible();
    expect(screen.getByText('3 days are not planned yet.')).toBeVisible();
  });

  it('lists main tasks first, extras under "If you have time", each with a plain reason', () => {
    renderWeek([
      day('2026-10-07', 60, [
        task('b', {
          is_optional: true,
          estimated_time: 25,
          module: 'listening',
          title: 'Listening gap fill repair',
          activity_type: 'targeted_repair',
          evidence_key: 'recurring:listening:gap_fill',
          evidence: { observations: 3 },
        }),
        task('a', {
          activity_type: 'targeted_drill',
          skill_targets: ['reading_matching_features'],
        }),
      ]),
    ]);

    const [main, extras] = screen.getAllByRole('list');
    expect(within(main).getByText('Reading: Matching features practice')).toBeVisible();
    expect(within(main).getByText('A weak Reading area')).toBeVisible();
    expect(screen.getByText('If you have time')).toBeVisible();
    expect(within(extras).getByText('Missed in 3 recent tests')).toBeVisible();
    // Priority labels told students nothing (almost every task was "high").
    expect(screen.queryByText(/priority/i)).toBeNull();
    expect(screen.getByText('0/2')).toBeVisible();
  });

  it('shows finished tasks as done, and the day as done once all are finished', () => {
    renderWeek([
      day('2026-10-07', 60, [task('a', { is_completed: true }), task('b', { is_completed: true })]),
    ]);
    expect(screen.getByRole('button', { name: /all done/ })).toBeVisible();
    expect(screen.getAllByRole('img', { name: /: done$/ })).toHaveLength(2);
    expect(screen.getByText('2/2')).toBeVisible();
  });

  it('explains an unplanned day instead of calling it a rest day', () => {
    renderWeek([day('2026-10-10', 60, [], false), day('2026-10-11', 60, [task('a')])]);
    // The strip opens on the next day with work, so pick the unplanned day.
    fireEvent.click(screen.getByRole('button', { name: /Saturday, Oct 10\. Not planned yet\./ }));
    expect(screen.getByText('Not planned yet. It is added when your plan renews.')).toBeVisible();
    expect(screen.queryByText(/Rest day/)).toBeNull();
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

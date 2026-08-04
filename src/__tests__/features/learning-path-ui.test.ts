import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildRoadmapViewModel,
  computeDashboardSnapshot,
  computePhases,
  computeSevenDays,
  dateKey,
  getDaySummaryMeta,
  getFriendlyPlanText,
  getFriendlyTaskTitle,
  getPlanRefreshTrigger,
} from '@/features/learning/components/dashboard/dashboardUtils';

const page = readFileSync(
  resolve(process.cwd(), 'src/features/learning/pages/LearningPath.jsx'),
  'utf8'
);
const dashboard = readFileSync(
  resolve(process.cwd(), 'src/features/learning/components/dashboard/LearningPathDashboard.jsx'),
  'utf8'
);
const hero = readFileSync(
  resolve(process.cwd(), 'src/features/learning/components/dashboard/HeroSection.jsx'),
  'utf8'
);
const roadmap = readFileSync(
  resolve(process.cwd(), 'src/features/learning/components/dashboard/RoadmapSection.jsx'),
  'utf8'
);
const weekPlan = readFileSync(
  resolve(process.cwd(), 'src/features/learning/components/dashboard/WeekPlan.jsx'),
  'utf8'
);
const priorities = readFileSync(
  resolve(process.cwd(), 'src/features/learning/components/dashboard/PrioritiesPanel.jsx'),
  'utf8'
);
const readiness = readFileSync(
  resolve(process.cwd(), 'src/features/learning/components/dashboard/ReadinessPanel.jsx'),
  'utf8'
);
const weekPulse = readFileSync(
  resolve(process.cwd(), 'src/features/learning/components/dashboard/WeekPulse.jsx'),
  'utf8'
);
const planSignals = readFileSync(
  resolve(process.cwd(), 'src/features/learning/components/dashboard/PlanSignalsCard.jsx'),
  'utf8'
);
const countdown = readFileSync(
  resolve(process.cwd(), 'src/features/learning/components/dashboard/ExamCountdownPanel.jsx'),
  'utf8'
);
const app = readFileSync(resolve(process.cwd(), 'src/App.jsx'), 'utf8');
const layout = readFileSync(resolve(process.cwd(), 'src/features/core/pages/Layout.jsx'), 'utf8');
const hook = readFileSync(
  resolve(process.cwd(), 'src/features/learning/hooks/useLearningPathData.js'),
  'utf8'
);

describe('Learning Path main page composition', () => {
  it('removes the completion-based forecast and repetitive legacy cards', () => {
    expect(page).not.toContain('ProgressForecast');
    expect(page).not.toContain('BandGapBreakdown');
    expect(page).not.toContain('WeakSkillSpotlight');
    expect(page).not.toContain('RecommendedPractice');
  });

  it('states that readiness is evidence, not a future score prediction', () => {
    expect(hero).toContain('never turned into a predicted IELTS score');
    expect(dashboard).not.toContain('potential gain');
    expect(dashboard).not.toContain('required hours');
  });

  it('includes the useful revision, checkpoint, roadmap, schedule, and evidence sections', () => {
    expect(planSignals).toContain('Your plan guide');
    expect(planSignals).toContain('What changed, and what to do next');
    expect(planSignals).toContain('Edit plan');
    // The plan guide now lives in the hero, in the space the illustration used to take.
    expect(hero).toContain('<PlanSignalsCard');
    expect(dashboard).toContain('onStart={startTask}');
    expect(roadmap).toContain('Your path to exam day');
    expect(weekPlan).toContain("This week's plan");
    expect(priorities).toContain('What to improve next');
    expect(readiness).toContain('Recent practice scores');
    expect(weekPulse).toContain('Your week at a glance');
  });

  it('uses compact responsive layouts and redirects the retired preview route', () => {
    expect(dashboard).toContain('grid-cols-[minmax(0,1fr)]');
    expect(weekPlan).toContain('md:col-span-2');
    // Seven day columns, one per day of the plan week.
    expect(weekPlan).toContain('grid-cols-7');
    expect(roadmap).toContain('auto-cols-[88%]');
    expect(roadmap).toContain('sm:grid-cols-2');
    expect(roadmap).toContain('xl:grid-cols-4');
    expect(dashboard).toContain('md:grid-cols-2');
    expect(dashboard).toContain('2xl:grid-cols-[1.08fr_1fr_0.9fr]');
    expect(dashboard).toContain('items-stretch');
    expect(hero).toContain('grid-cols-2');
    expect(hero).toContain('sm:grid-cols-4');
    expect(readiness).toContain('grid-cols-2');
    expect(readiness).toContain('sm:grid-cols-4');
    expect(layout).toContain(
      'pointer-events-none absolute top-4 left-4 z-50 flex items-center gap-2 md:hidden'
    );
    expect(app).toContain("path: '/learning-path-preview'");
    expect(app).toContain('<Navigate to="/learning-path" replace />');
    expect(app).not.toContain('LearningPathPreview');
  });

  it('makes the roadmap rail keyboard-operable and gives every stage a descriptive name', () => {
    expect(roadmap).toContain('aria-label={`Open stage ${index + 1}');
    expect(roadmap).toContain("event.key === 'Enter'");
    expect(roadmap).toContain("event.key === ' '");
    expect(roadmap).toContain('aria-pressed={selectedIndex === index}');
  });

  it('keeps legacy status contextual and shows the whole week as a calendar', () => {
    expect(dashboard).not.toContain('This historical plan remains available');
    // A legacy plan is passed through as planUpdateAvailable, so the single
    // refresh control in the plan guide reads "Update plan" for it too.
    expect(hero).toContain('isLegacyPlan || planUpdateAvailable');
    expect(planSignals).toContain("'Update plan' : 'Check for updates'");
    // The week is no longer truncated to four days behind a "show all" toggle:
    // every day is a column, and picking one opens all of its tasks.
    expect(weekPlan).not.toContain('days.slice(0, 4)');
    expect(weekPlan).not.toContain('Show all 7 days');
    expect(weekPlan).toContain('CalendarDay');
    expect(weekPlan).toContain('move to an available day');
  });

  it('replaces the restated coach note with the exam runway a learner can act on', () => {
    expect(dashboard).not.toContain('CoachBanner');
    expect(dashboard).toContain('ExamCountdownPanel');
    expect(countdown).toContain('Time until your exam');
    expect(countdown).toContain('Sessions left');
    expect(countdown).toContain('Study time left');
    // Runway is arithmetic on saved availability, never a forecast of the score.
    expect(countdown).toContain('It is not a score prediction.');
  });

  it('uses clear activity names without changing persisted task data', () => {
    expect(
      getFriendlyTaskTitle({
        title: 'Listening Drill: MultipleChoice',
        module: 'listening',
        activity_type: 'targeted_drill',
        skill_code: 'listening_multiple_choice',
      })
    ).toBe('Listening: multiple choice practice');
    expect(
      getFriendlyTaskTitle({
        title: 'Writing diagnostic',
        module: 'writing',
        activity_type: 'diagnostic',
      })
    ).toBe('Writing level check');
  });

  it('translates older saved plan wording into learner-friendly terms', () => {
    expect(
      getFriendlyPlanText(
        '1% mastery across 374 observations makes this a measured priority. Evidence quality is an early signal.'
      )
    ).toBe(
      '1% skill progress across 374 observations makes this a confirmed focus. How sure we are: needs more results.'
    );
  });

  it('summarizes each study day without exceeding its saved availability', () => {
    expect(
      getDaySummaryMeta(
        {
          capacity: 45,
          tasks: [
            { title: 'Writing coherence repair', module: 'writing', estimated_time: 35 },
            { title: 'Listening distractor review', module: 'listening', estimated_time: 25 },
          ],
        },
        { title: 'Writing coherence repair', module: 'writing', estimated_time: 35 }
      )
    ).toMatchObject({ durationText: '1h planned', overflow: true, additionalTasks: 1 });

    expect(getDaySummaryMeta({ capacity: 60, tasks: [] })).toMatchObject({
      titleText: 'Rest day',
      durationText: '1h available',
      overflow: false,
    });
  });

  it('formats local schedule dates for rescheduling controls', () => {
    expect(dateKey(new Date('2026-07-23T12:00:00'))).toBe('2026-07-23');
    expect(dateKey('not-a-date')).toBe('');
  });

  it('keeps saved task completion and scheduled dates in the seven-day view', () => {
    const current = new Date();
    current.setHours(12, 0, 0, 0);
    const today = dateKey(current);
    const dayName = current.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const activityKey = `plan:${today}:primary`;

    const days = computeSevenDays(
      {
        weekly_schedule: {
          [dayName]: [
            {
              activity_key: activityKey,
              scheduled_day: dayName,
              scheduled_date: today,
              title: 'Writing coherence repair',
              module: 'writing',
              estimated_time: 35,
            },
          ],
        },
      },
      { [activityKey]: { id: 'activity-1', is_completed: true, estimated_minutes: 40 } },
      { days: { [dayName]: 45 } }
    );

    expect(days[0]).toMatchObject({ dateKey: today, capacity: 45 });
    expect(days[0].tasks[0]).toMatchObject({
      activity_key: activityKey,
      is_completed: true,
      estimated_time: 40,
    });
  });

  it('keeps legacy weekday-only tasks without repeating schedule work for every day', () => {
    const current = new Date();
    current.setHours(12, 0, 0, 0);
    const dayName = current.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const days = computeSevenDays({
      weekly_schedule: {
        [dayName]: [
          {
            activity_key: 'legacy:weekday-task',
            scheduled_day: dayName,
            title: 'Reading diagnostic',
            module: 'reading',
          },
        ],
      },
    });

    expect(days[0].tasks[0]).toMatchObject({
      activity_key: 'legacy:weekday-task',
      scheduled_day: dayName,
      scheduled_date: dateKey(current),
    });
  });

  it('moves the current roadmap stage from calendar boundaries even if a saved flag is stale', () => {
    const phases = computePhases(
      [
        { key: 'foundation', current: true, start_date: '2026-06-01', end_date: '2026-06-30' },
        { key: 'repair', start_date: '2026-07-01', end_date: '2026-07-31' },
        { key: 'integration', start_date: '2026-08-01', end_date: '2026-08-31' },
        { key: 'readiness', start_date: '2026-09-01', end_date: '2026-09-10' },
      ],
      false,
      new Date('2026-07-23T12:00:00')
    );

    expect(phases.map((phase) => phase.status)).toEqual([
      'Completed',
      'In Progress',
      'Upcoming',
      'Upcoming',
    ]);
  });

  it('does not show stale roadmap dates after the account exam date has passed', () => {
    const snapshot = computeDashboardSnapshot(
      {
        goal_snapshot: { test_date: '2020-01-01' },
        roadmap: [
          {
            key: 'foundation',
            start_date: '2026-07-31',
            end_date: '2026-08-15',
          },
        ],
      },
      { test_date: '2020-01-01' }
    );

    expect(snapshot.examDate).toBe('2020-01-01');
    expect(snapshot.examDatePassed).toBe(true);
    expect(snapshot.roadmap.every((phase) => !phase.start_date && !phase.end_date)).toBe(true);
  });

  it('uses the account exam date while a saved roadmap is being refreshed', () => {
    const snapshot = computeDashboardSnapshot(
      {
        goal_snapshot: { test_date: '2099-10-22' },
        roadmap: [
          {
            key: 'foundation',
            start_date: '2026-07-31',
            end_date: '2026-08-15',
          },
        ],
      },
      { test_date: '2020-01-01' }
    );

    expect(snapshot.examDate).toBe('2020-01-01');
    expect(snapshot.roadmap.every((phase) => !phase.start_date && !phase.end_date)).toBe(true);
  });

  it('makes the exam-date tile and missing-score prompt actionable', () => {
    expect(hero).toContain('label="Exam date"');
    expect(hero).toContain('onClick={() => setCustomizeOpen(true)}');
    expect(readiness).toContain('Start score check');
    expect(weekPulse).toContain('Fix schedule');
    expect(roadmap).toContain('Your saved exam date has passed');
  });

  it('derives roadmap progress from evidence instead of a static completion value', () => {
    const phases = buildRoadmapViewModel({
      roadmap: [
        { key: 'foundation', current: true, start_date: '2020-01-01', end_date: '2099-01-01' },
        { key: 'repair', start_date: '2099-01-02', end_date: '2099-02-01' },
        { key: 'integration', start_date: '2099-02-02', end_date: '2099-03-01' },
        { key: 'readiness', start_date: '2099-03-02', end_date: '2099-04-01' },
      ],
      isLegacyPlan: false,
      readiness: {
        modules: {
          reading: { sufficient: true, sample_count: 2, median: 6.5 },
          writing: { sufficient: false, sample_count: 1 },
          listening: { sufficient: false, sample_count: 0 },
          speaking: { sufficient: false, sample_count: 0 },
        },
        missing_diagnostics: ['writing', 'listening', 'speaking'],
        overall: { available: false },
      },
      evidence: {
        measured_priorities: [{ skill_code: 'reading_inference', mastery: 0.35, observations: 10 }],
        due_reviews: [],
      },
      days: [
        {
          tasks: [
            { activity_type: 'diagnostic', title: 'Writing diagnostic', is_completed: false },
            {
              activity_type: 'timed_assessment',
              title: 'Reading timed check',
              is_completed: true,
              completion_source: 'test_session',
            },
          ],
        },
      ],
      targetBand: 7,
    });

    expect(phases.map((phase) => phase.progressPercent)).toEqual([25, 50, 50, 0]);
    expect(phases[0].progressLabel).toBe('1 of 4 subjects checked');
    expect(phases[0].actionTask?.title).toBe('Writing diagnostic');
    expect(phases[0].checklist.map((item) => item.done)).toEqual([false, false, true]);
    expect(phases[2].checklist.map((item) => item.done)).toEqual([true, true, false]);
  });

  it('does not request a plan rebuild when goals and scored results are unchanged', () => {
    const availability = {
      version: 1,
      timezone: 'Asia/Dhaka',
      days: { monday: 45, saturday: 90 },
    };
    const path = {
      version: 2,
      input_fingerprint: 'same-inputs',
      generated_at: '2026-07-23T09:00:00.000Z',
      goal_snapshot: {
        target_band: 7,
        test_date: '2026-09-10',
        study_availability: availability,
      },
    };
    const user = { target_band_score: 7, test_date: '2026-09-10' };

    expect(
      getPlanRefreshTrigger({
        path,
        user,
        currentAvailability: availability,
        sessions: [
          {
            score: 6.5,
            is_completed: true,
            completed_at: '2026-07-23T08:00:00.000Z',
          },
        ],
      })
    ).toBeNull();

    expect(
      getPlanRefreshTrigger({
        path,
        user,
        currentAvailability: availability,
        sessions: [
          {
            score: 7,
            is_completed: true,
            completed_at: '2026-07-23T10:00:00.000Z',
          },
        ],
      })
    ).toBe('test_completed');
  });

  it('shows interactive evidence stages and a cost-safe update action', () => {
    expect(roadmap).toContain('InteractiveStageRail');
    // The connector line is driven by evidence, not decoration: its head sits in
    // segment space so a half-finished stage lands halfway between two nodes.
    expect(roadmap).toContain('getRailFill');
    expect(roadmap).toContain('railFill={railFill}');
    expect(roadmap).toContain('Open stage ${index + 1}');
    expect(roadmap).toContain("Planned: 'Planned'");
    expect(roadmap).not.toContain("Locked: 'Locked'");
    expect(roadmap).toContain('item.done');
    // The update-check control lives once, in the plan guide — not duplicated
    // in a page-level button row.
    expect(planSignals).toContain('Check for updates');
    expect(planSignals).toContain('No AI request when nothing changed');
    // The decorative hero illustration was removed: that column now carries the plan guide.
    expect(hero).not.toContain('/images/learning-path/ai-coach-study-hero.webp');
    expect(dashboard).toContain('items-stretch');
  });

  it('gives the page a title that matches every other feature page, and gives each action exactly one home', () => {
    // Same header shape as Vocabulary/Leaderboard/Dashboard: an accent pill, an
    // h1 at text-2xl/sm:text-3xl, one description line — floating on the page
    // background, not boxed inside a bordered card with its own icon and size.
    expect(hero).toContain(
      'text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl'
    );
    expect(hero).toContain('<Pill tone="accent">AI Learning Path</Pill>');
    // Starting the primary task, editing goals, and refreshing the plan each
    // appear in exactly one place: the hero no longer has its own "Edit plan"
    // or "Check updates" controls duplicating the plan guide's.
    expect(hero).not.toContain('Edit plan');
    expect(hero).not.toContain('Check for updates');
  });

  it('loads the path, activities, evidence, and proficiency through one combined RPC', () => {
    expect(hook).toContain("supabase.rpc('get_learning_path_data')");
    expect(hook).not.toContain("from('learning_path_activities')");
    expect(hook).not.toContain("from('skill_proficiency')");
  });

  it('uses a compatibility write when newer activity metadata has not been deployed yet', () => {
    expect(hook).toContain('upsertLearningPathActivity(supabase, payload)');
  });
});

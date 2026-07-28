import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildRoadmapViewModel,
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
const app = readFileSync(resolve(process.cwd(), 'src/App.jsx'), 'utf8');
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
    expect(planSignals).toContain('Why your plan changed');
    expect(planSignals).toContain('Next goal');
    expect(roadmap).toContain('Your path to exam day');
    expect(weekPlan).toContain("This week's plan");
    expect(priorities).toContain('What to improve next');
    expect(readiness).toContain('Recent practice scores');
    expect(weekPulse).toContain('Your week at a glance');
  });

  it('uses compact responsive layouts and redirects the retired preview route', () => {
    expect(dashboard).toContain('grid-cols-[minmax(0,1fr)]');
    expect(weekPlan).toContain('md:col-span-2');
    expect(weekPlan).toContain('grid-cols-[44px_minmax(0,1fr)]');
    expect(weekPlan).toContain('sm:grid-cols-[44px_minmax(0,1fr)_auto]');
    expect(roadmap).toContain('auto-cols-[88%]');
    expect(roadmap).toContain('sm:grid-cols-2');
    expect(roadmap).toContain('lg:grid-cols-4');
    expect(hero).toContain('grid-cols-2');
    expect(hero).toContain('sm:grid-cols-4');
    expect(readiness).toContain('grid-cols-2');
    expect(readiness).toContain('sm:grid-cols-4');
    expect(app).toContain("path: '/learning-path-preview'");
    expect(app).toContain('<Navigate to="/learning-path" replace />');
    expect(app).not.toContain('LearningPathPreview');
  });

  it('keeps legacy status contextual and collapses the seven-day schedule by default', () => {
    expect(dashboard).not.toContain('This historical plan remains available');
    expect(hero).toContain('Update your plan');
    expect(weekPlan).toContain('days.slice(0, 4)');
    expect(weekPlan).toContain('Show all 7 days');
    expect(weekPlan).toContain('Move to an available day');
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
      'Locked',
      'Locked',
    ]);
  });

  it('makes the exam-date tile and missing-score prompt actionable', () => {
    expect(hero).toContain('label="Exam date"');
    expect(hero).toContain('onClick={() => setCustomizeOpen(true)}');
    expect(readiness).toContain('Start score check');
    expect(weekPulse).toContain('Fix schedule');
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
            { activity_type: 'timed_assessment', title: 'Reading timed check', is_completed: true },
          ],
        },
      ],
      targetBand: 7,
    });

    expect(phases.map((phase) => phase.progressPercent)).toEqual([25, 50, 50, 25]);
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

  it('shows real roadmap locks and a cost-safe update action', () => {
    expect(roadmap).toContain("Locked: 'Locked'");
    expect(roadmap).toContain('item.done');
    expect(hero).toContain('Check for updates');
    expect(hero).toContain('No AI request when nothing changed');
    expect(hero).toContain('/images/learning-path/ai-coach-study-hero.webp');
    expect(dashboard).toContain('items-stretch');
  });

  it('retries the activity query when scheduled_date is not deployed yet', () => {
    expect(hook).toContain("/scheduled_date/i.test(activitiesError.message || '')");
    expect(hook).toContain('V1 column set');
  });
});

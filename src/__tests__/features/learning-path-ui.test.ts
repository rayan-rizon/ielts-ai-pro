import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildFallbackTask,
  buildRoadmapViewModel,
  computeDashboardSnapshot,
  computePhases,
  computePlanDays,
  dateKey,
  getFriendlyPlanText,
  getFriendlyTaskTitle,
  getPathProgress,
  getPlanRefreshTrigger,
} from '@/features/learning/components/dashboard/dashboardUtils';

const page = readFileSync(
  resolve(process.cwd(), 'src/features/learning/pages/LearningPath.jsx'),
  'utf8'
);
const read = (relativePath: string) =>
  readFileSync(
    resolve(process.cwd(), 'src/features/learning/components/dashboard', relativePath),
    'utf8'
  );
const dashboard = read('StudyPlanDashboard.jsx');
const calendar = read('PlanCalendar.jsx');
const taskPanel = read('TaskPanel.jsx');
const evidenceCards = read('EvidenceCards.jsx');
const practiceCards = read('PracticeCards.jsx');
const primitives = readFileSync(
  resolve(process.cwd(), 'src/features/dashboard/components/primitives.jsx'),
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

  it('is called Study plan, and never turns finished tasks into a predicted score', () => {
    expect(page).toContain('title="Study plan | IELTS Ai Pro"');
    expect(dashboard).toContain('Study plan');
    expect(dashboard).not.toContain('AI Learning Path');
    expect(dashboard).toContain('never turned into a predicted IELTS score');
    expect(dashboard).not.toContain('potential gain');
    expect(dashboard).not.toContain('required hours');
  });

  it('puts the calendar and the selected session first, with the evidence cards below', () => {
    expect(dashboard.indexOf('<PlanCalendar')).toBeLessThan(dashboard.indexOf('<ConsistencyCard'));
    expect(dashboard).toContain('<TaskPanel');
    expect(dashboard).toContain('lg:grid-cols-[minmax(0,1fr)_340px]');
    expect(dashboard.indexOf('<FocusSkillsCard')).toBeGreaterThan(dashboard.indexOf('<TaskPanel'));
    expect(dashboard).toContain('onStart={startTask}');
    expect(calendar).toContain('md:grid-cols-7');
    expect(practiceCards).toContain('Recent practice');
  });

  it('keeps the retired preview route redirecting to the study plan', () => {
    expect(layout).toContain(
      'flex h-12 shrink-0 items-center gap-1 border-b border-[#e4e2f0] bg-white px-1.5 dark:border-white/[0.07] dark:bg-[#100f15] md:hidden'
    );
    expect(app).toContain("path: '/learning-path-preview'");
    expect(app).toContain('<Navigate to="/learning-path" replace />');
    expect(app).not.toContain('LearningPathPreview');
    expect(primitives).toContain('export const StatRail');
  });

  it('lets a learner move a session only when the plan allows it, and never fakes a verified completion', () => {
    expect(calendar).toContain('draggable={canReschedule');
    expect(taskPanel).toContain("task.completion_policy === 'verified'");
    expect(taskPanel).toContain('Move to');
  });

  it('uses clear activity names without changing persisted task data', () => {
    expect(
      getFriendlyTaskTitle({
        title: 'Listening Drill: MultipleChoice',
        module: 'listening',
        activity_type: 'targeted_drill',
        skill_code: 'listening_multiple_choice',
      })
    ).toBe('Listening: Multiple choice practice');
    expect(
      getFriendlyTaskTitle({
        title: 'Listening gap fill repair',
        module: 'listening',
        activity_type: 'targeted_repair',
      })
    ).toBe('Listening: Gap fill practice');
    expect(
      getFriendlyTaskTitle({
        title: 'Writing diagnostic',
        module: 'writing',
        activity_type: 'diagnostic',
      })
    ).toBe('Writing Task 1 Practice Mode');
    expect(
      getFriendlyTaskTitle({
        title: 'Writing practice',
        module: 'writing',
        activity_type: 'targeted_drill',
        skill_targets: ['writing_taskachievement'],
        routing: { writing_task: 'Task 2' },
      })
    ).toBe('Writing Task 1 Practice Mode');
    expect(
      getFriendlyTaskTitle({
        title: 'Writing Exam Mode check',
        module: 'writing',
        activity_type: 'exam_assessment',
        requested_mode: 'exam',
      })
    ).toBe('Writing Exam Mode');
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

  it('formats local schedule dates for rescheduling controls', () => {
    expect(dateKey(new Date('2026-07-23T12:00:00'))).toBe('2026-07-23');
    expect(dateKey('not-a-date')).toBe('');
  });

  // The seven-day view starts from today in the study timezone (UTC unless
  // set), not the machine's local date. Pin the clock and use the pinned UTC
  // date so these tests pass at any hour in any timezone.
  const PINNED_STUDY_DATE = '2026-07-23';
  const pinClockToNoonUtc = () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${PINNED_STUDY_DATE}T12:00:00Z`));
    return new Date(`${PINNED_STUDY_DATE}T12:00:00`);
  };
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps saved task completion and scheduled dates in the seven-day view', () => {
    const current = pinClockToNoonUtc();
    const today = dateKey(current);
    const dayName = current.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const activityKey = `plan:${today}:primary`;

    const days = computePlanDays(
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
    const current = pinClockToNoonUtc();
    const dayName = current.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const days = computePlanDays({
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

  it('scores every stage as a count against a fixed, durable denominator', () => {
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
          reading: {
            sufficient: true,
            sample_count: 2,
            median: 6.5,
            mode_counts: { practice: 1, timed: 1, exam: 0 },
          },
          writing: { sufficient: false, sample_count: 1, mode_counts: {} },
          listening: { sufficient: false, sample_count: 0, mode_counts: {} },
          speaking: { sufficient: false, sample_count: 0, mode_counts: {} },
        },
        missing_diagnostics: ['writing', 'listening', 'speaking'],
        overall: { available: false },
      },
      evidence: {
        measured_priorities: [{ skill_code: 'reading_inference', mastery: 0.3, observations: 10 }],
        maintenance: [{ skill_code: 'reading_matching', mastery: 0.9, observations: 40 }],
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

    // Foundation counts scored attempts, not finished modules: 2 + 1 of 8.
    expect(phases[0].progressPercent).toBe(38);
    expect(phases[0].progressLabel).toBe('3 of 8 scored checks recorded');
    expect(phases[0].progressRule).toContain('Each scored test adds 13%');
    expect(phases[0].actionTask?.title).toBe('Writing diagnostic');

    // Repair averages every measured skill against the 75% bar, so a repaired
    // skill can never be displaced by the next-weakest one.
    expect(phases[1].progressPercent).toBe(70);
    expect(phases[1].progressLabel).toBe(
      '2 measured skills are 70% of the way to 75% · 1 repaired'
    );

    // Timed progress comes from the scored record (one timed attempt of two),
    // never from a task ticked off in a schedule that is rebuilt every refresh.
    expect(phases[2].progressPercent).toBe(50);
    expect(phases[2].progressLabel).toBe('1 of 2 timed attempts completed');

    // No Exam Mode attempt anywhere, so no exam-readiness credit.
    expect(phases[3].progressPercent).toBe(0);
  });

  it('gives half credit for an Exam Mode attempt and the rest for hitting target', () => {
    const modules = {
      reading: { sample_count: 2, median: 7, mode_counts: { exam: 1 }, latest_exam_score: 7 },
      writing: { sample_count: 2, median: 6, mode_counts: { exam: 1 }, latest_exam_score: 6 },
      listening: { sample_count: 2, median: 6, mode_counts: { exam: 0 } },
      speaking: { sample_count: 2, median: 6, mode_counts: { exam: 0 } },
    };
    const [, , , readinessPhase] = buildRoadmapViewModel({
      roadmap: [],
      readiness: { modules, missing_diagnostics: [], overall: { available: true } },
      evidence: {},
      days: [],
      targetBand: 7,
    });

    // Reading is at target (full credit) and writing was attempted (half): 1.5/4.
    expect(readinessPhase.progressPercent).toBe(38);
    expect(readinessPhase.progressLabel).toBe('1 of 4 Exam Mode scores at band 7.0');
  });

  it('reports one journey number for the rail and the readout', () => {
    const progress = getPathProgress([
      { progressPercent: 100 },
      { progressPercent: 50 },
      { progressPercent: 0 },
      { progressPercent: 0 },
    ]);

    expect(progress.overallPercent).toBe(38);
    expect(progress.stagesDone).toBe(1);
    expect(progress.currentIndex).toBe(1);
    expect(progress.totalStages).toBe(4);
  });

  it('offers real work when the schedule has nothing left, instead of an empty page', () => {
    const missingScore = buildFallbackTask({
      readiness: { missing_diagnostics: ['listening'], modules: {} },
      evidence: {},
      targetBand: 7,
    });
    expect(missingScore?.module).toBe('listening');
    expect(missingScore?.activity_type).toBe('diagnostic');
    expect(missingScore?.is_synthetic).toBe(true);
    // Synthetic tasks are routing hints only — they are never persisted.
    expect(missingScore?.activity_key).toBeUndefined();

    const focusSkill = buildFallbackTask({
      readiness: { missing_diagnostics: [], modules: {} },
      evidence: {
        measured_priorities: [
          { skill_code: 'reading_inference', module: 'reading', mastery: 0.4, observations: 30 },
        ],
      },
      targetBand: 7,
    });
    expect(focusSkill?.module).toBe('reading');
    expect(focusSkill?.skill_targets).toEqual(['reading_inference']);
  });

  it('keeps the learning path query fresh enough to show progress from a new score', () => {
    expect(hook).toContain("refetchOnMount: 'always'");
    expect(hook).toContain('refetchOnWindowFocus: true');
  });

  it('makes each ranked focus skill startable', () => {
    expect(evidenceCards).toContain("activity_type: 'targeted_drill'");
    expect(dashboard).toContain('<FocusSkillsCard evidence={evidence} onStart={startTask} />');
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
      generator_version: '2.5.1',
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
        now: new Date('2026-07-23T12:00:00Z'),
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
        path: { ...path, generator_version: '2.4.1' },
        user,
        currentAvailability: availability,
        now: new Date('2026-07-23T12:00:00Z'),
        sessions: [],
      })
    ).toBe('generator_updated');

    expect(
      getPlanRefreshTrigger({
        path,
        user,
        currentAvailability: availability,
        now: new Date('2026-07-23T12:00:00Z'),
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

  it('shows one journey number and a cost-safe update action', () => {
    expect(evidenceCards).toContain('pathProgress?.overallPercent');
    expect(evidenceCards).toContain('They can clear in any order.');
    expect(dashboard).toContain('Check for updates');
    expect(dashboard.match(/Check for updates/g)).toHaveLength(1);
    expect(dashboard.match(/Edit plan/g)).toHaveLength(1);
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

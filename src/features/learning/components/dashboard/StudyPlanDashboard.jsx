import React, { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MUTED, Pill } from '@/features/dashboard/components/primitives';
import CustomizeGoalsModal from './CustomizeGoalsModal';
import FirstTestPanel from './FirstTestPanel';
import PlanAlert from './PlanAlert';
import PlanCalendar from './PlanCalendar';
import PlanPracticeCard from './PlanPracticeCard';
import PlanStats from './PlanStats';
import { ConsistencyCard, StudyTimeCard } from './PracticeCards';
import { FocusSkillsCard, PathCard, ScoresCard } from './EvidenceCards';
import TaskPanel from './TaskPanel';
import { buildPracticeHistory, getPlanAttention, summarizeWeek, taskKey } from './studyPlanModel';
import { useLearningPathDashboard } from './useLearningPathDashboard';

const SKELETON_BLOCK =
  'animate-pulse rounded-xl border border-[#e4e2f0] bg-[#f4f3fb] motion-reduce:animate-none dark:border-white/[0.07] dark:bg-white/4';

/** The plan's numbers, then anything the learner added from a Writing report. */
function StatsAndPractice(props) {
  return (
    <>
      <PlanStats {...props} />
      <PlanPracticeCard />
    </>
  );
}

/** Mirrors the real layout so nothing reflows when the plan arrives. */
function StudyPlanLoadingView() {
  return (
    <div className="space-y-3" aria-label="Loading study plan">
      <div className={`h-[92px] ${SKELETON_BLOCK}`} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          <div className={`h-[340px] ${SKELETON_BLOCK}`} />
          <div className="grid gap-3 md:grid-cols-2">
            <div className={`h-[300px] md:col-span-2 ${SKELETON_BLOCK}`} />
            {[0, 1].map((index) => (
              <div key={index} className={`h-[220px] ${SKELETON_BLOCK}`} />
            ))}
          </div>
        </div>
        <div className={`h-[460px] ${SKELETON_BLOCK}`} />
      </div>
    </div>
  );
}

function PageHeader({ refreshing, planUpdateAvailable, onRefresh, onCustomize }) {
  const button =
    'inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#e4e2f0] bg-white px-2.5 text-[11px] font-bold text-slate-600 transition-all duration-150 ease-smooth-out hover:border-[#5a63df]/35 hover:text-[#5a63df] hover:-translate-y-0.5 hover:shadow-xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/50 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-[#b8bdff]';
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          Study plan
        </h1>
        <p className={cn('mt-1 max-w-2xl text-xs font-medium', MUTED)}>
          Built from your recent scores, target band, exam date, and free time.
        </p>
      </div>
      <div className="flex items-center gap-2">
        {planUpdateAvailable && <Pill tone="accent">New results to apply</Pill>}
        <button type="button" className={button} onClick={onRefresh} disabled={refreshing}>
          <RefreshCw
            className={cn('h-3 w-3', refreshing && 'animate-spin motion-reduce:animate-none')}
            aria-hidden="true"
          />
          {refreshing ? 'Checking…' : 'Check for updates'}
        </button>
        <button type="button" className={button} onClick={onCustomize}>
          Edit plan
        </button>
      </div>
    </header>
  );
}

function StudyPlanView({ dashboard, history, stats, todayKey }) {
  const [dismissed, setDismissed] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const {
    customizeOpen,
    setCustomizeOpen,
    savingGoals,
    refreshing,
    planUpdateAvailable,
    goalDraft,
    setGoalDraft,
    user,
    path,
    evidence,
    readiness,
    targetBand,
    examDate,
    daysLeft,
    examDatePassed,
    weeklyCapacity,
    availability,
    planDays,
    sevenDays,
    phases,
    pathProgress,
    primaryTask,
    startTask,
    toggleTask,
    rescheduleTask,
    refreshPlan,
    saveGoals,
  } = dashboard;

  const { selectedTask, selectedDay, plannedMinutes, doneMinutes } = summarizeWeek({
    days: sevenDays,
    selectableDays: planDays,
    primaryTask,
    selectedKey,
  });
  const canReschedule = path?.version === 2;
  const missedDays = history.historyDays.filter((day) => day.status === 'missed').length;
  const attention = dismissed
    ? null
    : getPlanAttention({ daysSincePractice: history.daysSincePractice, missedDays });
  const openCustomize = () => setCustomizeOpen(true);

  return (
    <div className="space-y-3">
      <PageHeader
        refreshing={refreshing}
        planUpdateAvailable={planUpdateAvailable}
        onRefresh={refreshPlan}
        onCustomize={openCustomize}
      />

      <PlanAlert
        attention={attention}
        daysSincePractice={history.daysSincePractice}
        missedDays={missedDays}
        nextTask={primaryTask}
        onStart={startTask}
        onCustomize={openCustomize}
        onDismiss={() => setDismissed(true)}
      />

      <StatsAndPractice
        targetBand={targetBand}
        overallRange={readiness?.overall?.available ? readiness.overall.range : null}
        examDate={examDate}
        examDatePassed={examDatePassed}
        daysLeft={daysLeft}
        plannedMinutes={plannedMinutes}
        doneMinutes={doneMinutes}
        streak={history.streak}
        recentDays={history.recentDays}
        daysSincePractice={history.daysSincePractice}
        onCustomize={openCustomize}
      />

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-3 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_1fr]">
        <div className="order-1 min-w-0 lg:col-start-2 lg:row-start-1">
          <TaskPanel
            task={selectedTask}
            day={selectedDay}
            days={planDays}
            todayKey={todayKey}
            availability={availability}
            canReschedule={canReschedule}
            onStart={startTask}
            onToggle={toggleTask}
            onReschedule={rescheduleTask}
          />
        </div>

        <div className="order-2 flex min-w-0 flex-col gap-3 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-stretch">
          <PlanCalendar
            days={planDays}
            historyDays={history.historyDays}
            todayKey={todayKey}
            selectedKey={taskKey(selectedTask)}
            canReschedule={canReschedule}
            onSelect={(task) => setSelectedKey(taskKey(task))}
            onReschedule={rescheduleTask}
          />

          <div className="grid min-w-0 gap-3 md:grid-cols-2 md:grid-rows-2">
            <div className="min-w-0 md:row-span-2 [&>section]:h-full">
              <PathCard
                phases={phases}
                pathProgress={pathProgress}
                daysLeft={daysLeft}
                examDatePassed={examDatePassed}
                weeklyCapacity={weeklyCapacity}
                days={sevenDays}
                readiness={readiness}
                targetBand={targetBand}
              />
            </div>
            <ConsistencyCard
              heatmap={history.heatmap}
              streak={history.streak}
              daysSincePractice={history.daysSincePractice}
            />
            <StudyTimeCard weeks={history.weeks} weeklyCapacity={weeklyCapacity} />
          </div>

          <div className="min-w-0 flex-1 [&>section]:h-full">
            <ScoresCard
              readiness={readiness}
              targetBand={targetBand}
              moduleTrends={stats?.moduleTrends}
            />
          </div>
        </div>

        <div className="order-3 flex min-w-0 flex-col gap-3 lg:col-start-2 lg:row-start-2 lg:self-stretch">
          <div className="min-w-0 flex-1 [&>section]:h-full">
            <FocusSkillsCard evidence={evidence} onStart={startTask} />
          </div>
        </div>
      </div>

      <p className={cn('px-1 text-[11px] leading-relaxed', MUTED)}>
        Finished tasks are never turned into a predicted IELTS score.
      </p>

      <CustomizeGoalsModal
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        goalDraft={goalDraft}
        setGoalDraft={setGoalDraft}
        savingGoals={savingGoals}
        onSaveGoals={saveGoals}
        user={user}
      />
    </div>
  );
}

export default function StudyPlanDashboard(props) {
  const { isLoading, stats, activityByKey } = props;
  const dashboard = useLearningPathDashboard(props);
  const sessions = useMemo(() => stats?.sessions || [], [stats?.sessions]);
  const { sevenDays, availability } = dashboard;
  const timezone = availability?.timezone || 'UTC';
  const todayKey = sevenDays[0]?.dateKey;

  const history = useMemo(
    () =>
      todayKey
        ? buildPracticeHistory({ sessions, activityByKey, timezone, availability, todayKey })
        : null,
    [sessions, activityByKey, timezone, availability, todayKey]
  );

  if (isLoading) return <StudyPlanLoadingView />;
  if (!dashboard.hasTestEvidence && !props.previewMode) {
    return (
      <div className="space-y-3">
        <PlanPracticeCard />
        <FirstTestPanel
          navigate={props.navigate}
          hasPreviousTests={stats?.totalTests > 0}
          awaitingScore={sessions.some((session) =>
            ['pending', 'processing'].includes(session.evaluation_status)
          )}
        />
      </div>
    );
  }

  return (
    <StudyPlanView
      dashboard={{ ...dashboard, user: props.user }}
      history={history}
      stats={stats}
      todayKey={todayKey}
    />
  );
}

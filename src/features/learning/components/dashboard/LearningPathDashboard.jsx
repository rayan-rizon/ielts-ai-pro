import React from 'react';
import HeroSection from './HeroSection';
import RoadmapSection from './RoadmapSection';
import WeekPlan from './WeekPlan';
import PrioritiesPanel from './PrioritiesPanel';
import ReadinessPanel from './ReadinessPanel';
import WeekPulse from './WeekPulse';
import ExamCountdownPanel from './ExamCountdownPanel';
import CustomizeGoalsModal from './CustomizeGoalsModal';
import FirstTestPanel from './FirstTestPanel';
import { useLearningPathDashboard } from './useLearningPathDashboard';

const SKELETON_BLOCK =
  'animate-pulse rounded-xl border border-[#e4e2f0] bg-[#f1f0fa] motion-reduce:animate-none dark:border-white/[0.07] dark:bg-white/4';

/** Mirrors the real layout 1:1 so nothing reflows when the plan arrives. */
function LearningPathLoadingView() {
  return (
    <div className="space-y-3" aria-label="Loading learning path">
      <div className={`h-[300px] ${SKELETON_BLOCK}`} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 xl:grid-cols-[1.75fr_1fr]">
        <div className={`h-[560px] ${SKELETON_BLOCK}`} />
        <div className={`h-[560px] ${SKELETON_BLOCK}`} />
      </div>
      <div className={`h-[420px] ${SKELETON_BLOCK}`} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 2xl:grid-cols-[1fr_1.35fr_1fr]">
        <div className={`h-[400px] ${SKELETON_BLOCK}`} />
        <div className={`h-[400px] ${SKELETON_BLOCK}`} />
        <div className={`h-[400px] md:col-span-2 2xl:col-span-1 ${SKELETON_BLOCK}`} />
      </div>
    </div>
  );
}

export default function LearningPathDashboard(props) {
  const { isLoading, user } = props;
  const dashboard = useLearningPathDashboard(props);

  if (isLoading) return <LearningPathLoadingView />;
  if (!dashboard.hasTestEvidence && !props.previewMode) {
    return (
      <FirstTestPanel
        navigate={props.navigate}
        hasPreviousTests={props.stats?.totalTests > 0}
        awaitingScore={(props.stats?.sessions || []).some((session) =>
          ['pending', 'processing'].includes(session.evaluation_status)
        )}
      />
    );
  }

  const {
    customizeOpen,
    setCustomizeOpen,
    savingGoals,
    refreshing,
    planUpdateAvailable,
    expandedTask,
    setExpandedTask,
    goalDraft,
    setGoalDraft,
    path,
    evidence,
    readiness,
    roadmap,
    targetBand,
    examDate,
    daysLeft,
    examDatePassed,
    weeklyCapacity,
    sevenDays,
    today,
    phases,
    pathProgress,
    primaryTask,
    isFallbackTask,
    todayIsRestDay,
    primaryTaskIsToday,
    primaryTaskDayLabel,
    nextTasks,
    startTask,
    toggleTask,
    rescheduleTask,
    refreshPlan,
    saveGoals,
    isLegacyPlan,
  } = dashboard;

  // No page-level entrance animation here: Layout already runs `animate-panel-in`
  // on every route swap, and stacking a framer stagger on top of it left the hero
  // sitting at opacity 0 for the first beat — it read as an empty panel.
  return (
    <div className="space-y-3">
      {/* 1 — What do I do right now, why, and how far along am I. */}
      <HeroSection
        isLegacyPlan={isLegacyPlan}
        primaryTask={primaryTask}
        isFallbackTask={isFallbackTask}
        todayIsRestDay={todayIsRestDay}
        primaryTaskIsToday={primaryTaskIsToday}
        primaryTaskDayLabel={primaryTaskDayLabel}
        today={today}
        path={path}
        targetBand={targetBand}
        examDate={examDate}
        examDatePassed={examDatePassed}
        daysLeft={daysLeft}
        readiness={readiness}
        weeklyCapacity={weeklyCapacity}
        pathProgress={pathProgress}
        refreshing={refreshing}
        planUpdateAvailable={planUpdateAvailable}
        refreshPlan={refreshPlan}
        setCustomizeOpen={setCustomizeOpen}
        startTask={startTask}
        evidence={evidence}
        nextTasks={nextTasks}
      />

      {/* 2 — The week itself. This is the page's working surface: the thing a
          learner opens the page to act on, so it gets the widest column on the
          page rather than a third of one row lower down. */}
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-stretch gap-3 xl:grid-cols-[1.75fr_1fr]">
        <WeekPlan
          days={sevenDays}
          canReschedule={path?.version === 2}
          expandedTask={expandedTask}
          setExpandedTask={setExpandedTask}
          onToggle={toggleTask}
          onStart={startTask}
          onReschedule={rescheduleTask}
          onCustomize={() => setCustomizeOpen(true)}
        />

        <WeekPulse
          days={sevenDays}
          weeklyCapacity={weeklyCapacity}
          onCustomize={() => setCustomizeOpen(true)}
          onStart={startTask}
        />
      </div>

      {/* 3 — Where am I on the whole journey. */}
      <RoadmapSection
        phases={phases}
        roadmap={roadmap}
        isLegacyPlan={isLegacyPlan}
        readiness={readiness}
        evidence={evidence}
        days={sevenDays}
        targetBand={targetBand}
        examDatePassed={examDatePassed}
        onStart={startTask}
      />

      {/* 4 — The evidence behind all of the above: what to fix, where I stand,
          and how much time is left to close the gap. */}
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-stretch gap-3 md:grid-cols-2 2xl:grid-cols-[1fr_1.35fr_1fr]">
        <PrioritiesPanel evidence={evidence} onStart={startTask} />

        <ReadinessPanel
          readiness={readiness}
          days={sevenDays}
          targetBand={targetBand}
          onStart={startTask}
        />

        <ExamCountdownPanel
          examDate={examDate}
          examDatePassed={examDatePassed}
          daysLeft={daysLeft}
          weeklyCapacity={weeklyCapacity}
          targetBand={targetBand}
          readiness={readiness}
          days={sevenDays}
          onCustomize={() => setCustomizeOpen(true)}
          onStart={startTask}
          className="md:col-span-2 2xl:col-span-1"
        />
      </div>

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

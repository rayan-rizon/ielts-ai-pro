import React from 'react';
import HeroSection from './HeroSection';
import RoadmapSection from './RoadmapSection';
import WeekPlan from './WeekPlan';
import PrioritiesPanel from './PrioritiesPanel';
import ReadinessPanel from './ReadinessPanel';
import WeekPulse from './WeekPulse';
import PlanSignalsCard from './PlanSignalsCard';
import CoachBanner from './CoachBanner';
import CustomizeGoalsModal from './CustomizeGoalsModal';
import { useLearningPathDashboard } from './useLearningPathDashboard';

function LearningPathLoadingView() {
  return (
    <div className="space-y-5" aria-label="Loading learning path">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[360px] animate-pulse rounded-3xl bg-slate-200/70 motion-reduce:animate-none dark:bg-white/5" />
        <div className="h-[360px] animate-pulse rounded-3xl bg-slate-200/70 motion-reduce:animate-none dark:bg-white/5" />
      </div>
      <div className="h-56 animate-pulse rounded-3xl bg-slate-200/70 motion-reduce:animate-none dark:bg-white/5" />
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-96 animate-pulse rounded-3xl bg-slate-200/70 motion-reduce:animate-none dark:bg-white/5"
          />
        ))}
      </div>
    </div>
  );
}

export default function LearningPathDashboard(props) {
  const { isLoading, user } = props;
  const dashboard = useLearningPathDashboard(props);

  if (isLoading) return <LearningPathLoadingView />;

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
    primaryTask,
    nextTasks,
    startTask,
    toggleTask,
    rescheduleTask,
    refreshPlan,
    saveGoals,
    isLegacyPlan,
  } = dashboard;

  return (
    <div className="space-y-6 font-sans">
      <HeroSection
        isLegacyPlan={isLegacyPlan}
        primaryTask={primaryTask}
        today={today}
        path={path}
        targetBand={targetBand}
        examDate={examDate}
        examDatePassed={examDatePassed}
        daysLeft={daysLeft}
        readiness={readiness}
        weeklyCapacity={weeklyCapacity}
        refreshing={refreshing}
        planUpdateAvailable={planUpdateAvailable}
        refreshPlan={refreshPlan}
        setCustomizeOpen={setCustomizeOpen}
        startTask={startTask}
        evidence={evidence}
        nextTasks={nextTasks}
      />

      <RoadmapSection
        roadmap={roadmap}
        isLegacyPlan={isLegacyPlan}
        readiness={readiness}
        evidence={evidence}
        days={sevenDays}
        targetBand={targetBand}
        onStart={startTask}
      />

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-stretch gap-5 md:grid-cols-2 lg:grid-cols-[1.08fr_1fr_0.86fr]">
        <WeekPlan
          days={sevenDays}
          canReschedule={path?.version === 2}
          expandedTask={expandedTask}
          setExpandedTask={setExpandedTask}
          onToggle={toggleTask}
          onStart={startTask}
          onReschedule={rescheduleTask}
        />

        <PrioritiesPanel evidence={evidence} />

        <WeekPulse
          days={sevenDays}
          weeklyCapacity={weeklyCapacity}
          onCustomize={() => setCustomizeOpen(true)}
        />
      </div>

      <ReadinessPanel readiness={readiness} days={sevenDays} onStart={startTask} />

      <PlanSignalsCard
        trigger={path?.generation_trigger}
        changeReason={path?.why_plan_changed}
        checkpoint={path?.next_checkpoint}
        readiness={readiness}
      />

      <CoachBanner
        isLegacyPlan={isLegacyPlan}
        summary={path?.coach_summary?.explanation || path?.coach_summary}
        refreshing={refreshing}
        onRefresh={refreshPlan}
        onCustomize={() => setCustomizeOpen(true)}
      />

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

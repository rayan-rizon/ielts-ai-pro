import React from 'react';
import { ArrowUpRight, Clock, RefreshCw, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { GlassCard, ModuleBadge } from '@/features/learning/components/SharedComponents';
import {
  formatTaskTitle,
  formatModuleName,
  getModuleRoute,
  toTaskObject,
} from '@/features/learning/utils/learningUtils';

function CoachBriefSkeleton() {
  return (
    <GlassCard className="p-5 sm:p-6 lg:p-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-56 rounded-full" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </GlassCard>
  );
}

function CoachBriefHeader({ module, focusTitle, focusReason }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5 mb-3">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/5 dark:bg-white/5 border border-slate-950/10 dark:border-white/10 text-[10px] font-black uppercase tracking-[0.16em] text-slate-800 dark:text-slate-200">
          <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400 animate-pulse" />
          Today&apos;s Coach Brief
        </div>
        {module && <ModuleBadge module={module} />}
      </div>

      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.1] max-w-3xl">
        {focusTitle}
      </h2>

      <p className="mt-2.5 text-sm sm:text-base font-semibold leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl">
        {focusReason}
      </p>
    </div>
  );
}

function CoachBriefActions({
  route,
  module,
  timerState,
  onStartTopTask,
  onSelectToday,
  onTimerToggle,
  onRefresh,
}) {
  return (
    <div>
      <div className="mt-4 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 xl:max-w-[620px]">
        <Button
          onClick={onStartTopTask}
          className="group min-h-12 h-auto w-full min-w-0 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black leading-tight text-white shadow-xl shadow-slate-950/10 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:text-[15px] whitespace-normal transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-purple-500/10 hover:bg-gradient-to-r hover:from-violet-600 hover:to-pink-500 dark:hover:from-violet-400 dark:hover:to-pink-400 dark:hover:text-white"
        >
          <span className="min-w-0">
            {route ? `Start ${formatModuleName(module)} Practice` : 'Open Today’s Plan'}
          </span>
          <ArrowUpRight className="w-4 h-4 ml-2 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Button>
        <Button
          variant="outline"
          onClick={onSelectToday}
          className="min-h-12 h-auto w-full min-w-0 rounded-2xl border-slate-200 bg-white/80 px-5 py-3.5 text-sm font-black leading-tight dark:border-slate-700/80 dark:bg-slate-900/80 sm:text-[15px] whitespace-normal transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          View Today’s Steps
        </Button>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={onTimerToggle}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 px-3.5 py-2 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-200 dark:hover:border-purple-500/30 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all duration-300 shadow-sm"
        >
          <Clock className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          {timerState.running ? 'Pause focus timer' : 'Start 25-min focus'}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 px-3.5 py-2 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-200 dark:hover:border-purple-500/30 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all duration-300 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
          Refresh reason
        </button>
      </div>
    </div>
  );
}

function CoachBriefWidgets({
  weeklyLabel,
  completionPercent,
  dueReviewCount,
  examLabel,
  targetBand,
}) {
  return (
    <div className="grid grid-cols-3 lg:grid-cols-1 gap-2.5">
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/60 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-900/20 p-3 shadow-md dark:shadow-slate-950/40 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          <span>Week</span>
        </div>
        <div className="text-sm font-black text-slate-900 dark:text-white leading-none">
          {weeklyLabel}
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-850 overflow-hidden mt-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
            style={{ width: `${Math.min(100, Math.max(0, completionPercent))}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-900/20 p-3 shadow-md dark:shadow-slate-950/40 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Reviews
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
            Protect gains
          </div>
        </div>
        <div
          className={cn(
            'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
            dueReviewCount
              ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20'
          )}
        >
          {dueReviewCount ? `${dueReviewCount} due` : 'Clear'}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-900/20 p-3 shadow-md dark:shadow-slate-950/40 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Target
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
            {examLabel}
          </div>
        </div>
        <div className="text-xs font-black text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
          Band {Number(targetBand).toFixed(1)}
        </div>
      </div>
    </div>
  );
}

function SecondaryTasksWidget({ secondaryTasks, onSelectToday }) {
  if (!secondaryTasks?.length) return null;
  return (
    <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 mb-2 flex items-center gap-1.5">
        <Target className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
        After the main task
      </div>
      <div className="space-y-2">
        {secondaryTasks.map((task, index) => (
          <button
            key={`${task.title}-${index}`}
            type="button"
            onClick={onSelectToday}
            className="group relative w-full text-left rounded-2xl border border-slate-200/60 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-900/20 p-2.5 shadow-md dark:shadow-slate-950/40 hover:border-violet-300 dark:hover:border-violet-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">
                Step {index + 2}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-violet-500 dark:text-violet-400 transition-all duration-300 transform translate-x-1 -translate-y-1" />
            </div>
            <div className="mt-1 text-xs font-bold leading-snug text-slate-800 dark:text-slate-200 line-clamp-2">
              {formatTaskTitle(task.title)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function getBriefTitle(topTask, hasHistory) {
  return (
    formatTaskTitle(topTask.title) ||
    (hasHistory ? 'Complete one focused practice block' : 'Start with a diagnostic test')
  );
}

function getBriefReason(dailyFocus, hasHistory) {
  return (
    formatTaskTitle(dailyFocus?.ai_reason) ||
    (hasHistory
      ? 'Your plan is prioritizing the activity most likely to move your next score.'
      : 'Take one baseline test so the AI can build a useful plan from real performance.')
  );
}

function getWeeklyLabel(totalActivities, completedCount) {
  return totalActivities > 0 ? `${completedCount}/${totalActivities} complete` : 'No tasks yet';
}

function getExamLabel(daysLeft) {
  return daysLeft !== null ? `${daysLeft} days left` : 'Exam date not set';
}

function getTopTask(dailyFocus, todaysTasks) {
  if (dailyFocus?.task) return dailyFocus.task;
  const tasks = todaysTasks?.tasks;
  if (tasks && tasks.length > 0) return tasks[0];
  return null;
}

function getPrimaryModule(dailyFocus, topTask) {
  if (dailyFocus?.primary_module) return dailyFocus.primary_module;
  if (topTask?.module) return topTask.module;
  return 'general';
}

function getSecondaryTasks(todaysTasks) {
  const tasks = todaysTasks?.tasks;
  if (!tasks) return [];
  return tasks.slice(1, 3);
}

const CoachBrief = ({
  dailyFocus,
  loading,
  hasHistory,
  targetBand,
  daysLeft,
  completedCount,
  totalActivities,
  dueReviewCount,
  completionPercent,
  todaysTasks,
  timerState,
  onTimerToggle,
  onRefresh,
  onStartTopTask,
  onSelectToday,
}) => {
  const rawTopTask = getTopTask(dailyFocus, todaysTasks);
  const topTask = toTaskObject(rawTopTask);
  const module = getPrimaryModule(dailyFocus, topTask);
  const route = getModuleRoute(module);
  const focusTitle = getBriefTitle(topTask, hasHistory);
  const focusReason = getBriefReason(dailyFocus, hasHistory);
  const secondaryTasks = getSecondaryTasks(todaysTasks).map(toTaskObject);
  const weeklyLabel = getWeeklyLabel(totalActivities, completedCount);
  const examLabel = getExamLabel(daysLeft);

  if (loading) {
    return <CoachBriefSkeleton />;
  }

  return (
    <GlassCard className="relative p-4 sm:p-5 lg:p-6 bg-gradient-to-br from-white/95 to-slate-50/95 dark:from-slate-950/90 dark:to-slate-900/90 h-full">
      {/* Decorative Aura / Glows */}
      <div className="absolute -top-24 -left-20 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none dark:bg-violet-500/5" />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none dark:bg-pink-500/5" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(168,85,247,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,85,247,0.025)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

      <div className="relative z-10 grid gap-5 lg:gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 flex flex-col justify-between">
          <CoachBriefHeader module={module} focusTitle={focusTitle} focusReason={focusReason} />
          <CoachBriefActions
            route={route}
            module={module}
            timerState={timerState}
            onStartTopTask={onStartTopTask}
            onSelectToday={onSelectToday}
            onTimerToggle={onTimerToggle}
            onRefresh={onRefresh}
          />
        </div>

        <div className="lg:border-l lg:border-slate-200/80 lg:dark:border-slate-800 lg:pl-6 flex flex-col justify-between gap-4">
          <CoachBriefWidgets
            weeklyLabel={weeklyLabel}
            completionPercent={completionPercent}
            dueReviewCount={dueReviewCount}
            examLabel={examLabel}
            targetBand={targetBand}
          />
          <SecondaryTasksWidget secondaryTasks={secondaryTasks} onSelectToday={onSelectToday} />
        </div>
      </div>
    </GlassCard>
  );
};

export default CoachBrief;

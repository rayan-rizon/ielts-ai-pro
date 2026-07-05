import React, { useState, useMemo, useCallback } from 'react';
import { m } from 'framer-motion';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { generateAdaptiveLearningPath } from '@/utils/api';
import {
  Zap,
  RefreshCw,
  Target,
  Clock,
  CheckCircle2,
  Crown,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

import { useAuth } from '@/features/auth/context/AuthContext';
import useLearningPathData, {
  getTodayIndex,
  dayNames,
} from '@/features/learning/hooks/useLearningPathData';
import { getDaysLeft } from '@/features/learning/utils/learningUtils';
import DocumentHead from '@/components/shared/DocumentHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';

// Components
import BandGapBreakdown from '@/features/learning/components/dashboard/BandGapBreakdown';
import WeakSkillSpotlight from '@/features/learning/components/dashboard/WeakSkillSpotlight';
import RecommendedPractice from '@/features/learning/components/dashboard/RecommendedPractice';
import WeekSchedule from '@/features/learning/components/dashboard/WeekSchedule';
import ReviewQueue from '@/features/learning/components/dashboard/ReviewQueue';
import MistakeAnalysis from '@/features/learning/components/dashboard/MistakeAnalysis';
import ProgressForecast from '@/features/learning/components/ProgressForecast';
import { GlassCard, ModuleBadge } from '@/features/learning/components/SharedComponents';
import { formatTaskTitle, inferModuleFromTitle } from '@/features/learning/utils/learningUtils';

// --- Animation variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

function humanizeLabel(value) {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toTaskObject(task) {
  if (typeof task === 'string') {
    return {
      title: task,
      module: inferModuleFromTitle(task),
      estimated_time: 30,
    };
  }
  return task || { title: 'Focused practice', module: 'general', estimated_time: 25 };
}

function formatModuleName(module) {
  const value = String(module || 'general');
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getModuleRoute(module) {
  const value = String(module || '').toLowerCase();
  if (!value || value === 'general') return null;
  return createPageUrl(formatModuleName(value));
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
  const topTask = toTaskObject(dailyFocus?.task || todaysTasks?.tasks?.[0]);
  const module = dailyFocus?.primary_module || topTask.module || 'general';
  const route = getModuleRoute(module);
  const focusTitle =
    formatTaskTitle(topTask.title) ||
    (hasHistory ? 'Complete one focused practice block' : 'Start with a diagnostic test');
  const focusReason =
    formatTaskTitle(dailyFocus?.ai_reason) ||
    (hasHistory
      ? 'Your plan is prioritizing the activity most likely to move your next score.'
      : 'Take one baseline test so the AI can build a useful plan from real performance.');
  const secondaryTasks = (todaysTasks?.tasks || []).slice(1, 3).map(toTaskObject);
  const weeklyLabel =
    totalActivities > 0 ? `${completedCount}/${totalActivities} complete` : 'No tasks yet';
  const examLabel = daysLeft !== null ? `${daysLeft} days left` : 'Exam date not set';

  if (loading) {
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

  return (
    <GlassCard className="relative p-5 sm:p-6 lg:p-8 bg-gradient-to-br from-white/95 to-slate-50/95 dark:from-slate-950/90 dark:to-slate-900/90 h-full">
      {/* Decorative Aura / Glows */}
      <div className="absolute -top-24 -left-20 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none dark:bg-violet-500/5" />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none dark:bg-pink-500/5" />

      {/* Subtle tech-forward grid line pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(168,85,247,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,85,247,0.025)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      {/* Main card border gradient */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

      <div className="relative z-10 grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-5">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/5 dark:bg-white/5 border border-slate-950/10 dark:border-white/10 text-[10px] font-black uppercase tracking-[0.16em] text-slate-800 dark:text-slate-200">
                <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400 animate-pulse" />
                Today&apos;s Coach Brief
              </div>
              {module && <ModuleBadge module={module} />}
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.1] max-w-3xl">
              {focusTitle}
            </h2>

            <p className="mt-4 text-sm sm:text-base font-semibold leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl">
              {focusReason}
            </p>
          </div>

          <div>
            <div className="mt-6 grid max-w-2xl grid-cols-1 gap-3.5 sm:grid-cols-2 xl:max-w-[620px]">
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

            <div className="mt-5 flex flex-wrap gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
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
        </div>

        <div className="lg:border-l lg:border-slate-200/80 lg:dark:border-slate-800 lg:pl-6 flex flex-col justify-between gap-5">
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3.5">
            {/* Week Progress Widget */}
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

            {/* Reviews Widget */}
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

            {/* Target Widget */}
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

          {!!secondaryTasks.length && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 mb-3 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                After the main task
              </div>
              <div className="space-y-2">
                {secondaryTasks.map((task, index) => (
                  <button
                    key={`${task.title}-${index}`}
                    type="button"
                    onClick={onSelectToday}
                    className="group relative w-full text-left rounded-2xl border border-slate-200/60 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-900/20 p-3 shadow-md dark:shadow-slate-950/40 hover:border-violet-300 dark:hover:border-violet-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10"
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
          )}
        </div>
      </div>
    </GlassCard>
  );
};

// --- Helpers ---

/** Calculate band gap analysis for each module */
function calculateBandGaps(stats, targetBand) {
  if (!stats?.moduleAverages)
    return {
      hasAny: false,
      items: [],
      levers: [],
      missingModules: ['reading', 'listening', 'writing', 'speaking'],
    };

  const modules = ['reading', 'listening', 'writing', 'speaking'];
  const items = [];
  const missingModules = [];
  let hasAny = false;

  modules.forEach((module) => {
    const current = stats.moduleAverages[module];
    if (current > 0) hasAny = true;

    const safeCurrent = current || 0;
    const gap = targetBand ? Math.max(0, targetBand - safeCurrent) : 0;
    const trend = stats.moduleTrends?.[module] || 'stable';

    if (safeCurrent > 0) {
      items.push({ module, current: safeCurrent, gap, trend });
    } else {
      missingModules.push(module);
    }
  });

  items.sort((a, b) => b.gap - a.gap || a.current - b.current);
  const levers = items.filter((i) => i.gap > 0).slice(0, 2);

  return { hasAny, items, levers, missingModules };
}

/** Extract common mistake patterns from recent test sessions */
function buildMistakePatterns(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) return [];

  const tagCounts = {};

  sessions.forEach((s) => {
    // errorPatterns.troubleTypes is the real field from testMetricsService
    const troubleTypes = s?.content_data?.errorPatterns?.troubleTypes || [];
    // Also support legacy errorTags/error_tags fields
    const legacyTags = s?.content_data?.errorTags || s?.content_data?.error_tags || [];
    const errorTags = troubleTypes.length > 0 ? troubleTypes : legacyTags;
    const typeStats = s?.content_data?.typeStats || {};

    // Collect Writing/Speaking criteria weaknesses too
    const criteriaScores = s?.content_data?.criteriaScores || {};
    if (s.test_type === 'writing' || s.test_type === 'speaking') {
      Object.entries(criteriaScores).forEach(([criterion, score]) => {
        const numScore = Number(score) || 0;
        if (numScore > 0 && numScore < 6.0) {
          const key = humanizeLabel(criterion);
          if (!tagCounts[key]) tagCounts[key] = { tag: key, count: 0, module: s.test_type };
          tagCounts[key].count += Math.ceil((6.0 - numScore) * 2);
        }
      });
    }

    (Array.isArray(errorTags) ? errorTags : []).forEach((tag) => {
      const key = humanizeLabel(tag);
      if (!key) return;
      if (!tagCounts[key]) tagCounts[key] = { tag: key, count: 0, module: s.test_type };
      tagCounts[key].count += 1;
    });

    Object.entries(typeStats).forEach(([typeKey, stat]) => {
      const total = Number(stat?.total || 0);
      const correct = Number(stat?.correct || 0);
      if (total < 2) return;
      const accuracy = correct / total;
      if (accuracy < 0.5) {
        const key = humanizeLabel(typeKey);
        if (!key) return;
        if (!tagCounts[key]) tagCounts[key] = { tag: key, count: 0, module: s.test_type };
        tagCounts[key].count += Math.ceil(total * (1 - accuracy));
      }
    });
  });

  return Object.values(tagCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

// ------------------------------------------------------------------
// LearningPath Page
// ------------------------------------------------------------------
const LearningPath = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { learningPath, stats, skillMap, isLoading, activityByKey, toggleActivity } =
    useLearningPathData(true);

  const [selectedDayIndex, setSelectedDayIndex] = useState(getTodayIndex());
  const [timerState, setTimerState] = useState({ running: false, secondsLeft: 25 * 60 });
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Derived Data ---

  const targetBand = Number(user?.target_band_score) || 7.0;
  const daysLeft = useMemo(() => getDaysLeft(user?.test_date), [user?.test_date]);

  const bandGaps = useMemo(() => calculateBandGaps(stats, targetBand), [stats, targetBand]);

  const allSkills = useMemo(() => {
    if (!skillMap?.byModule) return [];
    return Object.values(skillMap.byModule).flat();
  }, [skillMap]);

  const skillIndex = useMemo(() => {
    const idx = {};
    allSkills.forEach((s) => {
      idx[s.skill_code] = s;
    });
    return idx;
  }, [allSkills]);

  const spotlightSkills = useMemo(() => {
    return allSkills
      .filter((s) => s.mastery < 0.7 && !s.is_due) // Exclude is_due skills (they show in ReviewQueue)
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 3);
  }, [allSkills]);

  const dueReviewSkills = useMemo(() => {
    return allSkills
      .filter((s) => s.is_due)
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 5);
  }, [allSkills]);

  const mistakePatterns = useMemo(() => buildMistakePatterns(stats?.sessions), [stats?.sessions]);

  // Transform weekly_schedule dict {monday: [...], tuesday: [...]} into indexed array
  const scheduleTasks = useMemo(() => {
    const ws = learningPath?.weekly_schedule || learningPath?.schedule;
    if (!ws) return [];
    // If it's already an array, use as-is
    if (Array.isArray(ws)) return ws;
    // Convert dict keyed by day name into indexed array matching dayNames order
    return dayNames.map((day) => ({ tasks: ws[day] || [] }));
  }, [learningPath]);

  const currentDayTasks = useMemo(
    () => scheduleTasks[selectedDayIndex]?.tasks || [],
    [scheduleTasks, selectedDayIndex]
  );

  const todaysTasks = useMemo(() => {
    const todayIdx = getTodayIndex();
    return { day: dayNames[todayIdx], tasks: scheduleTasks[todayIdx]?.tasks || [] };
  }, [scheduleTasks]);

  const dailyFocus = useMemo(() => {
    if (!todaysTasks.tasks.length) return null;
    const firstTask = todaysTasks.tasks[0];
    const taskObj =
      typeof firstTask === 'string' ? { title: firstTask, module: 'general' } : firstTask;
    // Use real task description if available, otherwise build one from the module + priority
    const moduleLabel = taskObj.module
      ? taskObj.module.charAt(0).toUpperCase() + taskObj.module.slice(1)
      : 'General';
    const priorityLabel =
      taskObj.priority === 'high'
        ? 'highest-priority'
        : taskObj.priority === 'low'
          ? 'reinforcement'
          : 'core';
    const generatedReason = `Your ${priorityLabel} ${moduleLabel} focus for today based on your weakest skills.`;
    return {
      primary_module: taskObj.module,
      ai_reason: taskObj.description || generatedReason,
      task: taskObj,
    };
  }, [todaysTasks]);

  const { completionPercent, totalActivities, completedCount } = useMemo(() => {
    let total = 0;
    let completed = 0;
    scheduleTasks.forEach((day, dIdx) => {
      (day.tasks || []).forEach((_task, tIdx) => {
        total++;
        const key = `${dayNames[dIdx]}_${tIdx}`;
        if (activityByKey[key]?.is_completed) completed++;
      });
    });
    return {
      completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalActivities: total,
      completedCount: completed,
    };
  }, [scheduleTasks, activityByKey]);

  const dateLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // --- Handlers ---

  const handleUpdateStrategy = useCallback(async () => {
    setIsGenerating(true);
    try {
      await toast.promise(generateAdaptiveLearningPath(), {
        loading: 'Analyzing your recent performance…',
        success: 'Learning plan updated!',
        error: (err) =>
          err?.status === 403
            ? 'Pro or Premium subscription required'
            : 'Failed to update plan — please try again',
      });
      // Refresh all learning path queries so the page picks up the new data
      queryClient.invalidateQueries({ queryKey: ['learningPath'] });
    } catch {
      // Toast already handles UI feedback
    } finally {
      setIsGenerating(false);
    }
  }, [queryClient]);

  const handleTimerToggle = useCallback(() => {
    setTimerState((prev) => ({ ...prev, running: !prev.running }));
  }, []);

  const handleRefreshDaily = useCallback(() => {
    toast.info('Refreshed daily focus');
  }, []);

  const handleSelectToday = useCallback(() => {
    setSelectedDayIndex(getTodayIndex());
  }, []);

  const handleStartTopTask = useCallback(() => {
    const module = dailyFocus?.primary_module;
    if (module && module !== 'general') {
      navigate(createPageUrl(module.charAt(0).toUpperCase() + module.slice(1)));
      return;
    }
    handleSelectToday();
  }, [dailyFocus?.primary_module, handleSelectToday, navigate]);

  const handleTaskToggle = useCallback(
    async (dayName, taskIdx) => {
      const activityKey = `${dayName}_${taskIdx}`;
      const existing = activityByKey[activityKey];
      const wasCompleted = !!existing?.is_completed;

      const dayIndex = dayNames.indexOf(dayName);
      const tasks = scheduleTasks[dayIndex]?.tasks || [];
      const task = tasks[taskIdx];

      try {
        await toggleActivity({
          activityKey,
          dayName,
          taskIdx,
          task,
          isCompleted: !wasCompleted,
          outcomeScore: existing?.outcome_score ?? null,
        });
        toast.success(wasCompleted ? 'Marked as incomplete' : 'Marked as complete! 🎉');
      } catch (err) {
        console.error('Failed to toggle activity:', err);
        toast.error('Could not update task — please try again.');
      }
    },
    [activityByKey, scheduleTasks, toggleActivity]
  );

  const handleQuickComplete = useCallback(
    async (dayName, taskIdx, task) => {
      const activityKey = `${dayName}_${taskIdx}`;
      try {
        await toggleActivity({
          activityKey,
          dayName,
          taskIdx,
          task,
          isCompleted: true,
          outcomeScore: null,
        });
        toast.success('Quick-completed! ✅');
      } catch (err) {
        console.error('Quick complete failed:', err);
        toast.error('Could not complete task — please try again.');
      }
    },
    [toggleActivity]
  );

  // --- Render ---

  return (
    <>
      <DocumentHead
        title="AI Learning Path | IELTS Ai Pro"
        description="Your personalized AI-driven study plan to reach your target band score."
      />

      <div className="relative min-h-screen pb-20 bg-[#fafbff] dark:bg-[#060810] transition-colors duration-500 overflow-hidden isolate">
        {/* Premium quiet background */}
        <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.025)_1px,transparent_1px)] bg-[size:72px_72px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)]" />
          <div className="absolute inset-x-0 top-0 h-[450px] bg-gradient-to-b from-violet-50/90 via-blue-50/40 to-transparent dark:from-violet-950/25 dark:via-blue-950/10" />
          <div className="absolute inset-x-0 top-[220px] h-[400px] bg-gradient-to-b from-transparent via-fuchsia-50/20 to-transparent dark:via-fuchsia-950/5" />
        </div>

        <m.main
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="py-4 px-3 sm:p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-4 md:space-y-6 relative z-10"
        >
          {/* Header Section */}
          <m.header variants={itemVariants} className="space-y-4 pl-12 md:pl-0">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-3.5">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className="px-3 py-1 rounded-full bg-slate-500/5 dark:bg-slate-400/5 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider backdrop-blur-sm"
                  >
                    {dateLabel}
                  </Badge>
                  {user?.subscription_tier === 'premium' ? (
                    <Badge
                      variant="outline"
                      className="bg-purple-500/10 backdrop-blur-md border border-purple-500/20 text-purple-600 dark:text-purple-400 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all hover:bg-purple-500/20 hover:text-purple-700 dark:hover:text-purple-300"
                    >
                      <Crown className="w-3 h-3 fill-purple-600/20 dark:fill-purple-400/20" />
                      PREMIUM
                    </Badge>
                  ) : user?.subscription_tier === 'pro' ? (
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all hover:bg-blue-500/20 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <Zap className="w-3 h-3 fill-blue-600/20 dark:fill-blue-400/20" />
                      PRO
                    </Badge>
                  ) : null}
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mt-2 sm:mt-3 leading-tight">
                  Your private IELTS coach
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base md:text-lg font-medium max-w-xl mt-1.5 sm:mt-2 leading-relaxed">
                  Focused on Band {targetBand.toFixed(1)}: one priority, one practice route, and a
                  simple weekly plan that adapts after each completed test.
                </p>
              </div>

              <div className="w-full xl:w-[300px] space-y-2">
                <Button
                  onClick={handleStartTopTask}
                  disabled={isLoading}
                  className="w-full rounded-2xl h-10 bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 font-black"
                >
                  Start Today&apos;s Task
                </Button>

                <Button
                  onClick={handleUpdateStrategy}
                  disabled={isGenerating || isLoading}
                  variant="outline"
                  className="w-full rounded-2xl h-10 border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold"
                >
                  <RefreshCw className={cn('w-4 h-4 mr-2', isGenerating && 'animate-spin')} />
                  {isGenerating ? 'Refreshing...' : 'Refresh Plan'}
                </Button>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed px-1">
                  Your plan updates automatically after completed tests.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 px-3 py-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                {isLoading
                  ? 'Loading timeline'
                  : daysLeft !== null
                    ? `${daysLeft} days left`
                    : 'Exam date not set'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 px-3 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {isLoading ? 'Loading tasks' : `${completedCount}/${totalActivities} tasks`}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 px-3 py-1.5">
                <Target className="w-3.5 h-3.5 text-amber-500" />
                {isLoading ? 'Loading reviews' : `${dueReviewSkills.length} reviews due`}
              </span>
            </div>
          </m.header>

          {/* Today-first coaching layout */}
          <div className="grid grid-cols-12 gap-4 auto-rows-max items-start">
            <m.div
              variants={itemVariants}
              className="col-span-12 lg:col-span-8 self-stretch flex flex-col"
            >
              <CoachBrief
                dailyFocus={dailyFocus}
                loading={isLoading}
                hasHistory={(stats?.totalTests || 0) > 0}
                targetBand={targetBand}
                daysLeft={daysLeft}
                completedCount={completedCount}
                totalActivities={totalActivities}
                dueReviewCount={dueReviewSkills.length}
                completionPercent={completionPercent}
                timerState={timerState}
                onTimerToggle={handleTimerToggle}
                onRefresh={handleRefreshDaily}
                todaysTasks={todaysTasks}
                onSelectToday={handleSelectToday}
                onStartTopTask={handleStartTopTask}
              />
            </m.div>

            <m.div
              variants={itemVariants}
              className="col-span-12 lg:col-span-4 self-stretch flex flex-col"
            >
              <ProgressForecast
                loading={isLoading}
                currentReadiness={completionPercent}
                targetScore={targetBand}
                testDate={user?.test_date}
                completedActivities={completedCount}
                totalActivities={totalActivities}
                className="h-full p-3 sm:p-4 md:p-6"
                hasHistory={(stats?.totalTests || 0) > 0}
                onSetDate={() => navigate(`${createPageUrl('Settings')}?tab=goals`)}
              />
            </m.div>

            {/* Main coaching hierarchy */}
            <m.div variants={itemVariants} className="col-span-12 lg:col-span-8 space-y-4">
              <WeekSchedule
                selectedDayIndex={selectedDayIndex}
                setSelectedDayIndex={setSelectedDayIndex}
                currentTasks={currentDayTasks}
                activityByKey={activityByKey}
                onToggleTask={handleTaskToggle}
                onQuickComplete={handleQuickComplete}
                skillIndex={skillIndex}
                className="p-3 sm:p-4 md:p-5"
                loading={isLoading}
              />

              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/60 dark:bg-slate-900/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-950 dark:bg-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white dark:text-slate-950" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
                      Coach Insights
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Use these after today&apos;s main task, not before it.
                    </p>
                  </div>
                </div>
              </div>

              <BandGapBreakdown
                bandGaps={bandGaps}
                targetBand={targetBand}
                className="p-3 sm:p-4 md:p-5"
                loading={isLoading}
              />
            </m.div>

            <m.div variants={itemVariants} className="col-span-12 lg:col-span-4 space-y-4">
              <ReviewQueue
                dueReviewSkills={dueReviewSkills}
                setSelectedDayIndex={setSelectedDayIndex}
                className="p-3 sm:p-4 md:p-5"
                loading={isLoading}
              />
              <RecommendedPractice
                learningPath={learningPath}
                className="p-3 sm:p-4 md:p-5"
                loading={isLoading}
                compact={true}
              />
              <MistakeAnalysis
                mistakePatterns={mistakePatterns.slice(0, 2)}
                onSelectToday={handleSelectToday}
                className="p-3 sm:p-4 md:p-5"
                loading={isLoading}
              />
            </m.div>

            {(isLoading || spotlightSkills.length > 0) && (
              <m.div variants={itemVariants} className="col-span-12">
                <WeakSkillSpotlight
                  spotlightSkills={spotlightSkills}
                  className="p-3 sm:p-4 md:p-6"
                  loading={isLoading}
                />
              </m.div>
            )}
          </div>
        </m.main>
      </div>
    </>
  );
};

export default LearningPath;

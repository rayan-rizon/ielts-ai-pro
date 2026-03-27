import React, { useState, useMemo, useCallback } from 'react';
import { m } from 'framer-motion';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { generateAdaptiveLearningPath } from '@/utils/api';
import { Zap, RefreshCw, Target, Clock, Flame, CheckCircle2, Sparkles } from 'lucide-react';

import { useAuth } from '@/features/auth/context/AuthContext';
import useLearningPathData, {
  getTodayIndex,
  dayNames,
} from '@/features/learning/hooks/useLearningPathData';
import { getDaysLeft } from '@/features/learning/utils/learningUtils';
import DocumentHead from '@/components/shared/DocumentHead';
import PremiumLoading from '@/components/ui/PremiumLoading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Components
import DailyFocusCard from '@/features/learning/components/dashboard/DailyFocusCard';
import BandGapBreakdown from '@/features/learning/components/dashboard/BandGapBreakdown';
import WeakSkillSpotlight from '@/features/learning/components/dashboard/WeakSkillSpotlight';
import RecommendedPractice from '@/features/learning/components/dashboard/RecommendedPractice';
import WeekSchedule from '@/features/learning/components/dashboard/WeekSchedule';
import ReviewQueue from '@/features/learning/components/dashboard/ReviewQueue';
import MistakeAnalysis from '@/features/learning/components/dashboard/MistakeAnalysis';
import ProgressForecast from '@/features/learning/components/ProgressForecast';

// --- Animation variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

// --- Helpers ---

/** Calculate band gap analysis for each module */
function calculateBandGaps(stats, targetBand) {
  if (!stats?.moduleAverages) return { hasAny: false, items: [], levers: [] };

  const modules = ['reading', 'listening', 'writing', 'speaking'];
  const items = [];
  let hasAny = false;

  modules.forEach((module) => {
    const current = stats.moduleAverages[module];
    if (current > 0) hasAny = true;

    const safeCurrent = current || 0;
    const gap = targetBand ? Math.max(0, targetBand - safeCurrent) : 0;
    const trend = stats.moduleTrends?.[module] || 'stable';

    if (safeCurrent > 0 || gap > 0) {
      items.push({ module, current: safeCurrent, gap, trend });
    }
  });

  items.sort((a, b) => b.gap - a.gap || a.current - b.current);
  const levers = items.filter((i) => i.gap > 0).slice(0, 2);

  return { hasAny, items, levers };
}

/** Extract common mistake patterns from recent test sessions */
function buildMistakePatterns(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) return [];

  const tagCounts = {};

  sessions.forEach((s) => {
    const errorTags = s?.content_data?.errorTags || s?.content_data?.error_tags || [];
    const typeStats = s?.content_data?.typeStats || {};

    (Array.isArray(errorTags) ? errorTags : []).forEach((tag) => {
      const key = String(tag).trim();
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
        const key = String(typeKey).replace(/_/g, ' ').trim();
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
    return {
      primary_module: taskObj.module,
      ai_reason: 'Your daily priority based on your schedule.',
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

  const { dateLabel, greeting } = useMemo(() => {
    const now = new Date();
    const label = now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    return { dateLabel: label, greeting: 'Your study plan' };
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

  if (isLoading) {
    return <PremiumLoading message="Loading your plan..." fullScreen={true} />;
  }

  return (
    <>
      <DocumentHead
        title="AI Learning Path | IELTS Ai Pro"
        description="Your personalized AI-driven study plan to reach your target band score."
      />

      <div className="relative min-h-screen pb-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/40 transition-colors duration-500 overflow-hidden isolate">
        {/* Enhanced Premium Background (Shared with Dashboard) */}
        <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops)),rgba(99,102,241,0.12)_0%,transparent_40%),radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops)),rgba(168,85,247,0.08)_0%,transparent_40%),radial-gradient(ellipse_at_center,_var(--tw-gradient-stops)),rgba(59,130,246,0.06)_0%,transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops)),rgba(99,102,241,0.2)_0%,transparent_40%),radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops)),rgba(168,85,247,0.15)_0%,transparent_40%),radial-gradient(ellipse_at_center,_var(--tw-gradient-stops)),rgba(59,130,246,0.1)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f104_1px,transparent_1px),linear-gradient(to_bottom,#6366f104_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 dark:to-black/10 animate-pulse" />
        </div>

        <m.main
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-3 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 relative z-10"
        >
          {/* Header Section (Synced with Dashboard V3 Style) */}
          <m.header variants={itemVariants} className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="px-3 py-1 rounded-full bg-slate-500/5 dark:bg-slate-400/5 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider backdrop-blur-sm"
                  >
                    {dateLabel}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-indigo-500/10 backdrop-blur-md border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3 h-3 fill-indigo-600/20 dark:fill-indigo-400/20" />
                    AI POWERED
                  </Badge>
                  {user?.subscription_tier === 'pro' && (
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Zap className="w-3 h-3 fill-blue-600/20 dark:fill-blue-400/20" />
                      PRO
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-3 leading-tight">
                  {greeting} to{' '}
                  <span className="text-indigo-600 dark:text-indigo-400 italic">
                    Band {targetBand}
                  </span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium max-w-xl mt-2">
                  {completionPercent === 100
                    ? "Perfect score! You've completed all tasks for your plan."
                    : `You've completed ${completedCount} tasks. Aim for 80%+ consistency.`}
                </p>
              </div>

              <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4">
                {/* Floating Stats Bar */}
                <m.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'grid grid-cols-2 md:flex md:flex-row items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-0 md:p-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full xl:w-auto overflow-hidden',
                    'hover:border-indigo-500/30 dark:hover:border-indigo-500/40 transition-all duration-300'
                  )}
                >
                  {/* Target */}
                  <div className="flex items-center gap-2 px-4 py-3 md:px-4 md:py-2 border-r border-b md:border-b-0 border-slate-100 dark:border-white/5">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                      <Target className="w-4 h-4 text-indigo-700 dark:text-indigo-300" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                        Target
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 leading-none italic">
                        {targetBand}
                      </span>
                    </div>
                  </div>

                  {/* Exam Date */}
                  <div className="flex items-center gap-2 px-4 py-3 md:px-4 md:py-2 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5">
                    <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-100 dark:border-violet-500/20">
                      <Clock className="w-4 h-4 text-violet-700 dark:text-violet-300" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                        Exam
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 leading-none">
                        {daysLeft !== null ? `${daysLeft}d` : 'Not set'}
                      </span>
                    </div>
                  </div>

                  {/* Streak */}
                  <div className="flex items-center gap-2 px-4 py-3 md:px-4 md:py-2 border-r border-slate-100 dark:border-white/5">
                    <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-100 dark:border-orange-500/20">
                      <Flame className="w-4 h-4 text-orange-700 dark:text-orange-300 fill-orange-500/30" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                        Streak
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 leading-none">
                        {user?.current_streak || 0}
                      </span>
                    </div>
                  </div>

                  {/* Daily Progress */}
                  <div className="flex items-center gap-2 px-4 py-3 md:px-4 md:py-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                        Done
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 leading-none">
                        {completionPercent}%
                      </span>
                    </div>
                  </div>
                </m.div>

                <Button
                  onClick={handleUpdateStrategy}
                  disabled={isGenerating}
                  size="lg"
                  className="rounded-full bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 px-6 h-12 border-0 shadow-lg dark:shadow-indigo-500/20 w-full md:w-auto xl:w-auto overflow-hidden group/btn relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite]" />
                  <RefreshCw className={cn('w-4 h-4 mr-2', isGenerating && 'animate-spin')} />
                  <span className="font-black tracking-tight">
                    {isGenerating ? 'Analyzing...' : 'Update Strategy'}
                  </span>
                </Button>
              </div>
            </div>
          </m.header>

          {/* Bento Grid Layout (12 Columns) - COMPACT */}
          <div className="grid grid-cols-12 gap-4 auto-rows-max">
            {/* Row 1: Daily Focus (8) & Score Forecast (4) */}
            <m.div variants={itemVariants} className="col-span-12 lg:col-span-8">
              <DailyFocusCard
                dailyFocus={dailyFocus}
                loading={isLoading}
                timerState={timerState}
                onTimerToggle={handleTimerToggle}
                onRefresh={handleRefreshDaily}
                todaysTasks={todaysTasks}
                activityByKey={activityByKey}
                onSelectToday={handleSelectToday}
                onToggleTask={handleTaskToggle}
                className="h-full p-4 md:p-6"
                hasHistory={(stats?.totalTests || 0) > 0}
              />
            </m.div>

            <m.div variants={itemVariants} className="col-span-12 lg:col-span-4">
              <ProgressForecast
                currentReadiness={completionPercent}
                targetScore={targetBand}
                testDate={user?.test_date}
                completedActivities={completedCount}
                totalActivities={totalActivities}
                className="h-full p-4 md:p-6"
                hasHistory={(stats?.totalTests || 0) > 0}
              />
            </m.div>

            {/* Row 2: Weekly Schedule (Full Width) */}
            <m.div variants={itemVariants} className="col-span-12">
              <WeekSchedule
                selectedDayIndex={selectedDayIndex}
                setSelectedDayIndex={setSelectedDayIndex}
                currentTasks={currentDayTasks}
                activityByKey={activityByKey}
                onToggleTask={handleTaskToggle}
                onQuickComplete={handleQuickComplete}
                skillIndex={skillIndex}
                className="p-4 md:p-6"
              />
            </m.div>

            {/* Row 3: Band Gap Breakdown (6) & Weak Skill Spotlight (6) */}
            <m.div variants={itemVariants} className="col-span-12 lg:col-span-6">
              <BandGapBreakdown
                bandGaps={bandGaps}
                targetBand={targetBand}
                className="h-full p-4 md:p-6"
              />
            </m.div>

            <m.div variants={itemVariants} className="col-span-12 lg:col-span-6">
              <WeakSkillSpotlight spotlightSkills={spotlightSkills} className="h-full p-4 md:p-6" />
            </m.div>

            {/* Row 4: Mistake Analysis (6) & Review Queue (6) */}
            <m.div variants={itemVariants} className="col-span-12 lg:col-span-6">
              <MistakeAnalysis
                mistakePatterns={mistakePatterns}
                onSelectToday={handleSelectToday}
                className="h-full p-4 md:p-6"
              />
            </m.div>

            <m.div variants={itemVariants} className="col-span-12 lg:col-span-6">
              <ReviewQueue
                dueReviewSkills={dueReviewSkills}
                setSelectedDayIndex={setSelectedDayIndex}
                className="h-full p-4 md:p-6"
              />
            </m.div>

            {/* Row 5: Recommended Practice (Full Width) */}
            <m.div variants={itemVariants} className="col-span-12">
              <RecommendedPractice learningPath={learningPath} className="p-4 md:p-6" />
            </m.div>
          </div>
        </m.main>
      </div>
    </>
  );
};

export default LearningPath;

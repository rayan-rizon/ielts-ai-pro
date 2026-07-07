import React from 'react';
import { m } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Crown, Clock, CheckCircle2, Target, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

function SubscriptionBadge({ tier }) {
  if (tier === 'premium') {
    return (
      <Badge
        variant="outline"
        className="bg-purple-500/10 backdrop-blur-md border border-purple-500/20 text-purple-600 dark:text-purple-400 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all hover:bg-purple-500/20 hover:text-purple-700 dark:hover:text-purple-300"
      >
        <Crown className="w-3 h-3 fill-purple-600/20 dark:fill-purple-400/20" />
        PREMIUM
      </Badge>
    );
  }
  if (tier === 'pro') {
    return (
      <Badge
        variant="outline"
        className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all hover:bg-blue-500/20 hover:text-blue-700 dark:hover:text-blue-300"
      >
        <Zap className="w-3 h-3 fill-blue-600/20 dark:fill-blue-400/20" />
        PRO
      </Badge>
    );
  }
  return null;
}

function ExamTimelineLabel({ isLoading, daysLeft }) {
  if (isLoading) return 'Loading timeline';
  if (daysLeft !== null) return `${daysLeft} days left`;
  return 'Exam date not set';
}

export function LearningPathHeader({
  user,
  dateLabel,
  targetBand,
  isLoading,
  handleStartTopTask,
  handleUpdateStrategy,
  isGenerating,
  daysLeft,
  completedCount,
  totalActivities,
  dueReviewSkills,
}) {
  return (
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
            <SubscriptionBadge tier={user?.subscription_tier} />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mt-2 sm:mt-3 leading-tight">
            Your private IELTS coach
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base md:text-lg font-medium max-w-xl mt-1.5 sm:mt-2 leading-relaxed">
            Focused on Band {targetBand.toFixed(1)}: one priority, one practice route, and a simple
            weekly plan that adapts after each completed test.
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
          <ExamTimelineLabel isLoading={isLoading} daysLeft={daysLeft} />
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
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  ArrowRight,
  Play,
  RotateCcw,
  CheckCircle2,
  Users,
  Target,
  Lock,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createPageUrl } from '@/utils';
import { colorVariants } from './writingColorConfig';

export function WritingStatusBadge({ isLocked, isResuming, isCompleted, color }) {
  if (isLocked) {
    return (
      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12">
        <Lock className="w-4 h-4 text-white" />
      </div>
    );
  }
  if (isResuming) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-full px-3 py-1 border',
          colorVariants[color].badge
        )}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              colorVariants[color].ping
            )}
          />
          <span
            className={cn('relative inline-flex rounded-full h-2 w-2', colorVariants[color].dot)}
          />
        </span>
        <span className="text-[11px] font-bold tracking-wide uppercase">In Progress</span>
      </div>
    );
  }
  if (isCompleted) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-full px-3 py-1 border',
          colorVariants[color].badge
        )}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="text-[11px] font-bold tracking-wide uppercase">Completed</span>
      </div>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 px-3 py-1 text-[11px] font-bold tracking-wider uppercase"
    >
      New Task
    </Badge>
  );
}

function MetaTakenPill({ takenCount }) {
  if (takenCount <= 0) return null;
  return (
    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
      <Users className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
        {takenCount} Taken
      </span>
    </div>
  );
}

function MetaProgressSection({ isResuming, progress, color }) {
  if (!isResuming) return null;
  return (
    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5">
      <div className="flex justify-between text-xs font-bold tracking-wide">
        <span className="text-slate-700 dark:text-slate-300 uppercase">Completion</span>
        <span className={cn('font-black', colorVariants[color].text.split(' ')[0])}>
          {progress}%
        </span>
      </div>
      <Progress
        value={progress}
        className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full"
        indicatorClassName={cn('bg-gradient-to-r', colorVariants[color].progress)}
      />
    </div>
  );
}

function MetaScoreSection({ isResuming, isCompleted, displayScore, color }) {
  if (isResuming) return null;
  if (!isCompleted) return null;
  if (displayScore === null || displayScore === undefined) return null;
  return (
    <div className="pt-2 border-t border-slate-100 dark:border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
          Your Score
        </span>
        <div className="flex items-center gap-2">
          <span className={cn('text-2xl font-black', colorVariants[color].text.split(' ')[0])}>
            {typeof displayScore === 'number' ? displayScore.toFixed(1) : displayScore}
          </span>
          <span className="text-xs text-slate-400">/ 9.0</span>
        </div>
      </div>
    </div>
  );
}

export function WritingMetaBar({
  duration,
  wordLimit,
  takenCount,
  isResuming,
  isCompleted,
  displayScore,
  progress,
  color,
}) {
  const displayDuration = duration || 60;
  const displayWordLimit = wordLimit || 400;

  return (
    <div className="mb-6 relative z-10 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {displayDuration} min
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {displayWordLimit} Words
          </span>
        </div>
        <MetaTakenPill takenCount={takenCount} />
      </div>

      <MetaProgressSection isResuming={isResuming} progress={progress} color={color} />
      <MetaScoreSection
        isResuming={isResuming}
        isCompleted={isCompleted}
        displayScore={displayScore}
        color={color}
      />
    </div>
  );
}

export function WritingActions({
  isLocked,
  isResuming,
  isCompleted,
  test,
  session,
  completedSessionId,
  color,
}) {
  if (isLocked) {
    return (
      <Link to={createPageUrl('Pricing')} className="block mt-4">
        <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl h-11 text-sm shadow-lg transition-all">
          <Crown className="w-4 h-4 mr-2" /> Upgrade to Access
        </Button>
      </Link>
    );
  }
  if (isResuming) {
    return (
      <Link to={`/writing-task?sessionId=${session.id}`} className="block mt-4">
        <Button
          className={cn(
            'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-11 text-sm shadow-none transition-all',
            colorVariants[color].button
          )}
        >
          Resume Task <Play className="w-3.5 h-3.5 ml-2 fill-current" />
        </Button>
      </Link>
    );
  }
  if (isCompleted) {
    return (
      <div className="flex gap-2 mt-4">
        <Link to={`/writing-task?sessionId=${completedSessionId}&view=true`} className="flex-1">
          <Button
            className={cn(
              'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-11 text-sm shadow-none transition-all',
              colorVariants[color].button
            )}
          >
            View Feedback <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>
        </Link>
        <Link to={`/writing-task?taskId=${test.id}&new_attempt=true`}>
          <Button
            variant="outline"
            className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <Link to={`/writing-task?taskId=${test.id}&new_attempt=true`} className="block mt-4">
      <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500 text-white font-bold rounded-xl h-11 text-sm shadow-lg shadow-slate-900/20 dark:shadow-orange-900/40 transition-all group-hover:scale-[1.02] border-0">
        Start Writing <ChevronRight className="w-4 h-4 ml-1.5" />
      </Button>
    </Link>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import {
  Clock,
  HelpCircle,
  ArrowRight,
  Play,
  RotateCcw,
  CheckCircle2,
  Users,
  Lock,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createPageUrl } from '@/utils';
import { colorVariants, PROGRESS_GRADIENTS } from './readingColorConfig';

// ---------------------------------------------------------------------------
// Grid Sub-components
// ---------------------------------------------------------------------------

export function GridStatusBadge({ isLocked, isResuming, isCompleted, color }) {
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
      New Test
    </Badge>
  );
}

export function GridMetaBar({
  duration,
  questionCount,
  takenCount,
  isResuming,
  isCompleted,
  completedSession,
  progress,
  color,
}) {
  return (
    <div className="mb-6 relative z-10 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {duration} min
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {questionCount} Qs
          </span>
        </div>
        {takenCount > 0 && (
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {takenCount} Taken
            </span>
          </div>
        )}
      </div>

      {isResuming && (
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
            indicatorClassName={cn(
              'bg-gradient-to-r',
              PROGRESS_GRADIENTS[color] || PROGRESS_GRADIENTS.indigo
            )}
          />
        </div>
      )}

      {!isResuming && isCompleted && completedSession?.score !== undefined && (
        <div className="pt-2 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
              Your Score
            </span>
            <div className="flex items-center gap-2">
              <span className={cn('text-2xl font-black', colorVariants[color].text.split(' ')[0])}>
                {typeof completedSession.score === 'number'
                  ? completedSession.score.toFixed(1)
                  : completedSession.score}
              </span>
              <span className="text-xs text-slate-400">/ 9.0</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function GridActions({
  isLocked,
  isResuming,
  isCompleted,
  test,
  session,
  completedSession,
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
      <Link to={`/reading-test/${session.id}`} className="block mt-4">
        <Button
          className={cn(
            'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-11 text-sm shadow-none transition-all',
            colorVariants[color].button
          )}
        >
          Resume Test <Play className="w-3.5 h-3.5 ml-2 fill-current" />
        </Button>
      </Link>
    );
  }
  if (isCompleted) {
    return (
      <div className="flex gap-2 mt-4">
        <Link to={`/reading-test/${completedSession.id}?view-results=true`} className="flex-1">
          <Button
            className={cn(
              'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-11 text-sm shadow-none transition-all',
              colorVariants[color].button
            )}
          >
            View Results <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>
        </Link>
        <Link to={`/reading-test?test-id=${test.id}&retake=true`}>
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
    <Link to={`/reading-test?test-id=${test.id}`} className="block mt-4">
      <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold rounded-xl h-11 text-sm shadow-lg shadow-slate-900/20 dark:shadow-blue-900/40 transition-all group-hover:scale-[1.02] border-0">
        Start Practice <ChevronRight className="w-4 h-4 ml-1.5" />
      </Button>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// List Sub-components
// ---------------------------------------------------------------------------

export function ListStatusBadge({ isLocked, isResuming, isCompleted, color }) {
  if (isLocked) {
    return (
      <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-md shrink-0">
        <Lock className="w-3 h-3 text-white" />
      </div>
    );
  }
  if (isResuming) {
    return (
      <span
        className={cn(
          'flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0',
          colorVariants[color].badge
        )}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              colorVariants[color].ping
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full h-1.5 w-1.5',
              colorVariants[color].dot
            )}
          />
        </span>
        In Progress
      </span>
    );
  }
  if (isCompleted) {
    return (
      <span
        className={cn(
          'flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0',
          colorVariants[color].badge
        )}
      >
        <CheckCircle2 className="w-3 h-3" />
        Completed
      </span>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase shrink-0"
    >
      New
    </Badge>
  );
}

export function ListScoreProgress({ isCompleted, isResuming, completedSession, progress, color }) {
  if (isCompleted && completedSession) {
    return (
      <div className="flex flex-col items-start sm:items-end justify-center min-w-[70px]">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
        <div className="flex items-center gap-0.5">
          <span className={cn('text-base font-black', colorVariants[color].text.split(' ')[0])}>
            {typeof completedSession.score === 'number'
              ? completedSession.score.toFixed(1)
              : completedSession.score}
          </span>
          <span className="text-[10px] text-slate-400">/ 9.0</span>
        </div>
      </div>
    );
  }
  if (isResuming) {
    return (
      <div className="flex flex-col gap-1 w-20">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span>Progress</span>
          <span className={colorVariants[color].text.split(' ')[0]}>{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 bg-gradient-to-r',
              PROGRESS_GRADIENTS[color] || PROGRESS_GRADIENTS.indigo
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }
  return null;
}

export function ListActions({
  isLocked,
  isResuming,
  isCompleted,
  test,
  session,
  completedSession,
  color,
}) {
  if (isLocked) {
    return (
      <Link to={createPageUrl('Pricing')} className="w-full sm:w-auto">
        <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl h-10 px-4 text-xs shadow-md transition-all flex items-center justify-center">
          <Crown className="w-3.5 h-3.5 mr-1.5" /> Upgrade
        </Button>
      </Link>
    );
  }
  if (isResuming) {
    return (
      <Link to={`/reading-test/${session.id}`} className="w-full sm:w-auto">
        <Button
          className={cn(
            'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-10 px-4 text-xs shadow-none transition-all flex items-center justify-center gap-1',
            colorVariants[color].button
          )}
        >
          Resume <Play className="w-3 h-3 fill-current" />
        </Button>
      </Link>
    );
  }
  if (isCompleted) {
    return (
      <div className="flex gap-1.5 w-full sm:w-auto">
        <Link
          to={`/reading-test/${completedSession.id}?view-results=true`}
          className="flex-1 sm:flex-initial"
        >
          <Button
            className={cn(
              'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-10 px-4 text-xs shadow-none transition-all flex items-center justify-center gap-1',
              colorVariants[color].button
            )}
          >
            Results <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
        <Link to={`/reading-test?test-id=${test.id}&retake=true`}>
          <Button
            variant="outline"
            className="h-10 w-10 p-0 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <Link to={`/reading-test?test-id=${test.id}`} className="w-full sm:w-auto">
      <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold rounded-xl h-10 px-4 text-xs shadow-md transition-all flex items-center justify-center border-0 gap-1">
        Start Practice <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </Link>
  );
}

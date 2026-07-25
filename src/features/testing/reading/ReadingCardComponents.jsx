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
      <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center shadow-md transform rotate-12">
        <Lock className="w-3.5 h-3.5 text-white" />
      </div>
    );
  }
  if (isResuming) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 border backdrop-blur-md shadow-xs',
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
        <span className="text-[10px] font-bold tracking-wider uppercase">In Progress</span>
      </div>
    );
  }
  if (isCompleted) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 border backdrop-blur-md shadow-xs',
          colorVariants[color].badge
        )}
      >
        <CheckCircle2 className="w-3 h-3" />
        <span className="text-[10px] font-bold tracking-wider uppercase">Completed</span>
      </div>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-600 border-slate-200 dark:border-slate-700 dark:text-slate-300 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-xs"
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
    <div className="mb-4 relative z-10 space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 rounded-md sm:rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300">
            {duration} min
          </span>
        </div>
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 rounded-md sm:rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-2xs">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300">
            {questionCount} Qs
          </span>
        </div>
        {takenCount > 0 && (
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 rounded-md sm:rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-2xs">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300">
              {takenCount} Taken
            </span>
          </div>
        )}
      </div>

      {isResuming && (
        <div className="space-y-2 pt-2 border-t border-slate-100/80 dark:border-white/5">
          <div className="flex justify-between text-[11px] font-bold tracking-wide">
            <span className="text-slate-600 dark:text-slate-400 uppercase text-[10px]">
              Completion
            </span>
            <span className={cn('font-black text-xs', colorVariants[color].text.split(' ')[0])}>
              {progress}%
            </span>
          </div>
          <Progress
            value={progress}
            className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"
            indicatorClassName={cn(
              'bg-gradient-to-r',
              PROGRESS_GRADIENTS[color] || PROGRESS_GRADIENTS.indigo
            )}
          />
        </div>
      )}

      {!isResuming && isCompleted && completedSession?.score !== undefined && (
        <div className="pt-2 border-t border-slate-100/80 dark:border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
              Your Score
            </span>
            <div className="flex items-center gap-1.5">
              <span className={cn('text-xl font-black', colorVariants[color].text.split(' ')[0])}>
                {typeof completedSession.score === 'number'
                  ? completedSession.score.toFixed(1)
                  : completedSession.score}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">/ 9.0</span>
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
      <Link to={createPageUrl('Pricing')} className="block">
        <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg sm:rounded-xl h-9.5 text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]">
          <Crown className="w-4 h-4 mr-1.5" /> Upgrade to Access
        </Button>
      </Link>
    );
  }
  if (isResuming) {
    return (
      <div className="flex gap-2">
        <Link to={`/reading-test/${session.id}`} className="flex-1">
          <Button
            className={cn(
              'w-full bg-white/90 dark:bg-transparent backdrop-blur-md border font-bold rounded-lg sm:rounded-xl h-9.5 text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all active:scale-[0.98]',
              colorVariants[color].button
            )}
          >
            Resume Test <Play className="w-3.5 h-3.5 ml-1.5 fill-current" />
          </Button>
        </Link>
        <Link to={`/reading-test?test-id=${test.id}&retake=true`}>
          <Button
            variant="outline"
            aria-label="Restart test"
            title="Restart test"
            className="h-9.5 px-3.5 rounded-lg sm:rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 backdrop-blur-md active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }
  if (isCompleted) {
    return (
      <div className="flex gap-2">
        <Link to={`/reading-test/${completedSession.id}?view-results=true`} className="flex-1">
          <Button
            className={cn(
              'w-full bg-white/90 dark:bg-transparent backdrop-blur-md border font-bold rounded-lg sm:rounded-xl h-9.5 text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all active:scale-[0.98]',
              colorVariants[color].button
            )}
          >
            View Results <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
        <Link to={`/reading-test?test-id=${test.id}&retake=true`}>
          <Button
            variant="outline"
            className="h-9.5 px-3.5 rounded-lg sm:rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 backdrop-blur-md active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <Link to={`/reading-test?test-id=${test.id}`} className="block">
      <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold rounded-lg sm:rounded-xl h-9.5 text-xs sm:text-sm shadow-md shadow-slate-900/10 dark:shadow-blue-900/30 transition-all hover:scale-[1.01] active:scale-[0.98] border-0">
        Start Practice <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Grouped Volume Card Sub-components
// ---------------------------------------------------------------------------

export function BookProgressBadge({ tests, sessions }) {
  let completed = 0;
  let inProgress = 0;

  tests.forEach((t) => {
    const s = sessions.find((session) => session.passage_id === t.id);
    if (s) {
      if (s.is_completed) {
        completed++;
      } else {
        inProgress++;
      }
    }
  });

  if (completed === tests.length) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5" /> All Done
      </span>
    );
  }

  if (completed > 0 || inProgress > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
        {completed}/{tests.length} Completed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 shrink-0">
      0/{tests.length} Completed
    </span>
  );
}

export function TestRowBadge({ isLocked, isCompleted, isResuming, progress, score }) {
  if (isLocked) {
    return <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
  }
  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
        Band {typeof score === 'number' ? score.toFixed(1) : score}
      </span>
    );
  }
  if (isResuming) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 shrink-0">
        {progress}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9.5px] font-black text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 shrink-0 uppercase tracking-wider">
      New
    </span>
  );
}

export function TestRowAction({ isLocked, isResuming, isCompleted, testSession, test, color }) {
  if (isLocked) {
    return (
      <>
        <Link to={createPageUrl('Pricing')}>
          <Button
            size="sm"
            className="h-6.5 w-[76px] justify-center rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 hover:scale-105 active:scale-95 text-white font-bold text-[10px] shadow-sm flex items-center gap-1 border-0 transition-all duration-200"
          >
            <Crown className="w-2.5 h-2.5" /> Upgrade
          </Button>
        </Link>
        <div className="w-6.5 h-6.5 shrink-0" />
      </>
    );
  }
  if (isResuming) {
    return (
      <>
        <Link to={`/reading-test/${testSession.id}`}>
          <Button
            size="sm"
            className={cn(
              'h-6.5 w-[76px] justify-center rounded-lg font-bold text-[10px] shadow-none flex items-center gap-1 bg-white dark:bg-transparent border hover:scale-105 active:scale-95 transition-all duration-200',
              colorVariants[color].button
            )}
          >
            Resume <Play className="w-2 h-2 fill-current" />
          </Button>
        </Link>
        <Link to={`/reading-test?test-id=${test.id}&retake=true`}>
          <Button
            size="sm"
            variant="outline"
            aria-label="Restart test"
            title="Restart test"
            className="h-6.5 w-6.5 p-0 rounded-lg border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </Button>
        </Link>
      </>
    );
  }
  if (isCompleted) {
    return (
      <>
        <Link to={`/reading-test/${testSession.id}?view-results=true`}>
          <Button
            size="sm"
            className={cn(
              'h-6.5 w-[76px] justify-center rounded-lg font-bold text-[10px] shadow-none flex items-center justify-center gap-1 bg-white dark:bg-transparent border hover:scale-105 active:scale-95 transition-all duration-200',
              colorVariants[color].button
            )}
          >
            Results <ArrowRight className="w-2 h-2" />
          </Button>
        </Link>
        <Link to={`/reading-test?test-id=${test.id}&retake=true`}>
          <Button
            size="sm"
            variant="outline"
            className="h-6.5 w-6.5 p-0 rounded-lg border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </Button>
        </Link>
      </>
    );
  }
  return (
    <>
      <Link to={`/reading-test?test-id=${test.id}`}>
        <Button
          size="sm"
          className="h-6.5 w-[76px] justify-center rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 hover:scale-105 active:scale-95 text-white font-bold text-[10px] shadow-sm flex items-center justify-center gap-1 border-0 transition-all duration-200"
        >
          Start <ChevronRight className="w-2.5 h-2.5" />
        </Button>
      </Link>
      <div className="w-6.5 h-6.5 shrink-0" />
    </>
  );
}

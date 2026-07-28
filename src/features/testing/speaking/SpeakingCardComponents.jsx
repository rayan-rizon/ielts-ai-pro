import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Play, ArrowRight, RotateCcw, ChevronRight, Crown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { getSpeakingColorVariants } from './speakingColorConfig';
import { withLearningActivity } from '@/features/testing/shared/activityContext';

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
      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
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

export function TestRowBadge({ isLocked, isCompleted, isResuming, score }) {
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
        In Progress
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
  const colorVariants = getSpeakingColorVariants(color);

  if (isLocked) {
    return (
      <>
        <Link to="/pricing">
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
        <Link to={withLearningActivity(`/speaking-test/${test.id}`)}>
          <Button
            size="sm"
            className={cn(
              'h-6.5 w-[76px] justify-center rounded-lg font-bold text-[10px] shadow-none flex items-center gap-1 bg-white dark:bg-transparent border hover:scale-105 active:scale-95 transition-all duration-200',
              colorVariants.button
            )}
          >
            Resume <Play className="w-2 h-2 fill-current" />
          </Button>
        </Link>
        <div className="w-6.5 h-6.5 shrink-0" />
      </>
    );
  }
  if (isCompleted) {
    return (
      <>
        <Link to={`/speaking-test/${testSession.id}?view-score=true`}>
          <Button
            size="sm"
            className={cn(
              'h-6.5 w-[76px] justify-center rounded-lg font-bold text-[10px] shadow-none flex items-center justify-center gap-1 bg-white dark:bg-transparent border hover:scale-105 active:scale-95 transition-all duration-200',
              colorVariants.button
            )}
          >
            Results <ArrowRight className="w-2 h-2" />
          </Button>
        </Link>
        <Link to={withLearningActivity(`/speaking-test?test-id=${test.id}&retake=true`)}>
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
      <Link to={withLearningActivity(`/speaking-test?test-id=${test.id}`)}>
        <Button
          size="sm"
          className="h-6.5 w-[76px] justify-center rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 hover:scale-105 active:scale-95 text-white font-bold text-[10px] shadow-sm flex items-center justify-center gap-1 border-0 transition-all duration-200"
        >
          Start <ChevronRight className="w-2.5 h-2.5" />
        </Button>
      </Link>
      <div className="w-6.5 h-6.5 shrink-0" />
    </>
  );
}

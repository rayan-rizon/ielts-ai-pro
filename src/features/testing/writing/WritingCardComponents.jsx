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
import { createPageUrl } from '@/utils';
import { withLearningActivity } from '@/features/testing/shared/activityContext';
import { Bar, MICRO, MUTED, NUM, Pill, TILE } from '@/features/dashboard/components/primitives';

export function WritingStatusBadge({ isLocked, isResuming, isCompleted }) {
  if (isLocked) {
    return (
      <Pill tone="warn">
        <Lock className="h-3 w-3" /> Members only
      </Pill>
    );
  }
  if (isResuming) {
    return (
      <Pill tone="accent">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5a63df]/60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#5a63df]" />
        </span>
        In Progress
      </Pill>
    );
  }
  if (isCompleted) {
    return (
      <Pill tone="ok">
        <CheckCircle2 className="h-3 w-3" /> Completed
      </Pill>
    );
  }
  return <Pill tone="neutral">New Task</Pill>;
}

function MetaTakenPill({ takenCount }) {
  if (takenCount <= 0) return null;
  return (
    <div className={cn(TILE, 'flex items-center gap-1.5 px-2.5 py-1')}>
      <Users className="h-3.5 w-3.5 text-slate-400" />
      <span className={cn(MICRO, 'text-slate-600 dark:text-slate-300')}>{takenCount} Taken</span>
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
}) {
  const displayDuration = duration || 60;
  const displayWordLimit = wordLimit || 400;
  const hasScore = isCompleted && !isResuming && displayScore != null;

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className={cn(TILE, 'flex items-center gap-1.5 px-2.5 py-1')}>
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className={cn(MICRO, 'text-slate-600 dark:text-slate-300')}>
            {displayDuration} min
          </span>
        </div>
        <div className={cn(TILE, 'flex items-center gap-1.5 px-2.5 py-1')}>
          <Target className="h-3.5 w-3.5 text-slate-400" />
          <span className={cn(MICRO, 'text-slate-600 dark:text-slate-300')}>
            {displayWordLimit} Words
          </span>
        </div>
        <MetaTakenPill takenCount={takenCount} />
      </div>

      {isResuming && (
        <div className="space-y-1.5 border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]">
          <div className="flex items-center justify-between">
            <span className={cn(MICRO, MUTED)}>Completion</span>
            <span className={cn(NUM, 'text-xs font-bold text-[#5a63df] dark:text-[#a9afff]')}>
              {progress}%
            </span>
          </div>
          <Bar value={progress} />
        </div>
      )}

      {hasScore && (
        <div className="border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]">
          <div className="flex items-center justify-between">
            <span className={cn(MICRO, MUTED)}>Your score</span>
            <div className="flex items-baseline gap-1.5">
              <span className={cn(NUM, 'text-xl font-extrabold text-slate-900 dark:text-slate-50')}>
                {typeof displayScore === 'number' ? displayScore.toFixed(1) : displayScore}
              </span>
              <span className={cn(MICRO, MUTED)}>/ 9.0</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PRIMARY_BTN =
  'inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all duration-200 ease-smooth-out active:scale-[0.98] cursor-pointer';
const OUTLINE_ICON_BTN = cn(
  TILE,
  'flex h-9 w-9 shrink-0 items-center justify-center text-slate-500 transition-all duration-200 hover:border-[#5a63df]/30 hover:text-[#5a63df] active:scale-[0.98] dark:text-slate-400 dark:hover:border-[#5a63df]/40 dark:hover:text-[#a9afff] cursor-pointer'
);

export function WritingActions({
  isLocked,
  isResuming,
  isCompleted,
  test,
  session,
  completedSessionId,
  feedbackReady,
}) {
  if (isLocked) {
    return (
      <Link to={createPageUrl('Pricing')} className="block">
        <button
          type="button"
          className={cn(PRIMARY_BTN, 'w-full bg-amber-500 text-white hover:bg-amber-600')}
        >
          <Crown className="h-4 w-4" /> Upgrade to Access
        </button>
      </Link>
    );
  }
  if (isResuming) {
    return (
      <div className="flex gap-2">
        <Link to={`/writing-task?sessionId=${session.id}`} className="flex-1">
          <button
            type="button"
            className={cn(PRIMARY_BTN, 'w-full bg-[#5a63df] text-white hover:bg-[#484FB2]')}
          >
            Resume Task <Play className="h-3.5 w-3.5 fill-current" />
          </button>
        </Link>
        <Link to={withLearningActivity(`/writing-task?taskId=${test.id}&new_attempt=true`)}>
          <button type="button" className={OUTLINE_ICON_BTN} aria-label="Restart test">
            <RotateCcw className="h-4 w-4" />
          </button>
        </Link>
      </div>
    );
  }
  if (isCompleted) {
    return (
      <div className="flex gap-2">
        <Link to={`/writing-task?sessionId=${completedSessionId}&view=true`} className="flex-1">
          <button
            type="button"
            className={cn(
              TILE,
              'flex h-9 w-full items-center justify-center gap-1.5 text-xs font-bold text-slate-700 transition-all duration-200 ease-smooth-out hover:-translate-y-0.5 hover:border-[#5a63df]/30 hover:text-[#5a63df] hover:shadow-xs active:scale-[0.98] dark:text-slate-200 dark:hover:border-white/12 cursor-pointer'
            )}
          >
            {feedbackReady ? 'View Feedback' : 'Analyze Response'}{' '}
            <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
        <Link to={withLearningActivity(`/writing-task?taskId=${test.id}&new_attempt=true`)}>
          <button type="button" className={OUTLINE_ICON_BTN} aria-label="Restart test">
            <RotateCcw className="h-4 w-4" />
          </button>
        </Link>
      </div>
    );
  }
  return (
    <Link
      to={withLearningActivity(`/writing-task?taskId=${test.id}&new_attempt=true`)}
      className="block"
    >
      <button
        type="button"
        className={cn(PRIMARY_BTN, 'w-full bg-[#5a63df] text-white hover:bg-[#484FB2]')}
      >
        Start Writing <ChevronRight className="h-4 w-4" />
      </button>
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
      <Pill tone="ok">
        <CheckCircle2 className="h-3 w-3" /> All Done
      </Pill>
    );
  }

  if (completed > 0 || inProgress > 0) {
    return (
      <Pill tone="accent">
        {completed}/{tests.length} Completed
      </Pill>
    );
  }

  return <Pill tone="neutral">0/{tests.length} Completed</Pill>;
}

export function TestRowBadge({ isLocked, isCompleted, isResuming, score, feedbackReady = true }) {
  if (isLocked) {
    return <Lock className="h-3.5 w-3.5 shrink-0 text-amber-500" />;
  }
  if (isCompleted) {
    return (
      <span
        className={cn(
          NUM,
          'shrink-0 rounded bg-[rgb(var(--signal-ok)/0.08)] px-1.5 py-0.5 text-[10px] font-black text-[rgb(var(--signal-ok))]'
        )}
      >
        {feedbackReady && score != null
          ? `Band ${typeof score === 'number' ? score.toFixed(1) : score}`
          : 'Submitted'}
      </span>
    );
  }
  if (isResuming) {
    return (
      <span className="shrink-0 rounded bg-[#5a63df]/8 px-1.5 py-0.5 text-[10px] font-black text-[#5a63df] dark:text-[#a9afff]">
        In Progress
      </span>
    );
  }
  return (
    <span
      className={cn(MICRO, MUTED, 'shrink-0 rounded bg-slate-100 px-1.5 py-0.5 dark:bg-white/5')}
    >
      New
    </span>
  );
}

const ROW_PRIMARY_BTN =
  'flex h-8 w-[92px] shrink-0 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all duration-200 ease-smooth-out active:scale-95 cursor-pointer';
const ROW_ICON_BTN = cn(
  TILE,
  'flex h-8 w-8 shrink-0 items-center justify-center text-slate-500 transition-all duration-200 hover:text-[#5a63df] hover:border-[#5a63df]/35 active:scale-[0.98] dark:text-slate-400 dark:hover:text-[#a9afff] cursor-pointer'
);

export function TestRowAction({
  isLocked,
  isResuming,
  isCompleted,
  testSession,
  test,
  feedbackReady = true,
}) {
  if (isLocked) {
    return (
      <>
        <Link to={createPageUrl('Pricing')}>
          <button
            type="button"
            className={cn(ROW_PRIMARY_BTN, 'bg-amber-500 text-white hover:bg-amber-600')}
          >
            <Crown className="h-3 w-3" /> Upgrade
          </button>
        </Link>
        <div className="h-8 w-8 shrink-0" />
      </>
    );
  }
  if (isResuming) {
    return (
      <>
        <Link to={`/writing-task?sessionId=${testSession.id}`}>
          <button
            type="button"
            className={cn(ROW_PRIMARY_BTN, 'bg-[#5a63df] text-white hover:bg-[#484FB2]')}
          >
            Resume <Play className="h-3 w-3 fill-current" />
          </button>
        </Link>
        <Link to={withLearningActivity(`/writing-task?taskId=${test.id}&new_attempt=true`)}>
          <button type="button" className={ROW_ICON_BTN} aria-label="Restart test">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </Link>
      </>
    );
  }
  if (isCompleted) {
    return (
      <>
        <Link to={`/writing-task?sessionId=${testSession.id}&view=true`}>
          <button
            type="button"
            className={cn(
              TILE,
              'flex h-8 w-[92px] shrink-0 items-center justify-center gap-1.5 rounded-lg text-xs font-bold text-slate-700 transition-all active:scale-95 dark:text-slate-200 cursor-pointer'
            )}
          >
            {feedbackReady ? 'Results' : 'Analyze'} <ArrowRight className="h-3 w-3" />
          </button>
        </Link>
        <Link to={withLearningActivity(`/writing-task?taskId=${test.id}&new_attempt=true`)}>
          <button type="button" className={ROW_ICON_BTN} aria-label="Restart test">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </Link>
      </>
    );
  }
  return (
    <>
      <Link to={withLearningActivity(`/writing-task?taskId=${test.id}&new_attempt=true`)}>
        <button
          type="button"
          className={cn(ROW_PRIMARY_BTN, 'bg-[#5a63df] text-white hover:bg-[#484FB2]')}
        >
          Start <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </Link>
      <div className="h-8 w-8 shrink-0" />
    </>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import {
  Clock,
  HelpCircle,
  ArrowRight,
  Play,
  CheckCircle2,
  Users,
  Lock,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { withLearningActivity } from '@/features/testing/shared/activityContext';
import { Bar, MICRO, MUTED, NUM, Pill, TILE } from '@/features/dashboard/components/primitives';
import {
  LimitReachedButton,
  RetakeLink,
} from '@/features/testing/shared/components/ObjectiveQuotaControls';
import { useQuotaLock } from '@/features/testing/shared/quota/useObjectiveTestQuota';

// ---------------------------------------------------------------------------
// Grid Sub-components
// ---------------------------------------------------------------------------

export function GridStatusBadge({ isLocked, isResuming, isCompleted }) {
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
  return <Pill tone="neutral">New Test</Pill>;
}

export function GridMetaBar({
  duration,
  questionCount,
  takenCount,
  isResuming,
  isCompleted,
  completedSession,
  progress,
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className={cn(TILE, 'flex items-center gap-1.5 px-2.5 py-1')}>
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className={cn(MICRO, 'text-slate-600 dark:text-slate-300')}>{duration} min</span>
        </div>
        <div className={cn(TILE, 'flex items-center gap-1.5 px-2.5 py-1')}>
          <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
          <span className={cn(MICRO, 'text-slate-600 dark:text-slate-300')}>
            {questionCount} Qs
          </span>
        </div>
        {takenCount > 0 && (
          <div className={cn(TILE, 'flex items-center gap-1.5 px-2.5 py-1')}>
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span className={cn(MICRO, 'text-slate-600 dark:text-slate-300')}>
              {takenCount} Taken
            </span>
          </div>
        )}
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

      {!isResuming && isCompleted && completedSession?.score !== undefined && (
        <div className="border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]">
          <div className="flex items-center justify-between">
            <span className={cn(MICRO, MUTED)}>Your score</span>
            <div className="flex items-baseline gap-1.5">
              <span className={cn(NUM, 'text-xl font-extrabold text-slate-900 dark:text-slate-50')}>
                {typeof completedSession.score === 'number'
                  ? completedSession.score.toFixed(1)
                  : completedSession.score}
              </span>
              <span className={cn(MICRO, MUTED)}>/ 9.0</span>
            </div>
          </div>
          {completedSession.paired_room_id && (
            <div className="mt-2 flex items-center gap-1.5">
              <Pill tone="accent">
                <Users className="h-3 w-3" /> Paired session
              </Pill>
              <span className={cn(MICRO, MUTED)}>Comparison ready</span>
            </div>
          )}
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

export function GridActions({
  isLocked,
  isResuming,
  isCompleted,
  test,
  session,
  completedSession,
}) {
  const quotaLock = useQuotaLock('reading');
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
        <Link to={`/reading-test/${session.id}`} className="flex-1">
          <button
            type="button"
            className={cn(PRIMARY_BTN, 'w-full bg-[#5a63df] text-white hover:bg-[#484FB2]')}
          >
            Resume Test <Play className="h-3.5 w-3.5 fill-current" />
          </button>
        </Link>
        <RetakeLink
          test={test}
          path="/reading-test"
          quotaLock={quotaLock}
          buttonClass={OUTLINE_ICON_BTN}
          iconClass="h-4 w-4"
        />
      </div>
    );
  }
  if (isCompleted) {
    const pairedRoomId = completedSession?.paired_room_id;
    const resultsPath = pairedRoomId
      ? `/reading-test/${completedSession.id}?room=${pairedRoomId}`
      : `/reading-test/${completedSession.id}?view-results=true`;
    return (
      <div className="flex gap-2">
        <Link to={resultsPath} className="flex-1">
          <button
            type="button"
            className={cn(
              TILE,
              'flex h-9 w-full items-center justify-center gap-1.5 text-xs font-bold text-slate-700 transition-all duration-200 ease-smooth-out hover:-translate-y-0.5 hover:border-[#5a63df]/30 hover:text-[#5a63df] hover:shadow-xs active:scale-[0.98] dark:text-slate-200 dark:hover:border-white/12 cursor-pointer'
            )}
          >
            {pairedRoomId ? 'Compare Results' : 'View Results'}{' '}
            {pairedRoomId ? <Users className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </button>
        </Link>
        <RetakeLink
          test={test}
          path="/reading-test"
          quotaLock={quotaLock}
          buttonClass={OUTLINE_ICON_BTN}
          iconClass="h-4 w-4"
        />
      </div>
    );
  }
  if (quotaLock.locked) {
    return (
      <LimitReachedButton test={test} quotaLock={quotaLock} className={cn(PRIMARY_BTN, 'w-full')} />
    );
  }
  return (
    <Link to={withLearningActivity(`/reading-test?test-id=${test.id}`)} className="block">
      <button
        type="button"
        className={cn(PRIMARY_BTN, 'w-full bg-[#5a63df] text-white hover:bg-[#484FB2]')}
      >
        Start Practice <ChevronRight className="h-4 w-4" />
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

export function TestRowBadge({ isLocked, isCompleted, isResuming, progress, score }) {
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
        Band {typeof score === 'number' ? score.toFixed(1) : score}
      </span>
    );
  }
  if (isResuming) {
    return (
      <span
        className={cn(
          NUM,
          'shrink-0 rounded bg-[#5a63df]/8 px-1.5 py-0.5 text-[10px] font-black text-[#5a63df] dark:text-[#a9afff]'
        )}
      >
        {progress}%
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
  'flex h-8 w-[92px] shrink-0 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all duration-200 ease-smooth-out active:scale-[0.98] cursor-pointer';
const ROW_ICON_BTN = cn(
  TILE,
  'flex h-8 w-8 shrink-0 items-center justify-center text-slate-500 transition-all duration-200 hover:text-[#5a63df] hover:border-[#5a63df]/35 active:scale-[0.98] dark:text-slate-400 dark:hover:text-[#a9afff] cursor-pointer'
);

export function TestRowAction({ isLocked, isResuming, isCompleted, testSession, test }) {
  const quotaLock = useQuotaLock('reading');
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
        <Link to={`/reading-test/${testSession.id}`}>
          <button
            type="button"
            className={cn(ROW_PRIMARY_BTN, 'bg-[#5a63df] text-white hover:bg-[#484FB2]')}
          >
            Resume <Play className="h-3 w-3 fill-current" />
          </button>
        </Link>
        <RetakeLink
          test={test}
          path="/reading-test"
          quotaLock={quotaLock}
          buttonClass={ROW_ICON_BTN}
          iconClass="h-3.5 w-3.5"
        />
      </>
    );
  }
  if (isCompleted) {
    return (
      <>
        <Link to={`/reading-test/${testSession.id}?view-results=true`}>
          <button
            type="button"
            className={cn(
              TILE,
              'flex h-8 w-[92px] shrink-0 items-center justify-center gap-1.5 rounded-lg text-xs font-bold text-slate-700 transition-all active:scale-95 dark:text-slate-200 cursor-pointer'
            )}
          >
            Results <ArrowRight className="h-3 w-3" />
          </button>
        </Link>
        <RetakeLink
          test={test}
          path="/reading-test"
          quotaLock={quotaLock}
          buttonClass={ROW_ICON_BTN}
          iconClass="h-3.5 w-3.5"
        />
      </>
    );
  }
  if (quotaLock.locked) {
    return (
      <>
        <LimitReachedButton compact test={test} quotaLock={quotaLock} className={ROW_PRIMARY_BTN} />
        <div className="h-8 w-8 shrink-0" />
      </>
    );
  }
  return (
    <>
      <Link to={withLearningActivity(`/reading-test?test-id=${test.id}`)}>
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

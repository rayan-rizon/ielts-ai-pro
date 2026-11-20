import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  MessageSquare,
  Users,
  Lock,
  CheckCircle2,
  Play,
  ArrowRight,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import ObjectiveUpgradeLink from '../shared/components/ObjectiveUpgradeLink';
import { withLearningActivity } from '@/features/testing/shared/activityContext';
import { resolveSpeakingAttemptState } from './speakingCardHelpers';
import { Bar, MICRO, MUTED, NUM, Pill, TILE } from '@/features/dashboard/components/primitives';

// ---------------------------------------------------------------------------
// Grid Sub-components
// ---------------------------------------------------------------------------

function speakingPlanLabel(test) {
  return test?.access_tier === 'premium' ? 'Premium' : 'Pro';
}

export function GridStatusBadge({ test, isLocked, isResuming, isCompleted, needsRestart }) {
  if (isLocked) {
    return (
      <Pill tone="warn">
        <Lock className="h-3 w-3" /> {speakingPlanLabel(test)}
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
  if (needsRestart) {
    // An unfinished session that ran past its resume window.
    return <Pill tone="warn">Session expired</Pill>;
  }
  return <Pill tone="neutral">Not started</Pill>;
}

function displaySpeakingScore(value) {
  if (value == null || value === '') return null;
  // Keep imported string projections as displayed in the grid.
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return { grid: typeof value === 'number' ? numeric.toFixed(1) : value, row: numeric.toFixed(1) };
}

function SpeakingGridProgress({ progress }) {
  return (
    <div className="space-y-1.5 border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]">
      <div className="flex items-center justify-between">
        <span className={cn(MICRO, MUTED)}>Completion</span>
        <span className={cn(NUM, 'text-xs font-bold text-[#5a63df] dark:text-[#a9afff]')}>
          {progress}%
        </span>
      </div>
      <Bar value={progress} />
    </div>
  );
}

function SpeakingGridScore({ value }) {
  const score = displaySpeakingScore(value);
  if (!score) return <p className={cn(MICRO, MUTED)}>Score not available</p>;
  return (
    <div className="border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]">
      <div className="flex items-center justify-between">
        <span className={cn(MICRO, MUTED)}>Your score</span>
        <div className="flex items-baseline gap-1.5">
          <span className={cn(NUM, 'text-xl font-extrabold text-slate-900 dark:text-slate-50')}>
            {score.grid}
          </span>
          <span className={cn(MICRO, MUTED)}>/ 9.0</span>
        </div>
      </div>
    </div>
  );
}

export function GridMetaBar({
  duration,
  takenCount,
  isResuming,
  isCompleted,
  displayScore,
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
          <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
          <span className={cn(MICRO, 'text-slate-600 dark:text-slate-300')}>3 Parts</span>
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

      {isResuming && <SpeakingGridProgress progress={progress} />}
      {isCompleted && <SpeakingGridScore value={displayScore} />}
    </div>
  );
}

const PRIMARY_BTN =
  'inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all duration-200 ease-smooth-out active:scale-[0.98] cursor-pointer';
const OUTLINE_ICON_BTN = cn(
  TILE,
  'flex h-9 w-9 shrink-0 items-center justify-center text-slate-500 transition-all duration-200 hover:border-[#5a63df]/30 hover:text-[#5a63df] active:scale-[0.98] dark:text-slate-400 dark:hover:border-[#5a63df]/40 dark:hover:text-[#a9afff] cursor-pointer'
);

function SpeakingRestartAction({ test, compact = false }) {
  if (test.upgradeForAllowance) return null;
  return (
    <Link to={withLearningActivity(`/speaking-test?test-id=${test.id}&retake=true`)}>
      <button
        type="button"
        className={compact ? ROW_ICON_BTN : OUTLINE_ICON_BTN}
        aria-label="Restart test"
      >
        <RotateCcw className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </button>
    </Link>
  );
}

export function GridActions({ completedSessionId, ...props }) {
  return <SpeakingButtons {...props} sessionId={completedSessionId} />;
}

// ---------------------------------------------------------------------------
// Grouped Volume Card Sub-components
// ---------------------------------------------------------------------------

export function BookProgressBadge({ tests, sessions }) {
  const attempts = tests.map((test) =>
    resolveSpeakingAttemptState(sessions.find((session) => session.passage_id === test.id))
  );
  const completed = attempts.filter((attempt) => attempt.isCompleted).length;
  if (completed === tests.length) {
    return (
      <Pill tone="ok">
        <CheckCircle2 className="h-3 w-3" /> All Done
      </Pill>
    );
  }

  const hasProgress = attempts.some((attempt) => attempt.isCompleted || attempt.isResuming);
  return (
    <Pill tone={hasProgress ? 'accent' : 'neutral'}>
      {completed}/{tests.length} Completed
    </Pill>
  );
}

export function TestRowBadge({ isLocked, isCompleted, isResuming, score }) {
  if (isLocked) {
    return <Lock className="h-3.5 w-3.5 shrink-0 text-amber-500" />;
  }
  if (isCompleted) {
    const band = displaySpeakingScore(score);
    return (
      <span
        className={cn(
          NUM,
          'shrink-0 rounded bg-[rgb(var(--signal-ok)/0.08)] px-1.5 py-0.5 text-[10px] font-extrabold text-[rgb(var(--signal-ok))]'
        )}
      >
        {band ? `Band ${band.row}` : 'Score not available'}
      </span>
    );
  }
  if (isResuming) {
    return (
      <span className="shrink-0 rounded bg-[#5a63df]/8 px-1.5 py-0.5 text-[10px] font-extrabold text-[#5a63df] dark:text-[#a9afff]">
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

function getSpeakingAction({ test, sessionId, isResuming, isCompleted, needsRestart }) {
  if (isResuming) {
    return {
      label: 'Resume Test',
      shortLabel: 'Resume',
      to: withLearningActivity(`/speaking-test/${test.id}`),
      Icon: Play,
    };
  }
  if (isCompleted) {
    return {
      label: 'View Feedback',
      shortLabel: 'Results',
      to: `/speaking-test/${sessionId}?view-score=true`,
      Icon: ArrowRight,
    };
  }
  const base = `/speaking-test?test-id=${test.id}`;
  if (needsRestart) {
    return {
      label: 'Start again',
      shortLabel: 'Start again',
      to: withLearningActivity(`${base}&retake=true`),
      Icon: RotateCcw,
    };
  }
  return {
    label: 'Start test',
    shortLabel: 'Start',
    to: withLearningActivity(base),
    Icon: ChevronRight,
  };
}

function SpeakingButtons({
  test,
  sessionId,
  isLocked,
  isResuming,
  isCompleted,
  needsRestart,
  compact,
}) {
  if (isLocked) return <ObjectiveUpgradeLink test={test} compact={compact} />;

  const { label, shortLabel, to, Icon } = getSpeakingAction({
    test,
    sessionId,
    isResuming,
    isCompleted,
    needsRestart,
  });
  const actionClass = cn(
    compact ? ROW_PRIMARY_BTN : cn(PRIMARY_BTN, 'w-full'),
    isCompleted
      ? cn(TILE, 'text-slate-700 dark:text-slate-200')
      : 'bg-[#5a63df] text-white hover:bg-[#484FB2]'
  );

  return (
    <div className="flex items-center gap-2">
      <Link to={to} className="flex-1">
        <button type="button" className={actionClass}>
          {compact ? shortLabel : label} <Icon className="h-3.5 w-3.5" />
        </button>
      </Link>
      {(isResuming || isCompleted) && <SpeakingRestartAction test={test} compact={compact} />}
    </div>
  );
}

export function TestRowAction({ testSession, ...props }) {
  return <SpeakingButtons {...props} sessionId={testSession?.id} compact />;
}

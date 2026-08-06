import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronRight, Crown, Lock, Play, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import {
  Bar,
  MICRO,
  MUTED,
  NUM,
  Pill,
  TILE,
  WELL,
} from '@/features/dashboard/components/primitives';
import { formatBand, routes, testNumber, volumeNumber } from './helpers';

// ---------------------------------------------------------------------------
// Identity — replaces the decorative icon chip that was identical on every card
// ---------------------------------------------------------------------------

/**
 * Numeral tile: the card's hierarchy anchor. Cambridge papers show their volume,
 * everything else shows the test number. Mono tabular numerals, same treatment
 * as the dashboard's Cambridge card, so a wall of cards scans by number rather
 * than by a repeated generic book/headphone glyph.
 */
export function TestNumeralTile({ test }) {
  const vol = volumeNumber(test);
  const num = testNumber(test);
  const caption = vol ? 'VOL' : 'TEST';
  const value = vol ?? num ?? '—';

  return (
    <div
      className={cn(
        WELL,
        'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md'
      )}
    >
      <span
        className={cn(
          MICRO,
          'text-[8px] font-extrabold leading-none text-[#5a63df] dark:text-[#a9afff]'
        )}
      >
        {caption}
      </span>
      <span
        className={cn(
          NUM,
          'mt-0.5 text-sm font-extrabold leading-none text-slate-900 dark:text-slate-50'
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function StatusBadge({ isLocked, isResuming, isCompleted }) {
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
        In progress
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
  return null;
}

// ---------------------------------------------------------------------------
// Movement — the only genuinely varying per-card data
// ---------------------------------------------------------------------------

/**
 * Renders band score (completed) or a progress meter (in progress). Returns
 * null for a fresh test rather than drawing an empty well — no data is not a
 * state worth spending vertical space on.
 */
export function TestProgressStrip({ isResuming, isCompleted, progress, completedSession }) {
  if (isResuming) {
    return (
      <div className="space-y-1.5">
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

  if (isCompleted) {
    const band = formatBand(completedSession?.score);
    if (!band) {
      return <span className={cn(MICRO, MUTED)}>Score unavailable</span>;
    }
    return (
      <div className="flex items-baseline justify-between">
        <span className={cn(MICRO, MUTED)}>Band achieved</span>
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              NUM,
              'text-xl font-extrabold leading-none text-slate-900 dark:text-slate-50'
            )}
          >
            {band}
          </span>
          <span className={cn(MICRO, MUTED)}>/ 9.0</span>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Spec footnote. Duration and question count are near-constant across the whole
 * library (reading is always 60m/40Q), so they read as chrome, not data — they
 * belong on one quiet hairline row, not in three prominent chips. Each segment
 * is omitted entirely when its value is missing, so the card never prints
 * "undefined min" or a meaningless "0 Qs".
 */
export function TestSpecFootnote({ duration, questionCount, takenCount, className }) {
  const parts = [];
  if (duration) parts.push(`${duration} min`);
  if (questionCount) parts.push(`${questionCount} questions`);
  if (takenCount > 0) parts.push(`${takenCount.toLocaleString()} attempts`);
  if (parts.length === 0) return null;

  return (
    <p className={cn(MICRO, MUTED, 'flex flex-wrap items-center gap-x-1.5 gap-y-1', className)}>
      {parts.map((part, i) => (
        <React.Fragment key={part}>
          {i > 0 && (
            <span aria-hidden="true" className="opacity-40">
              ·
            </span>
          )}
          <span className={NUM}>{part}</span>
        </React.Fragment>
      ))}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

const PRIMARY_BTN =
  'inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all active:scale-[0.98]';
const ICON_BTN = cn(
  TILE,
  'flex h-8 w-8 shrink-0 items-center justify-center text-slate-500 transition-all hover:border-[#5a63df]/30 hover:text-[#5a63df] active:scale-[0.98] dark:text-slate-400 dark:hover:border-[#5a63df]/40 dark:hover:text-[#a9afff]'
);
const ACCENT_BTN = 'bg-[#5a63df] text-white hover:bg-[#484FB2]';

export function TestCardActions({
  skill,
  isLocked,
  isResuming,
  isCompleted,
  test,
  session,
  completedSession,
}) {
  if (isLocked) {
    return (
      <Link to={createPageUrl('Pricing')} className="block">
        <button
          type="button"
          className={cn(PRIMARY_BTN, 'bg-amber-500 hover:bg-amber-600 text-white')}
        >
          <Crown className="h-3.5 w-3.5" /> Upgrade to access
        </button>
      </Link>
    );
  }

  if (isResuming) {
    return (
      <div className="flex gap-1.5">
        <Link to={routes.resume(skill, session.id)} className="flex-1">
          <button type="button" className={cn(PRIMARY_BTN, ACCENT_BTN)}>
            Resume Test <Play className="h-3 w-3 fill-current" />
          </button>
        </Link>
        <Link to={routes.retake(skill, test.id)}>
          <button type="button" className={ICON_BTN} aria-label="Restart test">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex gap-1.5">
        <Link to={routes.results(skill, completedSession.id)} className="flex-1">
          <button
            type="button"
            className={cn(
              PRIMARY_BTN,
              TILE,
              'text-slate-700 hover:border-[#5a63df]/30 hover:text-[#5a63df] dark:text-slate-200 dark:hover:border-[#5a63df]/40 dark:hover:text-[#a9afff]'
            )}
          >
            View results <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </Link>
        <Link to={routes.retake(skill, test.id)}>
          <button type="button" className={ICON_BTN} aria-label="Retake test">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>
    );
  }

  return (
    <Link to={routes.start(skill, test.id)} className="block">
      <button type="button" className={cn(PRIMARY_BTN, ACCENT_BTN)}>
        Start practice <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Grouped (list-view) row parts
// ---------------------------------------------------------------------------

export function BookProgressBadge({ tests, sessions }) {
  const completed = tests.filter(
    (t) => sessions.find((s) => s.passage_id === t.id)?.is_completed
  ).length;

  if (tests.length > 0 && completed === tests.length) {
    return (
      <Pill tone="ok">
        <CheckCircle2 className="h-3 w-3" /> All done
      </Pill>
    );
  }
  return (
    <Pill tone={completed > 0 ? 'accent' : 'neutral'}>
      <span className={NUM}>
        {completed}/{tests.length}
      </span>
    </Pill>
  );
}

export function TestRowBadge({ isLocked, isCompleted, isResuming, progress, score }) {
  if (isLocked) return <Lock className="h-3.5 w-3.5 shrink-0 text-amber-500" />;

  if (isCompleted) {
    const band = formatBand(score);
    return (
      <span
        className={cn(
          NUM,
          'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black',
          band
            ? 'bg-[rgb(var(--signal-ok)/0.10)] text-[rgb(var(--signal-ok))]'
            : 'bg-slate-100 text-slate-500 dark:bg-white/6 dark:text-slate-400'
        )}
      >
        {band ? `Band ${band}` : 'Done'}
      </span>
    );
  }

  if (isResuming) {
    return (
      <span
        className={cn(
          NUM,
          'shrink-0 rounded bg-[#5a63df]/10 px-1.5 py-0.5 text-[10px] font-black text-[#5a63df] dark:text-[#a9afff]'
        )}
      >
        {progress}%
      </span>
    );
  }

  return null;
}

const ROW_BTN =
  'flex h-7 w-[76px] shrink-0 items-center justify-center gap-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all active:scale-95';
const ROW_ICON_BTN = cn(
  TILE,
  'flex h-7 w-7 shrink-0 items-center justify-center text-slate-500 transition-all active:scale-95 dark:text-slate-400'
);

/** Keeps single-button rows aligned with the two-button (resume/retake) rows. */
const RowSpacer = () => <div className="h-7 w-7 shrink-0" aria-hidden="true" />;

export function TestRowAction({ skill, isLocked, isResuming, isCompleted, testSession, test }) {
  if (isLocked) {
    return (
      <>
        <Link to={createPageUrl('Pricing')}>
          <button
            type="button"
            className={cn(ROW_BTN, 'bg-amber-500 text-white hover:bg-amber-600')}
          >
            <Crown className="h-3 w-3" /> Pro
          </button>
        </Link>
        <RowSpacer />
      </>
    );
  }

  if (isResuming) {
    return (
      <>
        <Link to={routes.resume(skill, testSession.id)}>
          <button type="button" className={cn(ROW_BTN, ACCENT_BTN)}>
            Resume
          </button>
        </Link>
        <Link to={routes.retake(skill, test.id)}>
          <button type="button" className={ROW_ICON_BTN} aria-label="Restart test">
            <RotateCcw className="h-3 w-3" />
          </button>
        </Link>
      </>
    );
  }

  if (isCompleted) {
    return (
      <>
        <Link to={routes.results(skill, testSession.id)}>
          <button type="button" className={cn(ROW_BTN, TILE, 'text-slate-700 dark:text-slate-200')}>
            Results
          </button>
        </Link>
        <Link to={routes.retake(skill, test.id)}>
          <button type="button" className={ROW_ICON_BTN} aria-label="Retake test">
            <RotateCcw className="h-3 w-3" />
          </button>
        </Link>
      </>
    );
  }

  return (
    <>
      <Link to={routes.start(skill, test.id)}>
        <button type="button" className={cn(ROW_BTN, ACCENT_BTN)}>
          Start
        </button>
      </Link>
      <RowSpacer />
    </>
  );
}

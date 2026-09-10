import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatBand } from '@/lib/format';
import {
  FootNum,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  ROW_CHEVRON,
  ROW_HOVER,
  WELL,
} from './primitives';

/**
 * Writing submissions live under /writing-task, not /writing-test — deriving the
 * path from the module name alone silently 404s that row.
 */
const RESULT_ROUTE = {
  reading: 'reading-test',
  listening: 'listening-test',
  speaking: 'speaking-test',
  writing: 'writing-task',
};

// Six, not five: the log sits in a wide slot and pairs into two columns, so an
// odd count would leave a hole at the bottom right.
const VISIBLE = 6;

const STARTER_PAPERS = [
  {
    id: 'starter-reading',
    module: 'reading',
    title: 'Academic Reading · Diagnostic Set',
    minutes: 15,
    tag: 'Quick Start',
    href: '/reading-test',
    detail: '1 passage · 13 questions · instant band score',
  },
  {
    id: 'starter-listening',
    module: 'listening',
    title: 'Listening Section 1 · Everyday Social',
    minutes: 10,
    tag: 'Audio',
    href: '/listening-test',
    detail: '1 audio track · 10 questions · note strategy',
  },
  {
    id: 'starter-writing',
    module: 'writing',
    title: 'Writing Task 2 · Essay Prompt',
    minutes: 40,
    tag: 'AI Feedback',
    href: '/writing-task',
    detail: 'Detailed band 9 scoring across all 4 criteria',
  },
  {
    id: 'starter-speaking',
    module: 'speaking',
    title: 'Speaking Part 1 · Interview Flow',
    minutes: 5,
    tag: 'Fluency',
    href: '/speaking-test',
    detail: 'AI speech coach · pronunciation & speed check',
  },
];

function buildResultHref(module, testId) {
  if (module === 'writing') {
    return `/writing-task?sessionId=${testId}&view=true`;
  }
  const route = RESULT_ROUTE[module];
  return route ? `/${route}/${testId}?view-results=true` : null;
}

function formatMinutes(durationSeconds) {
  const seconds = Number(durationSeconds);
  return Number.isFinite(seconds) && seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : null;
}

function formatDateLabel(completedAt) {
  if (!completedAt) return null;
  return new Date(completedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function mapSingleTest(test) {
  const module = String(test.test_type || '').toLowerCase();
  return {
    id: test.id,
    module,
    score: Number(test.score),
    minutes: formatMinutes(test.duration_seconds),
    title: test.passage?.title || null,
    dateLabel: formatDateLabel(test.completed_at),
    href: buildResultHref(module, test.id),
  };
}

function parseSessionRows(recentTests) {
  const scored = (Array.isArray(recentTests) ? recentTests : []).filter((test) =>
    Number.isFinite(Number(test?.score))
  );

  const rows = scored.slice(0, VISIBLE).map(mapSingleTest);
  const average = rows.length
    ? rows.reduce((sum, test) => sum + Number(test.score), 0) / rows.length
    : null;

  return { rows, average };
}

function StarterPapersList() {
  return (
    <div className="grid flex-1 grid-cols-1 content-start gap-1.5 lg:grid-cols-2">
      {STARTER_PAPERS.map((starter) => (
        <Link
          key={starter.id}
          to={starter.href}
          className={cn(
            'group flex items-center gap-3 rounded-lg border border-transparent p-2 transition-all duration-150',
            ROW_HOVER
          )}
        >
          <div
            className={cn(
              WELL,
              'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md border border-[#e4e2f0] dark:border-white/10'
            )}
          >
            <span
              className={cn(
                NUM,
                'text-xs font-bold leading-none text-slate-900 dark:text-slate-50'
              )}
            >
              {starter.minutes}
            </span>
            <span
              className={cn(MICRO, 'text-[8px] leading-none text-[#5a63df] dark:text-[#afb5ff]')}
            >
              min
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[12px] font-extrabold leading-tight text-slate-800 transition-colors group-hover:text-[#5a63df] dark:text-slate-100 dark:group-hover:text-[#afb5ff]">
                {starter.title}
              </span>
            </div>
            <p className={cn(MICRO, MUTED, 'mt-1')}>{starter.detail}</p>
          </div>

          <ChevronRight className={cn('h-3.5 w-3.5 shrink-0', ROW_CHEVRON)} />
        </Link>
      ))}
    </div>
  );
}

function SessionRowItem({ row }) {
  const body = (
    <>
      <div
        className={cn(
          WELL,
          'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md'
        )}
      >
        <span
          className={cn(NUM, 'text-sm font-bold leading-none text-slate-900 dark:text-slate-50')}
        >
          {formatBand(row.score)}
        </span>
        <span className={cn(MICRO, 'text-[8px] leading-none text-[#5a63df]')}>Band</span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-extrabold capitalize leading-tight text-slate-800 dark:text-slate-100">
          {row.title || `${row.module} test`}
        </p>
        <p className={cn(MICRO, MUTED, 'mt-1')}>
          <span className="capitalize">{row.module}</span>
          {row.dateLabel ? ` · ${row.dateLabel}` : ''}
          {row.minutes && (
            <>
              {' · '}
              <span className={NUM}>{row.minutes}</span>m
            </>
          )}
        </p>
      </div>

      {row.href && <ChevronRight className={cn('h-3.5 w-3.5', ROW_CHEVRON)} />}
    </>
  );

  const className =
    'group flex items-center gap-3 rounded-lg border border-transparent p-2 transition-all duration-150';

  if (!row.href) {
    return <div className={className}>{body}</div>;
  }

  return (
    <Link to={row.href} className={cn(className, ROW_HOVER)}>
      {body}
    </Link>
  );
}

function SessionRowsList({ rows }) {
  return (
    <div className="grid flex-1 grid-cols-1 content-start gap-1.5 lg:grid-cols-2">
      {rows.map((row) => (
        <SessionRowItem key={row.id} row={row} />
      ))}
    </div>
  );
}

/**
 * The last few attempts, each one click from its marked paper. A score with no
 * route back to the questions that produced it is a number a student can't act
 * on — the review link is the point of this panel, not the band.
 */
const SessionLog = React.memo(({ recentTests }) => {
  const { rows, average } = useMemo(() => parseSessionRows(recentTests), [recentTests]);
  const hasRows = rows.length > 0;

  return (
    <div className={cn(PANEL, 'flex h-full flex-col p-4')}>
      <PanelTitle
        label={hasRows ? 'Recent attempts' : 'Starter tests'}
        tip={
          hasRows
            ? 'Your latest scored sessions. Open one to re-read the marked paper.'
            : 'Curated papers ready to sit. Choose any module to begin your practice.'
        }
        action={
          <span className={cn(MICRO, MUTED)}>{hasRows ? 'select to review' : 'ready to sit'}</span>
        }
      />

      {hasRows ? <SessionRowsList rows={rows} /> : <StarterPapersList />}

      <PanelFootnote>
        {average != null ? (
          <>
            <FootNum>{average.toFixed(1)}</FootNum> average across the last{' '}
            <FootNum>{rows.length}</FootNum>
          </>
        ) : (
          <>start any paper above to build your review log</>
        )}
      </PanelFootnote>
    </div>
  );
});

SessionLog.displayName = 'SessionLog';

export default SessionLog;

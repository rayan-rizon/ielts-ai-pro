import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, History } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatBand } from '@/lib/format';
import {
  Empty,
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

/**
 * The last few attempts, each one click from its marked paper. A score with no
 * route back to the questions that produced it is a number a student can't act
 * on — the review link is the point of this panel, not the band.
 */
const SessionLog = React.memo(({ recentTests }) => {
  const { rows, average } = useMemo(() => {
    const scored = (Array.isArray(recentTests) ? recentTests : []).filter((test) =>
      Number.isFinite(Number(test?.score))
    );

    const mapped = scored.slice(0, VISIBLE).map((test) => {
      const module = String(test.test_type || '').toLowerCase();
      const route = RESULT_ROUTE[module];
      const durationSeconds = Number(test.duration_seconds);
      return {
        id: test.id,
        module,
        score: Number(test.score),
        minutes:
          Number.isFinite(durationSeconds) && durationSeconds > 0
            ? Math.max(1, Math.round(durationSeconds / 60))
            : null,
        title: test.passage?.title || null,
        dateLabel: test.completed_at
          ? new Date(test.completed_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })
          : null,
        href:
          module === 'writing'
            ? `/writing-task?sessionId=${test.id}&view=true`
            : route
              ? `/${route}/${test.id}?view-results=true`
              : null,
      };
    });

    return {
      rows: mapped,
      average: mapped.length
        ? mapped.reduce((sum, test) => sum + Number(test.score), 0) / mapped.length
        : null,
    };
  }, [recentTests]);

  return (
    <div className={cn(PANEL, 'flex h-full flex-col p-4')}>
      <PanelTitle
        label="Recent attempts"
        tip="Your latest scored sessions. Open one to re-read the marked paper."
        action={<span className={cn(MICRO, MUTED)}>tap to review</span>}
      />

      {rows.length === 0 ? (
        <Empty icon={History} className="flex-1 content-center">
          No completed tests yet — finished papers land here for review.
        </Empty>
      ) : (
        <div className="grid flex-1 grid-cols-1 content-start gap-1.5 lg:grid-cols-2">
          {rows.map((row) => {
            const body = (
              <>
                <div
                  className={cn(
                    WELL,
                    'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md'
                  )}
                >
                  <span
                    className={cn(
                      NUM,
                      'text-sm font-bold leading-none text-slate-900 dark:text-slate-50'
                    )}
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
                    {row.minutes ? ` · ${row.minutes}m` : ''}
                  </p>
                </div>

                {row.href ? <ChevronRight className={cn('h-3.5 w-3.5', ROW_CHEVRON)} /> : null}
              </>
            );

            const className =
              'group flex items-center gap-3 rounded-lg border border-transparent p-2 transition-all duration-150';

            // A session whose module has no results route still lists — it just
            // isn't a link, rather than a link that goes nowhere.
            return row.href ? (
              <Link key={row.id} to={row.href} className={cn(className, ROW_HOVER)}>
                {body}
              </Link>
            ) : (
              <div key={row.id} className={className}>
                {body}
              </div>
            );
          })}
        </div>
      )}

      <PanelFootnote>
        {average != null ? (
          <>
            <FootNum>{average.toFixed(1)}</FootNum> average across the last{' '}
            <FootNum>{rows.length}</FootNum>
          </>
        ) : (
          <>finish a test to start the log</>
        )}
      </PanelFootnote>
    </div>
  );
});

SessionLog.displayName = 'SessionLog';

export default SessionLog;

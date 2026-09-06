import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import {
  ACCENT_FILL,
  ACCENT_FILL_HOVER,
  Delta,
  Empty,
  FootNum,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PANEL_LINK,
  PanelFootnote,
  PanelTitle,
  Tip,
  WELL,
} from './primitives';

const MODULES = [
  { key: 'reading', label: 'Reading', page: 'Reading' },
  { key: 'listening', label: 'Listening', page: 'Listening' },
  { key: 'writing', label: 'Writing', page: 'Writing' },
  { key: 'speaking', label: 'Speaking', page: 'Speaking' },
];

// get_recent_sessions returns `test_type`, not `module` — keying off the wrong
// field left every row's delta permanently null.
function latestByModule(recentTests) {
  if (!Array.isArray(recentTests)) return {};
  const out = {};
  for (const test of recentTests) {
    if (!test?.test_type) continue;
    const key = String(test.test_type).toLowerCase();
    if (!out[key]) out[key] = test;
  }
  return out;
}

/**
 * The four modules as horizontal meters — name, fill, and exact band in one
 * row. Replaces the old "Practice Modules", "Recent Performance" and "Skill
 * Matrix" cards, which plotted the same four module averages three ways.
 */
const ModuleMeters = React.memo(({ stats, recentTests, quickLaunchRef, onboardingHighlight }) => {
  const averages = stats?.moduleAverages || {};
  const latest = useMemo(() => latestByModule(recentTests), [recentTests]);

  const rows = MODULES.map((module) => {
    const hasAverage = Object.prototype.hasOwnProperty.call(averages, module.key);
    const raw = Number(averages[module.key]);
    const avg = hasAverage && Number.isFinite(raw) && raw >= 0 ? raw : null;
    const latestScore = latest[module.key]?.score != null ? Number(latest[module.key].score) : null;
    return {
      ...module,
      avg,
      latestScore,
      delta: avg != null && latestScore != null ? latestScore - avg : null,
    };
  });

  const scored = rows.filter((row) => row.avg != null);
  const spread =
    scored.length >= 2
      ? Math.max(...scored.map((r) => r.avg)) - Math.min(...scored.map((r) => r.avg))
      : null;

  return (
    <div
      ref={quickLaunchRef}
      className={cn(
        PANEL,
        'flex h-full flex-col p-4',
        onboardingHighlight === 'quick' &&
          'ring-2 ring-[#5a63df] ring-offset-2 dark:ring-offset-[#08080a]'
      )}
    >
      <PanelTitle
        label="Band by module"
        accent
        tip="Your average band per module, out of 9."
        action={
          <Link to={createPageUrl('Analytics')} className={cn(MICRO, PANEL_LINK)}>
            Analytics <ChevronRight className="h-3 w-3" />
          </Link>
        }
      />

      {scored.length === 0 ? (
        <Empty>
          No scored modules yet — complete a test to start this chart.
          <Link
            to={createPageUrl('Reading')}
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#5a63df] hover:underline"
          >
            Start Reading test →
          </Link>
        </Empty>
      ) : (
        // Four rows against a three-item neighbour left a void at the bottom of
        // the card; spreading them keeps the row heights honest and the panel full.
        <div className="flex flex-1 flex-col justify-between gap-2 py-0.5">
          {rows.map((row) => (
            <Tip
              key={row.key}
              content={
                row.avg != null
                  ? `${row.label} — band ${row.avg.toFixed(1)} average${
                      row.latestScore != null ? `, latest ${row.latestScore.toFixed(1)}` : ''
                    }`
                  : `${row.label} — not taken yet`
              }
            >
              <Link
                to={createPageUrl(row.page)}
                className="group flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#08080a]"
              >
                <div className={cn('relative h-8 flex-1 overflow-hidden rounded-md', WELL)}>
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-md transition-all duration-700',
                      ACCENT_FILL,
                      ACCENT_FILL_HOVER
                    )}
                    style={{ width: `${row.avg != null ? (row.avg / 9) * 100 : 0}%` }}
                  />
                  <div className="relative flex h-full items-center justify-between px-3">
                    <span className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
                      {row.label}
                    </span>
                    {row.delta != null ? (
                      <Delta value={row.delta} />
                    ) : row.avg == null ? (
                      <span className={cn(MICRO, MUTED)}>not taken</span>
                    ) : null}
                  </div>
                </div>
                <span
                  className={cn(
                    NUM,
                    'w-9 shrink-0 text-right text-sm font-bold',
                    row.avg != null
                      ? 'text-slate-900 dark:text-slate-50'
                      : 'text-slate-400 dark:text-slate-500'
                  )}
                >
                  {row.avg != null ? row.avg.toFixed(1) : '—'}
                </span>
              </Link>
            </Tip>
          ))}
        </div>
      )}

      <PanelFootnote>
        {spread != null ? (
          <>
            <FootNum>{spread.toFixed(1)}</FootNum> band between strongest and weakest
          </>
        ) : (
          <>score two modules to compare them</>
        )}
      </PanelFootnote>
    </div>
  );
});

ModuleMeters.displayName = 'ModuleMeters';

export default ModuleMeters;

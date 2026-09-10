import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import { roundOverallBand } from '@/features/core/components/calculator/calculatorData';
import {
  FootNum,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PANEL_LINK,
  PanelFootnote,
  PanelTitle,
  Pill,
  WELL,
} from './primitives';

const MODULES = [
  { key: 'listening', short: 'L', label: 'Listening', page: 'Listening' },
  { key: 'reading', short: 'R', label: 'Reading', page: 'Reading' },
  { key: 'writing', short: 'W', label: 'Writing', page: 'Writing' },
  { key: 'speaking', short: 'S', label: 'Speaking', page: 'Speaking' },
];

/**
 * The number on the certificate.
 *
 * The stat band's "Band average" is the mean of every scored *session*, so a
 * learner who sits twelve Reading papers and one Speaking test sees a figure
 * weighted towards Reading — that is not how IELTS is reported. The overall
 * band is the mean of the four module scores, each counted once, rounded to
 * the nearest half band (`roundOverallBand`, shared with the public band
 * calculator so both surfaces agree).
 *
 * Because the calculation only holds when all four modules exist, a partial
 * set is labelled as provisional and names what is missing rather than
 * quietly averaging three modules and presenting the result as an overall.
 */
const OverallBandPanel = React.memo(({ stats }) => {
  const model = useMemo(() => {
    const averages = stats?.moduleAverages || {};

    const rows = MODULES.map((module) => {
      const raw = Number(averages[module.key]);
      return {
        ...module,
        band: Number.isFinite(raw) && raw > 0 ? raw : null,
      };
    });

    const scored = rows.filter((row) => row.band != null);
    const mean =
      scored.length > 0 ? scored.reduce((sum, row) => sum + row.band, 0) / scored.length : null;
    const target = Number(stats?.targetScore);

    return {
      rows,
      scored,
      mean,
      overall: mean != null ? roundOverallBand(mean) : null,
      complete: scored.length === MODULES.length,
      missing: rows.filter((row) => row.band == null).map((row) => row.key),
      target: Number.isFinite(target) && target > 0 ? target : null,
    };
  }, [stats]);

  const { rows, scored, overall, mean, complete, missing, target } = model;
  const gap = overall != null && target != null ? Math.max(0, target - overall) : null;

  return (
    <div className={cn(PANEL, 'flex h-full flex-col p-4')}>
      <PanelTitle
        label="Overall band"
        accent
        tip="The mean of your four module bands, each counted once, rounded to the nearest half band — the way IELTS reports it. Not the same as the session average above."
        action={
          <Pill tone={overall != null ? (complete ? 'accent' : 'warn') : 'neutral'}>
            {complete ? 'all 4 modules' : `${scored.length} of 4`}
          </Pill>
        }
      />

      <div className="flex flex-1 flex-col justify-between gap-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  NUM,
                  'text-[40px] font-extrabold leading-none',
                  overall != null
                    ? 'text-slate-900 dark:text-slate-50'
                    : 'text-slate-400 dark:text-slate-500'
                )}
              >
                {overall != null ? overall.toFixed(1) : '—'}
              </span>
              <span className={cn(MICRO, MUTED)}>/ 9</span>
            </div>
            <p className={cn(MICRO, MUTED, 'mt-2')}>
              {mean != null ? (
                <>
                  from a <FootNum>{mean.toFixed(2)}</FootNum> mean
                </>
              ) : (
                'awaiting module scores'
              )}
            </p>
          </div>

          {target != null ? (
            <div className="shrink-0 text-right">
              <p className={cn(MICRO, MUTED)}>target</p>
              <p
                className={cn(
                  NUM,
                  'mt-1 text-lg font-extrabold leading-none text-slate-900 dark:text-slate-50'
                )}
              >
                {target.toFixed(1)}
              </p>
              <p
                className={cn(
                  NUM,
                  'mt-1.5 text-[10px] font-bold',
                  gap != null && gap > 0
                    ? 'text-[rgb(var(--signal-warn))]'
                    : gap != null
                      ? 'text-[rgb(var(--signal-ok))]'
                      : 'text-slate-400 dark:text-slate-500'
                )}
              >
                {gap != null ? (gap > 0 ? `${gap.toFixed(1)} to go` : 'reached') : 'set'}
              </p>
            </div>
          ) : (
            <Link
              to={createPageUrl('Onboarding')}
              className={cn(MICRO, PANEL_LINK, 'shrink-0 min-h-6 py-1 px-1.5 -my-1 -mx-1.5')}
            >
              set a target
            </Link>
          )}
        </div>

        {/* The four inputs to the number above, so it is never a figure the
            learner has to take on trust. Unscored modules stay visibly empty
            and act as quick-launch routes to start each test. */}
        <div className="grid grid-cols-4 gap-1.5">
          {rows.map((row) => (
            <Link
              key={row.key}
              to={createPageUrl(row.page)}
              title={
                row.band != null
                  ? `${row.label}: Band ${row.band.toFixed(1)}`
                  : `Start ${row.label} test`
              }
              className={cn(
                WELL,
                'group flex flex-col items-center justify-center rounded-md border border-transparent py-1.5 transition-all duration-150',
                'hover:border-[#5a63df]/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:hover:border-[#8f97ff]/30',
                row.band == null && 'opacity-70 hover:opacity-100'
              )}
            >
              <span
                className={cn(
                  MICRO,
                  'leading-none transition-colors group-hover:text-[#5a63df] dark:group-hover:text-[#afb5ff]',
                  row.band != null ? 'text-slate-600 dark:text-slate-300 font-extrabold' : MUTED
                )}
                aria-hidden="true"
              >
                {row.short}
              </span>
              <span className="sr-only">{row.label}</span>
              <span
                className={cn(
                  NUM,
                  'mt-1 text-sm font-bold leading-none',
                  row.band != null
                    ? 'text-slate-900 dark:text-slate-50'
                    : 'text-slate-400 dark:text-slate-500'
                )}
              >
                {row.band != null ? row.band.toFixed(1) : '—'}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <PanelFootnote>
        {overall == null ? (
          <>overall band = mean of the four modules, rounded to the nearest half</>
        ) : complete ? (
          <>mean of four modules, rounded to the nearest half band</>
        ) : (
          <>
            provisional — score <span className="font-bold capitalize">{missing.join(', ')}</span>{' '}
            for a true overall
          </>
        )}
      </PanelFootnote>
    </div>
  );
});

OverallBandPanel.displayName = 'OverallBandPanel';

export default OverallBandPanel;

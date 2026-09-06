import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import { roundOverallBand } from '@/features/core/components/calculator/calculatorData';
import {
  Empty,
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
  { key: 'listening', short: 'L' },
  { key: 'reading', short: 'R' },
  { key: 'writing', short: 'W' },
  { key: 'speaking', short: 'S' },
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
    if (scored.length === 0) return { rows, scored, overall: null };

    const mean = scored.reduce((sum, row) => sum + row.band, 0) / scored.length;
    const target = Number(stats?.targetScore);

    return {
      rows,
      scored,
      mean,
      overall: roundOverallBand(mean),
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
          overall != null ? (
            <Pill tone={complete ? 'accent' : 'warn'}>
              {complete ? 'all 4 modules' : `${scored.length} of 4`}
            </Pill>
          ) : null
        }
      />

      {overall == null ? (
        <Empty icon={Award} className="flex-1 content-center">
          No module scored yet — your overall band appears once a test is marked.
          <Link
            to={createPageUrl('Reading')}
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#5a63df] hover:underline"
          >
            Take first test →
          </Link>
        </Empty>
      ) : (
        <div className="flex flex-1 flex-col justify-between gap-3">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={cn(
                    NUM,
                    'text-[40px] font-extrabold leading-none text-slate-900 dark:text-slate-50'
                  )}
                >
                  {overall.toFixed(1)}
                </span>
                <span className={cn(MICRO, MUTED)}>/ 9</span>
              </div>
              <p className={cn(MICRO, MUTED, 'mt-2')}>
                from a <FootNum>{mean.toFixed(2)}</FootNum> mean
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
                    gap > 0 ? 'text-[rgb(var(--signal-warn))]' : 'text-[rgb(var(--signal-ok))]'
                  )}
                >
                  {gap > 0 ? `${gap.toFixed(1)} to go` : 'reached'}
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
              rather than being dropped from the row. */}
          <div className="grid grid-cols-4 gap-1.5">
            {rows.map((row) => (
              <div
                key={row.key}
                className={cn(
                  WELL,
                  'flex flex-col items-center justify-center rounded-md py-1.5',
                  row.band == null && 'opacity-60'
                )}
              >
                <span className={cn(MICRO, MUTED, 'leading-none')} aria-hidden="true">
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
              </div>
            ))}
          </div>
        </div>
      )}

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

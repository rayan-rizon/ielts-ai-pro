import React from 'react';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, NUM } from '@/features/dashboard/components/primitives';

/**
 * Shared chart furniture for the Analytics page.
 *
 * Every chart here used to bring its own tooltip, its own axis tick style and
 * its own shade of indigo (#7157f5, #5661e9, #5862df, #4f46e5 were all in play
 * on one screen). One module, one look — and one place to fix contrast in dark
 * mode instead of five.
 */

export const ACCENT = '#5a63df';
export const ACCENT_SOFT = '#c9cdf3';

export const AXIS_TICK = { fontSize: 10, fontWeight: 700, fill: '#94a3b8' };

export const GRID_PROPS = {
  vertical: false,
  stroke: 'currentColor',
  className: 'text-[#eceafa] dark:text-white/[0.07]',
};

/** Dashed vertical guide under the cursor — matches the dashboard trajectory chart. */
export const CURSOR = {
  stroke: ACCENT,
  strokeWidth: 1,
  strokeDasharray: '3 3',
  opacity: 0.6,
};

/** The tooltip shell. Everything hovering over a chart on this page uses it. */
export function ChartTipShell({ className, children }) {
  return (
    <div
      className={cn(
        'pointer-events-none rounded-lg border border-[#e4e2f0] bg-white px-2.5 py-1.5 shadow-lg',
        'dark:border-white/10 dark:bg-[#1b1a22]',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Band-score tooltip: label on top, the number below at reading size.
 * Recharts passes `active`/`payload`/`label` — the component is used as
 * `<Tooltip content={<BandTip />} />`.
 */
export function BandTip({ active, payload, label, unit = 'band' }) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value);
  if (!Number.isFinite(value)) return null;

  return (
    <ChartTipShell>
      <p className={cn(MICRO, MUTED)}>{label}</p>
      <p className={cn(NUM, 'mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-50')}>
        {value.toFixed(1)} <span className={cn(MICRO, MUTED)}>{unit}</span>
      </p>
    </ChartTipShell>
  );
}

/** Generic multi-series tooltip: one row per series, name left, value right. */
export function SeriesTip({ active, payload, label, formatter, footer }) {
  if (!active || !payload?.length) return null;

  return (
    <ChartTipShell className="min-w-[150px]">
      <p className="text-[11px] font-extrabold text-slate-900 dark:text-white">{label}</p>
      <div className="mt-1.5 space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.dataKey ?? entry.name}
            className="flex items-center justify-between gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-300"
          >
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color || entry.fill || ACCENT }}
              />
              {entry.name}
            </span>
            <span className={cn(NUM, 'font-bold text-slate-900 dark:text-white')}>
              {formatter ? formatter(entry.value, entry) : entry.value}
            </span>
          </div>
        ))}
      </div>
      {footer ? (
        <p className={cn(MICRO, 'mt-1.5 text-[#5a63df] dark:text-[#a9afff]')}>{footer}</p>
      ) : null}
    </ChartTipShell>
  );
}

/** Inline legend swatch row — charts here never use the recharts default legend. */
export function ChartLegend({ items, className }) {
  return (
    <div className={cn('mt-2 flex flex-wrap items-center gap-3', className)}>
      {items.map((item) => (
        <span key={item.label} className={cn(MICRO, MUTED, 'flex items-center gap-1.5')}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

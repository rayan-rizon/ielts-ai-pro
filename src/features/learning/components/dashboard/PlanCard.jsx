import React from 'react';
import { cn } from '@/lib/cn';

/**
 * Learner panel card surface — matching the dashboard's hairline elevation system:
 * crisp lavender-tinged white gradient in light mode, obsidian surface in dark mode.
 */
export const CARD =
  'rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-linear-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15]';

/** Hairline between rows inside a card matching dashboard primitives. */
export const ROW_RULE = 'border-t border-[#eceafa] first:border-t-0 dark:border-white/[0.07]';

/** Quiet inset surface for tiles and tracks — matching dashboard WELL. */
export const INSET = 'bg-[#f4f3fb] dark:bg-white/[0.07]';

/** Secondary nested tile surface — matching dashboard TILE. */
export const TILE =
  'rounded-lg border border-[#ebeaf7] bg-[#fbfbfe] transition-colors duration-150 dark:border-white/11 dark:bg-white/5.5';

export const SECONDARY_TEXT = 'text-slate-500 dark:text-slate-400';

export function PlanCard({ as: Tag = 'section', className, children, ...rest }) {
  return (
    <Tag className={cn(CARD, 'flex flex-col gap-3 p-4', className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Title is the loudest thing in a card; the aside is the quietest. Anchored with an accent rail matching PanelTitle. */
export function CardHeader({ title, aside, children, accent = true }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {accent && (
          <span
            className="h-3.5 w-[3px] shrink-0 rounded-full bg-[#5a63df] dark:bg-[#8f97ff]"
            aria-hidden="true"
          />
        )}
        <h2 className="truncate text-[13px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          {title}
        </h2>
      </div>
      {aside ? (
        <span className="shrink-0 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {aside}
        </span>
      ) : null}
      {children}
    </header>
  );
}

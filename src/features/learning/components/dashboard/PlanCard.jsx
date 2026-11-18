import React from 'react';
import { cn } from '@/lib/cn';

/**
 * The page's one card surface: flat, neutral hairline, no tint. Colour on this
 * page is reserved for state (done, skipped, selected), so the surface itself
 * stays out of the way and lets the data carry the hierarchy.
 */
export const CARD =
  'rounded-2xl border border-slate-200/80 bg-white dark:border-white/[0.08] dark:bg-[#131217]';

/** Hairline between rows inside a card. */
export const ROW_RULE = 'border-t border-slate-100 first:border-t-0 dark:border-white/[0.06]';

/** Quiet inset surface for tiles and tracks. */
export const INSET = 'bg-slate-50 dark:bg-white/[0.04]';

export const SECONDARY_TEXT = 'text-slate-500 dark:text-slate-400';

export function PlanCard({ as: Tag = 'section', className, children, ...rest }) {
  return (
    <Tag className={cn(CARD, 'flex flex-col gap-3 p-4', className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Title is the loudest thing in a card; the aside is the quietest. */
export function CardHeader({ title, aside, children }) {
  return (
    <header className="flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h2>
      {aside ? (
        <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">{aside}</span>
      ) : null}
      {children}
    </header>
  );
}

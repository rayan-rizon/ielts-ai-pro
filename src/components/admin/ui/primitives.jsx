import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Info, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';

/**
 * Shared instrument-panel vocabulary for the admin area.
 *
 * Every admin page should compose from these so the panel reads as one system:
 * graphite surfaces, hairline rules, mono tabular numerals, and the three
 * --signal-* colours defined in index.css.
 */

export const NUM = 'font-mono tabular-nums tracking-tight';
export const MICRO = 'text-[9px] font-bold uppercase tracking-[0.14em]';
export const PANEL =
  'rounded-xl border border-stone-200/80 dark:border-white/[0.07] bg-white dark:bg-[#131315]';

/**
 * Compact status/category chip for dense contexts — table rows, list rows.
 * MICRO's wide tracking reads fine as a section label but turns a 4-letter
 * word like "FREE" into an oversized pill inside a table row; this is the
 * same weight, tighter. `PILL_BASE` is the shape only (no color) so callers
 * pair it with a semantic tone; `pillTone` gives the three signal tones plus
 * a neutral default for anything that isn't ok/warn/fault.
 */
export const PILL_BASE =
  'inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[9px] font-bold uppercase tracking-wide leading-normal';
export const pillTone = (tone) =>
  ({
    ok: 'text-[rgb(var(--signal-ok))] border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.06)]',
    warn: 'text-[rgb(var(--signal-warn))] border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.06)]',
    fault:
      'text-[rgb(var(--signal-fault))] border-[rgb(var(--signal-fault)/0.3)] bg-[rgb(var(--signal-fault)/0.06)]',
    accent:
      'text-indigo-600 dark:text-indigo-400 border-indigo-300/50 dark:border-indigo-800/60 bg-indigo-500/[0.06]',
    neutral: 'text-stone-500 dark:text-stone-400 border-stone-200 dark:border-white/10',
  })[tone] || pillTone('neutral');

export const SIGNAL_BG = {
  ok: 'bg-[rgb(var(--signal-ok))]',
  warn: 'bg-[rgb(var(--signal-warn))]',
  fault: 'bg-[rgb(var(--signal-fault))]',
  idle: 'bg-[rgb(var(--signal-idle))]',
};

export const SIGNAL_TEXT = {
  ok: 'text-[rgb(var(--signal-ok))]',
  warn: 'text-[rgb(var(--signal-warn))]',
  fault: 'text-[rgb(var(--signal-fault))]',
  idle: 'text-stone-500 dark:text-stone-400',
};

/**
 * Generic styled tooltip — wraps any element (a bar, a heat-cell, a badge) so
 * hover info matches the panel system instead of falling back to the browser's
 * native `title=` tooltip. Prefer this over a bare `title` attribute anywhere
 * the content is more than a one-word label.
 */
export const Tip = ({ children, content, side = 'top' }) => (
  <Tooltip delayDuration={150}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent
      side={side}
      className="rounded-lg border border-stone-200 dark:border-white/10 bg-white dark:bg-[#1b1b1e] px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-stone-700 dark:text-stone-200 shadow-lg"
    >
      {content}
    </TooltipContent>
  </Tooltip>
);

/** Small "what does this mean?" affordance next to a metric label. */
export const InfoTip = ({ children, className }) => (
  <Tooltip delayDuration={150}>
    <TooltipTrigger asChild>
      <button
        type="button"
        aria-label="What this means"
        className={cn(
          'inline-grid place-items-center align-middle text-stone-400 hover:text-stone-600 dark:text-stone-600 dark:hover:text-stone-300 transition-colors',
          className
        )}
      >
        <Info className="w-3 h-3" />
      </button>
    </TooltipTrigger>
    <TooltipContent
      side="top"
      className="max-w-[240px] rounded-lg border border-stone-200 dark:border-white/10 bg-white dark:bg-[#1b1b1e] px-2.5 py-2 text-[11px] font-medium leading-snug text-stone-700 dark:text-stone-200 shadow-lg"
    >
      {children}
    </TooltipContent>
  </Tooltip>
);

/** Section heading with the hairline rule used across admin pages. */
export const SectionLabel = ({ children, accent = 'idle', className }) => (
  <h3
    className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5', className)}
  >
    <span className={cn('w-4 h-px', SIGNAL_BG[accent])} />
    {children}
  </h3>
);

/** Pulsing dot — used for genuinely live values only. */
export const LiveDot = ({ active = true, tone = 'ok' }) => (
  <span className="relative flex h-1.5 w-1.5 shrink-0">
    {active && (
      <span
        className={cn(
          'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
          SIGNAL_BG[tone]
        )}
      />
    )}
    <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', SIGNAL_BG[tone])} />
  </span>
);

/** Standard KPI tile. */
export const Kpi = ({ label, value, sub, delta, tip, live = false, className }) => (
  <div
    className={cn(
      PANEL,
      'py-2.5 px-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/[0.12]',
      className
    )}
  >
    <div className="flex items-center gap-1.5">
      {live && <LiveDot />}
      <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>{label}</p>
      {tip && <InfoTip>{tip}</InfoTip>}
    </div>
    <div className="flex items-baseline gap-2 mt-1">
      <span className={cn(NUM, 'text-xl font-bold text-stone-900 dark:text-stone-50 leading-none')}>
        {value}
      </span>
      {delta}
    </div>
    {sub && <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-1')}>{sub}</p>}
  </div>
);

/** Page header shared by every admin screen. */
export const AdminPageHeader = ({ title, description, tip, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 w-full">
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
          {title}
        </h2>
        {tip && <InfoTip>{tip}</InfoTip>}
      </div>
      {description && (
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-1">{description}</p>
      )}
    </div>
    {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
  </div>
);

/**
 * Admin-scoped button. The app-wide <Button> defaults to the brand indigo
 * (--primary) used across the learner-facing product; the admin panel uses
 * its own graphite/stone language instead, so this stays local rather than
 * changing shadcn's global button variants.
 */
const ADMIN_BUTTON_VARIANTS = {
  primary:
    'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-200',
  outline:
    'border border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-white/5',
  ghost:
    'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5',
  destructive:
    'border border-[rgb(var(--signal-fault)/0.3)] text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)]',
};

export const AdminButton = forwardRef(
  (
    { variant = 'primary', size = 'md', className, loading, disabled, asChild, children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-md font-bold transition-all duration-150 active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
          size === 'sm' ? 'h-7 px-2.5 text-[11px]' : 'h-8 px-3 text-xs',
          ADMIN_BUTTON_VARIANTS[variant] || ADMIN_BUTTON_VARIANTS.primary,
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        {children}
      </Comp>
    );
  }
);
AdminButton.displayName = 'AdminButton';

/** Shared classNames for shadcn <TabsList>/<TabsTrigger> in the admin area. */
export const ADMIN_TABS_LIST =
  'inline-flex h-auto items-center justify-start gap-1 p-1 bg-stone-100 dark:bg-white/[0.04] border border-stone-200/80 dark:border-white/[0.07] rounded-lg shrink-0';
export const ADMIN_TAB_TRIGGER =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-stone-500 dark:text-stone-400 data-[state=active]:bg-white dark:data-[state=active]:bg-[#131315] data-[state=active]:text-stone-900 dark:data-[state=active]:text-stone-50 data-[state=active]:shadow-2xs transition-all duration-150 active:scale-[0.96] shrink-0';

/**
 * Shared enter animation for admin pages/panels — a quiet staggered fade+rise
 * rather than each page inventing its own timing. Use with framer-motion's
 * `m.div` (or `motion.div`): variants={STAGGER_CONTAINER} on the parent,
 * variants={FADE_UP} on each direct child.
 */
export const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};
export const FADE_UP = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
};
/** For content that expands/collapses (e.g. a toggle revealing a form). */
export const COLLAPSE = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } },
};

import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { ChevronRight, Info, Loader2 } from 'lucide-react';
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
 * Inset surface *inside* a PANEL — a quoted message, a rules summary, a nested
 * metric. One step darker than the panel in light mode and one step lighter in
 * dark, so nesting reads without a second border.
 */
export const WELL = 'bg-stone-100/70 dark:bg-white/[0.045]';

/** One-level nested control surface inside a panel. */
export const TILE =
  'rounded-lg border border-stone-200/80 bg-stone-50/70 transition-colors duration-150 dark:border-white/[0.10] dark:bg-white/[0.045]';

/** Panel/card title. Legible on its own — distinct from MICRO meta labels. */
export const TITLE = 'text-[13px] font-extrabold tracking-tight text-stone-900 dark:text-stone-50';

/** Body copy inside a panel, at the density this system uses. */
export const BODY = 'text-[11px] leading-relaxed text-stone-600 dark:text-stone-300';
export const MUTED = 'text-stone-500 dark:text-stone-400';

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
      'text-indigo-600 dark:text-indigo-400 border-indigo-300/50 dark:border-indigo-800/60 bg-indigo-500/6',
    neutral: 'text-stone-500 dark:text-stone-400 border-stone-200 dark:border-white/10',
  })[tone] || pillTone('neutral');

/** Ready-made chip. Prefer this over hand-composing PILL_BASE + pillTone. */
export const Pill = ({ tone = 'neutral', className, children }) => (
  <span className={cn(PILL_BASE, pillTone(tone), className)}>{children}</span>
);

/**
 * `accent` is not a status — it is "noteworthy, but nothing is wrong", the same
 * tone `pillTone` uses. It belongs in these maps because callers key both from
 * one tone value (a scheduled campaign's status rail, an informational
 * attention row); without it those lookups returned undefined and the element
 * rendered with no colour at all rather than falling back to neutral.
 */
export const SIGNAL_BG = {
  ok: 'bg-[rgb(var(--signal-ok))]',
  warn: 'bg-[rgb(var(--signal-warn))]',
  fault: 'bg-[rgb(var(--signal-fault))]',
  accent: 'bg-indigo-500 dark:bg-indigo-400',
  neutral: 'bg-[rgb(var(--signal-idle))]',
  idle: 'bg-[rgb(var(--signal-idle))]',
};

export const SIGNAL_TEXT = {
  ok: 'text-[rgb(var(--signal-ok))]',
  warn: 'text-[rgb(var(--signal-warn))]',
  fault: 'text-[rgb(var(--signal-fault))]',
  accent: 'text-indigo-600 dark:text-indigo-400',
  neutral: 'text-stone-500 dark:text-stone-400',
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
      className="rounded-lg border border-stone-200 dark:border-white/10 bg-white dark:bg-[#1b1b1e] px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-stone-700 dark:text-stone-200 shadow-xs"
    >
      {content}
    </TooltipContent>
  </Tooltip>
);

/** Small "what does this mean?" affordance next to a metric label. */
export const InfoTip = ({ children, label = 'What this means', className }) => (
  <Tooltip delayDuration={150}>
    <TooltipTrigger asChild>
      <button
        type="button"
        aria-label={label}
        className={cn(
          'inline-grid h-6 w-6 place-items-center -my-1 -mx-0.5 rounded-sm text-stone-400 hover:text-stone-600 dark:text-stone-600 dark:hover:text-stone-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
          className
        )}
      >
        <Info className="w-3 h-3" />
      </button>
    </TooltipTrigger>
    <TooltipContent
      side="top"
      className="max-w-[240px] rounded-lg border border-stone-200 dark:border-white/10 bg-white dark:bg-[#1b1b1e] px-2.5 py-2 text-[11px] font-medium leading-snug text-stone-700 dark:text-stone-200 shadow-xs"
    >
      {children}
    </TooltipContent>
  </Tooltip>
);

/** Section heading with the hairline rule used across admin pages. */
export const SectionLabel = ({ children, accent = 'idle', className }) => (
  <h3
    className={cn(
      MICRO,
      'text-stone-500 dark:text-stone-400 flex items-center gap-1.5 leading-none',
      className
    )}
  >
    <span className={cn('w-3.5 h-[1.5px] rounded-full shrink-0', SIGNAL_BG[accent])} />
    <span className="leading-none">{children}</span>
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
      'py-2.5 px-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/12',
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

/** Shared form-control sizing for admin dialogs — inputs, selects, textareas. */
export const FIELD =
  'h-9 rounded-md border-stone-300 bg-white text-xs font-medium dark:border-white/15 dark:bg-[#131315]';

export const FieldLabel = ({ children, hint }) => (
  <span className="mb-1.5 flex items-baseline gap-1.5">
    <span className={cn(MICRO, MUTED)}>{children}</span>
    {hint && (
      <span className={cn('text-[10px] font-medium normal-case tracking-normal', MUTED)}>
        {hint}
      </span>
    )}
  </span>
);

/**
 * Header strip for a PANEL — the hairline-ruled row that names the panel and
 * parks its controls. Pages kept re-writing this `p-4 border-b` row by hand and
 * drifting on padding and label size; this fixes both.
 */
export const PanelHeader = ({
  label,
  title,
  description,
  accent = 'idle',
  className,
  children,
}) => (
  <div
    className={cn(
      'flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3 border-b border-stone-200/80 px-4 py-3 dark:border-white/[0.07]',
      className
    )}
  >
    <div className="min-w-0 flex-1">
      {label && <SectionLabel accent={accent}>{label}</SectionLabel>}
      {title && <p className={cn(TITLE, label && 'mt-1')}>{title}</p>}
      {description && (
        <p
          className={cn(MICRO, MUTED, 'mt-0.5 normal-case tracking-normal text-[10px] font-medium')}
        >
          {description}
        </p>
      )}
    </div>
    {children && (
      <div className="flex shrink-0 items-center gap-1.5 flex-wrap w-full sm:w-auto">
        {children}
      </div>
    )}
  </div>
);

/**
 * Honest empty state. The admin panel must never let "no data yet" read as a
 * broken panel, so this always says what would appear here and why it hasn't.
 */
export const Empty = ({ icon: Icon, title, children, className, action }) => (
  <div className={cn('flex flex-col items-center gap-1.5 px-6 py-12 text-center', className)}>
    {Icon && <Icon className="h-6 w-6 text-stone-300 dark:text-stone-600" strokeWidth={1.75} />}
    {title && <p className="text-xs font-bold text-stone-700 dark:text-stone-200">{title}</p>}
    <p className={cn('max-w-sm text-[11px] font-medium leading-relaxed', MUTED)}>{children}</p>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

/**
 * Horizontal meter with the label riding inside the track — the densest way to
 * show "name + share + exact value" in a single row.
 */
export const Meter = ({ label, pct, value, tone = 'accent', trailing, className }) => {
  const width = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className={cn('relative h-8 flex-1 overflow-hidden rounded-md', WELL)}>
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-md transition-[width] duration-700 ease-out',
            tone === 'accent'
              ? 'bg-indigo-500/16 dark:bg-indigo-400/22'
              : `${SIGNAL_BG[tone] || SIGNAL_BG.idle} opacity-[0.18]`
          )}
          style={{ width: `${width}%` }}
        />
        <div className="relative flex h-full items-center justify-between gap-2 px-3">
          <span className="truncate text-[11px] font-extrabold text-stone-800 dark:text-stone-100">
            {label}
          </span>
          {trailing}
        </div>
      </div>
      <span
        className={cn(
          NUM,
          'w-12 shrink-0 text-right text-sm font-bold text-stone-900 dark:text-stone-50'
        )}
      >
        {value}
      </span>
    </div>
  );
};

/**
 * One rung of a conversion funnel. Unlike a plain Meter this also carries the
 * *drop-off from the previous step*, which is the number that actually tells
 * the operator where the funnel is leaking — a share-of-total bar alone hides
 * that a stage lost 90% of what reached it.
 */
export const FunnelStep = ({ label, value, share, drop, isFirst }) => (
  <div className="flex items-center gap-2.5">
    <div className={cn('relative h-9 flex-1 overflow-hidden rounded-md', WELL)}>
      <div
        className="absolute inset-y-0 left-0 rounded-md bg-indigo-500/16 transition-[width] duration-700 ease-out dark:bg-indigo-400/22"
        style={{ width: `${Math.max(0, Math.min(100, share || 0))}%` }}
      />
      <div className="relative flex h-full items-center justify-between gap-2 px-3">
        <span className="truncate text-[11px] font-extrabold text-stone-800 dark:text-stone-100">
          {label}
        </span>
        <span className={cn(NUM, 'shrink-0 text-[10px] font-bold', MUTED)}>
          {Number.isFinite(share) ? `${share.toFixed(1)}%` : '—'}
        </span>
      </div>
    </div>
    <div className="w-16 shrink-0 text-right">
      <p className={cn(NUM, 'text-sm font-bold leading-none text-stone-900 dark:text-stone-50')}>
        {Number(value || 0).toLocaleString()}
      </p>
      {!isFirst && (
        <p className={cn(NUM, 'mt-0.5 text-[9px] font-bold leading-none', MUTED)}>
          {Number.isFinite(drop) ? `−${drop.toFixed(0)}%` : '—'}
        </p>
      )}
    </div>
  </div>
);

/** Multi-select chip used across the admin forms (channels, tiers, rules). */
export const ToggleChip = ({ active, onClick, children, className }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      'rounded-md border px-2.5 py-1.5 text-[10px] font-extrabold capitalize transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#131315]',
      active
        ? 'border-indigo-400/50 bg-indigo-500/8 text-indigo-600 dark:border-indigo-500/50 dark:text-indigo-300'
        : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700 dark:border-white/10 dark:text-stone-400 dark:hover:text-stone-200',
      className
    )}
  >
    {children}
  </button>
);

/**
 * A single "this needs your attention" line. The admin panel leads with these
 * rather than burying a problem several tabs deep, so they are always a link
 * or a button — an alert you cannot act on is just noise.
 */
export const AttentionRow = ({ tone = 'warn', label, detail, onClick, action }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className="group flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-stone-50 disabled:cursor-default disabled:hover:bg-transparent dark:hover:bg-white/[0.03] dark:disabled:hover:bg-transparent"
  >
    <span className={cn('h-4 w-0.5 shrink-0 rounded-full', SIGNAL_BG[tone])} />
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[11px] font-bold text-stone-800 dark:text-stone-100">
        {label}
      </span>
      {detail && (
        <span className={cn('block truncate text-[10px] font-medium', MUTED)}>{detail}</span>
      )}
    </span>
    {action && <span className={cn(MICRO, 'shrink-0', SIGNAL_TEXT[tone])}>{action}</span>}
    {onClick && (
      <ChevronRight className="h-3 w-3 shrink-0 text-stone-300 transition-transform group-hover:translate-x-0.5 dark:text-stone-600" />
    )}
  </button>
);

/**
 * Two currencies, two lines. The revenue tiles used to cram "৳12,400 | $310"
 * onto one line, where the pipe reads as part of a number and both figures get
 * truncated on narrow tiles; stacking them keeps each amount scannable.
 */
export const DualValue = ({ primary, primaryLabel, secondary, secondaryLabel }) => (
  <div className="flex items-baseline gap-3">
    <span className="min-w-0">
      <span
        className={cn(
          NUM,
          'block text-lg font-bold leading-none text-stone-900 dark:text-stone-50'
        )}
      >
        {primary}
      </span>
      {primaryLabel && <span className={cn(MICRO, MUTED, 'mt-1 block')}>{primaryLabel}</span>}
    </span>
    <span className="h-6 w-px shrink-0 bg-stone-200 dark:bg-white/10" />
    <span className="min-w-0">
      <span
        className={cn(
          NUM,
          'block text-lg font-bold leading-none text-stone-900 dark:text-stone-50'
        )}
      >
        {secondary}
      </span>
      {secondaryLabel && <span className={cn(MICRO, MUTED, 'mt-1 block')}>{secondaryLabel}</span>}
    </span>
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
    'bg-stone-600 dark:bg-stone-600 text-white dark:text-white hover:bg-stone-700 dark:hover:bg-stone-500',
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
          'inline-flex items-center justify-center gap-1.5 rounded-lg font-bold transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#131315] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
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
  'inline-flex h-auto items-center justify-start gap-1 p-1 bg-stone-100 dark:bg-white/4 border border-stone-200/80 dark:border-white/[0.07] rounded-lg shrink-0';
export const ADMIN_TAB_TRIGGER =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-stone-500 dark:text-stone-400 data-[state=active]:bg-white dark:data-[state=active]:bg-[#131315] data-[state=active]:text-stone-900 dark:data-[state=active]:text-stone-50 data-[state=active]:shadow-2xs transition-all duration-200 ease-out active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#131315] shrink-0';

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

/**
 * Instrument-panel skeleton vocabulary — shape-matched placeholders for a
 * page's initial data fetch. These stand in for AdminPageHeader/Kpi/PANEL
 * *before* that real content mounts, so the loading state already reads as
 * "this page, not yet loaded" instead of a generic spinner, and the eventual
 * swap (paired with `.animate-panel-in` from index.css) is a quiet fade into
 * the same layout rather than a shape change. Pure CSS `animate-pulse` —
 * no framer-motion — so it's safe on the Suspense/first-paint critical path.
 */
export const SkeletonBlock = ({ className }) => (
  <div
    className={cn(
      'rounded-xl border border-stone-200/80 dark:border-white/[0.07] bg-stone-100 dark:bg-white/4 animate-pulse',
      className
    )}
  />
);

export const SkeletonHeader = () => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 w-full">
    <div className="space-y-2">
      <div className="h-6 w-40 rounded-md bg-stone-200 dark:bg-white/8 animate-pulse" />
      <div className="h-3 w-64 rounded bg-stone-100 dark:bg-white/5 animate-pulse" />
    </div>
  </div>
);

export const SkeletonKpiRow = ({ count = 3, className }) => (
  <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-3', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonBlock key={i} className="h-[70px]" />
    ))}
  </div>
);

export const SkeletonRows = ({ count = 5, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="h-11 rounded-lg bg-stone-100 dark:bg-white/4 animate-pulse"
        style={{ animationDelay: `${i * 40}ms` }}
      />
    ))}
  </div>
);

/**
 * Composite loading state for a whole admin page: header + KPI row +
 * chart/content panels, in this system's proportions. `panels` controls
 * how many chart-shaped blocks render (first one spans 2 columns on large
 * screens, matching the "one big chart, one side panel" layout most admin
 * pages use); pass `rows` for pages whose body is a list/table instead.
 */
export const AdminPageSkeleton = ({ kpis = 3, panels = 1, rows = 0, className }) => (
  <div className={cn('animate-panel-in space-y-4 pb-6 pt-12 md:pt-0', className)}>
    <SkeletonHeader />
    <SkeletonKpiRow count={kpis} />
    {panels > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: panels }).map((_, i) => (
          <SkeletonBlock key={i} className={cn('h-64', i === 0 && panels > 1 && 'lg:col-span-2')} />
        ))}
      </div>
    )}
    {rows > 0 && <SkeletonRows count={rows} />}
  </div>
);

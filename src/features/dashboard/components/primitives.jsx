import React, { forwardRef } from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';

/**
 * Instrument-panel vocabulary for the learner dashboard.
 *
 * Deliberately the same system as `components/admin/ui/primitives` — hairline
 * rules, mono tabular numerals, micro uppercase labels, no shadows, no
 * gradients — but tuned to the learner-facing lavender/white palette instead of
 * the admin panel's graphite.
 *
 * Numbers are the content here, so every number renders in NUM. Weight and
 * position carry hierarchy; colour is reserved for meaning.
 */

export const NUM = 'font-mono tabular-nums tracking-tight';
export const MICRO = 'text-[9px] font-bold uppercase tracking-[0.14em]';

/** Card title — legible on its own, distinct from MICRO meta labels. */
export const TITLE = 'text-[13px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100';

export const PANEL =
  'rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15]';

/** Quiet inset surface — meter tracks, nested rows, empty wells. */
export const WELL = 'bg-[#f4f3fb] dark:bg-white/[0.04]';

/** Nested tile/card inside a panel — one step quieter than PANEL itself. */
export const TILE =
  'rounded-lg border border-[#ebeaf7] bg-[#fbfbfe] transition-colors duration-150 dark:border-white/10 dark:bg-white/[0.03]';

export const ACCENT = '#5a63df';

/** Muted label text, one class so it never drifts. */
export const MUTED = 'text-slate-500 dark:text-slate-400';

export const PILL_BASE =
  'inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[9px] font-bold uppercase tracking-wide leading-normal';

export const pillTone = (tone) =>
  ({
    ok: 'text-[rgb(var(--signal-ok))] border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.06)]',
    warn: 'text-[rgb(var(--signal-warn))] border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.06)]',
    fault:
      'text-[rgb(var(--signal-fault))] border-[rgb(var(--signal-fault)/0.3)] bg-[rgb(var(--signal-fault)/0.06)]',
    accent: 'text-[#5a63df] dark:text-[#a9afff] border-[#5a63df]/25 bg-[#5a63df]/[0.07]',
    rose: 'text-rose-600 dark:text-rose-300 border-rose-500/25 bg-rose-500/[0.07]',
    sky: 'text-sky-600 dark:text-sky-300 border-sky-500/25 bg-sky-500/[0.07]',
    amber: 'text-amber-600 dark:text-amber-300 border-amber-500/25 bg-amber-500/[0.07]',
    emerald: 'text-emerald-600 dark:text-emerald-300 border-emerald-500/25 bg-emerald-500/[0.07]',
    neutral: 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10',
  })[tone] || pillTone('neutral');

export const Pill = ({ tone = 'neutral', className, children }) => (
  <span className={cn(PILL_BASE, pillTone(tone), className)}>{children}</span>
);

const ICON_CHIP_TONES = {
  accent: 'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300',
  rose: 'bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300',
  sky: 'bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300',
  neutral: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400',
};

/** Small tinted icon badge used next to a label — Stat tiles, panel headers. */
export const IconChip = ({ icon: Icon, tone = 'accent', size = 'sm', className }) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center justify-center rounded-md',
      size === 'sm' ? 'h-5 w-5' : 'h-7 w-7',
      ICON_CHIP_TONES[tone] || ICON_CHIP_TONES.accent,
      className
    )}
  >
    <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} strokeWidth={2.25} />
  </span>
);

/** Styled tooltip so hover info matches the panel system. */
export const Tip = ({ children, content, side = 'top' }) => (
  <Tooltip delayDuration={150}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent
      side={side}
      className="rounded-lg border border-[#e4e2f0] dark:border-white/10 bg-white dark:bg-[#1b1a22] px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-slate-700 dark:text-slate-200 shadow-lg"
    >
      {content}
    </TooltipContent>
  </Tooltip>
);

/** "What does this mean?" affordance next to a metric label. */
export const InfoTip = ({ children, className }) => (
  <Tooltip delayDuration={150}>
    <TooltipTrigger asChild>
      <button
        type="button"
        aria-label="What this means"
        className={cn(
          'inline-grid place-items-center align-middle text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300 transition-colors',
          className
        )}
      >
        <Info className="w-3 h-3" />
      </button>
    </TooltipTrigger>
    <TooltipContent
      side="top"
      className="max-w-[190px] rounded-lg border border-[#e4e2f0] dark:border-white/10 bg-white dark:bg-[#1b1a22] px-2.5 py-1.5 text-[11px] font-medium leading-snug text-slate-700 dark:text-slate-200 shadow-lg"
    >
      {children}
    </TooltipContent>
  </Tooltip>
);

/** Quiet uppercase micro-label with no rail — for a single inline tag, not a section header. */
export const Eyebrow = ({ children, className }) => (
  <span className={cn(MICRO, MUTED, className)}>{children}</span>
);

/** Section heading with the hairline rail used across the panel. */
export const SectionLabel = ({ children, accent = false, className }) => (
  <h3 className={cn(MICRO, MUTED, 'flex items-center gap-1.5', className)}>
    <span
      className={cn('w-4 h-px', accent ? 'bg-[#5a63df]' : 'bg-slate-300 dark:bg-white/20')}
      aria-hidden="true"
    />
    {children}
  </h3>
);

/**
 * Panel title row. Sits inside a padded panel with no rule beneath it — the
 * panel border already does that job, and a second line would read as clutter
 * at this density. Uses TITLE (not MICRO) so the label reads as an actual
 * heading rather than a barely-visible meta tag.
 */
export const PanelTitle = ({ label, tip, accent = false, action, className }) => (
  <div className={cn('flex items-center justify-between gap-3 mb-2.5', className)}>
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={cn(
          'h-3.5 w-[3px] shrink-0 rounded-full',
          accent ? 'bg-[#5a63df]' : 'bg-slate-300 dark:bg-white/20'
        )}
        aria-hidden="true"
      />
      <h2 className={cn(TITLE, 'truncate')}>{label}</h2>
      {tip && <InfoTip>{tip}</InfoTip>}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export const Panel = forwardRef(({ className, children, as: Tag = 'section', ...rest }, ref) => (
  <Tag ref={ref} className={cn(PANEL, 'flex flex-col', className)} {...rest}>
    {children}
  </Tag>
));
Panel.displayName = 'Panel';

/**
 * Headline KPI tile. Same anatomy as the admin `Kpi` (micro label → big number
 * → sub-line) with two additions for the learner-facing surface: an icon chip
 * for at-a-glance scanning, and a touch more size on the number itself since
 * this is the first thing on the page rather than one of twenty ops metrics.
 */
export const Stat = ({
  icon,
  tone = 'accent',
  label,
  value,
  unit,
  sub,
  delta,
  tip,
  size = 'md',
  className,
}) => (
  <div
    className={cn(
      PANEL,
      size === 'sm' ? 'px-3 py-2' : 'px-3.5 py-3',
      'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/[0.12]',
      className
    )}
  >
    <div className="flex items-center gap-1.5">
      {icon && <IconChip icon={icon} tone={tone} size="sm" />}
      <p className={cn(MICRO, MUTED)}>{label}</p>
      {tip && <InfoTip>{tip}</InfoTip>}
    </div>
    <div className="mt-1.5 flex items-baseline gap-1.5">
      <span
        className={cn(
          NUM,
          'font-extrabold leading-none text-slate-900 dark:text-slate-50',
          size === 'sm' ? 'text-base' : 'text-2xl'
        )}
      >
        {value}
      </span>
      {unit && <span className={cn(MICRO, MUTED, 'leading-none')}>{unit}</span>}
      {delta}
    </div>
    {sub && <p className={cn(MICRO, MUTED, 'mt-1.5')}>{sub}</p>}
  </div>
);

/** Plain thin progress bar — no label riding inside it. Use when the value/label sit outside. */
export const Bar = ({ value = 0, className }) => {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full', WELL, className)}>
      <div
        className="h-full rounded-full bg-[#5a63df] transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

/**
 * Horizontal meter with the label riding inside the track — the densest way to
 * show "name + share + exact value" in one row. Same shape as the admin funnel.
 */
export const Meter = ({ label, pct, value, tone = 'accent', trailing, className }) => (
  <div className={cn('flex items-center gap-2.5', className)}>
    <div className={cn('relative h-8 flex-1 overflow-hidden rounded-md', WELL)}>
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-md transition-[width] duration-700',
          tone === 'accent' ? 'bg-[#5a63df]/[0.16]' : 'bg-slate-400/15'
        )}
        style={{ width: `${Math.max(0, Math.min(100, pct || 0))}%` }}
      />
      <div className="relative flex h-full items-center justify-between px-3">
        <span className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
          {label}
        </span>
        {trailing}
      </div>
    </div>
    <span
      className={cn(
        NUM,
        'w-9 shrink-0 text-right text-sm font-bold text-slate-900 dark:text-slate-50'
      )}
    >
      {value}
    </span>
  </div>
);

/** Signed change. Colour carries meaning here, so the signal tokens apply. */
export const Delta = ({ value, digits = 1, suffix = '' }) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (Math.abs(n) < 0.05) {
    return <span className={cn(MICRO, MUTED)}>flat</span>;
  }
  const good = n > 0;
  return (
    <span
      className={cn(
        NUM,
        'text-[10px] font-bold',
        good ? 'text-[rgb(var(--signal-ok))]' : 'text-[rgb(var(--signal-fault))]'
      )}
    >
      {good ? '+' : '−'}
      {Math.abs(n).toFixed(digits)}
      {suffix}
    </span>
  );
};

/**
 * Single-value donut. One arc, one number in the middle — used where a ratio is
 * the whole story (vocabulary mastered / total). Stroke-dash rather than an SVG
 * chart library so it stays crisp at 64px and costs nothing to render.
 */
export const Ring = ({ value = 0, size = 64, stroke = 6, label, sublabel, tone = ACCENT }) => {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-[#eceafa] dark:stroke-white/[0.07]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (pct / 100) * circumference}
          style={{ transition: 'stroke-dashoffset 700ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            NUM,
            'text-sm font-extrabold leading-none text-slate-900 dark:text-slate-50'
          )}
        >
          {label}
        </span>
        {sublabel && <span className={cn(MICRO, MUTED, 'mt-0.5 leading-none')}>{sublabel}</span>}
      </div>
    </div>
  );
};

/**
 * The hairline summary line every panel closes with. It was copy-pasted in four
 * cards before; one component keeps the rule, spacing and type identical.
 */
export const PanelFootnote = ({ children, className }) => (
  <p
    className={cn(
      MICRO,
      MUTED,
      'mt-3 border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]',
      className
    )}
  >
    {children}
  </p>
);

/** Number inside a footnote — same emphasis everywhere. */
export const FootNum = ({ children }) => (
  <span className={cn(NUM, 'font-bold text-slate-700 dark:text-slate-200')}>{children}</span>
);

/** Honest empty state — never let "no data" read as a broken panel. */
export const Empty = ({ icon: Icon, children, className }) => (
  <div className={cn('flex flex-col items-center gap-2 py-8 text-center', className)}>
    {Icon && <Icon className="h-5 w-5 text-slate-300 dark:text-slate-600" />}
    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{children}</p>
  </div>
);

/** Shared enter animation — matches the admin panel's timing exactly. */
export const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};
export const FADE_UP = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
};

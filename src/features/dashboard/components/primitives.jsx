import React, { forwardRef, useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { useReducedMotion, useSpring } from 'framer-motion';
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

/**
 * Card shell.
 *
 * Dark mode is a flat, solid dark surface — not a top-to-bottom gradient —
 * over a true-black page. Both values are the admin panel's own
 * (#131315 on #08080a): that pairing is the actual reference for "good dark
 * mode contrast" here, so this uses it exactly rather than a lighter
 * approximation. A faint top inner highlight stands in for the gradient's old
 * job of showing where the light hits the panel.
 */
export const PANEL =
  'rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-linear-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15]';

/** Quiet inset surface — meter tracks, nested rows, empty wells. */
export const WELL = 'bg-[#f4f3fb] dark:bg-white/[0.07]';

/** Nested tile/card inside a panel — one step quieter than PANEL itself. */
export const TILE =
  'rounded-lg border border-[#ebeaf7] bg-[#fbfbfe] transition-colors duration-150 dark:border-white/11 dark:bg-white/5.5';

export const ACCENT = '#5a63df';

/** Muted label text, one class so it never drifts. */
export const MUTED = 'text-slate-500 dark:text-slate-400';

/**
 * De-emphasised furniture — row chevrons, empty-state icons. Was
 * slate-300/slate-600, which sits near 2:1 against both surfaces; these clear
 * the 3:1 bar for non-text UI in both themes.
 */
export const FAINT = 'text-slate-400 dark:text-slate-500';

/**
 * The "open this panel's full page" link in a PanelTitle action slot.
 */
export const PANEL_LINK =
  'inline-flex items-center gap-0.5 rounded-sm text-slate-500 transition-colors hover:text-[#5a63df] dark:text-slate-400 dark:hover:text-[#afb5ff] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#131315]';

/** Chevron that brightens with its parent row/link. */
export const ROW_CHEVRON =
  'shrink-0 transition-colors text-slate-400 group-hover:text-[#5a63df] dark:text-slate-500 dark:group-hover:text-[#afb5ff]';

/**
 * Hover surface for a clickable row (attempt log entry, Cambridge test tile,
 * resource row).
 */
export const ROW_HOVER =
  'hover:border-[#e4e2f0] hover:bg-[#f7f6fd] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:hover:border-white/10 dark:hover:bg-white/6 dark:focus-visible:ring-offset-[#08080a]';

export const PILL_BASE =
  'inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[9px] font-bold uppercase tracking-wide leading-normal';

export const pillTone = (tone) =>
  ({
    ok: 'text-[rgb(var(--signal-ok))] border-[rgb(var(--signal-ok)/0.35)] bg-[rgb(var(--signal-ok)/0.08)] dark:bg-[rgb(var(--signal-ok)/0.14)]',
    warn: 'text-[rgb(var(--signal-warn))] border-[rgb(var(--signal-warn)/0.35)] bg-[rgb(var(--signal-warn)/0.08)] dark:bg-[rgb(var(--signal-warn)/0.14)]',
    fault:
      'text-[rgb(var(--signal-fault))] border-[rgb(var(--signal-fault)/0.35)] bg-[rgb(var(--signal-fault)/0.08)] dark:bg-[rgb(var(--signal-fault)/0.14)]',
    accent:
      'text-[#5a63df] dark:text-[#afb5ff] border-[#5a63df]/25 dark:border-[#8f97ff]/30 bg-[#5a63df]/[0.07] dark:bg-[#8f97ff]/[0.14]',
    rose: 'text-rose-600 dark:text-rose-300 border-rose-500/25 bg-rose-500/[0.07] dark:bg-rose-400/[0.14]',
    sky: 'text-sky-600 dark:text-sky-300 border-sky-500/25 bg-sky-500/[0.07] dark:bg-sky-400/[0.14]',
    amber:
      'text-amber-600 dark:text-amber-300 border-amber-500/25 bg-amber-500/[0.07] dark:bg-amber-400/[0.14]',
    emerald:
      'text-emerald-600 dark:text-emerald-300 border-emerald-500/25 bg-emerald-500/[0.07] dark:bg-emerald-400/[0.14]',
    neutral: 'text-slate-500 dark:text-slate-300 border-slate-200 dark:border-white/[0.14]',
  })[tone] || pillTone('neutral');

/**
 * Tinted fill for a meter track. Brand indigo at 16% simply vanishes on a
 * near-black panel, so dark mode swaps hue *and* opacity rather than only
 * turning the opacity up on a colour that has already gone muddy. 0.26 still
 * read as barely-there next to the WELL track underneath it — close enough
 * to the panel's own near-black that "band by module" bars looked like one
 * flat slab instead of four legible fills. Lifted further, short of the
 * hover state's intensity.
 */
export const ACCENT_FILL =
  'bg-[rgb(var(--panel-accent-tint)/0.16)] dark:bg-[rgb(var(--panel-accent-tint)/0.36)]';
export const ACCENT_FILL_HOVER =
  'group-hover:bg-[rgb(var(--panel-accent-tint)/0.26)] dark:group-hover:bg-[rgb(var(--panel-accent-tint)/0.48)]';

/** Signal-coded meter fills. Same lift as ACCENT_FILL, per signal. */
/**
 * At the old 0.16/0.22 opacity, a low-mastery skill's fill (barely 3% of the
 * track, per the width floor in SkillMasteryPanel) was indistinguishable from
 * the plain WELL track underneath it — five different-tone rows could all
 * read as "the same pale lavender" when several happened to share a tone.
 * Bumped enough to register as a clear hue even at a sliver of width.
 */
export const SIGNAL_FILL = {
  fault: 'bg-[rgb(var(--signal-fault)/0.30)] dark:bg-[rgb(var(--signal-fault)/0.32)]',
  warn: 'bg-[rgb(var(--signal-warn)/0.30)] dark:bg-[rgb(var(--signal-warn)/0.32)]',
  ok: 'bg-[rgb(var(--signal-ok)/0.30)] dark:bg-[rgb(var(--signal-ok)/0.32)]',
};

export const SIGNAL_TEXT = {
  fault: 'text-[rgb(var(--signal-fault))]',
  warn: 'text-[rgb(var(--signal-warn))]',
  ok: 'text-[rgb(var(--signal-ok))]',
};

export const Pill = ({ tone = 'neutral', className, children }) => (
  <span className={cn(PILL_BASE, pillTone(tone), className)}>{children}</span>
);

/**
 * Plan marker for the learner dashboard. The moving wash stays inside the
 * hairline pill so the badge feels alive without becoming a promotional glow.
 */
export const TierBadge = ({ tier = 'pro', className }) => {
  const normalizedTier = tier === 'premium' ? 'premium' : 'pro';
  const label = normalizedTier === 'premium' ? 'Premium' : 'Pro';

  return (
    <span
      className={cn(
        'dashboard-tier-badge w-fit',
        `dashboard-tier-badge--${normalizedTier}`,
        className
      )}
      aria-label={`${label} plan`}
    >
      <span className="dashboard-tier-badge__wash" aria-hidden="true" />
      <span className="dashboard-tier-badge__label">{label}</span>
    </span>
  );
};

/** Small AI capability marker used in navigation rows and compact feature lists. */
export const AiBadge = ({ active = false, className }) => (
  <span
    className={cn('dashboard-ai-badge w-fit', active && 'dashboard-ai-badge--active', className)}
    aria-label="AI feature"
  >
    <span className="dashboard-ai-badge__wash" aria-hidden="true" />
    <span className="dashboard-ai-badge__label">AI</span>
  </span>
);

const ICON_CHIP_TONES = {
  accent: 'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#8f97ff]/18 dark:text-[#afb5ff]',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/18 dark:text-amber-300',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/18 dark:text-emerald-300',
  rose: 'bg-rose-500/10 text-rose-600 dark:bg-rose-400/18 dark:text-rose-300',
  sky: 'bg-sky-500/10 text-sky-600 dark:bg-sky-400/18 dark:text-sky-300',
  neutral: 'bg-slate-100 text-slate-500 dark:bg-white/9 dark:text-slate-300',
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
      className="rounded-lg border border-[#e4e2f0] dark:border-white/[0.14] bg-white dark:bg-[#242427] px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-slate-700 dark:text-slate-100 shadow-xs"
    >
      {content}
    </TooltipContent>
  </Tooltip>
);

/** "What does this mean?" affordance next to a metric label. */
export const InfoTip = ({ children, label = 'What this means', className }) => (
  <Tooltip delayDuration={150}>
    <TooltipTrigger asChild>
      <button
        type="button"
        aria-label={label}
        className={cn(
          'inline-grid h-6 w-6 place-items-center -my-1 -mx-0.5 rounded-sm text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
          className
        )}
      >
        <Info className="w-3 h-3" />
      </button>
    </TooltipTrigger>
    <TooltipContent
      side="top"
      className="max-w-[190px] rounded-lg border border-[#e4e2f0] dark:border-white/[0.14] bg-white dark:bg-[#242427] px-2.5 py-1.5 text-[11px] font-medium leading-snug text-slate-700 dark:text-slate-100 shadow-xs"
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
      className={cn(
        'w-4 h-px',
        accent ? 'bg-[#5a63df] dark:bg-[#8f97ff]' : 'bg-slate-300 dark:bg-white/30'
      )}
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
          accent ? 'bg-[#5a63df] dark:bg-[#8f97ff]' : 'bg-slate-300 dark:bg-white/30'
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
 *
 * `bare` drops the panel shell and pulls the sub-line up onto the number's
 * baseline, for a strip of stats that already sits inside a panel. A bordered
 * tile nested in a bordered band inside a bordered panel is three rules to say
 * one thing, and it costs a third of the strip's height in chrome — see
 * `StatRail`, which is where this variant is meant to be used.
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
  bare = false,
  className,
}) => (
  <div
    className={cn(
      bare
        ? 'px-3 py-2.5'
        : cn(
            PANEL,
            size === 'sm' ? 'px-3 py-2' : 'px-3.5 py-3',
            'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/18'
          ),
      className
    )}
  >
    <div className="flex items-center gap-1.5">
      {icon && <IconChip icon={icon} tone={tone} size="sm" />}
      <p className={cn(MICRO, MUTED, bare && 'truncate')}>{label}</p>
      {tip && <InfoTip label={`About ${label}`}>{tip}</InfoTip>}
    </div>
    <div
      className={cn(
        'flex items-baseline gap-x-1.5',
        // Wrapping, not truncating: in a two-column rail on a phone the value
        // and its qualifier compete, and clipping turned a date into
        // "AUG 31, 2…" while the value itself broke mid-phrase. The qualifier
        // drops to its own line instead, which costs a line only when needed.
        bare ? 'mt-1 flex-wrap gap-y-0.5' : 'mt-1.5'
      )}
    >
      <span
        className={cn(
          NUM,
          'font-extrabold leading-none text-slate-900 dark:text-slate-50',
          bare && 'whitespace-nowrap',
          size === 'sm' || bare ? 'text-base' : 'text-2xl'
        )}
      >
        {value}
      </span>
      {unit && <span className={cn(MICRO, MUTED, 'leading-none')}>{unit}</span>}
      {delta}
      {bare && sub && <span className={cn(MICRO, MUTED, 'leading-tight')}>{sub}</span>}
    </div>
    {!bare && sub && <p className={cn(MICRO, MUTED, 'mt-1.5')}>{sub}</p>}
  </div>
);

/**
 * A row of `bare` stats separated by hairlines instead of by borders — the
 * instrument strip the panel system asks for, rather than a tray of cards.
 * Dividers only ever appear *between* cells, including across the wrap on
 * narrow screens, so the rail reads as one continuous instrument at any width.
 */
export const StatRail = ({ children, className }) => (
  <div
    className={cn(
      'grid grid-cols-2 sm:grid-cols-4',
      '[&>*]:border-[#eeedf7] dark:[&>*]:border-white/[0.07]',
      // Two columns: rules left of the even cells, above the wrapped row.
      '[&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t',
      // Four columns: one continuous run, no wrap, nothing left of cell one.
      'sm:[&>*:not(:first-child)]:border-l sm:[&>*:nth-child(n+3)]:border-t-0',
      className
    )}
  >
    {children}
  </div>
);

/** Plain thin progress bar — no label riding inside it. Use when the value/label sit outside. */
export const Bar = ({ value = 0, className }) => {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full', WELL, className)}>
      <div
        className="h-full rounded-full bg-[rgb(var(--panel-accent))] transition-[width] duration-500 ease-out"
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
          tone === 'accent' ? ACCENT_FILL : 'bg-slate-400/15 dark:bg-white/12'
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
 * A number that counts up to its value instead of appearing already-finished.
 *
 * Every headline figure on the learner panels — band scores, mistake counts,
 * readiness — used to snap straight to its final value on mount, which read as
 * inert next to the bars and rings beside it already animating in. This drives
 * a spring rather than a fixed-duration tween so it settles at the same relaxed
 * pace as everything else in the system, and it re-fires the same way on any
 * later value change (a timeframe switch, a new test scored), not just on
 * mount. Non-numeric values (`'—'`, `'--'`) pass through untouched.
 */
export const AnimatedNumber = ({ value, decimals = 1, prefix = '', suffix = '', className }) => {
  const numeric = Number(value);
  const isValid = Number.isFinite(numeric);
  const reduceMotion = useReducedMotion();
  const spring = useSpring(reduceMotion || !isValid ? numeric || 0 : 0, {
    stiffness: 140,
    damping: 22,
    mass: 0.6,
  });
  const [display, setDisplay] = useState(() =>
    (reduceMotion || !isValid ? numeric || 0 : 0).toFixed(decimals)
  );

  useEffect(() => {
    if (isValid) spring.set(numeric);
  }, [isValid, numeric, spring]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => setDisplay(latest.toFixed(decimals)));
    return unsubscribe;
  }, [spring, decimals]);

  if (!isValid) {
    return <span className={className}>{value}</span>;
  }
  return (
    <span className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
};

/**
 * Single-value donut. One arc, one number in the middle — used where a ratio is
 * the whole story (vocabulary mastered / total). Stroke-dash rather than an SVG
 * chart library so it stays crisp at 64px and costs nothing to render.
 */
export const Ring = ({
  value = 0,
  size = 64,
  stroke = 6,
  label,
  sublabel,
  tone = 'rgb(var(--panel-accent))',
}) => {
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
          className="stroke-[#eceafa] dark:stroke-white/13"
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
      'mt-3 border-t border-[#eceafa] pt-2.5 dark:border-white/10',
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
    {Icon && <Icon className={cn('h-5 w-5', FAINT)} />}
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

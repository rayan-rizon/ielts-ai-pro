import React, { useMemo } from 'react';
import { m } from 'framer-motion';
import { BarChart3, BookOpen, Flag, Headphones, Mic2, PenLine } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';
import { formatBand } from '../utils';
import {
  Empty,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  Pill,
  Tip,
  WELL,
} from '@/features/dashboard/components/primitives';

/**
 * Module icons are deliberately one calm tone rather than four.
 *
 * Colour on this page is reserved for meaning — amber marks the module to focus
 * on, green marks the strongest. Tinting each module its own hue as well turned
 * the panel into a rainbow and left the one signal that matters competing with
 * three that did not. The icon glyphs already distinguish the modules.
 */
const MODULE_UI = {
  reading: { label: 'Reading', short: 'R', icon: BookOpen },
  writing: { label: 'Writing', short: 'W', icon: PenLine },
  listening: { label: 'Listening', short: 'L', icon: Headphones },
  speaking: { label: 'Speaking', short: 'S', icon: Mic2 },
};

const SCALE_TICKS = [0, 3, 5, 7, 9];

/**
 * Ranked module comparison — weakest first.
 *
 * Ordering weakest-to-strongest turns the panel into an answer ("work on
 * Listening") instead of a lookup table the learner has to compare by eye. The
 * old version closed with a paragraph restating the top row in prose; the row
 * is already marked "Focus", so the footnote just carries the gap.
 */
function ModuleRow({ module, isWeakest, isBest }) {
  const config = MODULE_UI[module.type] || MODULE_UI.reading;
  const score = module.count > 0 ? Number(module.avg) : null;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, (score / 9) * 100));

  const tipContent =
    score == null
      ? `No scored ${config.label} test in this period yet.`
      : `Average of ${module.count} scored ${config.label} test${module.count === 1 ? '' : 's'}, out of band 9.`;

  return (
    <Tip content={tipContent}>
      <div className="flex items-center gap-2.5">
        <IconChip icon={config.icon} tone="neutral" size="sm" />
        <div className={cn('relative h-8 flex-1 overflow-hidden rounded-md', WELL)}>
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-md transition-[width] duration-700',
              isWeakest ? 'bg-[rgb(var(--signal-warn)/0.24)]' : 'bg-[#5a63df]/[0.16]'
            )}
            style={{ width: `${pct}%` }}
          />
          <div className="relative flex h-full items-center justify-between gap-2 px-3">
            <span className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
              {config.label}
            </span>
            <span className={cn(MICRO, MUTED, 'shrink-0')}>
              {module.count ? (
                <>
                  <span className={NUM}>{module.count}</span> scored
                </>
              ) : (
                'No score'
              )}
            </span>
          </div>
        </div>
        <span
          className={cn(
            NUM,
            'w-9 shrink-0 text-right text-sm font-bold',
            score == null
              ? 'text-slate-400 dark:text-slate-500'
              : 'text-slate-900 dark:text-slate-50'
          )}
        >
          {score == null ? '—' : formatBand(score)}
        </span>
        <span className="w-[52px] shrink-0 text-right">
          {isWeakest ? <Pill tone="warn">Focus</Pill> : isBest ? <Pill tone="ok">Best</Pill> : null}
        </span>
      </div>
    </Tip>
  );
}

/**
 * Every scored module plotted on one 0–9 scale.
 *
 * The ranked rows above answer "which module is weakest" one at a time; this
 * answers "how far apart are they, really" at a glance — four dots either
 * huddled together or spread across the scale tells a different story than
 * four numbers read in sequence, and it is a distinct chart form from the bars
 * used everywhere else on this row so the three cards don't all read as
 * variations on the same widget.
 */
function BandScale({ modules, target }) {
  const plotted = modules.filter((module) => module.score != null);
  if (plotted.length < 2) return null;

  const toPct = (value) => `${Math.max(1, Math.min(99, (value / 9) * 100))}%`;

  return (
    <div className="mt-3 border-t border-[#eceafa] pt-4 dark:border-white/[0.07]">
      <p className={cn(MICRO, MUTED, 'mb-4')}>All modules on one scale</p>
      <div className="relative mx-1 h-8">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200 dark:bg-white/10" />

        {target ? (
          <Tip content={`Your target band is ${formatBand(target)}.`}>
            <div
              className="absolute top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center"
              style={{ left: toPct(target) }}
            >
              <Flag
                className="mb-0.5 h-2.5 w-2.5 text-[rgb(var(--signal-warn))]"
                strokeWidth={2.5}
              />
              <span
                className="h-3.5 w-px border-l border-dashed border-[rgb(var(--signal-warn))]"
                aria-hidden="true"
              />
            </div>
          </Tip>
        ) : null}

        {plotted.map((module) => {
          const config = MODULE_UI[module.type] || MODULE_UI.reading;
          const tone = module.isWeakest
            ? 'bg-[rgb(var(--signal-warn))]'
            : module.isBest
              ? 'bg-[rgb(var(--signal-ok))]'
              : 'bg-[#5a63df]';
          return (
            <Tip key={module.type} content={`${config.label}: band ${formatBand(module.score)}`}>
              <div
                className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                style={{ left: toPct(module.score) }}
              >
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-[#131315]',
                    tone
                  )}
                  aria-hidden="true"
                />
                <span className={cn(MICRO, 'text-slate-500 dark:text-slate-400')}>
                  {config.short}
                </span>
              </div>
            </Tip>
          );
        })}
      </div>
      <div className="mt-4 flex justify-between">
        {SCALE_TICKS.map((tick) => (
          <span key={tick} className={cn(NUM, MICRO, 'text-slate-400 dark:text-slate-600')}>
            {tick}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ModuleRankingCard({ moduleStats = [], targetScore }) {
  const scoredModules = useMemo(
    () =>
      moduleStats
        .filter((item) => item.count > 0 && item.avg != null)
        .map((item) => ({
          ...item,
          score: Number(item.avg),
          label: MODULE_UI[item.type]?.label || item.type,
        })),
    [moduleStats]
  );

  const bestModule = useMemo(() => {
    if (!scoredModules.length) return null;
    return [...scoredModules].sort((a, b) => b.score - a.score)[0];
  }, [scoredModules]);

  const weakestModule = useMemo(() => {
    if (scoredModules.length < 2) return null;
    const sorted = [...scoredModules].sort((a, b) => a.score - b.score);
    return sorted[0].type !== bestModule?.type ? sorted[0] : null;
  }, [bestModule, scoredModules]);

  // Weakest first: the thing to act on should be the thing read first.
  const ordered = useMemo(() => {
    const withScore = [...scoredModules].sort((a, b) => a.score - b.score);
    const withoutScore = moduleStats.filter((item) => !(item.count > 0 && item.avg != null));
    return [...withScore, ...withoutScore];
  }, [moduleStats, scoredModules]);

  const scalePoints = useMemo(
    () =>
      scoredModules.map((module) => ({
        ...module,
        isWeakest: weakestModule?.type === module.type,
        isBest: scoredModules.length > 1 && bestModule?.type === module.type,
      })),
    [bestModule, scoredModules, weakestModule]
  );

  const spread =
    weakestModule && bestModule ? Math.abs(bestModule.score - weakestModule.score) : null;
  const parsedTarget = Number(targetScore);
  const hasTarget = Number.isFinite(parsedTarget) && parsedTarget > 0;

  return (
    <m.div variants={ITEM_VARIANTS} className="h-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle
          label="Band by module"
          accent
          tip="Your average band per module in this period, weakest listed first."
        />

        {ordered.length === 0 ? (
          <Empty icon={BarChart3} className="flex-1 content-center">
            No module scores in this period yet.
          </Empty>
        ) : (
          <>
            <div className="space-y-2">
              {ordered.map((module) => (
                <ModuleRow
                  key={module.type}
                  module={module}
                  isWeakest={weakestModule?.type === module.type}
                  isBest={scoredModules.length > 1 && bestModule?.type === module.type}
                />
              ))}
            </div>
            <BandScale modules={scalePoints} target={hasTarget ? parsedTarget : null} />
            <div className="flex-1" />
          </>
        )}

        <PanelFootnote>
          {spread != null ? (
            <>
              <span className={cn(NUM, 'font-bold')}>{formatBand(spread)}</span> bands between your
              weakest and strongest module
            </>
          ) : (
            'Score a test in a second module to compare.'
          )}
        </PanelFootnote>
      </section>
    </m.div>
  );
}

import React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Headphones, LineChart, Mic, PenLine } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { CONTAINER_VARIANTS, ITEM_VARIANTS } from '../constants';
import { formatBand } from '../utils';
import {
  Empty,
  FAINT,
  IconChip,
  MICRO,
  NUM,
  PANEL,
  PANEL_LINK,
  PanelFootnote,
  PanelTitle,
  Pill,
  ROW_CHEVRON,
  WELL,
} from '@/features/dashboard/components/primitives';
import AnalyticsHeader from './AnalyticsHeader';
import StatCards from './StatCards';
import EmptyReportCards from './EmptyReportCards';

const MODULES = [
  { key: 'reading', label: 'Reading', icon: BookOpen, href: '/reading-test' },
  { key: 'listening', label: 'Listening', icon: Headphones, href: '/listening-test' },
  { key: 'writing', label: 'Writing', icon: PenLine, href: '/writing-task' },
  { key: 'speaking', label: 'Speaking', icon: Mic, href: '/speaking-test' },
];

const CHART_CEILING = 9;
const CHART_FLOOR = 4;

function parseTargetScore(stats) {
  if (!stats?.targetScore) return null;
  const num = Number(stats.targetScore);
  return Number.isNaN(num) ? null : num;
}

/** Bands shown on the empty chart, widened downwards for unusually low targets. */
function chartBands(targetScore) {
  const floor = Math.min(CHART_FLOOR, Math.floor(targetScore ?? CHART_FLOOR));
  return Array.from({ length: CHART_CEILING - floor + 1 }, (_, i) => CHART_CEILING - i);
}

/** The one real value on an empty chart: the learner's own goal. */
function TargetLine({ targetScore, floor }) {
  const reduceMotion = useReducedMotion();
  const top = ((CHART_CEILING - targetScore) / (CHART_CEILING - floor)) * 100;

  return (
    <m.div
      className="absolute inset-x-0 flex -translate-y-1/2 items-center gap-2"
      style={{ top: `${top}%` }}
      initial={reduceMotion ? false : { clipPath: 'inset(0 100% 0 0)' }}
      animate={{ clipPath: 'inset(0 0% 0 0)' }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
    >
      <span className="flex-1 border-t border-dashed border-[#5a63df]/70 dark:border-[#8f97ff]/70" />
      <Pill tone="accent">Target {formatBand(targetScore)}</Pill>
    </m.div>
  );
}

function ChartScaffold({ targetScore }) {
  const bands = chartBands(targetScore);
  // The empty-state note takes whichever half the target line leaves free.
  const targetIsLow = targetScore != null && targetScore < 7;

  return (
    <div className="relative min-h-[280px] flex-1">
      <div className="absolute inset-x-0 inset-y-2">
        {bands.map((band, i) => (
          <div
            key={band}
            aria-hidden="true"
            className="absolute inset-x-0 flex -translate-y-1/2 items-center gap-2"
            style={{ top: `${(i / (bands.length - 1)) * 100}%` }}
          >
            <span className={cn(NUM, FAINT, 'w-3 text-right text-[10px] font-bold')}>{band}</span>
            <span className="flex-1 border-t border-[#eeedf7] dark:border-white/[0.06]" />
          </div>
        ))}

        {targetScore != null && (
          <div className="absolute inset-y-0 left-5 right-0">
            <TargetLine targetScore={targetScore} floor={bands.at(-1)} />
          </div>
        )}
      </div>

      <div
        className={cn(
          'absolute inset-0 flex justify-center py-4 pl-5',
          targetIsLow ? 'items-start' : 'items-end'
        )}
      >
        <Empty
          icon={LineChart}
          title="No scores yet"
          message="Your first scored test starts this line."
          className="rounded-xl bg-white py-3 dark:bg-[#121117]"
        />
      </div>
    </div>
  );
}

function TrajectoryPreview({ targetScore }) {
  return (
    <m.section
      variants={ITEM_VARIANTS}
      className={cn(PANEL, 'col-span-12 flex flex-col p-4 xl:col-span-5')}
    >
      <PanelTitle
        label="Band progress"
        accent
        action={
          <Link to="/onboarding" className={cn(PANEL_LINK, MICRO)}>
            {targetScore == null ? 'Set target' : 'Adjust target'}
            <ChevronRight className="h-3 w-3" />
          </Link>
        }
      />
      <ChartScaffold targetScore={targetScore} />
    </m.section>
  );
}

function ModuleStartRow({ module }) {
  return (
    <Link
      to={module.href}
      className="group flex flex-1 items-center gap-2.5 rounded-md transition-transform duration-150 ease-out active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#08080a]"
    >
      <div
        className={cn(
          WELL,
          'flex h-full min-h-11 flex-1 items-center justify-between gap-2 rounded-md border border-transparent px-2.5 transition-colors duration-150 group-hover:border-[#5a63df]/35 dark:group-hover:border-[#8f97ff]/35'
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <IconChip icon={module.icon} tone="accent" size="sm" />
          <span className="truncate text-[12px] font-extrabold text-slate-800 dark:text-slate-100">
            {module.label}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-[#5a63df] dark:text-[#afb5ff]">
          Start
          <ChevronRight className={cn('h-3.5 w-3.5', ROW_CHEVRON)} />
        </span>
      </div>
      <span aria-hidden="true" className={cn(NUM, FAINT, 'w-5 text-right text-sm font-bold')}>
        —
      </span>
    </Link>
  );
}

function ModuleBaselineCard() {
  return (
    <m.section
      variants={ITEM_VARIANTS}
      className={cn(PANEL, 'col-span-12 flex flex-col p-4 md:col-span-7 xl:col-span-4')}
    >
      <PanelTitle label="Band by module" accent />
      <div className="flex flex-1 flex-col gap-2">
        {MODULES.map((module) => (
          <ModuleStartRow key={module.key} module={module} />
        ))}
      </div>
      <PanelFootnote>Score all four for an overall band</PanelFootnote>
    </m.section>
  );
}

/**
 * Empty Analytics View: the report's own shapes, waiting for data.
 *
 * Mirrors the dashboard's zero state: real axes, real row labels and empty
 * tracks instead of paragraphs about what will appear. The only value plotted
 * is the learner's target. The four module rows are the way in.
 */
export default function EmptyAnalyticsView({ headerProps, stats, progressToTarget = 0 }) {
  const targetScore = parseTargetScore(stats);
  const isPremium = Boolean(headerProps?.isPremium);

  return (
    <TooltipProvider delayDuration={150}>
      <m.div
        variants={CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-[1600px] space-y-3"
      >
        <AnalyticsHeader {...headerProps} />
        <StatCards stats={stats} progressToTarget={progressToTarget} />

        <div className="grid grid-cols-12 gap-3">
          <TrajectoryPreview targetScore={targetScore} />
          <ModuleBaselineCard />
          <EmptyReportCards isPremium={isPremium} />
        </div>
      </m.div>
    </TooltipProvider>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CalendarDays, Flag, Rocket, Sparkles, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';
import { clamp01, formatBand } from '../utils';
import { buildJourneyMilestones, isBand } from './bandJourneyUtils';

const TONES = {
  baseline: {
    dot: 'border-slate-200 bg-slate-400 ring-slate-100 dark:border-slate-700 dark:ring-white/5',
    text: 'text-slate-600 dark:text-slate-300',
  },
  completed: {
    dot: 'border-blue-200 bg-blue-500 ring-blue-100 dark:border-blue-800 dark:ring-blue-500/10',
    text: 'text-blue-600 dark:text-blue-300',
  },
  current: {
    dot: 'border-violet-200 bg-violet-600 ring-violet-100/90 dark:border-violet-800 dark:ring-violet-500/10',
    text: 'text-violet-700 dark:text-violet-200',
  },
  future: {
    dot: 'border-emerald-200 bg-emerald-500 ring-emerald-100 dark:border-emerald-800 dark:ring-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-300',
  },
  target: {
    dot: 'border-amber-200 bg-amber-500 ring-amber-100 dark:border-amber-800 dark:ring-amber-500/10',
    text: 'text-amber-600 dark:text-amber-300',
  },
};

const JOURNEY_PATH =
  'M70 180 C130 180 170 145 250 145 C320 145 360 160 430 155 C500 150 540 105 610 105 C685 105 710 140 790 130 C860 120 900 68 960 58';

const JOURNEY_POSITIONS = [
  { x: 7, y: 69 },
  { x: 25, y: 58 },
  { x: 43, y: 62 },
  { x: 61, y: 39 },
  { x: 79, y: 54 },
  { x: 96, y: 22 },
];

function positionSteps(steps) {
  return steps.map((step, index) => {
    const positionIndex =
      steps.length === 1
        ? 0
        : Math.round((index * (JOURNEY_POSITIONS.length - 1)) / (steps.length - 1));
    return { ...step, ...JOURNEY_POSITIONS[positionIndex] };
  });
}

function formatChange(change) {
  if (!Number.isFinite(change)) return null;
  return `${change > 0 ? '+' : ''}${formatBand(change)}`;
}

function getWeeksUntil(testDate) {
  if (!testDate) return null;
  const date = new Date(testDate);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return null;
  if (days < 7) return `${days} day${days === 1 ? '' : 's'}`;
  const weeks = Math.ceil(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'}`;
}

function JourneyRobot({ reduceMotion }) {
  return (
    <motion.div
      className="absolute bottom-full left-1/2 mb-3 flex -translate-x-1/2 flex-col items-center"
      animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
      transition={reduceMotion ? undefined : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 96 104"
        className="h-14 w-14 drop-shadow-[0_8px_14px_rgba(99,70,230,0.24)] sm:h-16 sm:w-16"
      >
        <defs>
          <linearGradient id="journeyBotShell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ddd8ff" />
          </linearGradient>
          <linearGradient id="journeyBotScreen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3420a6" />
            <stop offset="100%" stopColor="#151050" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="43" r="42" fill="#f1efff" opacity="0.92" />
        <rect
          x="18"
          y="16"
          width="60"
          height="54"
          rx="24"
          fill="url(#journeyBotShell)"
          stroke="#cbc3ff"
          strokeWidth="2"
        />
        <circle cx="17" cy="43" r="6" fill="#7656f3" />
        <circle cx="79" cy="43" r="6" fill="#7656f3" />
        <path d="M48 16V8" stroke="#7656f3" strokeWidth="3" strokeLinecap="round" />
        <circle cx="48" cy="6" r="4" fill="#7656f3" />
        <rect x="27" y="28" width="42" height="27" rx="12" fill="url(#journeyBotScreen)" />
        <path
          d="M35 42c3-5 7-5 10 0m6 0c3-5 7-5 10 0"
          stroke="#8ff1ff"
          strokeWidth="2.7"
          strokeLinecap="round"
        />
        <rect
          x="36"
          y="68"
          width="24"
          height="25"
          rx="11"
          fill="url(#journeyBotShell)"
          stroke="#cbc3ff"
          strokeWidth="2"
        />
        <circle cx="48" cy="81" r="7" fill="#7046ec" />
        <path d="M45 84l3-7 3 7z" fill="#fff" />
      </svg>
      <span className="-mt-1.5 h-4 w-1 rounded-full bg-violet-300 dark:bg-violet-500/40" />
    </motion.div>
  );
}

function TargetFlag() {
  return (
    <div
      className="absolute bottom-full left-1/2 mb-3 flex -translate-x-1/2 flex-col items-center"
      aria-hidden="true"
    >
      <Flag className="h-8 w-8 fill-amber-400 text-amber-500 drop-shadow-sm sm:h-10 sm:w-10" />
      <span className="-mt-2 h-5 w-1 rounded-full bg-amber-400" />
      <Sparkles className="absolute -right-4 top-0 h-3.5 w-3.5 text-amber-400" />
    </div>
  );
}

/** Resolve the Tailwind text-color class for a score change value. */
function getChangeColor(change) {
  if (change == null || change === 0) return 'text-slate-700 dark:text-slate-200';
  return change > 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300';
}

/** Format the change arrow + value string. */
function getChangeLabel(change) {
  if (change == null) return '—';
  const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '•';
  return `${arrow} ${formatChange(change)}`;
}

/** Animated SVG line chart for the sparkline widget. */
function SparklineChart({ path, last }) {
  return (
    <svg viewBox="0 0 140 48" className="h-9 w-20" aria-hidden="true">
      <defs>
        <linearGradient id="journeySparkline" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9c86fa" />
          <stop offset="100%" stopColor="#6645ef" />
        </linearGradient>
      </defs>
      {path && <path d={`${path} L 134 47 L 6 47 Z`} fill="url(#journeySparkline)" opacity="0.1" />}
      {path && (
        <motion.path
          d={path}
          fill="none"
          stroke="url(#journeySparkline)"
          strokeWidth="2.8"
          strokeLinecap="round"
          pathLength="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      )}
      {last && <circle cx={last.x} cy={last.y} r="3.5" fill="#6645ef" />}
    </svg>
  );
}

function JourneySparkline({ history, change }) {
  const points = useMemo(() => {
    if (history.length < 2) return [];
    const scores = history.map((item) => item.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = Math.max(0.5, max - min);
    return scores.map((score, index) => ({
      x: 6 + (index * 128) / (scores.length - 1),
      y: 39 - ((score - min) / range) * 29,
    }));
  }, [history]);

  const path = points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
  const last = points[points.length - 1];

  return (
    <div className="hidden min-w-[200px] rounded-xl border border-slate-100 bg-white/90 px-3 py-2 shadow-[0_12px_28px_-24px_rgba(30,41,59,0.55)] dark:border-white/10 dark:bg-slate-900/80 md:flex md:items-center md:gap-3">
      <div>
        <p className={cn('text-base font-black tracking-tight', getChangeColor(change))}>
          {getChangeLabel(change)}
        </p>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {change == null ? 'Need 2 scored sessions' : 'Since previous score'}
        </p>
      </div>
      <SparklineChart path={path} last={last} />
    </div>
  );
}

function JourneyStat({ icon: Icon, tone, label, value, detail, progress }) {
  return (
    <div className="min-w-0 px-3 py-2.5 sm:px-4">
      <div className="flex items-start gap-2.5">
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', tone)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-0.5 text-lg font-black tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>
          <p className="mt-0.5 text-[11px] font-medium leading-tight text-slate-500 dark:text-slate-400">
            {detail}
          </p>
        </div>
      </div>
      {progress != null ? (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-500/15">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Derive the milestone kind from its step keys and position. */
function getMilestoneKind(step, index, currentIndex) {
  if (step.keys.includes('current')) return 'current';
  if (step.keys.includes('target')) return 'target';
  if (step.keys.includes('baseline')) return 'baseline';
  return index > currentIndex ? 'future' : 'completed';
}

/** Build the accessible description text for a milestone. */
function getMilestoneDescription(kind, step) {
  if (kind === 'current') return 'Your current overall band from completed scored practice.';
  if (kind === 'target') return 'Your saved target band.';
  if (kind === 'baseline') return 'Your earliest scored baseline in this selected period.';
  if (kind === 'future')
    return `${formatBand(Math.max(0, step.value - Number(step.currentScore || 0)))} band from your current score.`;
  return 'Milestone completed in your progress history.';
}

/** The dot indicator for a milestone node. */
function MilestoneDot({ tone, isCurrent, selected }) {
  return (
    <span
      className={cn(
        'relative flex h-7 w-7 items-center justify-center rounded-full border-[3px] shadow-md ring-4 transition duration-200 group-hover:scale-110 sm:h-9 sm:w-9 sm:border-4',
        tone.dot,
        isCurrent && 'h-10 w-10 ring-6 sm:h-12 sm:w-12 sm:ring-8',
        selected && !isCurrent && 'scale-110 ring-8'
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white" />
    </span>
  );
}

/** Animated tooltip shown when a milestone is active. */
function MilestoneTooltip({ id, step, description, isCurrent, isTarget }) {
  const positionClass = isCurrent
    ? 'left-full top-1/2 ml-4 -translate-y-1/2'
    : isTarget
      ? 'right-full top-1/2 mr-4 -translate-y-1/2'
      : 'left-1/2 top-full mt-10 -translate-x-1/2';
  return (
    <motion.span
      id={id}
      role="tooltip"
      initial={{ opacity: 0, y: 5, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        'absolute z-50 w-40 rounded-xl bg-slate-950 px-3 py-2 text-left text-white shadow-[0_16px_38px_rgba(15,23,42,0.3)] dark:bg-white dark:text-slate-950',
        positionClass
      )}
    >
      <span className="block text-xs font-black">Band {formatBand(step.value)}</span>
      <span className="mt-0.5 block text-[10px] font-medium leading-relaxed text-slate-300 dark:text-slate-600">
        {description}
      </span>
    </motion.span>
  );
}

/** Band score + label text placed above/below a milestone dot. */
function MilestoneLabel({ step, tone, labelBelow }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute left-1/2 w-16 -translate-x-1/2 text-center sm:w-24',
        labelBelow ? 'top-full mt-3' : 'bottom-full mb-3'
      )}
    >
      <span
        className={cn(
          'block text-[13px] font-black leading-none tracking-tight sm:text-lg',
          tone.text
        )}
      >
        {formatBand(step.value)}
      </span>
      <span
        className={cn('mt-0.5 block text-[8px] font-bold leading-tight sm:text-[10px]', tone.text)}
      >
        {step.label}
      </span>
    </span>
  );
}

/** Empty state shown when no scored history is available. */
function JourneyEmptyState() {
  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full">
      <Card className="h-full rounded-[26px] border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-950">
        <CardContent className="flex min-h-60 flex-col items-center justify-center text-center">
          <Sparkles className="mb-3 h-8 w-8 text-indigo-300" />
          <p className="font-bold text-slate-900 dark:text-white">
            Your journey starts with a scored test
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Complete any IELTS module to establish a real baseline.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** The SVG journey path + milestone nodes. Extracted to reduce main component LoC/cc. */
function JourneyPathSvg({
  ready,
  reduceMotion,
  journey,
  selectedKey,
  hoveredKey,
  setSelectedKey,
  setHoveredKey,
}) {
  return (
    <div
      className="relative mt-1 h-[210px] overflow-visible sm:mt-2 sm:h-[240px]"
      data-testid="band-journey-path"
    >
      <svg
        viewBox="0 0 1000 260"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="journeyBase" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d8deec" />
            <stop offset="100%" stopColor="#e7eaf2" />
          </linearGradient>
          <linearGradient id="journeyProgress" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#aebce6" />
            <stop offset="30%" stopColor="#4f82f4" />
            <stop offset="62%" stopColor="#7046ec" />
            <stop offset="82%" stopColor="#36b67c" />
            <stop offset="100%" stopColor="#f3b32b" />
          </linearGradient>
          <filter id="journeyPathGlow" x="-10%" y="-20%" width="120%" height="140%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={JOURNEY_PATH}
          fill="none"
          stroke="url(#journeyBase)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d={JOURNEY_PATH}
          fill="none"
          stroke="url(#journeyProgress)"
          strokeWidth="5"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={ready ? 0 : 1}
          filter="url(#journeyPathGlow)"
          style={{
            transition: reduceMotion
              ? 'none'
              : 'stroke-dashoffset 1.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        />
      </svg>
      {journey.steps.map((step, index) => (
        <Milestone
          key={step.key}
          step={{ ...step, currentScore: journey.current }}
          index={index}
          currentIndex={journey.currentIndex}
          active={selectedKey === step.key || hoveredKey === step.key}
          selected={selectedKey === step.key}
          onToggle={(key) => setSelectedKey((prev) => (prev === key ? null : key))}
          onHover={setHoveredKey}
          reduceMotion={reduceMotion}
          ready={ready}
        />
      ))}
    </div>
  );
}

/** Pre-compute all aria- props to move ternaries out of the Milestone render. */
function getMilestoneAriaProps({ active, selected, isCurrent, tooltipId, step, description }) {
  return {
    'aria-pressed': selected,
    'aria-expanded': active,
    'aria-describedby': active ? tooltipId : undefined,
    'aria-current': isCurrent ? 'step' : undefined,
    'aria-label': `Band ${formatBand(step.value)}: ${step.label}. ${description}`,
  };
}

/** CSS classes for the dashed connector line above/below a milestone. */
function getMilestoneConnectorClass(labelBelow) {
  return cn(
    'absolute left-1/2 w-px -translate-x-1/2 border-l border-dashed border-slate-200 dark:border-white/15',
    labelBelow ? 'top-full h-9' : 'bottom-full h-8'
  );
}

function Milestone({
  step,
  index,
  currentIndex,
  active,
  selected,
  onToggle,
  onHover,
  reduceMotion,
  ready,
}) {
  const kind = getMilestoneKind(step, index, currentIndex);
  const isCurrent = kind === 'current';
  const isTarget = kind === 'target';
  const tone = TONES[kind];
  const labelBelow = isCurrent || isTarget;
  const description = getMilestoneDescription(kind, step);
  const tooltipId = `band-journey-${step.key}-tooltip`;

  const animate = { opacity: ready ? 1 : 0, scale: ready ? 1 : 0.7, y: ready ? 0 : 8 };
  const transition = {
    delay: reduceMotion ? 0 : index * 0.1,
    type: reduceMotion ? 'tween' : 'spring',
    stiffness: 250,
    damping: 18,
  };
  const ariaProps = getMilestoneAriaProps({
    active,
    selected,
    isCurrent,
    tooltipId,
    step,
    description,
  });

  return (
    <div
      className={cn('absolute -translate-x-1/2 -translate-y-1/2', active ? 'z-30' : 'z-10')}
      style={{ left: `${step.x}%`, top: `${step.y}%` }}
    >
      <motion.button
        type="button"
        initial={false}
        animate={animate}
        transition={transition}
        onClick={() => onToggle(step.key)}
        onMouseEnter={() => onHover(step.key)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(step.key)}
        onBlur={() => onHover(null)}
        {...ariaProps}
        className="group relative block text-left outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-4"
      >
        {!isCurrent && !isTarget && (
          <span className={getMilestoneConnectorClass(labelBelow)} aria-hidden="true" />
        )}
        {isCurrent && <JourneyRobot reduceMotion={reduceMotion} />}
        {isTarget && <TargetFlag />}
        <MilestoneLabel step={step} tone={tone} labelBelow={labelBelow} />
        <MilestoneDot tone={tone} isCurrent={isCurrent} selected={selected} />
        {active && (
          <MilestoneTooltip
            id={tooltipId}
            step={step}
            description={description}
            isCurrent={isCurrent}
            isTarget={isTarget}
          />
        )}
      </motion.button>
    </div>
  );
}

/**
 * Pure computation — builds the journey data model from raw props.
 * Extracted to reduce the main component's cyclomatic complexity.
 */
/** Compute progress percentage from baseline → current → target. */
function computeProgress(current, baseline, target) {
  if (target > baseline)
    return Math.round(clamp01((current - baseline) / (target - baseline)) * 100);
  return current >= target ? 100 : 0;
}

/** Return the module with the lowest average score, or undefined. */
function findWeakestModule(moduleStats) {
  return moduleStats
    .filter((m) => m.count > 0 && isBand(m.avg))
    .slice()
    .sort((a, b) => Number(a.avg) - Number(b.avg))[0];
}

function buildJourney({ currentScore, targetScore, testHistory, testDate, moduleStats }) {
  const history = testHistory
    .filter((item) => isBand(item?.score))
    .map((item) => ({ score: Number(item.score), date: item.date }))
    .slice(-10);
  const current = isBand(currentScore) ? Number(currentScore) : 0;
  const target = isBand(targetScore) && Number(targetScore) > 0 ? Number(targetScore) : 7;
  const baseline = history.length ? history[0].score : current;
  const steps = positionSteps(buildJourneyMilestones({ baseline, current, target }));
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.keys.includes('current'))
  );
  const previousScore = history.length > 1 ? history[history.length - 2].score : null;
  const next = steps.slice(currentIndex + 1).find((s) => s.value > current + 0.01) || null;
  const weakestModule = findWeakestModule(moduleStats);

  return {
    current,
    target,
    steps,
    currentIndex,
    history,
    change: previousScore == null ? null : Number((current - previousScore).toFixed(1)),
    next,
    progress: computeProgress(current, baseline, target),
    weeksUntil: getWeeksUntil(testDate),
    weakestModule,
    animationKey: `${baseline}-${current}-${target}-${history.map((item) => item.score).join('-')}`,
  };
}

/**
 * Stats grid + CTA panel rendered below the journey path.
 */
function JourneyFooter({ journey, nextBand, nextGap, focusCopy, selectedStep }) {
  const navigate = useNavigate();

  return (
    <>
      <div className="grid divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white/70 py-0.5 shadow-[0_10px_24px_-24px_rgba(15,23,42,0.5)] dark:divide-white/10 dark:border-white/10 dark:bg-slate-900/50 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        <JourneyStat
          icon={ArrowUpRight}
          tone="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
          label="Overall progress"
          value={`${journey.progress}%`}
          detail="From baseline to target"
          progress={journey.progress}
        />
        <JourneyStat
          icon={Target}
          tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
          label="To next milestone"
          value={`${formatBand(nextGap)}`}
          detail={nextGap ? 'band to go' : 'milestone reached'}
        />
        <JourneyStat
          icon={CalendarDays}
          tone="bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
          label={journey.weeksUntil ? 'Time to exam' : 'Exam schedule'}
          value={journey.weeksUntil || 'Not set'}
          detail={
            journey.weeksUntil ? 'Based on your saved exam date' : 'Set an exam date in settings'
          }
        />
        <JourneyStat
          icon={Flag}
          tone="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
          label="Target band"
          value={formatBand(journey.target)}
          detail="Your saved IELTS goal"
        />
      </div>

      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-violet-100 bg-violet-50/65 p-3 dark:border-violet-500/15 dark:bg-violet-500/5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm dark:bg-slate-900 dark:text-violet-300">
            <Rocket className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-950 dark:text-white">
              Next milestone: Band {formatBand(nextBand)}
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              {focusCopy}
            </p>
            <p className="sr-only" aria-live="polite">
              Selected: Band {formatBand(selectedStep.value)} · {selectedStep.label}
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/learning-path')}
          className="h-9 shrink-0 rounded-lg bg-violet-600 px-4 text-xs font-extrabold text-white hover:bg-violet-700"
        >
          View Study Plan <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
    </>
  );
}

/** Manage the two-frame animation-ready state for milestone entrance. */
function useJourneyAnimation(animationKey, reduceMotion) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (reduceMotion) {
      setReady(true);
      return undefined;
    }
    setReady(false);
    let secondFrame;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
    };
  }, [animationKey, reduceMotion]);
  return ready;
}

export default function BandScoreJourney({
  currentScore,
  targetScore,
  testHistory = [],
  testDate,
  moduleStats = [],
}) {
  const reduceMotion = useReducedMotion();
  const [selectedKey, setSelectedKey] = useState(null);
  const [hoveredKey, setHoveredKey] = useState(null);

  const journey = useMemo(
    () => buildJourney({ currentScore, targetScore, testHistory, testDate, moduleStats }),
    [currentScore, moduleStats, targetScore, testDate, testHistory]
  );

  const ready = useJourneyAnimation(journey.animationKey, reduceMotion);

  if (!journey.current) return <JourneyEmptyState />;

  const selectedStep =
    journey.steps.find((step) => step.key === selectedKey) || journey.steps[journey.currentIndex];
  const nextBand = journey.next?.value || journey.target;
  const nextGap = Math.max(0, nextBand - journey.current);
  const focusCopy = journey.weakestModule
    ? `Focus on ${journey.weakestModule.type} to close your next band gap.`
    : 'Keep completing scored practice to reveal your strongest next step.';

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full">
      <Card className="h-full overflow-hidden rounded-[22px] border-slate-200/80 bg-[radial-gradient(circle_at_85%_0%,rgba(230,224,255,0.35),transparent_25%),linear-gradient(145deg,#ffffff_0%,#fcfbff_56%,#ffffff_100%)] shadow-[0_16px_42px_-34px_rgba(15,23,42,0.56)] dark:border-white/10 dark:bg-slate-950">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-600 shadow-sm dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 sm:h-12 sm:w-12">
                <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-[-0.035em] text-slate-950 dark:text-white sm:text-2xl">
                  Your Band Journey
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
                  Track your growth toward your target band
                </p>
              </div>
            </div>
            <JourneySparkline history={journey.history} change={journey.change} />
          </div>

          <JourneyPathSvg
            ready={ready}
            reduceMotion={reduceMotion}
            journey={journey}
            selectedKey={selectedKey}
            hoveredKey={hoveredKey}
            setSelectedKey={setSelectedKey}
            setHoveredKey={setHoveredKey}
          />

          <JourneyFooter
            journey={journey}
            nextBand={nextBand}
            nextGap={nextGap}
            focusCopy={focusCopy}
            selectedStep={selectedStep}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  CalendarDays,
  Flag,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';
import { clamp01, formatBand } from '../utils';
import { buildJourneyMilestones, isBand } from './bandJourneyUtils';

const TONES = {
  baseline: {
    dot: 'border-slate-300 bg-slate-500 ring-slate-100 dark:border-slate-600 dark:ring-white/10',
    text: 'text-slate-600 dark:text-slate-300',
  },
  completed: {
    dot: 'border-indigo-300 bg-indigo-600 ring-indigo-100 dark:border-indigo-700 dark:ring-indigo-500/20',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  current: {
    dot: 'border-violet-300 bg-violet-600 ring-violet-200/90 shadow-[0_0_14px_rgba(139,92,246,0.4)] dark:border-violet-500 dark:ring-violet-500/30',
    text: 'text-violet-700 dark:text-violet-300 font-bold',
  },
  next: {
    dot: 'border-emerald-300 bg-emerald-500 ring-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.35)] dark:border-emerald-700 dark:ring-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400 font-bold',
  },
  future: {
    dot: 'border-slate-200 bg-slate-300 ring-slate-100 dark:border-slate-700 dark:ring-slate-800',
    text: 'text-slate-500 dark:text-slate-400',
  },
  target: {
    dot: 'border-amber-300 bg-amber-500 ring-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.35)] dark:border-amber-600 dark:ring-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400 font-bold',
  },
};

// Dot positions as percentages of the container (x%, y%)
// SVG coords: x_svg = x * 10,  y_svg = y * 2.6  (viewBox 1000×260, preserveAspectRatio=none)
// Dot (7, 69)  → (70, 179)   Dot (25, 56) → (250, 146)   Dot (43, 63) → (430, 164)
// Dot (61, 38) → (610,  99)  Dot (79, 53) → (790, 138)   Dot (96, 35) → (960,  91)
const JOURNEY_PATH =
  'M70 179 C150 179 170 146 250 146 C330 146 350 164 430 164 C510 164 530 99 610 99 C690 99 710 138 790 138 C870 138 900 91 960 91';

const JOURNEY_POSITIONS = [
  { x: 7, y: 69 },
  { x: 25, y: 56 },
  { x: 43, y: 63 },
  { x: 61, y: 38 },
  { x: 79, y: 53 },
  { x: 96, y: 35 },
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
      className="absolute bottom-full left-1/2 mb-1.5 flex -translate-x-1/2 flex-col items-center"
      animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
      transition={reduceMotion ? undefined : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 96 104"
        className="h-10 w-10 drop-shadow-[0_4px_12px_rgba(124,58,237,0.35)] sm:h-12 sm:w-12"
      >
        <defs>
          <linearGradient id="journeyBotShell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ddd8ff" />
          </linearGradient>
          <linearGradient id="journeyBotScreen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4c1d95" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="43" r="42" fill="#ede9fe" opacity="0.9" />
        <rect
          x="18"
          y="16"
          width="60"
          height="54"
          rx="24"
          fill="url(#journeyBotShell)"
          stroke="#c4b5fd"
          strokeWidth="2"
        />
        <circle cx="17" cy="43" r="6" fill="#7c3aed" />
        <circle cx="79" cy="43" r="6" fill="#7c3aed" />
        <path d="M48 16V8" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" />
        <circle cx="48" cy="6" r="4" fill="#7c3aed" />
        <rect x="27" y="28" width="42" height="27" rx="12" fill="url(#journeyBotScreen)" />
        <path
          d="M35 42c3-5 7-5 10 0m6 0c3-5 7-5 10 0"
          stroke="#a7f3d0"
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
          stroke="#c4b5fd"
          strokeWidth="2"
        />
        <circle cx="48" cy="81" r="7" fill="#7c3aed" />
        <path d="M45 84l3-7 3 7z" fill="#fff" />
      </svg>
      {/* connector pin from bot down to dot */}
      <span className="h-4 w-[2px] rounded-full bg-gradient-to-b from-violet-400 to-violet-200 dark:from-violet-500 dark:to-violet-800" />
    </motion.div>
  );
}

function TargetFlag() {
  return (
    <div
      className="absolute bottom-full left-1/2 mb-1 flex -translate-x-1/2 flex-col items-center pointer-events-none"
      aria-hidden="true"
    >
      <div className="relative">
        <Flag className="h-6 w-6 fill-amber-400 text-amber-500 drop-shadow-xs sm:h-7 sm:w-7" />
        <Sparkles className="absolute -right-2.5 -top-1 h-3 w-3 text-amber-400" />
      </div>
      <span className="-mt-1 h-2.5 w-1 rounded-full bg-amber-400" />
    </div>
  );
}

function getChangeColor(change) {
  if (change == null || change === 0) return 'text-slate-700 dark:text-slate-200';
  return change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
}

function getChangeLabel(change) {
  if (change == null) return '—';
  const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '•';
  return `${arrow} ${formatChange(change)}`;
}

function SparklineChart({ path, last, change }) {
  const strokeColor = change > 0 ? '#10b981' : change < 0 ? '#f43f5e' : '#7c3aed';
  return (
    <svg viewBox="0 0 140 48" className="h-8 w-18" aria-hidden="true">
      <defs>
        <linearGradient id="journeySparkline" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.8} />
          <stop offset="100%" stopColor={strokeColor} />
        </linearGradient>
      </defs>
      {path && (
        <path d={`${path} L 134 47 L 6 47 Z`} fill="url(#journeySparkline)" opacity="0.12" />
      )}
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
      {last && <circle cx={last.x} cy={last.y} r="3.5" fill={strokeColor} />}
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
    <div className="hidden min-w-[185px] rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 shadow-xs dark:border-white/10 dark:bg-slate-900/80 md:flex md:items-center md:gap-3">
      <div>
        <p className={cn('text-sm font-bold tracking-tight', getChangeColor(change))}>
          {getChangeLabel(change)}
        </p>
        <p className="mt-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          {change == null ? 'Need 2 scored sessions' : 'Since previous score'}
        </p>
      </div>
      <SparklineChart path={path} last={last} change={change} />
    </div>
  );
}

function JourneyStat({ icon: Icon, tone, label, value, detail, progress }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 dark:border-white/10 dark:bg-slate-900/50">
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            'flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg mt-0.5',
            tone
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none">
            {label}
          </p>
          <p className="mt-0.5 text-base font-bold tracking-tight text-slate-950 dark:text-white leading-tight">
            {value}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold leading-tight text-slate-500 dark:text-slate-400 truncate">
            {detail}
          </p>
        </div>
      </div>
      {progress != null ? (
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-950">
          <motion.div
            className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      ) : null}
    </div>
  );
}

function getMilestoneKind(step, index, currentIndex) {
  if (step.keys.includes('current')) return 'current';
  if (step.keys.includes('target')) return 'target';
  if (step.keys.includes('baseline')) return 'baseline';
  if (index === currentIndex + 1) return 'next';
  return index > currentIndex ? 'future' : 'completed';
}

function getMilestoneDescription(kind, step) {
  if (kind === 'current') return 'Your current overall band from completed scored practice.';
  if (kind === 'target') return 'Your saved target band.';
  if (kind === 'baseline') return 'Your earliest scored baseline in this selected period.';
  if (kind === 'next')
    return `${formatBand(Math.max(0, step.value - Number(step.currentScore || 0)))} band from your current score to reach this next milestone.`;
  if (kind === 'future')
    return `${formatBand(Math.max(0, step.value - Number(step.currentScore || 0)))} band ahead on your learning roadmap.`;
  return 'Milestone completed in your progress history.';
}

function MilestoneDot({ tone, isCurrent, selected }) {
  return (
    <span
      className={cn(
        'relative flex items-center justify-center rounded-full border-[3px] shadow-sm ring-4 transition-all duration-200 group-hover:scale-110',
        'h-6 w-6 sm:h-7.5 sm:w-7.5 sm:border-[3.5px]',
        tone.dot,
        isCurrent && 'h-8 w-8 ring-[5px] sm:h-10 sm:w-10 sm:ring-6',
        selected && !isCurrent && 'scale-110 ring-5'
      )}
    >
      <span
        className={cn(
          'rounded-full bg-white shadow-xs',
          isCurrent ? 'h-2.5 w-2.5 sm:h-3 sm:w-3' : 'h-1.5 w-1.5 sm:h-2 sm:w-2'
        )}
      />
    </span>
  );
}

function MilestoneTooltip({ id, step, description, labelBelow, isCurrent, isTarget }) {
  const alignClass = useMemo(() => {
    if (isTarget || (step.x > 80 && step.y < 35)) {
      return 'right-full top-1/2 -translate-y-1/2 mr-3 sm:mr-4';
    }

    if (step.x < 15) {
      return 'left-full top-1/2 -translate-y-1/2 ml-3 sm:ml-4';
    }

    if (isCurrent) {
      return 'left-1/2 -translate-x-1/2 bottom-full mb-18 sm:mb-20';
    }

    let horizontal = 'left-1/2 -translate-x-1/2';
    if (step.x > 75) {
      horizontal = 'right-0 translate-x-0';
    } else if (step.x < 25) {
      horizontal = 'left-0 translate-x-0';
    }

    let vertical = step.y < 35 ? 'top-full mt-8 sm:mt-10' : 'bottom-full mb-8 sm:mb-10';
    if (labelBelow && step.y >= 35) {
      vertical = 'bottom-full mb-10 sm:mb-12';
    }

    return `${horizontal} ${vertical}`;
  }, [step.x, step.y, labelBelow, isCurrent, isTarget]);

  return (
    <motion.div
      id={id}
      role="tooltip"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'absolute z-50 w-48 sm:w-56 rounded-2xl border border-slate-200 bg-white p-3 text-left text-slate-950 shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:text-white',
        alignClass
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold">Band {formatBand(step.value)}</span>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold uppercase text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {step.label}
        </span>
      </div>
      <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </motion.div>
  );
}

function MilestoneLabel({ step, tone, labelBelow }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute left-1/2 w-18 -translate-x-1/2 text-center sm:w-22',
        labelBelow ? 'top-full mt-2.5' : 'bottom-full mb-2.5'
      )}
    >
      <span
        className={cn(
          'block text-xs font-bold leading-none tracking-tight sm:text-base',
          tone.text
        )}
      >
        {formatBand(step.value)}
      </span>
      <span
        className={cn(
          'mt-0.5 block text-[8.5px] font-bold leading-tight sm:text-[10px]',
          tone.text
        )}
      >
        {step.label}
      </span>
    </span>
  );
}

function JourneyEmptyState() {
  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full">
      <Card className="h-full rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-950">
        <CardContent className="flex min-h-52 flex-col items-center justify-center text-center p-4">
          <Sparkles className="mb-2 h-7 w-7 text-indigo-400" />
          <p className="font-bold text-slate-900 dark:text-white text-sm">
            Your journey starts with a scored test
          </p>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Complete any IELTS module to establish a real baseline.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

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
      className="relative my-auto flex-1 min-h-[180px] sm:min-h-[210px] overflow-visible"
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
            <stop offset="0%" stopColor="#c7d2fe" />
            <stop offset="100%" stopColor="#e0e7ff" />
          </linearGradient>
          <linearGradient id="journeyProgress" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
        {/* Shadow/glow halo track */}
        <path
          d={JOURNEY_PATH}
          fill="none"
          stroke="#a5b4fc"
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.18"
        />
        {/* Base muted track */}
        <path
          d={JOURNEY_PATH}
          fill="none"
          stroke="url(#journeyBase)"
          strokeWidth="6"
          strokeLinecap="round"
          className="opacity-60 dark:opacity-25"
        />
        {/* Animated progress stroke */}
        <path
          d={JOURNEY_PATH}
          fill="none"
          stroke="url(#journeyProgress)"
          strokeWidth="5"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={ready ? 0 : 1}
          style={{
            transition: reduceMotion
              ? 'none'
              : 'stroke-dashoffset 1.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
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

function getMilestoneAriaProps({ active, selected, isCurrent, tooltipId, step, description }) {
  return {
    'aria-pressed': selected,
    'aria-expanded': active,
    'aria-describedby': active ? tooltipId : undefined,
    'aria-current': isCurrent ? 'step' : undefined,
    'aria-label': `Band ${formatBand(step.value)}: ${step.label}. ${description}`,
  };
}

function getMilestoneConnectorClass(labelBelow) {
  return cn(
    'absolute left-1/2 w-px -translate-x-1/2 border-l border-dashed border-slate-200 dark:border-white/15',
    labelBelow ? 'top-full h-7 sm:h-8' : 'bottom-full h-6 sm:h-7'
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
        className="group relative block text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-4"
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
            labelBelow={labelBelow}
            isCurrent={isCurrent}
            isTarget={isTarget}
          />
        )}
      </motion.button>
    </div>
  );
}

function computeProgress(current, baseline, target) {
  if (target > baseline)
    return Math.round(clamp01((current - baseline) / (target - baseline)) * 100);
  return current >= target ? 100 : 0;
}

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

function JourneyFooter({ journey, nextBand, nextGap, focusCopy, selectedStep }) {
  const navigate = useNavigate();

  return (
    <div className="mt-auto space-y-2 pt-2">
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <JourneyStat
          icon={TrendingUp}
          tone="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
          label="Practice progress"
          value={`${journey.progress}%`}
          detail="From baseline to target"
          progress={journey.progress}
        />
        <JourneyStat
          icon={Target}
          tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          label="To next milestone"
          value={`${formatBand(nextGap)}`}
          detail={nextGap ? 'band to go' : 'milestone reached'}
        />
        <JourneyStat
          icon={CalendarDays}
          tone="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          label={journey.weeksUntil ? 'Time to exam' : 'Exam schedule'}
          value={journey.weeksUntil || 'Not set'}
          detail={journey.weeksUntil ? 'Based on saved exam date' : 'Set an exam date in settings'}
        />
        <JourneyStat
          icon={Flag}
          tone="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
          label="Target band"
          value={formatBand(journey.target)}
          detail="Your saved IELTS goal"
        />
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200/70 bg-gradient-to-r from-indigo-50/40 to-slate-50/60 p-2.5 dark:border-white/10 dark:from-indigo-950/30 dark:to-slate-900/50 sm:flex-row sm:items-center sm:justify-between sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 shadow-xs dark:bg-indigo-950 dark:text-indigo-300">
            <Rocket className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">
              Next practice milestone: {formatBand(nextBand)}
            </p>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              {focusCopy}
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/learning-path')}
          className="h-8 shrink-0 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs cursor-pointer"
        >
          View Study Plan <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

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

  const nextBand = journey.next?.value || journey.target;
  const nextGap = Math.max(0, nextBand - journey.current);
  const focusCopy = journey.weakestModule
    ? `Focus on ${journey.weakestModule.type} to close your next band gap.`
    : 'Keep completing scored practice to reveal your strongest next step.';

  const selectedStep =
    journey.steps.find((step) => step.key === selectedKey) || journey.steps[journey.currentIndex];

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full">
      <Card className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-slate-950">
        <CardContent className="flex h-full flex-col justify-between p-3.5 sm:p-4">
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-slate-950 dark:text-white">
                  Practice Score Journey
                </h2>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Average of your completed scored practice
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

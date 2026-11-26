import React, { useMemo, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Clock3,
  Flame,
  Gauge,
  Headphones,
  Lock,
  Mic,
  PenLine,
  RotateCcw,
  Target,
} from 'lucide-react';
import {
  AnimatedNumber,
  FADE_UP,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  Pill,
  Ring,
  TILE,
  WELL,
} from '@/features/dashboard/components/primitives';
import { CardHeader, PlanCard } from '../PlanCard';
import { cn } from '@/lib/cn';

const BASE_SCHEDULE = [
  {
    id: 'mon',
    day: 'MON',
    task: 'T/F/NG',
    fullTitle: 'Reading: True / False / Not Given',
    minutes: 25,
    module: 'Reading',
    active: true,
  },
  {
    id: 'tue',
    day: 'TUE',
    task: 'Task 2',
    fullTitle: 'Writing Task 2 Coherence Drill',
    minutes: 35,
    module: 'Writing',
  },
  {
    id: 'wed',
    day: 'WED',
    task: 'Speak P2',
    fullTitle: 'Speaking Part 2 Fluency Cue Card',
    minutes: 25,
    module: 'Speaking',
  },
  {
    id: 'thu',
    day: 'THU',
    task: 'Listen S2',
    fullTitle: 'Listening Section 2 Map Traps',
    minutes: 30,
    module: 'Listening',
  },
  {
    id: 'fri',
    day: 'FRI',
    task: 'Headings',
    fullTitle: 'Reading: Matching Headings Timed',
    minutes: 30,
    module: 'Reading',
  },
  {
    id: 'sat',
    day: 'SAT',
    task: 'Task 1',
    fullTitle: 'Writing Task 1 Trend Analysis',
    minutes: 40,
    module: 'Writing',
  },
  {
    id: 'sun',
    day: 'SUN',
    task: 'Review',
    fullTitle: 'Weekly Weak-Spot Error Review',
    minutes: 30,
    module: 'Mixed',
  },
];

const REBALANCED_OVERRIDES = {
  wed: {
    task: 'Speak P2',
    fullTitle: 'Skipped — redistributed automatically',
    minutes: 0,
    skipped: true,
  },
  thu: {
    task: 'Listen + P2',
    fullTitle: 'Listening S2 + Part 2 Cue Card (rebalanced)',
    minutes: 42,
    shifted: true,
  },
  fri: {
    task: 'Headings+',
    fullTitle: 'Matching Headings + Fluency Wrap-up',
    minutes: 43,
    shifted: true,
  },
};

const SKILL_BRIDGES = [
  {
    label: 'Reading',
    icon: BookOpen,
    current: 6.5,
    target: 7.5,
    note: 'Fix T/F/NG (38%) & Headings',
    primary: false,
  },
  {
    label: 'Writing',
    icon: PenLine,
    current: 5.5,
    target: 7.0,
    note: 'Priority gap · Task 2 Coherence & Task 1',
    primary: true,
  },
  {
    label: 'Speaking',
    icon: Mic,
    current: 6.0,
    target: 7.5,
    note: 'Part 2 Fluency & Lexical Range',
    primary: false,
  },
  {
    label: 'Listening',
    icon: Headphones,
    current: 7.0,
    target: 7.5,
    note: 'Section 2 Maps & Distractors',
    primary: false,
  },
];

const STUDY_PHASES = [
  {
    step: 1,
    title: 'Fix high-cost score leaks',
    range: 'Week 1–2',
    status: 'Active focus',
    state: 'current',
  },
  {
    step: 2,
    title: 'Timed section pacing & traps',
    range: 'Week 3',
    status: 'Locked · Pro',
    state: 'later',
  },
  {
    step: 3,
    title: 'Full mock & Band lock-in',
    range: 'Week 4',
    status: 'Locked · Pro',
    state: 'later',
  },
];

const HEATMAP_SAMPLE = [
  [0, 1, 2, 1, 0],
  [2, 3, 2, 0, 1],
  [1, 2, 3, 2, 2],
  [0, 2, 1, 3, 2],
  [2, 3, 2, 3, 3],
];

const HEAT_TONES = [
  'bg-[#f4f3fb] dark:bg-white/[0.06]',
  'bg-[#5a63df]/20 dark:bg-[#8f97ff]/25',
  'bg-[#5a63df]/45 dark:bg-[#8f97ff]/50',
  'bg-[#5a63df]/80 dark:bg-[#8f97ff]/80',
];

export function PaywallStatsStrip({ exam, skipWed }) {
  const daysDisplay = exam.daysLeft ?? 28;
  const kpis = [
    {
      label: 'Target band',
      icon: Target,
      tone: 'accent',
      value: Number(exam.targetLabel),
      decimals: 1,
      suffix: '',
      footer: 'Calibrated to Cambridge rubrics',
    },
    {
      label: 'Exam readiness',
      icon: Gauge,
      tone: 'sky',
      value: 68,
      decimals: 0,
      suffix: '%',
      footer: 'Updates after every scored test',
    },
    {
      label: 'Days to exam',
      icon: Calendar,
      tone: 'amber',
      value: daysDisplay,
      decimals: 0,
      suffix: 'd',
      footer: exam.dateLabel ? `Exam: ${exam.dateLabel}` : 'Set any target exam date',
    },
    {
      label: 'Weekly cadence',
      icon: Clock3,
      tone: 'emerald',
      value: 3.6,
      decimals: 1,
      suffix: 'h/wk',
      footer: skipWed ? 'Auto-rebalanced · 6 active days' : 'Balanced · 45 min/day',
    },
  ];

  return (
    <m.section
      variants={FADE_UP}
      className="grid grid-cols-2 gap-2 lg:grid-cols-4"
      aria-label="Study plan preview summary"
    >
      {kpis.map((item) => (
        <div
          key={item.label}
          className={cn(
            TILE,
            'flex min-w-0 flex-col justify-between bg-linear-to-b from-white to-[#faf9ff] px-3.5 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5a63df]/30 dark:from-[#141319] dark:to-[#100f15] dark:hover:border-white/15'
          )}
        >
          <div>
            <div className="flex items-center gap-1.5 min-w-0">
              <IconChip icon={item.icon} tone={item.tone} size="sm" />
              <p className={cn(MICRO, 'text-slate-600 dark:text-slate-300 truncate')}>
                {item.label}
              </p>
            </div>
            <p
              className={cn(
                NUM,
                'mt-1.5 text-xl font-extrabold leading-tight text-slate-900 dark:text-slate-50 sm:text-[22px]'
              )}
            >
              <AnimatedNumber value={item.value} decimals={item.decimals} suffix={item.suffix} />
            </p>
          </div>
          <p className="mt-1.5 truncate border-t border-[#eceafa] pt-1.5 text-[11px] font-medium text-slate-600 dark:border-white/[0.07] dark:text-slate-300">
            {item.footer}
          </p>
        </div>
      ))}
    </m.section>
  );
}

function slotTone(slot, selected) {
  if (slot.skipped) {
    return {
      box: 'border-[rgb(var(--signal-fault)/0.45)] bg-[rgb(var(--signal-fault)/0.08)]',
      day: 'text-[rgb(var(--signal-fault))]',
      task: 'text-slate-500 line-through dark:text-slate-400',
      minutes: 'text-[rgb(var(--signal-fault))]',
    };
  }
  const accent = 'text-[#5a63df] dark:text-[#afb5ff]';
  const quiet = 'text-slate-600 dark:text-slate-300';
  const strong = 'text-slate-900 dark:text-white';
  if (slot.shifted) {
    return {
      box: 'border-[#5a63df]/55 bg-[#5a63df]/[0.09] dark:border-[#8f97ff]/55 dark:bg-[#5a63df]/22',
      day: accent,
      task: strong,
      minutes: accent,
    };
  }
  if (selected) {
    return {
      box: 'border-[#5a63df] bg-[#5a63df]/[0.09] dark:border-[#8f97ff] dark:bg-[#5a63df]/22',
      day: accent,
      task: strong,
      minutes: quiet,
    };
  }
  return {
    box: 'border-[#e4e2f0] bg-white hover:border-[#5a63df]/40 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/25',
    day: quiet,
    task: strong,
    minutes: quiet,
  };
}

function ScheduleSlot({ slot, selected, onSelect }) {
  const tone = slotTone(slot, selected);

  return (
    <m.button
      layout
      type="button"
      onClick={() => onSelect(slot.id)}
      aria-pressed={selected}
      className={cn(
        'rounded-lg border p-2 text-center transition-[border-color,background-color,transform] duration-150 ease-smooth-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
        tone.box
      )}
    >
      <p className={cn(MICRO, tone.day)}>{slot.day}</p>
      <p className={cn('mt-1 truncate text-[11px] font-bold', tone.task)}>{slot.task}</p>
      <p className={cn(NUM, 'mt-0.5 text-[10px] font-semibold', tone.minutes)}>
        {slot.skipped ? 'Skipped' : `${slot.minutes}m`}
      </p>
    </m.button>
  );
}

function ExamHeadline({ exam }) {
  const band = (
    <span className={cn(NUM, 'text-[#5a63df] dark:text-[#afb5ff]')}>{exam.targetLabel}</span>
  );
  return (
    <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">
      {exam.daysLeft ? (
        <>
          <span className={NUM}>{exam.daysLeft}</span> days to Band {band}
        </>
      ) : (
        <>Built for Band {band}</>
      )}
    </p>
  );
}

function RescheduleBanner({ exam, skipWed, onToggleSkipWed }) {
  return (
    <div className={cn(TILE, 'flex flex-wrap items-center justify-between gap-3 p-3.5')}>
      <div className="flex min-w-0 items-center gap-3.5">
        <Ring value={68} size={58} stroke={5.5} label="68%" />
        <div className="min-w-0">
          <p className={cn(MICRO, MUTED)}>LIVE AUTO-RESCHEDULE DEMO</p>
          <ExamHeadline exam={exam} />
          <p className={cn('mt-0.5 text-[11px]', MUTED)}>
            Miss a study day? Click to see your week rebalance without losing momentum.
          </p>
        </div>
      </div>

      <button
        type="button"
        aria-pressed={skipWed}
        onClick={onToggleSkipWed}
        className={cn(
          'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold transition-[transform,background-color,border-color,color] duration-150 ease-smooth-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
          skipWed
            ? 'border-[#5a63df] bg-[#5a63df] text-white'
            : 'border-[#e4e2f0] bg-white text-slate-700 hover:border-[#5a63df]/45 hover:text-[#5a63df] dark:border-white/12 dark:bg-white/5 dark:text-slate-200 dark:hover:text-[#b8bdff]'
        )}
      >
        {skipWed ? (
          <>
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Reset Wed
          </>
        ) : (
          'Simulate: Skip Wed →'
        )}
      </button>
    </div>
  );
}

function SelectedDayStrip({ slot: selectedSlot, skipWed }) {
  return (
    <AnimatePresence mode="wait">
      <m.div
        key={`${selectedSlot.id}-${skipWed ? 'skip' : 'base'}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          WELL,
          'flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs'
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              selectedSlot.skipped
                ? 'bg-[rgb(var(--signal-fault))]'
                : 'bg-[#5a63df] dark:bg-[#8f97ff]'
            )}
          />
          <span className="truncate font-bold text-slate-800 dark:text-slate-100">
            {selectedSlot.day}: {selectedSlot.fullTitle}
          </span>
        </div>
        <span
          className={cn(
            'text-[11px] font-bold',
            skipWed ? 'text-[#5a63df] dark:text-[#afb5ff]' : MUTED
          )}
        >
          {skipWed
            ? 'Rebalanced! Wed shifted to Thu & Fri'
            : `${selectedSlot.module} · ${selectedSlot.minutes} min`}
        </span>
      </m.div>
    </AnimatePresence>
  );
}

export function LiveRescheduleCard({ exam, skipWed, onToggleSkipWed }) {
  const [selectedDayId, setSelectedDayId] = useState('mon');

  const schedule = useMemo(
    () =>
      BASE_SCHEDULE.map((slot) =>
        skipWed && REBALANCED_OVERRIDES[slot.id]
          ? { ...slot, ...REBALANCED_OVERRIDES[slot.id] }
          : slot
      ),
    [skipWed]
  );

  const selectedSlot = schedule.find((s) => s.id === selectedDayId) || schedule[0];

  return (
    <m.div variants={FADE_UP}>
      <PlanCard aria-label="Adaptive 7-day schedule preview">
        <CardHeader
          title="Adaptive 7-day schedule"
          aside={skipWed ? 'Rebalanced · Auto-shifted' : 'Balanced · 45 min/day'}
        >
          <Pill tone="accent">
            <Lock className="h-2.5 w-2.5" aria-hidden="true" />
            Sample Preview
          </Pill>
        </CardHeader>

        {/* Readiness Ring + Live Auto-Reschedule Simulation */}
        <RescheduleBanner exam={exam} skipWed={skipWed} onToggleSkipWed={onToggleSkipWed} />

        {/* 7-Day Interactive Strip */}
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-7">
          {schedule.map((slot) => (
            <ScheduleSlot
              key={slot.id}
              slot={slot}
              selected={slot.id === selectedSlot.id}
              onSelect={setSelectedDayId}
            />
          ))}
        </div>

        {/* Animated Status / Selected Day Detail Strip */}
        <SelectedDayStrip slot={selectedSlot} skipWed={skipWed} />
      </PlanCard>
    </m.div>
  );
}

function SkillBridgeRow({ item, index: idx }) {
  const Icon = item.icon;
  const currentPct = Math.min(100, (item.current / 9) * 100);
  const targetPct = Math.min(100, (item.target / 9) * 100);
  const bridgeWidth = Math.max(0, targetPct - currentPct);
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
          <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          {item.label}
        </span>
        <span className={cn(NUM, 'font-bold text-slate-700 dark:text-slate-200')}>
          {item.current.toFixed(1)}{' '}
          <span className="text-[#5a63df] dark:text-[#afb5ff]">→ {item.target.toFixed(1)}</span>
        </span>
      </div>
      <div className={cn('relative mt-1.5 h-1.5 overflow-visible rounded-full', WELL)}>
        {/* Subtle bridge projection up to target tick */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 rounded-r-full bg-[#5a63df]/18 dark:bg-[#8f97ff]/22"
          style={{ left: `${currentPct}%`, width: `${bridgeWidth}%` }}
        />
        {/* Current band fill — restrained slate/indigo */}
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${currentPct}%` }}
          transition={{ duration: 0.55, delay: 0.08 * idx, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'relative h-full rounded-full',
            item.primary ? 'bg-[#5a63df] dark:bg-[#8f97ff]' : 'bg-[#5a63df]/55 dark:bg-[#8f97ff]/60'
          )}
        />
        <span
          aria-hidden="true"
          className="absolute inset-y-[-3px] w-px -translate-x-1/2 bg-slate-500 dark:bg-white/70"
          style={{ left: `${targetPct}%` }}
        />
      </div>
      <p
        className={cn(
          'mt-1 text-[11px]',
          item.primary ? 'font-medium text-[#5a63df] dark:text-[#afb5ff]' : MUTED
        )}
      >
        {item.note}
      </p>
    </div>
  );
}

function SkillBridgeCard() {
  return (
    <PlanCard aria-label="Module band bridge preview">
      <CardHeader title="4-Skill target bridge" aside="Target tick shown" />
      <div className="grid gap-3">
        {SKILL_BRIDGES.map((item, idx) => (
          <SkillBridgeRow key={item.label} item={item} index={idx} />
        ))}
      </div>
    </PlanCard>
  );
}

function PhaseItem({ phase, isLast }) {
  const isCurrent = phase.state === 'current';
  return (
    <li className="relative grid grid-cols-[24px_1fr] gap-x-3 pb-3.5 last:pb-0">
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute left-[11.5px] top-6 bottom-0 w-px bg-[#e4e2f0] dark:bg-white/10"
        />
      )}
      <span
        className={cn(
          NUM,
          'relative z-10 flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold',
          isCurrent
            ? 'border-[#5a63df] bg-[#5a63df]/12 text-[#4a52c9] dark:border-[#8f97ff] dark:bg-[#8f97ff]/18 dark:text-[#afb5ff]'
            : 'border-[#e4e2f0] bg-white text-slate-400 dark:border-white/15 dark:bg-white/[0.04]'
        )}
      >
        {phase.step}
      </span>
      <div
        className={cn(
          'rounded-lg',
          isCurrent && '-mt-1 bg-[#5a63df]/[0.06] px-2.5 py-1.5 dark:bg-[#8f97ff]/[0.09]'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
            {phase.title}
          </p>
          <span className={cn(NUM, 'shrink-0 text-[10px] font-semibold', MUTED)}>
            {phase.range}
          </span>
        </div>
        <p
          className={cn(
            'text-[10.5px]',
            isCurrent ? 'font-semibold text-[#5a63df] dark:text-[#afb5ff]' : MUTED
          )}
        >
          {phase.status}
        </p>
      </div>
    </li>
  );
}

function ConsistencyTracker() {
  return (
    <div className="border-t border-[#eceafa] pt-3 dark:border-white/[0.07]">
      <div className="mb-2 flex items-center justify-between">
        <span className={cn('flex items-center gap-1.5', MICRO, MUTED)}>
          <Flame className="h-3 w-3 text-[#5a63df] dark:text-[#afb5ff]" aria-hidden="true" />
          5-WEEK CONSISTENCY TRACKER
        </span>
        <span className={cn(NUM, 'text-[11px] font-bold text-slate-700 dark:text-slate-200')}>
          18 active days
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {HEATMAP_SAMPLE.map((col, cIdx) => (
          <div key={cIdx} className="grid grid-cols-5 gap-1">
            {col.map((lvl, rIdx) => (
              <span key={rIdx} className={cn('h-2.5 rounded-[3px]', HEAT_TONES[lvl])} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapCard() {
  return (
    <PlanCard aria-label="Study phases and consistency preview" className="justify-between">
      <div>
        <CardHeader title="Roadmap phases" aside="4-week cycle" />
        <ol className="mt-3 space-y-0">
          {STUDY_PHASES.map((phase, idx) => (
            <PhaseItem key={phase.step} phase={phase} isLast={idx === STUDY_PHASES.length - 1} />
          ))}
        </ol>
      </div>

      {/* Mini Consistency Heatmap */}
      <ConsistencyTracker />
    </PlanCard>
  );
}

export function SkillBridgeAndPhasesRow() {
  return (
    <m.div variants={FADE_UP} className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {/* 4-Skill Target Bridge — restrained monochrome-indigo palette matching instrument panel */}
      <SkillBridgeCard />
      {/* Study Phases + Consistency Heatmap */}
      <RoadmapCard />
    </m.div>
  );
}

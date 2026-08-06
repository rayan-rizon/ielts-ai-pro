import React, { useEffect, useMemo, useRef, useState } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Circle,
  Compass,
  Play,
  Target,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import {
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  Pill,
  TILE,
  TITLE,
  WELL,
} from '@/features/dashboard/components/primitives';
import { buildRoadmapViewModel, getFriendlyPlanText, getFriendlyTaskTitle } from './dashboardUtils';

const STATUS_TONE = { Completed: 'ok', 'In Progress': 'accent', Upcoming: 'accent' };
const STATUS_LABEL = {
  Completed: 'Done',
  'In Progress': 'Current',
  Upcoming: 'Next',
  Planned: 'Planned',
  Condensed: 'Condensed',
};

function PhaseStatusBadge({ status }) {
  return (
    <Pill tone={STATUS_TONE[status] || 'neutral'}>
      {status === 'In Progress' && (
        <span className="h-1.5 w-1.5 rounded-full bg-[#5a63df] motion-safe:animate-pulse dark:bg-[#8f97ff]" />
      )}
      {status === 'Completed' && <CheckCircle2 className="h-3 w-3" />}
      {STATUS_LABEL[status] || status}
    </Pill>
  );
}

/**
 * Progress track that grows from zero on mount instead of appearing already
 * finished. The number beside it counts the same journey, so the bar and the
 * readout agree at every frame.
 */
function ProgressLine({ value = 0, tone = 'accent' }) {
  const reduceMotion = useReducedMotion();
  const pct = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full', WELL)}>
      <m.div
        className={cn(
          'h-full rounded-full',
          tone === 'ok'
            ? 'bg-[rgb(var(--signal-ok))]'
            : 'bg-[linear-gradient(90deg,#5a63df,#8f97ff)]'
        )}
        initial={reduceMotion ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={
          reduceMotion ? { duration: 0 } : { duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.1 }
        }
      />
    </div>
  );
}

function PhaseChecklist({ checklist }) {
  return (
    <ul className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
      {checklist?.map((item) => (
        <li
          key={item.label}
          className="flex items-start gap-2"
          aria-label={`${item.done ? 'Complete' : 'Not complete'}: ${getFriendlyPlanText(item.label)}`}
        >
          {item.done ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-ok))]" />
          ) : (
            <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
          )}
          <span className={cn('font-medium leading-snug', item.done && MUTED)}>
            {getFriendlyPlanText(item.label)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PhaseCard({ phase, index, onStart, selected, onSelect, cardRef }) {
  const completed = phase.status === 'Completed';
  const inProgress = phase.status === 'In Progress';
  const progressPercent = completed ? 100 : phase.progressPercent;

  return (
    <div ref={cardRef} className="relative flex h-full min-w-0 flex-1 snap-center flex-col">
      <article
        tabIndex={selected ? 0 : -1}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect();
          }
        }}
        className={cn(
          TILE,
          'flex h-full min-w-0 flex-1 cursor-pointer flex-col p-3.5 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
          selected
            ? 'border-[#5a63df]/45 bg-white shadow-sm dark:bg-white/7.5'
            : 'hover:border-[#d6d9f5] dark:hover:border-white/16'
        )}
        aria-current={inProgress ? 'step' : undefined}
        aria-label={`Stage ${index + 1}, ${phase.shortName}, ${phase.status}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={cn(MICRO, MUTED)}>Stage {index + 1}</span>
          <PhaseStatusBadge status={phase.status} />
        </div>

        <h3 className={cn(TITLE, 'mt-2 text-sm')}>{phase.shortName}</h3>

        <div className="mt-2.5 flex items-center gap-2.5">
          <ProgressLine value={progressPercent} tone={completed ? 'ok' : 'accent'} />
          <span
            className={cn(
              NUM,
              'w-8 shrink-0 text-right text-xs font-extrabold',
              completed
                ? 'text-[rgb(var(--signal-ok))]'
                : inProgress
                  ? 'text-[#5a63df] dark:text-[#afb5ff]'
                  : 'text-slate-500 dark:text-slate-400'
            )}
          >
            {progressPercent}%
          </span>
        </div>
        <p className="mt-1.5 text-[11px] font-bold leading-snug text-slate-700 dark:text-slate-300">
          {completed ? 'Stage complete' : getFriendlyPlanText(phase.progressLabel)}
        </p>

        <p className="mt-2.5 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
          {getFriendlyPlanText(phase.objective)}
        </p>

        <PhaseChecklist checklist={phase.checklist} />

        <div className="mt-auto space-y-2.5 pt-3.5">
          {phase.dateRange && (
            <p className={cn(MICRO, 'flex items-center gap-1.5', MUTED)}>
              <CalendarRange className="h-3 w-3" aria-hidden="true" /> {phase.dateRange}
            </p>
          )}

          {phase.checkpoint && (
            <p
              className="flex items-start gap-1.5 border-t border-[#eceafa] pt-2.5 text-xs font-medium leading-snug text-slate-700 dark:border-white/10 dark:text-slate-300"
              title={phase.checkpoint}
            >
              <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5a63df]" />
              <span>
                <strong className="font-bold text-slate-900 dark:text-white">Ready when:</strong>{' '}
                {getFriendlyPlanText(phase.checkpointShort || phase.checkpoint)}
              </span>
            </p>
          )}

          <div className="flex min-h-8 items-center">
            {inProgress && phase.actionTask && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onStart(phase.actionTask);
                }}
                className="inline-flex w-full items-center justify-between rounded-lg bg-[#5a63df] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#4a52c9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
              >
                <span className="truncate">Start: {getFriendlyTaskTitle(phase.actionTask)}</span>
                <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0" />
              </button>
            )}
            {completed && (
              <Pill tone="ok">
                <CheckCircle2 className="h-3 w-3" /> Evidence confirmed
              </Pill>
            )}
            {!inProgress && !completed && (
              <Pill tone="accent">Open anytime · verified progress</Pill>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

/**
 * The stage rail.
 *
 * One continuous track carries a single fill whose head sits exactly where the
 * learner is: a completed stage moves it to the next node, a half-finished
 * current stage leaves it halfway between two. So the line is not decoration —
 * its length is the same evidence the four cards below are scored on. Nodes are
 * buttons; arrow keys walk the rail and the matching card scrolls into view.
 */
function InteractiveStageRail({ phases, selectedIndex, onSelect, railFill }) {
  const reduceMotion = useReducedMotion();
  const nodeRefs = useRef([]);

  const handleKeyDown = (event) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = Math.min(phases.length - 1, Math.max(0, selectedIndex + delta));
    onSelect(next);
    nodeRefs.current[next]?.focus();
  };

  return (
    <nav aria-label="Learning path stages" className="w-full">
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[12.5%] top-4 h-[3px] -translate-y-1/2"
        >
          <div className={cn('h-full w-full rounded-full', WELL)} />
          <m.div
            className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#5a63df,#8f97ff)]"
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: `${railFill}%` }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.95, ease: [0.23, 1, 0.32, 1], delay: 0.15 }
            }
          >
            {!reduceMotion && railFill > 2 && (
              <span className="absolute inset-0 overflow-hidden rounded-full">
                <m.span
                  className="absolute inset-y-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.85),transparent)]"
                  initial={{ x: '-140%' }}
                  animate={{ x: '440%' }}
                  transition={{
                    duration: 2.4,
                    ease: 'easeInOut',
                    repeat: Infinity,
                    repeatDelay: 1.4,
                  }}
                />
              </span>
            )}
            {railFill > 0 && railFill < 100 && (
              <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-[#5a63df] ring-[3px] ring-[#5a63df]/25 motion-safe:animate-pulse dark:bg-[#8f97ff]" />
            )}
          </m.div>
        </div>

        <div className="relative grid grid-cols-4" onKeyDown={handleKeyDown}>
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            const isCurrent = phase.status === 'In Progress';
            const isCompleted = phase.status === 'Completed';

            return (
              <div key={phase.key} className="flex min-w-0 flex-col items-center px-1">
                <button
                  type="button"
                  ref={(node) => {
                    nodeRefs.current[index] = node;
                  }}
                  onClick={() => onSelect(index)}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-pressed={selectedIndex === index}
                  aria-label={`Open stage ${index + 1}: ${phase.shortName}. ${phase.status}.`}
                  className="group relative z-10 flex h-8 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131315]"
                >
                  <span
                    className={cn(
                      'relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200 group-hover:scale-110',
                      isCurrent
                        ? 'border-[#5a63df] bg-white text-[#5a63df] dark:bg-[#131315] dark:text-[#afb5ff]'
                        : isCompleted
                          ? 'border-[rgb(var(--signal-ok)/0.45)] bg-[rgb(var(--signal-ok)/0.10)] text-[rgb(var(--signal-ok))]'
                          : 'border-[#e4e2f0] bg-white text-slate-400 dark:border-white/[0.14] dark:bg-[#131315] dark:text-slate-500',
                      selectedIndex === index && 'ring-2 ring-[#5a63df]/30 ring-offset-1'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  tabIndex={-1}
                  className={cn(
                    'mt-2 line-clamp-2 text-center text-[11px] font-bold leading-snug tracking-tight transition-colors focus-visible:outline-none sm:text-xs',
                    selectedIndex === index
                      ? 'text-[#5a63df] dark:text-[#afb5ff]'
                      : 'text-slate-600 hover:text-[#5a63df] dark:text-slate-400'
                  )}
                >
                  {phase.shortName}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function HowItWorksModal({ open, onOpenChange, phases }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl border-[#e4e2f0] bg-white dark:border-white/10 dark:bg-[#131315]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[#5a63df]">
            <Compass className="h-5 w-5" />
            <span className={cn(MICRO)}>Your study stages</span>
          </div>
          <DialogTitle className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
            How your path moves forward
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Each stage has a clear goal. Checklist items update from scored practice and verified
            tasks. Dates guide your pacing, but every stage stays open to explore.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {phases.map((phase, index) => (
            <div key={phase.key} className={cn(TILE, 'p-3')}>
              <div className="flex items-center justify-between gap-3">
                <strong className="font-bold text-slate-900 dark:text-white">
                  {index + 1}. {phase.shortName}
                </strong>
                <span className={cn(MICRO, MUTED)}>{getFriendlyPlanText(phase.progressLabel)}</span>
              </div>
              <p className="mt-1.5">Target: {getFriendlyPlanText(phase.checkpoint)}</p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#5a63df] px-4 text-sm font-bold text-white transition-colors hover:bg-[#4a52c9]"
          >
            Got it
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Position of the rail head, 0–100, in *segment* space rather than raw average:
 * with four nodes there are three gaps, so one finished stage puts the head
 * exactly on node two and a half-finished current stage lands mid-gap.
 */
function getRailFill(phases) {
  const segments = phases.length - 1;
  if (segments < 1) return 0;
  const completed = phases.filter((phase) => Number(phase.progressPercent || 0) >= 100).length;
  const currentIndex = phases.findIndex((phase) => Number(phase.progressPercent || 0) < 100);
  const currentFraction =
    currentIndex >= 0 ? Number(phases[currentIndex].progressPercent || 0) / 100 : 0;
  return Math.max(0, Math.min(100, ((completed + currentFraction) / segments) * 100));
}

export default function RoadmapSection({
  roadmap,
  isLegacyPlan,
  readiness,
  evidence,
  days,
  targetBand,
  examDatePassed = false,
  onStart,
}) {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const phases = useMemo(
    () =>
      buildRoadmapViewModel({
        roadmap,
        isLegacyPlan,
        readiness,
        evidence,
        days,
        targetBand,
      }),
    [roadmap, isLegacyPlan, readiness, evidence, days, targetBand]
  );
  const currentPhaseIndex = phases.findIndex((p) => p.status === 'In Progress');
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, currentPhaseIndex));
  const cardRefs = useRef([]);

  const { railFill, overallPercent, stagesDone } = useMemo(
    () => ({
      railFill: getRailFill(phases),
      overallPercent: phases.length
        ? Math.round(
            phases.reduce((total, phase) => total + Number(phase.progressPercent || 0), 0) /
              phases.length
          )
        : 0,
      stagesDone: phases.filter((phase) => phase.status === 'Completed').length,
    }),
    [phases]
  );

  useEffect(() => {
    if (currentPhaseIndex >= 0) setSelectedIndex(currentPhaseIndex);
  }, [currentPhaseIndex]);

  const selectStage = (index) => {
    setSelectedIndex(index);
    cardRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  };

  return (
    <section className={cn(PANEL, 'p-4 sm:p-5')} aria-labelledby="roadmap-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <PanelTitle
            label="Your progress"
            accent
            className="mb-1"
            action={
              currentPhaseIndex >= 0 && (
                <span className={cn(MICRO, MUTED)}>Stage {currentPhaseIndex + 1} of 4</span>
              )
            }
          />
          <h2
            id="roadmap-title"
            className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg"
          >
            Your path to exam day
          </h2>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            {examDatePassed
              ? 'Your saved exam date has passed. Choose a new date to place these stages on a new timeline.'
              : 'Four stages. The line fills from verified practice — not from ticking boxes.'}
            <span className="ml-1 font-bold text-[#5a63df] sm:hidden">Tap a stage to open it.</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className={cn(TILE, 'flex items-center gap-2.5 px-3 py-2')}>
            <div className="text-right">
              <p className={cn(MICRO, MUTED)}>Path progress</p>
              <p
                className={cn(
                  NUM,
                  'mt-0.5 text-base font-extrabold leading-none text-slate-900 dark:text-white'
                )}
              >
                {overallPercent}%
              </p>
            </div>
            <span className="h-8 w-px bg-[#eceafa] dark:bg-white/10" aria-hidden="true" />
            <div>
              <p className={cn(MICRO, MUTED)}>Stages done</p>
              <p
                className={cn(
                  NUM,
                  'mt-0.5 text-base font-extrabold leading-none text-slate-900 dark:text-white'
                )}
              >
                {stagesDone}/4
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setHowItWorksOpen(true)}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-[#5a63df]/10 px-3 text-xs font-bold text-[#5a63df] transition-colors hover:bg-[#5a63df]/20 dark:bg-[#5a63df]/20 dark:text-[#a9afff]"
          >
            <Play className="h-3 w-3 fill-current" />
            <span className="hidden sm:inline">How stages work</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="relative mt-5 min-w-0">
        <InteractiveStageRail
          phases={phases}
          selectedIndex={selectedIndex}
          onSelect={selectStage}
          railFill={railFill}
        />
      </div>

      <div className="relative mt-4">
        <div className="grid snap-x snap-mandatory grid-flow-col auto-cols-[88%] items-stretch gap-x-3 gap-y-3 overflow-x-auto pb-3 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4">
          {phases.map((phase, index) => (
            <PhaseCard
              key={phase.key}
              phase={phase}
              index={index}
              onStart={onStart}
              selected={selectedIndex === index}
              onSelect={() => setSelectedIndex(index)}
              cardRef={(node) => {
                cardRefs.current[index] = node;
              }}
            />
          ))}
        </div>
      </div>

      <HowItWorksModal open={howItWorksOpen} onOpenChange={setHowItWorksOpen} phases={phases} />
    </section>
  );
}

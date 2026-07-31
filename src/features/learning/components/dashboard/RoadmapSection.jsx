import React, { useEffect, useRef, useState } from 'react';
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
  Bar,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  Pill,
  TILE,
  TITLE,
} from '@/features/dashboard/components/primitives';
import { buildRoadmapViewModel, getFriendlyPlanText, getFriendlyTaskTitle } from './dashboardUtils';

const STATUS_TONE = { Completed: 'neutral', 'In Progress': 'accent', Upcoming: 'accent' };
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
      {status === 'In Progress' && <span className="h-1.5 w-1.5 rounded-full bg-[#5a63df]" />}
      {status === 'Completed' && <CheckCircle2 className="h-3 w-3" />}
      {STATUS_LABEL[status] || status}
    </Pill>
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
          'flex h-full min-w-0 flex-1 cursor-pointer flex-col p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
          selected && 'border-[#5a63df]/40 bg-white dark:bg-white/[0.06]'
        )}
        aria-current={inProgress ? 'step' : undefined}
        aria-label={`Stage ${index + 1}, ${phase.shortName}, ${phase.status}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={cn(MICRO, MUTED)}>Stage {index + 1}</span>
          <PhaseStatusBadge status={phase.status} />
        </div>

        {phase.dateRange && (
          <p
            className={cn(
              MICRO,
              'mt-2.5 flex items-center gap-1.5 text-slate-500 dark:text-slate-400'
            )}
          >
            <CalendarRange className="h-3 w-3" aria-hidden="true" /> {phase.dateRange}
          </p>
        )}

        <h3 className={cn(TITLE, 'mt-2 text-sm')}>{phase.shortName}</h3>
        <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
          {getFriendlyPlanText(phase.objective)}
        </p>

        <PhaseChecklist checklist={phase.checklist} />

        <div className="mt-auto space-y-2.5 pt-4">
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

          <div className="flex min-h-7 items-center">
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
            {!inProgress && !completed && (
              <Pill tone="accent">Open anytime · verified progress</Pill>
            )}
          </div>

          <p className="text-xs font-bold leading-snug text-slate-700 dark:text-slate-300">
            {completed ? 'Stage complete' : getFriendlyPlanText(phase.progressLabel)}
          </p>
          <div className="flex items-center gap-3">
            <Bar value={progressPercent} className="flex-1" />
            <span className={cn(NUM, 'text-xs font-bold text-slate-700 dark:text-slate-300')}>
              {progressPercent}%
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}

function InteractiveStageRail({ phases, selectedIndex, onSelect }) {
  return (
    <nav aria-label="Learning path stages" className="mb-4 w-full">
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {phases.map((phase, index) => {
          const Icon = phase.icon;
          const isCurrent = phase.status === 'In Progress';
          const isCompleted = phase.status === 'Completed';
          const leadsFromCurrent = isCurrent;

          return (
            <div key={phase.key} className="relative flex min-w-0 flex-col items-center">
              <div className="relative flex h-10 w-full items-center justify-center">
                {index < phases.length - 1 && (
                  <div
                    className="pointer-events-none absolute left-[calc(50%+18px)] right-[calc(-50%+18px)] top-1/2 z-0 h-[3px] -translate-y-1/2 overflow-visible rounded-full"
                    aria-hidden="true"
                  >
                    <div
                      className={cn(
                        'h-full w-full rounded-full transition-all duration-500',
                        isCompleted || isCurrent
                          ? 'bg-[#5a63df]'
                          : 'border-t-2 border-dashed border-slate-200 dark:border-white/15'
                      )}
                    />

                    {/* Single arrow marker on the segment leaving the current stage — replaces the
                        old set of four overlapping text pills that duplicated each PhaseCard's own
                        status badge. */}
                    {leadsFromCurrent && (
                      <span className="absolute left-1/2 top-1/2 z-20 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#5a63df] text-white shadow-[0_0_0_3px_rgba(90,99,223,0.15)]">
                        <ArrowRight className="h-3 w-3 motion-safe:animate-pulse" />
                      </span>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-pressed={selectedIndex === index}
                  aria-label={`Open stage ${index + 1}: ${phase.shortName}. ${phase.status}.`}
                  className="group relative z-10 flex shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
                >
                  <span
                    className={cn(
                      'relative flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 group-hover:scale-110 sm:h-8 sm:w-8',
                      isCurrent
                        ? 'border-[#5a63df] bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]'
                        : isCompleted
                          ? 'border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.08)] text-[rgb(var(--signal-ok))]'
                          : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500',
                      selectedIndex === index && 'ring-2 ring-[#5a63df]/30'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onSelect(index)}
                className="mt-3 text-center text-xs font-bold leading-snug tracking-tight text-slate-700 transition-colors hover:text-[#5a63df] focus-visible:outline-none dark:text-slate-300 sm:text-sm"
              >
                {phase.shortName}
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function HowItWorksModal({ open, onOpenChange, phases }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl border-[#e4e2f0] bg-white dark:border-white/10 dark:bg-[#131218]">
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
  const phases = buildRoadmapViewModel({
    roadmap,
    isLegacyPlan,
    readiness,
    evidence,
    days,
    targetBand,
  });
  const currentPhaseIndex = phases.findIndex((p) => p.status === 'In Progress');
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, currentPhaseIndex));
  const cardRefs = useRef([]);

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
    <section className={cn(PANEL, 'p-5 sm:p-6')} aria-labelledby="roadmap-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <PanelTitle
            label="Your progress"
            accent
            className="mb-1.5"
            action={
              currentPhaseIndex >= 0 && (
                <span className={cn(MICRO, MUTED)}>Stage {currentPhaseIndex + 1} of 4</span>
              )
            }
          />
          <h2
            id="roadmap-title"
            className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            Your path to exam day
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            {examDatePassed
              ? 'Your saved exam date has passed. Choose a new date to place these stages on a new timeline.'
              : 'Four clear stages. Progress comes from verified practice; dates adjust with your exam.'}
            <span className="ml-1 font-bold text-[#5a63df] sm:hidden">
              Swipe to see every stage.
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHowItWorksOpen(true)}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-[#5a63df]/10 px-3.5 text-xs font-bold text-[#5a63df] transition-colors hover:bg-[#5a63df]/20 dark:bg-[#5a63df]/20 dark:text-[#a9afff]"
        >
          <Play className="h-3 w-3 fill-current" />
          How stages work
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="relative mt-6 min-w-0">
        <InteractiveStageRail
          phases={phases}
          selectedIndex={selectedIndex}
          onSelect={selectStage}
        />
        <p className={cn(MICRO, MUTED, 'mt-1 text-center md:hidden')}>
          Stage {selectedIndex + 1}: {phases[selectedIndex]?.shortName}
        </p>
      </div>

      <div className="relative mt-3">
        <div className="grid snap-x snap-mandatory grid-flow-col auto-cols-[88%] items-stretch gap-x-3 gap-y-4 overflow-x-auto pb-3 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4">
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

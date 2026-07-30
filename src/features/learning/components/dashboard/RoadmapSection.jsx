import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Circle,
  Compass,
  Play,
  Sparkles,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import { buildRoadmapViewModel, getFriendlyPlanText, getFriendlyTaskTitle } from './dashboardUtils';

function PhaseStatusBadge({ status }) {
  const isCompleted = status === 'Completed';
  const isInProgress = status === 'In Progress';
  const isUpcoming = status === 'Upcoming';
  const displayStatus =
    {
      Completed: 'Done',
      'In Progress': 'Current',
      Upcoming: 'Next',
      Planned: 'Planned',
      Condensed: 'Condensed',
    }[status] || status;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        isCompleted &&
          'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
        isInProgress &&
          'bg-[#eef0ff] text-[#505bdd] border border-[#cbd3f8] dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',
        isUpcoming &&
          'bg-slate-50 text-slate-600 border border-slate-200/80 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700/80',
        !isCompleted &&
          !isInProgress &&
          !isUpcoming &&
          'bg-slate-50 text-slate-500 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-400'
      )}
    >
      {isInProgress && (
        <span className="h-1.5 w-1.5 rounded-full bg-[#505bdd] dark:bg-indigo-400" />
      )}
      {isCompleted && <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />}
      {displayStatus}
    </span>
  );
}

function PhaseChecklist({ checklist }) {
  return (
    <ul className="mt-3 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
      {checklist?.map((item) => (
        <li
          key={item.label}
          className="flex items-start gap-2"
          aria-label={`${item.done ? 'Complete' : 'Not complete'}: ${getFriendlyPlanText(item.label)}`}
        >
          {item.done ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
          )}
          <span
            className={cn(
              'font-medium leading-snug',
              item.done && 'text-slate-600 dark:text-slate-300'
            )}
          >
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
          'group relative flex h-full min-w-0 flex-1 cursor-pointer flex-col rounded-3xl border p-4 backdrop-blur-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 motion-safe:hover:-translate-y-1 sm:p-5',
          phase.surface,
          selected
            ? 'border-indigo-300/80 ring-2 ring-indigo-400/15 shadow-[0_8px_24px_-10px_rgba(79,70,229,0.10)] dark:border-indigo-400/40 dark:ring-indigo-400/15'
            : 'hover:border-slate-300/60 hover:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.06)] dark:hover:border-white/20'
        )}
        aria-current={inProgress ? 'step' : undefined}
        aria-label={`Stage ${index + 1}, ${phase.shortName}, ${phase.status}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider',
              phase.phaseBadge
            )}
          >
            Stage {index + 1}
          </span>
          <PhaseStatusBadge status={phase.status} />
        </div>

        {phase.dateRange && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" /> {phase.dateRange}
          </p>
        )}

        <h3 className="mt-2.5 text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-lg">
          {phase.shortName}
        </h3>
        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
          {getFriendlyPlanText(phase.objective)}
        </p>

        <PhaseChecklist checklist={phase.checklist} />

        <div className="mt-auto space-y-3 pt-4">
          {phase.checkpoint && (
            <p
              className="flex items-start gap-1.5 border-t border-slate-200/70 pt-2.5 text-xs font-medium leading-snug text-slate-800 dark:border-white/10 dark:text-slate-200"
              title={phase.checkpoint}
            >
              <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <span>
                <strong className="font-black text-slate-950 dark:text-white">Ready when:</strong>{' '}
                {getFriendlyPlanText(phase.checkpointShort || phase.checkpoint)}
              </span>
            </p>
          )}

          <div className="flex min-h-7 items-center">
            {inProgress && phase.actionTask && (
              <button
                type="button"
                onClick={() => onStart(phase.actionTask)}
                className="inline-flex w-full items-center justify-between rounded-xl bg-slate-950 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                <span className="truncate">Start: {getFriendlyTaskTitle(phase.actionTask)}</span>
                <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0" />
              </button>
            )}

            {!inProgress && !completed && (
              <p className="inline-flex w-fit items-center rounded-full border border-indigo-200/70 bg-indigo-50/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
                Open anytime · verified progress
              </p>
            )}
          </div>

          <p className="text-xs font-extrabold leading-snug text-slate-800 dark:text-slate-200">
            {completed ? 'Stage complete' : getFriendlyPlanText(phase.progressLabel)}
          </p>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e2e5f0] border border-slate-200/80 dark:bg-white/20 dark:border-white/10">
              <div
                className={cn('h-full rounded-full transition-all duration-700', phase.bar)}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-black tabular-nums text-slate-700 dark:text-slate-300">
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
          const nextPhase = phases[index + 1];

          const leadsToCurrent = nextPhase?.status === 'In Progress';
          const leadsFromCurrent = isCurrent;
          const connectorState = leadsToCurrent
            ? 'Current stage path'
            : leadsFromCurrent
              ? 'Next stage path'
              : isCompleted
                ? 'Completed path'
                : 'Planned path';

          return (
            <div key={phase.key} className="relative flex flex-col items-center min-w-0">
              {/* Icon & Connector Line Row (Uniform Height h-10) */}
              <div className="relative flex h-10 w-full items-center justify-center">
                {/* Connector Line to Next Node */}
                {index < phases.length - 1 && (
                  <div
                    className="absolute left-[50%] right-[-50%] top-1/2 -translate-y-1/2 h-0.5 z-0 pointer-events-none flex items-center justify-center overflow-visible"
                    aria-hidden="true"
                  >
                    <div
                      className={cn(
                        'h-full w-full transition-all duration-500',
                        isCompleted && 'bg-slate-300 dark:bg-slate-600',
                        isCurrent &&
                          'learning-path-connector-signal bg-gradient-to-r from-indigo-600 via-sky-400 to-indigo-400 shadow-[0_0_8px_rgba(79,70,229,0.35)]',
                        !isCompleted &&
                          !isCurrent &&
                          'border-t-2 border-dashed border-slate-200 dark:border-slate-700'
                      )}
                    />

                    {/* Badge Positioned ON THE LINE Centered Between Nodes */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
                      {leadsToCurrent && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/50 text-emerald-700 border border-emerald-200/50 px-2.5 py-0.5 text-[8.5px] sm:text-[9.5px] font-extrabold uppercase tracking-wider shadow-2xs backdrop-blur-md dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                          </span>
                          Current
                        </span>
                      )}
                      {leadsFromCurrent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50/50 text-amber-700 border border-amber-200/50 px-2 py-0.5 text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider shadow-2xs backdrop-blur-md dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
                          <ArrowRight className="h-2.5 w-2.5 text-amber-500/80 dark:text-amber-400/80" />
                          Next
                        </span>
                      )}
                      {!leadsToCurrent && !leadsFromCurrent && isCompleted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50/50 text-slate-600 border border-slate-200/50 px-2 py-0.5 text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider shadow-2xs backdrop-blur-md dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/40">
                          <CheckCircle2 className="h-2.5 w-2.5 text-slate-400 dark:text-slate-500" />
                          Done
                        </span>
                      )}
                      {!leadsToCurrent && !leadsFromCurrent && !isCompleted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50/50 text-slate-600 border border-slate-200/50 px-2 py-0.5 text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider shadow-2xs backdrop-blur-md dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/40">
                          <Target className="h-2.5 w-2.5 text-slate-400 dark:text-slate-500" />
                          Goal
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Node Icon Button */}
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-pressed={selectedIndex === index}
                  aria-label={`Open stage ${index + 1}: ${phase.shortName}. ${phase.status}. ${connectorState}`}
                  className="group relative z-10 flex shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  {/* Active Glowing Pulse Ring */}
                  {isCurrent && (
                    <span className="absolute -inset-1 rounded-full bg-indigo-500/35 blur-sm motion-safe:animate-pulse dark:bg-indigo-400/30" />
                  )}
                  <span
                    className={cn(
                      'relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg',
                      phase.nodeStyle,
                      selectedIndex === index && 'ring-4 ring-indigo-500/25 dark:ring-indigo-400/30'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
                  </span>
                </button>
              </div>

              {/* Bottom Title Text */}
              <button
                type="button"
                onClick={() => onSelect(index)}
                className="mt-3 text-center text-xs sm:text-sm font-extrabold leading-snug tracking-tight text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus-visible:outline-none"
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
      <DialogContent className="max-w-lg rounded-3xl border-slate-200/80 bg-white shadow-2xl dark:border-white/15 dark:bg-[#111324]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Compass className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-wider">Your study stages</span>
          </div>
          <DialogTitle className="mt-1 text-xl font-black text-slate-950 dark:text-white">
            How your path moves forward
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Each stage has a clear goal. Checklist items update from scored practice and verified
            tasks. Dates guide your pacing, but every stage stays open for you to explore.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2.5 py-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {phases.map((phase, index) => (
            <div key={phase.key} className={cn('rounded-2xl border p-3', phase.surface)}>
              <div className="flex items-center justify-between gap-3">
                <strong className="font-black text-slate-900 dark:text-white">
                  {index + 1}. {phase.shortName}
                </strong>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {getFriendlyPlanText(phase.progressLabel)}
                </span>
              </div>
              <p className="mt-1.5">Target: {getFriendlyPlanText(phase.checkpoint)}</p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700"
          >
            Got it
          </Button>
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
    <section
      className="relative overflow-hidden rounded-[26px] border border-[#e0e4f1] bg-white shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] transition-all duration-300 dark:border-white/10 dark:bg-[#10131f] p-6 sm:p-8"
      aria-labelledby="roadmap-title"
    >
      {/* Background glow accent matching Grammar section glow */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#dcd8ff]/50 blur-3xl dark:bg-indigo-900/30"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe3ff] bg-[#eef0ff] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5058d9] dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
              <Sparkles className="h-3 w-3 text-[#505bdd] dark:text-indigo-300" />
              Your progress
            </span>
            {currentPhaseIndex >= 0 && (
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Stage {currentPhaseIndex + 1} of 4
              </span>
            )}
          </div>
          <h2
            id="roadmap-title"
            className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl"
          >
            Your path to exam day
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            Four clear stages. Progress comes from verified practice; dates adjust with your exam.
            <span className="ml-1 font-bold text-[#505bdd] dark:text-indigo-300 sm:hidden">
              Swipe to see every stage.
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHowItWorksOpen(true)}
          className="inline-flex h-8 items-center rounded-full border border-indigo-200/60 bg-indigo-50/60 px-3.5 text-xs font-bold text-indigo-600 shadow-2xs backdrop-blur-md transition-all hover:bg-indigo-100/70 hover:border-indigo-300/80 hover:text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25"
        >
          <Play className="mr-1.5 h-3 w-3 fill-indigo-600 text-indigo-600 dark:fill-indigo-300 dark:text-indigo-300" />
          How stages work
          <ChevronRight className="ml-1 h-3.5 w-3.5 text-indigo-500/80 dark:text-indigo-300/80" />
        </button>
      </div>

      <div className="relative mt-8 min-w-0">
        <InteractiveStageRail
          phases={phases}
          selectedIndex={selectedIndex}
          onSelect={selectStage}
        />
        <p className="mt-1 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400 md:hidden">
          Stage {selectedIndex + 1}: {phases[selectedIndex]?.shortName}
        </p>
      </div>
      <div className="relative mt-3">
        <div className="grid snap-x snap-mandatory grid-flow-col auto-cols-[88%] items-stretch gap-x-4 gap-y-5 overflow-x-auto pb-3 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4">
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

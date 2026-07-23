import React, { useState } from 'react';
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Circle,
  Compass,
  Lock,
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
      Locked: 'Locked',
      Condensed: 'Skipped',
    }[status] || status;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider',
        isCompleted &&
          'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-500/30',
        isInProgress &&
          'bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300/60 dark:border-amber-500/30 ring-2 ring-amber-400/30',
        isUpcoming &&
          'bg-slate-100 text-slate-600 border border-slate-200/80 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700/80',
        !isCompleted &&
          !isInProgress &&
          !isUpcoming &&
          'bg-slate-100 text-slate-500 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-400'
      )}
    >
      {isInProgress && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />}
      {isCompleted && <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />}
      {displayStatus}
    </span>
  );
}

function PhaseChecklist({ checklist, isLocked }) {
  return (
    <ul className="mt-3 space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
      {checklist?.map((item) => (
        <li
          key={item.label}
          className="flex items-start gap-2"
          aria-label={`${item.done ? 'Complete' : isLocked ? 'Locked' : 'Not complete'}: ${getFriendlyPlanText(item.label)}`}
        >
          {item.done ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : isLocked ? (
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
          ) : (
            <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
          )}
          <span
            className={cn(
              'font-medium leading-snug',
              isLocked && 'text-slate-500 dark:text-slate-400',
              item.done && !isLocked && 'text-slate-600 dark:text-slate-300'
            )}
          >
            {getFriendlyPlanText(item.label)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PhaseCard({ phase, index, onStart }) {
  const IconNode = phase.icon;
  const completed = phase.status === 'Completed';
  const inProgress = phase.status === 'In Progress';
  const locked = phase.status === 'Locked' || phase.status === 'Condensed';
  const progressPercent = completed ? 100 : phase.progressPercent;

  return (
    <div className="relative flex h-full flex-1 snap-center flex-col pt-9">
      {/* Node Icon centered vertically on top-0 */}
      <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {inProgress && (
            <div className="absolute -inset-1 rounded-full bg-indigo-500/30 blur-sm motion-safe:animate-pulse" />
          )}
          <div
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-transform duration-300 motion-safe:hover:scale-110',
              phase.nodeStyle,
              inProgress && 'ring-4 ring-indigo-500/20 dark:ring-indigo-400/30'
            )}
          >
            <IconNode className="h-5 w-5" />
          </div>
        </div>
      </div>

      <article
        className={cn(
          'group relative flex h-full flex-1 flex-col rounded-3xl border p-4 pt-5 backdrop-blur-xl transition-all duration-300 motion-safe:hover:-translate-y-1 hover:shadow-lg',
          phase.surface,
          inProgress
            ? 'ring-2 ring-indigo-500/80 shadow-[0_16px_36px_-12px_rgba(79,70,229,0.35)] dark:ring-indigo-400'
            : 'hover:border-indigo-300/80 dark:hover:border-indigo-500/40'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider',
              phase.phaseBadge
            )}
          >
            Stage {index + 1}
          </span>
          <PhaseStatusBadge status={phase.status} />
        </div>

        {phase.dateRange && (
          <p className="mt-3 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <CalendarRange className="h-3 w-3" aria-hidden="true" /> {phase.dateRange}
          </p>
        )}

        <h3 className="mt-2 text-sm font-black text-slate-950 dark:text-white sm:text-base">
          {phase.shortName}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {getFriendlyPlanText(phase.objective)}
        </p>

        <PhaseChecklist checklist={phase.checklist} isLocked={locked} />

        <div className="mt-auto space-y-3 pt-4">
          {phase.checkpoint && (
            <p
              className="flex items-start gap-1.5 border-t border-slate-200/70 pt-2.5 text-[9px] font-semibold leading-snug text-slate-600 dark:border-white/10 dark:text-slate-300"
              title={phase.checkpoint}
            >
              <Target className="mt-0.5 h-3 w-3 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <span>
                <strong className="font-black text-slate-800 dark:text-slate-100">
                  Ready when:
                </strong>{' '}
                {getFriendlyPlanText(phase.checkpointShort || phase.checkpoint)}
              </span>
            </p>
          )}

          <div className="min-h-[32px] flex items-center">
            {inProgress && phase.actionTask && (
              <button
                type="button"
                onClick={() => onStart(phase.actionTask)}
                className="inline-flex w-full items-center justify-between rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-black text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                <span className="truncate">Start: {getFriendlyTaskTitle(phase.actionTask)}</span>
                <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0" />
              </button>
            )}

            {locked && phase.status !== 'Condensed' && (
              <p className="w-full rounded-xl bg-slate-500/[0.07] px-3 py-2 text-[9px] font-bold leading-relaxed text-slate-500 dark:bg-white/5 dark:text-slate-400">
                Unlocks on {phase.dateRange?.split(' – ')[0] || 'its planned start date'}.
              </p>
            )}
          </div>

          <p className="text-[9px] font-bold leading-snug text-slate-500 dark:text-slate-400">
            {completed ? 'Stage complete' : getFriendlyPlanText(phase.progressLabel)}
          </p>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/60 dark:bg-white/10">
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

function TrackLinesSvg() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 hidden h-0.5 lg:block"
      aria-hidden="true"
    >
      <div className="relative h-full w-full">
        {/* Segment 1 -> 2 (Node 1 to Node 2) */}
        <div
          className="absolute top-0 flex -translate-y-1/2 items-center"
          style={{
            left: 'calc(12.5% + 24px)',
            width: 'calc(25% - 48px)',
          }}
        >
          <div className="h-[2.5px] w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
          <div className="h-0 w-0 border-y-[4px] border-l-[7px] border-y-transparent border-l-blue-500" />
        </div>

        {/* Segment 2 -> 3 (Node 2 to Node 3) */}
        <div
          className="absolute top-0 flex -translate-y-1/2 items-center"
          style={{
            left: 'calc(37.5% + 24px)',
            width: 'calc(25% - 48px)',
          }}
        >
          <div className="h-[2px] w-full border-t-2 border-dashed border-amber-400/90" />
          <div className="h-0 w-0 border-y-[4px] border-l-[7px] border-y-transparent border-l-amber-500" />
        </div>

        {/* Segment 3 -> 4 (Node 3 to Node 4) */}
        <div
          className="absolute top-0 flex -translate-y-1/2 items-center"
          style={{
            left: 'calc(62.5% + 24px)',
            width: 'calc(25% - 48px)',
          }}
        >
          <div className="h-[2px] w-full border-t-2 border-dashed border-rose-400/90" />
          <div className="h-0 w-0 border-y-[4px] border-l-[7px] border-y-transparent border-l-rose-500" />
        </div>
      </div>
    </div>
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
            Each stage has a clear goal. Checklist items update from scored practice and completed
            tasks. Future stages unlock on the dates calculated from your exam date.
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

  return (
    <section
      className="relative overflow-hidden rounded-[28px] border border-indigo-100/90 bg-gradient-to-br from-indigo-50/70 via-purple-50/30 to-white/95 p-6 shadow-lg shadow-indigo-500/10 hover:shadow-xl hover:shadow-indigo-500/15 transition-all duration-300 dark:border-indigo-500/20 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 sm:p-8"
      aria-labelledby="roadmap-title"
    >
      {/* Background glow accent */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              <Sparkles className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
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
            className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl"
          >
            Your path to exam day
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Four clear stages. The dates adjust when your exam date changes.
            <span className="ml-1 font-bold text-indigo-600 dark:text-indigo-300 sm:hidden">
              Swipe to see every stage.
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHowItWorksOpen(true)}
          className="inline-flex h-9 items-center rounded-full border border-indigo-200/80 bg-white px-4 text-xs font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-800 dark:border-white/15 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
        >
          <Play className="mr-1.5 h-3.5 w-3.5 fill-indigo-600 text-indigo-600" />
          How stages work
          <ChevronRight className="ml-1 h-3.5 w-3.5 text-indigo-400" />
        </button>
      </div>

      <div className="relative mt-12">
        <TrackLinesSvg />
        <div className="grid snap-x snap-mandatory grid-flow-col auto-cols-[88%] items-stretch gap-x-4 gap-y-10 overflow-x-auto pb-3 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
          {phases.map((phase, index) => (
            <PhaseCard key={phase.key} phase={phase} index={index} onStart={onStart} />
          ))}
        </div>
      </div>

      <HowItWorksModal open={howItWorksOpen} onOpenChange={setHowItWorksOpen} phases={phases} />
    </section>
  );
}

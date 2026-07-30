import React from 'react';
import {
  AudioWaveform,
  Check,
  Circle,
  Headphones,
  Lightbulb,
  Mic2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';

import HandsFreeAnswerControl from './HandsFreeAnswerControl';

const PART_DETAILS = {
  1: {
    title: 'Introduction',
    description: 'Getting to know you',
    activeGuide: 'Answer familiar questions naturally and add one useful detail.',
  },
  2: {
    title: 'Long Turn',
    description: 'Speak on a topic',
    activeGuide: 'Use your preparation notes as a simple beginning, middle, and end.',
  },
  3: {
    title: 'Discussion',
    description: 'Discuss ideas in depth',
    activeGuide: 'Develop each opinion with a clear reason or relevant example.',
  },
};

const PART_TIPS = {
  1: 'Speak naturally and be specific. A short example makes an answer stronger.',
  2: 'Keep talking until the examiner stops you; use the prompts to maintain structure.',
  3: 'Explain why you think something, then compare it with another perspective.',
};

// ─── xl desktop sidebar components ──────────────────────────────────────────

function TestRoadmap({ allParts, currentPartNumber }) {
  const partNumbers = Object.keys(allParts)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <section className="px-5 py-4 sm:px-6">
      <h2 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
        Test roadmap
      </h2>
      <ol className="mt-3 space-y-1">
        {partNumbers.map((partNumber, index) => {
          const detail = PART_DETAILS[partNumber] || {
            title: allParts[partNumber]?.title || 'Speaking section',
            description: 'Speaking practice',
          };
          const isComplete = partNumber < currentPartNumber;
          const isCurrent = partNumber === currentPartNumber;

          return (
            <li key={partNumber} className="relative flex gap-3.5 pb-5 last:pb-0">
              {index < partNumbers.length - 1 && (
                <span
                  className={cn(
                    'absolute left-[15px] top-8 h-[calc(100%-14px)] w-px',
                    isComplete ? 'bg-rose-500/45' : 'bg-border'
                  )}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black',
                  isComplete && 'border-rose-500 bg-rose-500 text-white',
                  isCurrent &&
                    'border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/20',
                  !isComplete && !isCurrent && 'border-border bg-background text-muted-foreground'
                )}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : isCurrent ? (
                  partNumber
                ) : (
                  <Circle className="h-2.5 w-2.5" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 pt-0.5">
                <p
                  className={cn(
                    'text-xs font-extrabold',
                    isCurrent ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                  )}
                >
                  Part {partNumber}: {detail.title}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                  {detail.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function SessionReadiness({ testStarted, isPart2Prep, currentPartNumber }) {
  if (testStarted) {
    const detail = PART_DETAILS[currentPartNumber] || PART_DETAILS[1];

    return (
      <section className="border-t border-border/65 px-5 py-4 sm:px-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
          {isPart2Prep ? 'Preparation focus' : 'Current focus'}
        </p>
        <div className="mt-3 flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/[0.09] text-rose-500">
            {isPart2Prep ? (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Mic2 className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="text-xs font-extrabold text-foreground">
              {isPart2Prep ? 'Plan from your topic card' : `Part ${currentPartNumber} guidance`}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {isPart2Prep
                ? 'Choose your main idea and note a simple order before you start speaking.'
                : detail.activeGuide}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-border/65 px-5 py-4 sm:px-6">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
        Before you begin
      </p>
      <div className="mt-3 space-y-3">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/[0.09] text-rose-500">
            <Mic2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-extrabold text-foreground">Find a quiet space</p>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
              Minimise background noise.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
            <Headphones className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-extrabold text-foreground">Check your audio</p>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
              Make sure every question is clear.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function UsefulTip({ currentPartNumber }) {
  return (
    <section className="border-t border-border/65 px-5 py-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" />
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
          One useful tip
        </p>
      </div>
      <div className="mt-2.5 flex gap-3 rounded-xl bg-rose-500/[0.055] p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
        <p className="text-[11px] leading-5 text-foreground/80">
          {PART_TIPS[currentPartNumber] || PART_TIPS[1]}
        </p>
      </div>
    </section>
  );
}

// ─── Mobile compact progress strip ──────────────────────────────────────────

function MobileProgressStrip({ allParts, currentPartNumber, handsFreeEnabled, onHandsFreeChange }) {
  const partNumbers = Object.keys(allParts)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
      {/* Part step indicators */}
      <ol className="flex flex-1 items-center gap-0" aria-label="Test progress">
        {partNumbers.map((partNumber, index) => {
          const isComplete = partNumber < currentPartNumber;
          const isCurrent = partNumber === currentPartNumber;
          const detail = PART_DETAILS[partNumber] || { title: 'Part' };

          return (
            <React.Fragment key={partNumber}>
              {/* Connector */}
              {index > 0 && (
                <span
                  className={cn(
                    'h-px flex-1 transition-colors duration-300',
                    isComplete || partNumber <= currentPartNumber
                      ? 'bg-rose-500/50'
                      : 'bg-border/60'
                  )}
                  aria-hidden="true"
                />
              )}

              <li className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-black transition-all duration-200',
                    isComplete && 'border-rose-500 bg-rose-500 text-white',
                    isCurrent &&
                      'border-rose-500 bg-rose-500 text-white shadow-sm shadow-rose-500/40',
                    !isComplete &&
                      !isCurrent &&
                      'border-border/70 bg-background text-muted-foreground'
                  )}
                >
                  {isComplete ? <Check className="h-3 w-3" aria-hidden="true" /> : partNumber}
                </span>
                <span
                  className={cn(
                    'text-[8px] font-bold leading-none',
                    isCurrent ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                  )}
                >
                  {detail.title}
                </span>
              </li>
            </React.Fragment>
          );
        })}
      </ol>

      {/* Divider */}
      <span className="mx-1.5 h-6 w-px bg-border/60" aria-hidden="true" />

      {/* Hands-free mini toggle with tooltip */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex shrink-0 items-center gap-1.5 cursor-default">
              <AudioWaveform className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
              <Switch
                checked={handsFreeEnabled}
                onCheckedChange={onHandsFreeChange}
                aria-label="Toggle hands-free answers"
                className="scale-[0.78] origin-center"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[180px] text-center">
            <p>{handsFreeEnabled ? 'Hands-free: Auto' : 'Hands-free: Manual'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function SpeakingSessionRail({
  allParts,
  currentPartNumber,
  testStarted,
  isPart2Prep,
  handsFreeEnabled,
  onHandsFreeChange,
}) {
  return (
    <>
      {/* ── Mobile / Tablet (below xl): single slim progress strip ── */}
      <aside
        className="overflow-hidden rounded-xl border border-border/60 bg-card/95 shadow-[0_6px_24px_-16px_hsl(var(--foreground)/0.22)] backdrop-blur-xl xl:hidden"
        aria-label="Speaking test progress"
      >
        <MobileProgressStrip
          allParts={allParts}
          currentPartNumber={currentPartNumber}
          handsFreeEnabled={handsFreeEnabled}
          onHandsFreeChange={onHandsFreeChange}
        />
      </aside>

      {/* ── Desktop xl+: sticky full sidebar ── */}
      <aside
        className="hidden overflow-hidden rounded-2xl border border-border/65 bg-card/95 shadow-[0_14px_50px_-36px_hsl(var(--foreground)/0.32)] backdrop-blur-xl xl:sticky xl:top-4 xl:block"
        aria-label="Speaking test guidance"
      >
        <TestRoadmap allParts={allParts} currentPartNumber={currentPartNumber} />
        <SessionReadiness
          testStarted={testStarted}
          isPart2Prep={isPart2Prep}
          currentPartNumber={currentPartNumber}
        />
        <UsefulTip currentPartNumber={currentPartNumber} />
        <HandsFreeAnswerControl enabled={handsFreeEnabled} onChange={onHandsFreeChange} />
      </aside>
    </>
  );
}

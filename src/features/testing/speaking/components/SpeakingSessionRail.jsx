import React from 'react';
import { Check, Circle, Headphones, Lightbulb, Mic2, ShieldCheck, Sparkles } from 'lucide-react';

import { cn } from '@/lib/cn';

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

function TestRoadmap({ allParts, currentPartNumber }) {
  const partNumbers = Object.keys(allParts)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <section className="px-5 py-5 sm:px-6">
      <h2 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
        Test roadmap
      </h2>
      <ol className="mt-4 space-y-1">
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

function MobileRoadmap({ allParts, currentPartNumber }) {
  const partNumbers = Object.keys(allParts)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <section className="px-3 py-2.5 sm:px-4 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
          Test roadmap
        </h2>
        <p className="hidden text-[9px] font-bold text-rose-500 sm:block">
          Part {currentPartNumber} of {partNumbers.length}
        </p>
      </div>

      <div className="relative mt-2.5 sm:mt-3">
        <span
          className="absolute left-[16.66%] right-[16.66%] top-4 h-px bg-border"
          aria-hidden="true"
        />
        <ol className="relative grid grid-cols-3 gap-1">
          {partNumbers.map((partNumber) => {
            const detail = PART_DETAILS[partNumber] || {
              title: allParts[partNumber]?.title || 'Speaking',
            };
            const isComplete = partNumber < currentPartNumber;
            const isCurrent = partNumber === currentPartNumber;

            return (
              <li key={partNumber} className="flex min-w-0 flex-col items-center text-center">
                <span
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-black',
                    (isComplete || isCurrent) && 'border-rose-500 bg-rose-500 text-white',
                    isCurrent && 'shadow-md shadow-rose-500/20',
                    !isComplete && !isCurrent && 'border-border bg-background text-muted-foreground'
                  )}
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : partNumber}
                </span>
                <p
                  className={cn(
                    'mt-1.5 text-[10px] font-extrabold leading-3 sm:text-[11px]',
                    isCurrent ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                  )}
                >
                  Part {partNumber}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[9px] text-muted-foreground sm:text-[10px]">
                  {detail.title}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function MobileSessionSupport({ testStarted, isPart2Prep, currentPartNumber }) {
  const detail = PART_DETAILS[currentPartNumber] || PART_DETAILS[1];

  return (
    <>
      {testStarted ? (
        <section className="flex gap-2.5 border-t border-border/65 px-3 py-3 sm:px-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/[0.09] text-rose-500">
            {isPart2Prep ? (
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Mic2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground">
              {isPart2Prep ? 'Preparation focus' : 'Current focus'}
            </p>
            <p className="mt-1 text-[10px] leading-4 text-foreground/80 sm:text-[11px]">
              {isPart2Prep
                ? 'Choose your main idea and a simple order before speaking.'
                : detail.activeGuide}
            </p>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-2 border-t border-border/65">
          <div className="flex items-center gap-2 px-3 py-3 sm:px-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/[0.09] text-rose-500">
              <Mic2 className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-extrabold text-foreground sm:text-[11px]">
                Quiet space
              </p>
              <p className="truncate text-[9px] text-muted-foreground">Less background noise</p>
            </div>
          </div>
          <div className="flex items-center gap-2 border-l border-border/65 px-3 py-3 sm:px-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
              <Headphones className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-extrabold text-foreground sm:text-[11px]">
                Audio ready
              </p>
              <p className="truncate text-[9px] text-muted-foreground">Hear every question</p>
            </div>
          </div>
        </section>
      )}

      <section className="flex items-start gap-2.5 border-t border-border/65 bg-rose-500/[0.035] px-3 py-2.5 sm:px-4">
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
        <p className="text-[10px] leading-4 text-foreground/75 sm:text-[11px]">
          <span className="font-extrabold text-foreground">Tip: </span>
          {PART_TIPS[currentPartNumber] || PART_TIPS[1]}
        </p>
      </section>
    </>
  );
}

function SessionReadiness({ testStarted, isPart2Prep, currentPartNumber }) {
  if (testStarted) {
    const detail = PART_DETAILS[currentPartNumber] || PART_DETAILS[1];

    return (
      <section className="border-t border-border/65 px-5 py-5 sm:px-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
          {isPart2Prep ? 'Preparation focus' : 'Current focus'}
        </p>
        <div className="mt-4 flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/[0.09] text-rose-500">
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
    <section className="border-t border-border/65 px-5 py-5 sm:px-6">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
        Before you begin
      </p>
      <div className="mt-4 space-y-4">
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
    <section className="border-t border-border/65 px-5 py-5 sm:px-6">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" />
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
          One useful tip
        </p>
      </div>
      <div className="mt-3 flex gap-3 rounded-2xl bg-rose-500/[0.055] p-3.5">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
        <p className="text-[11px] leading-5 text-foreground/80">
          {PART_TIPS[currentPartNumber] || PART_TIPS[1]}
        </p>
      </div>
    </section>
  );
}

export default function SpeakingSessionRail({
  allParts,
  currentPartNumber,
  testStarted,
  isPart2Prep,
}) {
  return (
    <>
      <aside
        className="overflow-hidden rounded-2xl border border-border/65 bg-card/95 shadow-[0_18px_50px_-40px_hsl(var(--foreground)/0.35)] backdrop-blur-xl sm:rounded-3xl xl:hidden"
        aria-label="Speaking test guidance"
      >
        <MobileRoadmap allParts={allParts} currentPartNumber={currentPartNumber} />
        <div className="hidden sm:block">
          <MobileSessionSupport
            testStarted={testStarted}
            isPart2Prep={isPart2Prep}
            currentPartNumber={currentPartNumber}
          />
        </div>
      </aside>

      <aside
        className="hidden overflow-hidden rounded-3xl border border-border/65 bg-card/95 shadow-[0_22px_65px_-42px_hsl(var(--foreground)/0.38)] backdrop-blur-xl xl:sticky xl:top-4 xl:block"
        aria-label="Speaking test guidance"
      >
        <TestRoadmap allParts={allParts} currentPartNumber={currentPartNumber} />
        <SessionReadiness
          testStarted={testStarted}
          isPart2Prep={isPart2Prep}
          currentPartNumber={currentPartNumber}
        />
        <UsefulTip currentPartNumber={currentPartNumber} />
      </aside>
    </>
  );
}

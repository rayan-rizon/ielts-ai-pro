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
import { MICRO, MUTED, PANEL } from '@/features/dashboard/components/primitives';

import HandsFreeAnswerControl from './HandsFreeAnswerControl';
import { formatSpeakingBudget } from '../utils/speakingV2';

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
    <section className="px-4 py-3.5 sm:px-5">
      <h2 className={cn(MICRO, MUTED)}>Test roadmap</h2>
      <ol className="mt-2.5 space-y-1">
        {partNumbers.map((partNumber, index) => {
          const detail = PART_DETAILS[partNumber] || {
            title: allParts[partNumber]?.title || 'Speaking section',
            description: 'Speaking practice',
          };
          const isComplete = partNumber < currentPartNumber;
          const isCurrent = partNumber === currentPartNumber;

          return (
            <li key={partNumber} className="relative flex gap-3.5 pb-4 last:pb-0">
              {index < partNumbers.length - 1 && (
                <span
                  className={cn(
                    'absolute left-[15px] top-8 h-[calc(100%-14px)] w-px',
                    isComplete ? 'bg-rose-500/45' : 'bg-[#e4e2f0] dark:bg-white/[0.07]'
                  )}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-extrabold',
                  isComplete && 'border-rose-500 bg-rose-500 text-white',
                  isCurrent &&
                    'border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/20',
                  !isComplete &&
                    !isCurrent &&
                    'border-[#e4e2f0] bg-white text-slate-500 dark:border-white/10 dark:bg-white/3 dark:text-slate-400'
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
                    isCurrent
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-800 dark:text-slate-100'
                  )}
                >
                  Part {partNumber}: {detail.title}
                </p>
                <p className={cn(MUTED, 'mt-1 text-[11px] leading-4')}>{detail.description}</p>
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
      <section className="border-t border-[#e4e2f0] px-4 py-3.5 dark:border-white/[0.07] sm:px-5">
        <p className={cn(MICRO, MUTED)}>{isPart2Prep ? 'Preparation focus' : 'Current focus'}</p>
        <div className="mt-3 flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/9 text-rose-500">
            {isPart2Prep ? (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Mic2 className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
              {isPart2Prep ? 'Plan from your topic card' : `Part ${currentPartNumber} guidance`}
            </p>
            <p className={cn(MUTED, 'mt-1 text-[11px] leading-5')}>
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
    <section className="border-t border-[#e4e2f0] px-4 py-3.5 dark:border-white/[0.07] sm:px-5">
      <p className={cn(MICRO, MUTED)}>Before you begin</p>
      <div className="mt-3 space-y-3">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/9 text-rose-500">
            <Mic2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
              Find a quiet space
            </p>
            <p className={cn(MUTED, 'mt-1 text-[11px] leading-4')}>Minimise background noise.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/9 text-rose-500">
            <Headphones className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
              Check your audio
            </p>
            <p className={cn(MUTED, 'mt-1 text-[11px] leading-4')}>
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
    <section className="border-t border-[#e4e2f0] px-4 py-3.5 dark:border-white/[0.07] sm:px-5">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" />
        <p className={cn(MICRO, MUTED)}>One useful tip</p>
      </div>
      <div className="mt-2.5 flex gap-3 rounded-xl bg-rose-500/5.5 p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
        <p className="text-[11px] leading-5 text-slate-700 dark:text-slate-300">
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
                      : 'bg-[#e4e2f0] dark:bg-white/[0.07]'
                  )}
                  aria-hidden="true"
                />
              )}

              <li className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-extrabold transition-all duration-200',
                    isComplete && 'border-rose-500 bg-rose-500 text-white',
                    isCurrent &&
                      'border-rose-500 bg-rose-500 text-white shadow-sm shadow-rose-500/40',
                    !isComplete &&
                      !isCurrent &&
                      'border-[#e4e2f0] bg-white text-slate-500 dark:border-white/10 dark:bg-white/3 dark:text-slate-400'
                  )}
                >
                  {isComplete ? <Check className="h-3 w-3" aria-hidden="true" /> : partNumber}
                </span>
                <span
                  className={cn(
                    'text-[8px] font-bold leading-none',
                    isCurrent
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-500 dark:text-slate-400'
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
      <span className="mx-1.5 h-6 w-px bg-[#e4e2f0] dark:bg-white/[0.07]" aria-hidden="true" />

      {/* Hands-free mini toggle with tooltip */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex shrink-0 items-center gap-1.5 cursor-default">
              <div className="hidden min-[360px]:flex flex-col items-end gap-0.5">
                <span className="text-[8px] font-extrabold leading-none text-slate-700 dark:text-slate-200">
                  Hands-free answers
                </span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-300">
                  {handsFreeEnabled ? 'Auto' : 'Manual'}
                </span>
              </div>
              <AudioWaveform className="h-3.5 w-3.5 text-rose-500/70" aria-hidden="true" />
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
  speakingMode,
  speakingV2State,
}) {
  const budget = formatSpeakingBudget(speakingV2State);
  return (
    <>
      {/* ── Mobile / Tablet (below xl): single slim progress strip ── */}
      <aside
        className={cn(PANEL, 'overflow-hidden rounded-xl xl:hidden')}
        aria-label="Speaking test progress"
      >
        {speakingV2State && (
          <div className="flex items-center justify-between gap-3 border-b border-[#e4e2f0] px-3 py-2 dark:border-white/[0.07]">
            <span className={cn(MICRO, 'text-[#5a63df]')}>{speakingMode} mode</span>
            <span className="font-mono text-[9px] font-bold text-slate-600 dark:text-slate-300">
              {budget}
            </span>
          </div>
        )}
        <MobileProgressStrip
          allParts={allParts}
          currentPartNumber={currentPartNumber}
          handsFreeEnabled={handsFreeEnabled}
          onHandsFreeChange={onHandsFreeChange}
        />
      </aside>

      {/* ── Desktop xl+: sticky full sidebar ── */}
      <aside
        className={cn(PANEL, 'hidden overflow-hidden rounded-xl xl:sticky xl:top-4 xl:block')}
        aria-label="Speaking test guidance"
      >
        {speakingV2State && (
          <section className="border-b border-[#e4e2f0] px-5 py-3 dark:border-white/[0.07]">
            <p className={cn(MICRO, 'text-[#5a63df]')}>{speakingMode} mode</p>
            <p className="mt-1 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
              {budget}
            </p>
            <p className={cn(MUTED, 'mt-1 text-[10px]')}>
              {speakingMode === 'exam'
                ? 'Transcript and coaching stay hidden until your report.'
                : 'Your transcript and one concise coaching note appear after each answer.'}
            </p>
          </section>
        )}
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

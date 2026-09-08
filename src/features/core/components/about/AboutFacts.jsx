import React from 'react';
import { m } from 'framer-motion';
import BookOpen from 'lucide-react/icons/book-open';
import Headphones from 'lucide-react/icons/headphones';
import PenLine from 'lucide-react/icons/pen-line';
import Mic from 'lucide-react/icons/mic';
import CheckCircle2 from 'lucide-react/icons/check-circle-2';
import Sparkles from 'lucide-react/icons/sparkles';

import {
  PANEL,
  WELL,
  MICRO,
  MUTED,
  IconChip,
  Pill,
} from '@/features/dashboard/components/primitives.jsx';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { ABOUT_VIEWPORT, INK } from './aboutTokens';

/**
 * What the platform covers, skill by skill.
 *
 * Rendered as 4 compact instrument cards adhering to the Learner Panel Design System:
 * hairline borders, tabular density, dual-theme gradients, micro uppercase labels,
 * and signal-coded pill indicators.
 */
const COVERAGE_CARDS = [
  {
    icon: BookOpen,
    skill: 'Reading',
    scoring: 'exact',
    scoringLabel: 'Exact',
    method: 'Cambridge Answer Key',
    practise: 'Full-length Cambridge passages under exam timing',
    returns: 'Your score, the correct answer, and an explanation of where it came from',
    featureHighlight: 'Instant 40/40 marking',
  },
  {
    icon: Headphones,
    skill: 'Listening',
    scoring: 'exact',
    scoringLabel: 'Exact',
    method: 'Cambridge Audio Key',
    practise: 'Full-length Cambridge audio, played once through',
    returns: 'Your score, the correct answer, and a transcript synced to the audio',
    featureHighlight: 'Instant 40/40 marking',
  },
  {
    icon: PenLine,
    skill: 'Writing',
    scoring: 'estimated',
    scoringLabel: 'Estimated',
    method: '4 Band Descriptors',
    practise: 'Task 1 and Task 2, written to the clock',
    returns: 'A band per criterion, plus sentence-level corrections on your own text',
    featureHighlight: 'Criterion-by-criterion',
  },
  {
    icon: Mic,
    skill: 'Speaking',
    scoring: 'estimated',
    scoringLabel: 'Estimated',
    method: 'Acoustic + Descriptors',
    practise: 'The full interview, Parts 1 through 3',
    returns: 'A band per criterion, including Pronunciation judged from your recording',
    featureHighlight: 'Acoustic & fluency AI',
  },
];

export default function AboutFacts() {
  return (
    <TooltipProvider delayDuration={150}>
      <section className="relative overflow-hidden bg-[#fcfdff] px-4 py-8 sm:px-6 sm:py-10 md:px-8 dark:bg-[#08080a]">
        <div className="relative z-10 mx-auto max-w-[1240px]">
          <m.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={ABOUT_VIEWPORT}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header: Headline and integrity disclosure */}
            <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-3.5 w-[3px] rounded-full bg-[#5a63df] dark:bg-[#8f97ff]"
                  aria-hidden="true"
                />
                <h2 className={cn('text-base font-extrabold tracking-tight sm:text-lg', INK)}>
                  All four skills. Two marked exactly, two estimated.
                </h2>
              </div>
              <Pill tone="neutral" className="self-start text-[10px] sm:self-auto">
                Nothing here is a moderated IELTS result
              </Pill>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
              {COVERAGE_CARDS.map(
                ({
                  icon: Icon,
                  skill,
                  scoring,
                  scoringLabel,
                  method,
                  practise,
                  returns,
                  featureHighlight,
                }) => {
                  const isExact = scoring === 'exact';
                  return (
                    <div
                      key={skill}
                      className={cn(
                        PANEL,
                        'group flex flex-col justify-between p-4.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5a63df]/35 dark:hover:border-[#8f97ff]/35'
                      )}
                    >
                      {/* Top Row: Icon, Skill Name, Method & Scoring Pill */}
                      <div>
                        <div className="flex items-start justify-between gap-2 border-b border-[#e4e2f0] pb-3 dark:border-white/[0.07]">
                          <div className="flex items-center gap-2.5">
                            <IconChip
                              icon={Icon}
                              tone={isExact ? 'emerald' : 'accent'}
                              size="sm"
                              className="h-7 w-7 rounded-lg"
                            />
                            <div>
                              <h3 className={cn('text-sm font-extrabold tracking-tight', INK)}>
                                {skill}
                              </h3>
                              <span
                                className={cn(
                                  MICRO,
                                  'text-[9px] text-slate-400 dark:text-slate-500'
                                )}
                              >
                                {method}
                              </span>
                            </div>
                          </div>
                          <Pill tone={isExact ? 'ok' : 'accent'}>{scoringLabel}</Pill>
                        </div>

                        {/* Card Body: Practice & Returns */}
                        <div className="my-3 space-y-2.5">
                          <div>
                            <span
                              className={cn(
                                MICRO,
                                'mb-1 block text-[9px] text-slate-400 dark:text-slate-500'
                              )}
                            >
                              What you practise
                            </span>
                            <p className={cn('text-xs font-medium leading-relaxed', MUTED)}>
                              {practise}
                            </p>
                          </div>

                          <div className={cn('rounded-lg p-2.5', WELL)}>
                            <span
                              className={cn(
                                MICRO,
                                'mb-1 block text-[9px] text-slate-400 dark:text-slate-500'
                              )}
                            >
                              What comes back
                            </span>
                            <p className={cn('text-xs font-semibold leading-relaxed', INK)}>
                              {returns}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Highlight Feature Tag */}
                      <div className="mt-1 flex items-center gap-1.5 border-t border-[#e4e2f0] pt-2.5 dark:border-white/[0.07]">
                        {isExact ? (
                          <>
                            <CheckCircle2
                              className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                              aria-hidden="true"
                            />
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                              {featureHighlight}
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles
                              className="h-3.5 w-3.5 text-[#5a63df] dark:text-[#afb5ff]"
                              aria-hidden="true"
                            />
                            <span className="text-[11px] font-semibold text-[#5a63df] dark:text-[#afb5ff]">
                              {featureHighlight}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Footnote Bar */}
            <div className="mt-3.5 rounded-lg border border-[#e4e2f0] bg-[#faf9ff]/70 px-4 py-2.5 text-center text-xs font-medium dark:border-white/[0.07] dark:bg-white/[0.02]">
              <p className={MUTED}>
                The free plan includes{' '}
                <strong className={cn('font-bold', INK)}>
                  unlimited Cambridge Reading and Listening practice
                </strong>{' '}
                — no card required to start.
              </p>
            </div>
          </m.div>
        </div>
      </section>
    </TooltipProvider>
  );
}

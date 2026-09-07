import React from 'react';
import { cn } from '@/lib/cn';
import { NUM } from '@/features/dashboard/components/primitives.jsx';
import { ReiconCheck } from '@/components/ui/reicon';

const STEPS = [
  { step: '01', title: 'Join lobby' },
  { step: '02', title: 'Take test' },
  { step: '03', title: 'Compare' },
];

const STEP_STATE_STYLES = {
  current: {
    container:
      'border-[#5a63df]/40 bg-white shadow-2xs ring-1 ring-[#5a63df]/20 dark:border-[#5a63df]/50 dark:bg-[#15141d]',
    badge: 'bg-[#5a63df] text-white shadow-2xs',
    text: 'text-slate-900 dark:text-white',
  },
  complete: {
    container: 'border-emerald-200/60 bg-white/90 dark:border-emerald-500/20 dark:bg-white/[0.04]',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    text: 'text-slate-700 dark:text-slate-200',
  },
  upcoming: {
    container: 'border-[#e8e6f5] bg-white/50 dark:border-white/[0.05] dark:bg-white/[0.01]',
    badge: 'bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-slate-500',
    text: 'text-slate-400 dark:text-slate-500',
  },
};

function getStepPhase(activeStep, stepNumber) {
  if (activeStep > stepNumber) return 'complete';
  if (activeStep === stepNumber) return 'current';
  return 'upcoming';
}

export default function SessionSteps({ stepNumber = 1 }) {
  return (
    <div className="rounded-xl border border-[#e8e6f5] bg-[#f8f7fd] p-1 sm:p-1.5 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <ol className="grid grid-cols-3 gap-1.5" aria-label="Session progress">
        {STEPS.map(({ step, title }, index) => {
          const phase = getStepPhase(stepNumber, index + 1);
          const style = STEP_STATE_STYLES[phase];

          return (
            <li
              key={title}
              className={cn(
                'flex items-center justify-center sm:justify-start gap-2 rounded-lg border py-1.5 px-2 sm:px-2.5 transition-all',
                style.container
              )}
            >
              <span
                className={cn(
                  NUM,
                  'grid h-4.5 w-4.5 shrink-0 place-items-center rounded text-[10px] font-bold',
                  style.badge
                )}
              >
                {phase === 'complete' ? <ReiconCheck className="h-3 w-3" /> : step}
              </span>
              <span className={cn('truncate text-xs font-bold leading-none', style.text)}>
                {title}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

import React from 'react';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, NUM } from '@/features/dashboard/components/primitives.jsx';
import { ReiconCheck } from '@/components/ui/reicon';

const STEPS = [
  { step: '01', title: 'Join lobby', shortTitle: 'Lobby' },
  { step: '02', title: 'Take test', shortTitle: 'Test' },
  { step: '03', title: 'Compare results', shortTitle: 'Results' },
];

const STEP_STATE_STYLES = {
  current: {
    badge: 'bg-[#5a63df] text-white',
    text: 'text-slate-900 dark:text-white',
  },
  complete: {
    badge: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    text: 'text-slate-700 dark:text-slate-200',
  },
  upcoming: {
    badge: 'bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-slate-500',
    text: 'text-slate-400 dark:text-slate-500',
  },
};

const STATE_STEP = {
  lobby: 1,
  running: 2,
  grading: 3,
  complete: 3,
};

function getStepPhase(activeStep, stepNumber) {
  if (activeStep > stepNumber) return 'complete';
  if (activeStep === stepNumber) return 'current';
  return 'upcoming';
}

export default function SessionSteps({ state = 'lobby', stepNumber }) {
  const activeStep = stepNumber ?? STATE_STEP[state] ?? 1;

  return (
    <div className="mt-2.5 border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className={cn(MICRO, MUTED)}>Session progress</p>
        <p className={cn(NUM, MUTED, 'text-[10px]')}>{String(activeStep).padStart(2, '0')} / 03</p>
      </div>
      <ol className="flex items-center" aria-label="Session progress">
        {STEPS.map(({ step, title, shortTitle }, index) => {
          const phase = getStepPhase(activeStep, index + 1);
          const style = STEP_STATE_STYLES[phase];

          return (
            <li
              key={title}
              className={cn('flex min-w-0 items-center', index < STEPS.length - 1 && 'flex-1')}
              aria-current={phase === 'current' ? 'step' : undefined}
              data-phase={phase}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className={cn(
                    NUM,
                    'grid h-5 w-5 shrink-0 place-items-center rounded-md text-[9px] font-bold transition-colors',
                    style.badge
                  )}
                >
                  {phase === 'complete' ? <ReiconCheck className="h-3 w-3" /> : step}
                </span>
                <span className={cn('text-[11px] font-bold leading-none', style.text)}>
                  <span className="sm:hidden">{shortTitle}</span>
                  <span className="hidden sm:inline">{title}</span>
                </span>
              </span>
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'mx-2 h-px min-w-3 flex-1 transition-colors sm:mx-3',
                    activeStep > index + 1
                      ? 'bg-emerald-400/70 dark:bg-emerald-500/40'
                      : 'bg-[#dedcea] dark:bg-white/10'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

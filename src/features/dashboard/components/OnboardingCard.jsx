import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, NUM, PANEL, PanelTitle } from './primitives';

export default function OnboardingCard({ showOnboarding, onboardingSteps, dismissOnboarding }) {
  const steps = (onboardingSteps || []).slice(0, 2);
  const done = steps.filter((step) => step.done).length;

  return (
    <AnimatePresence>
      {showOnboarding && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className={cn(PANEL, 'p-4')}>
            <PanelTitle
              label="Set-up"
              accent
              action={
                <div className="flex items-center gap-3">
                  <span className={cn(MICRO, MUTED)}>
                    <span className={cn(NUM, 'font-bold text-slate-700 dark:text-slate-200')}>
                      {done}
                    </span>
                    /{steps.length} done
                  </span>
                  <button
                    type="button"
                    onClick={dismissOnboarding}
                    className={cn(
                      MICRO,
                      'text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    )}
                  >
                    Dismiss
                  </button>
                </div>
              }
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg border p-3',
                    step.done
                      ? 'border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.06)] dark:bg-[rgb(var(--signal-ok)/0.12)]'
                      : 'border-[#e4e2f0] bg-[#f7f6fd] dark:border-white/10 dark:bg-white/5'
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        'grid h-5 w-5 shrink-0 place-items-center rounded-full',
                        step.done
                          ? 'bg-[rgb(var(--signal-ok))] text-white'
                          : cn(
                              NUM,
                              'bg-white text-[10px] font-bold text-slate-500 dark:bg-white/12 dark:text-slate-300'
                            )
                      )}
                    >
                      {step.done ? <Check className="h-3 w-3" /> : index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-extrabold leading-tight text-slate-800 dark:text-slate-100">
                        {step.title}
                      </p>
                      <p className={cn('mt-0.5 truncate text-[10px] font-medium', MUTED)}>
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {!step.done && (
                    <Link
                      to={step.href}
                      className={cn(
                        MICRO,
                        'shrink-0 rounded-md bg-[#5a63df] px-2.5 py-1.5 text-white transition-all duration-150 hover:bg-[#4a52c9] active:scale-[0.96]'
                      )}
                    >
                      Start
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

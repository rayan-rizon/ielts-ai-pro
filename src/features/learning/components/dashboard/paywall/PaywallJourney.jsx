import React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { Flag, ListChecks, Unlock } from 'lucide-react';
import { cn } from '@/lib/cn';

const EASE_OUT = [0.23, 1, 0.32, 1];
const STEP_GAP = 0.16;

function buildSteps(examDateLabel) {
  return [
    {
      id: 'today',
      icon: Unlock,
      title: 'Today · Full schedule unlocks',
      body: 'A day-by-day plan across all 4 skills.',
    },
    {
      id: 'practice',
      icon: ListChecks,
      title: 'As you practise · It keeps up',
      body: 'Finished tasks tick off your checklist.',
    },
    {
      id: 'exam',
      icon: Flag,
      title: examDateLabel ? `${examDateLabel} · Exam day` : 'Exam day · You know the way',
      body: 'Your schedule is built to finish before it.',
    },
  ];
}

function JourneyStep({ step, index, isLast, animate }) {
  const Icon = step.icon;
  const delay = 0.15 + index * STEP_GAP;

  return (
    <li className={cn('relative flex gap-3', !isLast && 'pb-4')}>
      {!isLast && (
        <m.span
          aria-hidden="true"
          initial={animate ? { scaleY: 0 } : false}
          animate={{ scaleY: 1 }}
          transition={{ duration: STEP_GAP, delay: delay + 0.08, ease: 'linear' }}
          className="absolute bottom-0.5 left-[13px] top-[30px] w-px origin-top rounded-full bg-[#5a63df]/25 dark:bg-[#8f97ff]/25"
        />
      )}
      <m.span
        aria-hidden="true"
        initial={animate ? { opacity: 0, scale: 0.8 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.45, bounce: 0.25, delay }}
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          index === 0
            ? 'paywall-now bg-[#5a63df] text-white'
            : 'border border-[#5a63df]/30 bg-white text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#141319] dark:text-[#afb5ff]'
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      </m.span>
      <m.div
        initial={animate ? { opacity: 0, transform: 'translateY(6px)' } : false}
        animate={{ opacity: 1, transform: 'translateY(0px)' }}
        transition={{ duration: 0.28, delay: delay + 0.03, ease: EASE_OUT }}
        className="min-w-0"
      >
        <p className="text-[13px] font-extrabold leading-tight text-slate-900 dark:text-white">
          {step.title}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-slate-600 dark:text-slate-300">
          {step.body}
        </p>
      </m.div>
    </li>
  );
}

/** What changes after upgrading, in order. Draws in once when the card appears. */
export default function PaywallJourney({ examDateLabel }) {
  const reduceMotion = useReducedMotion();
  const steps = buildSteps(examDateLabel);

  return (
    <ol>
      {steps.map((step, index) => (
        <JourneyStep
          key={step.id}
          step={step}
          index={index}
          isLast={index === steps.length - 1}
          animate={!reduceMotion}
        />
      ))}
    </ol>
  );
}

import React from 'react';
import { Check, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { contentTierLabel } from '@/features/subscription/config/contentAccess';
import { MICRO, MUTED, PANEL, Pill } from '@/features/dashboard/components/primitives';

const LOCKED_GUIDE_BENEFITS = [
  'Full workbook unit and worked examples',
  'Practice questions with instant scoring',
];

export function GuideLockedState({ accessTier, onBack }) {
  const tier = contentTierLabel(accessTier);

  return (
    <div className="flex min-h-[calc(100vh-220px)] items-center justify-center">
      <section className={cn(PANEL, 'mx-auto max-w-2xl border-dashed p-8 text-center sm:p-10')}>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#5a63df]/20 bg-[#5a63df]/10 text-[#5a63df] ring-4 ring-[#5a63df]/6 dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/[0.14] dark:text-[#afb5ff] dark:ring-[#8f97ff]/8">
          <LockKeyhole className="h-5 w-5" strokeWidth={2.25} />
        </span>

        <Pill tone="accent" className="mx-auto mt-4 w-fit">
          {tier}
        </Pill>

        <h1 className="mt-3 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {tier} grammar guide
        </h1>
        <p className={cn('mx-auto mt-1.5 max-w-md text-sm font-medium leading-6', MUTED)}>
          Upgrade to {tier} to continue this workbook unit and its practice.
        </p>

        <ul className="mx-auto mt-4 flex w-fit flex-col gap-1.5 text-left">
          {LOCKED_GUIDE_BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center gap-2 text-[11.5px] font-semibold text-slate-600 dark:text-slate-300"
            >
              <Check
                className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-ok))]"
                strokeWidth={2.75}
              />
              {benefit}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={onBack} variant="outline" className="rounded-lg font-bold">
            Back to Grammar Lab
          </Button>
          <Button
            asChild
            className="rounded-lg bg-[#5a63df] font-bold text-white hover:bg-[#4a52c9]"
          >
            <Link to="/pricing">View plans</Link>
          </Button>
        </div>
        <p className={cn(MICRO, MUTED, 'mt-3')}>Included in Pro and Premium</p>
      </section>
    </div>
  );
}

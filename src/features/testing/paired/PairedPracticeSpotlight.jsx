import React from 'react';
import { ArrowDown, CheckCircle2, LockKeyhole, Timer, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  IconChip,
  MICRO,
  MUTED,
  PANEL,
  Pill,
  TILE,
  TITLE,
} from '@/features/dashboard/components/primitives';

const benefits = [
  { icon: Timer, label: 'Shared start' },
  { icon: LockKeyhole, label: 'Private answers' },
  { icon: CheckCircle2, label: 'Compare scores' },
];

export default function PairedPracticeSpotlight({ type }) {
  return (
    <section
      className={cn(PANEL, 'relative overflow-hidden border-[#5a63df]/25')}
      aria-labelledby={`${type}-paired-practice-title`}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-[#5a63df]" aria-hidden="true" />
      <div className="relative flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <IconChip icon={Users} tone="accent" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill tone="accent" className="px-1.5 py-0 text-[8px]">
                New
              </Pill>
              <span className={cn(MICRO, 'text-[#5a63df] dark:text-[#adb3ff]')}>
                Practice together
              </span>
            </div>
            <h2
              id={`${type}-paired-practice-title`}
              className={cn(TITLE, 'mt-1 text-sm text-slate-900 dark:text-white')}
            >
              Take a {type} test with a friend
            </h2>
            <p className={cn(MUTED, 'mt-0.5 max-w-2xl text-xs leading-relaxed')}>
              Pick a full test below, invite one friend, and compare results after both finish.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
          {benefits.map(({ icon: Icon, label }) => (
            <div key={label} className={cn(TILE, 'flex items-center gap-1.5 px-2 py-1.5')}>
              <Icon className="h-3 w-3 shrink-0 text-[#5a63df] dark:text-[#adb3ff]" />
              <span className="whitespace-nowrap text-[10px] font-bold text-slate-700 dark:text-slate-200">
                {label}
              </span>
            </div>
          ))}
          <a
            href="#available-tests"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#5a63df] px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#4d55ce]"
          >
            Choose test <ArrowDown className="h-3 w-3" />
          </a>
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { Activity, BarChart3, Compass, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, MICRO, MUTED, TILE } from '@/features/dashboard/components/primitives';

const VALUE_PROPS = [
  {
    icon: Compass,
    title: 'A study plan built around your date',
    desc: 'Every task is sequenced against your target band and exam timeline.',
  },
  {
    icon: Activity,
    title: 'Practice that adapts as you go',
    desc: 'Weak question types resurface until they stop being weak.',
  },
  {
    icon: BarChart3,
    title: 'A band estimate from real results',
    desc: 'Not a guess — calculated from the tests you actually complete.',
  },
];

export default function WelcomeStep() {
  return (
    <div className="space-y-4 py-1 text-center">
      {/* Centered Hero Icon */}
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]">
        <Sparkles className="h-7 w-7" strokeWidth={2} />
      </div>

      <p className="mx-auto max-w-sm text-[13px] sm:text-[14px] font-medium leading-relaxed text-slate-700 dark:text-slate-200">
        Four quick questions calibrate your{' '}
        <span className="font-extrabold text-[#5a63df] dark:text-[#a9afff]">
          personalized study plan
        </span>{' '}
        around your target band and schedule.
      </p>

      <div className="grid gap-2 pt-1 text-left">
        {VALUE_PROPS.map((item) => (
          <div key={item.title} className={cn(TILE, 'flex items-start gap-3.5 p-3.5')}>
            <IconChip icon={item.icon} tone="accent" size="md" className="mt-0.5" />
            <div className="min-w-0">
              <p className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100">
                {item.title}
              </p>
              <p className={cn(MICRO, MUTED, 'mt-0.5 normal-case tracking-normal')}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

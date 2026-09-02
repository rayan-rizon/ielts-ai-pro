import React from 'react';
import { m } from 'framer-motion';
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

/**
 * First screen of the wizard.
 *
 * The previous version claimed "Joined by 15k+ serious learners" next to four
 * dicebear-generated avatars — a fabricated number attached to fabricated
 * faces. This says what the next four steps actually set up instead.
 */
export default function WelcomeStep() {
  return (
    <div className="space-y-5 py-2 text-center">
      <m.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]"
      >
        <Sparkles className="h-7 w-7" strokeWidth={2} />
      </m.div>

      <p className="mx-auto max-w-sm text-[15px] font-medium leading-relaxed text-slate-700 dark:text-slate-200">
        Four quick questions set up a{' '}
        <span className="font-extrabold text-[#5a63df] dark:text-[#a9afff]">
          personalised study plan
        </span>{' '}
        around your target band and schedule.
      </p>

      <div className="grid gap-2 pt-1 text-left">
        {VALUE_PROPS.map((item, index) => (
          <m.div
            key={item.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.06, duration: 0.25 }}
            className={cn(TILE, 'flex items-start gap-3 p-3')}
          >
            <IconChip icon={item.icon} tone="accent" size="md" className="mt-0.5" />
            <div className="min-w-0">
              <p className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100">
                {item.title}
              </p>
              <p className={cn(MICRO, MUTED, 'mt-0.5 normal-case tracking-normal')}>{item.desc}</p>
            </div>
          </m.div>
        ))}
      </div>
    </div>
  );
}

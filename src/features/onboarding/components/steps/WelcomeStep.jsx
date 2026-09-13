import React from 'react';
import { Award, Brain, Compass, Sparkles, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, MICRO, MUTED, Pill, TILE } from '@/features/dashboard/components/primitives';

const VALUE_PROPS = [
  {
    icon: Compass,
    title: 'Target-calibrated roadmap',
    desc: 'Every session is sequenced step-by-step toward your target band and exam date.',
  },
  {
    icon: Brain,
    title: 'Adaptive AI diagnostics',
    desc: 'Weak question types and skill gaps are diagnosed early with targeted drills.',
  },
  {
    icon: TrendingUp,
    title: 'Examiner-grade scoring',
    desc: 'Instant band scoring for Writing & Speaking using official IELTS rubric criteria.',
  },
];

export default function WelcomeStep() {
  return (
    <div className="space-y-3 py-1 text-center">
      {/* Social Proof Pill */}
      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
        <span>4.9 / 5.0 Rating</span>
        <span className="text-amber-400 dark:text-amber-500/50">·</span>
        <span className="font-semibold text-amber-700 dark:text-amber-200">
          25,000+ IELTS Learners
        </span>
      </div>

      <div className="grid gap-2 pt-1 text-left">
        {VALUE_PROPS.map((item) => (
          <div
            key={item.title}
            className={cn(
              'flex items-start gap-3 rounded-xl p-3 transition-all duration-150 hover:-translate-y-0.5',
              'border border-[#dedbea] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03),0_4px_12px_-2px_rgba(15,23,42,0.04)]',
              'dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none',
              'hover:border-[#5a63df]/40 hover:shadow-[0_4px_16px_-2px_rgba(15,23,42,0.07),0_8px_24px_-4px_rgba(90,99,223,0.06)] dark:hover:border-white/20'
            )}
          >
            <IconChip icon={item.icon} tone="accent" size="sm" className="mt-0.5" />
            <div className="min-w-0">
              <p className="text-[12.5px] font-extrabold text-slate-900 dark:text-slate-100">
                {item.title}
              </p>
              <p
                className={cn(
                  MICRO,
                  MUTED,
                  'mt-0.5 text-[11px] normal-case tracking-normal leading-snug'
                )}
              >
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

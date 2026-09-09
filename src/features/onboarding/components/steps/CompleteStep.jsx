import React from 'react';
import { Rocket } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, NUM, Pill, TILE } from '@/features/dashboard/components/primitives';

export default function CompleteStep({ targetBandScore }) {
  return (
    <div className="space-y-4 py-2 text-center">
      <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]">
        <Rocket className="h-8 w-8" strokeWidth={2} />
      </div>

      <p className="mx-auto max-w-sm text-[13px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
        Your study preferences have been calibrated. Your customized modules and practice sessions
        are ready.
      </p>

      <div className={cn(TILE, 'flex items-center justify-between p-4 text-left')}>
        <div>
          <p className={cn(MICRO, MUTED)}>Target Goal</p>
          <p className={cn(NUM, 'mt-0.5 text-2xl font-extrabold text-slate-900 dark:text-white')}>
            Band {targetBandScore.toFixed(1)}
          </p>
        </div>
        <div className="text-right">
          <Pill tone="ok">Study Plan Active</Pill>
          <p className={cn(MICRO, MUTED, 'mt-1 normal-case tracking-normal')}>
            Adaptive difficulty applied
          </p>
        </div>
      </div>
    </div>
  );
}

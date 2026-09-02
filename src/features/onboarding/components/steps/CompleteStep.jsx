import React from 'react';
import { m } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM } from '@/features/dashboard/components/primitives';

export default function CompleteStep({ targetBandScore }) {
  return (
    <div className="space-y-6 py-4 text-center">
      <m.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]"
      >
        <Rocket className="h-8 w-8" strokeWidth={2} />
      </m.div>

      <div className="space-y-2">
        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          You're all set
        </h3>
        <p className="mx-auto max-w-xs text-[13px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
          Your path to{' '}
          <span className={cn(NUM, 'font-extrabold text-slate-800 dark:text-slate-100')}>
            band {targetBandScore.toFixed(1)}
          </span>{' '}
          is ready on your dashboard.
        </p>
      </div>
    </div>
  );
}

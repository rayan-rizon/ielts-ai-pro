import React from 'react';
import { AudioWaveform } from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import { MUTED } from '@/features/dashboard/components/primitives';

export default function HandsFreeAnswerControl({ enabled, onChange, compact = false }) {
  return (
    <section
      className={cn(
        'border-t border-[#e4e2f0] bg-gradient-to-br from-rose-500/[0.045] via-transparent to-rose-500/[0.045] dark:border-white/[0.07]',
        compact ? 'px-3 py-3 sm:px-4' : 'px-5 py-5 sm:px-6'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/[0.09] text-rose-500">
            <AudioWaveform className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                Hands-free answers
              </p>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.13em]',
                  enabled
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-[#f4f3fb] text-slate-500 dark:bg-white/[0.04] dark:text-slate-400'
                )}
              >
                {enabled ? 'Auto' : 'Manual'}
              </span>
            </div>
            <p className={cn(MUTED, 'mt-1 text-[10px] leading-4')}>
              {enabled
                ? 'Starts after each question and sends after a natural pause.'
                : 'Use Start and Finish whenever you are ready.'}
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onChange}
          aria-label="Toggle hands-free answers"
          className="shrink-0"
        />
      </div>
    </section>
  );
}

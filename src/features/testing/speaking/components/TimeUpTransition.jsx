import { Clock3, Loader2 } from 'lucide-react';

import { MICRO, MUTED, NUM, TILE, TITLE } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';

export default function TimeUpTransition({ currentPartNumber, isFinalPart }) {
  return (
    <div
      className={cn(TILE, 'flex w-full items-center gap-3 px-3.5 py-3 sm:px-4')}
      role="status"
      aria-live="assertive"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
        <Clock3 className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn(MICRO, 'text-amber-700 dark:text-amber-300')}>Time&apos;s up</p>
        <p className={cn(TITLE, 'mt-0.5')}>Part {currentPartNumber} has finished</p>
        <p className={cn(MUTED, 'mt-0.5 text-[11px] leading-relaxed')}>
          {isFinalPart
            ? 'Your answer is saved. Preparing your speaking report now.'
            : 'Your answer is saved. Preparing the next step.'}
        </p>
      </div>
      <span className={cn(NUM, 'flex shrink-0 items-center gap-2 text-xs text-amber-700')}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        0:00
      </span>
    </div>
  );
}

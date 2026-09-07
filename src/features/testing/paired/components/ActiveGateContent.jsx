import React from 'react';
import { Button } from '@/components/ui/button';
import { MICRO, MUTED, NUM, PANEL, TITLE } from '@/features/dashboard/components/primitives.jsx';
import { cn } from '@/lib/cn';
import RoomLoading from './RoomLoading';

export default function ActiveGateContent({
  conflict,
  countdown,
  expired,
  initial,
  children,
  onCheckResults,
}) {
  if (conflict) {
    return (
      <div
        role="alert"
        className={cn(
          PANEL,
          'm-4 p-4 border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm'
        )}
      >
        <span className="text-slate-800 dark:text-slate-100">
          This attempt changed in another tab. Reload to restore its latest saved answers.
        </span>
        <Button size="sm" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    );
  }

  if (countdown > 0) {
    return (
      <div
        className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto items-center justify-center p-6 bg-[#f8f7fd] dark:bg-[#08080a]"
        role="status"
      >
        <div
          className={cn(
            PANEL,
            'p-8 text-center max-w-sm w-full flex flex-col items-center shadow-xs'
          )}
        >
          <p className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff] mb-2')}>Starting session</p>
          <p
            className={cn(
              NUM,
              'text-5xl font-black tracking-tight text-slate-900 dark:text-slate-50 mb-3'
            )}
          >
            {countdown}
          </p>
          <p className={cn(MUTED, 'text-xs')}>
            Get ready! The test will begin automatically for both partners.
          </p>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div
        className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto items-center justify-center p-6 bg-[#f8f7fd] dark:bg-[#08080a]"
        role="status"
      >
        <div
          className={cn(
            PANEL,
            'p-6 text-center max-w-sm w-full flex flex-col items-center shadow-xs'
          )}
        >
          <p className={cn(TITLE, 'text-base mb-2')}>Time is up</p>
          <p className={cn(MUTED, 'text-xs mb-4')}>
            Your last server-saved answers are being finalized.
          </p>
          <Button className="bg-[#5a63df] text-white hover:bg-[#4d55c7]" onClick={onCheckResults}>
            Check results
          </Button>
        </div>
      </div>
    );
  }

  if (initial) {
    return children;
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto">
      <RoomLoading />
    </div>
  );
}

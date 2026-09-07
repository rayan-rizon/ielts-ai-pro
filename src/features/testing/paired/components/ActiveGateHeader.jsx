import React from 'react';
import { Button } from '@/components/ui/button';
import {
  IconChip,
  MICRO,
  MUTED,
  PANEL,
  Pill,
} from '@/features/dashboard/components/primitives.jsx';
import { Headphones, LockKeyhole, Wifi } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function ActiveGateHeader({
  type,
  onlineCount,
  connected,
  partnerSubmitted,
  review,
  tick,
  onLeave,
}) {
  return (
    <div
      className={`${PANEL} shrink-0 flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 text-sm`}
      data-tick={tick % 2}
      role="status"
    >
      <div className="flex items-center gap-2">
        <IconChip icon={type === 'listening' ? Headphones : LockKeyhole} tone="accent" />
        <div>
          <p className={MICRO}>Study partners</p>
          <p className={cn(MUTED, 'text-xs')}>Shared test session</p>
        </div>
      </div>
      <span className="hidden h-7 w-px bg-slate-200 dark:bg-white/10 sm:block" />
      <span className={cn(MICRO, 'flex items-center gap-1.5')}>
        <Wifi className="h-3 w-3 text-[rgb(var(--signal-ok))]" />
        {onlineCount} connected
      </span>
      {!connected && (
        <span className={cn(MICRO, 'text-[rgb(var(--signal-warn))]')}>
          Reconnecting live updates
        </span>
      )}
      <Pill tone={partnerSubmitted ? 'ok' : 'neutral'}>
        {partnerSubmitted ? 'Partner submitted' : 'Partner is taking the test'}
      </Pill>
      {!review && (
        <Button size="sm" variant="ghost" onClick={onLeave}>
          Finish with saved answers & leave
        </Button>
      )}
    </div>
  );
}

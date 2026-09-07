import React from 'react';
import { Button } from '@/components/ui/button';
import { IconChip, MICRO, MUTED, Pill } from '@/features/dashboard/components/primitives.jsx';
import { LogOut, Users, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePairedTest } from '../PairedContext';

export default function ActiveGateHeader() {
  const paired = usePairedTest();
  const status = paired?.status;

  if (!status) return null;

  const { onlineCount, connected, partnerSubmitted, review, onLeave } = status;

  return (
    <div
      className="hidden shrink-0 items-center gap-2 border-l border-[#e4e2f0] pl-2.5 dark:border-white/10 xl:flex"
      aria-label={`Paired session, ${onlineCount} connected, ${partnerSubmitted ? 'partner submitted' : 'partner taking the test'}`}
    >
      <span className="sr-only" role="status">
        {connected ? `${onlineCount} students connected.` : 'Reconnecting live updates.'}{' '}
        {partnerSubmitted ? 'Your partner has submitted.' : 'Your partner is taking the test.'}
      </span>
      <IconChip icon={Users} tone="accent" size="sm" />
      <div className="hidden min-w-0 2xl:block">
        <p className={cn(MICRO, 'text-slate-700 dark:text-slate-200')}>Paired session</p>
        <div className={cn(MUTED, 'mt-0.5 flex items-center gap-1 text-[10px] font-semibold')}>
          {connected ? (
            <Wifi className="h-3 w-3 text-[rgb(var(--signal-ok))]" />
          ) : (
            <WifiOff className="h-3 w-3 text-[rgb(var(--signal-warn))]" />
          )}
          <span className="tabular-nums">{onlineCount}/2 online</span>
        </div>
      </div>

      <Pill tone={partnerSubmitted ? 'ok' : connected ? 'neutral' : 'warn'}>
        {partnerSubmitted ? 'Partner done' : connected ? 'Partner active' : 'Reconnecting'}
      </Pill>

      {!review && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onLeave}
          className="hidden h-7 gap-1.5 px-2 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 hover:bg-[rgb(var(--signal-warn)/0.1)] hover:text-[rgb(var(--signal-warn))] min-[1500px]:flex dark:text-slate-400"
          title="Finish with saved answers and leave the paired session"
        >
          <LogOut className="h-3.5 w-3.5" />
          Finish &amp; leave
        </Button>
      )}
    </div>
  );
}

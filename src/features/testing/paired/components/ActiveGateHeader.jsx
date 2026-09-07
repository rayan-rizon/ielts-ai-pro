import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MICRO, MUTED, NUM, Pill } from '@/features/dashboard/components/primitives.jsx';
import { CheckCircle2, LogOut, Users, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePairedTest } from '../PairedContext';
import { TEST_HEADER_TOOL } from '@/features/testing/shared/components/testHeaderStyles';

export default function ActiveGateHeader() {
  const paired = usePairedTest();
  const status = paired?.status;

  if (!status) return null;

  const { onlineCount, connected, partnerSubmitted, review, onLeave } = status;
  const statusLabel = partnerSubmitted
    ? 'Partner finished'
    : connected
      ? 'Partner is taking the test'
      : 'Reconnecting live updates';

  return (
    <div className="hidden shrink-0 border-l border-[#e4e2f0] pl-1.5 dark:border-white/10 lg:block">
      <span className="sr-only" role="status">
        {connected ? `${onlineCount} students connected.` : 'Reconnecting live updates.'}{' '}
        {partnerSubmitted ? 'Your partner has submitted.' : 'Your partner is taking the test.'}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              TEST_HEADER_TOOL,
              'relative h-7 gap-1 px-1.5 text-[#5a63df] hover:text-[#5a63df] dark:text-[#afb5ff] dark:hover:text-[#afb5ff]'
            )}
            aria-label={`Paired session: ${onlineCount} of 2 online. ${statusLabel}`}
            title={`Paired session · ${onlineCount}/2 online · ${statusLabel}`}
          >
            <Users className="h-3.5 w-3.5" />
            <span className={cn(NUM, 'text-[9px]')}>{onlineCount}/2</span>
            <span
              aria-hidden="true"
              className={cn(
                'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white dark:border-[#131315]',
                partnerSubmitted
                  ? 'bg-[rgb(var(--signal-ok))]'
                  : connected
                    ? 'bg-[#5a63df] dark:bg-[#8f97ff]'
                    : 'bg-[rgb(var(--signal-warn))]'
              )}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-60 rounded-lg border-[#e4e2f0] bg-white p-1.5 shadow-none dark:border-white/10 dark:bg-[#1a191e]"
        >
          <DropdownMenuLabel className="px-2 py-1.5">
            <span className={cn(MICRO, 'text-slate-700 dark:text-slate-200')}>Paired session</span>
            <span className={cn(MUTED, 'mt-1 flex items-center gap-1.5 text-[11px] font-medium')}>
              {connected ? (
                <Wifi className="h-3.5 w-3.5 text-[rgb(var(--signal-ok))]" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-[rgb(var(--signal-warn))]" />
              )}
              <span className={NUM}>{onlineCount}/2 online</span>
            </span>
          </DropdownMenuLabel>
          <div className="px-2 pb-1.5">
            <Pill tone={partnerSubmitted ? 'ok' : connected ? 'neutral' : 'warn'}>
              {partnerSubmitted && <CheckCircle2 className="h-3 w-3" />}
              {statusLabel}
            </Pill>
          </div>
          {!review && (
            <>
              <DropdownMenuSeparator className="bg-[#e4e2f0] dark:bg-white/10" />
              <DropdownMenuItem
                onSelect={onLeave}
                className="cursor-pointer text-[11px] font-semibold text-slate-600 focus:bg-[rgb(var(--signal-warn)/0.1)] focus:text-[rgb(var(--signal-warn))] dark:text-slate-300"
              >
                <LogOut className="h-3.5 w-3.5" />
                Finish with saved answers &amp; leave
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

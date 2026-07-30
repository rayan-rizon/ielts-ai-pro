import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM, MICRO } from '../ui/primitives';
import {
  formatNumber,
  getInitials,
  getModelForEndpoint,
  formatEndpointName,
  endpointColors,
} from './utils';

const Td = ({ children, className }) => (
  <td className={cn('py-3 px-4 align-top', className)}>{children}</td>
);

const AIUsageTableRow = ({ row, maxCalls }) => {
  const share = Math.min(100, Math.max(4, ((row.totalCalls || 0) / maxCalls) * 100));
  const cost = row.trackedProviderCost || 0;
  const costTone =
    cost >= 1
      ? 'text-[rgb(var(--signal-fault))]'
      : cost >= 0.1
        ? 'text-[rgb(var(--signal-warn))]'
        : 'text-stone-900 dark:text-stone-50';

  return (
    <tr className="border-b border-stone-100 dark:border-white/[0.05] hover:bg-stone-50/70 dark:hover:bg-white/[0.02] transition-colors last:border-0">
      <Td>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-white/[0.06] grid place-items-center text-[10px] font-black text-stone-500 dark:text-stone-300 shrink-0">
            {getInitials(row.user?.full_name)}
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-[11px] text-stone-900 dark:text-stone-50 truncate">
              {row.user?.full_name || 'Unknown user'}
            </p>
            <p className={cn(NUM, 'text-[10px] text-stone-400 truncate')}>{row.user?.email}</p>
          </div>
        </div>
      </Td>

      <Td>
        <span className={cn(NUM, 'text-xs font-bold text-stone-900 dark:text-stone-50')}>
          {(row.totalCalls || 0).toLocaleString()}
        </span>
        <div className="h-1 w-16 bg-stone-100 dark:bg-white/[0.06] rounded-full overflow-hidden mt-1.5">
          <div
            className="h-full rounded-full bg-[rgb(var(--signal-ok))]"
            style={{ width: `${share}%` }}
          />
        </div>
      </Td>

      <Td>
        {!row.hasLifecycleTelemetry ? (
          <span className={cn(MICRO, 'text-stone-400')}>—</span>
        ) : (
          <div className="space-y-1">
            <span className={cn(NUM, 'text-xs font-bold text-[rgb(var(--signal-ok))]')}>
              {(row.completedCalls || 0).toLocaleString()}
            </span>
            {(row.pendingCalls > 0 || row.failedCalls > 0) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {row.pendingCalls > 0 && (
                  <span
                    className={cn(
                      MICRO,
                      'text-[rgb(var(--signal-warn))] bg-[rgb(var(--signal-warn)/0.08)] px-1 py-0.5 rounded'
                    )}
                  >
                    {row.pendingCalls} pending
                  </span>
                )}
                {row.failedCalls > 0 && (
                  <span
                    className={cn(
                      MICRO,
                      'text-[rgb(var(--signal-fault))] bg-[rgb(var(--signal-fault)/0.08)] px-1 py-0.5 rounded'
                    )}
                  >
                    {row.failedCalls} failed
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </Td>

      <Td>
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 cursor-default',
                MICRO,
                (row.cachedCalls || 0) > 0
                  ? 'text-[rgb(var(--signal-ok))] border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.08)]'
                  : 'text-stone-400 border-stone-200 dark:border-white/10'
              )}
            >
              <Sparkles className="w-2.5 h-2.5" />
              {(row.cachedCalls || 0).toLocaleString()}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[11px]">
            {row.completedCalls > 0
              ? `${((row.cachedCalls / row.completedCalls) * 100).toFixed(1)}% cache hit rate`
              : 'No delivered calls'}
          </TooltipContent>
        </Tooltip>
      </Td>

      <Td>
        <span className={cn(NUM, 'text-[11px] font-bold text-stone-700 dark:text-stone-200')}>
          {formatNumber(row.totalTokens)}
        </span>
      </Td>

      <Td>
        {!row.hasLifecycleTelemetry ? (
          <span className={cn(MICRO, 'text-stone-400')}>—</span>
        ) : (
          <div>
            <span className={cn(NUM, 'text-xs font-bold', costTone)}>
              ${cost < 0.01 && cost > 0 ? cost.toFixed(4) : cost.toFixed(2)}
            </span>
            {row.unpricedCompletedCalls > 0 && (
              <p className={cn(MICRO, 'text-stone-400 mt-0.5')}>
                {row.unpricedCompletedCalls} unpriced
              </p>
            )}
          </div>
        )}
      </Td>

      <Td>
        <div className="flex flex-col gap-1 max-w-[200px]">
          {Object.entries(row.endpoints || {})
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2)
            .map(([endpoint, count]) => {
              const color = endpointColors[endpoint] || '#6366f1';
              return (
                <div key={endpoint} className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] font-bold text-stone-700 dark:text-stone-200 truncate">
                      {formatEndpointName(endpoint)}
                    </span>
                    <span className={cn(NUM, 'text-[10px] text-stone-400 shrink-0')}>
                      ({count})
                    </span>
                  </div>
                  <p className={cn(MICRO, 'text-stone-400 pl-3')}>
                    {getModelForEndpoint(endpoint)}
                  </p>
                </div>
              );
            })}
        </div>
      </Td>

      <Td>
        <div className={cn(NUM, 'flex items-center gap-1.5 text-[10px] text-stone-500')}>
          <Clock className="w-3 h-3 text-stone-400 shrink-0" />
          {row.lastActivity
            ? new Date(row.lastActivity).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Never'}
        </div>
      </Td>
    </tr>
  );
};

export default AIUsageTableRow;

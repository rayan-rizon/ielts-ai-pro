import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, Clock, Sparkles, TriangleAlert, XCircle } from 'lucide-react';
import {
  formatCost,
  formatNumber,
  getInitials,
  getModelForEndpoint,
  formatEndpointName,
  endpointColors,
} from './utils';

const UserCell = ({ user }) => (
  <TableCell className="py-3.5 px-4">
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9 border-2 border-slate-100 dark:border-slate-800 shadow-2xs">
        <AvatarImage src={user?.avatar_url} />
        <AvatarFallback className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 text-xs font-black">
          {getInitials(user?.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
          {user?.full_name || 'Unknown Candidate'}
        </span>
        <span className="text-[10.5px] text-slate-400 font-mono truncate">{user?.email}</span>
      </div>
    </div>
  </TableCell>
);

const CallsCell = ({ totalCalls, maxCalls }) => {
  const percentage = Math.min(100, Math.max(5, ((totalCalls || 0) / maxCalls) * 100));

  return (
    <TableCell className="py-3.5 px-4">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
          {totalCalls?.toLocaleString() || 0}
        </span>
        <div className="h-1.5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </TableCell>
  );
};

const CachedCell = ({ cachedCalls, completedCalls }) => {
  const hasHits = (cachedCalls || 0) > 0;

  return (
    <TableCell className="py-3.5 px-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono font-bold gap-1 rounded-lg px-2 py-0.5 border ${
                hasHits
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60 shadow-2xs'
                  : 'bg-slate-50 text-slate-400 border-slate-200/60 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-800'
              }`}
            >
              <Sparkles
                className={`w-3 h-3 ${hasHits ? 'text-emerald-500' : 'text-slate-400 opacity-60'}`}
              />
              {cachedCalls?.toLocaleString() || 0}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white text-xs border border-slate-700 rounded-xl p-2.5 shadow-xl">
            <p>
              {completedCalls > 0
                ? `${((cachedCalls / completedCalls) * 100).toFixed(1)}% cache hit efficiency`
                : 'No delivered calls'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  );
};

const DeliveryCell = ({ completedCalls, pendingCalls, failedCalls, hasLifecycleTelemetry }) => (
  <TableCell className="py-3.5 px-4">
    {!hasLifecycleTelemetry ? (
      <span className="text-[10px] font-semibold text-slate-400">Migration required</span>
    ) : (
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-extrabold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          {completedCalls?.toLocaleString() || 0}
        </span>
        {(pendingCalls > 0 || failedCalls > 0) && (
          <div className="flex items-center gap-2 text-[9.5px] font-bold font-mono">
            {pendingCalls > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">
                <Clock className="h-3 w-3 text-amber-500" /> {pendingCalls} pending
              </span>
            )}
            {failedCalls > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50">
                <XCircle className="h-3 w-3 text-rose-500" /> {failedCalls} failed
              </span>
            )}
          </div>
        )}
      </div>
    )}
  </TableCell>
);

const CostCell = ({ cost, unpricedCompletedCalls, hasLifecycleTelemetry }) => (
  <TableCell className="py-3.5 px-4">
    {!hasLifecycleTelemetry ? (
      <span className="text-[10px] font-semibold text-slate-400">Not tracked</span>
    ) : (
      <div className="flex flex-col gap-1">
        <span
          className={`font-mono text-xs font-black ${
            cost >= 1
              ? 'text-rose-600 dark:text-rose-400'
              : cost >= 0.1
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {formatCost(cost)}
        </span>
        {unpricedCompletedCalls > 0 && (
          <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-slate-500 dark:text-slate-400">
            <TriangleAlert className="h-3 w-3 text-amber-500 shrink-0" /> {unpricedCompletedCalls}{' '}
            unpriced
          </span>
        )}
      </div>
    )}
  </TableCell>
);

const EndpointsCell = ({ endpoints }) => (
  <TableCell className="py-3.5 px-4">
    <div className="flex flex-col gap-1.5 max-w-[220px]">
      {Object.entries(endpoints || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([endpoint, count]) => {
          const color = endpointColors[endpoint] || '#6366f1';
          const model = getModelForEndpoint(endpoint);
          const formattedName = formatEndpointName(endpoint);

          return (
            <div key={endpoint} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono border flex items-center gap-1 shadow-2xs"
                  style={{
                    backgroundColor: color + '15',
                    borderColor: color + '40',
                    color: color,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {formattedName} ({count})
                </span>
              </div>
              <span className="text-[9.5px] font-mono font-semibold text-slate-500 dark:text-slate-400 pl-0.5">
                {model}
              </span>
            </div>
          );
        })}
    </div>
  </TableCell>
);

const ActivityCell = ({ lastActivity }) => (
  <TableCell className="py-3.5 px-4">
    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">
      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      {lastActivity
        ? new Date(lastActivity).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Never'}
    </div>
  </TableCell>
);

const AIUsageTableRow = ({ row, idx, maxCalls }) => {
  return (
    <TableRow
      key={row.user?.id || idx}
      className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-all duration-150"
    >
      <UserCell user={row.user} />
      <CallsCell totalCalls={row.totalCalls} maxCalls={maxCalls} />
      <DeliveryCell
        completedCalls={row.completedCalls}
        pendingCalls={row.pendingCalls}
        failedCalls={row.failedCalls}
        hasLifecycleTelemetry={row.hasLifecycleTelemetry}
      />
      <CachedCell cachedCalls={row.cachedCalls} completedCalls={row.completedCalls} />
      <TableCell className="py-3.5 px-4">
        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100/70 dark:bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700/50 inline-block">
          {formatNumber(row.totalTokens)}
        </span>
      </TableCell>
      <CostCell
        cost={row.trackedProviderCost}
        unpricedCompletedCalls={row.unpricedCompletedCalls}
        hasLifecycleTelemetry={row.hasLifecycleTelemetry}
      />
      <EndpointsCell endpoints={row.endpoints} />
      <ActivityCell lastActivity={row.lastActivity} />
    </TableRow>
  );
};

export default AIUsageTableRow;

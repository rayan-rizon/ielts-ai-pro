import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Clock } from 'lucide-react';
import {
  formatCost,
  formatNumber,
  getInitials,
  getModelForEndpoint,
  endpointColors,
} from './utils';

const UserCell = ({ user }) => (
  <TableCell className="py-3">
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8 border border-violet-200/80 dark:border-violet-800/80">
        <AvatarImage src={user?.avatar_url} />
        <AvatarFallback className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 text-xs font-bold">
          {getInitials(user?.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-extrabold text-xs text-slate-950 dark:text-white">
          {user?.full_name || 'Unknown Candidate'}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">{user?.email}</span>
      </div>
    </div>
  </TableCell>
);

const CallsCell = ({ totalCalls, maxCalls }) => (
  <TableCell className="py-3">
    <div className="flex flex-col gap-1">
      <span className="font-extrabold text-xs text-slate-950 dark:text-white">
        {totalCalls?.toLocaleString() || 0}
      </span>
      <Progress
        value={((totalCalls || 0) / maxCalls) * 100}
        className="h-1.5 w-20 bg-slate-100 dark:bg-slate-800"
      />
    </div>
  </TableCell>
);

const CachedCell = ({ cachedCalls, totalCalls }) => (
  <TableCell className="py-3">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900 text-[10px] font-mono gap-1 rounded-lg"
          >
            <Sparkles className="w-3 h-3 text-emerald-500" />
            {cachedCalls?.toLocaleString() || 0}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-900 text-white text-xs border border-white/10 rounded-xl p-2">
          <p>
            {totalCalls > 0
              ? `${((cachedCalls / totalCalls) * 100).toFixed(1)}% cache hit efficiency`
              : 'No calls yet'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </TableCell>
);

const CostCell = ({ cost }) => (
  <TableCell className="py-3">
    <span
      className={`font-mono text-xs font-extrabold ${cost >= 1 ? 'text-rose-600 dark:text-rose-400' : cost >= 0.1 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}
    >
      {formatCost(cost)}
    </span>
  </TableCell>
);

const EndpointsCell = ({ endpoints }) => (
  <TableCell className="py-3">
    <div className="flex flex-col gap-1 max-w-[200px]">
      {Object.entries(endpoints || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([endpoint, count]) => (
          <div key={endpoint} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <Badge
                variant="outline"
                className="font-mono text-[9px] px-1.5 py-0.5 rounded-md border"
                style={{
                  borderColor: (endpointColors[endpoint] || '#6366f1') + '50',
                  color: endpointColors[endpoint] || '#6366f1',
                }}
              >
                {endpoint?.replace('generate', '').replace('process', '')} ({count})
              </Badge>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">
              {getModelForEndpoint(endpoint)}
            </span>
          </div>
        ))}
    </div>
  </TableCell>
);

const ActivityCell = ({ lastActivity }) => (
  <TableCell className="py-3">
    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
      <Clock className="w-3 h-3 text-slate-400" />
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
      className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
    >
      <UserCell user={row.user} />
      <CallsCell totalCalls={row.totalCalls} maxCalls={maxCalls} />
      <CachedCell cachedCalls={row.cachedCalls} totalCalls={row.totalCalls} />
      <TableCell className="py-3">
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
          {formatNumber(row.totalTokens)}
        </span>
      </TableCell>
      <CostCell cost={row.cost} />
      <EndpointsCell endpoints={row.endpoints} />
      <ActivityCell lastActivity={row.lastActivity} />
    </TableRow>
  );
};

export default AIUsageTableRow;

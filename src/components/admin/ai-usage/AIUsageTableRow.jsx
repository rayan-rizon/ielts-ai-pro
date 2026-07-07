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
  <TableCell>
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9 border-2 border-violet-200 dark:border-violet-800">
        <AvatarImage src={user?.avatar_url} />
        <AvatarFallback className="bg-gradient-to-br from-violet-400 to-purple-600 text-white text-xs font-bold">
          {getInitials(user?.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-medium text-sm">{user?.full_name || 'Unknown'}</span>
        <span className="text-xs text-muted-foreground">{user?.email}</span>
      </div>
    </div>
  </TableCell>
);

const CallsCell = ({ totalCalls, maxCalls }) => (
  <TableCell>
    <div className="flex flex-col gap-1">
      <span className="font-bold text-lg text-foreground">{totalCalls?.toLocaleString() || 0}</span>
      <Progress value={((totalCalls || 0) / maxCalls) * 100} className="h-1.5 w-24" />
    </div>
  </TableCell>
);

const CachedCell = ({ cachedCalls, totalCalls }) => (
  <TableCell>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge className="bg-emerald-500/10 text-emerald-600 gap-1">
            <Sparkles className="w-3 h-3" />
            {cachedCalls?.toLocaleString() || 0}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {totalCalls > 0
              ? `${((cachedCalls / totalCalls) * 100).toFixed(1)}% cache hit rate`
              : 'No calls yet'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </TableCell>
);

const CostCell = ({ cost }) => (
  <TableCell>
    <span
      className={`font-bold text-lg ${cost >= 1 ? 'text-red-500' : cost >= 0.1 ? 'text-amber-500' : 'text-emerald-500'}`}
    >
      {formatCost(cost)}
    </span>
  </TableCell>
);

const EndpointsCell = ({ endpoints }) => (
  <TableCell>
    <div className="flex flex-col gap-1.5 max-w-[200px]">
      {Object.entries(endpoints || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([endpoint, count]) => (
          <div key={endpoint} className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <Badge
                variant="outline"
                className="font-mono text-[10px] px-1.5 py-0"
                style={{
                  borderColor: (endpointColors[endpoint] || '#8b5cf6') + '40',
                  color: endpointColors[endpoint] || '#8b5cf6',
                }}
              >
                {endpoint?.replace('generate', '').replace('process', '')}
                <span className="ml-1 opacity-60">({count})</span>
              </Badge>
            </div>
            <span className="text-[9px] text-muted-foreground ml-1">
              using {getModelForEndpoint(endpoint)}
            </span>
          </div>
        ))}
    </div>
  </TableCell>
);

const ActivityCell = ({ lastActivity }) => (
  <TableCell>
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Clock className="w-3 h-3" />
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
      className="hover:bg-violet-50/40 dark:hover:bg-violet-900/20"
    >
      <UserCell user={row.user} />
      <CallsCell totalCalls={row.totalCalls} maxCalls={maxCalls} />
      <CachedCell cachedCalls={row.cachedCalls} totalCalls={row.totalCalls} />
      <TableCell>
        <span className="font-mono text-sm text-muted-foreground">
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

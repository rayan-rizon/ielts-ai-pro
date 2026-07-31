import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM, MICRO, PANEL, InfoTip } from '../ui/primitives';

const CustomDailyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const formattedDate = label
    ? new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : '';
  const total = payload.find((p) => p.dataKey === 'total')?.value || 0;
  const completed = payload.find((p) => p.dataKey === 'completed')?.value || 0;
  const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

  return (
    <div className="rounded-lg border border-stone-200 dark:border-white/10 bg-white dark:bg-[#131315] px-3 py-2 shadow-lg min-w-[170px]">
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-dashed border-stone-200 dark:border-white/10">
        <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>{formattedDate}</span>
        <span className={cn(NUM, 'text-[10px] font-bold text-[rgb(var(--signal-ok))]')}>
          {rate}%
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className="text-stone-500">Requests</span>
          <span className={cn(NUM, 'font-bold text-stone-800 dark:text-stone-100')}>
            {total.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className="text-stone-500">Delivered</span>
          <span className={cn(NUM, 'font-bold text-[rgb(var(--signal-ok))]')}>
            {completed.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

const DailyUsageChart = ({ dailyStats, dateRange }) => (
  <div className={cn(PANEL, 'p-4')}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1.5">
        <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
          Request volume · {dateRange}d
        </h3>
        <InfoTip>
          Daily AI requests. The gap between the two lines is requests that never delivered —
          failed, cached-out, or still pending.
        </InfoTip>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5')}>
          <span className="w-2 h-0.5 rounded-full bg-stone-400" />
          Requests
        </span>
        <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5')}>
          <span className="w-2 h-0.5 rounded-full bg-[rgb(var(--signal-ok))]" />
          Delivered
        </span>
      </div>
    </div>
    <div className="h-56">
      {dailyStats?.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dailyStats} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a8a29e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#a8a29e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgb(var(--signal-ok))" stopOpacity={0.28} />
                <stop offset="95%" stopColor="rgb(var(--signal-ok))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,113,108,0.18)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: '#a8a29e', fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) =>
                new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              }
              minTickGap={16}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#a8a29e', fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <RechartsTooltip content={<CustomDailyTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#a8a29e"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="url(#gradientTotal)"
              activeDot={{ r: 3.5, strokeWidth: 2, stroke: '#fff' }}
              animationDuration={900}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="rgb(var(--signal-ok))"
              strokeWidth={2}
              fill="url(#gradientCompleted)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-stone-500 dark:text-stone-400">
          <Activity className="w-6 h-6 mb-2 opacity-40" />
          <p className={cn(MICRO)}>No API usage recorded yet</p>
        </div>
      )}
    </div>
  </div>
);

export default DailyUsageChart;

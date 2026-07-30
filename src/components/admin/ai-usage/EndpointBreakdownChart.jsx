import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Cpu } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM, MICRO, PANEL, InfoTip } from '../ui/primitives';
import { endpointColors, formatEndpointName, getModelForEndpoint } from './utils';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const color = endpointColors[data.endpoint] || '#6366f1';

  return (
    <div className="rounded-lg border border-stone-200 dark:border-white/10 bg-white dark:bg-[#131315] px-3 py-2 shadow-lg min-w-[190px]">
      <div className="flex items-center gap-2 pb-1.5 mb-1.5 border-b border-dashed border-stone-200 dark:border-white/10">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[11px] font-extrabold text-stone-800 dark:text-stone-100">
          {formatEndpointName(data.endpoint)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="text-stone-500">Delivered</span>
        <span className={cn(NUM, 'font-bold text-stone-800 dark:text-stone-100')}>
          {(data.completed || 0).toLocaleString()}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px] mt-0.5">
        <span className="text-stone-500">Model</span>
        <span className={cn(NUM, 'font-bold text-stone-600 dark:text-stone-300')}>
          {getModelForEndpoint(data.endpoint)}
        </span>
      </div>
    </div>
  );
};

const EndpointBreakdownChart = ({ endpointStats, dateRange }) => {
  const chartData = [...(endpointStats || [])]
    .sort((a, b) => b.completed - a.completed || b.total - a.total)
    .slice(0, 6);
  const totalDelivered = chartData.reduce((acc, curr) => acc + (curr.completed || 0), 0);

  return (
    <div className={cn(PANEL, 'p-4')}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <h3 className={cn(MICRO, 'text-stone-400')}>Workload by endpoint</h3>
          <InfoTip>Which AI feature is generating the most delivered requests.</InfoTip>
        </div>
        {totalDelivered > 0 && (
          <span className={cn(NUM, 'text-[11px] font-bold text-stone-500')}>
            {totalDelivered.toLocaleString()} total
          </span>
        )}
      </div>
      <div className="h-56">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="rgba(120,113,108,0.18)"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 9, fill: '#a8a29e', fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="endpoint"
                tick={{ fontSize: 10, fill: '#78716c', fontWeight: 700 }}
                width={140}
                tickFormatter={formatEndpointName}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(120,113,108,0.08)' }}
              />
              <Bar dataKey="completed" radius={[0, 6, 6, 0]} barSize={16}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={endpointColors[entry.endpoint] || '#6366f1'}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-stone-400">
            <Cpu className="w-6 h-6 mb-2 opacity-40" />
            <p className={cn(MICRO)}>No endpoint activity in the last {dateRange} days</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndpointBreakdownChart;

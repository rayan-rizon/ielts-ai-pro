import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu } from 'lucide-react';
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
import { endpointColors, formatEndpointName, getModelForEndpoint } from './utils';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const endpointName = formatEndpointName(data.endpoint);
    const color = endpointColors[data.endpoint] || '#6366f1';
    const model = getModelForEndpoint(data.endpoint);

    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white border border-slate-700/60 rounded-xl p-3.5 shadow-2xl space-y-2 min-w-[200px]">
        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-800/80">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: color }}
          />
          <span className="font-extrabold text-xs tracking-tight text-slate-100">
            {endpointName}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs gap-3">
          <span className="text-slate-400 font-medium">Delivered requests</span>
          <span className="font-black text-white font-mono">
            {data.completed?.toLocaleString() || 0}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <span className="text-slate-400 font-medium">AI Model</span>
          <span className="text-violet-300 font-mono font-semibold">{model}</span>
        </div>
      </div>
    );
  }
  return null;
};

const EndpointBreakdownChart = ({ endpointStats, itemVariants, dateRange }) => {
  const chartData = [...(endpointStats || [])]
    .sort((a, b) => b.completed - a.completed || b.total - a.total)
    .slice(0, 6);

  const totalDelivered = chartData.reduce((acc, curr) => acc + (curr.completed || 0), 0);

  return (
    <motion.div variants={itemVariants}>
      <Card className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardHeader className="pb-2 pt-4 sm:pt-5 px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 space-y-0">
          <CardTitle className="text-xs sm:text-sm font-black text-slate-950 dark:text-white flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50 shadow-2xs shrink-0">
              <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-black truncate">
                Delivered Workload by Endpoint
              </span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate">
                Top active AI API endpoints
              </span>
            </div>
          </CardTitle>
          {totalDelivered > 0 && (
            <span className="text-[10px] sm:text-[11px] font-mono font-extrabold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 shrink-0">
              {totalDelivered.toLocaleString()} total
            </span>
          )}
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6 pt-2 sm:pt-3">
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
                >
                  <defs>
                    {chartData.map((entry, index) => {
                      const mainColor = endpointColors[entry.endpoint] || '#6366f1';
                      return (
                        <linearGradient
                          key={`grad-${index}`}
                          id={`endpoint-grad-${index}`}
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <stop offset="0%" stopColor={mainColor} stopOpacity={0.85} />
                          <stop offset="100%" stopColor={mainColor} stopOpacity={1} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    className="stroke-slate-200/60 dark:stroke-slate-800/60"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="endpoint"
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    width={155}
                    tickFormatter={formatEndpointName}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  />
                  <Bar
                    dataKey="completed"
                    name="Delivered requests"
                    radius={[0, 8, 8, 0]}
                    barSize={20}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#endpoint-grad-${index})`}
                        stroke={endpointColors[entry.endpoint] || '#6366f1'}
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Cpu className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-500" />
                  <p className="text-xs font-bold">
                    No endpoint activity in the last {dateRange} days
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EndpointBreakdownChart;

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Activity } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomDailyTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const formattedDate = label
      ? new Date(label).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '';
    const total = payload.find((p) => p.dataKey === 'total')?.value || 0;
    const completed = payload.find((p) => p.dataKey === 'completed')?.value || 0;
    const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white border border-slate-700/60 rounded-xl p-3.5 shadow-2xl space-y-2.5 min-w-[210px]">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
          <span className="font-extrabold text-xs text-slate-200">{formattedDate}</span>
          {total > 0 && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              {rate}% delivered
            </span>
          )}
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0 shadow-xs" />
              <span className="text-slate-400 font-medium">Total Requests</span>
            </div>
            <span className="font-black text-white font-mono">{total.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0 shadow-xs" />
              <span className="text-slate-400 font-medium">Delivered</span>
            </div>
            <span className="font-black text-teal-300 font-mono">{completed.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const DailyUsageChart = ({ dailyStats, itemVariants, dateRange }) => {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardHeader className="pb-2 pt-4 sm:pt-5 px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 space-y-0">
          <CardTitle className="text-xs sm:text-sm font-black text-slate-950 dark:text-white flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400 border border-violet-200/60 dark:border-violet-800/50 shadow-2xs shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-black truncate">
                Request Delivery Volume
              </span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate">
                Daily API throughput (Last {dateRange} Days)
              </span>
            </div>
          </CardTitle>
          <div className="flex items-center gap-3 text-xs font-bold shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">Total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">Delivered</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6 pt-2 sm:pt-3">
          <div className="h-64">
            {dailyStats && dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-slate-200/60 dark:stroke-slate-800/60"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    tickFormatter={(val) =>
                      new Date(val).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip content={<CustomDailyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradientTotal)"
                    name="Requests"
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#14b8a6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradientCompleted)"
                    name="Delivered"
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-40 text-violet-500" />
                  <p className="text-xs font-bold">No API usage recorded yet</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DailyUsageChart;

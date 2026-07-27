import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

const DailyUsageChart = ({ dailyStats, itemVariants }) => {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xs overflow-hidden">
        <CardHeader className="pb-2 pt-5 px-6">
          <CardTitle className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200/60 dark:border-violet-800/40">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span>Daily API Consumption (Last 30 Days)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2">
          <div className="h-64">
            {dailyStats && dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-slate-200/60 dark:stroke-slate-800/60"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(val) =>
                      new Date(val).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={false}
                    name="Total Calls"
                  />
                  <Line
                    type="monotone"
                    dataKey="cached"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Cached Hits"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
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

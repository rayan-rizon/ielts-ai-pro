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
import { endpointColors } from './utils';

const EndpointBreakdownChart = ({ endpointStats, itemVariants }) => {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xs overflow-hidden">
        <CardHeader className="pb-2 pt-5 px-6">
          <CardTitle className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
              <Cpu className="w-4 h-4" />
            </div>
            <span>Usage Breakdown by Endpoint</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2">
          <div className="h-64">
            {endpointStats && endpointStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={endpointStats} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-slate-200/60 dark:stroke-slate-800/60"
                  />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis
                    type="category"
                    dataKey="endpoint"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    width={110}
                    tickFormatter={(val) => val.replace('generate', '').replace('process', '')}
                  />
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
                  <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                    {endpointStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={endpointColors[entry.endpoint] || '#6366f1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Cpu className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold">No endpoint activity recorded</p>
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

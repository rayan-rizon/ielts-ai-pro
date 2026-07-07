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
      <Card className="border border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-500" />
            Daily API Usage (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64">
            {dailyStats && dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) =>
                      new Date(val).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    name="Total"
                  />
                  <Line
                    type="monotone"
                    dataKey="cached"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Cached"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No usage data available</p>
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

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
      <Card className="border border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Cpu className="w-5 h-5 text-violet-500" />
            Usage by Endpoint
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64">
            {endpointStats && endpointStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={endpointStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="endpoint"
                    tick={{ fontSize: 10 }}
                    width={120}
                    tickFormatter={(val) => val.replace('generate', '').replace('process', '')}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {endpointStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={endpointColors[entry.endpoint] || '#8b5cf6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Cpu className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No endpoint data available</p>
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

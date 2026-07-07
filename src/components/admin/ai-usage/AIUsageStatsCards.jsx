import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Zap, Sparkles, Users, DollarSign } from 'lucide-react';
import { formatCost, formatNumber } from './utils';

const AIUsageStatsCards = ({ totals, loading, itemVariants }) => {
  const cards = [
    {
      label: 'Total API Calls',
      value: totals.totalApiCalls || 0,
      icon: Activity,
      color: 'violet',
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Total Cost',
      value: formatCost(totals.totalCost),
      icon: DollarSign,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600',
      isString: true,
    },
    {
      label: 'Total Tokens',
      value: formatNumber(totals.totalTokens),
      icon: Zap,
      color: 'amber',
      gradient: 'from-amber-500 to-orange-600',
      isString: true,
    },
    {
      label: 'Cache Hits',
      value: totals.totalCachedCalls || 0,
      subValue:
        totals.totalApiCalls > 0
          ? `${((totals.totalCachedCalls / totals.totalApiCalls) * 100).toFixed(0)}% Rate`
          : '0% Rate',
      icon: Sparkles,
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'Active Users',
      value: totals.uniqueUsers || 0,
      icon: Users,
      color: 'pink',
      gradient: 'from-pink-500 to-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      {cards.map((item, idx) => (
        <motion.div key={idx} variants={itemVariants}>
          <Card className="border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden rounded-2xl group relative h-full">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
            />
            <CardContent className="p-5 flex flex-col justify-between h-full relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                  {item.label}
                </p>
                <div
                  className={`p-2 rounded-lg bg-${item.color}-500/10 text-${item.color}-500 group-hover:scale-110 transition-transform duration-500`}
                >
                  <item.icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h4 className="text-2xl font-black text-foreground leading-none">
                  {loading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : item.isString ? (
                    item.value
                  ) : (
                    item.value.toLocaleString()
                  )}
                </h4>
                {item.subValue && !loading && (
                  <p className={`text-[10px] mt-1 font-bold text-${item.color}-500/80`}>
                    {item.subValue}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default AIUsageStatsCards;

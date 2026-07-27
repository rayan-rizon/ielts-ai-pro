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
      badgeStyle:
        'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200/60 dark:border-violet-800/40',
    },
    {
      label: 'Total Cost',
      value: formatCost(totals.totalCost),
      icon: DollarSign,
      badgeStyle:
        'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40',
      isString: true,
    },
    {
      label: 'Total Tokens',
      value: formatNumber(totals.totalTokens),
      icon: Zap,
      badgeStyle:
        'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40',
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
      badgeStyle:
        'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/40',
    },
    {
      label: 'Active Users',
      value: totals.uniqueUsers || 0,
      icon: Users,
      badgeStyle:
        'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((item, idx) => (
        <motion.div key={idx} variants={itemVariants}>
          <Card className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-xl shadow-2xs overflow-hidden">
            <CardContent className="px-3.5 py-2.5 flex items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 truncate">
                  {item.label}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <h4 className="text-lg font-black text-slate-950 dark:text-white leading-none">
                    {loading ? (
                      <Skeleton className="h-5 w-12 rounded-md" />
                    ) : item.isString ? (
                      item.value
                    ) : (
                      item.value.toLocaleString()
                    )}
                  </h4>
                  {item.subValue && !loading && (
                    <span className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400">
                      {item.subValue}
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-1.5 rounded-lg border shrink-0 ${item.badgeStyle}`}>
                <item.icon className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default AIUsageStatsCards;

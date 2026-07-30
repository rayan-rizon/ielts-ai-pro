import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, BadgeCheck, Clock3, DollarSign, Sparkles, Users, Zap } from 'lucide-react';
import { formatCost, formatNumber } from './utils';

const AIUsageStatsCards = ({ totals, loading, itemVariants }) => {
  const completedCalls = totals.completedCalls || 0;
  const totalRequests = totals.totalRequests || 0;
  const cacheRate = completedCalls > 0 ? (totals.totalCachedCalls / completedCalls) * 100 : 0;
  const coverageRate =
    completedCalls > 0 ? (totals.pricedCompletedCalls / completedCalls) * 100 : 0;
  const hasCostTelemetry = totals.costTelemetryAvailable === true;

  const cards = [
    {
      label: 'AI Requests',
      value: totalRequests,
      subValue: `${completedCalls.toLocaleString()} delivered`,
      icon: Activity,
      badgeStyle:
        'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200/60 dark:border-violet-800/40',
    },
    {
      label: 'Tracked Provider Cost',
      value: hasCostTelemetry ? formatCost(totals.trackedProviderCost) : '—',
      subValue: !hasCostTelemetry
        ? 'Analytics migration required'
        : totals.unpricedCompletedCalls > 0
          ? `${totals.unpricedCompletedCalls.toLocaleString()} unpriced`
          : 'Full coverage',
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
      label: 'Cache Efficiency',
      value: totals.totalCachedCalls || 0,
      subValue: `${cacheRate.toFixed(0)}% of delivered`,
      icon: Sparkles,
      badgeStyle:
        'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/40',
    },
    {
      label: 'Active Candidates',
      value: totals.uniqueUsers || 0,
      subValue: `${totals.totalUsers || 0} registered`,
      icon: Users,
      badgeStyle:
        'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40',
    },
    {
      label: !hasCostTelemetry
        ? 'Cost Telemetry'
        : totals.pendingCalls > 0
          ? 'Awaiting Finalisation'
          : 'Request Health',
      value: !hasCostTelemetry
        ? '—'
        : totals.pendingCalls > 0
          ? totals.pendingCalls
          : completedCalls,
      subValue: !hasCostTelemetry
        ? 'Apply the analytics migration'
        : totals.pendingCalls > 0
          ? `${totals.failedCalls || 0} failed`
          : `${coverageRate.toFixed(0)}% cost coverage`,
      icon: !hasCostTelemetry || totals.pendingCalls > 0 ? Clock3 : BadgeCheck,
      badgeStyle:
        !hasCostTelemetry || totals.pendingCalls > 0
          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40'
          : 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((item, idx) => (
        <motion.div
          key={idx}
          variants={itemVariants}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group">
            <CardContent className="px-4 py-3.5 flex items-center justify-between gap-2.5">
              <div className="space-y-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                  {item.label}
                </p>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <h4 className="text-xl font-black text-slate-950 dark:text-white leading-none">
                    {loading ? (
                      <Skeleton className="h-5 w-14 rounded-md" />
                    ) : item.isString ? (
                      item.value
                    ) : (
                      item.value.toLocaleString()
                    )}
                  </h4>
                  {item.subValue && !loading && (
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 truncate">
                      {item.subValue}
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`p-2 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${item.badgeStyle}`}
              >
                <item.icon className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default AIUsageStatsCards;

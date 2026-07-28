import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { Target, ArrowRight, Activity, BookOpen, Headphones, PenTool, Mic } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';

const MODULES = [
  {
    id: 'reading',
    label: 'Reading',
    icon: BookOpen,
  },
  {
    id: 'listening',
    label: 'Listening',
    icon: Headphones,
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: PenTool,
  },
  {
    id: 'speaking',
    label: 'Speaking',
    icon: Mic,
  },
];

const getProgressDiff = (latestScore, moduleAvg) => {
  if (!latestScore || !moduleAvg) return null;
  const diff = Number(latestScore) - Number(moduleAvg);
  if (isNaN(diff) || diff === 0) return { val: '0.0', isImprovement: true, neutral: true };
  return {
    val: Math.abs(diff).toFixed(1),
    isImprovement: diff >= 0,
    neutral: false,
  };
};

const PerformanceModuleCard = React.memo(({ module, test, avgScore }) => {
  const { label, icon: Icon } = module;
  const score = test ? Number(test.score) : null;
  const diffInfo = getProgressDiff(score, avgScore);

  return (
    <m.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="rounded-xl p-3 border border-indigo-100/80 bg-[#faf9ff] dark:bg-slate-900/80 hover:bg-white hover:border-[#5661e9]/50 shadow-2xs transition-all duration-200 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300">
          <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      </div>

      <div className="space-y-1">
        {score != null ? (
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
              {score.toFixed(1)}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Band
            </span>
          </div>
        ) : (
          <div className="py-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800/90 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-white/5">
              Not taken
            </span>
          </div>
        )}

        {diffInfo && !diffInfo.neutral && (
          <div className="flex items-center gap-1 text-[9.5px] font-bold">
            <span
              className={cn(
                'rounded-full px-1.5 py-0.2',
                diffInfo.isImprovement
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300'
              )}
            >
              {diffInfo.isImprovement ? `+${diffInfo.val}` : `-${diffInfo.val}`} vs avg
            </span>
          </div>
        )}
      </div>
    </m.div>
  );
});
PerformanceModuleCard.displayName = 'PerformanceModuleCard';

const PerformanceSummaryCard = React.memo(({ recentTests, stats }) => {
  const latestByModule = useMemo(() => {
    if (!recentTests || !Array.isArray(recentTests)) return {};
    const map = {};
    recentTests.forEach((test) => {
      if (!test.module) return;
      const mod = test.module.toLowerCase();
      if (!map[mod]) {
        map[mod] = test;
      }
    });
    return map;
  }, [recentTests]);

  const avg = stats?.avgScore ? Number(stats.avgScore) : 0;

  return (
    <Card className="rounded-[22px] border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] transition-all duration-300 overflow-hidden flex flex-col h-full">
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-xs">
            <Activity className="w-4.5 h-4.5" strokeWidth={2.2} />
          </div>
          <div>
            <span className="text-base font-black text-slate-950 dark:text-white tracking-tight">
              Recent Performance
            </span>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
              Latest results by module
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-2 gap-2.5">
          {MODULES.map((module) => (
            <PerformanceModuleCard
              key={module.id}
              module={module}
              test={latestByModule[module.id]}
              avgScore={stats?.moduleAverages?.[module.id]}
            />
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-400">
            <Target className="w-3.5 h-3.5 text-[#5661e9]" />
            Overall Avg {avg > 0 ? avg.toFixed(1) : '—'}
          </div>
          <Link
            to={createPageUrl('Analytics')}
            className="text-[10.5px] font-extrabold text-[#5661e9] hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
          >
            All Analytics <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
});

PerformanceSummaryCard.displayName = 'PerformanceSummaryCard';

export default PerformanceSummaryCard;

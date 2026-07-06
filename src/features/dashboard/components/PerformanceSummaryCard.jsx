import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { Target, ArrowRight, Activity, BookOpen, Headphones, PenTool, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';

const MODULES = [
  {
    id: 'reading',
    label: 'Reading',
    icon: BookOpen,
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    id: 'listening',
    label: 'Listening',
    icon: Headphones,
    color: 'text-violet-500 dark:text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: PenTool,
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    id: 'speaking',
    label: 'Speaking',
    icon: Mic,
    color: 'text-rose-500 dark:text-rose-400',
    bg: 'bg-rose-500/10',
  },
];

// Check if we have averages to compare against
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
  const { id, label, icon: Icon, color, bg } = module;
  const score = test ? Number(test.score) : null;
  const diffInfo = getProgressDiff(score, avgScore);

  return (
    <m.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'rounded-xl p-3.5 border flex flex-col justify-between group/mod hover:shadow-md transition-all duration-300 relative overflow-hidden',
        id === 'reading' &&
          'bg-blue-50/30 border-blue-100/60 dark:bg-blue-950/10 dark:border-blue-900/20 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-800',
        id === 'listening' &&
          'bg-violet-50/30 border-violet-100/60 dark:bg-violet-950/10 dark:border-violet-900/20 hover:bg-violet-50/60 dark:hover:bg-violet-950/20 hover:border-violet-300 dark:hover:border-violet-800',
        id === 'writing' &&
          'bg-amber-50/30 border-amber-100/60 dark:bg-amber-950/10 dark:border-amber-900/20 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-800',
        id === 'speaking' &&
          'bg-rose-50/30 border-rose-100/60 dark:bg-rose-950/10 dark:border-rose-900/20 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-800'
      )}
    >
      {/* Module Highlight Gradient */}
      <div
        className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full ${bg} opacity-30 dark:opacity-20 transition-transform group-hover/mod:scale-150 -translate-y-1/2 translate-x-1/2 blur-lg pointer-events-none`}
      />

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div
          className={`p-1.5 rounded-lg ${bg} ${color} border border-slate-200/20 dark:border-white/5`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      </div>

      <div className="relative z-10">
        <div className="flex items-end gap-1.5">
          <span className="text-2xl md:text-3.5xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">
            {score ? score.toFixed(1) : '--'}
          </span>
          {score && (
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest mb-0.5">
              Band
            </span>
          )}
        </div>

        {diffInfo && score && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={cn(
                'text-[10px] font-black px-2 py-0.5 rounded-full border leading-none',
                diffInfo.neutral
                  ? 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50'
                  : diffInfo.isImprovement
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25'
                    : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25'
              )}
            >
              {diffInfo.isImprovement && !diffInfo.neutral ? '+' : diffInfo.neutral ? '' : '-'}
              {diffInfo.val}
            </span>
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              vs Avg
            </span>
          </div>
        )}
        {(!score || !diffInfo) && (
          <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-2 h-[20px] flex items-center">
            {!score ? 'No tests taken' : 'New baseline'}
          </div>
        )}
      </div>
    </m.div>
  );
});
PerformanceModuleCard.displayName = 'PerformanceModuleCard';

const PerformanceSummaryCard = React.memo(({ recentTests = [], stats }) => {
  // Find latest test for each module
  const latestByModule = useMemo(() => {
    const map = {};
    recentTests.forEach((test) => {
      const type = (test.test_type || '').toLowerCase();
      if (type && !map[type]) {
        map[type] = test;
      }
    });
    return map;
  }, [recentTests]);

  if (!recentTests.length) {
    return (
      <Card
        className={cn(
          'relative rounded-2xl transition-all duration-300 overflow-hidden group h-full flex flex-col items-center justify-center p-6 text-center',
          'bg-white dark:bg-slate-900',
          'border border-slate-200 dark:border-slate-800',
          'shadow-sm',
          'hover:shadow-md transition-shadow duration-300',
          'hover:border-indigo-500/40 dark:hover:border-indigo-500/40'
        )}
      >
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative z-10 flex flex-col items-center max-w-[260px]">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-5 transition-transform group-hover:rotate-6 group-hover:scale-110 border border-indigo-100 dark:border-indigo-500/20 shadow-lg shadow-indigo-500/10">
            <Target className="w-7 h-7 text-indigo-500" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 leading-tight">
            Unlock Your Performance Stats
          </h3>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Complete your first practice test to reveal your current band score, identify weak
            spots, and get AI-powered recommendations.
          </p>

          <Link to={createPageUrl('Reading')}>
            <Button
              size="sm"
              className="h-10 px-6 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all border-0"
            >
              Start Diagnostic Test
              <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const avg = Number(stats?.avgScore) || 0;

  return (
    <Card
      className={cn(
        'relative rounded-2xl transition-all duration-300 overflow-hidden group h-full flex flex-col',
        'bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-800',
        'shadow-sm',
        'hover:shadow-md transition-shadow duration-300',
        'hover:border-indigo-500/40 dark:hover:border-indigo-500/40'
      )}
    >
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="p-4 md:p-5 relative z-10 flex items-center justify-between border-b border-slate-200/60 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm transition-transform group-hover:rotate-12 border border-indigo-100 dark:border-indigo-500/20">
            <Activity className="w-4 h-4 transition-transform duration-500 group-hover:scale-110" />
          </div>
          <div>
            <span className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Recent Performance
            </span>
            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mt-1">
              LATEST RESULTS BY MODULE
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-4 md:p-5 flex-1 flex flex-col relative z-10">
        <div className="grid grid-cols-2 gap-3 md:gap-4 h-full">
          {MODULES.map((module) => (
            <PerformanceModuleCard
              key={module.id}
              module={module}
              test={latestByModule[module.id]}
              avgScore={stats?.moduleAverages?.[module.id]}
            />
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between font-black uppercase tracking-widest">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
            <Target className="w-3 h-3" />
            Overall Avg {avg > 0 ? avg.toFixed(1) : '--'}
          </div>
          <Link
            to={createPageUrl('Analytics')}
            className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:translate-x-1 transition-transform cursor-pointer flex items-center gap-1"
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

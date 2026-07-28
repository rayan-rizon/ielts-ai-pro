import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { Compass, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatBand } from '@/lib/format';
import { CardHeader, CardTitle } from '@/components/ui/card';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const ModuleCardItem = React.memo(({ module, stats }) => {
  const avgScore = stats?.moduleAverages?.[module.key];
  const formattedAvg = avgScore != null ? formatBand(avgScore) : '—';
  const progressPct =
    avgScore != null ? Math.min(100, Math.round((Number(avgScore) / 9) * 100)) : 0;

  return (
    <m.div
      variants={itemVariants}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group relative h-full"
    >
      <Link
        to={module.href}
        className="block h-full relative rounded-xl border border-indigo-100/80 bg-[#faf9ff] p-3 transition-all duration-200 hover:border-[#5661e9]/50 hover:bg-white hover:shadow-2xs dark:border-white/10 dark:bg-slate-900/80"
      >
        <div className="flex flex-col justify-between h-full space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-xs transition-transform duration-300 group-hover:scale-105">
              <module.icon className="w-4.5 h-4.5" strokeWidth={2.2} />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#5661e9] opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
          </div>

          <div className="space-y-0.5">
            <h3 className="text-xs sm:text-sm font-black text-slate-950 dark:text-white tracking-tight leading-tight">
              {module.title}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold leading-tight line-clamp-1">
              {module.description}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                Avg Band
              </span>
              <span className="text-xs font-black text-[#5661e9] dark:text-indigo-300">
                {formattedAvg}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5661e9] rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </Link>
    </m.div>
  );
});
ModuleCardItem.displayName = 'ModuleCardItem';

const ModuleCards = React.memo(({ moduleCards, stats, quickLaunchRef, onboardingHighlight }) => {
  return (
    <m.section
      ref={quickLaunchRef}
      className={cn(
        'relative h-full flex flex-col rounded-[22px] border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] transition-all duration-300 overflow-hidden group/section',
        onboardingHighlight === 'quick' && 'ring-2 ring-[#5661e9] ring-offset-4'
      )}
    >
      <CardHeader className="px-4 pt-4 pb-2 sm:px-5 border-b border-slate-200/80 dark:border-white/10">
        <CardTitle className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2.5">
          <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-xs">
            <Compass className="w-4.5 h-4.5" strokeWidth={2.2} />
          </div>
          <div>
            <span className="tracking-tight text-base">Practice Modules</span>
            <p className="text-[10px] font-semibold text-slate-400 leading-none mt-0.5">
              Select a skill to train
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 p-3.5 sm:p-4">
        {moduleCards.map((module) => (
          <ModuleCardItem key={module.key} module={module} stats={stats} />
        ))}
      </div>
    </m.section>
  );
});

ModuleCards.displayName = 'ModuleCards';

export default ModuleCards;

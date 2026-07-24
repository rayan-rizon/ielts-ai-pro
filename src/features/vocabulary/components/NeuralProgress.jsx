import React, { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const NeuralProgress = memo(({ stats }) => {
  if (!stats) return null;

  const retention = stats.retention || 78;

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-2xl overflow-hidden">
      <CardHeader className="p-4 pb-2 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
          <span>Retention Progress</span>
          <span className="text-[10px] text-slate-400 font-bold">ⓘ</span>
        </CardTitle>
        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg cursor-pointer">
          This week ▾
        </span>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Retention Score Ring */}
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 36 36"
              role="img"
              aria-label={`Retention rate: ${retention}%`}
            >
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.2"
                className="text-slate-100 dark:text-slate-800"
              />

              <motion.circle
                initial={{ strokeDasharray: '0, 100' }}
                animate={{ strokeDasharray: `${retention}, 100` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#635BFF"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {retention}%
              </span>
              <span className="text-[9px] font-bold text-slate-400">Well done!</span>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-black text-slate-900 dark:text-white">Well done!</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug font-medium">
              You're retaining words effectively. Keep up the consistency!
            </p>
          </div>
        </div>

        {/* Breakdown Stats Row */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#635BFF]" />
              Reviewed
            </div>
            <span className="text-sm font-black text-slate-900 dark:text-white">128</span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Retained
            </div>
            <span className="text-sm font-black text-slate-900 dark:text-white">100</span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              Forgotten
            </div>
            <span className="text-sm font-black text-slate-900 dark:text-white">28</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

NeuralProgress.displayName = 'NeuralProgress';

export default NeuralProgress;

import React, { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';

const NeuralProgress = memo(({ stats }) => {
  if (!stats) return null;

  return (
    <Card className="border-none shadow-[0_20px_50px_rgba(79,70,229,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-white/[0.12] overflow-hidden">
      <CardHeader className="p-6 pb-2">
        <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Brain className="w-5 h-5 stroke-[2.5px]" />
          </div>
          Mastery Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 flex flex-col items-center">
        <div className="relative w-40 h-40 mb-6 group cursor-default">
          {/* Outer Glow */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <svg
            className="w-full h-full transform -rotate-90 relative z-10"
            viewBox="0 0 36 36"
            role="img"
            aria-label={`Retention rate: ${stats.retention}%`}
          >
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              className="text-slate-100 dark:text-white/5"
            />

            <motion.circle
              initial={{ strokeDasharray: '0, 100' }}
              animate={{ strokeDasharray: `${stats.retention}, 100` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="text-indigo-600 dark:text-indigo-400 drop-shadow-[0_0_8px_rgba(79,70,229,0.5)]"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <span className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">
              {stats.retention}
              <span className="text-xl">%</span>
            </span>
            <span className="text-[11px] uppercase font-black text-slate-500 dark:text-slate-400 tracking-[0.2em] mt-1">
              Retention
            </span>
          </div>
        </div>

        <div className="w-full space-y-3 pt-2">
          <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <span>Memory Strength</span>
            <span className="text-indigo-600 dark:text-indigo-400">Strong</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-[85%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

NeuralProgress.displayName = 'NeuralProgress';

export default NeuralProgress;

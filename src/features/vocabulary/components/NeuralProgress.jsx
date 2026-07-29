import React, { memo, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { TrendingUp, Info } from 'lucide-react';
import {
  calculateRetentionProgress,
  fetchVocabularyReviewEvents,
  getRetentionMessage,
  RETENTION_PERIODS,
} from '@/features/vocabulary/services/vocabularyRetention';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EMPTY_PROGRESS = { reviewed: 0, retained: 0, forgotten: 0, retention: 0 };

const NeuralProgress = memo(({ user, refreshKey = 0 }) => {
  const [period, setPeriod] = useState('thisWeek');
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    const loadProgress = async () => {
      if (!user?.id) {
        if (isCurrent) {
          setProgress(EMPTY_PROGRESS);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const events = await fetchVocabularyReviewEvents(user.id, period);
        if (isCurrent) setProgress(calculateRetentionProgress(events));
      } catch (error) {
        console.warn('Failed to load vocabulary retention progress:', error);
        if (isCurrent) setProgress(EMPTY_PROGRESS);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadProgress();
    return () => {
      isCurrent = false;
    };
  }, [user?.id, period, refreshKey]);

  const { reviewed, retained, forgotten, retention } = progress;
  const message = getRetentionMessage(retention, reviewed);

  return (
    <Card className="w-full overflow-hidden border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] rounded-[22px] relative">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#505bdd]/10 blur-xl" />

      <CardHeader className="p-4 pb-3 border-b border-slate-200/80 dark:border-white/10 flex flex-row items-center justify-between relative">
        <CardTitle className="flex items-center gap-2.5 text-sm font-black text-slate-900 dark:text-white">
          <div className="w-8 h-8 rounded-xl bg-[#efedff] text-[#5862df] dark:bg-indigo-500/20 dark:text-indigo-300 flex items-center justify-center ring-1 ring-[#5862df]/15 dark:ring-indigo-500/30 shadow-xs">
            <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-1.5">
            <span>Retention Progress</span>
            <Info
              className="w-3.5 h-3.5 text-slate-400 cursor-help"
              aria-label="Retention is based on the ratings you give during vocabulary review. Ratings 3 to 5 are retained; ratings 0 to 2 are forgotten."
            />
          </div>
        </CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger
            aria-label="Choose a retention period"
            className="h-8 w-[118px] text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-white/10 px-3 rounded-xl border border-[#d8dcfa] dark:border-white/10 shadow-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {RETENTION_PERIODS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-xs font-semibold">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4 relative">
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
                className="text-[#eceef8] dark:text-slate-800"
              />

              <motion.circle
                initial={{ strokeDasharray: '0, 100' }}
                animate={{ strokeDasharray: `${retention}, 100` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#5661e9"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                {isLoading ? '–' : `${retention}%`}
              </span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">
                Retained
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              {reviewed === 0 ? 'Ready to build recall' : 'Effective Retention!'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {isLoading ? 'Loading your review outcomes…' : message}
            </p>
          </div>
        </div>

        {/* Breakdown Stats Row */}
        <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 grid grid-cols-3 gap-2.5 text-center">
          <div className="rounded-xl border border-[#e0e4f1] dark:border-white/10 bg-white/80 dark:bg-white/5 p-2.5 shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#5661e9]" />
              Reviewed
            </div>
            <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">
              {isLoading ? '–' : reviewed}
            </span>
          </div>

          <div className="rounded-xl border border-[#e0e4f1] dark:border-white/10 bg-white/80 dark:bg-white/5 p-2.5 shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Retained
            </div>
            <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">
              {isLoading ? '–' : retained}
            </span>
          </div>

          <div className="rounded-xl border border-[#e0e4f1] dark:border-white/10 bg-white/80 dark:bg-white/5 p-2.5 shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Forgotten
            </div>
            <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">
              {isLoading ? '–' : forgotten}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

NeuralProgress.displayName = 'NeuralProgress';

export default NeuralProgress;

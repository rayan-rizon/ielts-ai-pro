import React, { memo, useEffect, useState } from 'react';
import { m } from 'framer-motion';
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
import { cn } from '@/lib/cn';
import { IconChip, MUTED, PANEL, TILE } from '@/features/dashboard/components/primitives';

const EMPTY_PROGRESS = { reviewed: 0, retained: 0, forgotten: 0, retention: 0 };

const NeuralProgress = memo(({ user, refreshKey = 0 }) => {
  const [period, setPeriod] = useState('thisWeek');
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

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
      setLoadError(false);
      try {
        const events = await fetchVocabularyReviewEvents(user.id, period);
        if (isCurrent) setProgress(calculateRetentionProgress(events));
      } catch {
        if (isCurrent) {
          setProgress(EMPTY_PROGRESS);
          setLoadError(true);
        }
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
    <div className={cn(PANEL, 'relative overflow-hidden p-4 sm:p-5')}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5a63df]/10 blur-xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-[#eeedf7] pb-3 dark:border-white/[0.07]">
        <h3 className="flex min-w-0 items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
          <IconChip icon={TrendingUp} />
          <div className="flex items-center gap-1 min-w-0">
            <span className="truncate">Retention Progress</span>
            <Info
              className="h-3.5 w-3.5 shrink-0 cursor-help text-slate-400"
              aria-label="Retention is based on review ratings."
            />
          </div>
        </h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger
            aria-label="Choose a retention period"
            className="h-7.5 w-[105px] shrink-0 rounded-lg border-[#e2e5f2] bg-white px-2 text-[11px] font-bold text-slate-700 dark:border-white/10 dark:bg-white/4 dark:text-slate-300"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            {RETENTION_PERIODS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-xs font-semibold">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative space-y-4 pt-4">
        <div className="flex items-center gap-4">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
            <svg
              className="h-full w-full -rotate-90 transform"
              viewBox="0 0 36 36"
              role="img"
              aria-label={
                loadError ? 'Review progress unavailable' : `Retention rate: ${retention}%`
              }
            >
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.2"
                className="text-[#f4f3fb] dark:text-white/10"
              />

              <m.circle
                initial={{ strokeDasharray: '0, 100' }}
                animate={{ strokeDasharray: `${retention}, 100` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#5a63df"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black leading-none tracking-tight text-slate-900 dark:text-white">
                {isLoading || loadError || reviewed === 0 ? '–' : `${retention}%`}
              </span>
              <span className="mt-0.5 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                Retained
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {loadError
                ? 'Progress unavailable'
                : reviewed === 0
                  ? 'Ready to review'
                  : 'Your review results'}
            </h4>
            <p className={cn('text-xs font-medium leading-relaxed', MUTED)}>
              {isLoading
                ? 'Loading your review results…'
                : loadError
                  ? 'We could not load your review results. Try this page again later.'
                  : message}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 border-t border-[#eeedf7] pt-3 text-center dark:border-white/[0.07]">
          <div className={cn(TILE, 'p-1.5 sm:p-2')}>
            <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold uppercase tracking-tight text-slate-500 dark:text-slate-400">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5a63df]" />
              <span className="truncate">Reviewed</span>
            </div>
            <span className="mt-0.5 block text-sm font-black text-slate-900 dark:text-white sm:text-base">
              {isLoading || loadError ? '–' : reviewed}
            </span>
          </div>

          <div className={cn(TILE, 'p-1.5 sm:p-2')}>
            <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold uppercase tracking-tight text-slate-500 dark:text-slate-400">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span className="truncate">Retained</span>
            </div>
            <span className="mt-0.5 block text-sm font-black text-slate-900 dark:text-white sm:text-base">
              {isLoading || loadError ? '–' : retained}
            </span>
          </div>

          <div className={cn(TILE, 'p-1.5 sm:p-2')}>
            <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold uppercase tracking-tight text-slate-500 dark:text-slate-400">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span className="truncate">Forgotten</span>
            </div>
            <span className="mt-0.5 block text-sm font-black text-slate-900 dark:text-white sm:text-base">
              {isLoading || loadError ? '–' : forgotten}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

NeuralProgress.displayName = 'NeuralProgress';

export default NeuralProgress;

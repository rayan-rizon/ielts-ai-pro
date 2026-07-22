import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/cn';

export const SectionCard = ({ index, title, correct, total, percentage, isLocked = false }) => {
  const getColors = (pct) => {
    if (pct >= 80)
      return {
        bar: 'bg-emerald-500',
        badge: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60',
        iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      };
    if (pct >= 60)
      return {
        bar: 'bg-indigo-500',
        badge: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60',
        iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      };
    if (pct >= 40)
      return {
        bar: 'bg-amber-500',
        badge: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60',
        iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      };
    return {
      bar: 'bg-rose-500',
      badge: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60',
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    };
  };

  const colors = getColors(percentage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className={cn(
        'group relative overflow-hidden p-3 rounded-xl transition-all duration-200',
        'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs',
        'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs',
        isLocked && 'opacity-50 blur-[1px]'
      )}
      data-oid="mx98p.:"
    >
      <div className="flex items-center justify-between gap-2 mb-2" data-oid="g:dv8mn">
        <div className="flex items-center gap-2 min-w-0" data-oid="6fssem6">
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
              colors.iconBg
            )}
            data-oid="84xa7w1"
          >
            <BookOpen className="w-3.5 h-3.5" data-oid="5dkph:c" />
          </div>
          <div className="min-w-0 flex-1" data-oid="eqmllhc">
            <h4
              className="text-xs font-black text-slate-800 dark:text-slate-200 truncate leading-tight"
              data-oid="p5jxdv8"
            >
              {title.includes('Part') || title.includes('Passage')
                ? title
                : `Passage ${index + 1}`}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-bold border',
              colors.badge
            )}
            data-oid="lgm-2mk"
          >
            {percentage}%
          </span>
          <div className="text-right min-w-[28px]">
            <span className="text-xs font-black text-slate-900 dark:text-white leading-none">
              {correct}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 leading-none">
              /{total}
            </span>
          </div>
        </div>
      </div>

      <div
        className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
        data-oid="k86idui"
      >
        <motion.div
          className={cn('h-full rounded-full', colors.bar)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: 0.2 + index * 0.1, ease: 'easeOut' }}
          data-oid="76vi9u1"
        />
      </div>
    </motion.div>
  );
};

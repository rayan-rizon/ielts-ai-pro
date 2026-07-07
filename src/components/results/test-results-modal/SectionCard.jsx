import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/cn';

export const SectionCard = ({ index, title, correct, total, percentage, isLocked = false }) => {
  const getColors = (pct) => {
    if (pct >= 80)
      return {
        bar: 'bg-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        icon: 'text-emerald-500',
      };
    if (pct >= 60)
      return {
        bar: 'bg-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        icon: 'text-blue-500',
      };
    if (pct >= 40)
      return {
        bar: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        icon: 'text-amber-500',
      };
    return {
      bar: 'bg-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      icon: 'text-rose-500',
    };
  };

  const colors = getColors(percentage);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 * index }}
      className={cn(
        'group relative overflow-hidden p-3.5 rounded-xl transition-all duration-300',
        'bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800',
        'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700',
        isLocked && 'opacity-50 blur-[1px]'
      )}
      data-oid="mx98p.:"
    >
      <div className="flex items-center justify-between gap-3 relative z-10" data-oid="g:dv8mn">
        <div className="flex items-center gap-2 min-w-0" data-oid="6fssem6">
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm',
              colors.bg
            )}
            data-oid="84xa7w1"
          >
            <BookOpen className={cn('w-3.5 h-3.5', colors.icon)} data-oid="5dkph:c" />
          </div>
          <div className="min-w-0 flex-1" data-oid="eqmllhc">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0" data-oid="p5jxdv8-wrap">
              <h4
                className="text-xs sm:text-[13px] font-black text-slate-800 dark:text-slate-200 truncate leading-tight shrink-0"
                data-oid="p5jxdv8"
              >
                {title.includes('Part') || title.includes('Passage')
                  ? title
                  : `Passage ${index + 1}`}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5" data-oid="e1oc14a">
              <span
                className={cn(
                  'text-[9px] sm:text-[10px] font-black uppercase tracking-wider',
                  colors.text
                )}
                data-oid="lgm-2mk"
              >
                {percentage}% Accuracy
              </span>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col items-end justify-center shrink-0 min-w-[28px]"
          data-oid="m1ndtdc"
        >
          <span
            className="text-sm font-black tracking-tight leading-none text-slate-900 dark:text-white"
            data-oid="i7i7q0v"
          >
            {correct}
          </span>
          <span
            className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-none mt-0.5"
            data-oid="j3j80w_"
          >
            /{total}
          </span>
        </div>
      </div>

      <div
        className="mt-2.5 h-1 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden"
        data-oid="k86idui"
      >
        <motion.div
          className={cn('h-full rounded-full', colors.bar)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: 'circOut' }}
          data-oid="76vi9u1"
        />
      </div>
    </motion.div>
  );
};

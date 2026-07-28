import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import EmptyAnalyticsState from '../EmptyAnalyticsState';
import { getQuestionSuccessSummary, questionSuccessTone } from './SharedHelpers';

const QuestionTypeTable = React.memo(function QuestionTypeTable({ data }) {
  if (!data || !data.length)
    return (
      <EmptyAnalyticsState
        icon={Target}
        title="Accuracy Breakdown"
        description="Submit tests with feedback to see your precision breakdown across question types."
        compact
      />
    );

  const summary = getQuestionSuccessSummary(data);

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-[#f5f4ff] p-2.5 dark:border-indigo-900/40 dark:bg-indigo-950/40">
        <div>
          <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">
            Weighted accuracy
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {summary.correct} correct from {summary.total} graded questions
          </p>
        </div>
        <p className="text-xl font-black text-[#5661e9] dark:text-indigo-300">
          {summary.accuracy}%
        </p>
      </div>

      {data.map((item, idx) => (
        <motion.article
          key={idx}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
          className="group relative rounded-xl border border-indigo-100/80 bg-[#faf9ff] p-2.5 transition-all hover:border-[#5661e9]/50 hover:bg-white hover:shadow-2xs dark:border-white/10 dark:bg-slate-900/80"
        >
          {(() => {
            const tone = questionSuccessTone(item.accuracy, item.total);
            return (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', tone.accent)} />
                    <span className="text-xs font-black text-slate-950 dark:text-white truncate">
                      {item.module
                        ? `${item.module.charAt(0).toUpperCase() + item.module.slice(1)} - `
                        : ''}
                      {item.type
                        .split(/_|\s+/)
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-black text-slate-950 dark:text-white">
                      {item.accuracy}%
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider',
                        tone.badge
                      )}
                    >
                      {tone.label}
                    </span>
                  </div>
                </div>

                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.accuracy}%` }}
                    className={cn('h-full rounded-full transition-all duration-1000', tone.accent)}
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                  <span>Correct answers</span>
                  <span>
                    <strong className="text-slate-950 dark:text-white font-black">
                      {item.correct}
                    </strong>{' '}
                    of {item.total}
                  </span>
                </div>
              </>
            );
          })()}
        </motion.article>
      ))}
    </div>
  );
});

export default QuestionTypeTable;

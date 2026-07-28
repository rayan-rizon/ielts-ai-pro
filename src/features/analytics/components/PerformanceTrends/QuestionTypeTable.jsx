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
        data-oid="hzugqsx"
      />
    );

  const summary = getQuestionSuccessSummary(data);

  return (
    <div className="space-y-2 pt-1" data-oid="t9.c66m">
      <div className="flex items-center justify-between rounded-xl border border-violet-100 bg-violet-50/50 p-2.5 dark:border-violet-500/15 dark:bg-violet-500/5">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
            Weighted accuracy
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {summary.correct} correct from {summary.total} graded questions
          </p>
        </div>
        <p className="text-xl font-black text-violet-600 dark:text-violet-400">
          {summary.accuracy}%
        </p>
      </div>
      {data.map((item, idx) => (
        <motion.article
          key={idx}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
          className="group relative rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition-all hover:border-violet-200/80 hover:shadow-xs dark:border-white/5 dark:bg-white/[0.03]"
          data-oid="qpfmnea"
        >
          {(() => {
            const tone = questionSuccessTone(item.accuracy, item.total);
            return (
              <>
                <div className="flex items-center justify-between gap-2" data-oid="d:oa..r">
                  <div className="flex items-center gap-2 min-w-0" data-oid="::ydhmk">
                    <span
                      className={cn('h-2 w-2 shrink-0 rounded-full', tone.accent)}
                      data-oid="ozi547e"
                    />
                    <span
                      className="text-xs font-black text-slate-900 dark:text-white truncate"
                      data-oid="32-hpvy"
                    >
                      {item.module
                        ? `${item.module.charAt(0).toUpperCase() + item.module.slice(1)} · `
                        : ''}
                      {item.type
                        .split(/_|\s+/)
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0" data-oid="2-:-ndm">
                    <span className={cn('text-xs font-black', tone.text)}>{item.accuracy}%</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase',
                        tone.badge
                      )}
                    >
                      {tone.label}
                    </span>
                  </div>
                </div>

                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                  data-oid="pwl9tjb"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.accuracy}%` }}
                    className={cn('h-full rounded-full transition-all duration-1000', tone.accent)}
                    data-oid="vdpsru:"
                  />
                </div>

                <div
                  className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-400"
                  data-oid="f7d3yd2"
                >
                  <span>Correct answers</span>
                  <span data-oid="u5q:igr">
                    <strong className="text-slate-800 dark:text-slate-200" data-oid="67cswiw">
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

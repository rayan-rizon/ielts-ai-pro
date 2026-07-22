import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight } from 'lucide-react';

export function PassageBreakdownCard({ testResults, testType = 'reading', onReviewAnswers }) {
  const sections = testResults?.sectionStats || [];
  const sectionLabel = testType === 'listening' ? 'Part' : 'Passage';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-blue-200/80 dark:border-slate-800 shadow-sm space-y-3 h-full flex flex-col justify-between"
    >
      <h3 className="text-sm font-black text-slate-900 dark:text-white">
        {sectionLabel} Breakdown
      </h3>

      <div className="space-y-2 flex-1 flex flex-col justify-center">
        {sections.map((stat, idx) => {
          const title = stat.title || `${sectionLabel} ${idx + 1}`;
          const correct = stat.correct || 0;
          const total = stat.total || 0;
          const percentage =
            stat.percentage ?? (total > 0 ? Math.round((correct / total) * 100) : 0);

          return (
            <button
              key={idx}
              type="button"
              onClick={onReviewAnswers}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {title}
                </h4>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  {correct}{' '}
                  <span className="text-[11px] font-semibold text-slate-400">/ {total}</span>
                </p>
                <span className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-[11px] font-black border border-slate-200 dark:border-slate-800">
                  {percentage}%
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default PassageBreakdownCard;

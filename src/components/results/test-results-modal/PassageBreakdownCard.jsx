import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight } from 'lucide-react';

export function PassageBreakdownCard({ testResults, testType = 'reading', onReviewAnswers }) {
  const sections = testResults?.sectionStats || [];
  const sectionLabel = testType === 'listening' ? 'Part' : 'Passage';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white via-[#fafbff] to-[#f4f3ff] dark:from-[#101322] dark:via-[#0e111d] dark:to-[#141829] border border-[#dce0f5] dark:border-white/10 shadow-[0_10px_30px_-15px_rgba(86,97,233,0.12)] space-y-3 h-full flex flex-col justify-between"
    >
      <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">
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
              className="p-2.5 rounded-xl bg-white/90 dark:bg-white/5 border border-[#e2e5f6] dark:border-white/10 hover:border-[#5661e9]/60 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 border border-[#d2d7f8] dark:border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-950 dark:text-white truncate">
                  {title}
                </h4>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <p className="text-xs font-black text-slate-950 dark:text-white">
                  {correct}{' '}
                  <span className="text-[11px] font-semibold text-slate-400">/ {total}</span>
                </p>
                <span className="px-2 py-0.5 rounded-lg bg-[#efedff] dark:bg-indigo-500/20 text-[#5661e9] dark:text-indigo-300 text-[11px] font-black border border-[#d2d7f8] dark:border-indigo-500/30">
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

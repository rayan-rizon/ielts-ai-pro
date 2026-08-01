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
      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#131315] dark:to-[#131315] border border-[#e4e2f0] dark:border-white/[0.07] shadow-2xs space-y-3 h-full flex flex-col justify-between"
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
              className="p-2.5 rounded-xl bg-white/90 dark:bg-white/5 border border-[#e4e2f0] dark:border-white/[0.07] hover:border-[#5a63df]/50 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff] border border-[#5a63df]/20 dark:border-[#5a63df]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
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
                <span className="px-2 py-0.5 rounded-lg bg-[#5a63df]/10 dark:bg-[#5a63df]/20 text-[#5a63df] dark:text-[#a9afff] text-[11px] font-black border border-[#5a63df]/20 dark:border-[#5a63df]/30">
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

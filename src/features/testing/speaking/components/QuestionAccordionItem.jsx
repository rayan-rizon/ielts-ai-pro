import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';
import DeepDiveQuestionContent from './DeepDiveQuestionContent';

export default function QuestionAccordionItem({ item, localIdx, globalIdx, isExpanded, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: globalIdx * 0.05 }}
      className={cn(
        'group/card bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] border border-[#e4e2f0] dark:border-white/[0.07] hover:border-rose-200/70 dark:hover:border-rose-500/25 rounded-xl overflow-hidden transition-all duration-300',
        isExpanded ? 'shadow-xl shadow-rose-500/5 ring-1 ring-rose-500/20' : 'shadow-sm'
      )}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-[#f4f3fb] dark:hover:bg-white/[0.04] md:p-4"
      >
        <div
          className={cn(
            'w-9 h-9 rounded-xl font-black flex items-center justify-center shrink-0 mt-0.5 shadow-sm border transition-all duration-500',
            isExpanded
              ? 'bg-rose-600 text-white border-rose-500 scale-110 shadow-lg shadow-rose-500/20'
              : 'bg-[#f4f3fb] dark:bg-white/[0.04] text-slate-400 dark:text-slate-600 border-[#e4e2f0] dark:border-white/[0.07]'
          )}
        >
          <span className="text-[13px]">Q{localIdx + 1}</span>
        </div>
        <div className="flex-1 pt-1.5 flex items-center justify-between">
          <h4
            className={cn(
              'font-bold text-[14px] md:text-[15px] leading-snug pr-4 transition-colors duration-300',
              isExpanded ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'
            )}
          >
            {item.question}
          </h4>
          <div
            className={cn(
              'shrink-0 p-1 rounded-full transition-all duration-500',
              isExpanded
                ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 rotate-180'
                : 'bg-[#f4f3fb] dark:bg-white/[0.04] text-slate-400 dark:text-slate-500'
            )}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
            className="overflow-hidden bg-gradient-to-b from-[#f4f3fb]/60 to-white dark:from-white/[0.03] dark:to-[#100f15]"
          >
            <DeepDiveQuestionContent item={item} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

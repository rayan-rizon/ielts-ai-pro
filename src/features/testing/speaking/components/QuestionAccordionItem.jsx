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
        'group/card bg-white dark:bg-zinc-950 border border-border/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 rounded-[1.2rem] overflow-hidden transition-all duration-300',
        isExpanded ? 'shadow-xl shadow-rose-500/5 ring-1 ring-rose-500/20' : 'shadow-sm'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-4 md:p-5 flex items-start gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
      >
        <div
          className={cn(
            'w-9 h-9 rounded-xl font-black flex items-center justify-center shrink-0 mt-0.5 shadow-sm border transition-all duration-500',
            isExpanded
              ? 'bg-rose-600 text-white border-rose-500 scale-110 shadow-lg shadow-rose-500/20'
              : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800'
          )}
        >
          <span className="text-[13px]">Q{localIdx + 1}</span>
        </div>
        <div className="flex-1 pt-1.5 flex items-center justify-between">
          <h4
            className={cn(
              'font-bold text-[14px] md:text-[15px] leading-snug pr-4 transition-colors duration-300',
              isExpanded ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
            )}
          >
            {item.question}
          </h4>
          <div
            className={cn(
              'shrink-0 p-1 rounded-full transition-all duration-500',
              isExpanded
                ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 rotate-180'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400'
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
            className="overflow-hidden bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-950"
          >
            <DeepDiveQuestionContent item={item} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

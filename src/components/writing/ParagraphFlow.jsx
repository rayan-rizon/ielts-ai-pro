import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { WELL, NUM } from '@/features/dashboard/components/primitives';

export function ParagraphFlowSection({ t, writingAnalysis }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!writingAnalysis?.paragraphOpenings?.length) return null;

  return (
    <div className="border-t border-[#e4e2f0] pt-2 text-xs dark:border-white/[0.07]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center gap-2 font-bold text-slate-900 dark:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] rounded-sm transition-opacity hover:opacity-85 active:scale-[0.99]"
      >
        <span>{t('wlFlow')}</span>
        <span
          className={cn(
            NUM,
            'rounded-md bg-[#f1f0fa] px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300'
          )}
        >
          {t.language === 'en'
            ? `${writingAnalysis.paragraphCount} paragraph${writingAnalysis.paragraphCount === 1 ? '' : 's'}`
            : t('wlFlowCount', { count: writingAnalysis.paragraphCount })}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span>{t(isOpen ? 'wlFlowHide' : 'wlFlowShow')}</span>
          <ChevronRight
            className={cn(
              'h-3 w-3 transition-transform duration-200 ease-out',
              isOpen && 'rotate-90'
            )}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <ol className="mt-2 grid gap-1.5 sm:grid-cols-2 pt-0.5">
              {writingAnalysis.paragraphOpenings.map((opening, index) => (
                <li
                  key={index}
                  className={cn(WELL, 'flex min-w-0 items-start gap-2 rounded-lg p-2 text-xs')}
                >
                  <span
                    className={cn(
                      NUM,
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-800 shadow-2xs dark:bg-white/10 dark:text-slate-200'
                    )}
                    aria-label={`Paragraph ${index + 1}`}
                  >
                    {index + 1}
                  </span>
                  <span className="line-clamp-2 min-w-0 break-words leading-5 text-slate-800 dark:text-slate-200">
                    {opening}
                  </span>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

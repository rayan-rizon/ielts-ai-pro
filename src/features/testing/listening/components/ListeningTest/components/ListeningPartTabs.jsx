import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ListeningPartTabs({
  displaySections,
  activePart,
  stats,
  dispatch,
  ACTIONS,
  locked = false,
}) {
  return (
    <div
      className="relative bg-white/90 dark:bg-[#131315]/90 backdrop-blur-xl border-b border-[#e4e2f0] dark:border-white/[0.07] px-2 sm:px-4 py-2 shrink-0 relative z-20 shadow-sm transition-all duration-300 w-full overflow-x-auto"
      style={{ scrollbarWidth: 'none' }}
      data-oid="v0bnih8"
    >
      <div
        className="flex items-center justify-start sm:justify-center min-w-max"
        data-oid="ujg4x08"
      >
        <div
          className="inline-flex p-1 bg-[#f4f3fb] dark:bg-white/[0.04] rounded-xl sm:rounded-2xl border border-[#e4e2f0] dark:border-white/[0.07] relative z-0 backdrop-blur-sm"
          data-oid="2eggma3"
        >
          {displaySections.map((section, idx) => {
            const isActive = activePart === idx;
            const result = stats.results[idx] || {};
            const answeredInPart = (result.sAnswered || 0) > 0;
            const isCompleted = result.sAnswered === result.sQCount && result.sQCount > 0;

            return (
              <button
                key={idx}
                disabled={locked && !isActive}
                onClick={() => dispatch({ type: ACTIONS.SET_ACTIVE_PART, payload: idx })}
                className={cn(
                  'relative px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-colors duration-200 ease-out flex items-center justify-center gap-1.5 sm:gap-2.5 z-10 select-none whitespace-nowrap',
                  isActive
                    ? 'text-white'
                    : locked
                      ? 'cursor-not-allowed text-slate-300 dark:text-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                )}
                data-oid="hag248p"
              >
                {/* Active Background Animation */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabBackground"
                    className="absolute inset-0 bg-[#5a63df] rounded-lg sm:rounded-xl -z-10"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    data-oid="egxwqa:"
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg sm:rounded-xl"
                      data-oid="jn6630n"
                    />
                  </motion.div>
                )}

                {/* Status Indicator / Number */}
                <span
                  className={cn(
                    'w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 rounded-md flex items-center justify-center text-[9px] font-black transition-colors duration-200 relative',
                    isActive
                      ? 'bg-white/20 text-white'
                      : isCompleted
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : answeredInPart
                          ? 'bg-[#5a63df] text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-white/[0.08] text-slate-500 dark:text-slate-400 group-hover:bg-slate-300 dark:group-hover:bg-white/[0.14]'
                  )}
                  data-oid="86c.5ck"
                >
                  {isCompleted && !isActive ? (
                    <CheckCircle className="w-2.5 h-2.5" data-oid="d-aicsk" />
                  ) : (
                    idx + 1
                  )}
                </span>

                {/* Label */}
                <span
                  className="uppercase tracking-wide sm:tracking-wider text-[10px] sm:text-[11px] font-bold"
                  data-oid=".sjw5by"
                >
                  Part {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

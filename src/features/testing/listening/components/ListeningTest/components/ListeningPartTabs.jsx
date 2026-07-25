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
      className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-2 sm:px-4 py-2 shrink-0 relative z-20 shadow-sm transition-all duration-300 w-full overflow-x-auto"
      style={{ scrollbarWidth: 'none' }}
      data-oid="v0bnih8"
    >
      <div
        className="flex items-center justify-start sm:justify-center min-w-max"
        data-oid="ujg4x08"
      >
        <div
          className="inline-flex p-1 bg-slate-100/50 dark:bg-slate-950/50 rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-white/5 relative z-0 backdrop-blur-sm"
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
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )}
                data-oid="hag248p"
              >
                {/* Active Background Animation */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabBackground"
                    className="absolute inset-0 bg-blue-600 dark:bg-blue-600 shadow-[0_4px_12px_-2px_rgba(37,99,235,0.4)] dark:shadow-[0_4px_12px_-2px_rgba(37,99,235,0.6)] rounded-lg sm:rounded-xl -z-10"
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
                    'w-4 h-4 sm:w-5 sm:h-5 shrink-0 rounded-md flex items-center justify-center text-[9px] sm:text-[10px] font-black transition-colors duration-200 relative',
                    isActive
                      ? 'bg-white/20 text-white'
                      : isCompleted
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : answeredInPart
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                  )}
                  data-oid="86c.5ck"
                >
                  {isCompleted && !isActive ? (
                    <CheckCircle className="w-3 h-3" data-oid="d-aicsk" />
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

import React from 'react';
import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const PartCompleteCard = React.memo(
  ({ isPartComplete, currentPartNumber, allParts, onMoveToNext }) => {
    const hasNextPart = Boolean(allParts[currentPartNumber + 1]);

    return (
      <AnimatePresence>
        {isPartComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="w-full"
          >
            {/* Card */}
            <div className="relative overflow-hidden rounded-xl border border-rose-200/60 bg-linear-to-br/srgb from-rose-50 via-pink-50/60 to-rose-50/40 shadow-sm dark:border-rose-500/20 dark:from-[#151415] dark:via-[#131315] dark:to-[#151415]">
              {/* Subtle radial glow at top-centre */}
              <div
                className="pointer-events-none absolute -top-10 left-1/2 h-40 w-56 -translate-x-1/2 rounded-full bg-rose-400/20 blur-3xl dark:bg-rose-500/15"
                aria-hidden="true"
              />

              <div className="relative flex flex-col items-center gap-3 px-4 py-4 text-center md:py-5">
                {/* Icon */}
                <motion.div
                  className="relative"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-2xl bg-rose-400/25 blur-lg" />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br/srgb from-rose-400 to-rose-600 shadow-md shadow-rose-500/30">
                    <CheckCircle2 className="h-6 w-6 text-white drop-shadow-sm" />
                  </div>
                </motion.div>

                {/* Text */}
                <div className="space-y-1.5">
                  <span className="inline-flex items-center rounded-full border border-rose-300/60 bg-rose-100/80 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-rose-600 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400">
                    Section complete
                  </span>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 md:text-2xl">
                    Part {currentPartNumber} Finished
                  </h2>
                  <p className="mx-auto max-w-104 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400 md:text-sm">
                    {hasNextPart
                      ? `You have completed this part. Tap below to start Part ${currentPartNumber + 1}.`
                      : 'Your test is complete. Your report is being generated automatically.'}
                  </p>
                </div>

                {/* CTA */}
                {hasNextPart ? (
                  <div className="pt-0.5">
                    <Button
                      onClick={onMoveToNext}
                      className="group relative h-11 overflow-hidden rounded-xl bg-linear-to-r/srgb from-rose-500 to-rose-600 px-8 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white shadow-md shadow-rose-500/30 transition-all duration-200 hover:from-rose-600 hover:to-rose-700 hover:shadow-rose-500/45 active:scale-95"
                    >
                      <span className="flex items-center gap-2">
                        Proceed to Part {currentPartNumber + 1}
                        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </span>
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 rounded-full border border-rose-200/60 bg-white/80 px-4 py-2 shadow-sm dark:border-rose-500/15 dark:bg-white/5"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin text-rose-500"
                      aria-hidden="true"
                    />
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-400">
                      Analysing your performance
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

PartCompleteCard.displayName = 'PartCompleteCard';
export default PartCompleteCard;

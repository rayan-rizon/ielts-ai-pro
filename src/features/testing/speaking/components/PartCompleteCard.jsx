import React from 'react';
import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  IconChip,
  MICRO,
  MUTED,
  PANEL,
  Pill,
  TITLE,
} from '@/features/dashboard/components/primitives';

const PartCompleteCard = React.memo(
  ({ isPartComplete, currentPartNumber, allParts, onMoveToNext, isTransitioning = false }) => {
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
            <div className={cn(PANEL, 'overflow-hidden')}>
              <div className="flex flex-col items-center gap-2 px-4 py-3.5 text-center">
                <IconChip icon={CheckCircle2} tone="rose" size="md" />

                <div className="space-y-1">
                  <Pill className="border-rose-500/35 bg-rose-500/8 text-rose-600 dark:bg-rose-400/12 dark:text-rose-300">
                    Section complete
                  </Pill>
                  <h2 className={cn(TITLE, 'text-lg md:text-xl')}>
                    Part {currentPartNumber} Finished
                  </h2>
                  <p className={cn(MUTED, 'mx-auto max-w-104 text-xs leading-snug md:text-sm')}>
                    {hasNextPart
                      ? `You have completed this part. Tap below to start Part ${currentPartNumber + 1}.`
                      : 'Your test is complete. Your report is being generated automatically.'}
                  </p>
                </div>

                {hasNextPart ? (
                  <div className="pt-0.5">
                    <Button
                      onClick={onMoveToNext}
                      disabled={isTransitioning}
                      aria-busy={isTransitioning}
                      className="group h-9 rounded-lg bg-[#ef295d] px-5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white shadow-none hover:bg-[#d91f51] hover:shadow-none"
                    >
                      <span className="flex items-center gap-2">
                        {isTransitioning
                          ? `Opening Part ${currentPartNumber + 1}`
                          : `Proceed to Part ${currentPartNumber + 1}`}
                        {isTransitioning ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        )}
                      </span>
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 rounded-lg border border-[#e4e2f0] px-3 py-2 dark:border-white/[0.07]"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin text-rose-500"
                      aria-hidden="true"
                    />
                    <p className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>
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

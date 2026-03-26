import React from 'react';
import { CheckCircle2, ChevronRight, Milestone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const PartCompleteCard = React.memo(
  ({ isPartComplete, currentPartNumber, allParts, onMoveToNext }) => (
    <AnimatePresence>
      {isPartComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full"
        >
          <div className="relative overflow-hidden rounded-[1.5rem] border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-orange-500/5 to-transparent dark:from-rose-500/20 dark:via-orange-500/10 dark:to-transparent backdrop-blur-md">
            {/* Background Decorative Pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-dot-rose-900 dark:bg-dot-white" />

            <div className="relative p-5 md:p-6 flex flex-col items-center text-center space-y-4">
              {/* Dynamic Milestone Icon */}
              <motion.div
                className="relative"
                animate={{
                  y: [0, -3, 0],
                  rotate: [0, 2, -2, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-rose-500 to-orange-600 rounded-xl shadow-lg flex items-center justify-center transform rotate-2">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              </motion.div>

              <div className="space-y-1">
                <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/10 font-bold tracking-widest uppercase text-[9px] px-2 py-0">
                  Section Complete
                </Badge>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground leading-tight">
                  Part {currentPartNumber} Finished
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground font-semibold leading-relaxed max-w-sm mx-auto tracking-tight opacity-90">
                  {allParts[currentPartNumber + 1]
                    ? `You have completed this part. Tap below to start Part ${currentPartNumber + 1}.`
                    : `Test finished. Generating your score now.`}
                </p>
              </div>

              <div className="pt-1">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-orange-600 rounded-xl blur opacity-20 group-hover:opacity-60 transition duration-500 animate-pulse" />
                  <Button
                    onClick={onMoveToNext}
                    size="sm"
                    className="relative bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 h-11 px-8 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all group overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {allParts[currentPartNumber + 1] ? (
                        <>
                          Proceed to Part {currentPartNumber + 1}
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </>
                      ) : (
                        <>
                          Generate Final Report
                          <Milestone className="w-4 h-4" />
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </div>

              {!allParts[currentPartNumber + 1] && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="flex h-1 w-1 rounded-full bg-rose-500 animate-ping" />
                  <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40">
                    Preparing Results
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
);

PartCompleteCard.displayName = 'PartCompleteCard';
export default PartCompleteCard;

import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, MUTED, PANEL, Pill, TILE } from '@/features/dashboard/components/primitives';

const RATINGS = [
  { val: 1, icon: '😫', label: 'Forgot', tone: 'rose' },
  { val: 3, icon: '😐', label: 'Hard', tone: 'amber' },
  { val: 4, icon: '🙂', label: 'Good', tone: 'accent' },
  { val: 5, icon: '🤩', label: 'Easy', tone: 'emerald' },
];

const RATING_HOVER = {
  rose: 'hover:border-rose-400/50 hover:bg-rose-500/5',
  amber: 'hover:border-amber-400/50 hover:bg-amber-500/5',
  accent: 'hover:border-[#5a63df]/50 hover:bg-[#5a63df]/5',
  emerald: 'hover:border-emerald-400/50 hover:bg-emerald-500/5',
};

const RATING_TEXT = {
  rose: 'text-rose-600 dark:text-rose-400',
  amber: 'text-amber-600 dark:text-amber-400',
  accent: 'text-[#5a63df] dark:text-indigo-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
};

export default function ReviewSession({
  isOpen,
  onOpenChange,
  currentItem,
  isFlipped,
  onFlip,
  onSubmit,
}) {
  if (!currentItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-visible border-none bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">Review Session</DialogTitle>
        <div className="flex w-full flex-col items-center">
          <div className="relative h-[440px] w-full">
            <AnimatePresence mode="wait" initial={false}>
              {!isFlipped ? (
                <m.button
                  key="front"
                  type="button"
                  aria-label={`Reveal definition of ${currentItem.word}`}
                  initial={{ rotateY: 90, opacity: 0, scale: 0.95 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  exit={{ rotateY: -90, opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 120 }}
                  className={cn(
                    PANEL,
                    'group absolute inset-0 flex cursor-pointer flex-col items-center justify-center overflow-hidden p-10 text-inherit focus-visible:outline-2 focus-visible:outline-[#5a63df]'
                  )}
                  onClick={onFlip}
                >
                  <div className="flex flex-1 flex-col items-center justify-center space-y-6 text-center">
                    <div className="space-y-1.5">
                      <Pill tone="accent">Recall challenge</Pill>
                      <p className={cn('text-[11px] font-bold uppercase tracking-widest', MUTED)}>
                        Identify the concept
                      </p>
                    </div>

                    <h2 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white md:text-6xl">
                      {currentItem.word}
                    </h2>

                    {(currentItem.example || currentItem.example_sentence) && (
                      <div className={cn(TILE, 'max-w-md p-4')}>
                        <p className="text-center text-sm font-medium italic leading-relaxed text-slate-600 dark:text-slate-300">
                          &quot;{currentItem.example || currentItem.example_sentence}&quot;
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-[#5a63df] dark:text-slate-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5a63df]" />
                    Click or press Enter to reveal
                  </div>
                </m.button>
              ) : (
                <m.div
                  key="back"
                  initial={{ rotateY: 90, opacity: 0, scale: 0.95 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  exit={{ rotateY: -90, opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 120 }}
                  className={cn(
                    PANEL,
                    'absolute inset-0 flex flex-col justify-between overflow-hidden p-8'
                  )}
                >
                  <div className="flex w-full items-center justify-between border-b border-[#eeedf7] pb-4 dark:border-white/[0.07]">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Definition
                      </span>
                      <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {currentItem.word}
                      </span>
                    </div>
                    <IconChip icon={Brain} tone="accent" size="lg" />
                  </div>

                  <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
                    <p className="text-xl font-bold leading-relaxed tracking-tight text-slate-800 dark:text-slate-200 md:text-2xl">
                      {currentItem.definition}
                    </p>
                  </div>

                  <div className="w-full">
                    <p
                      className={cn(
                        'mb-3 text-center text-[10px] font-bold uppercase tracking-widest',
                        MUTED
                      )}
                    >
                      How well did you know this?
                    </p>
                    <div className="grid grid-cols-4 gap-2.5">
                      {RATINGS.map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => onSubmit(item.val)}
                          className={cn(
                            TILE,
                            'group flex h-auto flex-col items-center py-3.5 transition-all duration-200',
                            RATING_HOVER[item.tone]
                          )}
                        >
                          <span className="mb-1.5 text-2xl transition-transform duration-300 group-hover:scale-110">
                            {item.icon}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-widest',
                              RATING_TEXT[item.tone]
                            )}
                          >
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Trophy, Target, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, MUTED, Pill, TILE } from '@/features/dashboard/components/primitives';

export function SpeedQuizModal({ isOpen, onClose, gameData, gameState, gameScore, onAnswer }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideClose
        className="max-w-2xl overflow-hidden rounded-xl border-[#e2e5f2] bg-white p-0 dark:border-white/10 dark:bg-[#131218]"
      >
        <div className="flex items-center justify-between border-b border-[#eeedf7] px-6 py-4 dark:border-white/[0.07]">
          <DialogTitle className="flex items-center gap-3 text-sm font-extrabold text-slate-900 dark:text-white">
            <IconChip icon={Clock} tone="rose" />
            Speed Match
          </DialogTitle>
          <div className="flex items-center gap-4">
            {gameState === 'playing' && gameData && (
              <div className="mr-2 flex flex-col items-end">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Score
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {gameScore}
                </span>
              </div>
            )}
            <DialogClose className="rounded-full bg-slate-100 p-2 text-slate-500 transition-all hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
        </div>

        {gameData && gameData.questions && (
          <div className="p-6">
            {gameState === 'playing' ? (
              <div className="space-y-5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f4f3fb] dark:bg-white/10">
                  <m.div
                    initial={{ width: '0%' }}
                    animate={{
                      width: `${(((gameData.currentIndex || 0) + 1) / (gameData.questions?.length || 1)) * 100}%`,
                    }}
                    className="h-full rounded-full bg-rose-500"
                  />
                </div>

                <div className="space-y-1.5 py-1 text-center">
                  <span
                    className={cn('block text-[10px] font-bold uppercase tracking-widest', MUTED)}
                  >
                    What does this word mean?
                  </span>
                  <h3 className="px-4 text-3xl font-black italic leading-none tracking-tight text-slate-900 dark:text-white md:text-4xl">
                    {gameData.questions[gameData.currentIndex || 0]?.word || 'Unknown Word'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {(gameData.questions[gameData.currentIndex || 0]?.options || []).map(
                    (option, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onAnswer(option)}
                        className={cn(
                          TILE,
                          'group flex w-full items-center gap-3 p-3.5 text-left transition-all hover:border-[#5a63df]/40 hover:bg-[#5a63df]/[0.06] active:scale-[0.99]'
                        )}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#e2e5f2] bg-white text-[10px] font-bold text-slate-400 transition-all group-hover:border-[#5a63df] group-hover:bg-[#5a63df] group-hover:text-white dark:border-white/10 dark:bg-[#131218]">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="flex-1 whitespace-normal break-words text-sm font-bold italic leading-snug text-slate-700 group-hover:text-[#5a63df] dark:text-slate-200 dark:group-hover:text-indigo-300">
                          {option}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-8 text-center">
                <IconChip icon={Trophy} tone="amber" size="lg" className="mx-auto" />
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Quiz Complete!
                  </h2>
                  <p className={cn('text-sm font-bold', MUTED)}>
                    You earned:{' '}
                    <span className="text-emerald-600 dark:text-emerald-400">+{gameScore} pts</span>
                  </p>
                </div>
                <Button
                  onClick={onClose}
                  className="h-11 w-full rounded-lg bg-[#5a63df] font-bold text-white hover:bg-[#4a52c9]"
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function MatchPairsModal({
  isOpen,
  onClose,
  gameData,
  gameState,
  gameScore,
  onCardClick,
  onRestart,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideClose
        className="max-w-4xl overflow-hidden rounded-xl border-[#e2e5f2] bg-white p-0 dark:border-white/10 dark:bg-[#131218]"
      >
        <div className="flex items-center justify-between border-b border-[#eeedf7] px-6 py-4 dark:border-white/[0.07]">
          <DialogTitle className="flex items-center gap-3 text-sm font-extrabold text-slate-900 dark:text-white">
            <IconChip icon={Target} tone="accent" />
            Match Pairs
          </DialogTitle>
          {gameData && (
            <div className="flex items-center gap-3">
              <div className="mr-1 flex flex-col items-end">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Matched
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {gameData.matchedPairs || 0}{' '}
                  <span className="text-[10px] text-slate-400">/ {gameData.totalPairs || 0}</span>
                </span>
              </div>
              <Pill tone="accent">Score {gameScore}</Pill>
              <DialogClose className="rounded-full bg-slate-100 p-2 text-slate-500 transition-all hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20">
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
          )}
        </div>

        {gameData && gameData.cards ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center bg-[#fbfbfe] p-6 dark:bg-transparent">
            {gameState === 'playing' ? (
              <div className="w-full">
                <m.div className="grid grid-cols-2 gap-3 md:grid-cols-4" layout>
                  <AnimatePresence>
                    {gameData.cards.map((card) => {
                      const isFlipped =
                        card.isFlipped || gameData.flippedCards?.some((c) => c.id === card.id);
                      const isMatched = card.isMatched;

                      if (isMatched)
                        return <div key={card.id} className="h-24 opacity-0 md:h-32" />;

                      return (
                        <m.div
                          key={card.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onCardClick(card)}
                          className={cn(
                            'flex h-24 cursor-pointer items-center justify-center rounded-xl border p-4 text-center transition-all duration-200 md:h-32',
                            isFlipped
                              ? 'border-[#5a63df] bg-[#5a63df]/10 text-[#5a63df] dark:bg-indigo-500/20 dark:text-indigo-300'
                              : 'border-[#e2e5f2] bg-white text-slate-700 hover:border-[#c9cdf3] hover:bg-[#5a63df]/[0.04] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200'
                          )}
                        >
                          <span className="select-none whitespace-normal break-words text-xs font-black italic leading-tight tracking-tight md:text-sm">
                            {card.content}
                          </span>
                        </m.div>
                      );
                    })}
                  </AnimatePresence>
                </m.div>
              </div>
            ) : (
              <m.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 py-8 text-center"
              >
                <IconChip icon={Trophy} tone="amber" size="lg" className="mx-auto" />

                <div className="space-y-1.5">
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    All Matched!
                  </h2>
                  <p className={cn('text-sm font-bold', MUTED)}>
                    You scored{' '}
                    <span className="text-[#5a63df] dark:text-indigo-400">{gameScore} points</span>
                  </p>
                </div>

                <div className={cn(TILE, 'mx-auto w-full max-w-md p-5')}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Final Score
                    </span>
                    <span className="text-2xl font-black italic tracking-tight text-emerald-600 dark:text-emerald-400">
                      {gameScore}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#f4f3fb] dark:bg-white/10">
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="h-full rounded-full bg-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-center gap-2.5 pt-1">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="h-10 rounded-lg px-6 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={onRestart}
                    className="h-10 rounded-lg bg-[#5a63df] px-6 text-xs font-bold text-white hover:bg-[#4a52c9]"
                  >
                    Play Again
                  </Button>
                </div>
              </m.div>
            )}
          </div>
        ) : (
          <div className="flex h-[400px] flex-col items-center justify-center gap-4 p-20">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 animate-ping rounded-full bg-[#5a63df]/20" />
              <div className="relative flex h-full w-full items-center justify-center rounded-lg bg-[#5a63df]">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="animate-pulse text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Loading game...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import React from 'react';
import { ArrowLeft, Clock3, Headphones, MessageCircle, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

import { getQuestionLines } from '../utils/speakingTestUtils';

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

function StatusSection({ label, children, className }) {
  return (
    <section
      className={cn('min-w-0 border-border/70 px-4 py-3.5 sm:px-5 xl:border-l xl:py-4', className)}
    >
      <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      {children}
    </section>
  );
}

const TestHeader = React.memo(
  ({
    currentPartNumber,
    currentPart,
    totalParts,
    currentQuestionIndex,
    timeLeft,
    testTitle,
    isMuted,
    setIsMuted,
    isPart2Prep,
    onShowExitDialog,
  }) => {
    const partProgress = totalParts > 0 ? (currentPartNumber / totalParts) * 100 : 0;
    const questionCount = Math.max(getQuestionLines(currentPart?.questions).length, 1);
    const isLongTurn = currentPartNumber === 2;
    const questionValue = isPart2Prep
      ? 'Preparing'
      : isLongTurn
        ? 'Long turn'
        : `${Math.min(currentQuestionIndex + 1, questionCount)} of ${questionCount}`;
    const progressLabel = `${Math.round(partProgress)}%`;

    return (
      <header className="relative z-40 mb-2.5 sm:mb-3">
        <div className="mb-1 flex h-8 items-center justify-between sm:mb-2">
          <Button
            variant="ghost"
            onClick={onShowExitDialog}
            aria-label="Back to Speaking"
            className="group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card/95 text-foreground shadow-sm backdrop-blur-lg transition-all duration-200 hover:border-primary/40 hover:text-primary hover:shadow-md active:scale-95 sm:h-9 sm:w-auto sm:border-[#d2d7f8] sm:bg-gradient-to-r sm:from-white sm:to-[#f4f3ff] sm:px-3 sm:text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5 stroke-[2.5] sm:mr-2 sm:h-4.5 sm:w-4.5" />
            <span className="hidden text-xs font-bold sm:inline">Back to Speaking</span>
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/65 bg-card/95 shadow-[0_22px_65px_-42px_hsl(var(--foreground)/0.38)] backdrop-blur-xl sm:rounded-3xl">
          <div className="xl:hidden">
            <section className="flex min-w-0 items-center gap-3 py-2.5 pl-16 pr-3 sm:px-4 sm:py-3">
              <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/[0.09] text-rose-500 sm:flex">
                <Headphones className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.17em] text-rose-500">
                  Speaking practice
                </p>
                <h1 className="mt-0.5 truncate text-sm font-black tracking-[-0.02em] text-foreground sm:text-base">
                  IELTS Speaking Session
                </h1>
                <p className="truncate text-[10px] font-medium text-muted-foreground sm:text-[11px]">
                  {testTitle}
                </p>
              </div>
            </section>

            <section className="grid grid-cols-[minmax(0,1fr)_auto_auto] border-t border-border/70 sm:hidden">
              <div className="min-w-0 px-3 py-2.5">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.17em] text-muted-foreground">
                  Part {currentPartNumber}
                </p>
                <p className="mt-0.5 truncate text-[11px] font-extrabold text-foreground">
                  {currentPart?.title || `Speaking Part ${currentPartNumber}`}
                </p>
              </div>

              <div className="border-l border-border/70 px-3 py-2.5">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.17em] text-muted-foreground">
                  Time
                </p>
                <div
                  className={cn(
                    'mt-0.5 flex items-center gap-1 font-mono text-sm font-black tabular-nums',
                    timeLeft < 60 ? 'text-red-500' : 'text-rose-500'
                  )}
                  aria-label={`${formatTime(timeLeft)} remaining`}
                >
                  <Clock3
                    className={cn('h-3.5 w-3.5', timeLeft < 60 && 'animate-pulse')}
                    aria-hidden="true"
                  />
                  {formatTime(timeLeft)}
                </div>
              </div>

              <div className="flex items-center border-l border-border/70 px-2.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  aria-label={isMuted ? 'Unmute examiner audio' : 'Mute examiner audio'}
                  className="h-9 w-9 rounded-xl bg-muted/65 text-foreground transition-colors hover:bg-muted"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </section>

            <section className="hidden border-t border-border/70 px-3 py-2.5 sm:block sm:px-4 sm:py-3">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[8px] font-extrabold uppercase tracking-[0.17em] text-muted-foreground">
                    Part {currentPartNumber} of {totalParts}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-extrabold text-foreground">
                    {currentPart?.title || `Speaking Part ${currentPartNumber}`}
                  </p>
                </div>
                <p className="shrink-0 text-[10px] font-bold tabular-nums text-rose-500">
                  {progressLabel}
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${partProgress}%` }}
                  transition={{ type: 'spring', damping: 22, stiffness: 110 }}
                  className="h-full rounded-full bg-rose-500"
                />
              </div>
            </section>

            <section className="hidden grid-cols-[1fr_1fr_auto] border-t border-border/70 sm:grid">
              <div className="min-w-0 px-3 py-2.5 sm:px-4 sm:py-3">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.17em] text-muted-foreground">
                  Time left
                </p>
                <div
                  className={cn(
                    'mt-1 flex items-center gap-1.5 font-mono text-base font-black tabular-nums sm:text-lg',
                    timeLeft < 60 ? 'text-red-500' : 'text-rose-500'
                  )}
                  aria-label={`${formatTime(timeLeft)} remaining`}
                >
                  <Clock3
                    className={cn('h-4 w-4', timeLeft < 60 && 'animate-pulse')}
                    aria-hidden="true"
                  />
                  {formatTime(timeLeft)}
                </div>
              </div>

              <div className="min-w-0 border-l border-border/70 px-3 py-2.5 sm:px-4 sm:py-3">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.17em] text-muted-foreground">
                  {isLongTurn ? 'Task' : 'Question'}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <MessageCircle
                    className="h-3.5 w-3.5 shrink-0 text-rose-500"
                    aria-hidden="true"
                  />
                  <p className="truncate text-sm font-black text-foreground sm:text-base">
                    {questionValue}
                  </p>
                </div>
              </div>

              <div className="flex items-center border-l border-border/70 px-2.5 sm:px-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  aria-label={isMuted ? 'Unmute examiner audio' : 'Mute examiner audio'}
                  className="h-10 w-10 rounded-xl bg-muted/65 text-foreground transition-colors hover:bg-muted"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </section>
          </div>

          <div className="hidden xl:grid xl:grid-cols-[minmax(16rem,1.4fr)_minmax(8rem,0.7fr)_minmax(11rem,0.9fr)_minmax(7rem,0.6fr)_4.5rem_minmax(7rem,0.6fr)]">
            <section className="col-span-2 flex min-w-0 items-center gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5 xl:col-span-1 xl:border-b-0 xl:py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/[0.09] text-rose-500">
                <Headphones className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-rose-500">
                  Speaking practice
                </p>
                <h1 className="mt-0.5 truncate text-base font-black tracking-[-0.02em] text-foreground">
                  IELTS Speaking Session
                </h1>
                <p className="truncate text-[11px] font-medium text-muted-foreground">
                  {testTitle}
                </p>
              </div>
            </section>

            <StatusSection label="Part" className="border-b xl:border-b-0">
              <p className="flex items-baseline gap-1.5 text-foreground">
                <span className="text-2xl font-black leading-none text-rose-500">
                  {currentPartNumber}
                </span>
                <span className="text-base font-extrabold">of {totalParts}</span>
              </p>
              <p className="mt-1.5 truncate text-[10px] font-medium text-muted-foreground">
                {currentPart?.title || `Speaking Part ${currentPartNumber}`}
              </p>
            </StatusSection>

            <StatusSection label="Progress" className="border-b xl:border-b-0">
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${partProgress}%` }}
                  transition={{ type: 'spring', damping: 22, stiffness: 110 }}
                  className="h-full rounded-full bg-rose-500"
                />
              </div>
              <p className="mt-2 text-[10px] font-medium text-muted-foreground">
                Part {currentPartNumber} is active
              </p>
            </StatusSection>

            <StatusSection label="Time left">
              <div
                className={cn(
                  'flex items-center gap-2 font-mono text-xl font-black tabular-nums',
                  timeLeft < 60 ? 'text-red-500' : 'text-rose-500'
                )}
                aria-label={`${formatTime(timeLeft)} remaining`}
              >
                <Clock3
                  className={cn('h-5 w-5', timeLeft < 60 && 'animate-pulse')}
                  aria-hidden="true"
                />
                {formatTime(timeLeft)}
              </div>
            </StatusSection>

            <section className="flex items-center justify-center border-l border-border/70 px-3 py-4 xl:py-5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                aria-label={isMuted ? 'Unmute examiner audio' : 'Mute examiner audio'}
                className="h-11 w-11 rounded-2xl bg-muted/65 text-foreground transition-colors hover:bg-muted"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </section>

            <StatusSection label={isLongTurn ? 'Task' : 'Question'}>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-rose-500" aria-hidden="true" />
                <p className="truncate text-base font-black text-foreground">{questionValue}</p>
              </div>
              <p className="mt-1.5 text-[10px] font-medium text-muted-foreground">
                {isPart2Prep
                  ? 'Topic card ready'
                  : isLongTurn
                    ? 'Individual response'
                    : 'Current item'}
              </p>
            </StatusSection>
          </div>
        </div>
      </header>
    );
  }
);

TestHeader.displayName = 'TestHeader';
export default TestHeader;

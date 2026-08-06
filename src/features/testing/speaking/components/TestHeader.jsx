import React from 'react';
import { ArrowLeft, Clock3, MessageCircle, Mic2, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, NUM, PANEL, TITLE } from '@/features/dashboard/components/primitives';
import {
  TEST_HEADER_BACK,
  TEST_HEADER_BADGE,
} from '@/features/testing/shared/components/testHeaderStyles';

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
      className={cn(
        'min-w-0 border-[#e4e2f0] px-3.5 py-3 dark:border-white/[0.07] sm:px-4 xl:border-l xl:py-3.5',
        className
      )}
    >
      <p className={cn(MICRO, MUTED, 'mb-1.5')}>{label}</p>
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
      <header className="relative z-40 mb-2 sm:mb-2.5">
        <div className="mb-1 flex h-8 items-center justify-between sm:mb-2">
          <Button
            variant="ghost"
            onClick={onShowExitDialog}
            aria-label="Back to Speaking"
            className={cn(
              TEST_HEADER_BACK,
              'hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:border-rose-400/60 dark:hover:bg-rose-400/12 dark:hover:text-rose-300 sm:w-auto sm:px-3'
            )}
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5 stroke-[2.5] sm:mr-2 sm:h-4.5 sm:w-4.5" />
            <span className="hidden text-xs font-bold sm:inline">Back to Speaking</span>
          </Button>

          <div className="hidden items-center gap-2.5 sm:flex">
            <span
              className={cn(
                TEST_HEADER_BADGE,
                'border-rose-500/15 bg-rose-500/6 text-rose-600 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300'
              )}
            >
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500"
                aria-hidden="true"
              />
              Practice room
            </span>
            <span className={cn(MICRO, MUTED, 'tracking-[0.11em]')}>
              Your responses are saved automatically
            </span>
          </div>
        </div>

        <div className={cn(PANEL, 'overflow-hidden rounded-xl')}>
          <div className="xl:hidden">
            <section className="flex min-w-0 items-center gap-2.5 py-2.5 pl-16 pr-3 sm:px-4 sm:py-3">
              <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/9 text-rose-500 sm:flex">
                <Mic2 className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn(MICRO, 'text-rose-500')}>Speaking practice</p>
                <h1 className={cn(TITLE, 'mt-0.5 truncate text-sm sm:text-base')}>
                  IELTS Speaking Session
                </h1>
                <p className={cn(MUTED, 'truncate text-[10px] font-medium sm:text-[11px]')}>
                  {testTitle}
                </p>
              </div>
            </section>

            <section className="grid grid-cols-[minmax(0,1fr)_auto_auto] border-t border-[#e4e2f0] dark:border-white/[0.07] sm:hidden">
              <div className="min-w-0 px-3 py-2.5">
                <p className={cn(MICRO, MUTED)}>Part {currentPartNumber}</p>
                <p className="mt-0.5 truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
                  {currentPart?.title || `Speaking Part ${currentPartNumber}`}
                </p>
              </div>

              <div className="border-l border-[#e4e2f0] px-3 py-2.5 dark:border-white/[0.07]">
                <p className={cn(MICRO, MUTED)}>Time</p>
                <div
                  className={cn(
                    NUM,
                    'mt-0.5 flex items-center gap-1 text-sm font-extrabold',
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

              <div className="flex items-center border-l border-[#e4e2f0] px-2.5 dark:border-white/[0.07]">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  aria-label={isMuted ? 'Unmute examiner audio' : 'Mute examiner audio'}
                  className="h-9 w-9 rounded-xl border border-[#e4e2f0] bg-[#f4f3fb] text-slate-700 transition-colors hover:bg-[#ebeaf7] dark:border-white/10 dark:bg-white/5.5 dark:text-slate-200 dark:hover:bg-white/9"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </section>

            <section className="hidden border-t border-[#e4e2f0] px-3 py-2.5 dark:border-white/[0.07] sm:block sm:px-4 sm:py-3">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn(MICRO, MUTED)}>
                    Part {currentPartNumber} of {totalParts}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-extrabold text-slate-800 dark:text-slate-100">
                    {currentPart?.title || `Speaking Part ${currentPartNumber}`}
                  </p>
                </div>
                <p className={cn(NUM, 'shrink-0 text-[10px] font-bold text-rose-500')}>
                  {progressLabel}
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f4f3fb] dark:bg-white/4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${partProgress}%` }}
                  transition={{ type: 'spring', damping: 22, stiffness: 110 }}
                  className="h-full rounded-full bg-rose-500"
                />
              </div>
            </section>

            <section className="hidden grid-cols-[1fr_1fr_auto] border-t border-[#e4e2f0] dark:border-white/[0.07] sm:grid">
              <div className="min-w-0 px-3 py-2.5 sm:px-4 sm:py-3">
                <p className={cn(MICRO, MUTED)}>Time left</p>
                <div
                  className={cn(
                    NUM,
                    'mt-1 flex items-center gap-1.5 text-base font-extrabold sm:text-lg',
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

              <div className="min-w-0 border-l border-[#e4e2f0] px-3 py-2.5 dark:border-white/[0.07] sm:px-4 sm:py-3">
                <p className={cn(MICRO, MUTED)}>{isLongTurn ? 'Task' : 'Question'}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <MessageCircle
                    className="h-3.5 w-3.5 shrink-0 text-rose-500"
                    aria-hidden="true"
                  />
                  <p className="truncate text-sm font-extrabold text-slate-800 dark:text-slate-100 sm:text-base">
                    {questionValue}
                  </p>
                </div>
              </div>

              <div className="flex items-center border-l border-[#e4e2f0] px-2.5 dark:border-white/[0.07] sm:px-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  aria-label={isMuted ? 'Unmute examiner audio' : 'Mute examiner audio'}
                  className="h-10 w-10 rounded-xl border border-[#e4e2f0] bg-[#f4f3fb] text-slate-700 transition-colors hover:bg-[#ebeaf7] dark:border-white/10 dark:bg-white/5.5 dark:text-slate-200 dark:hover:bg-white/9"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </section>
          </div>

          <div className="hidden xl:grid xl:grid-cols-[minmax(16rem,1.4fr)_minmax(8rem,0.7fr)_minmax(11rem,0.9fr)_minmax(7rem,0.6fr)_4.5rem_minmax(7rem,0.6fr)]">
            <section className="col-span-2 flex min-w-0 items-center gap-3 border-b border-[#e4e2f0] px-3.5 py-3 dark:border-white/[0.07] sm:px-4 xl:col-span-1 xl:border-b-0 xl:py-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/9 text-rose-500">
                <Mic2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className={cn(MICRO, 'text-rose-500')}>Speaking practice</p>
                <h1 className={cn(TITLE, 'mt-0.5 truncate text-base')}>IELTS Speaking Session</h1>
                <p className={cn(MUTED, 'truncate text-[11px] font-medium')}>{testTitle}</p>
              </div>
            </section>

            <StatusSection label="Part" className="border-b xl:border-b-0">
              <p className="flex items-baseline gap-1.5 text-slate-800 dark:text-slate-100">
                <span className={cn(NUM, 'text-2xl font-extrabold leading-none text-rose-500')}>
                  {currentPartNumber}
                </span>
                <span className="text-base font-extrabold">of {totalParts}</span>
              </p>
              <p className={cn(MUTED, 'mt-1.5 truncate text-[10px] font-medium')}>
                {currentPart?.title || `Speaking Part ${currentPartNumber}`}
              </p>
            </StatusSection>

            <StatusSection label="Progress" className="border-b xl:border-b-0">
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f4f3fb] dark:bg-white/4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${partProgress}%` }}
                  transition={{ type: 'spring', damping: 22, stiffness: 110 }}
                  className="h-full rounded-full bg-rose-500"
                />
              </div>
              <p className={cn(MUTED, 'mt-2 text-[10px] font-medium')}>
                Part {currentPartNumber} is active
              </p>
            </StatusSection>

            <StatusSection label="Time left">
              <div
                className={cn(
                  NUM,
                  'flex items-center gap-2 text-xl font-extrabold',
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

            <section className="flex items-center justify-center border-l border-[#e4e2f0] px-3 py-4 dark:border-white/[0.07] xl:py-5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                aria-label={isMuted ? 'Unmute examiner audio' : 'Mute examiner audio'}
                className="h-11 w-11 rounded-xl border border-[#e4e2f0] bg-[#f4f3fb] text-slate-700 transition-colors hover:bg-[#ebeaf7] dark:border-white/10 dark:bg-white/5.5 dark:text-slate-200 dark:hover:bg-white/9"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </section>

            <StatusSection label={isLongTurn ? 'Task' : 'Question'}>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-rose-500" aria-hidden="true" />
                <p className="truncate text-base font-extrabold text-slate-800 dark:text-slate-100">
                  {questionValue}
                </p>
              </div>
              <p className={cn(MUTED, 'mt-1.5 text-[10px] font-medium')}>
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

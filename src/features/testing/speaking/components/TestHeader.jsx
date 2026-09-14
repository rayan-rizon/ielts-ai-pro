import React from 'react';
import { ArrowLeft, Clock3, MessageCircle, Mic2, Volume2, VolumeX } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { MICRO, MUTED, NUM, PANEL, TITLE } from '@/features/dashboard/components/primitives';
import {
  TEST_HEADER_BACK,
  TEST_HEADER_BADGE,
} from '@/features/testing/shared/components/testHeaderStyles';
import { cn } from '@/lib/cn';

import { getQuestionLines } from '../utils/speakingTestUtils';

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

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
    isPartComplete,
    onShowExitDialog,
    speakingMode = 'practice',
  }) => {
    const prefersReducedMotion = useReducedMotion();
    const partProgress = totalParts > 0 ? (currentPartNumber / totalParts) * 100 : 0;
    const questionCount = Math.max(getQuestionLines(currentPart?.questions).length, 1);
    const isLongTurn = currentPartNumber === 2;
    const questionValue = isPartComplete
      ? 'Complete'
      : isPart2Prep
        ? 'Preparing'
        : isLongTurn
          ? 'Long turn'
          : `${Math.min(currentQuestionIndex + 1, questionCount)} of ${questionCount}`;
    const progressLabel = `${Math.round(partProgress)}%`;
    const isExam = speakingMode === 'exam';
    const partTitle = currentPart?.title || `Speaking Part ${currentPartNumber}`;
    const partState = isPartComplete
      ? `Part ${currentPartNumber} complete`
      : `Part ${currentPartNumber} of ${totalParts}`;

    return (
      <header className="relative z-40 mb-2">
        <div className={cn(PANEL, 'overflow-hidden rounded-xl')}>
          <div className="flex min-h-12 items-center gap-2 px-2 py-1.5 sm:gap-3 sm:px-3 md:min-h-16 md:gap-3.5 md:px-4 md:py-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowExitDialog}
              aria-label="Back to Speaking"
              className={cn(
                TEST_HEADER_BACK,
                'h-10 w-10 shrink-0 rounded-lg hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:border-rose-400/60 dark:hover:bg-rose-400/12 dark:hover:text-rose-300 md:h-11 md:w-11'
              )}
            >
              <ArrowLeft className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
            </Button>

            <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/9 text-rose-500 sm:flex md:h-10 md:w-10">
              <Mic2 className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className={cn(TITLE, 'truncate text-sm sm:text-[15px] md:text-base')}>
                  <span className="sm:hidden">Speaking test</span>
                  <span className="hidden sm:inline">IELTS Speaking Session</span>
                </h1>
                <span
                  className={cn(
                    TEST_HEADER_BADGE,
                    'hidden shrink-0 min-[430px]:inline-flex',
                    isExam
                      ? 'border-indigo-500/15 bg-indigo-500/6 text-indigo-600 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300'
                      : 'border-rose-500/15 bg-rose-500/6 text-rose-600 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full motion-safe:animate-pulse',
                      isExam ? 'bg-indigo-500' : 'bg-rose-500'
                    )}
                    aria-hidden="true"
                  />
                  {isExam ? 'Exam room' : 'Practice room'}
                </span>
              </div>
              <p
                className={cn(
                  MUTED,
                  'hidden truncate text-[10px] font-medium sm:block sm:text-[11px] md:mt-0.5'
                )}
              >
                {testTitle}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className={cn(MICRO, MUTED, 'hidden sm:block')}>Time left</p>
              <div
                className={cn(
                  NUM,
                  'flex items-center gap-1 text-sm font-extrabold sm:text-base md:mt-0.5',
                  timeLeft < 60 ? 'text-red-500' : 'text-rose-500'
                )}
                aria-label={`${formatTime(timeLeft)} remaining`}
              >
                <Clock3
                  className={cn('h-3.5 w-3.5', timeLeft < 60 && 'motion-safe:animate-pulse')}
                  aria-hidden="true"
                />
                {formatTime(timeLeft)}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? 'Unmute examiner audio' : 'Mute examiner audio'}
              className="h-10 w-10 shrink-0 rounded-lg border border-[#e4e2f0] bg-[#f4f3fb] text-slate-700 transition-colors duration-150 hover:bg-[#ebeaf7] focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/5.5 dark:text-slate-200 dark:hover:bg-white/9 md:h-11 md:w-11"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>

          <div className="flex min-h-9 items-center gap-2 border-t border-[#e4e2f0] px-3 py-1.5 dark:border-white/[0.07] sm:gap-3 md:min-h-11 md:px-4 md:py-2">
            <div className="min-w-0 shrink-0">
              <p className={cn(MICRO, MUTED)}>{partState}</p>
              <p className="max-w-28 truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100 sm:max-w-40 md:text-xs">
                {partTitle}
              </p>
            </div>

            <div className="min-w-12 flex-1" aria-hidden="true">
              <div className="h-1.5 overflow-hidden rounded-full bg-[#f4f3fb] dark:bg-white/4">
                <motion.div
                  initial={false}
                  animate={{ width: `${partProgress}%` }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.35, ease: [0.2, 0, 0, 1] }
                  }
                  className="h-full rounded-full bg-rose-500"
                />
              </div>
            </div>

            <span className={cn(NUM, 'shrink-0 text-[10px] font-bold text-rose-500')}>
              {progressLabel}
            </span>

            <div className="hidden min-w-24 shrink-0 items-center gap-1.5 border-l border-[#e4e2f0] pl-3 dark:border-white/[0.07] sm:flex">
              <MessageCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden="true" />
              <div className="min-w-0">
                <p className={cn(MICRO, MUTED)}>{isLongTurn ? 'Task' : 'Question'}</p>
                <p className="truncate text-xs font-extrabold text-slate-800 dark:text-slate-100">
                  {isPartComplete
                    ? currentPartNumber < totalParts
                      ? `Ready for Part ${currentPartNumber + 1}`
                      : 'Test complete'
                    : questionValue}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }
);

TestHeader.displayName = 'TestHeader';
export default TestHeader;

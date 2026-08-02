import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, CheckCircle, Loader2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Pill } from '@/features/dashboard/components/primitives';
import { ConfirmExitDialog } from '@/shared/ui';
import { motion } from 'framer-motion';

// Isolated Clock Component imported
import ListeningTestClock from './ListeningTest/components/ListeningTestClock';
import TestModeHeaderControl from '@/features/testing/shared/components/TestModeHeaderControl';
import {
  TEST_HEADER_AUTOSAVE,
  TEST_HEADER_BADGE,
  TEST_HEADER_BACK,
  TEST_HEADER_META,
  TEST_HEADER_PRIMARY_ACTION,
  TEST_HEADER_PROGRESS_FILL,
  TEST_HEADER_PROGRESS_TRACK,
  TEST_HEADER_SHELL,
  TEST_HEADER_TOOL,
  TEST_HEADER_TOOL_ACTIVE,
  TEST_HEADER_TOOL_GROUP,
} from '@/features/testing/shared/components/testHeaderStyles';

const ListeningTestHeader = ({
  testData,
  activePart,
  displaySections = [],
  answers: _answers,
  // timeRemaining, // Removed to prevent re-renders
  showExitDialog,
  setShowExitDialog,
  onExit,
  onContinue,
  formatTime: _formatTime,
  totalQuestions,
  stats = {},
  isFinished = false,
  isSaving,
  lastSaved,
  showAnswerSheet,
  setShowAnswerSheet,
  onSubmit,
  isSubmitting,
  onViewResults,
  onNextPart,
  testMode = 'practice',
  examReview = false,
  isAwaitingStart = false,
  selectedMode = 'practice',
  onModeChange,
  examEligibility = { eligible: true, reason: '' },
  onStart,
  isStarting = false,
}) => {
  const maxQuestions = (stats && (stats.totalQuestions || stats.totalQ)) || totalQuestions || 40;
  const solvedCount = (stats && (stats.totalAnswered ?? stats.totalAns)) ?? 0;
  const progressPercentage =
    maxQuestions > 0 && !isNaN(solvedCount)
      ? Math.min(100, Math.max(0, Math.round((solvedCount / maxQuestions) * 100)))
      : 0;

  const isLastPart = activePart === displaySections.length - 1;

  return (
    <motion.div
      layout
      className="sticky top-0 z-50 w-full px-2 py-0.5 sm:px-3 sm:py-1"
      data-oid="ao4wuv7"
    >
      <div
        className={cn(
          TEST_HEADER_SHELL,
          'flex items-center justify-between px-2.5 py-1 sm:px-3.5 sm:py-1.5'
        )}
        data-oid="btq_4pq"
      >
        <div className="flex items-center gap-2 shrink-0" data-oid="246o-4l">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!isFinished && solvedCount > 0) {
                setShowExitDialog(true);
              } else {
                onExit();
              }
            }}
            className={TEST_HEADER_BACK}
            data-oid="g_mhami"
          >
            <ArrowLeft
              className="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:-translate-x-0.5 stroke-[2.5]"
              data-oid="23xs5x9"
            />
          </Button>

          <ConfirmExitDialog
            open={showExitDialog}
            onOpenChange={setShowExitDialog}
            onConfirm={onExit}
            onCancel={onContinue}
            title="Exit Test?"
            description="Your progress will be saved, but the timer will continue running if you return later."
          />

          <div className="flex items-center gap-2 sm:gap-3" data-oid=".:xhcj4">
            {/* Title & Badge */}
            <div
              className="flex flex-col min-w-0 max-w-[160px] min-[480px]:max-w-[220px] sm:max-w-[320px] md:max-w-[420px] lg:max-w-[550px]"
              data-oid="uszsrof"
            >
              <h1
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate"
                title={testData?.title || 'Listening Test'}
                data-oid="7gdzwo7"
              >
                {testData?.title || 'Listening Test'}
              </h1>
              <div className={TEST_HEADER_META} data-oid="mhh.zk2">
                <span className="opacity-80 dark:opacity-70 truncate" data-oid="0wm6-is">
                  Part {activePart + 1}/{displaySections.length}
                </span>
                {testData?.is_official_cambridge && (
                  <span
                    className={cn(
                      TEST_HEADER_BADGE,
                      'border-amber-500/25 bg-amber-500/[0.08] text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/[0.14] dark:text-amber-300 sm:text-[9px]'
                    )}
                    data-oid="i8fhv98"
                  >
                    <ShieldCheck className="w-2.5 h-2.5 sm:w-3 h-3" data-oid="f3411fp" /> Official
                  </span>
                )}
                {!isAwaitingStart ? (
                  <Pill
                    tone={testMode === 'exam' ? 'accent' : 'neutral'}
                    className="h-4 rounded-md px-1.5 py-0 text-[8px] leading-none tracking-[0.08em] dark:bg-white/[0.055]"
                  >
                    {testMode === 'exam' ? 'Exam Mode' : 'Practice Mode'}
                  </Pill>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Center - Progress */}
        <div
          className="hidden lg:flex flex-col items-center flex-1 px-4 min-w-0"
          data-oid="asosz8j"
        >
          {/* Segmented Progress Bar */}
          <div className="flex w-full max-w-[320px] gap-1.5" data-oid=".qrp4:2">
            {(stats?.results || []).map((result, index) => {
              const partTotal = result.totalQuestions ?? result.sQCount ?? 0;
              const partAnswered = result.answeredQuestions ?? result.sAnswered ?? 0;
              const pct = partTotal > 0 ? Math.round((partAnswered / partTotal) * 100) : 0;
              const cappedPct = Math.min(pct, 100);
              const partIndex = result.sectionIndex ?? result.idx ?? index;
              return (
                <div key={`part-${index}`} className="flex-1 group relative" data-oid="2u66tdr">
                  <div className={cn(TEST_HEADER_PROGRESS_TRACK, 'relative')} data-oid="rb5.1oh">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cappedPct}%` }}
                      className={cn(TEST_HEADER_PROGRESS_FILL, 'relative overflow-hidden')}
                      data-oid="tz_f3fi"
                    >
                      <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        data-oid="g-j3-73"
                      />
                    </motion.div>
                  </div>
                  {/* Tooltip */}
                  <div
                    className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-slate-500 whitespace-nowrap bg-white dark:bg-[#131315] border border-slate-200 dark:border-white/[0.1] px-2 py-1 rounded shadow-sm z-10"
                    data-oid="ic4_:7-"
                  >
                    Part {partIndex + 1}: {partAnswered}/{partTotal}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="flex justify-between w-full max-w-[320px] mt-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
            data-oid=":3duluf"
          >
            <span data-oid="0j16_9l">Progress</span>
            <span className="text-slate-600 dark:text-slate-300" data-oid="35y3rxz">
              {progressPercentage}% ({solvedCount}/{maxQuestions})
            </span>
          </div>
        </div>

        {/* Right - Tools & Timer */}
        <div className="flex items-center gap-4 shrink-0" data-oid="z8e.ssh">
          {isAwaitingStart ? (
            <TestModeHeaderControl
              selectedMode={selectedMode}
              onModeChange={onModeChange}
              examEligibility={examEligibility}
              onStart={onStart}
              isStarting={isStarting}
              isAwaitingStart={isAwaitingStart}
            />
          ) : (
            <>
              {/* Autosave Indicator */}
              {/* Auto-save Status */}
              <div className={TEST_HEADER_AUTOSAVE} data-oid="via037s">
                {isSaving ? (
                  <Loader2 className="w-3 h-3 text-[#5a63df] animate-spin" data-oid="vjxneul" />
                ) : (
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${lastSaved ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-600'}`}
                    data-oid="4e:-yhv"
                  />
                )}
                <span
                  className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap"
                  data-oid="0z8bsbi"
                >
                  {isSaving ? 'Saving' : lastSaved ? 'Saved' : 'Ready'}
                </span>
              </div>

              <div className={TEST_HEADER_TOOL_GROUP} data-oid="hu9uhtj">
                <Button
                  id="answer-sheet-toggle"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnswerSheet(!showAnswerSheet)}
                  className={cn(
                    TEST_HEADER_TOOL,
                    showAnswerSheet
                      ? TEST_HEADER_TOOL_ACTIVE
                      : 'hover:bg-[#5a63df]/10 hover:text-[#5a63df] dark:hover:bg-[#8f97ff]/[0.14] dark:hover:text-[#afb5ff]'
                  )}
                  data-oid="6kj0gdx"
                >
                  <ClipboardList className="w-3.5 h-3.5" data-oid="--en1qn" />
                  <span className="hidden sm:inline" data-oid="6iz6l-i">
                    Sheet
                  </span>
                </Button>
              </div>

              <div className="hidden sm:block" data-oid="header-timer">
                {/* Timer Component - Isolated */}
                <ListeningTestClock data-oid="0gu6fwl" />
              </div>

              {/* Action Button: Next, Finish or View Results */}
              <div className="flex items-center gap-2" data-oid="header-actions">
                {!isFinished && testMode === 'exam' && !examReview ? null : !isFinished &&
                  testMode === 'exam' &&
                  examReview ? (
                  <Button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className={cn(
                      TEST_HEADER_PRIMARY_ACTION,
                      'bg-[#5a63df] text-white hover:bg-[#4f58d2]'
                    )}
                  >
                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Finish review'}
                  </Button>
                ) : !isFinished ? (
                  !isLastPart ? (
                    <Button
                      onClick={onNextPart}
                      className={cn(
                        TEST_HEADER_PRIMARY_ACTION,
                        'bg-[#5a63df] text-white hover:bg-[#4f58d2]'
                      )}
                      data-oid="y5kko0z"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={onSubmit}
                      disabled={isSubmitting}
                      className={cn(
                        TEST_HEADER_PRIMARY_ACTION,
                        'bg-[#5a63df] text-white hover:bg-[#4f58d2]'
                      )}
                      data-oid="848h706"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3 h-3 animate-spin" data-oid="w-1hd1o" />
                      ) : (
                        'Finish'
                      )}
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={onViewResults}
                    className={cn(
                      TEST_HEADER_PRIMARY_ACTION,
                      'flex items-center gap-1.5 border-0 bg-[#5a63df] text-white hover:bg-[#4f58d2] sm:gap-2'
                    )}
                    data-oid="5snr9gv"
                  >
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 h-4" data-oid="rmlelv3" />
                    <span
                      className="uppercase tracking-wide text-[10px] sm:text-xs"
                      data-oid="h0ii41y"
                    >
                      Results
                    </span>
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ListeningTestHeader;

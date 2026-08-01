import React from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  Loader2,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Pill } from '@/features/dashboard/components/primitives';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { motion } from 'framer-motion';

// Isolated Clock Component imported
import ListeningTestClock from './ListeningTest/components/ListeningTestClock';
import TestModeHeaderControl from '@/features/testing/shared/components/TestModeHeaderControl';

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
        className="w-full rounded-2xl flex items-center justify-between py-1 px-2.5 sm:py-1.5 sm:px-3.5 border border-[#e4e2f0] dark:border-white/[0.07] bg-white/85 dark:bg-[#131315]/95 backdrop-blur-md shadow-sm dark:shadow-none transition-all duration-300"
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
            className="group relative flex h-9 w-9 sm:h-9.5 sm:w-9.5 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:border-[#5a63df] hover:bg-[#eef0fd] hover:text-[#5a63df] active:scale-95 dark:border-white/20 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-400/60 dark:hover:bg-slate-700 dark:hover:text-indigo-300 p-0"
            data-oid="g_mhami"
          >
            <ArrowLeft
              className="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:-translate-x-0.5 stroke-[2.5]"
              data-oid="23xs5x9"
            />
          </Button>

          <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog} data-oid="dycq7pd">
            <AlertDialogContent data-oid="g.5v_d6">
              <AlertDialogHeader data-oid="hhfcvdm">
                <AlertDialogTitle
                  className="flex items-center justify-center sm:justify-start gap-2 text-xl"
                  data-oid="q9f5vy:"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-500" data-oid="n.0oj9v" />
                  Exit Test?
                </AlertDialogTitle>
                <AlertDialogDescription
                  className="text-sm text-slate-500 dark:text-slate-400"
                  data-oid="dzl96dq"
                >
                  Your progress will be saved, but the timer will continue running if you return
                  later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2" data-oid="filfr6k">
                <AlertDialogCancel
                  onClick={onContinue}
                  className="w-full sm:w-auto rounded-xl border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-all duration-200 px-6 font-semibold"
                  data-oid="8n7gz33"
                >
                  Continue Test
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onExit}
                  className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20 border-none px-8 rounded-xl hover:scale-105 active:scale-95 transition-all duration-200 font-bold"
                  data-oid="ebadsvb"
                >
                  Exit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
              <div
                className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium"
                data-oid="mhh.zk2"
              >
                <span className="opacity-80 dark:opacity-70 truncate" data-oid="0wm6-is">
                  Part {activePart + 1}/{displaySections.length}
                </span>
                {testData?.is_official_cambridge && (
                  <span
                    className="inline-flex items-center gap-1 px-1 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide shrink-0"
                    data-oid="i8fhv98"
                  >
                    <ShieldCheck className="w-2.5 h-2.5 sm:w-3 h-3" data-oid="f3411fp" /> Official
                  </span>
                )}
                {!isAwaitingStart ? (
                  <Pill tone={testMode === 'exam' ? 'accent' : 'neutral'}>
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
                  <div
                    className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden relative border border-black/5 dark:border-white/5"
                    data-oid="rb5.1oh"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cappedPct}%` }}
                      className="h-full bg-[#5a63df] rounded-full relative overflow-hidden"
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
              <div
                className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5"
                data-oid="via037s"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 text-[#5a63df] animate-spin" data-oid="vjxneul" />
                ) : (
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${lastSaved ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-600'}`}
                    data-oid="4e:-yhv"
                  />
                )}
                <span
                  className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap"
                  data-oid="0z8bsbi"
                >
                  {isSaving ? 'Saving' : lastSaved ? 'Saved' : 'Ready'}
                </span>
              </div>

              <div
                className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 backdrop-blur-md p-1 rounded-full border border-slate-200/80 dark:border-white/10 shadow-xs"
                data-oid="hu9uhtj"
              >
                <Button
                  id="answer-sheet-toggle"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnswerSheet(!showAnswerSheet)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 sm:px-3 py-1 h-7.5 rounded-full transition-all duration-200 font-bold text-[9.5px] sm:text-[10px] uppercase tracking-wider select-none hover:scale-105 active:scale-95',
                    showAnswerSheet
                      ? 'bg-[#5a63df] text-white hover:bg-[#4a52c9] hover:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-[#5a63df]/10 hover:text-[#5a63df] dark:hover:bg-[#5a63df]/20 dark:hover:text-[#a9afff]'
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
                    className="h-9 rounded-xl bg-[#5a63df] px-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#4a52c9]"
                  >
                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Finish review'}
                  </Button>
                ) : !isFinished ? (
                  !isLastPart ? (
                    <Button
                      onClick={onNextPart}
                      className="bg-slate-900 dark:bg-[#5a63df] text-white hover:bg-slate-800 dark:hover:bg-[#4a52c9] font-black rounded-xl px-4 sm:px-6 h-9 sm:h-10 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap text-[10px] sm:text-xs uppercase tracking-widest"
                      data-oid="y5kko0z"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={onSubmit}
                      disabled={isSubmitting}
                      className="bg-slate-900 dark:bg-[#5a63df] text-white hover:bg-slate-800 dark:hover:bg-[#4a52c9] font-black rounded-xl px-4 sm:px-6 h-9 sm:h-10 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap text-[10px] sm:text-xs uppercase tracking-widest"
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
                    className="bg-[#5a63df] hover:bg-[#4a52c9] text-white font-bold px-3 sm:px-4 h-9 sm:h-10 rounded-xl border-none transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5 sm:gap-2"
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

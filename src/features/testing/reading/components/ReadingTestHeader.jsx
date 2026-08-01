import React from 'react';
import { Button } from '@/components/ui/button';
import { Pill } from '@/features/dashboard/components/primitives';
import {
  ArrowLeft,
  AlertTriangle,
  Eye,
  EyeOff,
  FileText,
  ClipboardList,
  ShieldCheck,
  Clock,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
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
import { getQuestionCount } from '@/lib/utils';
import { useReadingTestTimer } from './ReadingTest/context/ReadingTestContext';
import PacingIndicator from './ReadingTest/components/PacingIndicator';
import TestModeHeaderControl from '@/features/testing/shared/components/TestModeHeaderControl';

const ReadingTestHeader = ({
  testData,
  currentPassageIndex,
  answers,
  _timeRemaining,
  showExitDialog,
  setShowExitDialog,
  highlightedAnswerQs,
  setHighlightedAnswerQs,
  showNotes,
  setShowNotes,
  showAnswerSheet,
  setShowAnswerSheet,
  notes,
  onExit,
  onContinue,
  formatTime,
  totalQuestions,
  allQuestions = [],
  isFinished = false,
  isSaving,
  lastSaved,
  _theme,
  // Pacing Assistant props
  passageTimes = {},
  totalDurationSeconds = 3600,
  testMode = 'practice',
  isAwaitingStart = false,
  selectedMode = 'practice',
  onModeChange,
  examEligibility = { eligible: true, reason: '' },
  onStart,
  isStarting = false,
}) => {
  // Calculate progress and stats per section
  const stats = React.useMemo(() => {
    const sections = testData?.sections || testData?.passages || [];
    let totalQ = 0;
    let totalAns = 0;

    const results = sections.map((section, idx) => {
      const sectionNum = section.section_number || idx + 1;
      const sectionQuestions = allQuestions.filter((q) => {
        if (q.section) return parseInt(q.section) === parseInt(sectionNum);
        if (q.passageIndex !== undefined) return q.passageIndex === idx;
        if (sections.length === 1) return true;
        return false;
      });

      const countQs = (qs) => {
        let count = 0;
        qs.forEach((q) => {
          count += getQuestionCount(q);
        });
        return count;
      };

      const checkAnswered = (qs) => {
        let answeredValue = 0;
        qs.forEach((q) => {
          const type = q.type;

          if (type === 'multiple_choice' && q.allow_multiple) {
            const ans = answers[q.id];
            if (Array.isArray(ans)) answeredValue += ans.length;
            else if (ans) answeredValue++;
          } else if (type === 'matching_headings') {
            const prefix = `${q.id}_`;
            answeredValue += Object.keys(answers).filter(
              (k) => k.startsWith(prefix) && k !== `${q.id}_` && answers[k]
            ).length;
          } else if (type === 'matching_features') {
            const matchingAnswers = Object.keys(answers).filter(
              (k) => k === q.id || k.startsWith(`${q.id}_`) || k.startsWith(`mf_${q.id}`)
            );
            answeredValue += matchingAnswers.filter((k) => answers[k]?.toString().trim()).length;
          } else if (type === 'matching') {
            const matchingAnswers = Object.keys(answers).filter(
              (k) => k === q.id || k.startsWith(`${q.id}_`)
            );
            answeredValue += matchingAnswers.filter((k) => answers[k]?.toString().trim()).length;
          } else if (
            type === 'table_completion' ||
            type === 'summary_completion' ||
            type === 'note_completion' ||
            type === 'notes_completion' ||
            type === 'gap_fill' ||
            type === 'sentence_completion' ||
            type === 'short_answer' ||
            type === 'flowchart' ||
            type === 'flow_chart_completion' ||
            type === 'diagram_completion' ||
            type === 'diagram_label_completion' ||
            type === 'map_labeling'
          ) {
            let countForQ = 0;
            const prefix = `${q.id}_`;

            // 1. Prefixed matches (e.g. q.id_gap_15, q.id_0, q.id_r0_c1)
            const prefixedKeys = Object.keys(answers).filter(
              (k) => (k === q.id || k.startsWith(prefix)) && answers[k]?.toString().trim()
            );
            countForQ = prefixedKeys.length;

            // 2. Exact ID match if no prefixed keys found
            if (countForQ === 0 && answers[q.id]?.toString().trim()) {
              countForQ = 1;
            }

            // 3. Flowchart specific step gap numbers
            if (q.flowchart?.steps) {
              let fGapIndex = 0;
              let gapCount = 0;
              q.flowchart.steps.forEach((step) => {
                const parts = (step.text || '').split('[gap]');
                const gCount = Math.max(parts.length - 1, 0);
                for (let i = 0; i < gCount; i++) {
                  const gNum = step.gap_numbers?.[i] ?? Number(q.question_number || 1) + fGapIndex;
                  const keys = [
                    `${q.id}_gap_${gNum}`,
                    `gap_${gNum}`,
                    `${q.id}_${gNum}`,
                    String(gNum),
                    `${q.id}_${fGapIndex}`,
                  ];
                  if (keys.some((k) => answers[k]?.toString().trim())) {
                    gapCount++;
                  }
                  fGapIndex++;
                }
              });
              countForQ = Math.max(countForQ, gapCount);
            }

            const totalQs = getQuestionCount(q);
            answeredValue += Math.min(countForQ, totalQs || 1);
          } else {
            // Default for single answer questions (Standard MCQ, etc.)
            if (answers[q.id]?.toString().trim()) answeredValue++;
          }
        });
        return answeredValue;
      };

      const sQCount = countQs(sectionQuestions);
      const sAnswered = checkAnswered(sectionQuestions);

      totalQ += sQCount;
      totalAns += sAnswered;

      return { idx, sQCount, sAnswered };
    });

    return { totalQ, totalAns, results };
  }, [testData, allQuestions, answers]);

  const maxQuestions = stats.totalQ > 0 ? stats.totalQ : totalQuestions || 40;
  const solvedCount = stats.totalQ > 0 ? stats.totalAns : Object.keys(answers).length;
  const progressPercentage = Math.round((solvedCount / maxQuestions) * 100);

  return (
    <motion.div
      layout
      className="sticky top-0 z-50 w-full px-2 py-0.5 sm:px-3 sm:py-1"
      data-oid="lp5gz86"
    >
      <div
        className="w-full rounded-2xl flex items-center justify-between py-1 px-2.5 sm:py-1.5 sm:px-3.5 border border-[#e4e2f0] dark:border-white/[0.07] bg-white/85 dark:bg-[#141319]/95 backdrop-blur-md shadow-sm dark:shadow-none transition-all duration-300"
        data-oid="1i74cg9"
      >
        <div className="flex items-center gap-2 sm:gap-3 shrink-0" data-oid="8kvko2h">
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
            className="group relative flex h-9 w-9 sm:h-9.5 sm:w-9.5 shrink-0 items-center justify-center rounded-xl border border-[#e4e2f0] bg-gradient-to-r from-white to-[#faf9ff] text-slate-700 shadow-2xs transition-all duration-200 hover:border-[#5a63df] hover:text-[#5a63df] hover:shadow-xs active:scale-95 dark:border-white/10 dark:from-white/10 dark:to-white/5 dark:text-slate-200 dark:hover:border-[#a9afff] dark:hover:text-[#a9afff] p-0"
            data-oid="ibxe.t4"
          >
            <ArrowLeft
              className="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:-translate-x-0.5 stroke-[2.5]"
              data-oid="xwqe86n"
            />
          </Button>

          <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog} data-oid="36i5njv">
            <AlertDialogContent data-oid="508da:y">
              <AlertDialogHeader data-oid="75gq-4t">
                <AlertDialogTitle
                  className="flex items-center justify-center sm:justify-start gap-2 text-xl"
                  data-oid="3totvev"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-500" data-oid="vkcjw9a" />
                  Exit Test?
                </AlertDialogTitle>
                <AlertDialogDescription
                  className="text-sm text-slate-500 dark:text-slate-400"
                  data-oid="loyx8xz"
                >
                  Your progress will be saved. You can resume this test later from the Reading
                  Library.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2" data-oid="8ioe-lt">
                <AlertDialogCancel
                  onClick={onContinue}
                  className="w-full sm:w-auto rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 px-6 font-semibold"
                  data-oid="53rqx6l"
                >
                  Continue Test
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onExit}
                  className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20 border-none px-8 rounded-xl hover:scale-105 active:scale-95 transition-all duration-200 font-bold"
                  data-oid=".7fk5nn"
                >
                  Exit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex items-center gap-2 sm:gap-3" data-oid="crpg:ah">
            {/* Title & Badge */}
            <div
              className="flex flex-col min-w-0 max-w-[160px] min-[480px]:max-w-[220px] sm:max-w-[320px] md:max-w-[420px] lg:max-w-[550px]"
              data-oid="q6130ue"
            >
              <h1
                className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate"
                title={testData?.title || 'Reading Test'}
                data-oid="t0pxl2l"
              >
                {testData?.title || 'Reading Test'}
              </h1>
              <div
                className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium"
                data-oid="mhknypx"
              >
                <span
                  className="opacity-80 dark:opacity-70 text-[9px] sm:text-xs whitespace-nowrap"
                  data-oid="bnopijl"
                >
                  Passage {currentPassageIndex + 1}
                </span>
                {testData?.is_official_cambridge && (
                  <span
                    className="inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 text-[8px] sm:text-[10px] font-bold uppercase tracking-wide"
                    data-oid="x5luvaj"
                  >
                    <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" data-oid="39x-2_2" />{' '}
                    <span className="hidden sm:inline">Official</span>
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
          data-oid="a1mffq:"
        >
          {/* Segmented Progress Bar */}
          <div className="flex w-full max-w-[320px] gap-1.5" data-oid="_7:k-wn">
            {(() => {
              const sections = testData?.sections || testData?.passages || [];
              if (sections.length === 0) {
                return (
                  <div
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative"
                    data-oid="icn7l9c"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      className="absolute top-0 left-0 h-full bg-[#5a63df] rounded-full"
                      data-oid="1.xgg-m"
                    />
                  </div>
                );
              }

              return stats.results.map((result) => {
                const pct =
                  result.sQCount > 0 ? Math.round((result.sAnswered / result.sQCount) * 100) : 0;
                const cappedPct = Math.min(pct, 100);

                return (
                  <div key={result.idx} className="flex-1 group relative" data-oid="if7889p">
                    <div
                      className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden"
                      data-oid="pen735_"
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cappedPct}%` }}
                        className="h-full bg-[#5a63df] rounded-full"
                        data-oid=".py.anb"
                      />
                    </div>
                    {/* Tooltip */}
                    <div
                      className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-slate-500 whitespace-nowrap bg-white dark:bg-[#141319] border border-slate-200 dark:border-white/[0.1] px-2 py-1 rounded shadow-sm z-10 pointer-events-none"
                      data-oid="b0s:ryj"
                    >
                      Passage {result.idx + 1}: {result.sAnswered}/{result.sQCount}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          <div
            className="flex justify-between w-full max-w-[320px] mt-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
            data-oid="ok25f5k"
          >
            <span data-oid="qyewobm">Progress</span>
            <span className="text-slate-600 dark:text-slate-300" data-oid="dh1mw06">
              {progressPercentage}% ({solvedCount}/{maxQuestions})
            </span>
          </div>

          {/* Pacing Assistant */}
          {testMode !== 'exam' &&
            !isFinished &&
            (testData?.sections || testData?.passages || []).length > 0 && (
              <PacingIndicator
                sections={testData?.sections || testData?.passages || []}
                passageTimes={passageTimes}
                currentPassageIndex={currentPassageIndex}
                totalDurationSeconds={totalDurationSeconds}
                isFinished={isFinished}
              />
            )}
        </div>

        {/* Right - Tools & Timer */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0" data-oid="u4rksz4">
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
              <div
                className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5"
                data-oid="jev398y"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 text-[#5a63df] animate-spin" data-oid="4osmwi5" />
                ) : (
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${lastSaved ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-600'}`}
                    data-oid="lcjcowv"
                  />
                )}
                <span
                  className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap"
                  data-oid="yf9fje:"
                >
                  {isSaving ? 'Saving' : lastSaved ? 'Saved' : 'Ready'}
                </span>
              </div>
              <div
                className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 backdrop-blur-md p-1 rounded-full border border-slate-200/80 dark:border-white/10 shadow-xs"
                data-oid="zjhsbll"
              >
                {/* Answer Toggle */}
                {testMode !== 'exam' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (highlightedAnswerQs === 'all') {
                        setHighlightedAnswerQs(null);
                      } else {
                        setHighlightedAnswerQs('all');
                      }
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 sm:px-3 py-1 h-7.5 rounded-full transition-all duration-200 font-bold text-[9.5px] sm:text-[10px] uppercase tracking-wider select-none hover:scale-105 active:scale-95',
                      highlightedAnswerQs === 'all'
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-300'
                    )}
                    title="Toggle Correct Answers"
                    data-oid="k97.pn1"
                  >
                    {highlightedAnswerQs === 'all' ? (
                      <Eye className="w-3.5 h-3.5 text-white" data-oid="ypy0d4u" />
                    ) : (
                      <EyeOff
                        className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"
                        data-oid="d5k8phi"
                      />
                    )}
                    <span className="hidden sm:inline" data-oid="7k2l_no">
                      Answers
                    </span>
                  </Button>
                ) : null}

                {/* Notes Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const next = !showNotes;
                    setShowNotes(next);
                    if (next) setShowAnswerSheet(false);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 sm:px-3 py-1 h-7.5 rounded-full transition-all duration-200 font-bold text-[9.5px] sm:text-[10px] uppercase tracking-wider select-none hover:scale-105 active:scale-95',
                    showNotes
                      ? 'bg-amber-500 text-white hover:bg-amber-600 hover:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:bg-amber-500/20 dark:hover:text-amber-300'
                  )}
                  data-oid="yq1l6l7"
                >
                  <FileText className="w-3.5 h-3.5" data-oid="zeeo244" />
                  <span className="hidden sm:inline" data-oid="m57ejgq">
                    Notes
                  </span>
                  {notes.length > 0 && (
                    <span
                      className={cn(
                        'flex items-center justify-center px-1.5 py-0.2 rounded-full text-[8.5px] font-black min-w-[15px] text-center ml-0.5 transition-colors',
                        showNotes
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      )}
                      data-oid="_vhiwyg"
                    >
                      {notes.length}
                    </span>
                  )}
                </Button>

                {/* Answer Sheet Toggle */}
                <Button
                  id="reading-answer-sheet-toggle"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const next = !showAnswerSheet;
                    setShowAnswerSheet(next);
                    if (next) setShowNotes(false);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 sm:px-3 py-1 h-7.5 rounded-full transition-all duration-200 font-bold text-[9.5px] sm:text-[10px] uppercase tracking-wider select-none hover:scale-105 active:scale-95',
                    showAnswerSheet
                      ? 'bg-[#5a63df] text-white hover:bg-[#4a52c9] hover:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-[#5a63df]/10 hover:text-[#5a63df] dark:hover:bg-[#5a63df]/20 dark:hover:text-[#a9afff]'
                  )}
                  data-oid="_55gaum"
                >
                  <ClipboardList className="w-3.5 h-3.5" data-oid="bkg0zap" />
                  <span className="hidden sm:inline" data-oid="5pb-kgo">
                    Sheet
                  </span>
                </Button>
              </div>
              {/* Timer Component - Extracted for Performance */}
              <ReadingTestClock formatTime={formatTime} data-oid="ei063wj" />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Isolated Clock Component that consumes the high-frequency timer context
const ReadingTestClock = ({ formatTime }) => {
  const timeRemaining = useReadingTestTimer();

  return (
    <motion.div
      animate={timeRemaining < 300 ? { scale: [1, 1.02, 1] } : {}}
      transition={timeRemaining < 300 ? { repeat: Infinity, duration: 1, ease: 'easeInOut' } : {}}
      className={`flex items-center gap-1 sm:gap-2 px-1.5 py-1 sm:px-3 sm:py-2 rounded-xl border shadow-sm transition-all duration-300 ${
        timeRemaining < 300
          ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
      data-oid="kg5lrzg"
    >
      <Clock
        className={`w-3.5 h-3.5 ${timeRemaining < 300 ? 'text-rose-500' : 'text-slate-400'}`}
        data-oid="nc9lz.n"
      />

      <span
        className={`text-xs font-black tabular-nums ${timeRemaining < 300 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}
        data-oid="6hk45y2"
      >
        {formatTime(timeRemaining)}
      </span>
    </motion.div>
  );
};

export default ReadingTestHeader;

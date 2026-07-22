import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

// Helper to determine status based on response properties
const determineStatusFromResponse = (resp) => {
  if (!resp) return null;
  if (resp.isCorrect === true) return 'correct';
  if (resp.isCorrect === false) {
    return !resp.userAnswer || resp.isSkipped ? 'skipped' : 'wrong';
  }
  return 'skipped';
};

// Helper to determine question status cleanly
const getQuestionStatus = (qNum, testResults) => {
  const r = Array.isArray(testResults?.userResponses)
    ? testResults.userResponses.find((resp) => resp && String(resp.questionNumber) === String(qNum))
    : null;

  const userStatus = determineStatusFromResponse(r);
  if (userStatus) return userStatus;

  // Reading stores grouped answers as `correctAnswersMap`; Listening keeps its
  // per-question data in `answersMap`. Both formats expose the same fields.
  const map = testResults?.correctAnswersMap || testResults?.answersMap;
  if (map) {
    const entry = Object.values(map).find((v) => v && String(v.questionNumber) === String(qNum));
    const mapStatus = determineStatusFromResponse(entry);
    if (mapStatus) return mapStatus;
  }

  return 'wrong'; // Default for unanswered test questions in IELTS result modal
};

export const AnswerKeySection = React.memo(
  ({ testResults, onNavigateToQuestion, onReviewAnswers }) => {
    const [filterTab, setFilterTab] = useState('all'); // 'all' | 'wrong' | 'skipped'

    const totalQuestions = testResults?.totalQuestions || 40;
    // Build question list with status
    const allQuestions = React.useMemo(() => {
      return Array.from({ length: totalQuestions }).map((_, i) => {
        const qNum = i + 1;
        const status = getQuestionStatus(qNum, testResults);
        return { qNum, status };
      });
    }, [totalQuestions, testResults]);

    const statusCounts = React.useMemo(
      () =>
        allQuestions.reduce(
          (counts, question) => ({ ...counts, [question.status]: counts[question.status] + 1 }),
          { correct: 0, wrong: 0, skipped: 0 }
        ),
      [allQuestions]
    );

    // Filter questions based on active tab
    const filteredQuestions = React.useMemo(() => {
      if (filterTab === 'wrong') return allQuestions.filter((q) => q.status === 'wrong');
      if (filterTab === 'skipped') return allQuestions.filter((q) => q.status === 'skipped');
      return allQuestions;
    }, [allQuestions, filterTab]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-blue-200/80 dark:border-slate-800 shadow-sm space-y-3 h-full flex flex-col justify-between"
      >
        {/* Header & Filter Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Review Your Answers</h3>

          {/* Filter Tab Pills */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setFilterTab('all')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                filterTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              All ({totalQuestions})
            </button>
            <button
              onClick={() => setFilterTab('wrong')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                filterTab === 'wrong'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              Incorrect ({statusCounts.wrong})
            </button>
            <button
              onClick={() => setFilterTab('skipped')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                filterTab === 'skipped'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              Skipped ({statusCounts.skipped})
            </button>
          </div>
        </div>

        {/* Matrix Grid of Question Numbers */}
        <div className="flex-1 min-h-[112px] flex flex-col justify-center">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 font-medium">
              No questions match this filter.
            </div>
          ) : (
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5 sm:gap-2">
              {filteredQuestions.map(({ qNum, status }) => (
                <button
                  key={qNum}
                  onClick={() => {
                    if (onNavigateToQuestion) {
                      onNavigateToQuestion(qNum);
                    } else {
                      onReviewAnswers?.();
                    }
                  }}
                  className={cn(
                    'h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all border',
                    'active:scale-95 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                    status === 'correct'
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100'
                      : status === 'wrong'
                        ? 'bg-rose-50/90 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60 hover:bg-rose-100'
                        : status === 'skipped'
                          ? 'bg-amber-50/90 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 border-slate-200/60 dark:border-slate-700/60'
                  )}
                >
                  {qNum}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Dots Legend */}
        <div className="flex flex-wrap items-center justify-center gap-5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Correct
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Incorrect
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Skipped
            </span>
          </div>
        </div>
      </motion.div>
    );
  }
);

AnswerKeySection.displayName = 'AnswerKeySection';
export default AnswerKeySection;

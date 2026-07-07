import React from 'react';
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
  const r = Array.isArray(testResults.userResponses)
    ? testResults.userResponses.find((resp) => resp && String(resp.questionNumber) === String(qNum))
    : null;

  const userStatus = determineStatusFromResponse(r);
  if (userStatus) return userStatus;

  const map = testResults.correctAnswersMap;
  if (map) {
    const entry = Object.values(map).find((v) => v && String(v.questionNumber) === String(qNum));
    const mapStatus = determineStatusFromResponse(entry);
    if (mapStatus) return mapStatus;
  }

  return 'unknown';
};

export const AnswerKeySection = React.memo(
  ({ testResults, onNavigateToQuestion, onReviewAnswers }) => (
    <div
      className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm"
      data-oid="db9w373"
    >
      <h3
        className="text-sm font-black text-slate-900 dark:text-white mb-4 tracking-wide"
        data-oid="1v-y731"
      >
        Quick Answer Key
      </h3>
      <p className="text-xs text-slate-500 mb-4 font-medium" data-oid="ttj3-q5">
        Click any question number to review details.
      </p>

      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2" data-oid="3qwz.ci">
        {Array.from({ length: testResults.totalQuestions }).map((_, i) => {
          const qNum = i + 1;
          const status = getQuestionStatus(qNum, testResults);

          return (
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
                'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all hover:scale-105 shadow-sm border',
                status === 'correct'
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : status === 'wrong'
                    ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                    : status === 'skipped'
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 border-amber-100 dark:border-amber-900/50'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'
              )}
              data-oid="jhyw645"
            >
              {qNum}
            </button>
          );
        })}
      </div>

      <div
        className="flex flex-wrap justify-center gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800"
        data-oid="udnsg_i"
      >
        <div className="flex items-center gap-2" data-oid="fn5rigp">
          <div className="w-3 h-3 rounded-full bg-emerald-500" data-oid="00zy5g2" />
          <span className="text-xs font-bold text-slate-500" data-oid="blxm8aw">
            Correct
          </span>
        </div>
        <div className="flex items-center gap-2" data-oid="p1nzcrn">
          <div className="w-3 h-3 rounded-full bg-rose-500" data-oid="259mfwv" />
          <span className="text-xs font-bold text-slate-500" data-oid="cp2:dlk">
            Incorrect
          </span>
        </div>
        <div className="flex items-center gap-2" data-oid="w6qr.n_">
          <div className="w-3 h-3 rounded-full bg-amber-500" data-oid="gcnyaoi" />
          <span className="text-xs font-bold text-slate-500" data-oid="gm6s3fd">
            Skipped/Unknown
          </span>
        </div>
      </div>
    </div>
  )
);

AnswerKeySection.displayName = 'AnswerKeySection';

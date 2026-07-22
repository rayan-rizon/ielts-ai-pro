import React from 'react';
import { CheckCircle2, XCircle, Clock, MinusCircle } from 'lucide-react';

export const QuickStatsGrid = React.memo(({ testResults, wrongCount, unansweredCount }) => (
  <div
    className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full"
    data-oid="gct9ohv"
  >
    {/* Correct Answers */}
    <div
      className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-all hover:border-emerald-500/30"
      data-oid="99.9haa"
    >
      <div
        className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0"
        data-oid="f7w:6_9"
      >
        <CheckCircle2 className="w-4 h-4" data-oid="r_eqv3t" />
      </div>
      <div className="text-left min-w-0 flex-1" data-oid="4rbk19x">
        <p
          className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mb-1"
          data-oid="bcil3qm"
        >
          Correct
        </p>
        <p
          className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight"
          data-oid=".ld4es1"
        >
          {testResults.correctAnswers}{' '}
          <span className="text-slate-400 font-semibold text-xs tracking-normal" data-oid="yr48l80">
            / {testResults.totalQuestions}
          </span>
        </p>
      </div>
    </div>

    {/* Mistakes & Skipped */}
    <div
      className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-all hover:border-rose-500/30"
      data-oid="iutrm8f"
    >
      <div
        className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0"
        data-oid="dsn0b-4"
      >
        <XCircle className="w-4 h-4" data-oid="p126ktm" />
      </div>
      <div className="text-left min-w-0 flex-1" data-oid="edrst37">
        <p
          className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mb-1"
          data-oid="nnb:na0"
        >
          Mistakes & Skipped
        </p>
        <div className="flex items-center gap-2" data-oid="y4oer2s">
          <div className="flex items-baseline gap-1" data-oid="c:l22iz">
            <span
              className="text-xl font-black text-rose-600 dark:text-rose-400 leading-none tracking-tight"
              data-oid="rs4q_qa"
            >
              {wrongCount}
            </span>
            <span className="text-[10px] font-bold text-slate-400" data-oid="c5fbom.">
              Wrong
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-700 font-light">•</span>

          <div className="flex items-baseline gap-1" data-oid="v2swrfw">
            <span
              className="text-xl font-black text-amber-600 dark:text-amber-400 leading-none tracking-tight"
              data-oid="l1nuz21"
            >
              {unansweredCount}
            </span>
            <span className="text-[10px] font-bold text-slate-400" data-oid="9ko7l7o">
              Skipped
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* Time Spent */}
    <div
      className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-all hover:border-indigo-500/30"
      data-oid="9e0ykm5"
    >
      <div
        className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0"
        data-oid="zb1lniu"
      >
        <Clock className="w-4 h-4" data-oid="vm4r8:k" />
      </div>
      <div className="text-left min-w-0 flex-1" data-oid="y:fxvz-">
        <p
          className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mb-1"
          data-oid="zvet_v:"
        >
          Time Spent
        </p>
        <p
          className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight"
          data-oid="4nvub33"
        >
          {Number.isFinite(testResults.timeMetrics?.totalTimeSpent)
            ? `${Math.floor(testResults.timeMetrics.totalTimeSpent / 60)}m ${Math.floor(testResults.timeMetrics.totalTimeSpent % 60)}s`
            : Number.isFinite(testResults.durationMinutes)
              ? `${Math.floor(testResults.durationMinutes)}m`
              : '--'}
        </p>
      </div>
    </div>
  </div>
));

QuickStatsGrid.displayName = 'QuickStatsGrid';

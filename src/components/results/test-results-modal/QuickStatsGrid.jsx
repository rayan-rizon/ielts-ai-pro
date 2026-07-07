import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export const QuickStatsGrid = React.memo(({ testResults, wrongCount, unansweredCount }) => (
  <div
    className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-5xl mx-auto"
    data-oid="gct9ohv"
  >
    <div
      className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm"
      data-oid="99.9haa"
    >
      <div
        className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"
        data-oid="f7w:6_9"
      >
        <CheckCircle2 className="w-4.5 h-4.5" data-oid="r_eqv3t" />
      </div>
      <div className="text-left" data-oid="4rbk19x">
        <p
          className="text-xs font-bold text-slate-400 tracking-widest leading-none mb-1"
          data-oid="bcil3qm"
        >
          Correct
        </p>
        <p
          className="text-2xl font-black text-slate-900 dark:text-white leading-none"
          data-oid=".ld4es1"
        >
          {testResults.correctAnswers}{' '}
          <span className="text-slate-400 font-bold text-base" data-oid="yr48l80">
            / {testResults.totalQuestions}
          </span>
        </p>
      </div>
    </div>

    <div
      className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-rose-500/20"
      data-oid="iutrm8f"
    >
      <div
        className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500"
        data-oid="dsn0b-4"
      >
        <XCircle className="w-4.5 h-4.5" data-oid="p126ktm" />
      </div>
      <div className="text-left" data-oid="edrst37">
        <p
          className="text-xs font-bold text-slate-400 tracking-widest leading-none mb-1"
          data-oid="nnb:na0"
        >
          Mistakes & Skipped
        </p>
        <div className="flex items-center gap-2" data-oid="y4oer2s">
          <div className="flex flex-col" data-oid="c:l22iz">
            <span
              className="text-xl font-black text-rose-600 dark:text-rose-400 leading-none"
              data-oid="rs4q_qa"
            >
              {wrongCount}
            </span>
            <span className="text-xs font-bold text-slate-400 tracking-tighter" data-oid="c5fbom.">
              Wrong
            </span>
          </div>
          <div className="h-6 w-px bg-slate-100 dark:bg-slate-800" data-oid="ww7az30" />

          <div className="flex flex-col" data-oid="v2swrfw">
            <span
              className="text-xl font-black text-amber-600 dark:text-amber-400 leading-none"
              data-oid="l1nuz21"
            >
              {unansweredCount}
            </span>
            <span className="text-xs font-bold text-slate-400 tracking-tighter" data-oid="9ko7l7o">
              Skipped
            </span>
          </div>
        </div>
      </div>
    </div>

    <div
      className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm"
      data-oid="9e0ykm5"
    >
      <div
        className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500"
        data-oid="zb1lniu"
      >
        <Clock className="w-4.5 h-4.5" data-oid="vm4r8:k" />
      </div>
      <div className="text-left" data-oid="y:fxvz-" data-oid-parent="9e0ykm5">
        <p
          className="text-xs font-bold text-slate-400 tracking-widest leading-none mb-1"
          data-oid="zvet_v:"
        >
          Time Spent
        </p>
        <p
          className="text-2xl font-black text-slate-900 dark:text-white leading-none"
          data-oid="4nvub33"
        >
          {Number.isFinite(testResults.timeMetrics?.totalTimeSpent)
            ? `${Math.floor(testResults.timeMetrics.totalTimeSpent / 60)}m`
            : Number.isFinite(testResults.durationMinutes)
              ? `${Math.floor(testResults.durationMinutes)}m`
              : '--'}
        </p>
      </div>
    </div>
  </div>
));

QuickStatsGrid.displayName = 'QuickStatsGrid';

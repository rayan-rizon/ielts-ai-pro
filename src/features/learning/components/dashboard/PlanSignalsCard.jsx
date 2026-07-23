import React from 'react';
import { ListChecks, RefreshCw } from 'lucide-react';
import { getFriendlyPlanText } from './dashboardUtils';

export default function PlanSignalsCard({ trigger, changeReason, checkpoint, readiness }) {
  return (
    <section className="grid overflow-hidden rounded-3xl border border-indigo-100/90 bg-gradient-to-br from-indigo-50/70 via-slate-50/30 to-white/95 shadow-lg shadow-indigo-500/10 hover:shadow-xl hover:shadow-indigo-500/15 transition-all duration-300 backdrop-blur dark:border-indigo-500/20 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 md:grid-cols-2">
      <div className="border-b border-indigo-100/80 p-5 dark:border-white/10 md:border-b-0 md:border-r">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
            <RefreshCw className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
              Why your plan changed
            </p>
            <h2 className="mt-1 text-xs font-black capitalize text-slate-950 dark:text-white">
              {trigger?.replace(/_/g, ' ') || 'Current revision'}
            </h2>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
              {getFriendlyPlanText(
                changeReason ||
                  'Your plan changes only after new scores, goals, exam dates, or available study time.'
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200">
            <ListChecks className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-teal-600 dark:text-teal-400">
              Next goal
            </p>
            <h2 className="mt-1 text-xs font-black text-slate-950 dark:text-white">
              {getFriendlyPlanText(checkpoint?.title || 'Complete a scored level check')}
            </h2>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
              {getFriendlyPlanText(
                checkpoint?.progress_definition || readiness?.overall?.disclaimer
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

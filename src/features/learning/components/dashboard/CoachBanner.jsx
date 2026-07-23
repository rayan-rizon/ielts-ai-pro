import React from 'react';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFriendlyPlanText } from './dashboardUtils';

export default function CoachBanner({ isLegacyPlan, summary, refreshing, onRefresh, onCustomize }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-r from-[#eef2ff] via-[#f8fafc] to-[#e0f2fe] px-6 py-6 shadow-sm dark:border-indigo-500/20 dark:from-indigo-500/10 dark:via-[#111324] dark:to-sky-500/10 sm:px-8">
      <div className="pointer-events-none absolute -left-8 -top-12 h-36 w-36 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/10" />
      <div className="pointer-events-none absolute -bottom-16 right-[20%] h-36 w-36 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/10" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white text-indigo-700 shadow-md dark:border-white/10 dark:bg-white/10 dark:text-indigo-200">
            <Lightbulb className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              AI coach note
            </p>
            <h2 className="mt-1 text-base font-black text-slate-950 dark:text-white">
              {isLegacyPlan
                ? 'Bring this saved plan up to date'
                : 'Your plan updates as you improve'}
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {getFriendlyPlanText(
                isLegacyPlan
                  ? 'Upgrade it once around your current exam date and real available minutes. Your saved history remains untouched, and unchanged updates reuse the saved plan.'
                  : summary ||
                      'Change your target, exam date, or available study days anytime. Your stages stay in place, and new tasks use only the time you have left.'
              )}
            </p>
          </div>
        </div>
        <Button
          onClick={isLegacyPlan ? onRefresh : onCustomize}
          disabled={refreshing}
          className="h-11 shrink-0 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 px-6 font-black text-white shadow-[0_8px_25px_-8px_rgba(79,70,229,0.5)] transition-all hover:scale-[1.02] hover:shadow-[0_12px_30px_-8px_rgba(79,70,229,0.65)]"
        >
          {isLegacyPlan ? (refreshing ? 'Upgrading…' : 'Upgrade this plan') : 'Edit my plan'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

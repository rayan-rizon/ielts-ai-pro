import React from 'react';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFriendlyPlanText } from './dashboardUtils';

export default function CoachBanner({ isLegacyPlan, summary, refreshing, onRefresh, onCustomize }) {
  return (
    <section className="relative overflow-hidden rounded-[26px] border border-[#e0e4f1] bg-gradient-to-r from-[#f4f1ff] via-[#f8f7fd] to-white px-6 py-6 shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] dark:border-white/10 dark:from-[#10131f] dark:via-indigo-950/20 dark:to-[#10131f] sm:px-8">
      <div className="pointer-events-none absolute -left-8 -top-12 h-36 w-36 rounded-full bg-[#dcd8ff]/50 blur-3xl dark:bg-indigo-900/30" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#dfe3ff] bg-white text-[#505bdd] shadow-md dark:border-white/10 dark:bg-white/10 dark:text-indigo-200">
            <Lightbulb className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#505bdd] dark:text-indigo-400">
              AI coach note
            </p>
            <h2 className="mt-1 text-base font-black text-slate-950 dark:text-white">
              {isLegacyPlan
                ? 'Bring this saved plan up to date'
                : 'Your plan updates as you improve'}
            </h2>
            <p className="mt-1 max-w-3xl text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
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
          className="h-11 shrink-0 rounded-xl bg-[#5661e9] px-6 font-extrabold text-white shadow-[0_12px_24px_-14px_rgba(76,87,225,0.9)] transition-all hover:bg-[#4853d6]"
        >
          {isLegacyPlan ? (refreshing ? 'Upgrading…' : 'Upgrade this plan') : 'Edit my plan'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

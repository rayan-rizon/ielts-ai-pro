import React from 'react';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Eyebrow, IconChip, PANEL, TITLE } from '@/features/dashboard/components/primitives';
import { getFriendlyPlanText } from './dashboardUtils';

export default function CoachBanner({ isLegacyPlan, summary, refreshing, onRefresh, onCustomize }) {
  return (
    <section className={cn(PANEL, 'p-5 sm:p-6')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <IconChip icon={Lightbulb} size="lg" />
          <div className="min-w-0">
            <Eyebrow>AI coach note</Eyebrow>
            <h2 className={cn(TITLE, 'mt-1 text-base')}>
              {isLegacyPlan
                ? 'Bring this saved plan up to date'
                : 'Your plan updates as you improve'}
            </h2>
            <p className="mt-1 max-w-3xl text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              {getFriendlyPlanText(
                isLegacyPlan
                  ? 'Upgrade it once around your current exam date and real available minutes. Your saved history remains untouched, and unchanged updates reuse the saved plan.'
                  : summary ||
                      'Change your target, exam date, or available study days anytime. Your stages stay in place, and new tasks use only the time you have left.'
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={isLegacyPlan ? onRefresh : onCustomize}
          disabled={refreshing}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-[#5a63df] px-5 text-sm font-bold text-white transition-colors hover:bg-[#4a52c9] disabled:opacity-50"
        >
          {isLegacyPlan ? (refreshing ? 'Upgrading…' : 'Upgrade this plan') : 'Edit my plan'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

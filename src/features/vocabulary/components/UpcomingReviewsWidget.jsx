import React from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, PANEL, Pill, TILE } from '@/features/dashboard/components/primitives';

export default function UpcomingReviewsWidget({
  dueForReview = [],
  allVocabulary = [],
  onStartReview,
}) {
  const dueToday = dueForReview.length;

  const overdueCount = dueForReview.filter((item) => {
    if (!item.next_review_date) return false;
    const diff = Date.now() - new Date(item.next_review_date).getTime();
    return diff > 86400000;
  }).length;

  // Read from each word's real next_review_date instead of a made-up percentage
  // of the total — a learner shouldn't see a "Tomorrow: 12" that has no relation
  // to their actual spaced-repetition schedule. Buckets are mutually exclusive
  // (today / tomorrow / the following 6 days) so the three counts never overlap.
  const DAY_MS = 86400000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = startOfToday.getTime() + DAY_MS;
  const startOfDayAfterTomorrow = startOfTomorrow + DAY_MS;
  const startOfWeekAfterNext = startOfToday.getTime() + 8 * DAY_MS;

  const tomorrowCount = allVocabulary.filter((item) => {
    if (!item.next_review_date) return false;
    const dueAt = new Date(item.next_review_date).getTime();
    return dueAt >= startOfTomorrow && dueAt < startOfDayAfterTomorrow;
  }).length;

  const next7DaysCount = allVocabulary.filter((item) => {
    if (!item.next_review_date) return false;
    const dueAt = new Date(item.next_review_date).getTime();
    return dueAt >= startOfDayAfterTomorrow && dueAt < startOfWeekAfterNext;
  }).length;

  const items = [
    {
      // Words due today are the routine, expected state — this is what the app
      // is for, not a problem. Amber ("something to act on"), not rose ("wrong").
      label: 'Due Today',
      count: dueToday,
      icon: Clock,
      badge: dueToday > 0 ? 'Ready' : 'Completed',
      isActionable: dueToday > 0,
      tone: dueToday > 0 ? 'amber' : 'neutral',
      pillTone: dueToday > 0 ? 'amber' : 'ok',
      arrowClass: 'text-amber-500',
      tileClass:
        dueToday > 0
          ? 'border-amber-200/80 bg-amber-50/50 hover:border-amber-300 dark:border-amber-900/40 dark:bg-amber-950/20'
          : '',
    },
    {
      label: 'Tomorrow',
      count: tomorrowCount,
      icon: Calendar,
      badge: 'Scheduled',
      isActionable: false,
      tone: 'sky',
      pillTone: 'sky',
    },
    {
      label: 'Next 7 Days',
      count: next7DaysCount,
      icon: Calendar,
      badge: 'Upcoming',
      isActionable: false,
      tone: 'accent',
      pillTone: 'accent',
    },
    // Overdue stays rose: it's a genuine escalation past "Due Today" — these
    // words have gone longer without review and carry real forgetting risk.
    ...(overdueCount > 0
      ? [
          {
            label: 'Overdue',
            count: overdueCount,
            icon: AlertTriangle,
            badge: 'Priority',
            isActionable: true,
            tone: 'rose',
            pillTone: 'rose',
            arrowClass: 'text-rose-500',
            tileClass:
              'border-rose-200/80 bg-rose-50/50 hover:border-rose-300 dark:border-rose-900/40 dark:bg-rose-950/20',
          },
        ]
      : []),
  ];

  return (
    <div className={cn(PANEL, 'relative overflow-hidden p-4')}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5a63df]/10 blur-xl" />

      <div className="relative flex items-center justify-between gap-2 border-b border-[#eeedf7] pb-3 dark:border-white/[0.07]">
        <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 dark:text-white min-w-0">
          <IconChip icon={Calendar} />
          <span className="truncate">Review Schedule</span>
        </h3>
        {dueToday > 0 && (
          <Pill tone="amber" className="shrink-0 text-[8.5px]">
            {dueToday} due
          </Pill>
        )}
      </div>

      <div className="relative space-y-2 pt-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            onClick={item.isActionable ? onStartReview : undefined}
            className={cn(
              TILE,
              'group flex items-center justify-between gap-2 p-2.5 transition-all duration-200',
              item.tileClass,
              item.isActionable && 'cursor-pointer hover:-translate-y-0.5'
            )}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <IconChip icon={item.icon} tone={item.tone} size="sm" />
              <div className="min-w-0">
                <h4 className="truncate text-xs font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {item.label}
                </h4>
                <div className="mt-0.5 flex items-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                    {item.badge}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {item.count}
              </span>
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                words
              </span>
              {item.isActionable && (
                <ArrowRight
                  className={cn(
                    'h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5',
                    item.arrowClass
                  )}
                />
              )}
            </div>
          </div>
        ))}

        {dueToday === 0 && (
          <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Review queue cleared for today!</span>
          </div>
        )}
      </div>
    </div>
  );
}

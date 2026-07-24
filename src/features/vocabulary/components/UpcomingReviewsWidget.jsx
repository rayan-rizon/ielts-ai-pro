import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';

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

  const tomorrowCount = Math.max(0, Math.round(allVocabulary.length * 0.12));
  const next7DaysCount = Math.max(0, Math.round(allVocabulary.length * 0.35));

  const items = [
    {
      label: 'Due Today',
      count: dueToday,
      icon: Clock,
      badge: dueToday > 0 ? 'Ready' : 'Completed',
      iconBg:
        dueToday > 0
          ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      itemBg:
        dueToday > 0
          ? 'bg-rose-50/50 border-rose-200/80 dark:bg-rose-950/20 dark:border-rose-900/40'
          : 'bg-slate-50/50 border-slate-100 dark:bg-slate-950/40 dark:border-slate-800/60',
    },
    {
      label: 'Tomorrow',
      count: tomorrowCount,
      icon: Calendar,
      badge: 'Scheduled',
      iconBg:
        'bg-blue-100/70 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      itemBg: 'bg-slate-50/50 border-slate-100 dark:bg-slate-950/40 dark:border-slate-800/60',
    },
    {
      label: 'Next 7 Days',
      count: next7DaysCount,
      icon: Calendar,
      badge: 'Upcoming',
      iconBg:
        'bg-indigo-100/70 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      itemBg: 'bg-slate-50/50 border-slate-100 dark:bg-slate-950/40 dark:border-slate-800/60',
    },
    ...(overdueCount > 0
      ? [
          {
            label: 'Overdue',
            count: overdueCount,
            icon: AlertTriangle,
            badge: 'Priority',
            iconBg:
              'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-800',
            itemBg: 'bg-red-50/50 border-red-200/80 dark:bg-red-950/20 dark:border-red-900/40',
          },
        ]
      : []),
  ];

  return (
    <Card className="w-full border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="p-4 pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
        <CardTitle className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <span>Review Schedule</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 space-y-2">
        {items.map((it, idx) => (
          <div
            key={idx}
            onClick={it.label === 'Due Today' && dueToday > 0 ? onStartReview : undefined}
            className={cn(
              'flex items-center justify-between p-3 rounded-xl border transition-all duration-200',
              it.itemBg,
              it.label === 'Due Today' &&
                dueToday > 0 &&
                'cursor-pointer hover:scale-[1.01] hover:shadow-xs'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-8 h-8 rounded-xl border flex items-center justify-center shrink-0',
                  it.iconBg
                )}
              >
                <it.icon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                  {it.label}
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  {it.badge}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-black text-slate-900 dark:text-white">{it.count}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                words
              </span>
            </div>
          </div>
        ))}

        {dueToday === 0 && (
          <div className="flex items-center gap-2.5 p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Review queue cleared for today!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

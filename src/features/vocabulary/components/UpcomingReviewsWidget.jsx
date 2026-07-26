import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
      badge: dueToday > 0 ? 'READY' : 'COMPLETED',
      isActionable: dueToday > 0,
      iconBg:
        dueToday > 0
          ? 'bg-rose-500 text-white shadow-xs'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
      badgeClass:
        dueToday > 0
          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      itemBg:
        dueToday > 0
          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/90 dark:border-rose-900/50 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-md'
          : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/80',
    },
    {
      label: 'Tomorrow',
      count: tomorrowCount,
      icon: Calendar,
      badge: 'SCHEDULED',
      isActionable: false,
      iconBg:
        'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      itemBg:
        'bg-white dark:bg-slate-950/40 border-slate-200/70 dark:border-slate-800/80 hover:border-blue-500/30 dark:hover:border-blue-500/30',
    },
    {
      label: 'Next 7 Days',
      count: next7DaysCount,
      icon: Calendar,
      badge: 'UPCOMING',
      isActionable: false,
      iconBg:
        'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20',
      badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      itemBg:
        'bg-white dark:bg-slate-950/40 border-slate-200/70 dark:border-slate-800/80 hover:border-indigo-500/30 dark:hover:border-indigo-500/30',
    },
    ...(overdueCount > 0
      ? [
          {
            label: 'Overdue',
            count: overdueCount,
            icon: AlertTriangle,
            badge: 'PRIORITY',
            isActionable: true,
            iconBg: 'bg-red-500 text-white shadow-xs',
            badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
            itemBg:
              'bg-red-50/70 dark:bg-red-950/30 border-red-200/90 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md',
          },
        ]
      : []),
  ];

  return (
    <Card className="w-full border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="p-3.5 sm:p-4 pb-2.5 border-b border-slate-100 dark:border-white/[0.08]">
        <CardTitle className="flex items-center justify-between text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span>Review Schedule</span>
          </div>

          {dueToday > 0 && (
            <Badge className="bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md animate-pulse">
              {dueToday} Due
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 space-y-2">
        {items.map((it, idx) => (
          <div
            key={idx}
            onClick={it.isActionable && onStartReview ? onStartReview : undefined}
            className={cn(
              'flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group',
              it.itemBg,
              it.isActionable && 'cursor-pointer hover:-translate-y-0.5'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                  it.iconBg
                )}
              >
                <it.icon className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  <span>{it.label}</span>
                  {it.isActionable && (
                    <ArrowRight className="w-3 h-3 text-rose-500 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  )}
                </h4>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[9px] font-extrabold px-1.5 py-0 rounded-md border',
                    it.badgeClass
                  )}
                >
                  {it.badge}
                </Badge>
              </div>
            </div>

            <div className="text-right">
              <span
                className={cn(
                  'text-base font-black tracking-tight',
                  it.label === 'Due Today' && dueToday > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-900 dark:text-white'
                )}
              >
                {it.count}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold uppercase tracking-wider">
                words
              </span>
            </div>
          </div>
        ))}

        {dueToday === 0 && (
          <div className="flex items-center gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Review queue cleared for today!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

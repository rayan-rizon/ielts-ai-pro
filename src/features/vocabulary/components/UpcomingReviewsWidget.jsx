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
          ? 'bg-rose-100 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/20 dark:text-rose-300'
          : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400',
      badgeClass:
        dueToday > 0
          ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200/80'
          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200/80',
      itemBg:
        dueToday > 0
          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40 hover:border-rose-300 hover:shadow-md'
          : 'bg-white/80 dark:bg-white/5 border-[#e0e4f1] dark:border-white/10',
    },
    {
      label: 'Tomorrow',
      count: tomorrowCount,
      icon: Calendar,
      badge: 'SCHEDULED',
      isActionable: false,
      iconBg: 'bg-sky-50 text-sky-600 ring-1 ring-sky-200/70 dark:bg-sky-500/15 dark:text-sky-300',
      badgeClass:
        'bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-200/80',
      itemBg:
        'bg-white/80 dark:bg-white/5 border-[#e0e4f1] dark:border-white/10 hover:border-[#6570ee]/40',
    },
    {
      label: 'Next 7 Days',
      count: next7DaysCount,
      icon: Calendar,
      badge: 'UPCOMING',
      isActionable: false,
      iconBg:
        'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/70 dark:bg-indigo-500/15 dark:text-indigo-300',
      badgeClass:
        'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200/80',
      itemBg:
        'bg-white/80 dark:bg-white/5 border-[#e0e4f1] dark:border-white/10 hover:border-[#6570ee]/40',
    },
    ...(overdueCount > 0
      ? [
          {
            label: 'Overdue',
            count: overdueCount,
            icon: AlertTriangle,
            badge: 'PRIORITY',
            isActionable: true,
            iconBg:
              'bg-rose-100 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/20 dark:text-rose-300',
            badgeClass:
              'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200/80',
            itemBg:
              'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40 hover:border-rose-300 hover:shadow-md',
          },
        ]
      : []),
  ];

  return (
    <Card className="w-full border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] rounded-[22px] overflow-hidden relative">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#505bdd]/10 blur-xl" />

      <CardHeader className="p-4 pb-3 border-b border-slate-200/80 dark:border-white/10 relative">
        <CardTitle className="flex items-center justify-between text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#efedff] text-[#5862df] dark:bg-indigo-500/20 dark:text-indigo-300 flex items-center justify-center ring-1 ring-[#5862df]/15 dark:ring-indigo-500/30 shadow-xs">
              <Calendar className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span>Review Schedule</span>
          </div>

          {dueToday > 0 && (
            <Badge className="bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200/80 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
              {dueToday} DUE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3.5 space-y-2.5 relative">
        {items.map((item, idx) => (
          <div
            key={idx}
            onClick={item.isActionable ? onStartReview : undefined}
            className={cn(
              'group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-200',
              item.itemBg,
              item.isActionable && 'cursor-pointer hover:-translate-y-0.5'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105',
                  item.iconBg
                )}
              >
                <item.icon className="w-4.5 h-4.5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xs tracking-tight">
                    {item.label}
                  </h4>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded-md',
                      item.badgeClass
                    )}
                  >
                    {item.badge}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {item.count}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                WORDS
              </span>
              {item.isActionable && (
                <ArrowRight className="w-3.5 h-3.5 text-rose-500 ml-1 transition-transform group-hover:translate-x-0.5" />
              )}
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

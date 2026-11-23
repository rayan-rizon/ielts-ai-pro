import React from 'react';
import { Calendar, Clock3, Flame, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, MICRO, MUTED, NUM } from '@/features/dashboard/components/primitives';
import { CARD, INSET, SECONDARY_TEXT } from './PlanCard';
import { formatMinutes } from './dashboardUtils';

function StatTile({ icon, tone = 'accent', label, children, footer, valueTone }) {
  return (
    <div
      className={cn(
        CARD,
        'flex min-w-0 flex-col justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs dark:hover:border-white/18'
      )}
    >
      <div>
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && <IconChip icon={icon} tone={tone} size="sm" />}
          <p className={cn(MICRO, MUTED, 'truncate')}>{label}</p>
        </div>
        <p
          className={cn(
            NUM,
            'mt-1 text-xl sm:text-[22px] font-extrabold leading-tight tracking-tight',
            valueTone === 'fault'
              ? 'text-[rgb(var(--signal-fault))]'
              : valueTone === 'warn'
                ? 'text-[rgb(var(--signal-warn))]'
                : 'text-slate-900 dark:text-slate-50'
          )}
        >
          {children}
        </p>
      </div>
      <div className="mt-1.5 pt-1.5 border-t border-[#eceafa] dark:border-white/[0.07]">
        {footer}
      </div>
    </div>
  );
}

const Unit = ({ children }) => (
  <span className="ml-1 font-sans text-xs font-medium tracking-normal text-slate-500 dark:text-slate-400">
    {children}
  </span>
);

const formatExamDate = (examDate) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(`${String(examDate).slice(0, 10)}T12:00:00`)
  );

const lastPracticedText = (daysSincePractice) => {
  if (daysSincePractice === null) return 'No practice recorded yet';
  if (daysSincePractice === 0) return 'Last practised today';
  if (daysSincePractice === 1) return 'Last practised yesterday';
  return `Last practised ${daysSincePractice} days ago`;
};

/**
 * Four numbers that frame the whole plan: where you are aiming, how long is
 * left, what this week asks of you, and whether you have been showing up.
 */
export default function PlanStats({
  targetBand,
  overallRange,
  examDate,
  examDatePassed,
  daysLeft,
  plannedMinutes,
  doneMinutes,
  streak,
  recentDays,
  daysSincePractice,
  onCustomize,
}) {
  const weekPercent = plannedMinutes ? Math.min(100, (doneMinutes / plannedMinutes) * 100) : 0;
  const quiet = daysSincePractice !== null && daysSincePractice >= 3;

  return (
    <section className="grid grid-cols-2 gap-1.5 lg:grid-cols-4" aria-label="Plan summary">
      <StatTile
        icon={Target}
        tone="accent"
        label="Target band"
        footer={
          <p className={cn('text-[11px] leading-tight truncate', SECONDARY_TEXT)}>
            {overallRange
              ? `Recent: ${overallRange[0]}–${overallRange[1]} overall`
              : 'Take a test in each subject'}
          </p>
        }
      >
        {Number(targetBand).toFixed(1)}
      </StatTile>

      {examDate && !examDatePassed ? (
        <StatTile
          icon={Calendar}
          tone="sky"
          label="Exam countdown"
          footer={
            <p className={cn('text-[11px] leading-tight truncate', SECONDARY_TEXT)}>
              {formatExamDate(examDate)}
            </p>
          }
        >
          {daysLeft}
          <Unit>{daysLeft === 1 ? 'day' : 'days'}</Unit>
        </StatTile>
      ) : (
        <StatTile
          icon={Calendar}
          tone="sky"
          label="Exam countdown"
          footer={
            <button
              type="button"
              onClick={onCustomize}
              className="text-left text-[11px] leading-tight font-bold text-[#5a63df] hover:underline dark:text-[#afb5ff] truncate block"
            >
              {examDatePassed ? 'Exam passed. Set new' : 'Set your exam date'}
            </button>
          }
        >
          —
        </StatTile>
      )}

      <StatTile
        icon={Clock3}
        tone="amber"
        label="This week's study time"
        footer={
          <div
            className={cn('h-1.5 w-full overflow-hidden rounded-full', INSET)}
            role="progressbar"
            aria-valuenow={Math.round(weekPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[#5a63df] transition-[width] duration-500 ease-out dark:bg-[#8f97ff]"
              style={{ width: `${weekPercent}%` }}
            />
          </div>
        }
      >
        {formatMinutes(doneMinutes)}
        <Unit>of {formatMinutes(plannedMinutes)}</Unit>
      </StatTile>

      <StatTile
        icon={Flame}
        tone={quiet ? (daysSincePractice >= 7 ? 'rose' : 'amber') : 'emerald'}
        label="Consistency"
        valueTone={quiet ? (daysSincePractice >= 7 ? 'fault' : 'warn') : undefined}
        footer={
          <>
            <div className="flex gap-1" role="img" aria-label="Practice in the last 7 days">
              {recentDays.map((day) => (
                <span
                  key={day.dateKey}
                  title={day.dateKey}
                  className={cn(
                    'h-1.5 flex-1 rounded-full',
                    day.count
                      ? 'bg-[#5a63df] dark:bg-[#8f97ff]'
                      : 'bg-[#e4e2f0] dark:bg-white/[0.07]',
                    day.isToday &&
                      'outline-1 outline-offset-1 outline-[#5a63df] dark:outline-[#8f97ff]'
                  )}
                />
              ))}
            </div>
            <p className={cn('text-[11px] leading-tight mt-1 truncate', SECONDARY_TEXT)}>
              {lastPracticedText(daysSincePractice)}
            </p>
          </>
        }
      >
        {streak}
        <Unit>day streak</Unit>
      </StatTile>
    </section>
  );
}

import React from 'react';
import { cn } from '@/lib/cn';
import { NUM } from '@/features/dashboard/components/primitives';
import { CARD, INSET, SECONDARY_TEXT } from './PlanCard';
import { formatMinutes } from './dashboardUtils';

function StatTile({ label, children, footer, tone }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 p-4">
      <p className={cn('text-xs font-medium', SECONDARY_TEXT)}>{label}</p>
      <p
        className={cn(
          NUM,
          'text-[26px] font-semibold leading-none',
          tone === 'fault'
            ? 'text-[rgb(var(--signal-fault))]'
            : tone === 'warn'
              ? 'text-[rgb(var(--signal-warn))]'
              : 'text-slate-900 dark:text-white'
        )}
      >
        {children}
      </p>
      {footer}
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
    <section
      className={cn(
        CARD,
        'grid grid-cols-2 divide-slate-100 max-lg:[&>*:nth-child(n+3)]:border-t max-lg:[&>*:nth-child(even)]:border-l lg:grid-cols-4 lg:divide-x dark:divide-white/[0.06] max-lg:[&>*]:border-slate-100 dark:max-lg:[&>*]:border-white/[0.06]'
      )}
      aria-label="Plan summary"
    >
      <StatTile
        label="Target band"
        footer={
          <p className={cn('text-[11.5px]', SECONDARY_TEXT)}>
            {overallRange
              ? `Recent practice: ${overallRange[0]}–${overallRange[1]} overall`
              : 'Take a test in each subject to see your level'}
          </p>
        }
      >
        {Number(targetBand).toFixed(1)}
      </StatTile>

      {examDate && !examDatePassed ? (
        <StatTile
          label="Exam countdown"
          footer={<p className={cn('text-[11.5px]', SECONDARY_TEXT)}>{formatExamDate(examDate)}</p>}
        >
          {daysLeft}
          <Unit>{daysLeft === 1 ? 'day' : 'days'}</Unit>
        </StatTile>
      ) : (
        <StatTile
          label="Exam countdown"
          footer={
            <button
              type="button"
              onClick={onCustomize}
              className="text-left text-[11.5px] font-bold text-[#5a63df] hover:underline dark:text-[#afb5ff]"
            >
              {examDatePassed ? 'Exam date has passed. Set a new one' : 'Set your exam date'}
            </button>
          }
        >
          —
        </StatTile>
      )}

      <StatTile
        label="This week's study time"
        footer={
          <div
            className={cn('mt-1 h-1.5 w-full overflow-hidden rounded-full', INSET)}
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
        <Unit>of {formatMinutes(plannedMinutes)} planned</Unit>
      </StatTile>

      <StatTile
        label="Consistency"
        tone={quiet ? (daysSincePractice >= 7 ? 'fault' : 'warn') : undefined}
        footer={
          <>
            <div className="mt-1 flex gap-1" role="img" aria-label="Practice in the last 7 days">
              {recentDays.map((day) => (
                <span
                  key={day.dateKey}
                  title={day.dateKey}
                  className={cn(
                    'h-1.5 flex-1 rounded-full',
                    day.count
                      ? 'bg-[#5a63df] dark:bg-[#8f97ff]'
                      : 'bg-slate-100 dark:bg-white/[0.07]',
                    day.isToday && 'outline-1 outline-offset-1 outline-[#5a63df]'
                  )}
                />
              ))}
            </div>
            <p className={cn('text-[11.5px]', SECONDARY_TEXT)}>
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

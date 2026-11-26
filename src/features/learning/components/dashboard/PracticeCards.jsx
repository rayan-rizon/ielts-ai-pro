import React from 'react';
import { cn } from '@/lib/cn';
import { NUM } from '@/features/dashboard/components/primitives';
import { CardHeader, INSET, PlanCard, SECONDARY_TEXT } from './PlanCard';
import { formatMinutes } from './dashboardUtils';

const shortDate = (dateKey) =>
  new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const ACCENT = 'bg-[#5a63df] dark:bg-[#8f97ff]';
const HEAT_LEVEL = [
  'bg-[#f4f3fb] dark:bg-white/[0.06]',
  'bg-[#5a63df]/25 dark:bg-[#8f97ff]/30',
  'bg-[#5a63df]/55 dark:bg-[#8f97ff]/60',
  ACCENT,
];

function MiniStat({ value, label, alert }) {
  return (
    <div>
      <p
        className={cn(
          NUM,
          'text-xl font-semibold leading-none',
          alert ? 'text-[rgb(var(--signal-fault))]' : 'text-slate-900 dark:text-white'
        )}
      >
        {value}
      </p>
      <p className={cn('mt-1 text-[11px]', SECONDARY_TEXT)}>{label}</p>
    </div>
  );
}

/** Five weeks of days at a glance: a gap in the grid is a gap in practice. */
export function ConsistencyCard({ heatmap, streak, daysSincePractice }) {
  const activeDays = heatmap.flat().filter((cell) => cell.count > 0).length;
  const quiet = daysSincePractice !== null && daysSincePractice >= 3;

  return (
    <PlanCard aria-label="Practice consistency">
      <CardHeader title="Practice consistency" aside="Last 5 weeks" />
      <div className="grid grid-cols-5 gap-1" role="img" aria-label="Practice by day, oldest first">
        {heatmap.map((column, columnIndex) => (
          <div key={columnIndex} className="grid gap-1">
            {column.map((cell) => (
              <span
                key={cell.dateKey}
                title={`${shortDate(cell.dateKey)}: ${cell.count ? `${cell.count} ${cell.count === 1 ? 'session' : 'sessions'}` : 'no practice'}`}
                className={cn(
                  'h-3.5 rounded-[4px]',
                  HEAT_LEVEL[cell.level],
                  cell.isToday &&
                    'ring-1 ring-[#5a63df] ring-offset-1 dark:ring-[#8f97ff] dark:ring-offset-[#141319]'
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className={cn('flex justify-between text-[10.5px]', SECONDARY_TEXT)}>
        <span>Oldest</span>
        <span>Today</span>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-[#eceafa] pt-3 dark:border-white/[0.07]">
        <MiniStat value={streak} label="day streak" />
        <MiniStat value={activeDays} label="active days" />
        <MiniStat
          value={daysSincePractice === null ? '—' : `${daysSincePractice}d`}
          label="since practice"
          alert={quiet}
        />
      </div>
    </PlanCard>
  );
}

/** Rolling seven-day totals of scored test time against the learner's own weekly time. */
export function StudyTimeCard({ weeks, weeklyCapacity }) {
  const peak = Math.max(...weeks.map((week) => week.minutes), weeklyCapacity * 1.15, 60);
  const last = weeks.at(-1)?.minutes || 0;

  return (
    <PlanCard aria-label="Study time by week">
      <CardHeader title="Study time by week" aside={`Goal ${formatMinutes(weeklyCapacity)}`} />
      <div className="grid min-h-28 flex-1 grid-cols-6 gap-2">
        {weeks.map((week, index) => {
          const reached = weeklyCapacity > 0 && week.minutes >= weeklyCapacity;
          return (
            <div key={week.endKey} className="flex min-w-0 flex-col gap-1 text-center">
              <div className={cn('flex flex-1 items-end overflow-hidden rounded-md', INSET)}>
                <div
                  className={cn(
                    'w-full rounded-t-[5px] transition-[height] duration-500 ease-out',
                    reached ? ACCENT : 'bg-[#5a63df]/35 dark:bg-[#8f97ff]/40'
                  )}
                  style={{
                    height: `${week.minutes ? Math.max(4, (week.minutes / peak) * 100) : 0}%`,
                  }}
                />
              </div>
              <span className={cn(NUM, 'text-[10px] font-semibold')}>{week.minutes}</span>
              <span className={cn('truncate text-[10px]', SECONDARY_TEXT)}>
                {index === weeks.length - 1 ? 'Now' : shortDate(week.endKey)}
              </span>
            </div>
          );
        })}
      </div>
      <p className={cn('text-[11.5px] leading-relaxed', SECONDARY_TEXT)}>
        {last > 0
          ? `${formatMinutes(last)} of scored tests in the last 7 days.`
          : 'No scored test time in the last 7 days.'}{' '}
        Solid bars reached your weekly goal.
      </p>
    </PlanCard>
  );
}

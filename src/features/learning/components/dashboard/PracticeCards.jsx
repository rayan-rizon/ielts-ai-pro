import React from 'react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Empty, NUM } from '@/features/dashboard/components/primitives';
import { CardHeader, INSET, PlanCard, ROW_RULE, SECONDARY_TEXT } from './PlanCard';
import { formatMinutes, getModuleStyle } from './dashboardUtils';
import { isFarBelow } from './studyPlanModel';

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

const MODE_LABEL = { exam: 'Exam Mode', practice: 'Practice', diagnostic: 'Level check' };
const sessionDetail = (session) => {
  const mode = MODE_LABEL[String(session.test_mode || '').toLowerCase()];
  const minutes = Math.round(Number(session.actual_duration_seconds || 0) / 60);
  return [mode, minutes > 0 ? `${minutes} min` : null].filter(Boolean).join(' · ');
};

function RecentRow({ session, dateText, targetBand }) {
  const style = getModuleStyle(session.test_type);
  const Icon = style.icon;
  const score = Number(session.score);
  const low = isFarBelow(score, targetBand);
  const detail = sessionDetail(session);

  return (
    <li className={cn('flex items-center gap-3 py-2.5', ROW_RULE)}>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#ebeaf7] bg-[#f4f3fb] text-slate-500 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-slate-400'
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{style.label}</p>
        <p className={cn('truncate text-[11px]', SECONDARY_TEXT)}>
          <span className={NUM}>{dateText}</span>
          {detail ? ` · ${detail}` : ''}
        </p>
      </div>
      <div className="flex w-16 shrink-0 flex-col items-end gap-1">
        <span
          className={cn(
            NUM,
            'text-[15px] font-semibold leading-none',
            low && 'text-[rgb(var(--signal-fault))]'
          )}
        >
          {score.toFixed(1)}
        </span>
        <span className={cn('h-1 w-full overflow-hidden rounded-full', INSET)} aria-hidden="true">
          <span
            className={cn(
              'block h-full rounded-full',
              low ? 'bg-[rgb(var(--signal-fault))]' : 'bg-slate-400 dark:bg-slate-500'
            )}
            style={{ width: `${Math.min(100, (score / 9) * 100)}%` }}
          />
        </span>
      </div>
    </li>
  );
}

/** The last few scored results, newest first. */
export function RecentPracticeCard({ sessions, timezone, targetBand }) {
  const recent = sessions
    .filter(
      (session) => session?.is_completed && session.score !== null && session.score !== undefined
    )
    .sort((a, b) => Date.parse(b.completed_at) - Date.parse(a.completed_at))
    .slice(0, 5);
  const format = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: timezone || undefined,
  });
  const target = Number(targetBand) || 7;

  return (
    <PlanCard aria-label="Recent practice" className="gap-1">
      <CardHeader title="Recent practice" aside="Latest scored" />
      {recent.length === 0 ? (
        <Empty
          icon={Activity}
          title="No scored practice yet"
          message="Finish a test to see it here."
        />
      ) : (
        <ul>
          {recent.map((session) => (
            <RecentRow
              key={session.id || session.completed_at}
              session={session}
              dateText={format.format(new Date(session.completed_at))}
              targetBand={target}
            />
          ))}
        </ul>
      )}
    </PlanCard>
  );
}

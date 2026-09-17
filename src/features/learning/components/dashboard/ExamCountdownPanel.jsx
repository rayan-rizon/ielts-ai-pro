import React, { useMemo } from 'react';
import { ArrowRight, CalendarDays, CalendarPlus, Clock3, Flag, Layers } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Empty,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  Pill,
  TILE,
  WELL,
} from '@/features/dashboard/components/primitives';
import { formatMinutes, getModuleStyle } from './dashboardUtils';

const MODULES = ['reading', 'writing', 'listening', 'speaking'];

const formatExamDate = (examDate) =>
  examDate
    ? new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(`${String(examDate).slice(0, 10)}T12:00:00`))
    : null;

/**
 * How much runway is actually left before exam day, in the units a learner can
 * spend: weeks, study sessions, and hours — all arithmetic on the availability
 * they saved, never a projection of what their score will be.
 */
function useRunway({ daysLeft, weeklyCapacity, days, readiness, targetBand }) {
  return useMemo(() => {
    const weeksLeft = daysLeft > 0 ? daysLeft / 7 : 0;
    const sessionsPerWeek = days.filter((day) => day.tasks.length > 0).length;
    const target = Number(targetBand) || 7;

    const belowTarget = MODULES.filter((module) => {
      const median = readiness?.modules?.[module]?.median;
      return median === null || median === undefined || Number(median) < target;
    });

    const largestGap = belowTarget
      .map((module) => {
        const median = readiness?.modules?.[module]?.median;
        const scored = median !== null && median !== undefined;
        return { module, gap: scored ? Number((target - Number(median)).toFixed(1)) : null };
      })
      .sort((a, b) => (b.gap ?? -1) - (a.gap ?? -1))[0];

    return {
      weeksLeft: Math.max(0, Math.round(weeksLeft * 10) / 10),
      sessionsLeft: Math.max(0, Math.round(weeksLeft * sessionsPerWeek)),
      minutesLeft: Math.max(0, Math.round(weeksLeft * Number(weeklyCapacity || 0))),
      belowTarget,
      largestGap,
      target,
    };
  }, [daysLeft, weeklyCapacity, days, readiness, targetBand]);
}

/**
 * One runway figure: label on the left, number on a shared right edge.
 *
 * No qualifier column. "Weeks left … to exam day" says the same thing twice,
 * and the three qualifiers wrapped to two lines each in this column, making
 * every row a different height. The footnote below carries the one thing they
 * actually added — where these numbers come from — once.
 */
function RunwayRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <IconChip icon={icon} size="sm" />
      <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </p>
      <p
        className={cn(
          NUM,
          'shrink-0 text-xs font-extrabold leading-none text-slate-900 dark:text-white'
        )}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Exam countdown.
 *
 * Replaces the old AI coach note, which restated what the plan guide already
 * says. This answers the question that note never did: how much time is left,
 * how much study that time actually buys at the learner's own saved pace, and
 * which subject is furthest from the target with that runway in hand.
 */
export default function ExamCountdownPanel({
  examDate,
  examDatePassed = false,
  daysLeft,
  weeklyCapacity,
  targetBand = 7,
  readiness,
  days = [],
  onCustomize,
  className,
}) {
  const runway = useRunway({ daysLeft, weeklyCapacity, days, readiness, targetBand });
  const examLabel = formatExamDate(examDate);
  const hasDate = !examDatePassed && Number.isFinite(daysLeft) && daysLeft !== null && daysLeft > 0;

  // Fraction of a 12-week preparation window already spent — the usual planning
  // horizon for a band jump, and the only way "24 days" means anything visually.
  const windowUsed = hasDate ? Math.max(0, Math.min(100, ((84 - daysLeft) / 84) * 100)) : 0;
  const urgency = !hasDate ? 'neutral' : daysLeft <= 14 ? 'fault' : daysLeft <= 30 ? 'warn' : 'ok';
  const URGENCY_TEXT = {
    fault: 'text-[rgb(var(--signal-fault))]',
    warn: 'text-[rgb(var(--signal-warn))]',
    ok: 'text-[rgb(var(--signal-ok))]',
    neutral: 'text-slate-900 dark:text-white',
  };
  const URGENCY_FILL = {
    fault: 'bg-[rgb(var(--signal-fault))]',
    warn: 'bg-[rgb(var(--signal-warn))]',
    ok: 'bg-[rgb(var(--signal-ok))]',
    neutral: 'bg-slate-300 dark:bg-white/20',
  };

  return (
    <section
      className={cn(PANEL, 'flex h-full flex-col p-4 sm:p-5', className)}
      aria-labelledby="countdown-title"
    >
      <PanelTitle
        label="Time until your exam"
        accent
        tip="Study time left is the weekly availability you set multiplied by the weeks remaining. It is not a score prediction."
        action={
          <Pill tone={urgency === 'neutral' ? 'neutral' : urgency}>
            {!hasDate
              ? 'No exam date'
              : daysLeft <= 14
                ? 'Final stretch'
                : daysLeft <= 30
                  ? 'Under a month'
                  : 'On schedule'}
          </Pill>
        }
      />

      {!hasDate ? (
        <div className={cn(TILE, 'flex flex-1 flex-col justify-center p-4')}>
          <Empty icon={CalendarPlus}>
            {examDatePassed
              ? 'Your saved exam date has passed. Set the new one to rebuild your timeline.'
              : 'Add your exam date and every stage, deadline, and study estimate lines up behind it.'}
          </Empty>
          <button
            type="button"
            onClick={onCustomize}
            className="mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#5a63df] px-4 text-sm font-bold text-white transition-colors hover:bg-[#4a52c9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
          >
            {examDatePassed ? 'Choose a new date' : 'Set exam date'}{' '}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <p id="countdown-title" className={cn('text-xs font-medium leading-relaxed', MUTED)}>
            {examLabel}
          </p>

          <div className="mt-3 flex items-end gap-2">
            <span
              className={cn(NUM, 'text-4xl font-extrabold leading-none', URGENCY_TEXT[urgency])}
            >
              {daysLeft}
            </span>
            <span className="pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              days left
            </span>
          </div>

          <div className={cn('mt-2.5 h-1.5 w-full overflow-hidden rounded-full', WELL)}>
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-700 ease-out',
                URGENCY_FILL[urgency]
              )}
              style={{ width: `${windowUsed}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {Math.round(windowUsed)}% through a typical 12-week preparation window
          </p>

          {/* Three rows, not three columns. This panel is at its *narrowest* on
              the widest screens — it takes the 1fr column of the closing
              three-up row — so viewport breakpoints run backwards here and no
              column split survives: "Study time left" clipped to "STUDY TI…"
              and "5h 43m" wrapped mid-value. Stacked, every label is whole and
              the numbers share one right edge, which is what makes a column of
              figures scannable in the first place. */}
          <div
            className={cn(
              TILE,
              'mt-4 divide-y divide-[#eeedf7] overflow-hidden dark:divide-white/[0.07]'
            )}
          >
            {[
              { icon: CalendarDays, label: 'Weeks left', value: runway.weeksLeft },
              { icon: Layers, label: 'Sessions left', value: runway.sessionsLeft },
              { icon: Clock3, label: 'Study time left', value: formatMinutes(runway.minutesLeft) },
            ].map((row) => (
              <RunwayRow key={row.label} {...row} />
            ))}
          </div>
          <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-slate-400 dark:text-slate-500">
            Sessions and study time are the weekly availability you set, spread across the weeks
            left.
          </p>

          <div
            className={cn(
              TILE,
              'mt-auto flex items-start gap-2.5 border-amber-200/70 bg-amber-50/40 p-3.5 shadow-2xs dark:border-amber-500/20 dark:bg-amber-500/6 sm:mt-4'
            )}
          >
            <IconChip
              icon={Flag}
              size="md"
              tone={runway.belowTarget.length ? 'amber' : 'emerald'}
            />
            <div className="min-w-0">
              <p className={cn(MICRO, 'text-amber-800 dark:text-amber-400')}>
                What that time has to cover
              </p>
              <p className="mt-0.5 text-xs font-bold leading-snug text-slate-900 dark:text-white">
                {runway.belowTarget.length === 0
                  ? `All four subjects already sit at band ${runway.target.toFixed(1)} or above.`
                  : `${runway.belowTarget.length} of 4 subjects still below band ${runway.target.toFixed(1)}.`}
              </p>
              {runway.largestGap && (
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                  {runway.largestGap.gap === null
                    ? `${getModuleStyle(runway.largestGap.module).label} has no score yet — a level check there is worth more than more practice.`
                    : `Biggest gap is ${getModuleStyle(runway.largestGap.module).label}, ${runway.largestGap.gap.toFixed(1)} band below target.`}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCustomize}
            className="group mt-2.5 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#e2e5f2] bg-white px-4 text-xs font-bold text-slate-600 shadow-xs transition-all duration-150 ease-smooth-out hover:border-[#5a63df]/35 hover:bg-[#f4f3fb] hover:text-slate-900 hover:shadow-sm active:scale-[0.98] active:bg-[#edeafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 motion-reduce:transform-none dark:border-white/11 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-[#8f97ff] dark:focus-visible:ring-offset-[#141319]"
          >
            <CalendarDays className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-6 motion-reduce:transform-none" />{' '}
            Change exam date or study time
          </button>
        </>
      )}
    </section>
  );
}

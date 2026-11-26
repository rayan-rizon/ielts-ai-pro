import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM } from '@/features/dashboard/components/primitives';
import { getMoveBlock, shiftDateKey } from './studyPlanModel';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

const monthStart = (dateKey) => `${dateKey.slice(0, 7)}-01`;
const shiftMonth = (key, delta) => {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1, 12));
  return date.toISOString().slice(0, 10);
};

function buildCells(monthKey) {
  const first = new Date(`${monthKey}T12:00:00Z`);
  const lead = (first.getUTCDay() + 6) % 7;
  const length = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)
  ).getUTCDate();
  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length }, (_, index) => shiftDateKey(monthKey, index)),
  ];
}

/** "Pick a date" button + month popover. Days the task cannot move to are muted, not clickable. */
export default function MoveCalendar({ task, days, availability, todayKey, onPick }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(monthStart(todayKey));
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (
        event.type === 'keydown' ? event.key === 'Escape' : !rootRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const cells = useMemo(() => buildCells(month), [month]);
  const lastMonth = monthStart(shiftDateKey(todayKey, 30));
  const label = new Date(`${month}T12:00:00Z`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const navButton =
    'flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-[transform,background-color,color] duration-150 hover:bg-[#f1f0fb] hover:text-[#5a63df] active:scale-95 disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-white/10';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[#e4e2f0] bg-white px-2 text-[11px] font-semibold text-slate-600 transition-[transform,border-color,color] duration-150 hover:border-[#5a63df] hover:text-[#5a63df] active:scale-[0.97] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
      >
        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
        Pick a date
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a day to move this task to"
          className="absolute right-0 top-9 z-30 w-[260px] origin-top-right rounded-xl border border-[#e4e2f0] bg-white p-3 dark:border-white/10 dark:bg-[#141319]"
          style={{ animation: `move-cal-in 160ms ${EASE}` }}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{label}</p>
            <div className="flex">
              <button
                type="button"
                aria-label="Previous month"
                className={navButton}
                disabled={month <= monthStart(todayKey)}
                onClick={() => setMonth(shiftMonth(month, -1))}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                className={navButton}
                disabled={month >= lastMonth}
                onClick={() => setMonth(shiftMonth(month, 1))}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((name, index) => (
              <span key={index} className="py-1 text-[10px] font-semibold text-slate-400">
                {name}
              </span>
            ))}
            {cells.map((dateKey, index) => {
              if (!dateKey) return <span key={`blank-${index}`} />;
              const current = dateKey === task.scheduled_date;
              const reason = current
                ? null
                : getMoveBlock({ task, dateKey, days, availability, todayKey });
              const blocked = Boolean(reason);
              return (
                <button
                  key={dateKey}
                  type="button"
                  aria-disabled={blocked || current}
                  aria-pressed={current}
                  title={current ? 'Current day' : reason || undefined}
                  onClick={() => {
                    if (blocked || current) return;
                    onPick(dateKey);
                    setOpen(false);
                  }}
                  className={cn(
                    NUM,
                    'flex h-8 items-center justify-center rounded-lg text-xs font-semibold transition-[transform,background-color,color] duration-150',
                    current && 'bg-[#5a63df] text-white',
                    blocked &&
                      (reason === 'Day is full'
                        ? 'cursor-not-allowed bg-[rgb(var(--signal-warn)/0.12)] text-[rgb(var(--signal-warn))]'
                        : 'cursor-not-allowed text-slate-300 dark:text-slate-600'),
                    !blocked &&
                      !current &&
                      'text-slate-800 hover:bg-[#eceafc] hover:text-[#4a52c9] active:scale-95 dark:text-slate-100 dark:hover:bg-white/10',
                    dateKey === todayKey && !current && 'ring-1 ring-inset ring-[#5a63df]/40'
                  )}
                >
                  {Number(dateKey.slice(8))}
                </button>
              );
            })}
          </div>

          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#eceafa] pt-2 text-[11px] text-slate-500 dark:border-white/[0.07] dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"
                aria-hidden="true"
              />
              Rest day
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full bg-[rgb(var(--signal-warn))]"
                aria-hidden="true"
              />
              Already full
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

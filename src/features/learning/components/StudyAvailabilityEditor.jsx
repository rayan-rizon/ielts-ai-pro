import React, { useMemo } from 'react';
import { Clock3 } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  getWeeklyCapacity,
  normalizeStudyAvailability,
  STUDY_DAYS,
} from '../../../../supabase/functions/_shared/learningPathV2';

const DAY_LABELS = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export default function StudyAvailabilityEditor({
  value,
  onChange,
  legacyWeeklyHours = 10,
  compact = false,
}) {
  const availability = useMemo(
    () =>
      normalizeStudyAvailability(
        value,
        legacyWeeklyHours,
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      ),
    [value, legacyWeeklyHours]
  );
  const weeklyMinutes = getWeeklyCapacity(availability);

  const updateDays = (days) => onChange?.({ ...availability, days });
  const toggleDay = (day) => {
    const days = { ...availability.days };
    if (days[day]) delete days[day];
    else days[day] = 45;
    updateDays(days);
  };
  const updateMinutes = (day, rawValue) => {
    const minutes = Math.max(20, Math.min(240, Math.round(Number(rawValue) || 20)));
    updateDays({ ...availability.days, [day]: minutes });
  };

  return (
    <fieldset className={cn('space-y-4', compact && 'space-y-3')}>
      <legend className="sr-only">Weekly study availability</legend>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Available study days
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            The plan never schedules more than these limits.
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#5a63df]/20 bg-[#5a63df]/10 px-3 py-1 text-xs font-mono tabular-nums font-bold text-[#5a63df] dark:border-[#8f97ff]/20 dark:bg-[#8f97ff]/15 dark:text-[#a9afff]">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          {Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}m/week
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
        {STUDY_DAYS.map((day) => {
          const selected = Boolean(availability.days[day]);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleDay(day)}
              className={cn(
                'rounded-lg border px-2 py-2 text-xs font-mono font-bold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:focus-visible:ring-[#8f97ff]',
                selected
                  ? 'border-[#5a63df] bg-[#5a63df] text-white shadow-xs'
                  : 'border-[#e4e2f0] bg-[#f4f3fb] text-slate-600 hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:border-white/10 dark:bg-white/4 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-slate-200'
              )}
            >
              {DAY_LABELS[day]}
            </button>
          );
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {STUDY_DAYS.filter((day) => availability.days[day]).map((day) => (
          <label
            key={day}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#ebeaf7] bg-[#fbfbfe] px-3.5 py-2.5 dark:border-white/[0.07] dark:bg-white/3"
          >
            <span className="text-xs font-extrabold capitalize text-slate-800 dark:text-slate-200">
              {day}
            </span>
            <span className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 font-medium">
              <input
                type="number"
                min="20"
                max="240"
                step="5"
                value={availability.days[day]}
                onChange={(event) => updateMinutes(day, event.target.value)}
                className="h-8 w-20 rounded-lg border border-[#e4e2f0] bg-white px-2.5 text-right font-mono tabular-nums font-bold text-slate-900 outline-none focus:border-[#5a63df] focus:ring-1 focus:ring-[#5a63df]/20 dark:border-white/10 dark:bg-[#141319] dark:text-white dark:focus:border-[#8f97ff] dark:focus:ring-[#8f97ff]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label={`${day} available minutes`}
              />
              min
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

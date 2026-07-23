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
          <p className="text-sm font-bold text-slate-900 dark:text-white">Available study days</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The plan never schedules more than these limits.
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          {Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}m/week
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {STUDY_DAYS.map((day) => {
          const selected = Boolean(availability.days[day]);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleDay(day)}
              className={cn(
                'rounded-xl border px-2 py-2.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
                selected
                  ? 'border-violet-500 bg-violet-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-violet-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
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
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/5"
          >
            <span className="text-xs font-semibold capitalize text-slate-700 dark:text-slate-200">
              {day}
            </span>
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <input
                type="number"
                min="20"
                max="240"
                step="5"
                value={availability.days[day]}
                onChange={(event) => updateMinutes(day, event.target.value)}
                className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-right font-bold text-slate-900 outline-none focus:ring-2 focus:ring-violet-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
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

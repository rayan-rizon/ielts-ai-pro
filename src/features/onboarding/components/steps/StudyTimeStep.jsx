import React from 'react';
import { CalendarClock } from 'lucide-react';
import StudyAvailabilityEditor from '@/features/learning/components/StudyAvailabilityEditor';

export default function StudyTimeStep({ studyHoursGoal, studyAvailability, onChangeAvailability }) {
  return (
    <div className="space-y-5 py-2">
      <div className="flex gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-400/20 dark:bg-violet-500/10">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm dark:bg-slate-900 dark:text-violet-300">
          <CalendarClock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-black text-slate-900 dark:text-white">
            Choose realistic days and minutes
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
            Rest days stay empty. Your plan may use less time, but it will never silently exceed a
            day’s limit.
          </p>
        </div>
      </div>
      <StudyAvailabilityEditor
        value={studyAvailability}
        legacyWeeklyHours={studyHoursGoal}
        onChange={onChangeAvailability}
        compact
      />
    </div>
  );
}

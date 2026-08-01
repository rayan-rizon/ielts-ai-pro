import React from 'react';
import { CalendarClock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, MUTED, TILE } from '@/features/dashboard/components/primitives';
import StudyAvailabilityEditor from '@/features/learning/components/StudyAvailabilityEditor';

export default function StudyTimeStep({ studyHoursGoal, studyAvailability, onChangeAvailability }) {
  return (
    <div className="space-y-3.5 py-2">
      <div className={cn(TILE, 'flex gap-3 p-3.5')}>
        <IconChip icon={CalendarClock} tone="accent" size="md" className="mt-0.5" />
        <div>
          <p className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100">
            Choose realistic days and minutes
          </p>
          <p className={cn('mt-1 text-[12px] leading-5', MUTED)}>
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

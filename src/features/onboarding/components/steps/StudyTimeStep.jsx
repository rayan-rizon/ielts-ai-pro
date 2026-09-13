import React from 'react';
import { CalendarClock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  IconChip,
  MICRO,
  MUTED,
  NUM,
  TILE,
  WELL,
} from '@/features/dashboard/components/primitives';
import StudyAvailabilityEditor from '@/features/learning/components/StudyAvailabilityEditor';

export default function StudyTimeStep({ studyHoursGoal, studyAvailability, onChangeAvailability }) {
  const activeDaysCount = Object.keys(studyAvailability?.days || {}).length;
  const totalWeeklyMinutes = Object.values(studyAvailability?.days || {}).reduce(
    (sum, m) => sum + (Number(m) || 0),
    0
  );
  const totalWeeklyHours = (totalWeeklyMinutes / 60).toFixed(1);

  return (
    <div className="space-y-3 py-1">
      <StudyAvailabilityEditor
        value={studyAvailability}
        legacyWeeklyHours={studyHoursGoal}
        onChange={onChangeAvailability}
        compact
      />

      <div className={cn(WELL, 'flex items-center justify-between rounded-lg px-3.5 py-2')}>
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 dark:text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-[#5a63df] dark:text-[#a9afff]" />
          <span>Planned commitment:</span>
        </div>
        <span className={cn(NUM, 'text-[12px] font-black text-slate-900 dark:text-white')}>
          {activeDaysCount} {activeDaysCount === 1 ? 'day' : 'days'} / week · {totalWeeklyHours} hrs
        </span>
      </div>
    </div>
  );
}

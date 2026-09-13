import React, { useState } from 'react';
import { m } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addWeeks, differenceInDays } from 'date-fns';
import {
  CalendarIcon,
  Check,
  ChevronRight,
  Clock,
  Compass,
  Sparkles,
  Timer,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  IconChip,
  MICRO,
  MUTED,
  NUM,
  TILE,
  WELL,
} from '@/features/dashboard/components/primitives';

const timelineOptions = [
  {
    id: '2weeks',
    label: '2 weeks',
    weeks: 2,
    description: 'Intensive sprint',
    icon: Zap,
  },
  {
    id: '1month',
    label: '1 month',
    weeks: 4,
    description: 'Focused study',
    icon: Timer,
  },
  {
    id: '2months',
    label: '2 months',
    weeks: 8,
    description: 'Balanced pace',
    badge: 'Recommended',
    badgeTone: 'ok',
    icon: CalendarIcon,
  },
  {
    id: '3months',
    label: '3 months',
    weeks: 12,
    description: 'Comprehensive prep',
    badge: 'Best Results',
    badgeTone: 'accent',
    icon: Compass,
  },
];

function TimelineOptionButton({ option, timelineType, estimatedWeeks, onChangeTimeline }) {
  const isSelected = timelineType === 'estimated' && estimatedWeeks === option.weeks;
  const Icon = option.icon || Timer;

  return (
    <button
      type="button"
      onClick={() =>
        onChangeTimeline({
          timeline_type: 'estimated',
          estimated_weeks: option.weeks,
          test_date: null,
        })
      }
      className={cn(
        'relative flex flex-col justify-between gap-1.5 rounded-xl p-3 text-left transition-all duration-200 active:scale-[0.98]',
        'border border-[#dedbea] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03),0_4px_12px_-2px_rgba(15,23,42,0.04)]',
        'dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none',
        isSelected
          ? 'border-[#5a63df] bg-[#5a63df]/[0.06] shadow-[0_2px_12px_-2px_rgba(90,99,223,0.16)] dark:border-[#8f97ff] dark:bg-[#8f97ff]/15 dark:shadow-none'
          : 'hover:-translate-y-0.5 hover:border-[#5a63df]/40 hover:shadow-[0_4px_16px_-2px_rgba(15,23,42,0.07),0_8px_24px_-4px_rgba(90,99,223,0.06)] dark:hover:border-white/20'
      )}
    >
      <div className="flex items-start justify-between">
        <IconChip icon={Icon} tone={isSelected ? 'accent' : 'neutral'} size="sm" />
        {option.badge && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider',
              option.badgeTone === 'accent'
                ? 'border border-[#5a63df]/30 bg-[#5a63df]/8 text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/12 dark:text-[#b8bdff]'
                : 'border border-[rgb(var(--signal-ok))/0.3] bg-[rgb(var(--signal-ok))/0.06] text-[rgb(var(--signal-ok))] dark:border-[rgb(var(--signal-ok))/0.25] dark:bg-[rgb(var(--signal-ok))/0.10]'
            )}
          >
            {option.badge}
          </span>
        )}
      </div>

      <div>
        <p className="text-[13px] font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
          {option.label}
        </p>
        <p className={cn(MICRO, MUTED, 'mt-0.5 text-[10px] normal-case tracking-normal')}>
          {option.description}
        </p>
      </div>

      {isSelected && (
        <span className="absolute right-2 bottom-2 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#5a63df]">
          <Check className="h-2 w-2 stroke-3 text-white" />
        </span>
      )}
    </button>
  );
}

function SpecificDatePicker({ timelineType, testDate, onChangeTimeline }) {
  const isSpecific = timelineType === 'specific';
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={() => onChangeTimeline({ timeline_type: 'specific', estimated_weeks: null })}
          className={cn(
            'flex w-full items-center justify-between rounded-xl p-3 text-left transition-all duration-200 active:scale-[0.99]',
            'border border-[#dedbea] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03),0_4px_12px_-2px_rgba(15,23,42,0.04)]',
            'dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none',
            isSpecific
              ? 'border-[#5a63df] bg-[#5a63df]/[0.06] shadow-[0_2px_12px_-2px_rgba(90,99,223,0.16)] dark:border-[#8f97ff] dark:bg-[#8f97ff]/15 dark:shadow-none'
              : 'hover:border-[#5a63df]/40 hover:shadow-[0_4px_16px_-2px_rgba(15,23,42,0.07),0_8px_24px_-4px_rgba(90,99,223,0.06)] dark:hover:border-white/20'
          )}
        >
          <div className="flex items-center gap-2.5">
            <IconChip icon={CalendarIcon} tone={isSpecific ? 'accent' : 'neutral'} size="sm" />
            <div>
              <p className="text-[12.5px] font-extrabold text-slate-900 dark:text-slate-100">
                {isSpecific && testDate
                  ? format(new Date(testDate), 'EEEE, MMMM d, yyyy')
                  : 'Pick a specific test date'}
              </p>
              <p className={cn(MICRO, MUTED, 'text-[10px] normal-case tracking-normal')}>
                {isSpecific && testDate
                  ? 'Exact exam date locked in'
                  : 'Calendar view for registered test takers'}
              </p>
            </div>
          </div>
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 text-slate-400 transition-transform duration-200 dark:text-slate-400',
              open && 'rotate-90'
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-100 w-auto overflow-hidden rounded-xl border border-[#e4e2f0] bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#131315]"
        align="center"
        side="bottom"
        sideOffset={8}
      >
        <Calendar
          mode="single"
          selected={testDate ? new Date(testDate) : undefined}
          onSelect={(date) => {
            onChangeTimeline({ timeline_type: 'specific', test_date: date });
            setOpen(false);
          }}
          disabled={(date) => date < new Date()}
          className="rounded-lg"
        />
      </PopoverContent>
    </Popover>
  );
}

export default function TimelineStep({ timelineType, estimatedWeeks, testDate, onChangeTimeline }) {
  const daysRemaining =
    timelineType === 'specific' && testDate
      ? differenceInDays(new Date(testDate), new Date())
      : null;

  return (
    <div className="space-y-3 py-1">
      <div className="grid grid-cols-2 gap-2.5">
        {timelineOptions.map((option) => (
          <TimelineOptionButton
            key={option.id}
            option={option}
            timelineType={timelineType}
            estimatedWeeks={estimatedWeeks}
            onChangeTimeline={onChangeTimeline}
          />
        ))}
      </div>

      <SpecificDatePicker
        timelineType={timelineType}
        testDate={testDate}
        onChangeTimeline={onChangeTimeline}
      />

      {timelineType === 'specific' && testDate && (
        <m.div
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(WELL, 'flex items-center justify-between rounded-lg px-3.5 py-2')}
        >
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-700 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5 text-[#5a63df] dark:text-[#a9afff]" />
            <span>Countdown to exam:</span>
          </div>
          <span className={cn(NUM, 'text-[11.5px] font-black text-[#5a63df] dark:text-[#a9afff]')}>
            {daysRemaining !== null ? `${daysRemaining} days remaining` : 'Scheduled'}
          </span>
        </m.div>
      )}

      {timelineType === 'estimated' && estimatedWeeks && (
        <m.div
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(WELL, 'flex items-center justify-between rounded-lg px-3.5 py-2')}
        >
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-700 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-[#5a63df] dark:text-[#a9afff]" />
            <span>Target completion milestone:</span>
          </div>
          <span className={cn(NUM, 'text-[11.5px] font-black text-slate-800 dark:text-slate-200')}>
            {format(addWeeks(new Date(), estimatedWeeks), 'MMMM d, yyyy')}
          </span>
        </m.div>
      )}
    </div>
  );
}

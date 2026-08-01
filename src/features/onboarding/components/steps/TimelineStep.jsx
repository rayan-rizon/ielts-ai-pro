import React, { useState } from 'react';
import { m } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addWeeks } from 'date-fns';
import { CalendarIcon, Check, ChevronRight, Timer } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, MICRO, MUTED, NUM, TILE } from '@/features/dashboard/components/primitives';

const timelineOptions = [
  { id: '2weeks', label: '2 weeks', weeks: 2, description: 'Intensive prep' },
  { id: '1month', label: '1 month', weeks: 4, description: 'Focused study' },
  { id: '2months', label: '2 months', weeks: 8, description: 'Balanced pace' },
  { id: '3months', label: '3 months', weeks: 12, description: 'Comprehensive' },
];

function TimelineOptionButton({ option, timelineType, estimatedWeeks, onChangeTimeline }) {
  const isSelected = timelineType === 'estimated' && estimatedWeeks === option.weeks;
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
        TILE,
        'relative flex flex-col gap-2 p-3.5 text-left transition-all duration-200',
        isSelected
          ? 'border-[#5a63df]/50 bg-[#5a63df]/[0.06] dark:bg-[#5a63df]/10'
          : 'hover:-translate-y-0.5 hover:border-[#c9cdf3] hover:shadow-sm dark:hover:border-white/[0.15]'
      )}
    >
      <IconChip icon={Timer} tone={isSelected ? 'accent' : 'neutral'} size="md" />
      <div>
        <p className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100">
          {option.label}
        </p>
        <p className={cn(MICRO, MUTED, 'mt-0.5 normal-case tracking-normal')}>
          {option.description}
        </p>
      </div>
      {isSelected && (
        <span className="absolute right-2.5 top-2.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#5a63df]">
          <Check className="h-2.5 w-2.5 stroke-[3] text-white" />
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
            TILE,
            'flex w-full items-center justify-between p-3.5 text-left transition-all duration-200',
            isSpecific
              ? 'border-[#5a63df]/50 bg-[#5a63df]/[0.06] dark:bg-[#5a63df]/10'
              : 'hover:border-[#c9cdf3] dark:hover:border-white/[0.15]'
          )}
        >
          <div className="flex items-center gap-3">
            <IconChip icon={CalendarIcon} tone={isSpecific ? 'accent' : 'neutral'} size="md" />
            <div>
              <p className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100">
                {isSpecific && testDate ? format(testDate, 'PPP') : 'Pick a specific date'}
              </p>
              <p className={cn(MICRO, MUTED, 'mt-0.5 normal-case tracking-normal')}>
                For detailed scheduling
              </p>
            </div>
          </div>
          <ChevronRight
            className={cn(
              'h-4 w-4 text-slate-300 transition-transform duration-200 dark:text-slate-600',
              open && 'rotate-90'
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[100] w-auto overflow-hidden rounded-xl border border-[#e4e2f0] bg-white p-1 dark:border-white/10 dark:bg-[#141319]"
        align="center"
        side="bottom"
        sideOffset={8}
      >
        <Calendar
          mode="single"
          selected={testDate || undefined}
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
  return (
    <div className="space-y-4 py-2">
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

      {timelineType === 'estimated' && estimatedWeeks && (
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(MICRO, MUTED, 'pt-1 text-center normal-case tracking-normal')}
        >
          Estimated exam date:{' '}
          <span className={cn(NUM, 'font-bold text-slate-700 dark:text-slate-200')}>
            {format(addWeeks(new Date(), estimatedWeeks), 'MMMM d, yyyy')}
          </span>
        </m.p>
      )}
    </div>
  );
}

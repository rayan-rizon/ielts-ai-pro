import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addWeeks } from 'date-fns';
import { CalendarIcon, ChevronRight, Timer, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const timelineOptions = [
  { id: '2weeks', label: '2 Weeks', weeks: 2, description: 'Intensive prep' },
  { id: '1month', label: '1 Month', weeks: 4, description: 'Focused study' },
  { id: '2months', label: '2 Months', weeks: 8, description: 'Balanced pace' },
  { id: '3months', label: '3 Months', weeks: 12, description: 'Comprehensive' },
];

function TimelineOptionButton({ option, timelineType, estimatedWeeks, onChangeTimeline }) {
  const isSelected = timelineType === 'estimated' && estimatedWeeks === option.weeks;
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        onChangeTimeline({
          timeline_type: 'estimated',
          estimated_weeks: option.weeks,
          test_date: null,
        });
      }}
      className={cn(
        'relative p-3 rounded-xl border-2 transition-all duration-300 text-left group overflow-hidden',
        isSelected
          ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xl shadow-primary/10'
          : 'border-border bg-card/50 dark:bg-slate-800 dark:border-slate-700 hover:dark:bg-slate-800/80 hover:border-primary/40'
      )}
      data-oid="7v4s.mk"
    >
      <div className="relative z-10 flex flex-col h-full" data-oid="kx2vg5w">
        <div
          className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 transition-all duration-300',
            isSelected
              ? 'bg-primary text-white'
              : 'bg-secondary dark:bg-white/10 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
          )}
          data-oid="f8z9rf_"
        >
          <Timer className="w-3.5 h-3.5" data-oid="zone9tj" />
        </div>
        <div
          className={cn(
            'text-sm font-black tracking-tight mb-0.5',
            isSelected
              ? 'text-foreground dark:text-white'
              : 'text-muted-foreground dark:text-slate-300 group-hover:text-foreground dark:group-hover:text-white'
          )}
          data-oid="m:2_p9z"
        >
          {option.label}
        </div>
        <div
          className="text-[10px] text-muted-foreground dark:text-slate-400 font-medium"
          data-oid="dmrfpgu"
        >
          {option.description}
        </div>
      </div>

      {isSelected && (
        <div className="absolute top-3 right-3 animate-in zoom-in duration-300" data-oid=":sebd-8">
          <div
            className="w-4 h-4 rounded-full bg-primary flex items-center justify-center"
            data-oid="3whk46n"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-white" data-oid=".42bl6i" />
          </div>
        </div>
      )}
    </motion.button>
  );
}

function SpecificDatePicker({ timelineType, testDate, onChangeTimeline }) {
  const isSpecific = timelineType === 'specific';
  const [open, setOpen] = useState(false);

  return (
    <div className="px-2" data-oid="ts5xga2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full h-14 rounded-xl border-2 flex items-center justify-between px-5 transition-all duration-300',
              isSpecific
                ? 'border-primary bg-primary/5 dark:bg-primary/10 text-foreground ring-1 ring-primary/20'
                : 'border-border bg-card/50 dark:bg-slate-800 dark:border-slate-700 hover:dark:bg-slate-800/80 hover:border-primary/40 text-muted-foreground dark:text-slate-300 hover:text-foreground'
            )}
            onClick={() => {
              onChangeTimeline({
                timeline_type: 'specific',
                estimated_weeks: null,
              });
            }}
            data-oid="2n7pke9"
          >
            <div className="flex items-center gap-3" data-oid="zf69p3p">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
                  isSpecific ? 'bg-primary text-white' : 'bg-secondary dark:bg-white/10'
                )}
                data-oid="bnu9o16"
              >
                <CalendarIcon className="w-4 h-4" data-oid="etwv1ry" />
              </div>
              <div className="text-left" data-oid="4j0x7ru">
                <div
                  className="text-sm font-black tracking-tight text-foreground dark:text-white"
                  data-oid="h7h6u4s"
                >
                  {isSpecific && testDate ? format(testDate, 'PPP') : 'Pick a specific date'}
                </div>
                <div
                  className="text-[10px] font-bold opacity-70 uppercase tracking-widest dark:text-slate-400"
                  data-oid="b:xz0n2"
                >
                  For detailed scheduling
                </div>
              </div>
            </div>
            <ChevronRight
              className={cn(
                'w-5 h-5 transition-transform duration-300',
                open ? 'rotate-90 opacity-40' : 'opacity-20'
              )}
              data-oid="p9x802u"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-1 bg-popover/95 backdrop-blur-xl border-border/50 rounded-3xl overflow-hidden shadow-2xl z-[100]"
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
            className="rounded-2xl"
            data-oid="3zu.i_9"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function TimelineStep({ timelineType, estimatedWeeks, testDate, onChangeTimeline }) {
  return (
    <div className="space-y-8 py-4" data-oid="-x4dz-d">
      <div className="grid grid-cols-2 gap-4 px-2" data-oid="dh5yx7y">
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-muted-foreground dark:text-slate-400 pt-4"
          data-oid="szi7:by"
        >
          Estimated exam date:{' '}
          <span className="text-foreground dark:text-white font-black" data-oid="z:ubbon">
            {format(addWeeks(new Date(), estimatedWeeks), 'MMMM d, yyyy')}
          </span>
        </motion.div>
      )}

      <p
        className="text-xs text-muted-foreground dark:text-slate-400 text-center pt-2"
        data-oid="l7jp32d"
      >
        💡 Consistency beats intensity. Pick a timeline you can stick to.
      </p>
    </div>
  );
}

import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';

export const ThemedDateTimePicker = ({
  value,
  onChange,
  placeholder = 'Select date & time',
  className,
  id,
}) => {
  const [open, setOpen] = useState(false);

  let dateObj = undefined;
  let hoursStr = '12';
  let minutesStr = '00';
  let ampmStr = 'PM';

  if (value) {
    try {
      const d = typeof value === 'string' ? new Date(value) : value;
      if (!isNaN(d.getTime())) {
        dateObj = d;
        let h = d.getHours();
        ampmStr = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        hoursStr = String(h).padStart(2, '0');
        minutesStr = String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, '0');
      }
    } catch {
      dateObj = undefined;
    }
  }

  const updateDateTime = (newDate, newHours, newMinutes, newAmpm) => {
    const targetDate = newDate || dateObj || new Date();
    let h = parseInt(newHours || hoursStr, 10);
    const m = parseInt(newMinutes || minutesStr, 10);
    const ap = newAmpm || ampmStr;

    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;

    const updated = new Date(targetDate);
    updated.setHours(h, m, 0, 0);

    onChange(updated.toISOString());
  };

  const handleSelectDate = (selectedDate) => {
    if (!selectedDate) {
      onChange('');
      return;
    }
    updateDateTime(selectedDate, hoursStr, minutesStr, ampmStr);
  };

  const formattedDisplay = dateObj ? format(dateObj, "MMM d, yyyy 'at' hh:mm a") : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-stone-300 bg-white px-3 text-xs font-medium text-stone-800 transition-colors hover:border-stone-400 dark:border-white/15 dark:bg-[#131315] dark:text-stone-100 dark:hover:border-white/30',
            !value && 'text-stone-400 dark:text-stone-500 font-normal',
            className
          )}
        >
          <span className="truncate">{formattedDisplay}</span>
          <div className="flex items-center gap-1 shrink-0 text-stone-500 dark:text-stone-400">
            <Calendar className="h-3.5 w-3.5" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border border-stone-200 dark:border-white/10 bg-white dark:bg-[#131315] text-stone-900 dark:text-stone-100 shadow-2xl rounded-xl z-50"
        align="start"
      >
        <CalendarComponent
          mode="single"
          selected={dateObj}
          onSelect={handleSelectDate}
          initialFocus
          className="rounded-xl border-0 p-3"
        />

        <div className="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-white/[0.08] p-3 bg-stone-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-1 text-[11px] font-medium text-stone-500 dark:text-stone-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Time</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Select
              value={hoursStr}
              onValueChange={(val) => updateDateTime(dateObj, val, minutesStr, ampmStr)}
            >
              <SelectTrigger className="h-7 w-[54px] px-1.5 text-xs bg-white dark:bg-[#1b1a20] border-stone-200 dark:border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-[#16151a] dark:border-white/10 max-h-48 z-50">
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                  <SelectItem key={h} value={h} className="text-xs cursor-pointer">
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-xs font-bold text-stone-400">:</span>

            <Select
              value={minutesStr}
              onValueChange={(val) => updateDateTime(dateObj, hoursStr, val, ampmStr)}
            >
              <SelectTrigger className="h-7 w-[54px] px-1.5 text-xs bg-white dark:bg-[#1b1a20] border-stone-200 dark:border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-[#16151a] dark:border-white/10 max-h-48 z-50">
                {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(
                  (m) => (
                    <SelectItem key={m} value={m} className="text-xs cursor-pointer">
                      {m}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            <Select
              value={ampmStr}
              onValueChange={(val) => updateDateTime(dateObj, hoursStr, minutesStr, val)}
            >
              <SelectTrigger className="h-7 w-[54px] px-1.5 text-xs bg-white dark:bg-[#1b1a20] border-stone-200 dark:border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-[#16151a] dark:border-white/10 z-50">
                <SelectItem value="AM" className="text-xs cursor-pointer">
                  AM
                </SelectItem>
                <SelectItem value="PM" className="text-xs cursor-pointer">
                  PM
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {value && (
          <div className="flex items-center justify-between border-t border-stone-100 dark:border-white/[0.08] p-2 px-3">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="text-[11px] font-bold text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded bg-[#5a63df] px-2.5 py-1 text-[11px] font-extrabold text-white shadow-2xs hover:bg-[#4c54c8]"
            >
              Done
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

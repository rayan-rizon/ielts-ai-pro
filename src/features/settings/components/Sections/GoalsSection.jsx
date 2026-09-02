import React from 'react';
import { m } from 'framer-motion';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/cn';
import StudyAvailabilityEditor from '@/features/learning/components/StudyAvailabilityEditor';
import { PANEL, PanelTitle, TILE } from '@/features/dashboard/components/primitives';

export default function GoalsSection({ formData, setFormData }) {
  const selectedDate = React.useMemo(() => {
    if (!formData.test_date) return undefined;
    const parsed = parseISO(formData.test_date);
    return isValid(parsed) ? parsed : undefined;
  }, [formData.test_date]);

  return (
    <m.div
      key="goals"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={cn(PANEL, 'p-4 sm:p-5')}
    >
      <PanelTitle label="Target score & exam date" accent />
      <p className="-mt-2 mb-4 text-xs font-medium text-slate-500 dark:text-slate-400">
        Configure your IELTS target band and exam timeline to optimize AI study recommendations.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Target band score
          </Label>
          <Select
            value={formData.target_band_score.toString()}
            onValueChange={(val) =>
              setFormData({ ...formData, target_band_score: parseFloat(val) })
            }
          >
            <SelectTrigger className="h-10 rounded-lg border-[#e2e5f2] bg-white text-sm font-bold dark:border-white/10 dark:bg-white/4">
              <SelectValue placeholder="Select band" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#e2e5f2] p-1 dark:border-white/10">
              {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((score) => (
                <SelectItem
                  key={score}
                  value={score.toString()}
                  className="rounded-md py-2 text-sm font-medium"
                >
                  Band {score}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Target exam date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex h-10 w-full items-center rounded-lg border border-[#e2e5f2] bg-white px-3 text-left text-sm font-bold transition-colors hover:border-[#c9cdf3] dark:border-white/10 dark:bg-white/4',
                  !formData.test_date && 'text-slate-400 font-medium'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-[#5a63df]" />
                {selectedDate ? (
                  <span className="font-bold text-slate-900 dark:text-white">
                    {format(selectedDate, 'MMM dd, yyyy')}
                  </span>
                ) : (
                  <span className="font-medium">Pick a target date</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden rounded-xl border-[#e2e5f2] bg-white p-0 dark:border-white/10 dark:bg-[#131315]"
              align="start"
            >
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) setFormData({ ...formData, test_date: format(date, 'yyyy-MM-dd') });
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mt-5 border-t border-[#eeedf7] pt-4 dark:border-white/[0.07]">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#5a63df]" />
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Study availability schedule
          </h4>
        </div>
        <div className={cn(TILE, 'p-3.5')}>
          <StudyAvailabilityEditor
            value={formData.study_availability}
            legacyWeeklyHours={formData.study_hours_goal}
            onChange={(study_availability) => setFormData({ ...formData, study_availability })}
          />
        </div>
      </div>
    </m.div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Target, Clock } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/cn';
import StudyAvailabilityEditor from '@/features/learning/components/StudyAvailabilityEditor';

export default function GoalsSection({ formData, setFormData }) {
  const selectedDate = React.useMemo(() => {
    if (!formData.test_date) return undefined;
    const parsed = parseISO(formData.test_date);
    return isValid(parsed) ? parsed : undefined;
  }, [formData.test_date]);

  return (
    <motion.div
      key="goals"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-white/5 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Target Score & Exam Date
            </h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Configure your IELTS target band and exam timeline to optimize AI study recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Target Band Score
            </Label>
            <Select
              value={formData.target_band_score.toString()}
              onValueChange={(val) =>
                setFormData({ ...formData, target_band_score: parseFloat(val) })
              }
            >
              <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-white/10 font-bold text-sm px-4">
                <SelectValue placeholder="Select Band" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 p-1">
                {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((score) => (
                  <SelectItem
                    key={score}
                    value={score.toString()}
                    className="rounded-lg font-medium py-2 text-sm"
                  >
                    Band {score}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Target Exam Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-11 justify-start text-left font-bold text-sm rounded-xl px-3.5 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all outline-none',
                    !formData.test_date && 'text-slate-400 font-medium'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500 shrink-0" />
                  {selectedDate ? (
                    <span className="text-slate-900 dark:text-white font-bold text-sm">
                      {format(selectedDate, 'MMM dd, yyyy')}
                    </span>
                  ) : (
                    <span className="text-sm font-medium">Pick a target date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 rounded-2xl border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden"
                align="start"
              >
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setFormData({ ...formData, test_date: format(date, 'yyyy-MM-dd') });
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Study Availability Schedule */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Study Availability Schedule
            </h4>
          </div>
          <div className="bg-slate-50/70 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-100 dark:border-white/5">
            <StudyAvailabilityEditor
              value={formData.study_availability}
              legacyWeeklyHours={formData.study_hours_goal}
              onChange={(study_availability) => setFormData({ ...formData, study_availability })}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

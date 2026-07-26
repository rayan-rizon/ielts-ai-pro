import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/cn';
import StudyAvailabilityEditor from '../StudyAvailabilityEditor';

export default function CustomizeGoalsModal({
  open,
  onOpenChange,
  goalDraft,
  setGoalDraft,
  savingGoals,
  onSaveGoals,
  user,
}) {
  const selectedDate = React.useMemo(() => {
    if (!goalDraft.test_date) return undefined;
    const parsed = parseISO(goalDraft.test_date);
    return isValid(parsed) ? parsed : undefined;
  }, [goalDraft.test_date]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-slate-200/80 bg-white sm:max-w-2xl dark:border-white/15 dark:bg-[#111324]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-950 dark:text-white">
            Customize your study plan
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Set your target, exam date, and realistic minute limits. Your schedule will never
            silently exceed them.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-black text-slate-700 dark:text-slate-200">
            <span>Target band score</span>
            <Input
              type="number"
              min="4"
              max="9"
              step="0.5"
              className="mt-1 h-10 rounded-xl font-bold"
              value={goalDraft.target_band_score}
              onChange={(event) =>
                setGoalDraft((draft) => ({
                  ...draft,
                  target_band_score: Number(event.target.value),
                }))
              }
            />
          </label>
          <div className="space-y-1 text-xs font-black text-slate-700 dark:text-slate-200">
            <span>Target exam date</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'mt-1 w-full h-10 justify-start text-left font-bold text-xs rounded-xl px-3 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all outline-none',
                    !goalDraft.test_date && 'text-slate-400'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500 shrink-0" />
                  {selectedDate ? (
                    <span className="text-slate-900 dark:text-white font-extrabold text-xs">
                      {format(selectedDate, 'MMM dd, yyyy')}
                    </span>
                  ) : (
                    <span>Pick target date</span>
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
                      setGoalDraft((draft) => ({
                        ...draft,
                        test_date: format(date, 'yyyy-MM-dd'),
                      }));
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <StudyAvailabilityEditor
          value={goalDraft.study_availability}
          legacyWeeklyHours={user?.study_hours_goal || 10}
          onChange={(study_availability) =>
            setGoalDraft((draft) => ({ ...draft, study_availability }))
          }
        />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold"
          >
            Cancel
          </Button>
          <Button
            onClick={onSaveGoals}
            disabled={savingGoals}
            className="rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            {savingGoals ? 'Recalculating…' : 'Save and recalculate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

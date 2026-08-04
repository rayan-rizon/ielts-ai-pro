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
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] sm:max-w-2xl p-6 shadow-none">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Customize your study plan
          </DialogTitle>
          <DialogDescription className="text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Set your target, exam date, and realistic minute limits. Your schedule will never
            silently exceed them.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
              Target band score
            </span>
            <Input
              type="number"
              min="4"
              max="9"
              step="0.5"
              className="mt-1 h-10 rounded-xl border border-[#e4e2f0] dark:border-white/10 bg-[#f4f3fb] dark:bg-white/[0.04] font-mono tabular-nums font-bold text-slate-900 dark:text-white focus:border-[#5a63df] focus:ring-1 focus:ring-[#5a63df]/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={goalDraft.target_band_score}
              onChange={(event) =>
                setGoalDraft((draft) => ({
                  ...draft,
                  target_band_score: Number(event.target.value),
                }))
              }
            />
          </label>
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
              Target exam date
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'mt-1 w-full h-10 justify-start text-left font-bold text-xs rounded-xl px-3 bg-[#f4f3fb] dark:bg-white/[0.04] border-[#e4e2f0] dark:border-white/10 hover:border-[#5a63df]/30 hover:bg-[#5a63df]/[0.05] transition-all outline-none',
                    !goalDraft.test_date && 'text-slate-400'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-[#5a63df] dark:text-[#8f97ff] shrink-0" />
                  {selectedDate ? (
                    <span className="text-slate-900 dark:text-white font-mono tabular-nums font-bold text-xs">
                      {format(selectedDate, 'MMM dd, yyyy')}
                    </span>
                  ) : (
                    <span>Pick target date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-white dark:bg-[#141319] overflow-hidden shadow-sm"
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

        <DialogFooter className="gap-2 pt-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-[#e4e2f0] dark:border-white/10 font-bold text-xs hover:bg-[#f4f3fb] dark:hover:bg-white/[0.04]"
          >
            Cancel
          </Button>
          <Button
            onClick={onSaveGoals}
            disabled={savingGoals}
            className="rounded-xl bg-[#5a63df] hover:bg-[#4850c8] font-bold text-xs text-white shadow-xs"
          >
            {savingGoals ? 'Recalculating…' : 'Save and recalculate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

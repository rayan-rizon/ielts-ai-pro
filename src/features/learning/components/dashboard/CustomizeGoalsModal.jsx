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
          <label className="space-y-2 text-xs font-black text-slate-700 dark:text-slate-200">
            Target band score
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
          <label className="space-y-2 text-xs font-black text-slate-700 dark:text-slate-200">
            Target exam date
            <Input
              type="date"
              className="mt-1 h-10 rounded-xl font-bold"
              value={goalDraft.test_date}
              onChange={(event) =>
                setGoalDraft((draft) => ({ ...draft, test_date: event.target.value }))
              }
            />
          </label>
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

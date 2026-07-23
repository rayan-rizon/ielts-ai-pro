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
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import StudyAvailabilityEditor from '@/features/learning/components/StudyAvailabilityEditor';

export default function GoalsSection({ formData, setFormData }) {
  return (
    <motion.div
      key="goals"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-white/5"
    >
      <h3 className="text-xl font-black mb-1">Target Score</h3>
      <p className="text-sm text-slate-500 mb-8 font-medium">Set your IELTS goals for the AI.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <Label className="text-xs font-black uppercase tracking-widest text-indigo-500">
            Target Score
          </Label>
          <Select
            value={formData.target_band_score.toString()}
            onValueChange={(val) =>
              setFormData({ ...formData, target_band_score: parseFloat(val) })
            }
          >
            <SelectTrigger className="h-16 rounded-2xl bg-white/50 dark:bg-slate-950/30 border-slate-200 dark:border-white/10 font-black text-2xl px-6">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-white/10 p-2">
              {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((score) => (
                <SelectItem
                  key={score}
                  value={score.toString()}
                  className="rounded-xl font-black py-3 text-xl"
                >
                  Band {score}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label className="text-xs font-black uppercase tracking-widest text-indigo-500">
            Target Exam Date
          </Label>
          <div className="relative">
            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500 pointer-events-none" />
            <Input
              type="date"
              className="h-16 rounded-2xl bg-white/50 dark:bg-slate-950/30 border-slate-200 dark:border-white/10 pl-16 pr-6 font-black text-lg focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
              value={formData.test_date}
              onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Explicit day-by-day availability; the legacy weekly total is derived when saving. */}
      <div className="mt-10 space-y-6 bg-slate-50 dark:bg-white/5 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/5">
        <StudyAvailabilityEditor
          value={formData.study_availability}
          legacyWeeklyHours={formData.study_hours_goal}
          onChange={(study_availability) => setFormData({ ...formData, study_availability })}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The older weekly-hours field remains only for compatibility and is recalculated from these
          minutes.
        </p>
      </div>
    </motion.div>
  );
}

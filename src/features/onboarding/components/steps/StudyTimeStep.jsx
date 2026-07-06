import React from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';

const studyHoursOptions = [
  { value: 5, label: '5 hrs', description: 'Light' },
  { value: 10, label: '10 hrs', description: 'Moderate' },
  { value: 15, label: '15 hrs', description: 'Dedicated' },
  { value: 20, label: '20+ hrs', description: 'Intensive' },
];

export default function StudyTimeStep({ studyHoursGoal, onChangeStudyHours }) {
  return (
    <div className="space-y-10 py-4" data-oid="ufzb:o-">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center relative"
        data-oid="ps2-m-3"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full -z-10"
          data-oid="p590iu-"
        />
        <div className="relative inline-flex flex-col items-center" data-oid="en:g_w_">
          <div className="relative" data-oid="3m0.tb8">
            <span className="text-7xl font-black bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent drop-shadow-sm dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400">
              {studyHoursGoal}
            </span>
            <span className="absolute left-full ml-1.5 bottom-2 text-2xl font-black bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent opacity-80 dark:opacity-90 whitespace-nowrap">
              hrs
            </span>
          </div>
          <Badge
            variant="secondary"
            className="mt-1.5 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-400/30"
            data-oid="h1sm:nb"
          >
            Weekly Commitment
          </Badge>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-3 px-2" data-oid="mq6vi.5">
        {studyHoursOptions.map((option) => {
          const isSelected = studyHoursGoal === option.value;
          return (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChangeStudyHours(option.value)}
              className={cn(
                'relative p-2 sm:p-3 rounded-xl border-2 transition-all duration-300 text-center group bg-transparent',
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-xl shadow-emerald-500/10'
                  : 'border-border bg-card/50 dark:bg-slate-800 dark:border-slate-700 hover:dark:bg-slate-800/80 hover:border-emerald-500/40'
              )}
              data-oid=".sg2kwu"
            >
              <div className="relative z-10 overflow-visible" data-oid="vmta9sn">
                <div
                  className={cn(
                    'text-xl font-black transition-colors mb-0.5',
                    isSelected
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-foreground/80 group-hover:text-emerald-500 dark:text-slate-300 dark:group-hover:text-emerald-400'
                  )}
                  data-oid="zj13ppr"
                >
                  {option.value}
                </div>
                <div
                  className="text-[8px] sm:text-[9px] font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-tighter sm:tracking-tight whitespace-nowrap"
                  data-oid="_wqd5qy"
                >
                  {option.description}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="px-6 space-y-4" data-oid="xzkvm-o">
        <Slider
          min={5}
          max={25}
          step={1}
          value={[studyHoursGoal]}
          onValueChange={(val) => onChangeStudyHours(val[0])}
          className="w-full"
          data-oid="v5:8xu:"
        />

        <div
          className="flex justify-between text-[10px] font-black text-muted-foreground dark:text-slate-400 uppercase tracking-widest px-1"
          data-oid="62du_ab"
        >
          <span data-oid="y0yr2e1">Steady</span>
          <span data-oid="4212tt0">Balanced</span>
          <span data-oid="rnnvmgn">Intensive</span>
        </div>
      </div>

      <div
        className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10 flex items-center gap-4 mx-2"
        data-oid="lc3.dai"
      >
        <div
          className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0"
          data-oid="uco5glj"
        >
          <Trophy className="w-5 h-5 text-emerald-600" data-oid="5k9_j8s" />
        </div>
        <p
          className="text-xs text-muted-foreground dark:text-slate-400 leading-snug"
          data-oid="ahf6zfc"
        >
          Learners who commit to{' '}
          <span className="text-foreground dark:text-white font-bold" data-oid="kt838:r">
            15+ hours
          </span>{' '}
          weekly are 3x more likely to reach Band 8.0.
        </p>
      </div>
    </div>
  );
}

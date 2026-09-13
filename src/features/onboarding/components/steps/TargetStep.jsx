import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Award, GraduationCap, Sparkles, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  IconChip,
  MICRO,
  MUTED,
  NUM,
  Pill,
  TILE,
} from '@/features/dashboard/components/primitives';
import { getBandLabel } from '@/features/analytics/utils';

const MARKS = [5.0, 6.0, 6.5, 7.0, 7.5, 8.0, 9.0];

function getTargetBenchmark(score) {
  if (score >= 8.5) return 'Elite University / Medical Registration & Native Fluency';
  if (score >= 7.5) return 'Top 20 Universities (Oxford, Cambridge, Ivy League) & Direct PR';
  if (score >= 7.0) return "Master's Degrees & Express Entry / High-Skilled Migration";
  if (score >= 6.5) return 'Standard University Admissions (UK, Canada, Australia)';
  if (score >= 6.0) return 'Undergraduate Foundation & Skilled Worker Visas';
  return 'General Vocational & Study Preparation Programs';
}

export default function TargetStep({ targetBandScore, onChangeTargetBand }) {
  const label = getBandLabel(targetBandScore);
  const benchmark = getTargetBenchmark(targetBandScore);

  return (
    <div className="space-y-4 py-1">
      {/* Target Score Display */}
      <div className="text-center">
        <div className="inline-flex flex-col items-center">
          <div
            className={cn(
              NUM,
              'text-5xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white'
            )}
          >
            {targetBandScore.toFixed(1)}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
            <Pill tone="accent" className="py-0.5 px-2.5 text-[10.5px]">
              Band {targetBandScore.toFixed(1)} · {label}
            </Pill>
          </div>
          <p className="mt-1.5 max-w-sm text-[12px] font-semibold text-slate-600 dark:text-slate-300">
            {benchmark}
          </p>
        </div>
      </div>

      <div className="space-y-3 px-1 pt-1">
        <div className="pt-2">
          <Slider
            min={4.0}
            max={9.0}
            step={0.5}
            value={[targetBandScore]}
            onValueChange={(val) => onChangeTargetBand(val[0])}
            className="w-full"
          />
        </div>
        <div className="flex justify-between px-1">
          {MARKS.map((score) => {
            const isActive = targetBandScore === score;
            return (
              <button
                key={score}
                type="button"
                onClick={() => onChangeTargetBand(score)}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-all duration-200',
                    isActive
                      ? 'scale-125 bg-[#5a63df] dark:bg-[#8f97ff]'
                      : 'bg-slate-300 dark:bg-white/20'
                  )}
                />
                <span
                  className={cn(
                    NUM,
                    'text-[10px] font-bold transition-colors',
                    isActive
                      ? 'text-[#5a63df] dark:text-[#a9afff]'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {score.toFixed(1)}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className={cn(
            'mt-1 flex items-center gap-3 rounded-xl p-3',
            'border border-[#dedbea] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03),0_4px_12px_-2px_rgba(15,23,42,0.04)]',
            'dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none'
          )}
        >
          <IconChip icon={GraduationCap} tone="accent" size="sm" className="shrink-0" />
          <p className={cn('text-[11.5px] leading-relaxed', MUTED)}>
            Practice questions, mock tests, and examiner scoring criteria calibrate to{' '}
            <span className="font-extrabold text-slate-900 dark:text-slate-100">
              Band {targetBandScore.toFixed(1)}
            </span>
            . You can adjust this anytime in settings.
          </p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, MUTED, NUM, Pill, TILE } from '@/features/dashboard/components/primitives';
import { getBandLabel } from '@/features/analytics/utils';

const MARKS = [4.0, 5.0, 6.0, 7.0, 8.0, 9.0];

export default function TargetStep({ targetBandScore, onChangeTargetBand }) {
  const label = getBandLabel(targetBandScore);

  return (
    <div className="space-y-7 py-2">
      <div className="text-center">
        <div className={cn(NUM, 'text-6xl font-extrabold text-slate-900 dark:text-white')}>
          {targetBandScore.toFixed(1)}
        </div>
        <Pill tone="accent" className="mt-2">
          {label}
        </Pill>
      </div>

      <div className="space-y-5 px-1">
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
        <div className="flex justify-between px-2.5">
          {MARKS.map((score) => {
            const isActive = targetBandScore === score;
            return (
              <div key={score} className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    'h-1 w-1 rounded-full transition-all duration-200',
                    isActive
                      ? 'scale-150 bg-[#5a63df] dark:bg-[#8f97ff]'
                      : 'bg-slate-300 dark:bg-white/20'
                  )}
                />
                <span
                  className={cn(
                    NUM,
                    'text-[11px] font-bold transition-colors',
                    isActive
                      ? 'text-[#5a63df] dark:text-[#a9afff]'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {score.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>

        <div className={cn(TILE, 'flex items-start gap-3 p-3.5')}>
          <IconChip icon={Target} tone="accent" size="md" className="mt-0.5" />
          <p className={cn('text-[13px] leading-relaxed', MUTED)}>
            Your practice difficulty and the pace of your study plan calibrate to{' '}
            <span className="font-extrabold text-slate-800 dark:text-slate-100">
              band {targetBandScore.toFixed(1)}
            </span>
            . You can change this later from Settings.
          </p>
        </div>
      </div>
    </div>
  );
}

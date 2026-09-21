import React from 'react';
import Minus from 'lucide-react/icons/minus';
import Plus from 'lucide-react/icons/plus';

import { NUM, IconChip } from '@/features/dashboard/components/primitives';
import { formatBand, sliderFill } from './matchToolConstants';

export function SkillControlRow({ name, value, onChange, icon: Icon, tone }) {
  const handleStep = (step) => {
    const next = Math.round((value + step) * 2) / 2;
    if (next >= 4.0 && next <= 9.0) {
      onChange(next);
    }
  };

  return (
    <div className="group rounded-xl border border-transparent p-3 transition-colors duration-150 hover:border-[#e4e2f0] hover:bg-[#fbfbfe] dark:hover:border-white/[0.07] dark:hover:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <IconChip icon={Icon} tone={tone} size="sm" />
          <span className="truncate text-[13.5px] font-bold text-slate-900 dark:text-slate-100">
            {name}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleStep(-0.5)}
            disabled={value <= 4.0}
            aria-label={`Decrease ${name} band`}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4e2f0] bg-white text-slate-600 transition-all duration-150 hover:border-[#5a63df]/40 hover:bg-[#f4f3fb] hover:text-[#5a63df] disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10"
          >
            <Minus className="h-3 w-3 stroke-[2.5]" />
          </button>

          <span
            className={`${NUM} inline-flex w-10 justify-center text-base font-black text-slate-900 dark:text-white`}
          >
            {formatBand(value)}
          </span>

          <button
            type="button"
            onClick={() => handleStep(0.5)}
            disabled={value >= 9.0}
            aria-label={`Increase ${name} band`}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4e2f0] bg-white text-slate-600 transition-all duration-150 hover:border-[#5a63df]/40 hover:bg-[#f4f3fb] hover:text-[#5a63df] disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10"
          >
            <Plus className="h-3 w-3 stroke-[2.5]" />
          </button>
        </div>
      </div>

      <div className="mt-2.5 px-0.5">
        <input
          type="range"
          min="4.0"
          max="9.0"
          step="0.5"
          value={value}
          aria-label={`${name} band score`}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="calc-range h-1.5 w-full cursor-pointer appearance-none rounded-full"
          style={sliderFill(value, 4, 9)}
        />
        <div className="mt-1 flex justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500">
          <span>4.0</span>
          <span>6.0</span>
          <span>7.0</span>
          <span>8.0</span>
          <span>9.0</span>
        </div>
      </div>
    </div>
  );
}

export default SkillControlRow;

import React from 'react';
import { Check } from 'lucide-react';
import { SlidingTabs } from './SlidingTabs';

/** The report's segmented choice, drawn with the sliding indicator. */
export function Segmented({ label, options, value, onChange }) {
  return (
    <SlidingTabs
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      className="inline-flex max-w-full flex-wrap gap-0.5 rounded-[10px] bg-[#efeef8] p-[3px] dark:bg-white/[0.07]"
      indicatorClassName="rounded-lg bg-white ring-1 ring-[#dcdaea] dark:bg-[#2a2940] dark:ring-white/10"
      tabClassName="min-h-9 rounded-lg px-3.5 text-[12.5px] font-bold"
      activeClassName="text-[#4b53c9] dark:text-[#c3c7ff]"
      idleClassName="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
    />
  );
}

export function CheckMark({ done }) {
  return done ? (
    <span
      className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[rgb(var(--signal-ok))] text-white transition-colors duration-150"
      aria-hidden="true"
    >
      <Check className="h-3 w-3" strokeWidth={3} />
    </span>
  ) : (
    <span
      className="block h-[18px] w-[18px] shrink-0 rounded-full border-2 border-[rgb(var(--signal-warn)/0.7)]"
      aria-hidden="true"
    />
  );
}

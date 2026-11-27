import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TAB_THEME } from './reportStyles';
import { SlidingTabs } from './SlidingTabs';

/** The report's segmented choice, drawn with the sliding indicator. */
export function Segmented({ label, options, value, onChange }) {
  return (
    <SlidingTabs
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      className={cn(
        'inline-flex max-w-full flex-wrap gap-0.5 rounded-[10px] p-[3px]',
        TAB_THEME.track
      )}
      indicatorClassName={cn('rounded-lg', TAB_THEME.indicator)}
      tabClassName="min-h-8 rounded-lg px-3 text-[12.5px] font-bold"
      activeClassName={TAB_THEME.active}
      idleClassName={TAB_THEME.idle}
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

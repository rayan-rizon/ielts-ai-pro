import React from 'react';
import { cn } from '@/lib/cn';
import { ENGLISH } from './reportStyles';

const MARKS = {
  error:
    'rounded-sm bg-[rgb(var(--signal-fault)/0.09)] underline decoration-[rgb(var(--signal-fault))] decoration-2 underline-offset-[5px]',
  suggestion:
    'rounded-sm bg-[rgb(var(--signal-warn)/0.10)] underline decoration-dotted decoration-[rgb(var(--signal-warn))] decoration-2 underline-offset-[5px]',
  good: 'rounded-sm bg-[rgb(var(--signal-ok)/0.10)] underline decoration-[rgb(var(--signal-ok))] decoration-2 underline-offset-[5px]',
};

/** One essay paragraph; each mistake carries the number used in the fix list. */
export function MarkedText({ segments, className }) {
  return (
    <p
      className={cn(
        'font-serif leading-[1.9] text-slate-900 [overflow-wrap:anywhere] dark:text-slate-100',
        className
      )}
      {...ENGLISH}
    >
      {segments.map((segment, index) =>
        segment.kind ? (
          <React.Fragment key={index}>
            <span className={MARKS[segment.kind]}>{segment.text}</span>
            {segment.n && (
              <sup className="ms-0.5 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {segment.n}
              </sup>
            )}
          </React.Fragment>
        ) : (
          <React.Fragment key={index}>{segment.text}</React.Fragment>
        )
      )}
    </p>
  );
}

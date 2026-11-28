import React from 'react';
import { PenLine } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TILE } from '@/features/dashboard/components/primitives';

const OTHER = { 'Task 1': 'Task 2', 'Task 2': 'Task 1' };

/** Above the editor of the task left over after a one-task review. */
export function OpenTaskNote({ task }) {
  return (
    <p
      className={cn(
        TILE,
        'flex items-start gap-2 px-3 py-2 text-[12.5px] leading-snug text-slate-700 dark:text-slate-200'
      )}
    >
      <PenLine
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5a63df] dark:text-[#a9afff]"
        aria-hidden="true"
      />
      <span>
        <strong className="font-bold">{OTHER[task]} is reviewed.</strong> Write {task} to finish
        this test, then press Get AI feedback. The review uses 1 writing task review. Your answer
        saves by itself and there is no timer.
      </span>
    </p>
  );
}

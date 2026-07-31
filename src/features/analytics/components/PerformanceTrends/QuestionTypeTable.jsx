import React from 'react';
import { m } from 'framer-motion';
import { Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Empty, MICRO, MUTED, NUM, Pill, WELL } from '@/features/dashboard/components/primitives';
import { questionSuccessTone } from './SharedHelpers';

/**
 * One row per question type, weakest first.
 *
 * IELTS candidates do not lose marks evenly — they lose them to Matching
 * Headings or True/False/Not Given specifically. Sorting weakest-first turns
 * the list into a practice queue instead of an alphabetical reference table.
 */
function TypeRow({ item, index }) {
  const tone = questionSuccessTone(item.accuracy, item.total);
  const label = item.type
    .split(/_|\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="group py-1.5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
          {item.module ? <span className={cn(MICRO, MUTED, 'mr-1')}>{item.module}</span> : null}
          {label}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={cn(NUM, 'text-xs font-bold text-slate-900 dark:text-slate-50')}>
            {item.accuracy}%
          </span>
          <Pill tone={tone.pill}>{tone.label}</Pill>
        </div>
      </div>

      <div className={cn('mt-1 h-1.5 w-full overflow-hidden rounded-full', WELL)}>
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(item.accuracy, 2)}%` }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
          className={cn('h-full rounded-full', tone.bar)}
        />
      </div>

      <p className={cn(MICRO, MUTED, 'mt-1')}>
        <span className={NUM}>{item.correct}</span> of <span className={NUM}>{item.total}</span>{' '}
        correct
      </p>
    </m.div>
  );
}

const QuestionTypeTable = React.memo(function QuestionTypeTable({ data }) {
  if (!data || !data.length) {
    return (
      <Empty icon={Target}>
        Complete a graded Reading or Listening test to see accuracy per question type.
      </Empty>
    );
  }

  // Weakest first — the row worth acting on should be the row read first.
  const ordered = [...data].sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div className="divide-y divide-[#eceafa] dark:divide-white/[0.06]">
      {ordered.map((item, index) => (
        <TypeRow key={`${item.module}:${item.type}`} item={item} index={index} />
      ))}
    </div>
  );
});

export default QuestionTypeTable;

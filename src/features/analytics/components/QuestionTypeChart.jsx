import React from 'react';
import { m } from 'framer-motion';
import { Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Empty,
  MICRO,
  MUTED,
  NUM,
  Pill,
  Tip,
  WELL,
} from '@/features/dashboard/components/primitives';
import { questionSuccessTone } from './questionTypeHelpers';

/**
 * One row per question type, weakest first.
 *
 * IELTS candidates do not lose marks evenly — they lose them to Matching
 * Headings or True/False/Not Given specifically. Sorting weakest-first turns
 * the list into a practice queue instead of an alphabetical reference table.
 *
 * Two lines, not three: the tone pill used to spell out in words ("Developing")
 * what the bar colour beside it already said, and the correct/total count had a
 * line of its own. The pill now only appears when it carries something the
 * colour cannot — that the sample is too small to trust.
 */
function TypeRow({ item, index }) {
  const tone = questionSuccessTone(item.accuracy, item.total);
  const lowSample = Number(item.total) < 5;
  const label = item.type
    .split(/_|\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="py-1.5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
          {item.module ? <span className={cn(MICRO, MUTED, 'mr-1')}>{item.module}</span> : null}
          {label}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {lowSample ? (
            <Tip content="Fewer than 5 answered — too small a sample to call this a real strength or weakness yet.">
              <span>
                <Pill tone="neutral">{tone.label}</Pill>
              </span>
            </Tip>
          ) : null}
          <span className={cn(MICRO, MUTED)}>
            <span className={NUM}>{item.correct}</span>/<span className={NUM}>{item.total}</span>
          </span>
          <span
            className={cn(
              NUM,
              'w-8 text-right text-xs font-bold text-slate-900 dark:text-slate-50'
            )}
          >
            {item.accuracy}%
          </span>
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
    </m.div>
  );
}

const QuestionTypeTable = React.memo(function QuestionTypeTable({ data }) {
  if (!data || !data.length) {
    return (
      <Empty icon={Target} className="h-full content-center">
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

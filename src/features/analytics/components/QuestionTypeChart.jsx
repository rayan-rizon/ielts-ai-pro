import React, { useMemo } from 'react';
import { BookOpen, Headphones, Mic2, PenLine, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Empty, MICRO, MUTED, NUM, Tip, WELL } from '@/features/dashboard/components/primitives';
import { marksLost, questionTypeVerdict } from './questionTypeHelpers';

const MODULE_ICONS = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic2,
};

const formatType = (type) =>
  String(type)
    .split(/_|\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

/**
 * One question format as a proportional stacked bar.
 *
 * Two earlier attempts failed the same test — "can a learner see the answer
 * without reading?". Thin uniform tracks encoded accuracy alone, so at
 * single-digit accuracy every row rendered as an identical empty line. Sized
 * pills replaced that with a wall of words. Here the bar's *length* is the
 * number of questions of this type the learner has actually sat, and the split
 * inside it is how many they got right. A long bar that is nearly all "missed"
 * is the biggest problem on the card and reads as such from across the room —
 * no number required. Module is an icon rather than a word because "Reading
 * Multiple Choice" vs "Listening Multiple Choice" needs distinguishing, not
 * spelling out thirteen times.
 */
function TypeRow({ item, maxTotal }) {
  const Icon = MODULE_ICONS[String(item.module || '').toLowerCase()] || Target;
  const lost = marksLost(item);
  const verdict = questionTypeVerdict(item.accuracy, item.total);
  // Bar length is share of the busiest format; a floor keeps a 4-question
  // format from collapsing to an invisible nub.
  const volumePct = maxTotal > 0 ? Math.max(4, (item.total / maxTotal) * 100) : 0;
  const correctPct = Math.max(0, Math.min(100, item.accuracy));

  return (
    <Tip
      content={`${item.module ? `${formatType(item.module)} · ` : ''}${formatType(item.type)} — ${item.correct} of ${item.total} correct, ${lost} mark${lost === 1 ? '' : 's'} lost. ${verdict}.`}
    >
      {/* Rows flex to fill the plot area instead of stacking at their natural
          height and leaving a void above the footnote — the card is stretched
          to its row's height, so the chart has to stretch with it. Bounded top
          and bottom so a learner with three tracked formats doesn't get three
          absurdly tall rows. */}
      <div className="flex max-h-[30px] min-h-[22px] flex-1 items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" strokeWidth={2} />
        <span className="w-[92px] shrink-0 truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100 sm:w-[110px]">
          {formatType(item.type)}
        </span>

        {/* Width lives in `style` with a CSS transition rather than a
            framer-motion `animate` — a motion value that starts at 0 leaves the
            bar genuinely zero-width until frames run, so any context without
            them (reduced motion, a test, a paint before hydration) renders an
            empty chart. Same pattern as every other meter on this page. */}
        <div className={cn('relative h-2.5 flex-1 overflow-hidden rounded-full', WELL)}>
          <div
            className="absolute inset-y-0 left-0 flex overflow-hidden rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${volumePct}%` }}
          >
            <div
              className="h-full bg-[rgb(var(--signal-ok))]"
              style={{ width: `${correctPct}%` }}
            />
            <div className="h-full flex-1 bg-[rgb(var(--signal-fault)/0.35)]" />
          </div>
        </div>

        <span
          className={cn(
            NUM,
            'w-7 shrink-0 text-right text-[11px] font-bold text-slate-700 dark:text-slate-200'
          )}
        >
          {item.accuracy}%
        </span>
      </div>
    </Tip>
  );
}

/**
 * Ordered by marks lost, not by accuracy.
 *
 * Accuracy alone ranked a 0%-of-4 format above a 0%-of-76 one, which is the
 * opposite of a useful practice queue. Sorting by marks dropped puts the
 * format actually costing the most band at the top — and because bar length
 * tracks volume, that same row is also the longest bar, so the ranking and
 * the picture agree instead of fighting each other.
 */
const QuestionTypeChart = React.memo(function QuestionTypeChart({ data }) {
  const ordered = useMemo(
    () => [...(data || [])].sort((a, b) => marksLost(b) - marksLost(a) || a.accuracy - b.accuracy),
    [data]
  );
  const maxTotal = useMemo(
    () => ordered.reduce((max, item) => Math.max(max, Number(item.total) || 0), 0),
    [ordered]
  );

  if (!ordered.length) {
    return (
      <Empty icon={Target} className="h-full content-center">
        Complete a graded Reading or Listening test to see accuracy per question type.
      </Empty>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1.5 flex shrink-0 items-center gap-3 pl-22 sm:pl-[6.6rem]">
        <span className={cn(MICRO, MUTED, 'flex items-center gap-1.5')}>
          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--signal-ok))]" />
          Correct
        </span>
        <span className={cn(MICRO, MUTED, 'flex items-center gap-1.5')}>
          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--signal-fault)/0.55)]" />
          Missed
        </span>
        <span className={cn(MICRO, MUTED, 'ml-auto')}>bar = questions sat</span>
      </div>

      <div className="flex flex-1 flex-col">
        {ordered.map((item) => (
          <TypeRow key={`${item.module}:${item.type}`} item={item} maxTotal={maxTotal} />
        ))}
      </div>
    </div>
  );
});

export default QuestionTypeChart;

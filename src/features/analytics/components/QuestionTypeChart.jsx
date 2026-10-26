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
      {/* Two lines per row: the name gets the full width so long formats
          ("Matching Features", "True False Not Given") are never clipped, and
          the bar below gets the full width too, which makes length differences
          between formats easier to compare. The module is spelled out beside
          the name because two "Multiple Choice" rows are otherwise
          indistinguishable without decoding an icon. */}
      <div className="space-y-1.5 py-0.5">
        <div className="flex items-center gap-2">
          <Icon
            className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
            strokeWidth={2}
          />
          <span className="min-w-0 truncate text-xs font-extrabold text-slate-800 dark:text-slate-100">
            {formatType(item.type)}
          </span>
          {item.module ? (
            <span className={cn(MICRO, MUTED, 'shrink-0')}>{formatType(item.module)}</span>
          ) : null}
          <span className="ml-auto flex shrink-0 items-baseline gap-2">
            <span className={cn(NUM, 'text-[10px] font-semibold', MUTED)}>
              {item.correct}/{item.total}
            </span>
            <span
              className={cn(
                NUM,
                'w-9 text-right text-xs font-bold text-slate-800 dark:text-slate-100'
              )}
            >
              {item.accuracy}%
            </span>
          </span>
        </div>

        {/* Width lives in `style` with a CSS transition rather than a
            framer-motion `animate` — a motion value that starts at 0 leaves the
            bar genuinely zero-width until frames run, so any context without
            them (reduced motion, a test, a paint before hydration) renders an
            empty chart. Same pattern as every other meter on this page. */}
        <div className={cn('relative h-2 w-full overflow-hidden rounded-full', WELL)}>
          <div
            className="absolute inset-y-0 left-0 flex overflow-hidden rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${volumePct}%` }}
          >
            <div
              className="h-full bg-[rgb(var(--signal-ok))]"
              style={{ width: `${correctPct}%` }}
            />
            <div className="h-full flex-1 bg-[rgb(var(--signal-fault)/0.35)]" />
          </div>
        </div>
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
      <div className="mb-2.5 flex shrink-0 items-center gap-3">
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

      <div className="flex flex-1 flex-col justify-between gap-2.5">
        {ordered.map((item) => (
          <TypeRow key={`${item.module}:${item.type}`} item={item} maxTotal={maxTotal} />
        ))}
      </div>
    </div>
  );
});

export default QuestionTypeChart;

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  SIGNAL_TEXT,
  TILE,
  Tip,
  WELL,
} from '@/features/dashboard/components/primitives';
import { QUESTION_TYPE_LABELS } from './utils';
import { accuracyTone } from './resultStats';

/**
 * Solid signal fills. The shared `SIGNAL_FILL` tokens sit at ~30% alpha, which
 * is tuned for wide meter tracks; on a 6px bar they wash out against the WELL
 * track, so these bars use the signal colour at full strength.
 */
const BAR_FILL = {
  ok: 'bg-[rgb(var(--signal-ok))]',
  warn: 'bg-[rgb(var(--signal-warn))]',
  fault: 'bg-[rgb(var(--signal-fault))]',
};

const TONE_LABEL = { ok: 'Strong', warn: 'Fair', fault: 'Needs work' };

export function QuestionTypeBreakdown({ testResults }) {
  const typeStats = testResults?.typeStats;

  /**
   * Sorted weakest-first. The old grid used insertion order and painted every
   * bar the same indigo, so nothing told the learner where to start — the one
   * decision this card exists to support.
   */
  const entries = React.useMemo(() => {
    if (!typeStats) return [];
    return Object.entries(typeStats)
      .filter(([, s]) => s?.total > 0)
      .map(([type, s]) => {
        const accuracy = Math.round((s.correct / s.total) * 100);
        return {
          type,
          label:
            QUESTION_TYPE_LABELS[type] ||
            type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          correct: s.correct,
          total: s.total,
          accuracy,
          tone: accuracyTone(accuracy),
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
  }, [typeStats]);

  if (entries.length === 0) return null;

  const weakCount = entries.filter((e) => e.tone === 'fault').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className={cn(PANEL, 'p-4')}
    >
      <PanelTitle
        label="Accuracy by question type"
        tip="Sorted weakest first. Colour marks where accuracy fell below 80% and 50%."
        action={
          weakCount > 0 ? (
            <span className={cn(MICRO, SIGNAL_TEXT.fault)}>
              <span className={NUM}>{weakCount}</span> weak {weakCount === 1 ? 'type' : 'types'}
            </span>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((item, idx) => (
          <Tip
            key={item.type}
            content={
              <span className="space-y-0.5">
                <span className="block font-bold">
                  {item.correct}/{item.total} correct ·{' '}
                  <span className={SIGNAL_TEXT[item.tone]}>{TONE_LABEL[item.tone]}</span>
                </span>
                <span className="block text-slate-300 dark:text-slate-400">
                  {item.total - item.correct} missed in this type
                </span>
              </span>
            }
          >
            <div className={cn(TILE, 'flex cursor-default items-center gap-2.5 px-2.5 py-2')}>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
                    {item.label}
                  </span>
                  <span
                    className={cn(NUM, 'shrink-0 text-[11px] font-bold', SIGNAL_TEXT[item.tone])}
                  >
                    {item.accuracy}%
                  </span>
                </div>
                <div className={cn('mt-1.5 h-1.5 w-full overflow-hidden rounded-full', WELL)}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.accuracy}%` }}
                    transition={{ duration: 0.6, delay: 0.15 + idx * 0.03 }}
                    className={cn('h-full rounded-full', BAR_FILL[item.tone])}
                  />
                </div>
              </div>
              <span className={cn(NUM, MUTED, 'shrink-0 text-[11px] font-bold tabular-nums')}>
                {item.correct}/{item.total}
              </span>
            </div>
          </Tip>
        ))}
      </div>
    </motion.div>
  );
}

export default QuestionTypeBreakdown;

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Empty,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  ROW_CHEVRON,
  ROW_HOVER,
  SIGNAL_TEXT,
  Tip,
  WELL,
} from '@/features/dashboard/components/primitives';
import { accuracyTone } from './resultStats';

const BAR_FILL = {
  ok: 'bg-[rgb(var(--signal-ok))]',
  warn: 'bg-[rgb(var(--signal-warn))]',
  fault: 'bg-[rgb(var(--signal-fault))]',
};

const TONE_LABEL = { ok: 'Strong', warn: 'Fair', fault: 'Needs work' };

export function PassageBreakdownCard({ testResults, testType = 'reading', onReviewAnswers }) {
  const sectionLabel = testType === 'listening' ? 'Part' : 'Passage';
  const sections = React.useMemo(() => {
    const raw = Array.isArray(testResults?.sectionStats) ? testResults.sectionStats : [];
    return raw.map((stat, idx) => {
      const correct = Math.max(0, Number(stat?.correct) || 0);
      const total = Math.max(0, Number(stat?.total) || 0);
      const pct = Number.isFinite(stat?.percentage)
        ? stat.percentage
        : total > 0
          ? Math.round((correct / total) * 100)
          : 0;
      return {
        key: stat?.title || idx,
        title: stat?.title || `${sectionLabel} ${idx + 1}`,
        correct,
        total,
        pct,
        tone: accuracyTone(pct),
      };
    });
  }, [testResults?.sectionStats, sectionLabel]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={cn(PANEL, 'flex h-full flex-col p-4')}
    >
      <PanelTitle label={`${sectionLabel} performance`} />

      {sections.length === 0 ? (
        <Empty>No {sectionLabel.toLowerCase()} breakdown recorded for this attempt.</Empty>
      ) : (
        <div className="flex flex-1 flex-col justify-center gap-1">
          {sections.map((s, idx) => (
            <Tip
              key={s.key}
              side="left"
              content={
                <span className="space-y-0.5">
                  <span className="block font-bold">
                    {s.correct}/{s.total} correct ·{' '}
                    <span className={SIGNAL_TEXT[s.tone]}>{TONE_LABEL[s.tone]}</span>
                  </span>
                  <span className="block text-slate-300 dark:text-slate-400">
                    Click to review these answers
                  </span>
                </span>
              }
            >
              <button
                type="button"
                onClick={onReviewAnswers}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 text-left transition-all duration-150',
                  ROW_HOVER
                )}
              >
                <span
                  className={cn(
                    WELL,
                    NUM,
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-extrabold text-slate-700 dark:text-slate-200'
                  )}
                >
                  {idx + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
                      {s.title}
                    </span>
                    <span className={cn(NUM, MUTED, 'shrink-0 text-[11px] font-bold')}>
                      {s.correct}/{s.total}
                    </span>
                  </div>
                  <div className={cn('mt-1.5 h-1.5 w-full overflow-hidden rounded-full', WELL)}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.pct}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + idx * 0.05 }}
                      className={cn('h-full rounded-full', BAR_FILL[s.tone])}
                    />
                  </div>
                </div>

                <span
                  className={cn(
                    NUM,
                    'w-9 shrink-0 text-right text-xs font-bold',
                    SIGNAL_TEXT[s.tone]
                  )}
                >
                  {s.pct}%
                </span>
                <ChevronRight className={cn('h-3.5 w-3.5', ROW_CHEVRON)} />
              </button>
            </Tip>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default PassageBreakdownCard;

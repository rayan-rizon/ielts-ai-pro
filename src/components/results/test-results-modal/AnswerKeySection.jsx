import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  Tip,
  WELL,
} from '@/features/dashboard/components/primitives';
import { STATUS, deriveResultStats } from './resultStats';

const CELL_STYLE = {
  [STATUS.correct]:
    'bg-[rgb(var(--signal-ok)/0.12)] text-[rgb(var(--signal-ok))] border-[rgb(var(--signal-ok)/0.30)]',
  [STATUS.wrong]:
    'bg-[rgb(var(--signal-fault)/0.12)] text-[rgb(var(--signal-fault))] border-[rgb(var(--signal-fault)/0.30)]',
  [STATUS.skipped]:
    'bg-[rgb(var(--signal-warn)/0.12)] text-[rgb(var(--signal-warn))] border-[rgb(var(--signal-warn)/0.30)]',
  [STATUS.unknown]:
    'bg-[#f4f3fb] text-slate-400 border-[#e4e2f0] dark:bg-white/[0.04] dark:text-slate-500 dark:border-white/[0.08]',
};

const LEGEND = [
  { status: STATUS.correct, label: 'Correct', dot: 'bg-[rgb(var(--signal-ok))]' },
  { status: STATUS.wrong, label: 'Incorrect', dot: 'bg-[rgb(var(--signal-fault))]' },
  { status: STATUS.skipped, label: 'Skipped', dot: 'bg-[rgb(var(--signal-warn))]' },
];

export const AnswerKeySection = React.memo(
  ({ testResults, onNavigateToQuestion, onReviewAnswers }) => {
    const [filter, setFilter] = useState('all');

    // Same derivation the hero card uses, so the tab counts can never contradict
    // the headline numbers the way the old independent count did.
    const stats = React.useMemo(() => deriveResultStats(testResults), [testResults]);

    const tabs = [
      { id: 'all', label: 'All', count: stats.total },
      { id: STATUS.wrong, label: 'Incorrect', count: stats.wrong },
      { id: STATUS.skipped, label: 'Skipped', count: stats.skipped },
    ];

    const visible = React.useMemo(
      () =>
        filter === 'all' ? stats.questions : stats.questions.filter((q) => q.status === filter),
      [stats.questions, filter]
    );

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className={cn(PANEL, 'flex h-full flex-col p-4')}
      >
        <PanelTitle
          label="Answer map"
          action={
            <div
              className={cn(
                'flex items-center gap-0.5 rounded-lg border border-[#e4e2f0] p-0.5 dark:border-white/[0.07]',
                WELL
              )}
            >
              {tabs.map((t) => {
                const isActive = filter === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFilter(t.id)}
                    className={cn(
                      'relative z-10 rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide transition-colors',
                      isActive
                        ? 'text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="answerKeyFilterTabPill"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        className="absolute inset-0 -z-10 rounded-md bg-[#5a63df]"
                      />
                    )}
                    {t.label} <span className={NUM}>{t.count}</span>
                  </button>
                );
              })}
            </div>
          }
        />

        <div className="flex flex-1 flex-col justify-center">
          {visible.length === 0 ? (
            <p className={cn(MICRO, MUTED, 'py-6 text-center')}>
              Nothing in this filter — good news.
            </p>
          ) : (
            <div className="grid grid-cols-8 gap-1 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-10 xl:grid-cols-12">
              {visible.map(({ qNum, status }) => (
                <Tip key={qNum} content={`Question ${qNum} — ${status}`}>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateToQuestion ? onNavigateToQuestion(qNum) : onReviewAnswers?.()
                    }
                    className={cn(
                      NUM,
                      'flex h-7 items-center justify-center rounded border text-[11px] font-bold transition-all w-full',
                      'hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-1 focus:ring-[#5a63df]/50',
                      CELL_STYLE[status]
                    )}
                  >
                    {qNum}
                  </button>
                </Tip>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]">
          {LEGEND.map((l) => (
            <span key={l.status} className="flex items-center gap-1.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', l.dot)} />
              <span className={cn(MICRO, MUTED)}>{l.label}</span>
            </span>
          ))}
          {!stats.isComplete && (
            <span className={cn(MICRO, MUTED)}>
              · Per-question detail unavailable for some items
            </span>
          )}
        </div>
      </motion.div>
    );
  }
);

AnswerKeySection.displayName = 'AnswerKeySection';
export default AnswerKeySection;

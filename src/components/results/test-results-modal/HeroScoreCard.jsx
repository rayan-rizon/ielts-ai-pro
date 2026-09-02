import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, NUM, PANEL, Tip, WELL } from '@/features/dashboard/components/primitives';
import { ArchScoreGauge } from './ArchScoreGauge';
import { deriveResultStats, formatDuration, resolveTimeSpent } from './resultStats';

const SEGMENTS = [
  {
    key: 'correct',
    label: 'Correct',
    dot: 'bg-[rgb(var(--signal-ok))]',
    fill: 'bg-[rgb(var(--signal-ok))]',
    text: 'text-[rgb(var(--signal-ok))]',
  },
  {
    key: 'wrong',
    label: 'Incorrect',
    dot: 'bg-[rgb(var(--signal-fault))]',
    fill: 'bg-[rgb(var(--signal-fault))]',
    text: 'text-[rgb(var(--signal-fault))]',
  },
  {
    key: 'skipped',
    label: 'Skipped',
    dot: 'bg-[rgb(var(--signal-warn))]',
    fill: 'bg-[rgb(var(--signal-warn))]',
    text: 'text-[rgb(var(--signal-warn))]',
  },
];

/**
 * One stacked bar for the whole paper. Replaces three separate count tiles —
 * the segment widths *are* the accuracy, so the composition is visible instead
 * of being restated as a second percentage number.
 */
function CompositionBar({ stats }) {
  if (stats.total === 0) return null;
  return (
    <div className={cn('flex h-2.5 w-full overflow-hidden rounded-full', WELL)}>
      {SEGMENTS.map((seg) => {
        const value = stats[seg.key];
        if (!value) return null;
        const pct = Math.round((value / stats.total) * 100);
        return (
          <Tip
            key={seg.key}
            content={
              <span className="flex items-center gap-1.5">
                <span className={cn('h-1.5 w-1.5 rounded-full', seg.dot)} />
                {seg.label}: <span className={NUM}>{value}</span> ({pct}%)
              </span>
            }
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className={cn('h-full cursor-default', seg.fill)}
            />
          </Tip>
        );
      })}
    </div>
  );
}

export function HeroScoreCard({ testResults }) {
  const stats = React.useMemo(() => deriveResultStats(testResults), [testResults]);
  const score = parseFloat(testResults?.bandScore) || 0;
  const timeSpent = formatDuration(resolveTimeSpent(testResults));

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={cn(
        PANEL,
        'grid h-full grid-cols-1 items-center gap-3 p-3.5 md:grid-cols-[minmax(210px,1fr)_1px_minmax(210px,1fr)]'
      )}
    >
      <div className="flex min-w-0 justify-center">
        <ArchScoreGauge score={score} />
      </div>

      <div className="hidden h-[154px] w-px bg-[#e4e2f0] dark:bg-white/[0.07] md:block" />

      <div className="min-w-0 space-y-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn(MICRO, MUTED)}>Answer breakdown</span>
          <span className={cn(NUM, 'text-xs font-bold text-slate-700 dark:text-slate-200')}>
            {stats.correct}/{stats.total}
          </span>
        </div>

        <CompositionBar stats={stats} />

        <div className="grid grid-cols-3 gap-2">
          {SEGMENTS.map((seg) => (
            <div key={seg.key} className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', seg.dot)} />
                <span className={cn(MICRO, MUTED, 'truncate')}>{seg.label}</span>
              </div>
              <p className={cn(NUM, 'mt-1 text-lg font-extrabold leading-none', seg.text)}>
                {stats[seg.key]}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]">
          <span className={cn(MICRO, MUTED)}>Time spent</span>
          {/* Honest empty state — the old card silently substituted the test's
              allotted duration when nothing was recorded, which read as a real
              measurement of the learner's pace. */}
          <span
            className={cn(
              NUM,
              'text-xs font-bold',
              timeSpent
                ? 'text-slate-700 dark:text-slate-200'
                : 'text-slate-400 dark:text-slate-500'
            )}
          >
            {timeSpent || 'Not recorded'}
          </span>
        </div>
      </div>
    </motion.section>
  );
}

export default HeroScoreCard;

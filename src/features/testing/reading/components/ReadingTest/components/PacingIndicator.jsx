import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Timer, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReadingTestTimer } from '@/features/testing/reading/components/ReadingTest/context/ReadingTestContext';
import { useReadingTestStore } from '@/features/testing/reading/store/useReadingTestStore';

/**
 * PacingIndicator
 *
 * Shows per-passage time targets (default: 20 min each for a 3-passage test) and
 * a live elapsed counter for the active passage.
 *
 * ARCHITECTURE: Derives all live timing from the main timer.
 *   - totalElapsed = initialTime - timeRemaining (same as main clock)
 *   - sumFrozen = sum of all passageTimes (frozen on passage switch)
 *   - liveForCurrentPassage = totalElapsed - sumFrozen
 *   - Display for current passage = passageTimes[idx] + liveForCurrentPassage
 *   - Display for other passages = passageTimes[idx]
 *
 * This is ALWAYS in sync with the main timer by definition.
 *
 * Props:
 *  - sections: array of passage objects from testData.sections
 *  - passageTimes: { [passageIndex]: secondsSpent } — frozen times for completed passages
 *  - currentPassageIndex: number
 *  - totalDurationSeconds: number — defaults to 3600
 *  - isFinished: boolean
 */
const PacingIndicator = ({
  sections = [],
  passageTimes = {},
  currentPassageIndex = 0,
  totalDurationSeconds = 3600,
  isFinished = false,
}) => {
  // Subscribe to the isolated timer (same frequency as ReadingTestClock — no new re-render budget)
  const timeRemaining = useReadingTestTimer();

  // Read initialTime from the store (persisted — correct even on resume)
  const initialTime = useReadingTestStore((s) => s.initialTime);

  const numPassages = Math.max(sections.length, 1);

  // Target seconds per passage
  const targetSecondsEach = Math.floor(totalDurationSeconds / numPassages);

  // Derive the live portion for the current passage from the main timer.
  // This is the KEY formula that keeps everything in sync:
  //   totalElapsed (from main timer) minus all frozen passage times = unfrozen live time
  const livePortionForCurrentPassage = useMemo(() => {
    if (isFinished) return 0;
    const totalElapsed = initialTime - timeRemaining;
    const sumFrozen = Object.values(passageTimes).reduce((a, b) => a + b, 0);
    return Math.max(0, totalElapsed - sumFrozen);
  }, [timeRemaining, initialTime, passageTimes, isFinished]);

  const formatCompact = (seconds) => {
    const m = Math.floor(Math.abs(seconds) / 60);
    const s = Math.abs(seconds) % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getPassageElapsed = (idx) => {
    const frozen = passageTimes[idx] || 0;
    if (idx === currentPassageIndex && !isFinished) {
      return frozen + livePortionForCurrentPassage;
    }
    return frozen;
  };

  const getStatus = (idx) => {
    const elapsed = getPassageElapsed(idx);
    const overshoot = elapsed - targetSecondsEach;
    if (overshoot >= 300) return 'over'; // 5+ min over target
    if (overshoot >= 120) return 'slightly_over'; // 2+ min over target
    return 'on_track';
  };

  // Single contextual tip for the current passage
  const currentPassageElapsed = getPassageElapsed(currentPassageIndex);
  const currentOvershoot = currentPassageElapsed - targetSecondsEach;
  const contextualTip = useMemo(() => {
    if (isFinished) return null;
    if (currentOvershoot >= 300) {
      return {
        text: 'Move on — save time for later passages',
        icon: TrendingDown,
        color: 'text-rose-500',
      };
    }
    if (currentOvershoot >= 120) {
      return {
        text: "You're slightly over pace — wrap up soon",
        icon: AlertTriangle,
        color: 'text-amber-500',
      };
    }
    if (currentOvershoot >= 0) {
      return { text: 'On pace — keep going!', icon: CheckCircle2, color: 'text-emerald-500' };
    }
    const remaining = -currentOvershoot;
    if (remaining <= 60) {
      return {
        text: 'Almost at your target time for this passage',
        icon: Timer,
        color: 'text-sky-500',
      };
    }
    return null;
  }, [currentOvershoot, isFinished]);

  const statusConfig = {
    on_track: {
      dot: 'bg-emerald-500',
      bar: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    slightly_over: {
      dot: 'bg-amber-500',
      bar: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
    },
    over: {
      dot: 'bg-rose-500',
      bar: 'bg-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
    },
  };

  if (numPassages <= 0 || isFinished) return null;

  return (
    <div className="w-full max-w-[320px] mt-1">
      {/* Per-passage pacing bars */}
      <div className="flex w-full gap-1.5 mb-1">
        {sections.map((_, idx) => {
          const elapsed = getPassageElapsed(idx);
          const fillPct = Math.min(100, Math.round((elapsed / targetSecondsEach) * 100));
          const status = getStatus(idx);
          const config = statusConfig[status];
          const isActive = idx === currentPassageIndex;

          return (
            <div key={idx} className="flex-1 group relative">
              {/* Background track */}
              <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                {/* Ghost target marker at 100% */}
                <div className="absolute top-0 right-0 w-0.5 h-full bg-slate-400 dark:bg-slate-500 opacity-50 z-10" />
                {/* Elapsed fill */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${fillPct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={cn('h-full rounded-full', config.bar)}
                />
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-slate-500 whitespace-nowrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded shadow-sm z-30 pointer-events-none">
                <span className="opacity-80">P{idx + 1}:&nbsp;</span>
                <span className={cn('font-black tabular-nums', config.text)}>
                  {formatCompact(elapsed)}
                </span>
                <span className="opacity-60"> / {formatCompact(targetSecondsEach)}</span>
              </div>

              {/* Active indicator pulsing dot */}
              {isActive && !isFinished && (
                <motion.div
                  animate={
                    status === 'over' ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : { scale: 1 }
                  }
                  transition={status === 'over' ? { repeat: Infinity, duration: 1.2 } : {}}
                  className={cn(
                    'absolute -top-0.5 w-2 h-2 rounded-full border-2 border-white dark:border-slate-950 shadow-sm',
                    config.dot
                  )}
                  style={{ left: `calc(${fillPct}% - 4px)` }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Contextual tip row */}
      {contextualTip && (
        <motion.div
          key={contextualTip.text}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-1 mt-0.5"
        >
          <contextualTip.icon className={cn('w-3 h-3 shrink-0', contextualTip.color)} />
          <span
            className={cn('text-[9px] font-bold uppercase tracking-wider', contextualTip.color)}
          >
            {contextualTip.text}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default PacingIndicator;

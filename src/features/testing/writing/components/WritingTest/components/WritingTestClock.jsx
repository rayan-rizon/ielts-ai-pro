import React, { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { NUM } from '@/features/dashboard/components/primitives';

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const WritingTestClock = memo(() => {
  const timeLeft = useWritingTestStore((state) => state.timeRemaining);
  const shouldReduceMotion = useReducedMotion();

  // IELTS standard color logic:
  // Critical: < 5 mins (300s) -> Red Pulse
  // Warning: < 10 mins (600s) -> Amber
  // Normal: > 10 mins -> Neutral
  const isCritical = timeLeft < 300;
  const isWarning = timeLeft < 600 && timeLeft >= 300;

  let containerClasses = 'bg-white dark:bg-white/4 border-[#e4e2f0] dark:border-white/[0.07]';
  let iconClasses = 'text-slate-400';
  let textClasses = 'text-slate-700 dark:text-slate-200';

  if (isCritical) {
    containerClasses =
      'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 shadow-[0_0_15px_rgba(244,63,94,0.1)]';
    iconClasses = 'text-rose-500';
    textClasses = 'text-rose-600 dark:text-rose-400';
  } else if (isWarning) {
    containerClasses =
      'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 shadow-[0_0_10px_rgba(245,158,11,0.05)]';
    iconClasses = 'text-amber-500';
    textClasses = 'text-amber-600 dark:text-amber-400';
  }

  const formatted = formatTime(timeLeft);

  return (
    <motion.div
      role="timer"
      aria-label={`Time remaining: ${formatted}`}
      animate={
        isCritical && !shouldReduceMotion ? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] } : {}
      }
      transition={
        isCritical && !shouldReduceMotion
          ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
          : {}
      }
      className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border shadow-xs transition-all duration-300 ${containerClasses}`}
      data-oid="fm9fwgz"
    >
      <Clock
        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${iconClasses} ${isCritical && !shouldReduceMotion ? 'animate-pulse' : ''}`}
        aria-hidden="true"
        data-oid="f4rktgb"
      />

      <span className={`text-xs sm:text-sm font-bold ${NUM} ${textClasses}`} data-oid="lv411iv">
        {formatted}
      </span>
    </motion.div>
  );
});

WritingTestClock.displayName = 'WritingTestClock';

export default WritingTestClock;

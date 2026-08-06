import { memo } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { useListeningTestTimer } from '../context/ListeningTestContext';
import { useListeningTestStore } from '@/features/testing/listening/store/useListeningTestStore';

/**
 * Isolated Clock Component for Listening Test
 *
 * This component ONLY subscribes to timeRemaining via useListeningTestTimer().
 * By isolating the timer, we prevent the entire ListeningTestInner component tree
 * from re-rendering every second when the timer ticks.
 *
 * PERFORMANCE: Only this component re-renders every second, not the entire page.
 *
 * When the test is finished (isFinished), it shows a static "Completed" badge
 * instead of a countdown — no flickering, no animate-pulse.
 */
const ListeningTestClock = memo(function ListeningTestClock() {
  const timeRemaining = useListeningTestTimer();
  const isFinished = useListeningTestStore((s) => s.isFinished);

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── Completed state: static badge, no animation ──────────────────────
  if (isFinished) {
    return (
      <div
        className="flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-emerald-600 transition-all duration-300 dark:border-emerald-400/30 dark:bg-emerald-400/12 dark:text-emerald-300"
        data-oid="f8s.k6k"
      >
        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
        <span className="font-mono text-sm font-bold tabular-nums">Done</span>
      </div>
    );
  }

  // ── Active countdown ─────────────────────────────────────────────────
  return (
    <div
      className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm transition-all duration-300 ${
        timeRemaining < 60
          ? 'animate-pulse border-rose-200 bg-rose-50 text-rose-600 ring-1 ring-rose-500/20 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-300'
          : 'border-[#e4e2f0] bg-[#f4f3fb] text-slate-700 dark:border-white/10 dark:bg-white/5.5 dark:text-slate-200'
      }`}
      data-oid="f8s.k6k"
    >
      <Clock
        className={`h-4 w-4 ${timeRemaining < 60 ? 'text-rose-500' : 'text-[#5a63df] dark:text-[#afb5ff]'}`}
        data-oid="oh02baq"
      />

      <span className="font-mono text-sm font-bold tabular-nums" data-oid="-k-v5by">
        {formatSeconds(timeRemaining)}
      </span>
    </div>
  );
});

export default ListeningTestClock;

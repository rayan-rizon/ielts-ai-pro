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
        className="flex items-center gap-1.5 px-2.5 sm:px-3 h-7.5 rounded-xl border transition-all duration-300 shadow-sm bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400"
        data-oid="f8s.k6k"
      >
        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
        <span className="font-mono font-black text-xs tabular-nums">Done</span>
      </div>
    );
  }

  // ── Active countdown ─────────────────────────────────────────────────
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-7.5 rounded-xl border transition-all duration-300 shadow-sm ${
        timeRemaining < 60
          ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 animate-pulse ring-2 ring-rose-500/20'
          : 'bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.07] text-slate-700 dark:text-slate-200'
      }`}
      data-oid="f8s.k6k"
    >
      <Clock
        className={`w-3.5 h-3.5 ${timeRemaining < 60 ? 'text-rose-500' : 'text-[#5a63df]'}`}
        data-oid="oh02baq"
      />

      <span className="font-mono font-black text-xs tabular-nums" data-oid="-k-v5by">
        {formatSeconds(timeRemaining)}
      </span>
    </div>
  );
});

export default ListeningTestClock;

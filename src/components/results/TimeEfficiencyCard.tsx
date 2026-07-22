import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Zap,
  AlertCircle,
  CheckCircle2,
  Timer,
  Gauge,
  TrendingUp,
  BarChart3,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * TimeEfficiencyCard
 *
 * Displays time management metrics for the test.
 * Includes Pace Trend and Passage-by-Passage breakdown.
 */

interface TimeMetrics {
  averageSecondsPerQuestion: number;
  timePerQuestionType: Record<string, number>;
  rushedQuestions: number;
  overanalyzedQuestions: number;
  totalTimeSpent: number;
  recommendedPace: number;
  paceEfficiency: number;
}

interface PassageProficiency {
  bySection: { section: number; accuracy: number; title?: string; avgTime?: number }[];
  trend: 'improving' | 'declining' | 'stable';
  fatigueFactor: number;
}

interface TimeEfficiencyCardProps {
  timeMetrics: TimeMetrics | null;
  passageProficiency: PassageProficiency | null;
  totalQuestions: number;
  testType?: 'reading' | 'listening';
}

export function TimeEfficiencyCard({
  timeMetrics,
  passageProficiency,
  totalQuestions,
  testType = 'reading',
}: TimeEfficiencyCardProps) {
  // Determine pace status
  const hasTimingMetrics =
    !!timeMetrics &&
    Number.isFinite(timeMetrics.averageSecondsPerQuestion) &&
    Number.isFinite(timeMetrics.totalTimeSpent) &&
    timeMetrics.averageSecondsPerQuestion > 0 &&
    timeMetrics.totalTimeSpent > 0;

  const paceEfficiency = hasTimingMetrics ? timeMetrics.paceEfficiency : null;

  const getPaceStatus = () => {
    if (paceEfficiency === null) {
      return {
        label: 'Timing unavailable',
        color: 'text-slate-600 dark:text-slate-400',
        bg: 'bg-slate-500/10',
        barColor: 'bg-slate-400',
      };
    }

    if (paceEfficiency >= 0.85 && paceEfficiency <= 1.15) {
      return {
        label: 'Optimal',
        color: 'text-emerald-600',
        bg: 'bg-emerald-500/10',
        barColor: 'bg-emerald-500',
      };
    }
    if (paceEfficiency > 1.15) {
      return {
        label: 'Fast',
        color: 'text-amber-600',
        bg: 'bg-amber-500/10',
        barColor: 'bg-amber-500',
      };
    }
    return { label: 'Slow', color: 'text-rose-600', bg: 'bg-rose-500/10', barColor: 'bg-rose-500' };
  };

  const paceStatus = getPaceStatus();
  const hasPassageData = (passageProficiency?.bySection?.length || 0) > 1;
  const fatigue = hasPassageData ? Math.max(0, passageProficiency?.fatigueFactor || 0) : null;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
      data-oid="vyrhyuv"
    >
      {/* Background Glows */}
      <div
        className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/5 blur-[80px] pointer-events-none"
        data-oid="lzx.fq1"
      />

      <div
        className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/5 blur-[80px] pointer-events-none"
        data-oid=":yj.x67"
      />

      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5"
        data-oid="b1n5_tw"
      >
        <div className="flex items-center gap-3" data-oid="3rp8a-l">
          <div
            className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"
            data-oid="7gbxc72"
          >
            <Timer className="w-6 h-6" data-oid="npblftq" />
          </div>
          <div data-oid="41rxz2:">
            <h3
              className="text-base font-black text-slate-900 dark:text-white leading-none"
              data-oid="risxtqf"
            >
              Speed & Energy
            </h3>
            <p
              className="text-[10px] tracking-wider font-bold text-slate-400 mt-1"
              data-oid="_9wezqg"
            >
              Stamina Flow
            </p>
          </div>
        </div>
        <div
          className={cn(
            'self-start sm:self-auto px-3 py-1 rounded-full text-[10px] font-black tracking-wider',
            paceStatus.bg,
            paceStatus.color
          )}
          data-oid="14jz_5g"
        >
          {paceEfficiency === null ? paceStatus.label : `${paceStatus.label} Speed`}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4" data-oid=".mz49.x">
        <div
          className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow"
          data-oid="m0113ib"
        >
          <span
            className="text-[10px] font-black text-slate-400 tracking-widest"
            data-oid="b9d2bbb"
          >
            Avg per Answer
          </span>
          <div
            className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white"
            data-oid="ezkyax7"
          >
            {hasTimingMetrics ? formatTime(timeMetrics.averageSecondsPerQuestion) : '--'}
          </div>
        </div>

        <div
          className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow"
          data-oid="oxqara5"
        >
          <span
            className="text-[10px] font-black text-slate-400 tracking-widest"
            data-oid="vsxp8fn"
          >
            Tiredness
          </span>
          <div
            className={cn(
              'text-2xl sm:text-3xl font-black',
              fatigue === null
                ? 'text-slate-400'
                : fatigue > 20
                  ? 'text-rose-500'
                  : fatigue > 10
                    ? 'text-amber-500'
                    : 'text-emerald-500'
            )}
            data-oid="59qclh7"
          >
            {fatigue === null ? '--' : `${Math.round(fatigue)}%`}
          </div>
        </div>
      </div>

      {/* Pace Trend / Passage Breakdown */}
      {passageProficiency && passageProficiency.bySection.length > 0 && (
        <div className="space-y-3 mb-6" data-oid="u36e-gn">
          <div className="flex items-center justify-between px-1" data-oid="ed73b82">
            <div
              className="flex items-center gap-2 text-[10px] font-black text-slate-400 tracking-widest"
              data-oid="885g4zr"
            >
              <BarChart3 className="w-3.5 h-3.5" data-oid="ik3l_of" /> Stability Trend
            </div>
          </div>

          <div className="space-y-3" data-oid="k2e.kjz">
            {passageProficiency.bySection.map((section, idx) => (
              <div key={idx} className="flex items-center gap-4 group" data-oid="n1lnhp3">
                <div
                  className="text-[10px] font-black text-slate-400 w-8 tracking-tighter whitespace-nowrap"
                  data-oid="9izhwp0"
                >
                  PART {section.section}
                </div>
                <div
                  className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-[1px] shadow-inner"
                  data-oid="c68cnrx"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${section.accuracy}%` }}
                    transition={{ duration: 1, delay: idx * 0.1, ease: 'circOut' }}
                    className={cn(
                      'h-full rounded-full shadow-sm transition-colors',
                      section.accuracy >= 70
                        ? 'bg-emerald-500 shadow-emerald-500/20'
                        : section.accuracy >= 50
                          ? 'bg-amber-500 shadow-amber-500/20'
                          : 'bg-rose-500 shadow-rose-500/20'
                    )}
                    data-oid="7hu:04w"
                  />
                </div>
                <div
                  className="text-xs font-black text-slate-700 dark:text-slate-200 w-10 text-right"
                  data-oid="neekycb"
                >
                  {Math.round(section.accuracy)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stamina Alert */}
      {fatigue !== null && fatigue > 15 && (
        <div
          className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex gap-3"
          data-oid="q:z5qps"
        >
          <div
            className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0"
            data-oid="zfosje_"
          >
            <Activity className="w-4 h-4 text-rose-500" data-oid="9swe5ab" />
          </div>
          <div className="space-y-1" data-oid="dte:ir7">
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400" data-oid="rlef6:1">
              Energy Drop Spotted
            </p>
            <p
              className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed"
              data-oid="nk9j13d"
            >
              Your accuracy dropped by {Math.round(fatigue)}% in the final{' '}
              {testType === 'listening' ? 'part' : 'passage'}. You might be getting tired toward the
              end.
            </p>
          </div>
        </div>
      )}

      {fatigue !== null && fatigue <= 15 && (
        <div
          className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex gap-2.5"
          data-oid="ib:uaae"
        >
          <div
            className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0"
            data-oid="njcb6c_"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" data-oid="jz5_p44" />
          </div>
          <div className="space-y-0.5" data-oid="m0hen01">
            <p
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400"
              data-oid="1kdryve"
            >
              Excellent Stamina
            </p>
            <p
              className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed"
              data-oid="ans1n2_"
            >
              You maintained consistent performance throughout{' '}
              {testType === 'listening' ? 'all four parts' : 'all three passages'}. Your mental
              endurance is high!
            </p>
          </div>
        </div>
      )}

      {fatigue === null && (
        <div className="p-3 rounded-xl bg-slate-500/5 border border-slate-200 dark:border-slate-800 flex gap-2.5">
          <div className="w-6 h-6 rounded-full bg-slate-500/10 flex items-center justify-center shrink-0">
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Section trend unavailable
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              At least two scored sections are needed to compare your stamina pattern.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default TimeEfficiencyCard;

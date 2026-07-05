import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Activity, TrendingUp, TrendingDown, AlertCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * AnswerJourneyCard
 *
 * Displays a timeline visualization of when answers were submitted.
 * Premium feature: helps identify procrastination patterns and focus zones.
 */

interface AnswerJourneyCardProps {
  answerTimestamps: Record<string, number> | null;
  totalQuestions: number;
  totalTimeSeconds: number;
  testType?: 'reading' | 'listening';
}

export function AnswerJourneyCard({
  answerTimestamps,
  totalQuestions,
  totalTimeSeconds,
  testType = 'reading',
}: AnswerJourneyCardProps) {
  const journeyData = useMemo(() => {
    if (
      !answerTimestamps ||
      Object.keys(answerTimestamps).length === 0 ||
      !Number.isFinite(totalTimeSeconds) ||
      totalTimeSeconds <= 0
    ) {
      return null;
    }

    const sortedEntries = Object.entries(answerTimestamps)
      .map(([qId, ts]) => ({ questionId: qId, timestamp: ts }))
      .sort((a, b) => a.timestamp - b.timestamp);

    const firstAnswer = sortedEntries[0]?.timestamp || 0;
    const lastAnswer = sortedEntries[sortedEntries.length - 1]?.timestamp || 0;
    const totalAnswerTime = lastAnswer - firstAnswer;

    // Divide test into quarters based on total test time
    // Timestamps are seconds elapsed since test start
    const quarterDuration = totalTimeSeconds / 4;
    const quarters = [0, 0, 0, 0];

    sortedEntries.forEach(({ timestamp }) => {
      // Use absolute timestamp (seconds since test start) for quarter assignment
      // This ensures accurate distribution across the test timeline
      const quarterIndex = Math.min(3, Math.floor(timestamp / quarterDuration));
      quarters[quarterIndex]++;
    });

    // Calculate pacing pattern
    const firstHalf = quarters[0] + quarters[1];
    const secondHalf = quarters[2] + quarters[3];
    const answeredCount = sortedEntries.length;

    let pattern: 'frontloaded' | 'backloaded' | 'balanced' = 'balanced';
    if (firstHalf > secondHalf * 1.5) pattern = 'frontloaded';
    else if (secondHalf > firstHalf * 1.5) pattern = 'backloaded';

    // Identify late surge (many answers in last quarter)
    const lateSurge = quarters[3] > answeredCount * 0.35;

    // Calculate average time between answers
    let gapSum = 0;
    for (let i = 1; i < sortedEntries.length; i++) {
      gapSum += sortedEntries[i].timestamp - sortedEntries[i - 1].timestamp;
    }
    const avgGap = sortedEntries.length > 1 ? gapSum / (sortedEntries.length - 1) : 0;

    return {
      quarters,
      pattern,
      lateSurge,
      avgGapSeconds: Math.round(avgGap),
      answeredCount,
      totalAnswerTime: Math.round(totalAnswerTime),
    };
  }, [answerTimestamps, totalTimeSeconds]);

  if (!journeyData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
        data-oid="fk4:la:"
      >
        <div className="flex items-center gap-2.5 mb-4" data-oid="9lfjx00">
          <div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center"
            data-oid="_x69w3m"
          >
            <Activity className="w-5 h-5 text-white" data-oid="8vf-jni" />
          </div>
          <div data-oid="tqgzs4q">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white" data-oid="udwbxvf">
              Answer Journey
            </h3>
            <p
              className="text-[10px] font-medium text-slate-400 uppercase tracking-wider"
              data-oid="2rd5iz5"
            >
              Premium Insight
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400" data-oid="dx45xz2">
          No timing data available for this test. Complete a new test to see your answer journey.
        </p>
      </motion.div>
    );
  }

  const { quarters, pattern, lateSurge, avgGapSeconds, answeredCount } = journeyData;
  const maxQuarter = Math.max(...quarters);

  const getPatternInfo = () => {
    switch (pattern) {
      case 'frontloaded':
        return {
          icon: TrendingUp,
          label: 'Strong Start',
          color: 'text-emerald-500',
          bg: 'bg-emerald-100 dark:bg-emerald-900/40',
          message: 'You answered most questions early. Great for building confidence!',
        };
      case 'backloaded':
        return {
          icon: TrendingDown,
          label: 'Late Finisher',
          color: 'text-amber-500',
          bg: 'bg-amber-100 dark:bg-amber-900/40',
          message: 'Many answers came at the end. Try pacing more evenly to reduce pressure.',
        };
      default:
        return {
          icon: Zap,
          label: 'Balanced Pace',
          color: 'text-blue-500',
          bg: 'bg-blue-100 dark:bg-blue-900/40',
          message: 'Steady answer flow throughout. Excellent time management!',
        };
    }
  };

  const patternInfo = getPatternInfo();
  const PatternIcon = patternInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
      data-oid="vtbjcxo"
    >
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4"
        data-oid="trly.s6"
      >
        <div className="flex items-center gap-2.5" data-oid="6oj.3i6">
          <div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center"
            data-oid="ly0re1d"
          >
            <Activity className="w-5 h-5 text-white" data-oid="5::ai8w" />
          </div>
          <div data-oid="awag_2m">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white" data-oid="7ovbtvg">
              Answer Journey
            </h3>
            <p
              className="text-[10px] font-medium text-slate-400 uppercase tracking-wider"
              data-oid="c71e9v3"
            >
              Premium Insight
            </p>
          </div>
        </div>
        <div
          className={cn(
            'self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg',
            patternInfo.bg
          )}
          data-oid="qtm5oya"
        >
          <PatternIcon className={cn('w-3.5 h-3.5', patternInfo.color)} data-oid="e_mlcew" />
          <span className={cn('text-xs font-bold', patternInfo.color)} data-oid="xr1fv_7">
            {patternInfo.label}
          </span>
        </div>
      </div>

      {/* Quarter Timeline Visualization */}
      <div className="mb-4" data-oid="63kyn2_">
        <div
          className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3"
          data-oid="hxfqz7p"
        >
          <Clock className="w-3.5 h-3.5" data-oid="wp-tk20" /> Answer Distribution
        </div>
        <div className="flex items-end gap-2 h-16" data-oid="d7z-_qx">
          {quarters.map((count, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center" data-oid="igcbxle">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${maxQuarter > 0 ? (count / maxQuarter) * 100 : 0}%` }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className={cn(
                  'w-full rounded-t-lg min-h-[4px]',
                  idx === 3 && lateSurge
                    ? 'bg-gradient-to-t from-amber-500 to-amber-400'
                    : 'bg-gradient-to-t from-violet-500 to-purple-400'
                )}
                data-oid="f:tkcug"
              />

              <span className="text-[10px] font-bold text-slate-400 mt-1.5" data-oid="ypqwwbn">
                Q{idx + 1}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-slate-400 mt-1" data-oid="536lrzg">
          <span data-oid="wb5:nep">Start</span>
          <span data-oid="-1tt245">End</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-4" data-oid="0o9z.8b">
        <div
          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center"
          data-oid="5nc8an7"
        >
          <div className="text-lg font-black text-slate-900 dark:text-white" data-oid="c33r:k3">
            {answeredCount}
          </div>
          <div className="text-[9px] font-bold text-slate-400 uppercase" data-oid="a:_9-45">
            Answered
          </div>
        </div>
        <div
          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center"
          data-oid="qa9-pp7"
        >
          <div className="text-lg font-black text-slate-900 dark:text-white" data-oid="1uw1.nt">
            {avgGapSeconds}s
          </div>
          <div className="text-[9px] font-bold text-slate-400 uppercase" data-oid="bhfvfph">
            Avg Gap
          </div>
        </div>
      </div>

      {/* Late Surge Warning */}
      {lateSurge && (
        <div
          className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 flex items-start gap-2"
          data-oid="pde5__y"
        >
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" data-oid="yweadtb" />
          <p className="text-[11px] text-amber-700 dark:text-amber-300" data-oid="wszl9sv">
            <span className="font-bold" data-oid="pneod-2">
              Late Surge Detected:
            </span>{' '}
            Over 35% of answers in the final quarter. Practice pacing to avoid time pressure.
          </p>
        </div>
      )}

      {/* Pattern Advice */}
      {!lateSurge && (
        <div
          className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/50"
          data-oid="vo9zsea"
        >
          <p className="text-[11px] text-violet-700 dark:text-violet-300" data-oid="gqh2nck">
            {patternInfo.message}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default AnswerJourneyCard;

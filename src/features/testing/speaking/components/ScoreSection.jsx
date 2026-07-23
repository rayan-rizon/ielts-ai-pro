import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { FileEdit, Star, Award, Sparkles } from 'lucide-react';
import { formatBandScore } from '../utils/speakingReportSummary';

const CRITERIA_STYLES = {
  fluency: {
    bar: 'from-rose-500 to-red-500',
    dot: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
  },
  lexical: {
    bar: 'from-amber-500 to-orange-500',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  grammar: {
    bar: 'from-purple-500 to-violet-500',
    dot: 'bg-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
  },
  pronunciation: {
    bar: 'from-teal-500 to-emerald-500',
    dot: 'bg-teal-500',
    text: 'text-teal-600 dark:text-teal-400',
  },
};

function getCriterionStyle(key, index) {
  const keys = ['fluency', 'lexical', 'grammar', 'pronunciation'];
  const matchedKey = keys.find((k) => key.toLowerCase().includes(k)) || keys[index % keys.length];
  return CRITERIA_STYLES[matchedKey] || CRITERIA_STYLES.fluency;
}

export function OverallScoreRing({ overallScore, bandInfo, _isTranscriptEstimate }) {
  const scoreProgress = overallScore == null ? 0 : Math.max(0, Math.min(9, overallScore));
  const scoreDisplay = formatBandScore(overallScore);

  return (
    <div className="group relative flex min-h-[285px] flex-col items-center justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-200/80 hover:shadow-xl hover:shadow-rose-950/5 dark:border-white/10 dark:bg-zinc-950 lg:col-span-4">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-rose-500/5 blur-2xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-rose-500/10" />

      <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
        Overall Band Score
      </h3>

      <div className="group/ring relative my-2 inline-flex items-center justify-center">
        {/* Ambient Glow */}
        <div className="absolute inset-2 rounded-full bg-rose-500/15 blur-2xl transition-opacity duration-500 group-hover/ring:opacity-30" />

        {/* Circular SVG Gauge */}
        <svg
          className="h-36 w-36 -rotate-90 drop-shadow-md"
          viewBox="0 0 148 148"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="scoreRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="50%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
          </defs>
          <circle
            className="text-rose-100/70 dark:text-rose-950/50"
            strokeWidth="13"
            stroke="currentColor"
            fill="transparent"
            r="62"
            cx="74"
            cy="74"
          />
          <motion.circle
            stroke="url(#scoreRingGradient)"
            strokeWidth="13"
            strokeDasharray="389.5"
            initial={{ strokeDashoffset: 389.5 }}
            animate={{
              strokeDashoffset: 389.5 * (1 - scoreProgress / 9),
            }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
            strokeLinecap="round"
            fill="transparent"
            r="62"
            cx="74"
            cy="74"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-4xl font-black leading-none tracking-tight text-transparent dark:from-white dark:to-zinc-200"
          >
            {scoreDisplay}
          </motion.span>
          <span className="mt-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500">
            Out of 9.0
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-1 text-xs font-black text-rose-600 shadow-sm dark:bg-rose-950/40 dark:text-rose-300">
          <Award className="h-3.5 w-3.5 text-rose-500" />
          {bandInfo.label}
        </span>
        <p className="mx-auto max-w-[250px] text-xs font-medium leading-relaxed text-slate-500 dark:text-zinc-400">
          {bandInfo.description}
        </p>
      </div>
    </div>
  );
}

export function CoachSummaryCard({ conciseFeedback, conciseTargetTip, showTargetTip }) {
  return (
    <div className="group relative flex min-h-[285px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-200/80 hover:shadow-xl hover:shadow-rose-950/5 dark:border-white/10 dark:bg-zinc-950 lg:col-span-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
            Coach Summary
          </h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
            <Sparkles className="h-3 w-3 text-rose-500" />
            AI Coach
          </span>
        </div>

        <div className="mt-4 flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/20">
            <FileEdit className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-zinc-200">
            {conciseFeedback ||
              'Complete more speaking responses to unlock a detailed coach summary.'}
          </p>
        </div>
      </div>

      {showTargetTip && (
        <div className="mt-4 rounded-xl border border-rose-200/80 bg-gradient-to-r from-rose-50/80 via-rose-50/40 to-amber-50/40 p-3.5 dark:border-rose-950/40 dark:from-rose-950/30 dark:to-zinc-900">
          <div className="mb-1 flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <Star className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            <p className="text-[10px] font-black uppercase tracking-wider">Focus Area</p>
          </div>
          <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-zinc-300">
            {conciseTargetTip}
          </p>
        </div>
      )}
    </div>
  );
}

export function PerformanceMetricsPanel({ criteria }) {
  if (criteria.length === 0) return null;

  const validScores = criteria.filter((c) => c.value != null);
  const avgScore =
    validScores.length > 0
      ? (validScores.reduce((acc, c) => acc + c.value, 0) / validScores.length).toFixed(1)
      : null;

  return (
    <div className="group relative flex min-h-[285px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:shadow-xl hover:shadow-slate-950/5 dark:border-white/10 dark:bg-zinc-950 lg:col-span-4">
      <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
        Performance at a Glance
      </h3>

      <div className="my-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
        {criteria.map((criterion, idx) => {
          const hasScore = criterion.value != null;
          const scoreVal = criterion.value;
          const style = getCriterionStyle(criterion.key || criterion.label, idx);

          return (
            <div key={criterion.key || idx} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', style.dot)} />
                  <p className="text-xs font-bold text-slate-800 dark:text-white">
                    {criterion.label}
                  </p>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {hasScore ? formatBandScore(scoreVal) : '—'}
                </span>
              </div>
              {hasScore && (
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(scoreVal / 9) * 100}%` }}
                    transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
                    className={cn('h-full rounded-full bg-gradient-to-r shadow-xs', style.bar)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {avgScore && (
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2 dark:bg-zinc-900/60">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Average
          </span>
          <span className="text-sm font-black text-slate-900 dark:text-white">{avgScore}</span>
        </div>
      )}
    </div>
  );
}

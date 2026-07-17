import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Target, Zap } from 'lucide-react';

const formatScore = (score) => {
  if (score == null) return 'N/A';
  return score % 1 === 0 ? score : score.toFixed(1);
};

const BAND_LEVELS = [
  {
    min: 8.5,
    label: 'Expert Level',
    description: 'You communicate with precise, flexible, and highly effective spoken English.',
  },
  {
    min: 7.5,
    label: 'Advanced Level',
    description: 'You are highly fluent and can talk about almost anything clearly.',
  },
  {
    min: 6.5,
    label: 'Good Level',
    description: 'You can express yourself effectively in most situations.',
  },
  {
    min: 5.5,
    label: 'Intermediate Level',
    description: 'You can hold a conversation, though you still make some mistakes.',
  },
  {
    min: 4.5,
    label: 'Basic Level',
    description: 'You can talk about simple topics and personal information.',
  },
  {
    min: 0,
    label: 'Beginner Level',
    description: 'You are just starting to use the language for basic needs.',
  },
];

const BAND_UNAVAILABLE = {
  label: 'Score Unavailable',
  description: 'Not enough assessment evidence was captured to calculate this score.',
};

const getBandInfo = (score) => {
  if (score == null) return BAND_UNAVAILABLE;
  const match = BAND_LEVELS.find((level) => score >= level.min);
  return match || BAND_UNAVAILABLE;
};

export function OverallScoreRing({ overallScore, isTranscriptEstimate, hasMetrics }) {
  const bandInfo = getBandInfo(overallScore);

  return (
    <div
      className={cn(
        'bg-white dark:bg-zinc-900 p-5 rounded-[2.5rem] border-2 border-border/80 dark:border-white/10 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden group/score shadow-xl shadow-rose-500/5',
        hasMetrics ? 'lg:col-span-4' : 'lg:col-span-12'
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.08] dark:from-rose-500/[0.12] via-transparent to-transparent opacity-100" />

      <p className="text-muted-foreground dark:text-zinc-300 text-[10px] font-black uppercase tracking-[0.4em] relative z-10">
        {isTranscriptEstimate ? 'Transcript Band Estimate' : 'Overall Band Score'}
      </p>

      <div className="relative inline-flex items-center justify-center group/ring">
        <div className="absolute inset-0 bg-rose-500 blur-[60px] opacity-10 group-hover/ring:opacity-25 transition-opacity duration-700" />

        <svg
          className="w-36 h-36 transform -rotate-90 drop-shadow-[0_0_25px_rgba(225,29,72,0.3)]"
          viewBox="0 0 144 144"
        >
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9f1239" />
              <stop offset="50%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
          <circle
            className="text-rose-500/10 dark:text-rose-400/10"
            strokeWidth="16"
            stroke="currentColor"
            fill="transparent"
            r="64"
            cx="72"
            cy="72"
          />
          <motion.circle
            stroke="url(#scoreGradient)"
            strokeWidth="16"
            strokeDasharray="402.1"
            initial={{ strokeDashoffset: 402.1 }}
            animate={{
              strokeDashoffset: 402.1 * (1 - (overallScore || 0) / 9),
            }}
            transition={{ duration: 1.8, ease: 'circOut', delay: 0.5 }}
            strokeLinecap="round"
            fill="transparent"
            r="64"
            cx="72"
            cy="72"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-6xl font-black text-foreground tracking-tighter cursor-default leading-none"
          >
            {formatScore(overallScore)}
          </motion.span>
        </div>
      </div>

      <div className="space-y-3 relative z-10 px-4">
        <p className="text-2xl font-black text-foreground dark:text-white leading-none tracking-tight">
          {bandInfo.label}
        </p>
        <p className="text-[13px] text-muted-foreground dark:text-zinc-300 font-semibold tracking-tight leading-relaxed max-w-[200px] mx-auto">
          {bandInfo.description}
        </p>
      </div>
    </div>
  );
}

export function PerformanceMetricsPanel({ performanceMetrics }) {
  if (performanceMetrics.length === 0) return null;

  return (
    <div className="lg:col-span-8 p-6 bg-white dark:bg-zinc-900 border-2 border-border/80 dark:border-white/10 rounded-[2.5rem] flex flex-col justify-center shadow-xl shadow-rose-500/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Target className="w-32 h-32 text-rose-500" />
      </div>

      <h3 className="text-xs font-black text-rose-600/80 dark:text-rose-400 mb-6 uppercase tracking-[0.4em] flex items-center gap-2">
        <Zap className="w-3 h-3" />
        Performance Metrics
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        {performanceMetrics.map((score) => {
          const numericValue = Number(score.value);
          return (
            <div
              key={score.label}
              className={`p-4 rounded-2xl border border-border/50 dark:border-white/10 ${score.bg} dark:bg-zinc-800/50 transition-all duration-300 hover:border-rose-500/20 dark:hover:border-rose-500/40 group/metric shadow-sm`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 shadow-sm border border-border/50 dark:border-white/20 text-rose-500 group-hover/metric:scale-110 transition-transform duration-300">
                    <score.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-black text-foreground/70 dark:text-zinc-100 uppercase tracking-widest leading-tight max-w-[100px]">
                    {score.label}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xl font-black text-rose-600 dark:text-rose-400 leading-none">
                    {score.value}
                  </span>
                  <span className="text-[8px] font-bold text-muted-foreground dark:text-zinc-200 uppercase">
                    / 9.0
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-muted/30 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(numericValue / 9) * 100}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 1 }}
                  className={`h-full bg-gradient-to-r ${score.color} relative`}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

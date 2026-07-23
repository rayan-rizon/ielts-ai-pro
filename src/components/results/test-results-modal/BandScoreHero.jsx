import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';

function getBandDescriptor(score) {
  const num = parseFloat(score);
  if (num >= 8.5) return 'Expert Level';
  if (num >= 7.5) return 'Advanced Level';
  if (num >= 6.5) return 'Upper Intermediate';
  if (num >= 5.5) return 'Intermediate Level';
  if (num >= 4.5) return 'Pre-Intermediate';
  return 'Basic Level';
}

const ScoreGaugeCircle = React.memo(({ scoreNum, bandText }) => {
  const size = 100;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, (scoreNum / 9.0) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative shrink-0 flex items-center justify-center w-[100px] h-[100px]">
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
        <circle
          className="text-blue-100/80 dark:text-slate-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
          stroke="url(#ringGrad)"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 leading-none mb-0.5">
          Band
        </span>
        <span className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none tracking-tight">
          {bandText}
        </span>
      </div>
    </div>
  );
});
ScoreGaugeCircle.displayName = 'ScoreGaugeCircle';

const ScoreDeltaBadge = React.memo(({ scoreNum, previousScore }) => {
  if (previousScore == null) return null;
  const isBetter = scoreNum > previousScore;
  const isWorse = scoreNum < previousScore;
  const delta = (scoreNum - previousScore).toFixed(1);
  const text = isBetter ? `+${delta}` : isWorse ? `${delta}` : 'Same';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
        isBetter
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
          : isWorse
            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
      )}
    >
      <TrendingUp className={cn('w-3 h-3', isWorse && 'rotate-180')} />
      <span>{text}</span>
    </div>
  );
});
ScoreDeltaBadge.displayName = 'ScoreDeltaBadge';

const BookTrendGraphic = React.memo(() => (
  <div className="hidden md:flex items-center justify-end shrink-0 pointer-events-none opacity-90 dark:opacity-75">
    <svg className="w-60 h-26" viewBox="0 0 220 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M30 65C50 55 80 55 105 62V25C80 18 50 18 30 28V65Z"
        fill="url(#bookGradLeft)"
        stroke="#60A5FA"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M180 65C160 55 130 55 105 62V25C130 18 160 18 180 28V65Z"
        fill="url(#bookGradRight)"
        stroke="#60A5FA"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <line
        x1="42"
        y1="35"
        x2="90"
        y2="30"
        stroke="#93C5FD"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="42"
        y1="43"
        x2="90"
        y2="38"
        stroke="#93C5FD"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="42"
        y1="51"
        x2="85"
        y2="46"
        stroke="#93C5FD"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="120"
        y1="30"
        x2="168"
        y2="35"
        stroke="#93C5FD"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="120"
        y1="38"
        x2="168"
        y2="43"
        stroke="#93C5FD"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="125"
        y1="46"
        x2="168"
        y2="51"
        stroke="#93C5FD"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M95 55L120 53L145 35L170 38L195 20L210 10"
        stroke="#2563EB"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="95" cy="55" r="4" fill="white" stroke="#2563EB" strokeWidth="2.5" />
      <circle cx="120" cy="53" r="4" fill="white" stroke="#2563EB" strokeWidth="2.5" />
      <circle cx="145" cy="35" r="4" fill="white" stroke="#2563EB" strokeWidth="2.5" />
      <circle cx="170" cy="38" r="4" fill="white" stroke="#2563EB" strokeWidth="2.5" />
      <circle cx="195" cy="20" r="4" fill="white" stroke="#2563EB" strokeWidth="2.5" />
      <circle cx="210" cy="10" r="4" fill="white" stroke="#2563EB" strokeWidth="2.5" />
      <defs>
        <linearGradient
          id="bookGradLeft"
          x1="30"
          y1="20"
          x2="105"
          y2="65"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#EFF6FF" />
          <stop offset="1" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient
          id="bookGradRight"
          x1="180"
          y1="20"
          x2="105"
          y2="65"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#EFF6FF" />
          <stop offset="1" stopColor="#DBEAFE" />
        </linearGradient>
      </defs>
    </svg>
  </div>
));
BookTrendGraphic.displayName = 'BookTrendGraphic';

export const BandScoreHero = React.memo(({ testResults, getAssessmentMessage }) => {
  const scoreNum = parseFloat(testResults?.bandScore) || 0;
  const bandText = scoreNum.toFixed(1);
  const descriptor = getBandDescriptor(scoreNum);
  const message = getAssessmentMessage
    ? getAssessmentMessage(scoreNum)
    : 'Keep practicing. Consistency is key to improvement.';

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-blue-200/60 dark:border-slate-800 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/30 dark:from-slate-900/95 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-5 md:px-6 md:py-5 shadow-sm shadow-blue-500/5 transition-all"
      data-oid="band-score-hero"
    >
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
          <ScoreGaugeCircle scoreNum={scoreNum} bandText={bandText} />

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">
                Overall Band Score
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800/80 text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider shadow-2xs">
                {descriptor}
              </span>
              <ScoreDeltaBadge scoreNum={scoreNum} previousScore={testResults?.previousBandScore} />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight my-1">
              Band {bandText}
            </h2>

            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <BookTrendGraphic />
      </div>
    </div>
  );
});

BandScoreHero.displayName = 'BandScoreHero';

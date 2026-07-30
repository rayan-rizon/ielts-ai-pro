import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Minus, Clock } from 'lucide-react';
import { ArchScoreGauge } from './ArchScoreGauge';

function getMotivationalText(score) {
  const num = parseFloat(score);
  if (num >= 8)
    return {
      title: 'Outstanding performance!',
      subtitle: 'Keep refining the details that separate excellent from expert.',
    };
  if (num >= 7)
    return {
      title: 'Great work!',
      subtitle: 'You are close to top university benchmarks. Stay focused.',
    };
  if (num >= 6)
    return {
      title: 'Solid progress!',
      subtitle: 'A strong foundation. Targeted practice can take you to Band 7.',
    };
  if (num >= 5)
    return {
      title: 'Keep pushing!',
      subtitle: 'Consistency on key question types will move your score.',
    };
  return {
    title: 'Keep going!',
    subtitle: 'Consistency and focused practice will help you improve.',
  };
}

const StatIcon = ({ tone = 'slate', children }) => {
  const tones = {
    indigo:
      'bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 border border-[#d2d7f8]/80 dark:border-indigo-500/40',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40',
    amber:
      'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40',
    slate:
      'bg-slate-100/90 text-slate-700 dark:bg-white/10 dark:text-slate-300 border border-slate-200/80 dark:border-white/10',
  };
  return (
    <div
      className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${tones[tone] || tones.slate}`}
    >
      {children}
    </div>
  );
};

export function HeroScoreCard({ testResults }) {
  const score = parseFloat(testResults?.bandScore) || 0;
  const correct = testResults?.correctAnswers || 0;
  const total = testResults?.totalQuestions || 40;
  const unanswered = testResults?.unanswered ?? testResults?.errorPatterns?.unansweredCount ?? 0;
  const mistakes = Math.max(0, total - correct - unanswered);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const timeSeconds =
    testResults?.timeMetrics?.totalTimeSpent ||
    (testResults?.durationMinutes ? testResults.durationMinutes * 60 : null);
  const formattedTime =
    Number.isFinite(timeSeconds) && timeSeconds > 0
      ? `${Math.floor(timeSeconds / 60)}m ${Math.floor(timeSeconds % 60)}s`
      : 'Not recorded';
  const motivational = getMotivationalText(score);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="h-full min-h-[304px] grid grid-cols-1 md:grid-cols-[minmax(270px,1.15fr)_1px_minmax(220px,0.85fr)] items-center gap-4 p-4 xl:p-5 rounded-2xl bg-gradient-to-br from-white via-[#fcfbff] to-[#f3f2ff] dark:from-[#101322] dark:via-[#0e111d] dark:to-[#141829] border border-[#dce0f5] dark:border-white/10 shadow-[0_10px_30px_-15px_rgba(86,97,233,0.15)] hover:shadow-[0_16px_36px_-18px_rgba(86,97,233,0.22)] transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute -left-20 -top-20 w-64 h-64 rounded-full bg-[#5661e9]/10 dark:bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative min-w-0 flex justify-center">
        <ArchScoreGauge score={score} />
      </div>

      <div className="hidden md:block w-px h-[210px] bg-[#dce0f5] dark:bg-white/10" />

      <div className="relative min-w-0 space-y-3">
        <div>
          <h3 className="text-base font-black text-slate-950 dark:text-white tracking-tight">
            {motivational.title}
            <span className="ml-1 text-[#5661e9]">✦</span>
          </h3>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            {motivational.subtitle}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e2e5f6] dark:border-white/10 bg-white/90 dark:bg-white/5 px-3.5 py-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <StatIcon tone="indigo">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </StatIcon>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Correct
                </p>
                <p className="text-base font-black leading-none text-slate-950 dark:text-white mt-0.5">
                  {correct}{' '}
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    / {total}
                  </span>
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-black text-[#5661e9] dark:text-indigo-400">{accuracy}%</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Accuracy</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2.5 rounded-xl border border-[#e2e5f6] dark:border-white/10 bg-white/90 dark:bg-white/5 px-3.5 py-2.5 shadow-2xs">
              <StatIcon tone="rose">
                <X className="w-4 h-4 stroke-[2.5]" />
              </StatIcon>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Mistakes
                </p>
                <p className="text-base font-black leading-none text-rose-600 dark:text-rose-400 mt-0.5">
                  {mistakes}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-[#e2e5f6] dark:border-white/10 bg-white/90 dark:bg-white/5 px-3.5 py-2.5 shadow-2xs">
              <StatIcon tone="amber">
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </StatIcon>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Skipped
                </p>
                <p className="text-base font-black leading-none text-amber-600 dark:text-amber-400 mt-0.5">
                  {unanswered}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e2e5f6] dark:border-white/10 bg-white/90 dark:bg-white/5 px-3.5 py-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <StatIcon tone="slate">
                <Clock className="w-4 h-4" />
              </StatIcon>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Time taken
              </span>
            </div>
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {formattedTime}
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default HeroScoreCard;

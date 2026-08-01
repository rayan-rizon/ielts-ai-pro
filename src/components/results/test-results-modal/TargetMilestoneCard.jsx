import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Target } from 'lucide-react';
import { QUESTION_TYPE_LABELS } from './utils';
import { LISTENING_RAW_SCORE_THRESHOLDS, READING_RAW_SCORE_THRESHOLDS } from '@/lib/ieltsBandScore';

const IMPROVEMENT_TIPS = {
  note_completion:
    'Work on scanning for key information, spelling accuracy, and concise note-taking.',
  notes_completion:
    'Work on scanning for key information, spelling accuracy, and concise note-taking.',
  matching: 'Focus on identifying keywords in paragraph options and eliminating used headings.',
  matching_headings: 'Read first and last sentences of paragraphs carefully to capture main ideas.',
  true_false_not_given:
    'Carefully distinguish explicit contradictions (False) from missing details (Not Given).',
  yes_no_not_given:
    "Analyze the author's precise perspective rather than general factual statements.",
  multiple_choice: 'Identify distractors by cross-referencing synonyms in the passage context.',
  summary_completion: 'Check word limits and ensure grammar fits accurately around the gaps.',
  table_completion: 'Examine table column headers before searching for numerical or named details.',
  short_answer: 'Keep answers strictly within stated word limits directly quoted from the text.',
  map_labeling: 'Preview labels and use directional language to follow the map in order.',
  flowchart: 'Follow the sequence carefully and predict the grammar of each missing answer.',
  gap_fill: 'Use the surrounding words to predict the answer form before listening for the detail.',
};

export function TargetMilestoneCard({ testResults, onReviewAnswers, testType = 'reading' }) {
  const currentBand = parseFloat(testResults?.bandScore) || 0;
  const correct = testResults?.correctAnswers || 0;
  const total = testResults?.totalQuestions || 40;

  // Find next band level
  const thresholds =
    testType === 'listening' ? LISTENING_RAW_SCORE_THRESHOLDS : READING_RAW_SCORE_THRESHOLDS;
  const bandLevels = Object.keys(thresholds)
    .map(Number)
    .sort((a, b) => a - b);
  const nextBand =
    bandLevels.find((b) => b > currentBand) || (currentBand < 9 ? currentBand + 0.5 : 9.0);

  // Calculate progress % toward next milestone
  const nextThreshold = Math.ceil(((thresholds[nextBand] || 40) / 40) * total);
  const answersNeeded = Math.max(0, nextThreshold - correct);
  const prevBand = [...bandLevels].reverse().find((b) => b <= currentBand);
  const prevThreshold = prevBand ? Math.ceil(((thresholds[prevBand] || 0) / 40) * total) : 0;
  const range = Math.max(1, nextThreshold - prevThreshold);
  const progressPct =
    currentBand >= 9.0
      ? 100
      : Math.min(100, Math.max(0, Math.round(((correct - prevThreshold) / range) * 100)));

  // Identify weakest question type
  const weakestType = React.useMemo(() => {
    if (!testResults?.typeStats) return null;
    let weakest = null;
    Object.entries(testResults.typeStats).forEach(([type, stats]) => {
      if (stats?.total > 0) {
        const accuracy = (stats.correct / stats.total) * 100;
        const missed = stats.total - stats.correct;
        if (
          !weakest ||
          accuracy < weakest.accuracy ||
          (accuracy === weakest.accuracy && missed > weakest.missed)
        ) {
          weakest = { type, accuracy, missed };
        }
      }
    });
    return weakest;
  }, [testResults?.typeStats]);

  const weakestLabel = weakestType?.type
    ? QUESTION_TYPE_LABELS[weakestType.type] || weakestType.type.replace(/_/g, ' ')
    : 'Question Analysis';

  const tipText =
    weakestType?.type && IMPROVEMENT_TIPS[weakestType.type]
      ? IMPROVEMENT_TIPS[weakestType.type]
      : 'Focus on scanning techniques, time allocation per passage, and vocabulary context.';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="p-4 xl:p-5 rounded-2xl bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#131315] dark:to-[#131315] border border-[#e4e2f0] dark:border-white/[0.07] shadow-2xs transition-all duration-300 flex flex-col h-full gap-4 relative overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#5a63df]/10 dark:bg-[#5a63df]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white text-[#5a63df] shadow-xs dark:bg-[#5a63df]/20 dark:text-[#a9afff] border border-[#5a63df]/20 dark:border-[#5a63df]/30 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              Your next milestone
            </p>
            <h3 className="text-base font-black tracking-tight text-slate-950 dark:text-white">
              Band {nextBand.toFixed(1)}
            </h3>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tracking-tight text-[#5a63df] dark:text-[#c9cdf3]">
            +{answersNeeded}
          </p>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
            correct answer{answersNeeded === 1 ? '' : 's'} needed
          </p>
        </div>
      </div>

      <div className="space-y-1.5 z-10">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500 dark:text-slate-400">Milestone progress</span>
          <span className="text-xs font-black text-[#5a63df] dark:text-[#a9afff]">
            {progressPct}%
          </span>
        </div>
        <div className="h-2.5 bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-[#5a63df] rounded-full"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onReviewAnswers}
        className="w-full mt-auto p-3.5 rounded-xl bg-[#5a63df] hover:bg-[#4a52c9] text-white flex items-center gap-3 transition-all text-left group z-10 shadow-sm"
      >
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-indigo-100">Best place to start</p>
          <h4 className="text-sm font-black leading-tight">Review {weakestLabel}</h4>
          <p className="text-[11px] text-indigo-100 line-clamp-2 mt-1">{tipText}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 shrink-0 group-hover:translate-x-0.5 transition-transform">
          <ArrowRight className="w-4 h-4" />
        </span>
      </button>
    </motion.div>
  );
}

export default TargetMilestoneCard;

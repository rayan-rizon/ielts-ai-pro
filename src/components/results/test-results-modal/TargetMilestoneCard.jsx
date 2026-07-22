import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, ChevronRight } from 'lucide-react';
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="p-4 xl:p-5 rounded-2xl bg-white dark:bg-slate-950 border border-blue-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full space-y-3 relative overflow-hidden"
    >
      {/* Liquid Glass Background Accents */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-50 dark:bg-blue-950/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-black tracking-tight text-slate-950 dark:text-white">
            Your Path to Band {nextBand.toFixed(1)}
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
          Band {nextBand.toFixed(1)}
        </span>
      </div>

      {/* Milestone Progress Bar (Clean non-overlapping header) */}
      <div className="space-y-1.5 z-10">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500 dark:text-slate-400">
            Progress to Band {nextBand.toFixed(1)}
          </span>
          <span className="text-xs font-black text-blue-600 dark:text-blue-400">
            {progressPct}%
          </span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-blue-600 rounded-full"
          />
        </div>
      </div>

      {/* Key Weakness Card */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-start gap-3 z-10">
        <div className="w-8.5 h-8.5 rounded-xl bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 flex items-center justify-center shrink-0">
          <Target className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Key weakness
          </p>
          <h4 className="text-sm font-black text-slate-950 dark:text-white leading-tight my-0.5">
            {weakestLabel}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
            Focus on improving accuracy in {weakestLabel.toLowerCase()} questions.
          </p>
        </div>
      </div>

      {/* What to Improve Action Button */}
      <button
        type="button"
        onClick={onReviewAnswers}
        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center gap-3 transition-colors text-left group z-10"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
            What to improve
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {tipText}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </button>

      {/* The current results flow can take learners directly to their mistakes. */}
      <button
        type="button"
        onClick={onReviewAnswers}
        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center gap-3 transition-colors text-left group z-10"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Target className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
            Review this focus area
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            See the mistakes that are holding back your score.
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </button>
    </motion.div>
  );
}

export default TargetMilestoneCard;

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Target, BookOpen, Headphones, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * WhatsNextCard
 *
 * Displays actionable next steps based on test performance.
 * Shows the weakest skill and provides guidance on what to practice.
 */

interface TypeStats {
  correct: number;
  total: number;
}

interface WhatsNextCardProps {
  typeStats?: Record<string, TypeStats>;
  bandScore: number;
  testType?: 'reading' | 'listening';
  onPractice?: () => void;
  className?: string;
}

// Map question types to human-friendly names
const QUESTION_TYPE_LABELS: Record<string, string> = {
  gap_fill: 'Gap Fill',
  table_completion: 'Table Completion',
  sentence_completion: 'Sentence Completion',
  summary_completion: 'Summary Completion',
  note_completion: 'Note Completion',
  notes_completion: 'Note Completion',
  short_answer: 'Short Answer',
  matching: 'Matching',
  matching_features: 'Feature Matching',
  matching_headings: 'Heading Matching',
  true_false_not_given: 'True/False/Not Given',
  yes_no_not_given: 'Yes/No/Not Given',
  multiple_choice: 'Multiple Choice',
  map_labeling: 'Map Labeling',
  diagram_completion: 'Diagram Completion',
  flow_chart_completion: 'Flow Chart',
  flowchart: 'Flow Chart',
};

// Tips for each question type
const IMPROVEMENT_TIPS: Record<string, string> = {
  gap_fill: 'Practice skimming for keywords and scanning for specific details.',
  table_completion: 'Focus on understanding table headers before reading.',
  sentence_completion: 'Look for contextual clues around the blank spaces.',
  summary_completion: 'Read the summary first to understand what to look for.',
  note_completion: 'Practice note-taking structure recognition.',
  notes_completion: 'Practice note-taking structure recognition.',
  short_answer: 'Stick to word limits and use exact words from the text.',
  matching: 'Underline key terms and match systematically.',
  matching_features: 'Identify features first, then scan for matches.',
  matching_headings: 'Read first and last sentences of each paragraph.',
  true_false_not_given: 'Distinguish between "False" and "Not Given" carefully.',
  yes_no_not_given: "Focus on the author's opinion, not general facts.",
  multiple_choice: 'Eliminate wrong options first, then choose.',
  map_labeling: 'Trace the audio directions while looking at the map.',
  diagram_completion: 'Follow the process flow and label as you read.',
  flow_chart_completion: 'Understand the sequence before filling blanks.',
  flowchart: 'Understand the sequence before filling blanks.',
};

// Encouraging messages based on band score
const getEncouragement = (bandScore: number): { message: string; icon: React.ElementType } => {
  if (bandScore >= 8) {
    return { message: 'Excellent! Fine-tune for perfection', icon: Sparkles };
  } else if (bandScore >= 7) {
    return { message: 'Great progress! Almost there', icon: TrendingUp };
  } else if (bandScore >= 6) {
    return { message: 'Good foundation! Keep practicing', icon: Target };
  } else if (bandScore >= 5) {
    return { message: "You're improving! Focus on weak areas", icon: TrendingUp };
  }
  return { message: 'Every expert was once a beginner!', icon: Target };
};

export function WhatsNextCard({
  typeStats,
  bandScore,
  testType = 'reading',
  onPractice,
  className,
}: WhatsNextCardProps) {
  // Find the weakest question type
  const weakestType = React.useMemo(() => {
    if (!typeStats || Object.keys(typeStats).length === 0) return null;

    let weakest: { type: string; percentage: number } | null = null;

    Object.entries(typeStats).forEach(([type, stats]) => {
      if (stats.total > 0) {
        const percentage = (stats.correct / stats.total) * 100;
        if (!weakest || percentage < weakest.percentage) {
          weakest = { type, percentage };
        }
      }
    });

    return weakest;
  }, [typeStats]);

  // If no data or all scores are good, show general message
  if (!weakestType || weakestType.percentage >= 80) {
    const encouragement = getEncouragement(bandScore);
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs',
          className
        )}
        data-oid="2g00ofi"
      >
        <div className="flex items-start gap-3" data-oid="3bccakn">
          <div
            className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0"
            data-oid="rlom:uf"
          >
            <encouragement.icon className="w-4 h-4" data-oid="q_y0:u3" />
          </div>
          <div className="flex-1 min-w-0" data-oid="4.xtt1y">
            <h4
              className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5"
              data-oid="l42-z2l"
            >
              {encouragement.message}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed" data-oid="4w012nl">
              Your performance is strong! Continue with more practice tests to maintain consistency.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const typeLabel = QUESTION_TYPE_LABELS[weakestType.type] || weakestType.type.replace(/_/g, ' ');
  const tip = IMPROVEMENT_TIPS[weakestType.type] || 'Practice more questions of this type.';
  const Icon = testType === 'listening' ? Headphones : BookOpen;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs',
        className
      )}
      data-oid="stww8ye"
    >
      <div className="flex items-start gap-3" data-oid="hg5ax3u">
        <div
          className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0"
          data-oid="p60baa4"
        >
          <Icon className="w-4 h-4" data-oid="0iq.ozs" />
        </div>
        <div className="flex-1 min-w-0" data-oid="4bz.zr2">
          <div className="flex items-center gap-2 mb-1" data-oid="upwq5ox">
            <span
              className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider"
              data-oid="7lhd.3y"
            >
              Action Plan
            </span>
            <span
              className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60"
              data-oid="ts-8mfi"
            >
              Focus Area
            </span>
          </div>
          <h4
            className="text-xs font-bold text-slate-900 dark:text-white mb-0.5"
            data-oid="qa_buo0"
          >
            Practice {typeLabel}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-relaxed" data-oid="rre8mqd">
            {tip}
          </p>
          <div className="flex items-center justify-between gap-2" data-oid="skk7wc9">
            <div className="flex items-center gap-2" data-oid="x_k:k:o">
              <div
                className="w-16 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
                data-oid="3s2.5f9"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${weakestType.percentage}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="h-full rounded-full bg-indigo-500"
                  data-oid="hr1wvv1"
                />
              </div>
              <span
                className="text-[10px] font-semibold text-slate-400"
                data-oid="q4y_8ro"
              >
                {Math.round(weakestType.percentage)}% accuracy
              </span>
            </div>
            {onPractice && (
              <button
                onClick={onPractice}
                className="h-6 px-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition-colors inline-flex items-center gap-1"
                data-oid="4gzgwta"
              >
                Practice
                <ArrowRight className="w-3 h-3" data-oid="_s:7ghs" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default WhatsNextCard;

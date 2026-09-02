import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Bar,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  Pill,
} from '@/features/dashboard/components/primitives';
import { QUESTION_TYPE_LABELS } from './utils';
import { LISTENING_RAW_SCORE_THRESHOLDS, READING_RAW_SCORE_THRESHOLDS } from '@/lib/ieltsBandScore';

const IMPROVEMENT_TIPS = {
  note_completion: 'Scan for key information, watch spelling, keep notes concise.',
  notes_completion: 'Scan for key information, watch spelling, keep notes concise.',
  matching: 'Find keywords in each option and eliminate ones already used.',
  matching_headings: 'Read the first and last sentence of each paragraph for the main idea.',
  true_false_not_given: 'Separate explicit contradictions (False) from missing detail (Not Given).',
  yes_no_not_given: "Track the author's stated view, not general facts.",
  multiple_choice: 'Spot distractors by cross-checking synonyms against the passage.',
  summary_completion: 'Respect the word limit and check the grammar fits the gap.',
  table_completion: 'Read the column headers before hunting for the detail.',
  short_answer: 'Stay inside the word limit, quoting directly from the text.',
  map_labeling: 'Preview the labels and follow directional language in order.',
  flowchart: 'Follow the sequence and predict the grammar of each missing answer.',
  gap_fill: 'Use the surrounding words to predict the answer form before you listen.',
};

/**
 * Raw-score threshold for a band, scaled to this paper's question count.
 * Returns null when the band is not in the table so the card can say so
 * instead of the old `|| 40` fallback, which silently claimed a full-marks
 * requirement whenever the lookup missed.
 */
function thresholdFor(thresholds, band, total) {
  const raw = thresholds?.[band];
  if (!Number.isFinite(raw)) return null;
  return Math.min(total, Math.ceil((raw / 40) * total));
}

function useMilestone(testResults, testType) {
  return React.useMemo(() => {
    const currentBand = parseFloat(testResults?.bandScore) || 0;
    const correct = Math.max(0, Number(testResults?.correctAnswers) || 0);
    const total = Math.max(1, Number(testResults?.totalQuestions) || 40);

    const thresholds =
      testType === 'listening' ? LISTENING_RAW_SCORE_THRESHOLDS : READING_RAW_SCORE_THRESHOLDS;
    const bands = Object.keys(thresholds)
      .map(Number)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);

    const nextBand = bands.find((b) => b > currentBand) ?? null;
    if (nextBand === null || currentBand >= 9) {
      return { atCeiling: true, currentBand };
    }

    const nextThreshold = thresholdFor(thresholds, nextBand, total);
    if (nextThreshold === null) return { atCeiling: false, unknown: true, nextBand };

    const prevBand = [...bands].reverse().find((b) => b <= currentBand);
    const prevThreshold = prevBand ? (thresholdFor(thresholds, prevBand, total) ?? 0) : 0;
    const span = Math.max(1, nextThreshold - prevThreshold);

    return {
      atCeiling: false,
      nextBand,
      answersNeeded: Math.max(0, nextThreshold - correct),
      progressPct: Math.min(100, Math.max(0, Math.round(((correct - prevThreshold) / span) * 100))),
    };
  }, [testResults, testType]);
}

/** Lowest-accuracy question type, tie-broken by how many marks it cost. */
function useWeakestType(typeStats) {
  return React.useMemo(() => {
    if (!typeStats) return null;
    let weakest = null;
    Object.entries(typeStats).forEach(([type, s]) => {
      if (!s?.total) return;
      const accuracy = (s.correct / s.total) * 100;
      const missed = s.total - s.correct;
      if (
        !weakest ||
        accuracy < weakest.accuracy ||
        (accuracy === weakest.accuracy && missed > weakest.missed)
      ) {
        weakest = { type, accuracy, missed };
      }
    });
    // A type the learner got fully right is not a weakness worth pointing at.
    return weakest && weakest.missed > 0 ? weakest : null;
  }, [typeStats]);
}

export function TargetMilestoneCard({ testResults, onReviewAnswers, testType = 'reading' }) {
  const milestone = useMilestone(testResults, testType);
  const weakest = useWeakestType(testResults?.typeStats);

  const weakestLabel = weakest
    ? QUESTION_TYPE_LABELS[weakest.type] || weakest.type.replace(/_/g, ' ')
    : null;
  const tip = weakest
    ? IMPROVEMENT_TIPS[weakest.type] || 'Review the passage evidence behind each missed answer.'
    : 'Nothing stands out as a weak spot — re-read the answers you were unsure of.';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={cn(PANEL, 'flex h-full flex-col gap-2.5 p-3.5')}
    >
      <PanelTitle label="Next milestone" accent />

      {milestone.atCeiling ? (
        <div className="flex items-center gap-2.5">
          <IconChip icon={Target} tone="emerald" size="md" />
          <div className="min-w-0">
            <p
              className={cn(
                NUM,
                'text-lg font-extrabold leading-none text-slate-900 dark:text-slate-50'
              )}
            >
              Band 9.0
            </p>
            <p className={cn(MICRO, MUTED, 'mt-1')}>Top band reached on this paper</p>
          </div>
        </div>
      ) : milestone.unknown ? (
        <p className={cn(MICRO, MUTED)}>Band thresholds unavailable for this paper.</p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <IconChip icon={Target} tone="accent" size="md" />
              <div className="min-w-0">
                <p className={cn(MICRO, MUTED)}>Target</p>
                <p
                  className={cn(
                    NUM,
                    'text-lg font-extrabold leading-none text-slate-900 dark:text-slate-50'
                  )}
                >
                  Band {milestone.nextBand.toFixed(1)}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  NUM,
                  'text-2xl font-extrabold leading-none text-[#5a63df] dark:text-[#a9afff]'
                )}
              >
                +{milestone.answersNeeded}
              </p>
              <p className={cn(MICRO, MUTED, 'mt-1')}>
                answer{milestone.answersNeeded === 1 ? '' : 's'} needed
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={cn(MICRO, MUTED)}>Progress to band</span>
              <span className={cn(NUM, 'text-xs font-bold text-[#5a63df] dark:text-[#a9afff]')}>
                {milestone.progressPct}%
              </span>
            </div>
            <Bar value={milestone.progressPct} />
          </div>
        </>
      )}

      <button
        type="button"
        onClick={onReviewAnswers}
        className="group mt-auto flex items-center gap-3 rounded-lg bg-[#5a63df] p-3 text-left text-white transition-all hover:bg-[#4a52c9] active:scale-[0.99]"
      >
        <div className="min-w-0 flex-1">
          <p className={cn(MICRO, 'text-white/70')}>Best place to start</p>
          <h4
            className="mt-0.5 truncate text-[13px] font-extrabold leading-tight"
            title={weakestLabel ? `Review ${weakestLabel}` : 'Review your answers'}
          >
            {weakestLabel ? `Review ${weakestLabel}` : 'Review your answers'}
          </h4>
          <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-white/75">
            {tip}
          </p>
        </div>
        {weakest && (
          <Pill tone="neutral" className="shrink-0 border-white/25 bg-white/15 text-white">
            <span className={NUM}>{Math.round(weakest.accuracy)}%</span>
          </Pill>
        )}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 transition-transform group-hover:translate-x-0.5">
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </button>
    </motion.div>
  );
}

export default TargetMilestoneCard;

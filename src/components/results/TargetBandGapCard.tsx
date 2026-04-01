import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Zap, Award, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * TargetBandGapCard
 *
 * Shows users how close they are to the next band level and what improvements are needed.
 * Provides clear, actionable guidance on reaching their next milestone.
 */

interface TargetBandGapCardProps {
    currentBand: number;
    correctAnswers: number;
    totalQuestions: number;
    testType?: 'reading' | 'listening';
    weakestType?: { type: string; accuracy: number } | null;
    className?: string;
}

// Band score thresholds (scaled to 40 questions - official IELTS Academic)
const READING_THRESHOLDS: Record<number, number> = {
    9.0: 39,
    8.5: 37,
    8.0: 35,
    7.5: 33,
    7.0: 30,
    6.5: 27,
    6.0: 23,
    5.5: 19,
    5.0: 15,
    4.5: 13,
    4.0: 10,
};

const LISTENING_THRESHOLDS: Record<number, number> = {
    9.0: 39,
    8.5: 37,
    8.0: 35,
    7.5: 32,
    7.0: 30,
    6.5: 26,
    6.0: 23,
    5.5: 18,
    5.0: 16,
    4.5: 13,
    4.0: 10,
};

// Human-readable question type labels
const QUESTION_TYPE_LABELS: Record<string, string> = {
    gap_fill: 'Gap Fill',
    table_completion: 'Table Completion',
    sentence_completion: 'Sentence Completion',
    summary_completion: 'Summary Completion',
    note_completion: 'Note Completion',
    notes_completion: 'Notes Completion',
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

export function TargetBandGapCard({
    currentBand,
    correctAnswers,
    totalQuestions,
    testType = 'reading',
    weakestType,
    className,
}: TargetBandGapCardProps) {
    const thresholds = testType === 'listening' ? LISTENING_THRESHOLDS : READING_THRESHOLDS;

    // Find the next band level
    const bandLevels = Object.keys(thresholds)
        .map(Number)
        .sort((a, b) => a - b);

    const nextBand = bandLevels.find((band) => band > currentBand) || null;
    const currentBandIndex = bandLevels.findIndex((band) => band >= currentBand);

    // Calculate how many more correct answers needed for next band
    const calculateNeeded = (targetBand: number): number => {
        const targetRaw40 = thresholds[targetBand];
        // Scale from 40 to actual total questions
        const targetRaw = Math.ceil((targetRaw40 / 40) * totalQuestions);
        return Math.max(0, targetRaw - correctAnswers);
    };

    const neededForNext = nextBand ? calculateNeeded(nextBand) : 0;

    // Calculate progress to next band (0-100%)
    const progressToNext = React.useMemo(() => {
        if (!nextBand) return 100;

        // Threshold for the next band
        const nextThreshold = Math.ceil((thresholds[nextBand] / 40) * totalQuestions);

        // Handle the starting case where user is below the first threshold (Band 4.0)
        const firstBand = bandLevels[0];
        if (currentBand < firstBand) {
            return (correctAnswers / nextThreshold) * 100;
        }

        // Standard case: between two band levels
        // Find the highest band level less than or equal to current score
        const passedBand = [...bandLevels].reverse().find(b => b <= currentBand) || firstBand;
        const prevThreshold = Math.ceil((thresholds[passedBand] / 40) * totalQuestions);

        const range = nextThreshold - prevThreshold;

        if (range <= 0) return 100;
        const progress = ((correctAnswers - prevThreshold) / range) * 100;
        return Math.min(100, Math.max(0, progress));
    }, [correctAnswers, totalQuestions, nextBand, currentBandIndex, bandLevels, thresholds, currentBand]);

    // If already at Band 9, show celebration
    if (currentBand >= 9) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    'p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50',
                    className
                )}
                data-oid="target-band-gap-card"
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-amber-800 dark:text-amber-300">
                            Perfect Score!
                        </h4>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            You've achieved Band 9 — the highest level. Outstanding mastery!
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    const weakestLabel = weakestType?.type
        ? QUESTION_TYPE_LABELS[weakestType.type] || weakestType.type.replace(/_/g, ' ')
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'p-3 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-violet-950/30 border border-blue-200 dark:border-blue-800/50 relative overflow-hidden',
                className
            )}
            data-oid="target-band-gap-card"
        >
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full" />

            <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                            <Target className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-200 tracking-wider">
                                Next Milestone
                            </h4>
                        </div>
                    </div>
                    {nextBand && (
                        <div className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 shadow-sm">
                            <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                                Band {nextBand.toFixed(1)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="space-y-2.5">
                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-500 tracking-wider">
                                Progress to Band {nextBand?.toFixed(1)}
                            </span>
                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                                {Math.round(progressToNext)}%
                            </span>
                        </div>
                        <div className="h-2 bg-white dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressToNext}%` }}
                                transition={{ delay: 0.3, duration: 1, ease: 'circOut' }}
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            />
                        </div>
                    </div>

                    {/* Action Card */}
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
                        <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <Zap className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                                        +{neededForNext}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500">
                                        more correct
                                    </span>
                                </div>
                                {weakestLabel ? (
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Focus on <span className="font-bold text-indigo-600 dark:text-indigo-400">{weakestLabel}</span> questions
                                        <span className="text-slate-400"> ({Math.round(weakestType?.accuracy || 0)}% accuracy)</span>
                                    </p>
                                ) : (
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                        Keep practicing to reach your goal!
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tip hidden for height reduction */}
                </div>
            </div>
        </motion.div>
    );
}

export default TargetBandGapCard;

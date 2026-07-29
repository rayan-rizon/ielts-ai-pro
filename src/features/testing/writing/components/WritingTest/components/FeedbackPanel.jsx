import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Info,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';

const CRITERIA = [
  { keys: ['TaskAchievement', 'TaskResponse'], short: 'TA', taskLabel: true },
  { keys: ['CoherenceAndCohesion', 'Coherence & Cohesion', 'CC'], short: 'CC' },
  { keys: ['LexicalResource', 'Lexical Resource', 'LR'], short: 'LR' },
  {
    keys: ['GrammaticalRangeAndAccuracy', 'Grammatical Range & Accuracy', 'GRA'],
    short: 'GRA',
  },
];

function getCriterionLabel(item, taskType) {
  if (item.taskLabel) return taskType === 'Task 2' ? 'Task Response' : 'Task Achievement';
  if (item.short === 'CC') return 'Coherence & Cohesion';
  if (item.short === 'LR') return 'Lexical Resource';
  return 'Grammar Range & Accuracy';
}

function getCriterionScore(scores, keys) {
  const key = keys.find((candidate) => scores?.[candidate] != null);
  return key ? Number(scores[key]) : null;
}

function cleanFeedbackText(value, { dropHeading = false } = {}) {
  let text = typeof value === 'string' ? value : '';
  if (dropHeading) {
    text = text.replace(/^\s*\*\*[^*\n:]{2,64}:\*\*\s*/u, '');
  }

  return text
    .replace(/\*\*([^*]+)\*\*/gu, '$1')
    .replace(/__([^_]+)__/gu, '$1')
    .replace(/`([^`]+)`/gu, '$1')
    .replace(/~~([^~]+)~~/gu, '$1')
    .replace(/^\s*[-*•]\s+/u, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function compactUiText(value, maxChars, options) {
  const cleaned = cleanFeedbackText(value, options);
  if (!cleaned || cleaned.length <= maxChars) return cleaned;

  const firstSentence = cleaned.match(/^.*?[.!?](?:\s|$)/u)?.[0]?.trim();
  if (firstSentence && firstSentence.length <= maxChars) return firstSentence;

  const clipped = cleaned.slice(0, maxChars - 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > maxChars * 0.65 ? lastSpace : clipped.length).trim()}…`;
}

function inferCriterion(text, taskType) {
  const value = String(text || '').toLowerCase();
  if (/grammar|sentence|article|tense|punctuation/.test(value)) return 'Grammar';
  if (/vocab|word|lexical|collocation|spelling/.test(value)) return 'Lexical Resource';
  if (/coher|paragraph|link|progression|organis|organiz/.test(value)) {
    return 'Coherence & Cohesion';
  }
  return taskType === 'Task 2' ? 'Task Response' : 'Task Achievement';
}

function createLegacyPriorities(feedback) {
  const weaknesses = Array.isArray(feedback?.weaknesses) ? feedback.weaknesses : [];
  const suggestions = Array.isArray(feedback?.suggestions) ? feedback.suggestions : [];

  return weaknesses.slice(0, 3).map((issue, index) => ({
    criterion: inferCriterion(issue, feedback.taskType),
    issue: compactUiText(issue, 96, { dropHeading: true }),
    action: compactUiText(
      suggestions[index] || 'Rewrite this part once, applying the feedback shown.',
      108,
      { dropHeading: true }
    ),
  }));
}

function buildSummary(feedback, priorities) {
  if (feedback?.summary) return compactUiText(feedback.summary, 128, { dropHeading: true });
  const band = Number(feedback?.overallBand || 0);
  const level =
    band >= 8 ? 'strong' : band >= 7 ? 'effective' : band >= 6 ? 'competent' : 'developing';
  const nextCriterion = cleanFeedbackText(priorities[0]?.criterion).toLowerCase();
  const article = /^[aeiou]/i.test(level) ? 'An' : 'A';
  return nextCriterion
    ? `${article} ${level} response. Focus next on ${nextCriterion}.`
    : `${article} ${level} response across the four IELTS Writing criteria.`;
}

function ScoreRing({ score }) {
  const safeScore = Math.max(0, Math.min(9, Number(score) || 0));
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 9) * circumference;

  return (
    <div
      className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36"
      aria-label={`Band ${safeScore} out of 9`}
    >
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="writing-score-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          className="text-white/10"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="url(#writing-score-gradient)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
          Band
        </span>
        <span className="text-4xl font-black tracking-tight text-white">
          {safeScore.toFixed(1)}
        </span>
        <span className="text-[10px] font-semibold text-slate-400">of 9.0</span>
      </div>
    </div>
  );
}

function AnalyzingState({ loadingMessage }) {
  const steps = ['Grammar & spelling', 'Vocabulary', 'Coherence', 'Band calibration'];

  return (
    <motion.div
      key="analyzing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-[520px] flex-1 items-center justify-center bg-white p-6 dark:bg-[#070812]"
    >
      <div className="w-full max-w-sm rounded-[28px] border border-indigo-100 bg-gradient-to-b from-indigo-50/80 to-white p-7 text-center shadow-[0_24px_80px_-42px_rgba(79,70,229,0.55)] dark:border-white/10 dark:from-indigo-500/10 dark:to-[#0b0c18]">
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-r-violet-400"
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
          Building your review
        </p>
        <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">
          Checking evidence against IELTS criteria
        </h2>
        <p className="mt-2 min-h-5 text-sm text-slate-500 dark:text-slate-400">
          {loadingMessage || 'Reading your response carefully...'}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2 text-left">
          {steps.map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 dark:border-white/5 dark:bg-white/5 dark:text-slate-300"
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  index === 0 ? 'animate-pulse bg-indigo-500' : 'bg-slate-200 dark:bg-white/15'
                )}
              />
              {step}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ErrorState({ feedbackError, handleGetFeedback }) {
  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[480px] flex-1 items-center justify-center p-6 text-center"
    >
      <div className="max-w-sm rounded-3xl border border-rose-100 bg-white p-7 shadow-sm dark:border-rose-500/20 dark:bg-[#0b0c18]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">
          We could not finish the review
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {feedbackError || 'The analysis service is temporarily unavailable.'}
        </p>
        <Button
          onClick={handleGetFeedback}
          className="mt-5 h-11 rounded-xl bg-slate-950 px-5 font-bold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Try again
        </Button>
      </div>
    </motion.div>
  );
}

export function FeedbackPanel({
  feedback,
  isAnalyzing,
  feedbackError,
  handleGetFeedback,
  loadingMessage,
}) {
  const allFeedbacks = useWritingTestStore((state) => state.feedbacks);
  const [showAllCorrections, setShowAllCorrections] = useState(false);

  const task1Band = Number(allFeedbacks['Task 1']?.overallBand);
  const task2Band = Number(allFeedbacks['Task 2']?.overallBand);
  const combinedBand =
    task1Band > 0 && task2Band > 0 ? Math.round(((task1Band + task2Band * 2) / 3) * 2) / 2 : null;

  const taskType = feedback?.taskType === 'Task 2' ? 'Task 2' : 'Task 1';
  const criteria = useMemo(
    () =>
      CRITERIA.map((item) => ({
        ...item,
        label: getCriterionLabel(item, taskType),
        score: getCriterionScore(feedback?.criteriaScores, item.keys),
      })).filter((item) => item.score != null),
    [feedback?.criteriaScores, taskType]
  );
  const priorities = useMemo(() => {
    if (Array.isArray(feedback?.priorities) && feedback.priorities.length) {
      return feedback.priorities.slice(0, 3).map((priority) => ({
        criterion: cleanFeedbackText(priority.criterion),
        issue: compactUiText(priority.issue, 96, { dropHeading: true }),
        action: compactUiText(priority.action, 108, { dropHeading: true }),
      }));
    }
    return createLegacyPriorities(feedback);
  }, [feedback]);
  const summary = useMemo(() => buildSummary(feedback, priorities), [feedback, priorities]);
  const strengths = useMemo(
    () =>
      (Array.isArray(feedback?.strengths) ? feedback.strengths : [])
        .slice(0, 3)
        .map((strength) => compactUiText(strength, 104, { dropHeading: true }))
        .filter(Boolean),
    [feedback?.strengths]
  );
  const corrections = useMemo(
    () =>
      (Array.isArray(feedback?.corrections) ? feedback.corrections : []).map((item) => ({
        original: compactUiText(item.original, 88),
        correction: compactUiText(item.correction, 88),
        explanation: compactUiText(item.explanation, 112, { dropHeading: true }),
      })),
    [feedback?.corrections]
  );
  const suggestedImprovements = useMemo(
    () =>
      (Array.isArray(feedback?.annotations) ? feedback.annotations : [])
        .filter(
          (annotation) =>
            annotation?.severity !== 'positive' &&
            cleanFeedbackText(annotation?.originalText) &&
            cleanFeedbackText(annotation?.suggestion)
        )
        .map((annotation) => ({
          original: compactUiText(annotation.originalText, 88),
          correction: compactUiText(annotation.suggestion, 88),
          explanation: compactUiText(annotation.explanation, 112, { dropHeading: true }),
          isDirectCorrection: annotation.severity === 'error',
        })),
    [feedback?.annotations]
  );
  const improvements = corrections.length
    ? corrections.map((correction) => ({ ...correction, isDirectCorrection: true }))
    : suggestedImprovements;
  const visibleImprovements = showAllCorrections ? improvements : improvements.slice(0, 3);
  if (!feedback && !isAnalyzing && !feedbackError) return null;

  return (
    <div
      id="feedback-section"
      className="flex h-full min-h-0 flex-col bg-[#f6f7fb] text-slate-900 dark:bg-[#060711] dark:text-white"
    >
      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <AnalyzingState loadingMessage={loadingMessage} />
        ) : feedbackError ? (
          <ErrorState feedbackError={feedbackError} handleGetFeedback={handleGetFeedback} />
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4"
          >
            <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_18px_60px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-gradient-to-b dark:from-[#0d0f20] dark:to-[#070814] dark:shadow-[0_0_50px_-12px_rgba(99,102,241,0.12)]">
              <div className="relative overflow-hidden bg-[#0F1035] dark:bg-gradient-to-br dark:from-[#171946]/95 dark:via-[#0e102d]/98 dark:to-[#070814] px-4 py-4 text-white sm:px-5 sm:py-5">
                <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-extrabold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-amber-300 ring-1 ring-white/10">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    AI feedback summary
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-300 ring-1 ring-white/10">
                    {taskType}
                  </span>
                </div>

                <div className="relative mt-2 grid items-center gap-3 sm:grid-cols-[136px_1fr]">
                  <div className="mx-auto">
                    <ScoreRing score={feedback.overallBand} />
                  </div>
                  <div className="text-center sm:border-l sm:border-white/10 sm:pl-5 sm:text-left">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-amber-300">
                      Main takeaway
                    </p>
                    <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-100 sm:text-[15px]">
                      {summary}
                    </p>
                    <p className="mt-2 text-[10px] font-medium text-slate-400">
                      Practice estimate based on public IELTS descriptors
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-t border-slate-100 dark:border-white/5 sm:grid-cols-4">
                {criteria.map((item, index) => (
                  <div
                    key={item.short}
                    className={cn(
                      'p-2.5 text-center sm:py-3 sm:px-2 transition-all duration-300 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]',
                      index > 0 && 'border-l border-slate-100 dark:border-white/5',
                      index > 1 && 'border-t sm:border-t-0 border-slate-100 dark:border-white/5'
                    )}
                  >
                    <div className="text-lg sm:text-xl font-extrabold text-indigo-600 dark:text-indigo-300 leading-none">
                      {item.score.toFixed(1)}
                    </div>
                    <div className="mt-1 min-h-[22px] text-[9px] font-bold uppercase leading-tight tracking-[0.08em] text-slate-500 dark:text-slate-400">
                      {item.label}
                    </div>
                    <div className="mx-auto mt-1.5 h-1 w-full max-w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.score / 9) * 100}%` }}
                        transition={{ delay: 0.15 + index * 0.08, duration: 0.6 }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 dark:from-indigo-400 dark:to-purple-500 dark:shadow-[0_0_8px_rgba(129,140,248,0.6)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {combinedBand && (
              <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-500/20 dark:bg-amber-500/10">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <TrendingUp className="h-3.5 w-3.5" /> Writing estimate{' '}
                  <span className="hidden text-[10px] font-medium text-amber-700/70 sm:inline dark:text-amber-300/70">
                    Task 1 × ⅓ + Task 2 × ⅔
                  </span>
                </div>
                <span className="text-xl font-black text-amber-700 dark:text-amber-300">
                  {combinedBand.toFixed(1)}
                </span>
              </div>
            )}

            {feedback.isBelowMinimumWordCount && (
              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                    Below the {taskType === 'Task 2' ? '250' : '150'}-word minimum
                  </p>
                  <p className="mt-0.5 text-[11px] leading-5 text-amber-800/80 dark:text-amber-300/80">
                    With {feedback.wordCount ?? 'fewer'} words, there is less evidence of full task
                    coverage. Language criteria are still judged from what you demonstrated.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-3 xl:grid-cols-2">
              <section className="rounded-[22px] border border-emerald-100 bg-emerald-50/55 p-4 dark:border-emerald-500/15 dark:bg-emerald-500/[0.07] transition-all duration-300 hover:shadow-sm hover:border-emerald-200 dark:hover:border-emerald-500/25">
                <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" /> Key strengths
                </div>
                <div className="space-y-2.5">
                  {strengths.map((strength, index) => (
                    <div
                      key={`${strength}-${index}`}
                      className="flex gap-2.5 text-xs font-medium leading-5 text-slate-700 dark:text-slate-200"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      <span>{strength}</span>
                    </div>
                  ))}
                  {strengths.length === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No reliable strength was identified from the available evidence.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-[22px] border border-orange-100 bg-orange-50/55 p-4 dark:border-orange-500/15 dark:bg-orange-500/[0.07] transition-all duration-300 hover:shadow-sm hover:border-orange-200 dark:hover:border-orange-500/25">
                <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] text-orange-800 dark:text-orange-300">
                  <Target className="h-4 w-4" /> Top 3 priorities
                </div>
                <div className="space-y-3">
                  {priorities.map((priority, index) => (
                    <div
                      key={`${priority.issue}-${index}`}
                      className="grid grid-cols-[24px_1fr] gap-x-2.5"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-[11px] font-black text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wide text-orange-700 dark:text-orange-300">
                            {priority.criterion}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                            {priority.issue}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-4 text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-slate-800 dark:text-slate-200">Do:</span>{' '}
                          {priority.action}
                        </p>
                      </div>
                    </div>
                  ))}
                  {priorities.length === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No priority data is available for this saved attempt.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white dark:border-white/10 dark:bg-gradient-to-b dark:from-[#0d0f20] dark:to-[#070814] dark:shadow-[0_0_50px_-12px_rgba(99,102,241,0.12)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01]">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em]">
                  <Lightbulb className="h-4 w-4 text-indigo-600 dark:text-indigo-300" /> Corrections
                  & improvements
                </div>
                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  {improvements.length > 0
                    ? `${improvements.length} ${improvements.length === 1 ? 'item' : 'items'}`
                    : 'All clear'}
                </span>
              </div>
              {improvements.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {visibleImprovements.map((item, index) => (
                    <div
                      key={`${item.original}-${index}`}
                      className="border-l-2 border-rose-400 px-4 py-3 transition-colors duration-200 hover:bg-slate-50/30 dark:hover:bg-white/[0.01]"
                    >
                      <div className="grid items-center gap-2 sm:grid-cols-[1fr_22px_1fr]">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-500">
                            Original
                          </span>
                          <p className="mt-0.5 text-xs font-medium text-slate-600 line-through decoration-rose-300 dark:text-slate-300">
                            {item.original}
                          </p>
                        </div>
                        <ArrowRight className="hidden h-4 w-4 text-slate-300 sm:block" />
                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            {item.isDirectCorrection ? 'Better' : 'Try this'}
                          </span>
                          <p className="mt-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            {item.correction}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 flex gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] leading-4 text-slate-600 dark:bg-white/5 dark:text-slate-400">
                        <Info className="mt-0.5 h-3 w-3 shrink-0 text-indigo-500" />
                        <span>
                          <strong className="text-slate-800 dark:text-slate-200">
                            Why it matters:
                          </strong>{' '}
                          {item.explanation}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-4 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  No sentence-level change was needed in this response. Use the three focus areas
                  above to make your next draft even stronger.
                </p>
              )}
              {improvements.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllCorrections((value) => !value)}
                  className="flex w-full items-center justify-center gap-1 border-t border-slate-100 py-3 text-[11px] font-extrabold text-indigo-600 hover:bg-indigo-50/50 dark:border-white/5 dark:text-indigo-300 dark:hover:bg-indigo-500/5"
                >
                  {showAllCorrections
                    ? 'Show fewer improvements'
                    : `View all ${improvements.length} improvements`}
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform',
                      showAllCorrections && 'rotate-180'
                    )}
                  />
                </button>
              )}
            </section>

            <div className="flex items-center gap-2 px-1 pb-1 text-[10px] leading-4 text-slate-400 dark:text-slate-500">
              <Info className="h-3 w-3 shrink-0" /> Practice estimate based on public IELTS
              descriptors—not an official examiner score.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Info,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { toast } from 'sonner';

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
  return 'Grammar & Accuracy';
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

function prepareFeedbackText(value, maxChars, options) {
  const full = cleanFeedbackText(value, options);
  const preview = compactUiText(full, maxChars);

  return {
    full,
    preview,
    isTruncated: full !== preview,
  };
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
    issue,
    action: suggestions[index] || 'Rewrite this part once, applying the feedback shown.',
  }));
}

function buildTakeaway(feedback, priorities, taskType) {
  const band = Number(feedback?.overallBand || 0);
  const assessment =
    band >= 8
      ? `Excellent ${taskType} response`
      : band >= 7
        ? `Strong ${taskType} response`
        : band >= 6
          ? `Solid ${taskType} response`
          : `Developing ${taskType} response`;
  const priority = priorities[0];

  return {
    assessment,
    nextFocus: priority?.criterion || null,
    nextAction: priority?.action?.preview || null,
  };
}

function ScoreRing({ score }) {
  const safeScore = Math.max(0, Math.min(9, Number(score) || 0));
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 9) * circumference;

  return (
    <div
      className="relative flex h-28 w-28 shrink-0 items-center justify-center sm:h-32 sm:w-32"
      aria-label={`Band ${safeScore} out of 9`}
    >
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full -rotate-90 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="writing-score-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5661e9" />
            <stop offset="100%" stopColor="#3b42c4" />
          </linearGradient>
        </defs>
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="url(#writing-score-gradient)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#5661e9] dark:text-indigo-300">
          Band
        </span>
        <span className="mt-0.5 text-3xl font-black leading-none tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">
          {safeScore.toFixed(1)}
        </span>
        <span className="mt-1 text-[9px] font-bold text-slate-400 dark:text-slate-500">
          out of 9
        </span>
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
      className="flex min-h-[520px] flex-1 items-center justify-center bg-slate-50 p-6 dark:bg-slate-950"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[#dce0f5] bg-white p-7 text-center shadow-md dark:border-white/10 dark:bg-slate-900">
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#5661e9] border-r-indigo-400"
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5661e9] text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
        <p className="text-xs font-extrabold uppercase tracking-wider text-[#5661e9] dark:text-indigo-400">
          Building your review
        </p>
        <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
          Checking evidence against IELTS criteria
        </h2>
        <p className="mt-2 min-h-5 text-sm text-slate-500 dark:text-slate-400">
          {loadingMessage || 'Reading your response carefully...'}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2 text-left">
          {steps.map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-2 rounded-xl border border-[#e2e5f6] bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 dark:border-white/5 dark:bg-white/5 dark:text-slate-300"
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  index === 0 ? 'animate-pulse bg-[#5661e9]' : 'bg-slate-300 dark:bg-white/15'
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
      <div className="max-w-sm rounded-2xl border border-rose-200 bg-white p-7 shadow-sm dark:border-rose-500/20 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">
          We could not finish the review
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {feedbackError || 'The analysis service is temporarily unavailable.'}
        </p>
        <Button
          onClick={handleGetFeedback}
          className="mt-5 h-11 rounded-xl bg-[#5661e9] px-5 font-bold text-white hover:bg-[#4853d6]"
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
  onShowInEssay,
}) {
  const allFeedbacks = useWritingTestStore((state) => state.feedbacks);
  const [showAllCorrections, setShowAllCorrections] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [expandedFeedbackItems, setExpandedFeedbackItems] = useState({});

  const toggleFeedbackItem = (itemKey) => {
    setExpandedFeedbackItems((current) => ({ ...current, [itemKey]: !current[itemKey] }));
  };

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;

    setIsDownloadingPdf(true);
    try {
      const { downloadWritingReportPdf } = await import('../../../utils/writingReportPdf');
      downloadWritingReportPdf({ feedbacks: allFeedbacks });
      toast.success('Writing report downloaded');
    } catch (error) {
      console.error(error);
      toast.error('Could not download the PDF', { description: 'Please try again in a moment.' });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

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
    const sourcePriorities =
      Array.isArray(feedback?.priorities) && feedback.priorities.length
        ? feedback.priorities.slice(0, 3)
        : createLegacyPriorities(feedback);

    return sourcePriorities.map((priority) => ({
      criterion: cleanFeedbackText(priority.criterion),
      issue: prepareFeedbackText(priority.issue, 96, { dropHeading: true }),
      action: prepareFeedbackText(priority.action, 108, { dropHeading: true }),
      annotation: (Array.isArray(feedback?.annotations) ? feedback.annotations : []).find(
        (annotation) => annotation?.originalText === priority.evidenceText
      ),
    }));
  }, [feedback]);
  const takeaway = useMemo(
    () => buildTakeaway(feedback, priorities, taskType),
    [feedback, priorities, taskType]
  );
  const strengths = useMemo(
    () =>
      (Array.isArray(feedback?.strengths) ? feedback.strengths : [])
        .slice(0, 3)
        .map((strength) => prepareFeedbackText(strength, 104, { dropHeading: true }))
        .filter((strength) => strength.full),
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
      className="flex h-full min-h-0 flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white"
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
            <section className="overflow-hidden rounded-2xl border border-[#d2d7f8] bg-gradient-to-br from-[#ffffff] via-[#f2f4fe] to-[#e6e9fc] text-slate-950 shadow-[0_12px_32px_-18px_rgba(86,97,233,0.25)] dark:border-white/10 dark:from-[#101322] dark:via-[#13172e] dark:to-[#181d38] dark:text-white">
              <div className="relative overflow-hidden p-4 sm:p-5">
                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-[0.12em] text-slate-800 dark:text-white">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/15 dark:text-indigo-300 border border-[#d2d7f8] shadow-2xs">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    Writing assessment
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gradient-to-r from-white to-[#f4f3ff] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700 border border-[#d2d7f8] dark:bg-white/5 dark:text-slate-200 dark:border-white/10 shadow-2xs">
                      {taskType}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleDownloadPdf}
                      disabled={isDownloadingPdf}
                      className="h-8 rounded-lg bg-gradient-to-r from-white to-[#f4f3ff] px-3 text-xs font-black text-slate-700 border border-[#d2d7f8] transition-all hover:border-[#5661e9] hover:shadow-2xs dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10"
                    >
                      {isDownloadingPdf ? (
                        <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      PDF
                    </Button>
                  </div>
                </div>

                <div className="relative mt-4 grid items-center gap-4 sm:grid-cols-[132px_1fr] sm:gap-5">
                  <div className="mx-auto sm:border-r sm:border-[#d2d7f8]/70 sm:pr-5 dark:sm:border-white/10">
                    <ScoreRing score={feedback.overallBand} />
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                      Your result
                    </span>
                    <h2 className="mt-1 text-xl font-black leading-tight tracking-[-0.03em] text-slate-950 dark:text-white sm:text-2xl">
                      {takeaway.assessment}
                    </h2>
                    {takeaway.nextFocus && takeaway.nextAction && (
                      <div className="mt-3 border-l-2 border-[#5661e9] pl-3 text-left dark:border-indigo-400">
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#5661e9] dark:text-indigo-300">
                          <Target className="h-3 w-3" /> Priority · {takeaway.nextFocus}
                        </div>
                        <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-600 dark:text-slate-200">
                          {takeaway.nextAction}
                        </p>
                      </div>
                    )}
                    <p className="mt-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      Practice estimate based on public IELTS descriptors
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 border-t border-[#d2d7f8] bg-gradient-to-r from-[#f4f5fe] via-[#ebedfd] to-[#e4e7fc] p-3 sm:grid-cols-4 sm:gap-3 sm:p-3.5 dark:border-white/10 dark:bg-black/20">
                {criteria.map((item) => (
                  <div
                    key={item.short}
                    className="group relative flex flex-col justify-between rounded-xl border border-[#dce0f5] bg-gradient-to-br from-white via-[#fcfbff] to-[#f2f1fe] p-2.5 transition-all duration-200 hover:border-[#5661e9]/70 hover:shadow-xs dark:border-white/10 dark:from-[#161a2e] dark:via-[#111425] dark:to-[#0e111d] dark:hover:border-indigo-400/50 sm:p-3"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="rounded-md bg-[#efedff] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#5661e9] border border-[#d2d7f8] dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 shadow-2xs">
                        {item.short}
                      </span>
                      <span className="text-lg font-black tracking-tight text-slate-950 transition-colors group-hover:text-[#5661e9] dark:text-white dark:group-hover:text-indigo-300 sm:text-xl">
                        {item.score.toFixed(1)}
                      </span>
                    </div>

                    <div
                      className="mt-2 min-h-[26px] text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide text-slate-700 dark:text-slate-200 text-left leading-tight"
                      title={item.label}
                    >
                      {item.label}
                    </div>

                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#efedff] dark:bg-white/10 border border-[#d2d7f8]/60 dark:border-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.score / 9) * 100}%` }}
                        transition={{ delay: 0.15, duration: 0.6 }}
                        className="h-full rounded-full bg-gradient-to-r from-[#5661e9] to-[#7c86ff]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {combinedBand && (
              <div className="flex items-center justify-between rounded-xl border border-[#d2d7f8] bg-gradient-to-r from-[#efedff]/80 via-[#f0f2fe] to-[#e6e9fc] px-3 py-2 dark:border-indigo-500/20 dark:bg-indigo-500/10 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-indigo-200">
                  <TrendingUp className="h-3.5 w-3.5 text-[#5661e9] dark:text-indigo-400" /> Writing
                  estimate{' '}
                  <span className="hidden text-[10px] font-medium text-slate-500 sm:inline dark:text-indigo-300/70">
                    Task 1 × ⅓ + Task 2 × ⅔
                  </span>
                </div>
                <span className="text-xl font-black text-[#5661e9] dark:text-indigo-300">
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

            <div className="grid gap-2.5 xl:grid-cols-2">
              <section className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 p-3.5 sm:p-4 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:to-transparent shadow-2xs">
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-emerald-200/60 pb-2 dark:border-emerald-500/15">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-950 dark:text-white">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                    Key strengths
                  </div>
                </div>

                <div className="space-y-2.5">
                  {strengths.map((strength, index) => (
                    <div key={`${strength.full}-${index}`} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                      <div
                        id={`feedback-strength-${index}`}
                        className="min-w-0 text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed"
                      >
                        <span>
                          {expandedFeedbackItems[`strength-${index}`]
                            ? strength.full
                            : strength.preview}
                        </span>
                        {strength.isTruncated && (
                          <button
                            type="button"
                            aria-controls={`feedback-strength-${index}`}
                            aria-expanded={Boolean(expandedFeedbackItems[`strength-${index}`])}
                            aria-label={`${expandedFeedbackItems[`strength-${index}`] ? 'Show less' : 'Show full'} strength ${index + 1}`}
                            onClick={() => toggleFeedbackItem(`strength-${index}`)}
                            className="ml-1 inline font-extrabold text-emerald-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:text-emerald-400"
                          >
                            {expandedFeedbackItems[`strength-${index}`] ? 'Less' : 'More'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {strengths.length === 0 && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 py-1">
                      No reliable strength was identified from the available evidence.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-[#d2d7f8] bg-gradient-to-br from-[#efedff]/40 via-white to-[#f4f3ff]/40 p-3.5 sm:p-4 dark:border-indigo-900/40 dark:from-indigo-950/20 dark:to-transparent shadow-2xs">
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#d2d7f8]/60 pb-2 dark:border-indigo-500/15">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-950 dark:text-white">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#efedff] text-[#5661e9] border border-[#d2d7f8] dark:bg-indigo-500/15 dark:text-indigo-400">
                      <Target className="h-3.5 w-3.5" />
                    </span>
                    Top 3 priorities
                  </div>
                </div>

                <div className="space-y-3">
                  {priorities.map((priority, index) => (
                    <div key={`${priority.issue.full}-${index}`} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 min-w-[20px] shrink-0 items-center justify-center rounded-md bg-[#5661e9] text-white font-black text-[11px] leading-none shadow-2xs">
                          {index + 1}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#5661e9] dark:text-indigo-400">
                          {priority.criterion}
                        </span>
                      </div>
                      <div id={`feedback-priority-${index}`}>
                        <p className="text-xs font-black text-slate-950 dark:text-white pl-7 leading-snug">
                          {expandedFeedbackItems[`priority-${index}`]
                            ? priority.issue.full
                            : priority.issue.preview}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                          <strong className="text-[#5661e9] dark:text-indigo-400 font-black mr-1.5 uppercase tracking-wider text-[9px]">
                            DO:
                          </strong>
                          {expandedFeedbackItems[`priority-${index}`]
                            ? priority.action.full
                            : priority.action.preview}
                        </p>
                      </div>
                      {(priority.issue.isTruncated ||
                        priority.action.isTruncated ||
                        priority.annotation) && (
                        <div className="ml-7 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {(priority.issue.isTruncated || priority.action.isTruncated) && (
                            <button
                              type="button"
                              aria-controls={`feedback-priority-${index}`}
                              aria-expanded={Boolean(expandedFeedbackItems[`priority-${index}`])}
                              aria-label={`${expandedFeedbackItems[`priority-${index}`] ? 'Show less' : 'Show full'} priority ${index + 1}`}
                              onClick={() => toggleFeedbackItem(`priority-${index}`)}
                              className="inline text-[11px] font-extrabold text-[#5661e9] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5661e9] focus-visible:ring-offset-2 dark:text-indigo-300"
                            >
                              {expandedFeedbackItems[`priority-${index}`] ? 'Less' : 'More'}
                            </button>
                          )}
                          {priority.annotation && onShowInEssay && (
                            <button
                              type="button"
                              onClick={() => onShowInEssay(priority.annotation)}
                              className="inline text-[11px] font-extrabold text-[#5661e9] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5661e9] focus-visible:ring-offset-2 dark:text-indigo-300"
                            >
                              Show in my essay
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {priorities.length === 0 && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 py-1">
                      No priority data is available for this saved attempt.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#e2e5f6] bg-gradient-to-br from-white via-[#fafbff] to-[#f4f3ff] shadow-2xs dark:border-white/10 dark:from-[#101322] dark:via-[#0e111d] dark:to-[#141829]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e5f6] dark:border-white/10 px-3.5 py-2.5 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-950 dark:text-white">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#efedff] text-[#5661e9] border border-[#d2d7f8] dark:bg-indigo-500/15 dark:text-indigo-400">
                    <Lightbulb className="h-3.5 w-3.5" />
                  </span>
                  Corrections & improvements
                </div>
                <span className="rounded-full bg-white dark:bg-white/10 px-2.5 py-0.5 text-[10px] font-black text-slate-700 dark:text-slate-300 border border-[#dce0f5] dark:border-white/10">
                  {improvements.length > 0
                    ? `${improvements.length} ${improvements.length === 1 ? 'item' : 'items'}`
                    : 'All clear'}
                </span>
              </div>
              {improvements.length > 0 ? (
                <div className="p-3 sm:p-3.5 space-y-3 divide-y divide-slate-100 dark:divide-white/5">
                  {visibleImprovements.map((item, index) => (
                    <div key={`${item.original}-${index}`} className="pt-3 first:pt-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-rose-600 dark:text-rose-400 line-through decoration-rose-400 decoration-2">
                          {item.original}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-500/30">
                            {item.isDirectCorrection ? 'Better' : 'Try this'}
                          </span>
                          {item.correction}
                        </span>
                      </div>

                      <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                        <strong className="font-extrabold text-slate-900 dark:text-white mr-1">
                          Why it matters:
                        </strong>
                        {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-3 text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">
                  No sentence-level change was needed in this response. Use the three focus areas
                  above to make your next draft even stronger.
                </p>
              )}
              {improvements.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllCorrections((value) => !value)}
                  className="flex w-full items-center justify-center gap-1 border-t border-[#e2e5f6] py-2 text-[11px] font-extrabold text-[#5661e9] hover:bg-slate-50 dark:border-white/10 dark:text-indigo-300 dark:hover:bg-white/5"
                >
                  {showAllCorrections
                    ? 'Show fewer improvements'
                    : `View all ${improvements.length} improvements`}
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-200',
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

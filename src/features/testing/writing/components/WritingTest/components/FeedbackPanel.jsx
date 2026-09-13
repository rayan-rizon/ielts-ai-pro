import PracticeSkillLink from '@/features/skill-lab/components/PracticeSkillLink';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Target,
  Check,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  ChevronDown,
  Info,
  Download,
  LoaderCircle,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { PANEL, WELL, Pill, MICRO, NUM, MUTED } from '@/features/dashboard/components/primitives';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import WritingAnalysis from './WritingAnalysis';
import {
  cleanFeedbackText,
  prepareFeedbackText,
  compactUiText,
} from '@/features/testing/writing/utils/feedbackFormatting';

// ─── Constants ────────────────────────────────────────────────────────────────

const CRITERIA = [
  { keys: ['TaskAchievement', 'TaskResponse'], short: 'TR/TA' },
  { keys: ['CoherenceAndCohesion'], short: 'CC' },
  { keys: ['LexicalResource'], short: 'LR' },
  { keys: ['GrammaticalRangeAndAccuracy'], short: 'GRA' },
];

const CRITERION_LABELS = {
  'TR/TA': { task1: 'Task Achievement', task2: 'Task Response' },
  CC: 'Coherence & Cohesion',
  LR: 'Lexical Resource',
  GRA: 'Grammar & Accuracy',
};

const ASSESSMENT_LABELS = [
  { min: 8, label: 'Excellent' },
  { min: 7, label: 'Strong' },
  { min: 6, label: 'Solid' },
  { min: 0, label: 'Developing' },
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function getCriterionLabel(item, taskType) {
  const entry = CRITERION_LABELS[item.short];
  if (typeof entry === 'object') {
    return taskType === 'Task 2' ? entry.task2 : entry.task1;
  }
  return entry ?? item.short;
}

function getCriterionScore(criteriaScores, keys) {
  for (const key of keys) {
    const score = Number(criteriaScores?.[key]);
    if (Number.isFinite(score)) return score;
  }
  return null;
}

function inferCriterion(text, taskType) {
  const value = String(text || '').toLowerCase();
  if (/coher|cohes|paragraph|link|structure/.test(value)) return 'Coherence & Cohesion';
  if (/gramm|accurac|tense|clause|sentence|punctuation/.test(value)) return 'Grammar & Accuracy';
  if (/vocab|word|lexical|collocation|spelling/.test(value)) return 'Lexical Resource';
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

function getAssessmentLabel(band, taskType) {
  const entry = ASSESSMENT_LABELS.find((a) => band >= a.min);
  return `${entry?.label ?? 'Developing'} ${taskType} response`;
}

function buildTakeaway(feedback, priorities, taskType) {
  const band = Number(feedback?.overallBand || 0);
  const priority = priorities[0];
  return {
    assessment: getAssessmentLabel(band, taskType),
    nextFocus: priority?.criterion || null,
    nextAction: priority?.action?.preview || null,
  };
}

function isValidImprovementAnnotation(annotation) {
  if (!annotation || annotation.severity === 'positive') return false;
  return (
    Boolean(cleanFeedbackText(annotation.originalText)) &&
    Boolean(cleanFeedbackText(annotation.suggestion))
  );
}

function calcCombinedBand(allFeedbacks) {
  const b1 = Number(allFeedbacks['Task 1']?.overallBand);
  const b2 = Number(allFeedbacks['Task 2']?.overallBand);
  if (b1 > 0 && b2 > 0) return Math.round(((b1 + b2 * 2) / 3) * 2) / 2;
  return null;
}

// ─── Custom hooks ─────────────────────────────────────────────────────────────

function usePriorities(feedback) {
  return useMemo(() => {
    const annotations = Array.isArray(feedback?.annotations) ? feedback.annotations : [];
    const source =
      Array.isArray(feedback?.priorities) && feedback.priorities.length
        ? feedback.priorities.slice(0, 3)
        : createLegacyPriorities(feedback);
    return source.map((p) => ({
      criterion: cleanFeedbackText(p.criterion),
      issue: prepareFeedbackText(p.issue, 96, { dropHeading: true }),
      action: prepareFeedbackText(p.action, 108, { dropHeading: true }),
      annotation: annotations.find((a) => a?.originalText === p.evidenceText),
    }));
  }, [feedback]);
}

function useImprovements(feedback, showAll) {
  const corrections = useMemo(
    () =>
      (Array.isArray(feedback?.corrections) ? feedback.corrections : []).map((item) => ({
        original: compactUiText(item.original, 88),
        correction: compactUiText(item.correction, 88),
        explanation: compactUiText(item.explanation, 112, { dropHeading: true }),
        isDirectCorrection: true,
      })),
    [feedback?.corrections]
  );

  const suggested = useMemo(
    () =>
      (Array.isArray(feedback?.annotations) ? feedback.annotations : [])
        .filter(isValidImprovementAnnotation)
        .map((a) => ({
          original: compactUiText(a.originalText, 88),
          correction: compactUiText(a.suggestion, 88),
          explanation: compactUiText(a.explanation, 112, { dropHeading: true }),
          isDirectCorrection: a.severity === 'error',
        })),
    [feedback?.annotations]
  );

  const improvements = corrections.length ? corrections : suggested;
  return { improvements, visibleImprovements: showAll ? improvements : improvements.slice(0, 3) };
}

function useFeedbackData(feedback, allFeedbacks, showAllCorrections) {
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

  const priorities = usePriorities(feedback);

  const takeaway = useMemo(
    () => buildTakeaway(feedback, priorities, taskType),
    [feedback, priorities, taskType]
  );

  const strengths = useMemo(
    () =>
      (Array.isArray(feedback?.strengths) ? feedback.strengths : [])
        .slice(0, 3)
        .map((s) => prepareFeedbackText(s, 104, { dropHeading: true }))
        .filter((s) => s.full),
    [feedback?.strengths]
  );

  const { improvements, visibleImprovements } = useImprovements(feedback, showAllCorrections);

  return { taskType, criteria, priorities, takeaway, strengths, improvements, visibleImprovements };
}

function useDownloadPdf(allFeedbacks) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const { downloadWritingReportPdf } = await import('../../../utils/writingReportPdf');
      const drafts = useWritingTestStore.getState().drafts;
      downloadWritingReportPdf({ feedbacks: allFeedbacks, drafts });
      toast.success('Writing report downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Could not download the PDF', { description: 'Please try again in a moment.' });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return { isDownloadingPdf, handleDownloadPdf };
}

// ─── Small leaf components ────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const safeScore = Math.max(0, Math.min(9, Number(score) || 0));
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 9) * circumference;

  return (
    <div
      className="relative flex h-28 w-28 shrink-0 items-center justify-center sm:h-32 sm:w-32 group select-none"
      aria-label={`Band ${safeScore} out of 9`}
    >
      <div className="absolute inset-3 rounded-full bg-[#5661e9]/3 blur-md dark:bg-indigo-500/5 pointer-events-none" />
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full -rotate-90 overflow-visible relative"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="writing-score-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#5661e9" />
            <stop offset="100%" stopColor="#3b42c4" />
          </linearGradient>
          <filter id="writing-ring-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          className="text-[#e2e5f6] dark:text-white/10"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="url(#writing-score-gradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          filter="url(#writing-ring-glow)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9.5px] font-black uppercase tracking-[0.2em] text-[#5661e9] dark:text-indigo-300">
          Band
        </span>
        <span className="my-0.5 text-3xl font-black leading-none tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">
          {safeScore.toFixed(1)}
        </span>
        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          out of 9
        </span>
      </div>
    </div>
  );
}

function ErrorState({ feedbackError, handleGetFeedback }) {
  const setShowUpgradeDialog = useWritingTestStore((s) => s.setShowUpgradeDialog);
  const isQuotaError =
    typeof feedbackError === 'string' &&
    (feedbackError.includes('task review') ||
      feedbackError.includes('evaluation') ||
      feedbackError.includes('allowance') ||
      feedbackError.includes('Upgrade'));

  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex min-h-[480px] flex-1 items-center justify-center p-4 sm:p-6 text-center"
    >
      <div
        className={cn(
          PANEL,
          'relative w-full max-w-[460px] overflow-hidden p-6 sm:p-7 text-center shadow-md sm:shadow-lg'
        )}
      >
        {/* Subtle background radial texture matching Learner Panel dialogs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[16px_16px] opacity-[0.06] dark:opacity-[0.10]"
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Status Icon Badge */}
          <div
            className={cn(
              'mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border shadow-xs',
              isQuotaError
                ? 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-300'
                : 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:border-rose-400/30 dark:bg-rose-400/15 dark:text-rose-300'
            )}
          >
            {isQuotaError ? (
              <Lock className="h-5 w-5" strokeWidth={2.25} />
            ) : (
              <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
            )}
          </div>

          {/* Eyebrow Pill */}
          <div className="mb-2">
            <Pill
              tone={isQuotaError ? 'amber' : 'fault'}
              className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider"
            >
              {isQuotaError ? 'Allowance Limit' : 'Review Interrupted'}
            </Pill>
          </div>

          {/* Centered Title */}
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 text-center w-full">
            We could not finish the review
          </h2>

          {/* Refined Description Box */}
          <div className="mt-3 w-full rounded-xl border border-[#e4e2f0] bg-[#fbfbfe] px-4 py-3 dark:border-white/[0.07] dark:bg-white/[0.02]">
            <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
              {feedbackError || 'The analysis service is temporarily unavailable.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex w-full flex-col gap-2 sm:gap-2.5">
            {isQuotaError && (
              <Button
                onClick={() => setShowUpgradeDialog(true)}
                className="h-11 w-full rounded-xl bg-[#5a63df] px-4 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#4a52c9] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Upgrade to Pro</span>
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
              </Button>
            )}
            <Button
              onClick={handleGetFeedback}
              variant={isQuotaError ? 'ghost' : 'default'}
              className={cn(
                'w-full rounded-xl text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer',
                isQuotaError
                  ? 'h-9 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  : 'h-11 bg-[#5a63df] text-white hover:bg-[#4a52c9] shadow-xs'
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
              <span>Try again</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CriteriaGrid({ criteria }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 border-t border-[#ebeaf7] p-2.5 dark:border-white/10 sm:p-3.5 lg:grid-cols-2 xl:grid-cols-4">
      {criteria.map((item) => (
        <div
          key={item.short}
          className="flex flex-col justify-between rounded-lg bg-[#f7f7fc] p-2.5 dark:bg-white/3 sm:p-3"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#5661e9] dark:text-indigo-400">
              {item.short}
            </span>
            <span className="text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {item.score.toFixed(1)}
            </span>
          </div>
          <div
            className="mt-2 min-h-[26px] text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-300 text-left leading-tight"
            title={item.label}
          >
            {item.label}
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white dark:bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.score / 9) * 100}%` }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="h-full rounded-full bg-[#5661e9] dark:bg-indigo-400"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AssessmentBanner({
  taskType,
  feedback,
  takeaway,
  criteria,
  isDownloadingPdf,
  handleDownloadPdf,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e4e2f0] bg-linear-to-b/srgb from-white to-[#faf9ff] text-slate-950 shadow-sm dark:border-white/[0.07] dark:from-[#131315] dark:to-[#131315] dark:text-white">
      <div className="relative overflow-hidden p-4 sm:p-5">
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-[0.12em] text-slate-800 dark:text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#efedff] text-[#5661e9] border border-[#d2d7f8] dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 shadow-2xs">
              <Sparkles className="h-4 w-4" />
            </span>
            Writing assessment
          </div>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap shrink-0 rounded-full bg-linear-to-r/srgb from-white to-[#f4f3ff] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700 border border-[#d2d7f8] dark:from-white/10 dark:to-white/5 dark:text-slate-200 dark:border-white/10 shadow-2xs">
              {taskType}
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="h-8 rounded-lg bg-linear-to-r/srgb from-white to-[#f4f3ff] px-3 text-xs font-black text-slate-700 border border-[#d2d7f8] transition-all hover:border-[#5661e9] hover:shadow-2xs dark:from-white/10 dark:to-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/15"
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

        <div className="relative mt-4 grid items-center gap-3 sm:gap-4 sm:grid-cols-[120px_1fr] md:grid-cols-[132px_1fr] sm:gap-5">
          <div className="mx-auto sm:border-r sm:border-[#d2d7f8]/70 sm:pr-4 md:sm:pr-5 dark:sm:border-white/10">
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
              {describeMarkingAgreement(feedback.scoreAgreement)}
            </p>
          </div>
        </div>
      </div>
      <CriteriaGrid criteria={criteria} />
    </section>
  );
}

/**
 * Says how the band was arrived at, in the same terms an exam board would: how
 * many independent markings ran and whether they agreed. Stays silent for
 * reports written before adaptive marking existed rather than implying a
 * confidence that was never measured.
 */
function describeMarkingAgreement(agreement) {
  const passes = Number(agreement?.sampleCount);
  if (!Number.isFinite(passes) || passes < 1) return null;

  if (passes === 1) {
    // A single marking is the normal outcome, not a shortcut: it means the
    // marker found every criterion a clear fit. Saying so is more honest than
    // silence, which reads as though nothing was checked.
    return agreement?.confidence === 'high'
      ? ' · marked once, every criterion a clear fit'
      : ' · single marking';
  }

  const spread = Number(agreement?.maxSpread) || 0;
  if (spread === 0) return ` · sent for ${passes} independent markings, all agreed`;
  return ` · sent for ${passes} independent markings, agreed within ${spread} band`;
}

function CombinedBandBanner({ combinedBand }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#e4e2f0] bg-[#f7f7fc] px-3 py-2 dark:border-white/10 dark:bg-white/3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
        <TrendingUp className="h-3.5 w-3.5 text-[#5661e9] dark:text-indigo-400" /> Writing estimate{' '}
        <span className="hidden text-[10px] font-medium text-slate-500 sm:inline dark:text-slate-400">
          Task 1 × ⅓ + Task 2 × ⅔
        </span>
      </div>
      <span className="text-xl font-black text-[#5661e9] dark:text-indigo-300">
        {combinedBand.toFixed(1)}
      </span>
    </div>
  );
}

function WordCountWarning({ taskType, wordCount }) {
  const minWords = taskType === 'Task 2' ? '250' : '150';
  return (
    <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div>
        <p className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
          Below the {minWords}-word minimum
        </p>
        <p className="mt-0.5 text-[11px] leading-5 text-amber-800/80 dark:text-amber-300/80">
          With {wordCount ?? 'fewer'} words, there is less evidence of full task coverage. Language
          criteria are still judged from what you demonstrated.
        </p>
      </div>
    </div>
  );
}

function StrengthItem({ strength, index, isExpanded, onToggle }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 shadow-2xs">
        <Check className="h-2.5 w-2.5 stroke-3" />
      </span>
      <div
        id={`feedback-strength-${index}`}
        className="min-w-0 text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed"
      >
        <span>{isExpanded ? strength.full : strength.preview}</span>
        {strength.isTruncated && (
          <button
            type="button"
            aria-controls={`feedback-strength-${index}`}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Show less' : 'Show full'} strength ${index + 1}`}
            onClick={onToggle}
            className="ml-1 inline font-extrabold text-emerald-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:text-emerald-400"
          >
            {isExpanded ? 'Less' : 'More'}
          </button>
        )}
      </div>
    </div>
  );
}

function StrengthsCard({ strengths, expandedItems, onToggleExpand }) {
  return (
    <section className="rounded-2xl border border-[#e4e2f0] bg-linear-to-b/srgb from-white to-[#faf9ff] p-3.5 sm:p-4 dark:border-white/[0.07] dark:from-[#131315] dark:to-[#131315]">
      <div className="mb-3 flex items-center gap-2 border-b border-[#e2e5f6] pb-2 dark:border-white/10">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 shadow-2xs">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-950 dark:text-white">
          Key strengths
        </span>
      </div>
      <div className="space-y-2.5">
        {strengths.map((strength, index) => (
          <StrengthItem
            key={`${strength.full}-${index}`}
            strength={strength}
            index={index}
            isExpanded={Boolean(expandedItems[`strength-${index}`])}
            onToggle={() => onToggleExpand(`strength-${index}`)}
          />
        ))}
        {strengths.length === 0 && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 py-1">
            No reliable strength was identified from the available evidence.
          </p>
        )}
      </div>
    </section>
  );
}

function PriorityItemActions({ priority, index, isExpanded, onToggleExpand, onShowInEssay }) {
  const sourceId = useWritingTestStore((state) => state.session?.id);
  const showExpand = priority.issue.isTruncated || priority.action.isTruncated;

  return (
    <div className="ml-7 flex flex-wrap items-center gap-x-3 gap-y-1">
      {showExpand && (
        <button
          type="button"
          aria-controls={`feedback-priority-${index}`}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Show less' : 'Show full'} priority ${index + 1}`}
          onClick={() => onToggleExpand(`priority-${index}`)}
          className="inline text-[11px] font-extrabold text-[#5661e9] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5661e9] focus-visible:ring-offset-2 dark:text-indigo-300"
        >
          {isExpanded ? 'Less' : 'More'}
        </button>
      )}
      <PracticeSkillLink module="writing" skill={priority.criterion} sourceId={sourceId} />
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
  );
}

function PriorityItem({ priority, index, isExpanded, onToggleExpand, onShowInEssay }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-5 w-5 min-w-[20px] shrink-0 items-center justify-center rounded-md bg-[rgb(var(--signal-warn)/0.1)] text-[rgb(var(--signal-warn))] font-black text-[11px] leading-none">
          {index + 1}
        </span>
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {priority.criterion}
        </span>
      </div>
      <div id={`feedback-priority-${index}`}>
        <p className="text-xs font-black text-slate-950 dark:text-white pl-7 leading-snug">
          {isExpanded ? priority.issue.full : priority.issue.preview}
        </p>
        <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
          <strong className="text-[rgb(var(--signal-warn))] font-black mr-1.5 uppercase tracking-wider text-[9px]">
            DO:
          </strong>
          {isExpanded ? priority.action.full : priority.action.preview}
        </p>
      </div>
      <PriorityItemActions
        priority={priority}
        index={index}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onShowInEssay={onShowInEssay}
      />
    </div>
  );
}

function PrioritiesCard({ priorities, expandedItems, onToggleExpand, onShowInEssay }) {
  return (
    <section className="rounded-2xl border border-[#e4e2f0] bg-linear-to-b/srgb from-white to-[#faf9ff] p-3.5 sm:p-4 dark:border-white/[0.07] dark:from-[#131315] dark:to-[#131315]">
      <div className="mb-3 flex items-center gap-2 border-b border-[#e2e5f6] pb-2 dark:border-white/10">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#efedff] text-[#5661e9] border border-[#d2d7f8] dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40 shadow-2xs">
          <Target className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-950 dark:text-white">
          Top 3 priorities
        </span>
      </div>
      <div className="space-y-3">
        {priorities.map((priority, index) => (
          <PriorityItem
            key={`${priority.issue.full}-${index}`}
            priority={priority}
            index={index}
            isExpanded={Boolean(expandedItems[`priority-${index}`])}
            onToggleExpand={onToggleExpand}
            onShowInEssay={onShowInEssay}
          />
        ))}
        {priorities.length === 0 && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 py-1">
            No priority data is available for this saved attempt.
          </p>
        )}
      </div>
    </section>
  );
}

function ImprovementRow({ item }) {
  const sourceId = useWritingTestStore((state) => state.session?.id);
  return (
    <div className="pt-3 first:pt-0 space-y-1.5">
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
      <PracticeSkillLink module="writing" skill={item.explanation} sourceId={sourceId} />
    </div>
  );
}

function ImprovementsCard({ improvements, visibleImprovements, showAll, onToggleShowAll }) {
  const countLabel =
    improvements.length > 0
      ? `${improvements.length} ${improvements.length === 1 ? 'item' : 'items'}`
      : 'All clear';

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e4e2f0] bg-linear-to-b/srgb from-white to-[#faf9ff] dark:border-white/[0.07] dark:from-[#131315] dark:to-[#131315]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e5f6] dark:border-white/10 px-3.5 py-2.5 bg-slate-50/50 dark:bg-white/2">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-950 dark:text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#efedff] text-[#5661e9] border border-[#d2d7f8] dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40">
            <Lightbulb className="h-3.5 w-3.5" />
          </span>
          Corrections & improvements
        </div>
        <span className="rounded-full bg-white dark:bg-white/10 px-2.5 py-0.5 text-[10px] font-black text-slate-700 dark:text-slate-300 border border-[#dce0f5] dark:border-white/10">
          {countLabel}
        </span>
      </div>
      {improvements.length > 0 ? (
        <div className="p-3 sm:p-3.5 space-y-3 divide-y divide-slate-100 dark:divide-white/5">
          {visibleImprovements.map((item, index) => (
            <ImprovementRow key={`${item.original}-${index}`} item={item} index={index} />
          ))}
        </div>
      ) : (
        <p className="px-4 py-3 text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">
          No sentence-level change was needed in this response. Use the three focus areas above to
          make your next draft even stronger.
        </p>
      )}
      {improvements.length > 3 && (
        <button
          type="button"
          onClick={onToggleShowAll}
          className="flex w-full items-center justify-center gap-1 border-t border-[#e2e5f6] py-2 text-[11px] font-extrabold text-[#5661e9] hover:bg-slate-50 dark:border-white/10 dark:text-indigo-300 dark:hover:bg-white/5"
        >
          {showAll ? 'Show fewer improvements' : `View all ${improvements.length} improvements`}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </section>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

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
  const [expandedFeedbackItems, setExpandedFeedbackItems] = useState({});

  const combinedBand = useMemo(() => calcCombinedBand(allFeedbacks), [allFeedbacks]);
  const toggleFeedbackItem = (itemKey) =>
    setExpandedFeedbackItems((cur) => ({ ...cur, [itemKey]: !cur[itemKey] }));

  const { isDownloadingPdf, handleDownloadPdf } = useDownloadPdf(allFeedbacks);
  const { taskType, criteria, priorities, takeaway, strengths, improvements, visibleImprovements } =
    useFeedbackData(feedback, allFeedbacks, showAllCorrections);

  const hasNoState = !feedback && !isAnalyzing && !feedbackError;
  if (hasNoState) return null;

  return (
    <div
      id="feedback-section"
      className="flex h-full min-h-0 flex-col bg-[#f7f6fd] text-slate-900 dark:bg-[#08080a] dark:text-white"
    >
      <AnimatePresence mode="wait">
        {isAnalyzing && <WritingAnalysis loadingMessage={loadingMessage} />}
        {!isAnalyzing && feedbackError && (
          <ErrorState feedbackError={feedbackError} handleGetFeedback={handleGetFeedback} />
        )}
        {!isAnalyzing && !feedbackError && feedback && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4"
          >
            <AssessmentBanner
              taskType={taskType}
              feedback={feedback}
              takeaway={takeaway}
              criteria={criteria}
              isDownloadingPdf={isDownloadingPdf}
              handleDownloadPdf={handleDownloadPdf}
            />

            {combinedBand && <CombinedBandBanner combinedBand={combinedBand} />}

            {feedback.isBelowMinimumWordCount && (
              <WordCountWarning taskType={taskType} wordCount={feedback.wordCount} />
            )}

            <div className="grid gap-2.5 lg:grid-cols-1 xl:grid-cols-2">
              <StrengthsCard
                strengths={strengths}
                expandedItems={expandedFeedbackItems}
                onToggleExpand={toggleFeedbackItem}
              />
              <PrioritiesCard
                priorities={priorities}
                expandedItems={expandedFeedbackItems}
                onToggleExpand={toggleFeedbackItem}
                onShowInEssay={onShowInEssay}
              />
            </div>

            <ImprovementsCard
              improvements={improvements}
              visibleImprovements={visibleImprovements}
              showAll={showAllCorrections}
              onToggleShowAll={() => setShowAllCorrections((v) => !v)}
            />

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

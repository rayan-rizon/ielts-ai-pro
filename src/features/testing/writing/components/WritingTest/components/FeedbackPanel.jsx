import { Link } from 'react-router-dom';
import { WritingCoach } from './WritingCoach';
import React, { useEffect, useId, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Download,
  LoaderCircle,
  Lock,
  PenLine,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import {
  InfoTip,
  MUTED,
  NUM,
  PANEL,
  Pill,
  TITLE,
  WELL,
} from '@/features/dashboard/components/primitives';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import WritingAnalysis from './WritingAnalysis';
import {
  buildChartCheck,
  buildCriteria,
  buildMistakeGroups,
  buildNextStep,
  buildPriorities,
  buildStrengths,
  combinedWritingBand,
  describeMarking,
  taskTypeOf,
} from '@/features/testing/writing/utils/writingReportModel';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#08080a]';
const PRIMARY_BUTTON = `inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#5a63df] px-3.5 text-[12.5px] font-bold text-white transition-[background-color,transform] duration-150 hover:bg-[#4b53c9] active:scale-[0.98] ${FOCUS_RING}`;
const QUIET_BUTTON = `inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#e4e2f0] bg-white px-3 text-[12.5px] font-bold text-slate-700 transition-[background-color,border-color,transform] duration-150 hover:border-[#5a63df]/40 hover:bg-[#f7f6fd] active:scale-[0.98] disabled:opacity-60 dark:border-white/10 dark:bg-white/4 dark:text-slate-200 dark:hover:bg-white/8 ${FOCUS_RING}`;
const TEXT_BUTTON = `inline-flex items-center gap-1 rounded-sm text-[12px] font-bold text-[#5a63df] hover:underline dark:text-[#afb5ff] ${FOCUS_RING}`;

const formatBand = (value) => (Number.isFinite(Number(value)) ? Number(value).toFixed(1) : '—');

// ─── Download ─────────────────────────────────────────────────────────────────

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
      toast.error('The PDF could not be created', { description: 'Try again in a moment.' });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return { isDownloadingPdf, handleDownloadPdf };
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ feedbackError, handleGetFeedback }) {
  const setShowUpgradeDialog = useWritingTestStore((s) => s.setShowUpgradeDialog);
  const isDuplicateRequest =
    typeof feedbackError === 'string' &&
    /duplicate_request|already being (generated|processed)/i.test(feedbackError);
  const isPendingReview =
    typeof feedbackError === 'string' && /feedback is still being prepared/i.test(feedbackError);
  const isExistingReview = isDuplicateRequest || isPendingReview;
  const isQuotaError =
    typeof feedbackError === 'string' &&
    (feedbackError.includes('task review') ||
      feedbackError.includes('allowance') ||
      feedbackError.includes('Upgrade'));
  const explanation = isDuplicateRequest
    ? 'A review was already requested for this answer. Check whether the result is ready; if it is still being prepared, come back in a moment.'
    : isPendingReview
      ? 'Check again shortly to see your review here.'
      : feedbackError || 'The marking service is temporarily unavailable.';

  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex min-h-[320px] flex-1 items-center justify-center p-4 sm:p-6"
    >
      <div className={cn(PANEL, 'w-full max-w-[460px] p-5 sm:p-6')}>
        <div className="flex flex-col items-start">
          <div
            className={cn(
              'mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border',
              isExistingReview
                ? 'border-[#d2d7f8] bg-[#efedff] text-[#5a63df] dark:border-indigo-400/25 dark:bg-indigo-400/10 dark:text-indigo-300'
                : isQuotaError
                  ? 'border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.1)] text-[rgb(var(--signal-warn))]'
                  : 'border-[rgb(var(--signal-fault)/0.3)] bg-[rgb(var(--signal-fault)/0.1)] text-[rgb(var(--signal-fault))]'
            )}
          >
            {isExistingReview ? (
              <RefreshCw className="h-5 w-5" strokeWidth={2.25} />
            ) : isQuotaError ? (
              <Lock className="h-5 w-5" strokeWidth={2.25} />
            ) : (
              <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
            )}
          </div>

          <div className="mb-2">
            <Pill tone={isQuotaError ? 'warn' : isExistingReview ? 'accent' : 'fault'}>
              {isQuotaError
                ? 'Allowance limit'
                : isPendingReview
                  ? 'Review in progress'
                  : isExistingReview
                    ? 'Review already requested'
                    : 'Review interrupted'}
            </Pill>
          </div>

          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {isDuplicateRequest
              ? 'Check your saved review'
              : isPendingReview
                ? 'Your review is being prepared'
                : 'The review did not finish'}
          </h2>

          <div className={cn(WELL, 'mt-3 w-full rounded-lg px-3 py-3')}>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{explanation}</p>
          </div>

          <div className="mt-5 flex w-full flex-col gap-2 sm:gap-2.5">
            {isQuotaError && (
              <Button
                onClick={() => setShowUpgradeDialog(true)}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#5a63df] px-4 text-xs font-bold text-white transition-all hover:bg-[#4a52c9] active:scale-[0.98]"
              >
                <span>Upgrade to Pro</span>
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
              </Button>
            )}
            <Button
              onClick={handleGetFeedback}
              variant={isQuotaError ? 'ghost' : 'default'}
              className={cn(
                'flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98]',
                isQuotaError
                  ? 'h-9 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  : 'h-11 bg-[#5a63df] text-white hover:bg-[#4a52c9]'
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
              <span>{isExistingReview ? 'Check for saved review' : 'Try again'}</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Score ────────────────────────────────────────────────────────────────────

/**
 * The band as a glowing ring: a gradient arc with a soft halo behind it that
 * fills once on load. The one decorative moment on the report, kept because
 * the score is what students look for first.
 */
function ScoreRing({ score }) {
  const reduceMotion = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const value = Math.max(0, Math.min(9, Number(score) || 0));
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 9);
  return (
    <div
      className="relative grid h-32 w-32 shrink-0 place-items-center"
      role="img"
      aria-label={`Band ${formatBand(score)} out of 9`}
    >
      <div
        className="pointer-events-none absolute inset-4 rounded-full bg-[#5a63df]/25 blur-xl dark:bg-[#8f97ff]/25"
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 h-full w-full -rotate-90 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c83f2" />
            <stop offset="55%" stopColor="#5a63df" />
            <stop offset="100%" stopColor="#3b42c4" />
          </linearGradient>
          <filter id={`glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-[#e8e7f6] dark:stroke-white/10"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          stroke={`url(#ring-${id})`}
          filter={`url(#glow-${id})`}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduceMotion ? offset : circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduceMotion ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="relative text-center">
        <p className="text-[10px] font-bold text-[#5a63df] dark:text-[#afb5ff]">Band</p>
        <p
          className={cn(
            NUM,
            'text-[36px] font-extrabold leading-none text-slate-900 dark:text-white'
          )}
        >
          {formatBand(score)}
        </p>
        <p className="mt-1 text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
          out of 9
        </p>
      </div>
    </div>
  );
}

function CriterionTile({ criterion }) {
  return (
    <li className={cn(WELL, 'min-w-0 rounded-lg px-3 py-2.5')}>
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1 text-[12.5px] font-bold leading-tight text-slate-700 dark:text-slate-200">
          {criterion.label}
          <InfoTip label={`About ${criterion.label}`}>{criterion.help}</InfoTip>
        </span>
        <span
          className={cn(
            NUM,
            'text-[20px] font-extrabold leading-none text-slate-900 dark:text-white'
          )}
        >
          {formatBand(criterion.score)}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-white dark:bg-white/10"
        aria-hidden="true"
      >
        <div
          className={cn(
            'h-full rounded-full',
            criterion.isLowest ? 'bg-[rgb(var(--signal-warn))]' : 'bg-[rgb(var(--panel-accent))]'
          )}
          style={{ width: `${(criterion.score / 9) * 100}%` }}
        />
      </div>
      {criterion.isLowest && (
        <p className="mt-1.5 text-[11px] font-semibold text-[rgb(var(--signal-warn))]">
          Lowest area
        </p>
      )}
      {criterion.note && (
        <p className="mt-1.5 line-clamp-3 text-[11.5px] leading-snug text-slate-600 dark:text-slate-300">
          {criterion.note}
        </p>
      )}
    </li>
  );
}

function ScoreCard({ feedback, criteria, onDownloadPdf, isDownloadingPdf }) {
  const taskType = taskTypeOf(feedback);
  const marking = describeMarking(feedback.scoreAgreement);
  return (
    <section className={cn(PANEL, '@container p-4')} aria-labelledby="writing-score-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="writing-score-title" className={TITLE}>
          {taskType} result
        </h2>
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isDownloadingPdf}
          className={QUIET_BUTTON}
        >
          {isDownloadingPdf ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isDownloadingPdf ? 'Preparing' : 'PDF'}
        </button>
      </div>

      <div className="mt-3 flex flex-col items-center gap-4 @md:flex-row @md:items-center">
        <ScoreRing score={feedback.overallBand} />
        {feedback.summary && (
          <div className="min-w-0 text-center @md:text-left">
            <h3 className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400">
              Why you got {formatBand(feedback.overallBand)}
            </h3>
            <p className="mt-1 text-[14px] font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
              {feedback.summary}
            </p>
          </div>
        )}
      </div>

      {criteria.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-2" aria-label="Score for each area">
          {criteria.map((criterion) => (
            <CriterionTile key={criterion.id} criterion={criterion} />
          ))}
        </ul>
      )}

      {marking && <p className={cn('mt-2.5 text-[11px]', MUTED)}>{marking}</p>}
    </section>
  );
}

function CombinedBand({ band }) {
  return (
    <div className={cn(PANEL, 'flex items-center justify-between gap-3 px-4 py-2.5')}>
      <div>
        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
          Writing band for both tasks
        </p>
        <p className={cn('text-[11.5px]', MUTED)}>Task 2 counts twice as much as Task 1.</p>
      </div>
      <span className={cn(NUM, 'text-[22px] font-extrabold text-slate-900 dark:text-white')}>
        {formatBand(band)}
      </span>
    </div>
  );
}

// ─── Next step ────────────────────────────────────────────────────────────────

function EvidenceQuote({ text, onShow }) {
  if (!text) return null;
  return (
    <figure className={cn(WELL, 'mt-3 rounded-lg px-3 py-2')}>
      <figcaption className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
        From your essay
      </figcaption>
      <blockquote className="mt-0.5 font-serif text-[13.5px] leading-relaxed text-slate-800 dark:text-slate-100">
        “{text}”
      </blockquote>
      {onShow && (
        <button type="button" className={cn(TEXT_BUTTON, 'mt-1')} onClick={onShow}>
          Show in my essay
        </button>
      )}
    </figure>
  );
}

function NextStepCard({ step, onShowInEssay, onRevise }) {
  if (!step) {
    return (
      <section className={cn(PANEL, 'p-4')}>
        <h2 className={TITLE}>No major problem found</h2>
        <p className={cn('mt-1 text-[13px]', MUTED)}>
          Keep the same approach, and check the small fixes below.
        </p>
      </section>
    );
  }
  return (
    <section
      className={cn(PANEL, 'relative overflow-hidden p-4 sm:p-5')}
      aria-labelledby="writing-next-step-title"
    >
      <span
        className="absolute inset-y-0 left-0 w-[3px] bg-[#5a63df] dark:bg-[#8f97ff]"
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[12px] font-bold text-[#5a63df] dark:text-[#afb5ff]">Your next step</p>
        {step.criterion && <Pill tone="neutral">{step.criterion}</Pill>}
      </div>
      <h2
        id="writing-next-step-title"
        className="mt-1.5 text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-slate-900 dark:text-white"
      >
        {step.title}
      </h2>
      {step.body && (
        <p className="mt-1.5 max-w-[64ch] text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200">
          {step.body}
        </p>
      )}
      <EvidenceQuote
        text={step.evidenceText}
        onShow={
          onShowInEssay && step.evidenceText
            ? () => onShowInEssay({ originalText: step.evidenceText })
            : null
        }
      />
      {onRevise && (
        <div className="mt-4">
          <button type="button" className={PRIMARY_BUTTON} onClick={onRevise}>
            <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
            Revise your answer
          </button>
        </div>
      )}
    </section>
  );
}

// ─── Task 1 chart check ───────────────────────────────────────────────────────

function CheckMark({ done, tone = 'ok' }) {
  return done ? (
    <span
      className={cn(
        'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-white',
        tone === 'ok' ? 'bg-[rgb(var(--signal-ok))]' : 'bg-[#5a63df]'
      )}
      aria-hidden="true"
    >
      <Check className="h-3 w-3" strokeWidth={3} />
    </span>
  ) : (
    <span
      className="block h-[18px] w-[18px] shrink-0 rounded-full border-2 border-[rgb(var(--signal-warn)/0.7)]"
      aria-hidden="true"
    />
  );
}

function ChartCheckCard({ check }) {
  if (!check) return null;
  const covered = check.features.filter((feature) => feature.covered).length;
  const matched = check.status === 'ok';
  return (
    <section className={cn(PANEL, 'p-4')} aria-labelledby="writing-chart-title">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-full',
            matched
              ? 'bg-[rgb(var(--signal-ok)/0.12)] text-[rgb(var(--signal-ok))]'
              : check.status === 'fault'
                ? 'bg-[rgb(var(--signal-fault)/0.12)] text-[rgb(var(--signal-fault))]'
                : 'bg-[rgb(var(--signal-warn)/0.12)] text-[rgb(var(--signal-warn))]'
          )}
          aria-hidden="true"
        >
          {matched ? (
            <Check className="h-5 w-5" strokeWidth={2.75} />
          ) : (
            <AlertTriangle className="h-4.5 w-4.5" />
          )}
        </span>
        <div className="min-w-0">
          <h2 id="writing-chart-title" className={TITLE}>
            {matched ? 'Right chart described' : 'Chart check'}
          </h2>
          <p className="mt-0.5 text-[13px] leading-snug text-slate-600 dark:text-slate-300">
            {check.message}
          </p>
        </div>
      </div>

      {check.features.length > 0 && (
        <div className="mt-3 border-t border-[#eceafa] pt-3 dark:border-white/[0.07]">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
              Main features
            </h3>
            <span className={cn(NUM, 'text-[12px] font-semibold', MUTED)}>
              {covered} of {check.features.length} mentioned
            </span>
          </div>
          <ul className="mt-2 space-y-2">
            {check.features.map((feature) => (
              <li key={feature.text} className="flex items-start gap-2.5">
                <CheckMark done={feature.covered} />
                <span className="min-w-0 text-[13px] leading-snug text-slate-700 dark:text-slate-200">
                  {feature.text}
                  {!feature.covered && (
                    <span className="block text-[11.5px] font-semibold text-[rgb(var(--signal-warn))]">
                      Not clearly in your answer. Add it.
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// ─── Other priorities ─────────────────────────────────────────────────────────

function AlsoWorkOn({ priorities, onShowInEssay }) {
  if (priorities.length === 0) return null;
  return (
    <section className={cn(PANEL, 'p-4')} aria-labelledby="writing-also-title">
      <h2 id="writing-also-title" className={TITLE}>
        Also work on
      </h2>
      <ol className="mt-2.5 space-y-3">
        {priorities.map((priority, index) => (
          <li key={`${priority.issue}-${index}`} className="flex gap-2.5">
            <span
              className={cn(
                NUM,
                'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#f4f3fb] text-[11px] font-bold text-slate-600 dark:bg-white/8 dark:text-slate-300'
              )}
              aria-hidden="true"
            >
              {index + 2}
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold leading-snug text-slate-900 dark:text-white">
                {priority.issue || priority.action}
                {priority.criterion && (
                  <span className={cn('ml-1.5 text-[11.5px] font-semibold', MUTED)}>
                    {priority.criterion}
                  </span>
                )}
              </p>
              {priority.issue && priority.action && (
                <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {priority.action}
                </p>
              )}
              {priority.evidenceText && onShowInEssay && (
                <button
                  type="button"
                  className={cn(TEXT_BUTTON, 'mt-1')}
                  onClick={() => onShowInEssay({ originalText: priority.evidenceText })}
                >
                  Show in my essay
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ─── Fixes ────────────────────────────────────────────────────────────────────

function FixRow({ item, done, onToggle, onShowInEssay }) {
  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Fixed: ${item.original}` : `Mark “${item.original}” as fixed`}
        onClick={onToggle}
        className={cn('mt-0.5 rounded-full', FOCUS_RING, 'focus-visible:ring-offset-1')}
      >
        <CheckMark done={done} />
      </button>
      <div className={cn('min-w-0 flex-1 transition-opacity', done && 'opacity-55')}>
        <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">You wrote</p>
        <p
          className={cn(
            'font-serif text-[14px] leading-snug text-slate-900 dark:text-slate-100',
            item.replacement && 'line-through decoration-[rgb(var(--signal-fault))] decoration-2'
          )}
        >
          {item.original}
        </p>
        <p className="mt-1.5 text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
          {item.replacement ? 'Change to' : 'What to do'}
        </p>
        <p
          className={cn(
            'text-[13.5px] leading-snug',
            item.replacement
              ? 'font-serif font-semibold text-[rgb(var(--signal-ok))]'
              : 'font-medium text-slate-800 dark:text-slate-100'
          )}
        >
          {item.replacement || item.advice}
        </p>
        {item.explanation && (
          <p className={cn('mt-1 text-[12px] leading-snug', MUTED)}>{item.explanation}</p>
        )}
        {item.annotation && onShowInEssay && (
          <button
            type="button"
            className={cn(TEXT_BUTTON, 'mt-1 text-[11.5px]')}
            onClick={() => onShowInEssay(item.annotation)}
          >
            Show in my essay
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * Which fixes the learner has ticked off. Kept in this browser only: a study
 * aid for working through the list, not a record anyone else needs.
 */
function useFixedItems(reportKey) {
  const storageKey = reportKey ? `writing-fixed:${reportKey}` : null;
  const [fixed, setFixed] = useState(() => {
    if (!storageKey) return [];
    try {
      return JSON.parse(window.localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  });
  useEffect(() => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(fixed));
    } catch {
      // Storage can be unavailable (private mode); ticks then last for this visit.
    }
  }, [fixed, storageKey]);
  const toggle = (key) =>
    setFixed((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  return { fixed, toggle };
}

const PRACTICE_LINKS = {
  grammar: { to: '/grammar', label: 'Practise grammar' },
  vocabulary: { to: '/vocabulary', label: 'Practise vocabulary' },
};

function FixesCard({ groups, onShowInEssay, reportKey }) {
  const { fixed, toggle } = useFixedItems(reportKey);
  const keys = groups.flatMap((group) => group.items.map((item) => `${group.id}:${item.original}`));
  const total = keys.length;
  const doneCount = keys.filter((key) => fixed.includes(key)).length;
  return (
    <section className={cn(PANEL, 'p-4')} aria-labelledby="writing-fixes-title">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="writing-fixes-title" className={TITLE}>
          Fix these
        </h2>
        {total > 0 && (
          <span
            className={cn(
              NUM,
              'text-[12px] font-semibold',
              doneCount === total ? 'text-[rgb(var(--signal-ok))]' : MUTED
            )}
          >
            {doneCount} of {total} fixed
          </span>
        )}
      </div>
      {total > 0 && (
        <div className={cn('mt-2 h-1.5 overflow-hidden rounded-full', WELL)} aria-hidden="true">
          <div
            className="h-full rounded-full bg-[rgb(var(--signal-ok))] transition-[width] duration-300"
            style={{ width: `${(doneCount / total) * 100}%` }}
          />
        </div>
      )}
      {total === 0 ? (
        <p className={cn('mt-1 text-[13px]', MUTED)}>
          No sentence needed a correction. Use your next step above to improve the next draft.
        </p>
      ) : (
        <>
          <p className={cn('mt-2 text-[12px]', MUTED)}>
            Tick each one after you fix it in your draft.
          </p>
          <div className="mt-3 space-y-4">
            {groups.map((group) => {
              const practice = PRACTICE_LINKS[group.skill];
              return (
                <div key={group.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
                      {group.label}
                    </h3>
                    {practice && (
                      <Link to={practice.to} className={cn(TEXT_BUTTON, 'text-[11.5px]')}>
                        {practice.label}
                      </Link>
                    )}
                  </div>
                  <ul className="mt-2 divide-y divide-[#eceafa] dark:divide-white/[0.07]">
                    {group.items.map((item, index) => {
                      const key = `${group.id}:${item.original}`;
                      return (
                        <FixRow
                          key={`${key}-${index}`}
                          item={item}
                          done={fixed.includes(key)}
                          onToggle={() => toggle(key)}
                          onShowInEssay={onShowInEssay}
                        />
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

// ─── Strengths ────────────────────────────────────────────────────────────────

function StrengthsCard({ strengths }) {
  if (strengths.length === 0) return null;
  return (
    <section className={cn(PANEL, 'p-4')} aria-labelledby="writing-strengths-title">
      <h2 id="writing-strengths-title" className={TITLE}>
        What’s already working
      </h2>
      <ul className="mt-2 space-y-1.5">
        {strengths.map((strength) => (
          <li
            key={strength}
            className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-700 dark:text-slate-200"
          >
            <Check
              className="mt-1 h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-ok))]"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            {strength}
          </li>
        ))}
      </ul>
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
  onRevise,
  coachSession,
  coachTaskType,
  originalHtml,
}) {
  const allFeedbacks = useWritingTestStore((state) => state.feedbacks);
  const { isDownloadingPdf, handleDownloadPdf } = useDownloadPdf(allFeedbacks);

  const report = useMemo(() => {
    if (!feedback) return null;
    const priorities = buildPriorities(feedback);
    return {
      criteria: buildCriteria(feedback),
      nextStep: buildNextStep(feedback, priorities),
      chartCheck: buildChartCheck(feedback),
      fixes: buildMistakeGroups(feedback),
      strengths: buildStrengths(feedback),
    };
  }, [feedback]);
  const combinedBand = useMemo(() => combinedWritingBand(allFeedbacks), [allFeedbacks]);

  if (!feedback && !isAnalyzing && !feedbackError) return null;

  const canRevise = Boolean(onRevise && coachSession?.id && coachTaskType);

  return (
    <TooltipProvider delayDuration={150}>
      <div
        id="feedback-section"
        className="flex h-full min-h-0 flex-col bg-[#f7f6fd] text-slate-900 dark:bg-[#08080a] dark:text-white"
      >
        <AnimatePresence mode="wait">
          {isAnalyzing && <WritingAnalysis loadingMessage={loadingMessage} />}
          {!isAnalyzing && feedbackError && (
            <ErrorState feedbackError={feedbackError} handleGetFeedback={handleGetFeedback} />
          )}
          {!isAnalyzing && !feedbackError && feedback && report && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4"
            >
              <ScoreCard
                feedback={feedback}
                criteria={report.criteria}
                onDownloadPdf={handleDownloadPdf}
                isDownloadingPdf={isDownloadingPdf}
              />

              {combinedBand && <CombinedBand band={combinedBand} />}

              <NextStepCard
                step={report.nextStep}
                onShowInEssay={onShowInEssay}
                onRevise={canRevise ? onRevise : null}
              />

              <ChartCheckCard check={report.chartCheck} />

              <AlsoWorkOn priorities={report.nextStep?.rest || []} onShowInEssay={onShowInEssay} />

              <FixesCard
                groups={report.fixes}
                onShowInEssay={onShowInEssay}
                reportKey={feedback.sourceFingerprint || feedback.generatedAt}
              />

              <StrengthsCard strengths={report.strengths} />

              {coachSession?.id && coachTaskType && (
                <WritingCoach
                  session={coachSession}
                  taskType={coachTaskType}
                  feedback={feedback}
                  originalHtml={originalHtml}
                />
              )}

              <p className={cn('px-1 pb-1 text-[11px] leading-4', MUTED)}>
                A practice estimate based on the public IELTS band descriptors, not an official
                examiner score.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

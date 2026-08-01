import React from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Sparkles,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { stripHtml, getCriteria } from './checkerUtils';
import { ANALYSIS_STAGES, getSampleCriteria, getCriterionDetail } from './checkerConstants';

// ---------------------------------------------------------------------------
// Small sub-components to reduce the DemoResultPanel cyclomatic complexity
// ---------------------------------------------------------------------------

/** Circular SVG dial showing a band score. */
function BandScoreDial({ score }) {
  const scoreVal = Number(score || 7.0);
  const radius = 38;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scoreVal / 9) * circumference;

  return (
    <div className="relative grid h-24 w-24 place-items-center shrink-0">
      <svg className="h-full w-full -rotate-90">
        <circle
          cx="48"
          cy="48"
          r={radius}
          className="stroke-indigo-50/50 dark:stroke-white/10 fill-transparent"
          strokeWidth={strokeWidth}
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          className="stroke-indigo-600 dark:stroke-indigo-400 fill-transparent transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-indigo-950 dark:text-white tracking-tighter">
          {scoreVal.toFixed(1)}
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Band
        </span>
      </div>
    </div>
  );
}

/** Full-width loading state shown while analysis is running. */
function AnalysisLoadingState({ analysisStage }) {
  const currentStageIndex = Math.max(
    0,
    ANALYSIS_STAGES.findIndex((stage) => stage.id === analysisStage)
  );

  return (
    <div
      aria-live="polite"
      className="flex min-h-[620px] flex-col items-center justify-center rounded-[28px] border border-indigo-100 bg-white p-8 text-center shadow-[0_24px_80px_rgba(79,70,229,0.09)] dark:border-white/10 dark:bg-gradient-to-b dark:from-[#131315] dark:to-[#131315] dark:shadow-none"
    >
      <div className="relative grid h-24 w-24 place-items-center rounded-full bg-indigo-50 ring-8 ring-indigo-50/70 dark:bg-indigo-500/15 dark:ring-indigo-500/[0.08]">
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 border-r-violet-500 animate-spin" />
        <Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
      </div>
      <span className="mt-8 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[.16em] text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
        Academic IELTS analysis
      </span>
      <h3 className="mt-4 text-2xl font-extrabold text-slate-950 dark:text-white">
        Analysing your writing…
      </h3>
      <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
        We are checking your response against the four IELTS writing criteria and preparing a
        practical report.
      </p>
      <div className="mt-8 w-full max-w-sm">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-700"
            style={{ width: `${Math.min(94, 24 + currentStageIndex * 32)}%` }}
          />
        </div>
        <div className="mt-4 grid gap-2 text-left">
          {ANALYSIS_STAGES.map((stage, index) => (
            <div key={stage.id} className="flex items-center gap-3 text-xs font-bold">
              <span
                className={cn(
                  'grid h-5 w-5 place-items-center rounded-full border transition-colors',
                  index <= currentStageIndex
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-200 bg-white text-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-600'
                )}
              >
                {index < currentStageIndex ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span
                className={
                  index === currentStageIndex
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : index < currentStageIndex
                      ? 'text-slate-500 dark:text-slate-400'
                      : 'text-slate-300 dark:text-slate-600'
                }
              >
                {stage.label}
              </span>
              {index === currentStageIndex && (
                <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-indigo-500" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Real feedback result panel (user has a real report). */
function FeedbackResult({ feedback, activeTask }) {
  const criteria = getCriteria(feedback, activeTask);
  const strengths = feedback.strengths.slice(0, 4);
  const weaknesses = feedback.weaknesses.slice(0, 4);
  const suggestions = feedback.suggestions.slice(0, 6);
  const corrections = feedback.corrections.slice(0, 5);
  const vocabulary = feedback.vocabularyEnhancements.slice(0, 4);

  return (
    <section
      aria-live="polite"
      className="h-full rounded-[28px] border border-indigo-100 bg-white p-5 shadow-[0_24px_80px_rgba(79,70,229,0.09)] sm:p-7 dark:border-white/10 dark:bg-gradient-to-b dark:from-[#131315] dark:to-[#131315] dark:shadow-none"
    >
      <div className="flex flex-wrap items-center justify-between gap-5 border-b border-slate-100 dark:border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> Your report is ready
          </div>
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
            Your Academic IELTS result is ready to review.
          </p>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
            Estimated practice band
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-5xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
              {(feedback.overallBand || 7.0).toFixed(1)}
            </span>
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500">out of 9</span>
          </div>
        </div>
        <BandScoreDial score={feedback.overallBand} />
      </div>

      {/* Detailed scoring */}
      <div className="py-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
            Detailed scoring
          </h3>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">
            Academic {activeTask}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {criteria.map((criterion) => {
            const details = getCriterionDetail(criterion.label);
            const Icon = details.icon;
            const score = criterion.score == null ? 0 : Number(criterion.score);
            return (
              <div
                key={criterion.label}
                className="flex flex-col justify-between h-full rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all duration-300 hover:shadow-md hover:border-slate-200/60 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-white/[0.15]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'grid h-9 w-9 place-items-center rounded-xl',
                        details.bgColor,
                        details.iconColor
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-extrabold text-[#0d1740] dark:text-white">
                      {criterion.label}
                    </span>
                  </div>
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                    {criterion.score == null ? '—' : score.toFixed(1)}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full bg-gradient-to-r transition-all duration-1000',
                        details.barColor
                      )}
                      style={{ width: `${(score / 9) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid gap-4 border-t border-slate-100 dark:border-white/10 pt-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/20 to-white p-5 dark:border-white/10 dark:from-white/[0.03] dark:to-white/[0.03]">
          <h3 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> What is
            working
          </h3>
          <div className="mt-4 space-y-3.5">
            {strengths.map((item, index) => (
              <div key={`${index}-${item}`} className="flex gap-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <p className="text-xs leading-5 text-slate-700 dark:text-slate-300">
                  {stripHtml(String(item))}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-b from-amber-50/20 to-white p-5 dark:border-white/10 dark:from-white/[0.03] dark:to-white/[0.03]">
          <h3 className="text-sm font-extrabold text-amber-950 dark:text-amber-300 flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" /> What limits the band
          </h3>
          <div className="mt-4 space-y-3.5">
            {weaknesses.map((item, index) => (
              <div key={`${index}-${item}`} className="flex gap-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <p className="text-xs leading-5 text-slate-700 dark:text-slate-300">
                  {stripHtml(String(item))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="mt-6 border-t border-slate-100 dark:border-white/10 pt-6">
        <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
          Priority actions for the next draft
        </h3>
        <div className="mt-4 space-y-3">
          {suggestions.length ? (
            suggestions.map((item, index) => (
              <div
                key={`${index}-${item}`}
                className="flex gap-4 rounded-2xl border border-indigo-50 bg-indigo-50/30 p-4 transition-all hover:bg-indigo-50/50 dark:border-indigo-500/15 dark:bg-indigo-500/[0.06] dark:hover:bg-indigo-500/[0.1]"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-[11px] font-black text-white shadow-sm shadow-indigo-200 dark:shadow-none">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {stripHtml(String(item))}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-white/[0.03] dark:text-slate-400">
              Use the criterion scores above to prioritise your next revision.
            </p>
          )}
        </div>
      </div>

      {/* Corrections */}
      {corrections.length > 0 && (
        <div className="mt-6 border-t border-slate-100 dark:border-white/10 pt-6">
          <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
            Language corrections
          </h3>
          <div className="mt-4 space-y-3">
            {corrections.map((item, index) => (
              <div
                key={`${index}-${item.original}`}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 line-through dark:bg-rose-500/10 dark:text-rose-300">
                    {stripHtml(item.original)}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                    {stripHtml(item.correction)}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {stripHtml(item.explanation)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vocabulary */}
      {vocabulary.length > 0 && (
        <div className="mt-6 border-t border-slate-100 dark:border-white/10 pt-6">
          <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
            Vocabulary in context
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {vocabulary.map((item, index) => (
              <div
                key={`${index}-${item.original}`}
                className="rounded-2xl border border-violet-100/60 bg-gradient-to-br from-violet-50/10 to-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:from-white/[0.03] dark:to-white/[0.03] dark:hover:shadow-none"
              >
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 dark:text-slate-500 font-semibold">
                    {stripHtml(item.original)}
                  </span>
                  <ArrowRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
                  <span className="text-violet-700 dark:text-violet-300">
                    {(item.alternatives || []).map(stripHtml).join(' / ')}
                  </span>
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-400 italic">
                  &quot;{stripHtml(item.context)}&quot;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
        This is an AI-assisted practice estimate, not an official IELTS result.
      </p>
    </section>
  );
}

/** Demo / signup-gated preview panel. */
function DemoPreview({ activeTask, showSignupGate, isSignedIn, error, onSignUp, onRetry }) {
  const sampleCriteria = getSampleCriteria(activeTask);
  const showOverlay = showSignupGate || (isSignedIn && Boolean(error));

  return (
    <section
      aria-label="Academic IELTS demo feedback report"
      className="relative h-full min-h-[620px] overflow-hidden rounded-[28px] border border-indigo-100 bg-white p-5 shadow-[0_24px_80px_rgba(79,70,229,0.09)] sm:p-7 dark:border-white/10 dark:bg-gradient-to-b dark:from-[#131315] dark:to-[#131315] dark:shadow-none"
    >
      <div className={cn('transition duration-300', showSignupGate && 'select-none blur-[5px]')}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-6">
          <div>
            <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              Demo report · {activeTask}
            </span>
            <p className="mt-5 text-sm font-bold text-slate-500 dark:text-slate-400">
              Estimated practice band
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-5xl font-black text-indigo-600 dark:text-indigo-400">7.0</span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">out of 9</span>
            </div>
          </div>
          <BandScoreDial score={7.0} />
        </div>

        <div className="py-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
              What your report reveals
            </h3>
            <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              IELTS criteria demo
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {sampleCriteria.map(([label, score, text]) => {
              const details = getCriterionDetail(label);
              const Icon = details.icon;
              const scoreVal = Number(score);
              return (
                <div
                  key={label}
                  className="flex flex-col justify-between h-full rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all duration-300 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-white/[0.15]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'grid h-9 w-9 place-items-center rounded-xl',
                            details.bgColor,
                            details.iconColor
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-extrabold text-[#0d1740] dark:text-white">
                          {label}
                        </span>
                      </div>
                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                        {score}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {text}
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full bg-gradient-to-r transition-all duration-1000',
                          details.barColor
                        )}
                        style={{ width: `${(scoreVal / 9) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-white/10 pt-6">
          <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
            Example improvement priorities
          </h3>
          <div className="mt-4 space-y-3">
            {[
              'Develop the less-supported view with one specific example.',
              'Use referencing words to reduce repetition across paragraphs.',
              'Check article use and punctuation in longer complex sentences.',
            ].map((item, index) => (
              <div
                key={item}
                className="flex gap-4 rounded-2xl border border-indigo-50 bg-indigo-50/30 p-4 transition-all dark:border-indigo-500/15 dark:bg-indigo-500/[0.06]"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-[11px] font-black text-white shadow-sm shadow-indigo-200 dark:shadow-none">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showOverlay && (
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-[24px] border border-indigo-100 bg-white/95 p-6 text-center shadow-2xl shadow-indigo-100/30 backdrop-blur-md dark:border-white/10 dark:bg-[#131315]/95 dark:shadow-none">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50 animate-pulse dark:bg-indigo-500/15 dark:text-indigo-400 dark:ring-indigo-500/[0.08]">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h3 className="mt-6 text-xl font-extrabold text-slate-950 dark:text-white">
            {error
              ? 'Your report was not generated'
              : isSignedIn
                ? 'Your report will appear here'
                : 'Sign up to reveal your real report'}
          </h3>
          <p
            className={cn(
              'mx-auto mt-2.5 max-w-sm text-xs leading-5',
              error ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
            )}
          >
            {error ||
              (isSignedIn
                ? 'Add your response, then request feedback to replace this blurred example with your real report.'
                : 'Create your free account to continue. Your first 3 writing feedback reports are included.')}
          </p>
          <button
            type="button"
            onClick={isSignedIn ? onRetry : onSignUp}
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 dark:shadow-none transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {isSignedIn ? (error ? 'Try again' : 'Check my writing') : 'Create free account'}{' '}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function DemoResultPanel({
  feedback,
  activeTask,
  isLoading,
  analysisStage,
  error,
  onSignUp,
  onRetry,
  isSignedIn,
  showSignupGate,
}) {
  if (isLoading) {
    return <AnalysisLoadingState analysisStage={analysisStage} />;
  }

  if (feedback) {
    return <FeedbackResult feedback={feedback} activeTask={activeTask} />;
  }

  return (
    <DemoPreview
      activeTask={activeTask}
      showSignupGate={showSignupGate}
      isSignedIn={isSignedIn}
      error={error}
      onSignUp={onSignUp}
      onRetry={onRetry}
    />
  );
}

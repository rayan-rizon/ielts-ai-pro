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
import { PANEL, TILE, WELL, NUM, MICRO, TITLE } from '@/features/dashboard/components/primitives';
import { stripHtml, getCriteria } from './checkerUtils';
import { ANALYSIS_STAGES, getSampleCriteria, getCriterionDetail } from './checkerConstants';

// ---------------------------------------------------------------------------
// Small sub-components to reduce the DemoResultPanel cyclomatic complexity
// ---------------------------------------------------------------------------

/** Circular SVG dial showing a band score. */
function BandScoreDial({ score }) {
  const scoreVal = Number(score || 7.0);
  const radius = 32;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scoreVal / 9) * circumference;

  return (
    <div className="relative grid h-20 w-20 place-items-center shrink-0">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={radius}
          className="stroke-slate-100 dark:stroke-white/10 fill-transparent"
          strokeWidth={strokeWidth}
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          className="stroke-[#5a63df] dark:stroke-[#afb5ff] fill-transparent transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
        <span
          className={cn(NUM, 'text-2xl font-black text-slate-900 dark:text-white tracking-tight')}
        >
          {scoreVal.toFixed(1)}
        </span>
        <span className={cn(MICRO, 'text-[9px] text-slate-400 dark:text-slate-500')}>Band</span>
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
      className={cn(
        PANEL,
        'flex min-h-[600px] flex-col items-center justify-center p-6 sm:p-8 text-center'
      )}
    >
      <div className="relative grid h-20 w-20 place-items-center rounded-full bg-[#5a63df]/10 ring-8 ring-[#5a63df]/10 dark:bg-[#5a63df]/20 dark:ring-[#5a63df]/15">
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#5a63df] border-r-indigo-400 animate-spin" />
        <Sparkles className="h-7 w-7 text-[#5a63df] dark:text-[#afb5ff] animate-pulse" />
      </div>
      <span
        className={cn(
          MICRO,
          'mt-6 rounded-full bg-[#5a63df]/10 px-3 py-1 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#afb5ff]'
        )}
      >
        Academic IELTS analysis
      </span>
      <h3 className={cn(TITLE, 'mt-3 text-xl font-extrabold')}>Analysing your writing…</h3>
      <p className="mt-2 max-w-sm text-xs sm:text-sm leading-6 text-slate-500 dark:text-slate-400">
        We are checking your response against the four IELTS writing criteria and preparing a
        practical report.
      </p>
      <div className="mt-6 w-full max-w-sm">
        <div className={cn(WELL, 'h-2 overflow-hidden rounded-full')}>
          <div
            className="h-full rounded-full bg-[#5a63df] transition-all duration-700"
            style={{ width: `${Math.min(94, 24 + currentStageIndex * 32)}%` }}
          />
        </div>
        <div className="mt-4 grid gap-2.5 text-left">
          {ANALYSIS_STAGES.map((stage, index) => (
            <div key={stage.id} className="flex items-center gap-3 text-xs font-semibold">
              <span
                className={cn(
                  'grid h-5 w-5 place-items-center rounded-full border text-[10px] transition-colors',
                  index <= currentStageIndex
                    ? 'border-[#5a63df] bg-[#5a63df] text-white'
                    : 'border-[#e4e2f0] bg-white text-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-600'
                )}
              >
                {index < currentStageIndex ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span
                className={
                  index === currentStageIndex
                    ? 'text-[#5a63df] dark:text-[#afb5ff] font-extrabold'
                    : index < currentStageIndex
                      ? 'text-slate-500 dark:text-slate-400'
                      : 'text-slate-400 dark:text-slate-600'
                }
              >
                {stage.label}
              </span>
              {index === currentStageIndex && (
                <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-[#5a63df]" />
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
    <section aria-live="polite" className={cn(PANEL, 'h-full p-5 sm:p-6')}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e4e2f0] dark:border-white/[0.07] pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> Your report is ready
          </div>
          <p
            className={cn(TITLE, 'mt-3 text-sm font-extrabold text-slate-800 dark:text-slate-200')}
          >
            Your Academic IELTS result is ready to review.
          </p>
          <p className={cn(MICRO, 'mt-3 text-slate-400 dark:text-slate-500')}>
            Estimated practice band
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={cn(
                NUM,
                'text-4xl sm:text-5xl font-black tracking-tight text-[#5a63df] dark:text-[#afb5ff]'
              )}
            >
              {(feedback.overallBand || 7.0).toFixed(1)}
            </span>
            <span
              className={cn(
                NUM,
                'text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-500'
              )}
            >
              out of 9
            </span>
          </div>
        </div>
        <BandScoreDial score={feedback.overallBand} />
      </div>

      {/* Detailed scoring */}
      <div className="py-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className={TITLE}>Detailed scoring</h3>
          <span
            className={cn(
              MICRO,
              'rounded-md border border-[#e4e2f0] bg-[#f4f3fb] px-2.5 py-1 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300'
            )}
          >
            Academic {activeTask}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {criteria.map((criterion) => {
            const details = getCriterionDetail(criterion.label);
            const Icon = details.icon;
            const score = criterion.score == null ? 0 : Number(criterion.score);
            return (
              <div
                key={criterion.label}
                className={cn(TILE, 'flex flex-col justify-between h-full p-4')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#e4e2f0] dark:border-white/10',
                        details.bgColor,
                        details.iconColor
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      {criterion.label}
                    </span>
                  </div>
                  <span
                    className={cn(
                      NUM,
                      'text-base font-black text-[#5a63df] dark:text-[#afb5ff] shrink-0'
                    )}
                  >
                    {criterion.score == null ? '—' : score.toFixed(1)}
                  </span>
                </div>
                <div className="mt-3.5">
                  <div className={cn(WELL, 'h-1.5 w-full rounded-full overflow-hidden')}>
                    <div
                      className={cn(
                        'h-full rounded-full bg-[#5a63df] transition-all duration-1000',
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
      <div className="grid gap-3.5 border-t border-[#e4e2f0] dark:border-white/[0.07] pt-5 sm:grid-cols-2">
        <div className={cn(TILE, 'p-4')}>
          <h3 className="text-xs sm:text-sm font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> What is
            working
          </h3>
          <div className="mt-3.5 space-y-3">
            {strengths.map((item, index) => (
              <div key={`${index}-${item}`} className="flex gap-2.5 items-start">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {stripHtml(String(item))}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className={cn(TILE, 'p-4')}>
          <h3 className="text-xs sm:text-sm font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" /> What limits the band
          </h3>
          <div className="mt-3.5 space-y-3">
            {weaknesses.map((item, index) => (
              <div key={`${index}-${item}`} className="flex gap-2.5 items-start">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {stripHtml(String(item))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="mt-5 border-t border-[#e4e2f0] dark:border-white/[0.07] pt-5">
        <h3 className={TITLE}>Priority actions for the next draft</h3>
        <div className="mt-3.5 space-y-2.5">
          {suggestions.length ? (
            suggestions.map((item, index) => (
              <div key={`${index}-${item}`} className={cn(TILE, 'flex gap-3.5 p-3.5 items-center')}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5a63df] text-[11px] font-black text-white leading-none">
                  {index + 1}
                </span>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {stripHtml(String(item))}
                </p>
              </div>
            ))
          ) : (
            <p className={cn(TILE, 'p-4 text-xs text-slate-500 dark:text-slate-400')}>
              Use the criterion scores above to prioritise your next revision.
            </p>
          )}
        </div>
      </div>

      {/* Corrections */}
      {corrections.length > 0 && (
        <div className="mt-5 border-t border-[#e4e2f0] dark:border-white/[0.07] pt-5">
          <h3 className={TITLE}>Language corrections</h3>
          <div className="mt-3.5 space-y-2.5">
            {corrections.map((item, index) => (
              <div key={`${index}-${item.original}`} className={cn(TILE, 'p-3.5')}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 line-through dark:bg-rose-500/10 dark:text-rose-300">
                    {stripHtml(item.original)}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  <span className="rounded bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                    {stripHtml(item.correction)}
                  </span>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {stripHtml(item.explanation)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vocabulary */}
      {vocabulary.length > 0 && (
        <div className="mt-5 border-t border-[#e4e2f0] dark:border-white/[0.07] pt-5">
          <h3 className={TITLE}>Vocabulary in context</h3>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            {vocabulary.map((item, index) => (
              <div key={`${index}-${item.original}`} className={cn(TILE, 'p-3.5')}>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 font-semibold">{stripHtml(item.original)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                  <span className="text-[#5a63df] dark:text-[#afb5ff]">
                    {(item.alternatives || []).map(stripHtml).join(' / ')}
                  </span>
                </p>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400 italic">
                  &quot;{stripHtml(item.context)}&quot;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 rounded-lg bg-amber-500/10 p-3 text-xs leading-snug text-amber-800 dark:text-amber-300 border border-amber-500/20">
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
      className={cn(PANEL, 'relative h-full min-h-[600px] overflow-hidden p-5 sm:p-6')}
    >
      <div className={cn('transition duration-300', showSignupGate && 'select-none blur-[4px]')}>
        <div className="flex items-start justify-between gap-4 border-b border-[#e4e2f0] dark:border-white/[0.07] pb-5">
          <div>
            <span
              className={cn(
                MICRO,
                'rounded-full border border-[#5a63df]/25 bg-[#5a63df]/10 px-3 py-1 text-[#5a63df] dark:text-[#afb5ff]'
              )}
            >
              Demo report · {activeTask}
            </span>
            <p className={cn(MICRO, 'mt-4 text-slate-400 dark:text-slate-500')}>
              Estimated practice band
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className={cn(
                  NUM,
                  'text-4xl sm:text-5xl font-black text-[#5a63df] dark:text-[#afb5ff]'
                )}
              >
                7.0
              </span>
              <span
                className={cn(
                  NUM,
                  'text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-500'
                )}
              >
                out of 9
              </span>
            </div>
          </div>
          <BandScoreDial score={7.0} />
        </div>

        <div className="py-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className={TITLE}>What your report reveals</h3>
            <span
              className={cn(
                MICRO,
                'rounded-md border border-[#e4e2f0] bg-[#f4f3fb] px-2.5 py-1 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300'
              )}
            >
              IELTS criteria demo
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {sampleCriteria.map(([label, score, text]) => {
              const details = getCriterionDetail(label);
              const Icon = details.icon;
              const scoreVal = Number(score);
              return (
                <div key={label} className={cn(TILE, 'flex flex-col justify-between h-full p-4')}>
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            'grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#e4e2f0] dark:border-white/10',
                            details.bgColor,
                            details.iconColor
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                          {label}
                        </span>
                      </div>
                      <span
                        className={cn(
                          NUM,
                          'text-base font-extrabold text-[#5a63df] dark:text-[#afb5ff] shrink-0'
                        )}
                      >
                        {score}
                      </span>
                    </div>
                    <p className="mt-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {text}
                    </p>
                  </div>
                  <div className="mt-3.5">
                    <div className={cn(WELL, 'h-1.5 w-full rounded-full overflow-hidden')}>
                      <div
                        className={cn(
                          'h-full rounded-full bg-[#5a63df] transition-all duration-1000',
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

        <div className="border-t border-[#e4e2f0] dark:border-white/[0.07] pt-5">
          <h3 className={TITLE}>Example improvement priorities</h3>
          <div className="mt-3.5 space-y-2.5">
            {[
              'Develop the less-supported view with one specific example.',
              'Use referencing words to reduce repetition across paragraphs.',
              'Check article use and punctuation in longer complex sentences.',
            ].map((item, index) => (
              <div key={item} className={cn(TILE, 'flex gap-3 p-3.5 items-center')}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5a63df] text-[11px] font-black text-white leading-none">
                  {index + 1}
                </span>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showOverlay && (
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-xl border border-[#e4e2f0] bg-white/95 p-6 text-center shadow-lg dark:border-white/[0.10] dark:bg-[#131315]/95">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#afb5ff]">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h3 className={cn(TITLE, 'mt-4 text-lg font-extrabold')}>
            {error
              ? 'Your report was not generated'
              : isSignedIn
                ? 'Your report will appear here'
                : 'Sign up to reveal your real report'}
          </h3>
          <p
            className={cn(
              'mx-auto mt-2 max-w-xs text-xs leading-5',
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
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#5a63df] px-5 text-xs font-extrabold text-white transition hover:bg-[#4b54cf] focus:outline-none focus:ring-2 focus:ring-[#5a63df]"
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

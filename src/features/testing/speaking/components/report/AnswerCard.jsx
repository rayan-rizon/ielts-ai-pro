import React, { forwardRef } from 'react';
import { AlertTriangle, ArrowRight, Mic } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MUTED, NUM, Pill, TILE, Tip, WELL } from '@/features/dashboard/components/primitives';
import { ISSUE_LABELS, formatSeconds, markAnswer } from '../../utils/speakingReportInsights';
import { compactText } from '../../utils/speakingReportHelpers';
import RehearsalPanel from './RehearsalPanel';
import { QUIET_BUTTON } from './reportStyles';

function MarkedAnswer({ text, errors, flaggedWords }) {
  const segments = markAnswer(text, { errors, flaggedWords });
  return (
    <p className="text-[13.5px] leading-[1.7] text-slate-800 dark:text-slate-100">
      {segments.map((segment, index) => {
        if (segment.kind === 'error') {
          return (
            <span key={index}>
              <del className="decoration-[rgb(var(--signal-fault))] decoration-2 text-slate-500 dark:text-slate-400">
                {segment.text}
              </del>{' '}
              <ins className="rounded-[3px] bg-[rgb(var(--signal-ok)/0.12)] px-0.5 font-semibold text-[rgb(var(--signal-ok))] no-underline">
                {segment.error.correct}
              </ins>
            </span>
          );
        }
        if (segment.kind === 'word') {
          return (
            <Tip key={index} content={segment.flag.issue || 'This word was hard to recognise'}>
              <span
                tabIndex={0}
                className="cursor-help underline decoration-[rgb(var(--signal-warn))] decoration-dotted decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
              >
                {segment.text}
              </span>
            </Tip>
          );
        }
        return <React.Fragment key={index}>{segment.text}</React.Fragment>;
      })}
    </p>
  );
}

function lengthText(answer, basis) {
  return basis === 'time' && answer.durationMs != null
    ? `${formatSeconds(answer.durationMs)}, ${answer.words} words`
    : `${answer.words} words`;
}

const AnswerCard = forwardRef(function AnswerCard(
  {
    answer,
    basis,
    issues,
    flaggedWords,
    isGenerating,
    isActive,
    isRehearsing,
    saved,
    onRehearse,
    onCloseRehearsal,
    onSaveRehearsal,
  },
  ref
) {
  const feedback = answer.feedback;
  const errors = feedback?.grammaticalErrors || [];
  const why = compactText(feedback?.why || feedback?.feedback, { maxSentences: 2, maxChars: 260 });
  const drift =
    feedback?.topicDrift && feedback.topicDrift.trim().toLowerCase() !== 'null'
      ? compactText(feedback.topicDrift, { maxSentences: 2, maxChars: 240 })
      : '';
  const label = answer.isLongTurn ? 'Talk' : `Q${answer.number}`;
  const showStronger = Boolean(feedback?.suggestedAnswer) || isGenerating;

  return (
    <article
      ref={ref}
      id={`answer-${answer.id}`}
      tabIndex={-1}
      aria-labelledby={`answer-${answer.id}-question`}
      className={cn(
        'scroll-mt-4 border-t border-[#eceafa] px-4 py-4 first:border-t-0 outline-none transition-colors duration-500 dark:border-white/[0.07]',
        isActive && 'bg-[#5a63df]/[0.04] dark:bg-[#8f97ff]/[0.06]'
      )}
    >
      <header className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
        <span className="mt-0.5 shrink-0 text-[12px] font-bold text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <h3
          id={`answer-${answer.id}-question`}
          className="min-w-0 flex-1 basis-56 text-[14px] font-bold leading-snug text-slate-900 dark:text-white"
        >
          {answer.question || 'Question not saved'}
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn(NUM, 'text-[11.5px]', MUTED)}>{lengthText(answer, basis)}</span>
          {issues.slice(0, 3).map((issue) => (
            <Pill key={issue} tone={issue === 'too_short' ? 'warn' : 'neutral'}>
              {ISSUE_LABELS[issue]}
            </Pill>
          ))}
        </div>
      </header>

      <div className={cn('mt-3 grid gap-2.5', showStronger && 'lg:grid-cols-2')}>
        <section className={cn('rounded-lg p-3', WELL)} aria-label="What you said">
          <p className="mb-1 text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
            You said
          </p>
          <MarkedAnswer text={answer.text} errors={errors} flaggedWords={flaggedWords} />
        </section>

        {showStronger && (
          <section
            className={cn(TILE, 'relative overflow-hidden p-3 pl-3.5')}
            aria-label="A stronger answer"
          >
            <span
              className="absolute inset-y-0 left-0 w-[2px] bg-[#5a63df] dark:bg-[#8f97ff]"
              aria-hidden="true"
            />
            <p className="mb-1 text-[11.5px] font-bold text-[#5a63df] dark:text-[#afb5ff]">
              A stronger answer
            </p>
            {feedback?.suggestedAnswer ? (
              <p className="text-[13.5px] leading-[1.7] text-slate-800 dark:text-slate-100">
                {feedback.suggestedAnswer}
              </p>
            ) : (
              <div className="space-y-2 pt-1" role="status" aria-label="Writing a stronger answer">
                <div className={cn('h-2.5 w-11/12 animate-pulse rounded', WELL)} />
                <div className={cn('h-2.5 w-4/5 animate-pulse rounded', WELL)} />
                <div className={cn('h-2.5 w-2/3 animate-pulse rounded', WELL)} />
              </div>
            )}
          </section>
        )}
      </div>

      {why && (
        <p className="mt-2.5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
          <span className="font-bold text-slate-800 dark:text-slate-100">
            {feedback?.why ? 'Why it works: ' : 'Examiner note: '}
          </span>
          {why}
        </p>
      )}

      {drift && (
        <p className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-[rgb(var(--signal-warn))]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{drift}</span>
        </p>
      )}

      {errors.length > 0 && (
        <ul className="mt-2.5 space-y-1" aria-label="Corrections">
          {errors.map((error, index) => (
            <li
              key={index}
              className="text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300"
            >
              <span className="text-slate-500 line-through decoration-[rgb(var(--signal-fault))] dark:text-slate-400">
                {error.incorrect}
              </span>
              <ArrowRight className="mx-1 inline h-3 w-3 text-slate-400" aria-label="becomes" />
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {error.correct}
              </span>
              {error.explanation && (
                <span className={cn('ml-1.5', MUTED)}>{error.explanation}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {isRehearsing ? (
        <RehearsalPanel
          answer={answer}
          issues={issues}
          onSave={onSaveRehearsal}
          onClose={onCloseRehearsal}
        />
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" className={QUIET_BUTTON} onClick={onRehearse}>
            <Mic className="h-3.5 w-3.5" aria-hidden="true" />
            Answer it again
          </button>
          {saved && (
            <span className={cn('text-[12px]', MUTED)}>
              Last try:{' '}
              <span className={cn(NUM, 'font-bold text-slate-700 dark:text-slate-200')}>
                {formatSeconds(saved.seconds * 1000)}
              </span>
              , {saved.passed} of {saved.total} checks met
            </span>
          )}
        </div>
      )}
    </article>
  );
});

export default AnswerCard;

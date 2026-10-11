import React, { useRef } from 'react';
import { LoaderCircle, MessageSquareText, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Empty, MUTED, NUM, Panel, PanelTitle } from '@/features/dashboard/components/primitives';
import { answerIssues } from '../../utils/speakingReportInsights';
import { formatBandScore } from '../../utils/speakingReportSummary';
import AnswerCard from './AnswerCard';
import { FOCUS_RING, QUIET_BUTTON } from './reportStyles';

function FeedbackStatus({ isGenerating, hasFeedback, error, onRetry }) {
  if (hasFeedback) return null;
  if (isGenerating) {
    return (
      <p className={cn('flex items-center gap-2 px-4 pb-3 text-[12.5px]', MUTED)} role="status">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Writing a stronger version of each answer. This takes about 20 seconds.
      </p>
    );
  }
  return (
    <div className="mx-4 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-[#e4e2f0] px-3 py-2.5 dark:border-white/10">
      <p className="text-[12.5px] text-slate-600 dark:text-slate-300">
        {error
          ? 'Feedback on each answer could not be generated.'
          : 'Get a stronger version of each answer and corrections for your mistakes.'}
      </p>
      <button type="button" className={QUIET_BUTTON} onClick={onRetry}>
        {error ? (
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {error ? 'Try again' : 'Get answer feedback'}
      </button>
    </div>
  );
}

export default function AnswersSection({
  answers,
  basis,
  parts,
  activePart,
  onPartChange,
  activeId,
  rehearsingId,
  onRehearse,
  onCloseRehearsal,
  onSaveRehearsal,
  reanswers,
  flaggedWords,
  isGenerating,
  deepDiveError,
  onRetryDeepDive,
  canRequestFeedback,
}) {
  const tabRefs = useRef({});
  const partsWithAnswers = parts.map((part) => ({
    ...part,
    number: Number(part.key.replace('part', '')),
    count: answers.filter((answer) => answer.part === Number(part.key.replace('part', ''))).length,
  }));
  const current =
    partsWithAnswers.find((part) => part.number === activePart) || partsWithAnswers[0];
  const visible = answers.filter((answer) => answer.part === current.number);
  const hasFeedback = answers.some((answer) => answer.feedback);

  const onTabKeyDown = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const numbers = partsWithAnswers.map((part) => part.number);
    const index = numbers.indexOf(current.number);
    const next =
      event.key === 'Home'
        ? numbers[0]
        : event.key === 'End'
          ? numbers[numbers.length - 1]
          : numbers[
              (index + (event.key === 'ArrowRight' ? 1 : -1) + numbers.length) % numbers.length
            ];
    onPartChange(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <Panel className="overflow-hidden" aria-labelledby="speaking-answers-title">
      <div className="px-4 pt-4">
        <PanelTitle label={<span id="speaking-answers-title">Your answers</span>} accent />
        <div
          role="tablist"
          aria-label="Test parts"
          className="grid grid-cols-3 gap-1 rounded-lg bg-[#f4f3fb] p-1 dark:bg-white/[0.06]"
          onKeyDown={onTabKeyDown}
        >
          {partsWithAnswers.map((part) => {
            const selected = part.number === current.number;
            return (
              <button
                key={part.key}
                ref={(node) => {
                  tabRefs.current[part.number] = node;
                }}
                type="button"
                role="tab"
                id={`speaking-tab-${part.number}`}
                aria-selected={selected}
                aria-controls="speaking-answers-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => onPartChange(part.number)}
                className={cn(
                  'flex flex-col items-center rounded-md px-2 py-1.5 transition-[background-color,color] duration-150 sm:flex-row sm:justify-center sm:gap-2',
                  FOCUS_RING,
                  'focus-visible:ring-offset-0',
                  selected
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-white/12 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                )}
              >
                <span className="text-[12.5px] font-bold">Part {part.number}</span>
                <span className={cn(NUM, 'text-[11px] font-semibold opacity-80')}>
                  {part.band != null
                    ? `band ${formatBandScore(part.band)}`
                    : `${part.count} answers`}
                </span>
              </button>
            );
          })}
        </div>
        {current.observation && (
          <p className="mt-3 text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-800 dark:text-slate-100">
              {current.subtitle}:{' '}
            </span>
            {current.observation}
          </p>
        )}
      </div>

      <div className="mt-3">
        {canRequestFeedback && (
          <FeedbackStatus
            isGenerating={isGenerating}
            hasFeedback={hasFeedback}
            error={deepDiveError}
            onRetry={onRetryDeepDive}
          />
        )}
      </div>

      <div
        id="speaking-answers-panel"
        role="tabpanel"
        aria-labelledby={`speaking-tab-${current.number}`}
        className="border-t border-[#eceafa] dark:border-white/[0.07]"
      >
        {visible.length === 0 ? (
          <Empty
            icon={MessageSquareText}
            title={`No answers saved for Part ${current.number}`}
            message="Parts you skipped or that could not be transcribed don’t appear here."
          />
        ) : (
          visible.map((answer) => (
            <AnswerCard
              key={answer.id}
              answer={answer}
              basis={basis}
              issues={answerIssues(answer, basis)}
              flaggedWords={flaggedWords[answer.part] || []}
              isGenerating={isGenerating}
              isActive={activeId === answer.id}
              isRehearsing={rehearsingId === answer.id}
              saved={reanswers[answer.id]}
              onRehearse={() => onRehearse(answer.id)}
              onCloseRehearsal={onCloseRehearsal}
              onSaveRehearsal={(result) => onSaveRehearsal(answer.id, result)}
            />
          ))
        )}
      </div>
    </Panel>
  );
}

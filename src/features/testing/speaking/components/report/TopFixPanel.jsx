import React from 'react';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MUTED, NUM, Panel, Pill, TILE, WELL } from '@/features/dashboard/components/primitives';
import { CRITERION_LABELS } from '../../utils/speakingReportInsights';
import { PRIMARY_BUTTON, TEXT_BUTTON } from './reportStyles';

function answerReference(answer) {
  if (answer.isLongTurn) return 'Part 2 talk';
  return `Part ${answer.part}, question ${answer.number}`;
}

export default function TopFixPanel({ fix, onRehearse, onShowAnswer }) {
  if (!fix) {
    return (
      <Panel className="h-full justify-center p-5">
        <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
          Your next step appears here once your answers have been analysed.
        </p>
      </Panel>
    );
  }

  const answer = fix.answer;
  const stronger = answer?.feedback?.suggestedAnswer;

  return (
    <Panel
      className="relative h-full overflow-hidden p-4 sm:p-5"
      aria-labelledby="speaking-top-fix-title"
    >
      <span
        className="absolute inset-y-0 left-0 w-[3px] bg-[#5a63df] dark:bg-[#8f97ff]"
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[12px] font-bold text-[#5a63df] dark:text-[#afb5ff]">Your next step</p>
        {CRITERION_LABELS[fix.criterion] && (
          <Pill tone="neutral">{CRITERION_LABELS[fix.criterion]}</Pill>
        )}
      </div>

      <h2
        id="speaking-top-fix-title"
        className="mt-2 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-slate-900 dark:text-white sm:text-[26px]"
      >
        {fix.title}
      </h2>
      <p className="mt-2 max-w-[64ch] text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-300">
        {fix.body}
      </p>
      {fix.evidence && (
        <p className={cn('mt-2 text-[12px] font-semibold', MUTED)}>{fix.evidence}</p>
      )}

      {answer && (
        <div className="mt-4">
          <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
            {answerReference(answer)}
            {answer.question && (
              <span className="block text-[13px] text-slate-800 dark:text-slate-100">
                {answer.question}
              </span>
            )}
          </p>
          <div className={cn('mt-2 grid gap-2', stronger && 'md:grid-cols-2')}>
            <figure className={cn('rounded-lg p-3', WELL)}>
              <figcaption className="flex items-center justify-between gap-2 text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                You said
                <span className={cn(NUM, 'font-semibold')}>{answer.words} words</span>
              </figcaption>
              <blockquote className="mt-1 line-clamp-4 text-[13px] leading-relaxed text-slate-800 dark:text-slate-100">
                {answer.text}
              </blockquote>
            </figure>
            {stronger && (
              <figure className={cn(TILE, 'p-3')}>
                <figcaption className="text-[11.5px] font-bold text-[#5a63df] dark:text-[#afb5ff]">
                  A stronger answer
                </figcaption>
                <blockquote className="mt-1 line-clamp-4 text-[13px] leading-relaxed text-slate-800 dark:text-slate-100">
                  {stronger}
                </blockquote>
              </figure>
            )}
          </div>
        </div>
      )}

      {answer && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className={PRIMARY_BUTTON} onClick={() => onRehearse(answer.id)}>
            <Mic className="h-3.5 w-3.5" aria-hidden="true" />
            Answer it again
          </button>
          <button type="button" className={TEXT_BUTTON} onClick={() => onShowAnswer(answer.id)}>
            See full feedback for this answer
          </button>
        </div>
      )}
    </Panel>
  );
}

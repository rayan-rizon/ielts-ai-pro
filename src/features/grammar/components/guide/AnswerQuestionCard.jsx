import React from 'react';
import { Check, CheckCircle2, CircleAlert, Eye, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';
import { isSuccess } from './practiceCheck';
import { renderInline } from './renderInline';

function QuestionChoices({ item, locked, response, onChoose }) {
  return (
    <div
      role="radiogroup"
      aria-label={`Choices for question ${item.number}`}
      className="mt-2.5 flex flex-wrap gap-2"
    >
      {item.options.map((option) => {
        const selected = response === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={locked}
            onClick={() => onChoose(item.number, option)}
            className={cn(
              'min-h-9 rounded-lg border px-3.5 py-1.5 text-sm font-bold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
              selected
                ? 'border-[#5a63df] bg-[#5a63df] text-white'
                : 'border-[#e2e5f2] bg-white text-slate-700 hover:border-[#5a63df]/40 hover:bg-[#5a63df]/5 dark:border-white/10 dark:bg-white/5 dark:text-slate-200',
              locked && !selected && 'opacity-60'
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function TypedAnswer({ item, draft, long, nudge, onDraft, onCheck, onReveal }) {
  const label = `Your answer to question ${item.number}`;
  const shared = {
    id: `practice-answer-${item.number}`,
    'aria-label': label,
    value: draft,
    onChange: (event) => onDraft(item.number, event.target.value),
    placeholder: long ? 'Write your version here…' : 'Type your answer…',
    className:
      'rounded-lg border-[#e2e5f2] bg-[#fbfbfe] text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-white/[0.03] dark:text-white',
  };
  return (
    <div className="mt-2.5">
      {long ? (
        <Textarea {...shared} rows={4} />
      ) : (
        <Input
          {...shared}
          className={cn(shared.className, 'h-10')}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onCheck(item.number);
            }
          }}
        />
      )}
      {nudge && (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
          {nudge}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => onCheck(item.number)}
          disabled={!String(draft || '').trim()}
          className="h-8 rounded-lg bg-[#5a63df] px-3 text-xs font-extrabold text-white hover:bg-[#4a52c9]"
        >
          Check answer
        </Button>
        <button
          type="button"
          onClick={() => onReveal(item.number)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 transition hover:text-[#5a63df] dark:text-slate-400"
        >
          <Eye className="h-3.5 w-3.5" /> Show the answer
        </button>
      </div>
    </div>
  );
}

function ModelAnswer({ item }) {
  return (
    <div className="mt-2 rounded-lg bg-white/70 px-3 py-2 dark:bg-white/5">
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Model answer
      </div>
      <p className="mt-0.5 text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">
        {renderInline(item.answer, `answer-${item.number}`)}
      </p>
    </div>
  );
}

function ResultPanel({ item, result, onSelfMark, onRetry }) {
  const { status, response } = result;

  if (isSuccess(result)) {
    return (
      <div
        role="status"
        className="mt-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/70 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10"
      >
        <div className="flex items-center gap-1.5 text-sm font-extrabold text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          {status === 'got' ? 'Marked as correct' : 'Correct'}
        </div>
        <ModelAnswer item={item} />
      </div>
    );
  }

  const heading =
    status === 'incorrect'
      ? 'Not quite'
      : status === 'compare'
        ? 'Compare with the model'
        : status === 'revealed'
          ? 'Here is the answer'
          : 'Marked for review';

  return (
    <div
      role="status"
      className="mt-2.5 rounded-lg border border-amber-200/80 bg-amber-50/70 p-3 dark:border-amber-500/20 dark:bg-amber-500/10"
    >
      <div className="flex items-center gap-1.5 text-sm font-extrabold text-amber-900 dark:text-amber-200">
        <CircleAlert className="h-4 w-4" />
        {heading}
      </div>
      {response && status !== 'revealed' && (
        <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Your answer: <span className="font-bold text-slate-900 dark:text-white">{response}</span>
        </p>
      )}
      <ModelAnswer item={item} />
      {status === 'compare' && (
        <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
          More than one sentence can be correct. If yours is accurate and keeps the meaning, mark it
          as correct.
        </p>
      )}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {status === 'compare' && (
          <>
            <Button
              type="button"
              size="sm"
              onClick={() => onSelfMark(item.number, true)}
              className="h-8 rounded-lg bg-emerald-600 px-3 text-xs font-extrabold text-white hover:bg-emerald-700"
            >
              <Check className="mr-1 h-3.5 w-3.5" /> Mine is also correct
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onSelfMark(item.number, false)}
              className="h-8 rounded-lg px-3 text-xs font-extrabold"
            >
              I need to review this
            </Button>
          </>
        )}
        <button
          type="button"
          onClick={() => onRetry(item.number)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-[#5a63df] transition hover:underline dark:text-indigo-300"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Try again
        </button>
      </div>
    </div>
  );
}

export function AnswerQuestionCard({
  item,
  draft,
  nudge,
  result,
  long,
  onDraft,
  onCheck,
  onChoose,
  onReveal,
  onSelfMark,
  onRetry,
}) {
  const checked = Boolean(result);
  const hasOptions = Boolean(item.options?.length);

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors duration-150',
        isSuccess(result)
          ? 'border-emerald-200/80 bg-emerald-50/20 dark:border-emerald-500/20 dark:bg-emerald-950/10'
          : 'border-[#e2e5f2] bg-white dark:border-white/10 dark:bg-[#121118]'
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-5 w-6 shrink-0 items-center justify-center rounded-md border border-[#e2e5f2] bg-[#f8f9fe] text-[10px] font-black text-[#5a63df] dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
          {String(item.number).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          {item.question ? (
            <div className="text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">
              {renderInline(item.question, `q-${item.number}`)}
            </div>
          ) : (
            <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
              Question {item.number}
            </div>
          )}

          {hasOptions && (
            <QuestionChoices
              item={item}
              locked={checked}
              response={result?.response ?? draft}
              onChoose={onChoose}
            />
          )}
          {!hasOptions && !checked && (
            <TypedAnswer
              item={item}
              draft={draft ?? ''}
              long={long}
              nudge={nudge}
              onDraft={onDraft}
              onCheck={onCheck}
              onReveal={onReveal}
            />
          )}
          {checked && (
            <ResultPanel item={item} result={result} onSelfMark={onSelfMark} onRetry={onRetry} />
          )}
        </div>
      </div>
    </div>
  );
}

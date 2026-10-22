import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { answerItems, answerNotes, matchesChoice } from './grammarGuideParser';
import {
  checkTypedAnswer,
  isLongAnswer,
  isSuccess,
  shouldPrefill,
  stripMarkdown,
} from './practiceCheck';
import { renderInline } from './renderInline';
import { AnswerQuestionCard } from './AnswerQuestionCard';
import { GuideBlock } from './GuideBlock';

const STORAGE_PREFIX = 'grammar-guide-practice:v1:';
const STATUSES = new Set(['correct', 'incorrect', 'compare', 'got', 'review', 'revealed']);

// Saved on this device only, so a learner who leaves mid-exercise can pick up again.
function readSaved(storageKey, items) {
  if (!storageKey) return {};
  try {
    const raw = JSON.parse(window.localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`) || '{}');
    const numbers = new Set(items.map((item) => item.number));
    return Object.fromEntries(
      Object.entries(raw).filter(
        ([number, value]) => numbers.has(Number(number)) && STATUSES.has(value?.status)
      )
    );
  } catch {
    return {};
  }
}

function writeSaved(storageKey, results) {
  if (!storageKey) return;
  try {
    const key = `${STORAGE_PREFIX}${storageKey}`;
    if (Object.keys(results).length) window.localStorage.setItem(key, JSON.stringify(results));
    else window.localStorage.removeItem(key);
  } catch {
    // Private windows and blocked storage simply do not remember progress.
  }
}

function InteractiveHeader({
  title,
  checkedCount,
  totalCount,
  successCount,
  hasUnchecked,
  onShowAll,
  onReset,
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2.5 border-b border-[#eceafa]/60 pb-3 dark:border-white/10">
      <div>
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#5a63df] dark:text-indigo-300">
          <Sparkles className="h-3 w-3" />
          {title || 'Practice exercise'}
        </div>
        <h2 className="mt-0.5 text-base font-extrabold text-slate-900 dark:text-white">
          Check your practice
        </h2>
        <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          Try each item yourself first, check it, then compare with the model answer.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          aria-live="polite"
          className="rounded-full bg-[#f0effe] px-2.5 py-0.5 text-[11px] font-black text-[#5a63df] dark:bg-indigo-500/20 dark:text-indigo-200"
        >
          {checkedCount}/{totalCount} checked
          {checkedCount > 0 && ` · ${successCount} correct`}
        </span>
        {hasUnchecked && (
          <button
            type="button"
            onClick={onShowAll}
            className="rounded-lg border border-[#e2e5f2] bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            Show all answers
          </button>
        )}
        {checkedCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-lg border border-[#e2e5f2] bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <RotateCcw className="h-3 w-3" /> Start over
          </button>
        )}
      </div>
    </div>
  );
}

function PracticeInstructionBanner({ prompt }) {
  if (!prompt) return null;

  return (
    <div className="mt-3 rounded-lg border border-[#5a63df]/20 bg-[#5a63df]/[0.04] px-3 py-2 text-xs dark:border-indigo-400/20 dark:bg-indigo-500/[0.06]">
      <span className="font-extrabold text-[#5a63df] dark:text-indigo-300">Instruction: </span>
      <span className="font-bold text-slate-800 dark:text-slate-200">
        {renderInline(prompt, 'practice-prompt')}
      </span>
    </div>
  );
}

function CompletionBanner({ totalCount, successCount, onRetryMissed }) {
  const missed = totalCount - successCount;
  return (
    <div
      role="status"
      className={cn(
        'mt-3 rounded-lg px-3 py-2.5 text-xs font-bold',
        missed === 0
          ? 'bg-emerald-100/80 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-100'
          : 'bg-amber-100/80 text-amber-950 dark:bg-amber-400/15 dark:text-amber-100'
      )}
    >
      {missed === 0 ? (
        <>All {totalCount} correct. You are ready for a practice set.</>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            {successCount} of {totalCount} correct. Re-read the lesson above, then try the other
            {missed === 1 ? '' : 's'} again.
          </span>
          <button
            type="button"
            onClick={onRetryMissed}
            className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-extrabold text-amber-900 transition hover:bg-amber-50 dark:border-amber-400/30 dark:bg-white/5 dark:text-amber-100"
          >
            <RotateCcw className="h-3 w-3" /> Try {missed === 1 ? 'it' : 'them'} again
          </button>
        </div>
      )}
    </div>
  );
}

export function InteractiveAnswerCheck({ section, storageKey }) {
  const items = useMemo(() => answerItems(section), [section]);
  const notes = useMemo(() => answerNotes(section), [section]);
  const prompt = section.practiceContext?.prompt || '';

  const initialDraft = useCallback(
    (item) => (shouldPrefill(item, prompt) ? stripMarkdown(item.question) : ''),
    [prompt]
  );
  const [results, setResults] = useState(() => readSaved(storageKey, items));
  const [nudges, setNudges] = useState({});
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(items.map((item) => [item.number, initialDraft(item)]))
  );

  useEffect(() => {
    writeSaved(storageKey, results);
  }, [storageKey, results]);

  const find = (number) => items.find((item) => item.number === number);
  const setResult = (number, value) => setResults((current) => ({ ...current, [number]: value }));
  const clearResults = (numbers) =>
    setResults((current) => {
      const next = { ...current };
      numbers.forEach((number) => delete next[number]);
      return next;
    });

  const handleDraft = (number, value) => {
    setDrafts((current) => ({ ...current, [number]: value }));
    setNudges((current) => (current[number] ? { ...current, [number]: '' } : current));
  };

  const handleCheck = (number) => {
    const item = find(number);
    const typed = String(drafts[number] || '').trim();
    if (!item || !typed) return;
    if (initialDraft(item) && typed === initialDraft(item)) {
      setNudges((current) => ({
        ...current,
        [number]: 'This is still the original sentence. Edit it to fix the error, then check.',
      }));
      return;
    }
    const verdict = checkTypedAnswer(typed, item.answer);
    setResult(number, { status: verdict === 'match' ? 'correct' : 'compare', response: typed });
  };

  const handleChoose = (number, option) => {
    const item = find(number);
    if (!item || results[number]) return;
    setResult(number, {
      status: matchesChoice(option, item.answer) ? 'correct' : 'incorrect',
      response: option,
    });
  };

  const handleReveal = (number) => setResult(number, { status: 'revealed', response: '' });

  const handleSelfMark = (number, isCorrect) =>
    setResult(number, { ...results[number], status: isCorrect ? 'got' : 'review' });

  const handleRetry = (number) => {
    const item = find(number);
    clearResults([number]);
    if (item) handleDraft(number, initialDraft(item));
  };

  const handleShowAll = () =>
    items.forEach((item) => {
      if (!results[item.number]) handleReveal(item.number);
    });

  const handleReset = () => {
    setResults({});
    setDrafts(Object.fromEntries(items.map((item) => [item.number, initialDraft(item)])));
  };

  const handleRetryMissed = () => {
    const missed = items.filter((item) => !isSuccess(results[item.number]));
    clearResults(missed.map((item) => item.number));
    setDrafts((current) => ({
      ...current,
      ...Object.fromEntries(missed.map((item) => [item.number, initialDraft(item)])),
    }));
  };

  const checkedCount = items.filter((item) => results[item.number]).length;
  const successCount = items.filter((item) => isSuccess(results[item.number])).length;
  const allChecked = items.length > 0 && checkedCount === items.length;

  return (
    <div
      id={section.practiceContext?.id || undefined}
      className="scroll-mt-24 rounded-xl border border-[#e4e2f0] bg-linear-to-br from-white to-[#faf9ff] p-3.5 sm:p-5 dark:border-white/10 dark:from-[#141319] dark:to-[#100f15]"
    >
      <InteractiveHeader
        title={section.practiceContext?.title}
        checkedCount={checkedCount}
        totalCount={items.length}
        successCount={successCount}
        hasUnchecked={checkedCount < items.length}
        onShowAll={handleShowAll}
        onReset={handleReset}
      />

      <PracticeInstructionBanner prompt={prompt} />

      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <AnswerQuestionCard
            key={item.number}
            item={item}
            draft={drafts[item.number]}
            nudge={nudges[item.number]}
            result={results[item.number]}
            long={isLongAnswer(item)}
            onDraft={handleDraft}
            onCheck={handleCheck}
            onChoose={handleChoose}
            onReveal={handleReveal}
            onSelfMark={handleSelfMark}
            onRetry={handleRetry}
          />
        ))}
      </div>

      {allChecked && (
        <>
          <CompletionBanner
            totalCount={items.length}
            successCount={successCount}
            onRetryMissed={handleRetryMissed}
          />
          {notes.length > 0 && (
            <div className="mt-3 space-y-2 rounded-lg border border-[#e2e5f2] bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              {notes.map((block, index) => (
                <GuideBlock key={`note-${index}`} block={block} index={index} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { answerItems } from './grammarGuideParser';
import { renderInline } from './renderInline';
import { AnswerQuestionCard } from './AnswerQuestionCard';

function InteractiveHeader({
  title,
  prompt,
  checkedCount,
  totalCount,
  allRevealed,
  onRevealAll,
  onReset,
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2.5 border-b border-[#eceafa]/60 pb-3 dark:border-white/10">
      <div>
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#5a63df] dark:text-indigo-300">
          <Sparkles className="h-3 w-3" />
          {title || 'Practice Exercise'}
        </div>
        <h2 className="mt-0.5 text-base font-extrabold text-slate-900 dark:text-white">
          Check your practice
        </h2>
        <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          {prompt
            ? 'Work through each sentence, test yourself, and compare with the suggested answer.'
            : 'Try every item first. Reveal the model only when you are ready to compare.'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-full bg-[#f0effe] px-2.5 py-0.5 text-[11px] font-black text-[#5a63df] dark:bg-indigo-500/20 dark:text-indigo-200">
          {checkedCount}/{totalCount} reviewed
        </span>
        {!allRevealed ? (
          <button
            type="button"
            onClick={onRevealAll}
            className="rounded-lg border border-[#e2e5f2] bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            Reveal all
          </button>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-lg border border-[#e2e5f2] bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <RotateCcw className="h-3 w-3" /> Reset
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

function ReviewCompletionBanner({ totalCount, confidentCount }) {
  const reviewCount = totalCount - confidentCount;
  const isMastered = confidentCount === totalCount;

  return (
    <div className="mt-3 rounded-lg bg-emerald-100/80 px-3 py-2 text-xs font-bold text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-100">
      {isMastered
        ? '✓ Strong check! All items mastered. Ready for IELTS practice.'
        : `Completed! ${reviewCount} item${reviewCount === 1 ? '' : 's'} marked for review.`}
    </div>
  );
}

export function InteractiveAnswerCheck({ section }) {
  const items = answerItems(section);
  const [revealed, setRevealed] = useState(() => new Set());
  const [checked, setChecked] = useState(() => new Set());
  const [confident, setConfident] = useState(() => new Set());
  const [selectedAnswers, setSelectedAnswers] = useState(() => ({}));

  const reveal = (number) => {
    setRevealed((current) => new Set(current).add(number));
  };

  const revealAll = () => {
    setRevealed(new Set(items.map((it) => it.number)));
  };

  const selfMark = (number, isConfident) => {
    setChecked((current) => new Set(current).add(number));
    setConfident((current) => {
      const next = new Set(current);
      if (isConfident) next.add(number);
      else next.delete(number);
      return next;
    });
  };

  const selectOption = (number, opt) => {
    setSelectedAnswers((current) => ({ ...current, [number]: opt }));
  };

  const reset = () => {
    setRevealed(new Set());
    setChecked(new Set());
    setConfident(new Set());
    setSelectedAnswers({});
  };

  const allReviewed = checked.size === items.length && items.length > 0;

  return (
    <div
      id={section.practiceContext?.id || undefined}
      className="scroll-mt-24 rounded-xl border border-[#e4e2f0] bg-linear-to-br from-white to-[#faf9ff] p-3.5 sm:p-5 dark:border-white/10 dark:from-[#141319] dark:to-[#100f15]"
    >
      <InteractiveHeader
        title={section.practiceContext?.title}
        prompt={section.practiceContext?.prompt}
        checkedCount={checked.size}
        totalCount={items.length}
        allRevealed={revealed.size >= items.length}
        onRevealAll={revealAll}
        onReset={reset}
      />

      <PracticeInstructionBanner prompt={section.practiceContext?.prompt} />

      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <AnswerQuestionCard
            key={item.number}
            item={item}
            isRevealed={revealed.has(item.number)}
            isChecked={checked.has(item.number)}
            isConfident={confident.has(item.number)}
            userChoice={selectedAnswers[item.number]}
            onReveal={reveal}
            onSelectOption={selectOption}
            onSelfMark={selfMark}
          />
        ))}
      </div>

      {allReviewed && (
        <ReviewCompletionBanner totalCount={items.length} confidentCount={confident.size} />
      )}
    </div>
  );
}

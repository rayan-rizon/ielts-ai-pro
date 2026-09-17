import React from 'react';
import { Check, Eye } from 'lucide-react';
import { cn } from '@/lib/cn';
import { renderInline } from './renderInline';
import { matchesChoice } from './grammarGuideParser';

function QuestionChoices({ itemNumber, options, userChoice, onSelectOption }) {
  if (!options || options.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">
        Choice:
      </span>
      {options.map((opt) => {
        const isSelected = userChoice === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelectOption(itemNumber, opt)}
            className={cn(
              'rounded-md px-2 py-0.5 text-[11px] font-bold transition-all duration-150 active:scale-95',
              isSelected
                ? 'bg-[#5a63df] text-white shadow-2xs ring-1 ring-[#5a63df]'
                : 'border border-[#e2e5f2] bg-slate-50/80 text-slate-700 hover:border-[#5a63df]/40 hover:bg-[#5a63df]/5 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ChoiceFeedbackBadge({ userChoice, answer }) {
  if (!userChoice) return null;
  const isMatch = matchesChoice(userChoice, answer);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black',
        isMatch
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200'
          : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300'
      )}
    >
      {isMatch ? (
        <>
          <Check className="h-3 w-3" strokeWidth={3} /> Matches your choice!
        </>
      ) : (
        `You chose: ${userChoice}`
      )}
    </span>
  );
}

function RevealedAnswerSection({ item, isChecked, isConfident, userChoice, onSelfMark }) {
  return (
    <div className="mt-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-2.5 dark:border-emerald-500/20 dark:bg-emerald-950/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
          Suggested answer {item.number}
        </span>
        <ChoiceFeedbackBadge userChoice={userChoice} answer={item.answer} />
      </div>

      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
        {renderInline(item.answer, `answer-${item.number}`)}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-emerald-200/50 pt-2 dark:border-emerald-500/20">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          Self-assessment:
        </span>
        <button
          type="button"
          aria-pressed={isChecked && isConfident}
          onClick={() => onSelfMark(item.number, true)}
          className={cn(
            'rounded-md border px-2.5 py-0.5 text-[10px] font-extrabold transition',
            isChecked && isConfident
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-emerald-200 bg-white text-emerald-800 hover:border-emerald-400 dark:border-emerald-400/20 dark:bg-white/5 dark:text-emerald-200'
          )}
        >
          I got this
        </button>
        <button
          type="button"
          aria-pressed={isChecked && !isConfident}
          onClick={() => onSelfMark(item.number, false)}
          className={cn(
            'rounded-md border px-2.5 py-0.5 text-[10px] font-extrabold transition',
            isChecked && !isConfident
              ? 'border-amber-500 bg-amber-500 text-white'
              : 'border-amber-200 bg-white text-amber-800 hover:border-amber-400 dark:border-amber-400/20 dark:bg-white/5 dark:text-amber-200'
          )}
        >
          Review again
        </button>
      </div>
    </div>
  );
}

export function AnswerQuestionCard({
  item,
  isRevealed,
  isChecked,
  isConfident,
  userChoice,
  onReveal,
  onSelectOption,
  onSelfMark,
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-all duration-150',
        isChecked
          ? 'border-emerald-200/80 bg-emerald-50/20 dark:border-emerald-500/20 dark:bg-emerald-950/10'
          : 'border-[#e2e5f2] bg-white dark:border-white/10 dark:bg-[#121118]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
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

            <QuestionChoices
              itemNumber={item.number}
              options={item.options}
              userChoice={userChoice}
              onSelectOption={onSelectOption}
            />
          </div>
        </div>

        {!isRevealed && (
          <button
            type="button"
            aria-label={`Compare answer for question ${item.number}`}
            onClick={() => onReveal(item.number)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#e2e5f2] bg-white px-2.5 py-1 text-xs font-extrabold text-[#5a63df] shadow-2xs transition hover:border-[#5a63df]/40 hover:bg-[#5a63df]/5 active:scale-[0.99] dark:border-white/10 dark:bg-white/5 dark:text-indigo-300"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Compare answer</span>
          </button>
        )}
      </div>

      {isRevealed && (
        <RevealedAnswerSection
          item={item}
          isChecked={isChecked}
          isConfident={isConfident}
          userChoice={userChoice}
          onSelfMark={onSelfMark}
        />
      )}
    </div>
  );
}

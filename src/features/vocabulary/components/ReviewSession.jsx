import React, { useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Brain, Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, MUTED, PANEL, Pill, TILE } from '@/features/dashboard/components/primitives';
import { buildCloze, checkClozeAnswer, getItemTranslation } from '../utils/vocabCard';
import { getPartOfSpeech } from './vocabularyUtils';

const RATINGS = [
  { val: 1, icon: '😫', label: 'Forgot', tone: 'rose' },
  { val: 3, icon: '😐', label: 'Hard', tone: 'amber' },
  { val: 4, icon: '🙂', label: 'Good', tone: 'accent' },
  { val: 5, icon: '🤩', label: 'Easy', tone: 'emerald' },
];

const RATING_HOVER = {
  rose: 'hover:border-rose-400/50 hover:bg-rose-500/5',
  amber: 'hover:border-amber-400/50 hover:bg-amber-500/5',
  accent: 'hover:border-[#5a63df]/50 hover:bg-[#5a63df]/5',
  emerald: 'hover:border-emerald-400/50 hover:bg-emerald-500/5',
};

const RATING_TEXT = {
  rose: 'text-rose-600 dark:text-rose-400',
  amber: 'text-amber-600 dark:text-amber-400',
  accent: 'text-[#5a63df] dark:text-indigo-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
};

// The rating a typed answer points to. The learner can still choose any rating.
const SUGGESTED_RATING = { correct: 4, wrong: 1 };

/** Fill-the-gap front: type the word that completes the learner's own example. */
function ClozeFront({ cloze, onCheck, onSkip }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (event) => {
    event.preventDefault();
    if (!value.trim()) return;
    onCheck({ correct: checkClozeAnswer(value, cloze), typed: value.trim() });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-1 flex-col items-center justify-center space-y-6 text-center"
    >
      <div className="space-y-1.5">
        <Pill tone="accent">Fill the gap</Pill>
        <p className={cn('text-[11px] font-bold uppercase tracking-widest', MUTED)}>
          Type the missing word
        </p>
      </div>
      <p className="max-w-xl text-xl font-bold leading-relaxed tracking-tight text-slate-900 dark:text-white md:text-2xl">
        {cloze.prompt}
      </p>
      <div className="flex w-full max-w-sm items-center gap-2">
        <label htmlFor="cloze-answer" className="sr-only">
          Missing word
        </label>
        <input
          id="cloze-answer"
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="h-11 min-w-0 flex-1 rounded-lg border border-[#e2e5f2] bg-white px-3 text-center text-sm font-semibold text-slate-900 outline-none focus:border-[#5a63df] dark:border-white/10 dark:bg-white/5 dark:text-white"
          placeholder="Your answer"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="h-11 shrink-0 rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white transition-all hover:bg-[#4a52c9] disabled:opacity-50"
        >
          Check
        </button>
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="text-[11px] font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-[#5a63df]"
      >
        Show the meaning instead
      </button>
    </form>
  );
}

export default function ReviewSession({
  isOpen,
  onOpenChange,
  currentItem,
  isFlipped,
  onFlip,
  onSubmit,
  language = 'en',
}) {
  const [answer, setAnswer] = useState(null); // { correct, typed } once a gap is checked
  const itemId = currentItem?.id;

  // Each word starts with a fresh answer.
  useEffect(() => {
    setAnswer(null);
  }, [itemId]);

  if (!currentItem) return null;

  const cloze = buildCloze(currentItem);
  const translation = getItemTranslation(currentItem, language);
  const suggested = answer ? SUGGESTED_RATING[answer.correct ? 'correct' : 'wrong'] : null;
  const pos = getPartOfSpeech(currentItem);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-visible border-none bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">Review Session</DialogTitle>
        <div className="flex w-full flex-col items-center">
          <div className="relative h-[440px] w-full">
            <AnimatePresence mode="wait" initial={false}>
              {!isFlipped && cloze ? (
                <m.div
                  key="cloze"
                  initial={{ rotateY: 90, opacity: 0, scale: 0.95 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  exit={{ rotateY: -90, opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 120 }}
                  className={cn(PANEL, 'absolute inset-0 flex flex-col items-center p-10')}
                >
                  <ClozeFront
                    cloze={cloze}
                    onCheck={(result) => {
                      setAnswer(result);
                      onFlip();
                    }}
                    onSkip={onFlip}
                  />
                </m.div>
              ) : !isFlipped ? (
                <m.button
                  key="front"
                  type="button"
                  aria-label={`Reveal definition of ${currentItem.word}`}
                  initial={{ rotateY: 90, opacity: 0, scale: 0.95 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  exit={{ rotateY: -90, opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 120 }}
                  className={cn(
                    PANEL,
                    'group absolute inset-0 flex cursor-pointer flex-col items-center justify-center overflow-hidden p-10 text-inherit focus-visible:outline-2 focus-visible:outline-[#5a63df]'
                  )}
                  onClick={onFlip}
                >
                  <div className="flex flex-1 flex-col items-center justify-center space-y-6 text-center">
                    <div className="space-y-1.5">
                      <Pill tone="accent">Recall challenge</Pill>
                      <p className={cn('text-[11px] font-bold uppercase tracking-widest', MUTED)}>
                        Identify the concept
                      </p>
                    </div>

                    <h2 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white md:text-6xl">
                      {currentItem.word}
                    </h2>

                    {(currentItem.example || currentItem.example_sentence) && (
                      <div className={cn(TILE, 'max-w-md p-4')}>
                        <p className="text-center text-sm font-medium italic leading-relaxed text-slate-600 dark:text-slate-300">
                          &quot;{currentItem.example || currentItem.example_sentence}&quot;
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-[#5a63df] dark:text-slate-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5a63df]" />
                    Click or press Enter to reveal
                  </div>
                </m.button>
              ) : (
                <m.div
                  key="back"
                  initial={{ rotateY: 90, opacity: 0, scale: 0.95 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  exit={{ rotateY: -90, opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 120 }}
                  className={cn(
                    PANEL,
                    'absolute inset-0 flex flex-col justify-between overflow-hidden p-8'
                  )}
                >
                  <div className="flex w-full items-center justify-between border-b border-[#eeedf7] pb-4 dark:border-white/[0.07]">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Definition
                      </span>
                      <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {currentItem.word}
                      </span>
                    </div>
                    <IconChip icon={Brain} tone="accent" size="lg" />
                  </div>

                  <div className="flex flex-1 flex-col items-center justify-center gap-3 p-2 text-center">
                    {answer && (
                      <p
                        role="status"
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                          answer.correct
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        )}
                      >
                        {answer.correct ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                        {answer.correct
                          ? `Correct: ${cloze?.answer}`
                          : `Not quite. The answer is ${cloze?.answer}`}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {currentItem.ipa && (
                        <span className="font-sans text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {currentItem.ipa}
                        </span>
                      )}
                      {pos !== 'word' && <Pill>{pos}</Pill>}
                      {currentItem.level && <Pill tone="accent">{currentItem.level}</Pill>}
                    </div>
                    <p className="text-xl font-bold leading-relaxed tracking-tight text-slate-800 dark:text-slate-200 md:text-2xl">
                      {currentItem.definition}
                    </p>
                    {translation && (
                      <p
                        lang={language}
                        className="max-w-lg text-base font-semibold leading-relaxed text-[#5a63df] dark:text-[#afb5ff]"
                      >
                        {translation.word ? `${translation.word} · ` : ''}
                        {translation.meaning}
                      </p>
                    )}
                    {(currentItem.example || currentItem.example_sentence) && !cloze && (
                      <p className="max-w-lg text-sm italic text-slate-500 dark:text-slate-400">
                        &quot;{currentItem.example || currentItem.example_sentence}&quot;
                      </p>
                    )}
                  </div>

                  <div className="w-full">
                    <p
                      className={cn(
                        'mb-3 text-center text-[10px] font-bold uppercase tracking-widest',
                        MUTED
                      )}
                    >
                      How well did you know this?
                    </p>
                    <div className="grid grid-cols-4 gap-2.5">
                      {RATINGS.map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => onSubmit(item.val)}
                          aria-label={`${item.label}${suggested === item.val ? ' (suggested)' : ''}`}
                          className={cn(
                            TILE,
                            'group flex h-auto flex-col items-center py-3.5 transition-all duration-200',
                            RATING_HOVER[item.tone],
                            suggested === item.val && 'ring-2 ring-[#5a63df]/50'
                          )}
                        >
                          <span className="mb-1.5 text-2xl transition-transform duration-300 group-hover:scale-110">
                            {item.icon}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-widest',
                              RATING_TEXT[item.tone]
                            )}
                          >
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

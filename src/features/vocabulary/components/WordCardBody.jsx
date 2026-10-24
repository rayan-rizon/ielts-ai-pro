import React from 'react';
import { AlertTriangle, Languages, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, Pill } from '@/features/dashboard/components/primitives';

const LEVEL_TONE = { A2: 'ok', B1: 'ok', B2: 'accent', C1: 'warn', C2: 'warn' };

/** IPA, part of speech, level and register on one line. Renders nothing if all are empty. */
export function WordMetaRow({ ipa, partOfSpeech, level, register, className }) {
  if (!ipa && !partOfSpeech && !level && !register) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {ipa && (
        <span className="font-sans text-xs font-semibold text-slate-500 dark:text-slate-400">
          {ipa}
        </span>
      )}
      {partOfSpeech && partOfSpeech !== 'other' && (
        <Pill className="text-[8px]">{partOfSpeech}</Pill>
      )}
      {level && (
        <Pill tone={LEVEL_TONE[level] || 'neutral'} className="text-[8px]">
          {level}
        </Pill>
      )}
      {register && register !== 'neutral' && <Pill className="text-[8px]">{register}</Pill>}
    </div>
  );
}

const Chips = ({ label, items }) =>
  items?.length ? (
    <div className="space-y-1">
      <span className={cn(MICRO, 'text-slate-400')}>{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-md border border-[#e4e2f0] bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  ) : null;

/**
 * The body of a word card. `translation` is { label, word, meaning } or null;
 * `translationState` says what to show in its place while it is on the way.
 */
export function WordCardBody({
  meaning,
  translation = null,
  translationState = 'idle',
  translationLabel = '',
  examples = [],
  selectedExample = 0,
  onSelectExample,
  synonyms = [],
  collocations = [],
  wordFamily = [],
  commonMistake = '',
}) {
  const family = wordFamily.map((item) => (item.pos ? `${item.word} (${item.pos})` : item.word));
  return (
    <div className="space-y-3">
      <p className="text-[13px] font-medium leading-relaxed text-slate-900 dark:text-slate-100">
        {meaning}
      </p>

      {translation ? (
        <div className="space-y-1 rounded-lg border border-[#5a63df]/20 bg-[#5a63df]/[0.06] p-2.5 dark:border-[#8f97ff]/20 dark:bg-[#8f97ff]/[0.08]">
          <div className="flex items-center gap-1.5">
            <Languages className="h-3 w-3 text-[#5a63df] dark:text-[#afb5ff]" />
            <span className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>
              {translation.label}
            </span>
          </div>
          {translation.word && (
            <p
              lang={translation.lang}
              className="text-sm font-extrabold text-slate-900 dark:text-white"
            >
              {translation.word}
            </p>
          )}
          <p
            lang={translation.lang}
            className="text-[13px] font-medium leading-relaxed text-slate-700 dark:text-slate-200"
          >
            {translation.meaning}
          </p>
        </div>
      ) : translationState === 'loading' ? (
        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Loader2 className="h-3 w-3 animate-spin text-[#5a63df]" />
          Preparing {translationLabel} meaning…
        </p>
      ) : null}

      {examples.length > 0 && (
        <div className="space-y-1.5">
          <span className={cn(MICRO, 'text-slate-400')}>Example</span>
          {examples.map((example, index) => {
            const selectable = Boolean(onSelectExample) && examples.length > 1;
            const Tag = selectable ? 'button' : 'div';
            return (
              <Tag
                key={example}
                {...(selectable
                  ? {
                      type: 'button',
                      onClick: () => onSelectExample(index),
                      'aria-pressed': index === selectedExample,
                    }
                  : {})}
                className={cn(
                  'block w-full border-l-2 pl-2.5 text-left text-xs italic leading-relaxed text-slate-600 dark:text-slate-300',
                  index === selectedExample || !selectable
                    ? 'border-[#5a63df]/60'
                    : 'border-slate-200 opacity-70 hover:opacity-100 dark:border-white/10'
                )}
              >
                {example}
              </Tag>
            );
          })}
          {onSelectExample && examples.length > 1 && (
            <p className="text-[10px] text-slate-400">Tap an example to choose the one you save.</p>
          )}
        </div>
      )}

      <Chips label="Synonyms" items={synonyms} />
      <Chips label="Collocations" items={collocations} />
      <Chips label="Word family" items={family} />

      {commonMistake && (
        <p className="flex items-start gap-1.5 rounded-lg bg-amber-500/[0.08] px-2.5 py-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{commonMistake}</span>
        </p>
      )}
    </div>
  );
}

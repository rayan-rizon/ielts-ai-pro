import React, { useState } from 'react';
import { Check, LoaderCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { WELL } from '@/features/dashboard/components/primitives';
import { tidyServerCut } from '@/features/testing/writing/utils/feedbackFormatting';

// ─── Annotation State Hook ────────────────────────────────────────────────────

export function highlightPhrase(sentence, phrase) {
  if (!sentence || !phrase) return sentence;
  try {
    const escaped = String(phrase)
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!escaped) return sentence;
    const splitRegex = new RegExp(`(\\b${escaped}\\b)`, 'gi');
    const parts = sentence.split(splitRegex);
    if (parts.length <= 1) return sentence;

    const testRegex = new RegExp(`^${escaped}$`, 'i');
    return parts.map((part, i) => {
      if (testRegex.test(part)) {
        return (
          <strong
            key={i}
            className="font-bold text-[#5661e9] dark:text-indigo-400 underline decoration-[#5661e9]/35 underline-offset-2"
          >
            {part}
          </strong>
        );
      }
      return part;
    });
  } catch {
    return sentence;
  }
}

const vocabularyTermKey = (word) =>
  String(word || '')
    .trim()
    .toLocaleLowerCase();

const PREVIEW_LENGTH = 112;

/** Moves a cut to the nearest space, so the preview never starts or ends mid-word. */
function startAtWord(text, start) {
  const space = start > 0 ? text.indexOf(' ', start) : -1;
  return space >= 0 ? space + 1 : start;
}

function endAtWord(text, start, end) {
  const space = end < text.length ? text.lastIndexOf(' ', end) : -1;
  return space > start ? space : end;
}

const cutMark = (isCut) => (isCut ? '…' : '');

function vocabularySentencePreview(sentence, phrase) {
  const text = String(sentence || '').trim();
  if (text.length <= PREVIEW_LENGTH) return text;

  const at = text.toLocaleLowerCase().indexOf(String(phrase || '').toLocaleLowerCase());
  if (at < 0) return `${text.slice(0, PREVIEW_LENGTH - 1).trimEnd()}…`;

  const start = startAtWord(text, Math.max(0, at - 42));
  const end = endAtWord(text, start, Math.min(text.length, at + String(phrase).length + 48));
  return `${cutMark(start > 0)}${text.slice(start, end).trim()}${cutMark(end < text.length)}`;
}

function SourceSentence({ t, sentence, phrase }) {
  const [showFull, setShowFull] = useState(false);
  if (!sentence) return null;
  const preview = vocabularySentencePreview(sentence, phrase);
  return (
    <div className={cn(WELL, 'mt-2 rounded-lg px-2.5 py-2')}>
      <p
        dir="ltr"
        className="font-serif text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300"
      >
        “{highlightPhrase(showFull ? sentence : preview, phrase)}”
      </p>
      {preview !== sentence && (
        <button
          type="button"
          onClick={() => setShowFull((prev) => !prev)}
          aria-expanded={showFull}
          className="mt-1 rounded-sm text-[11.5px] font-semibold text-[#5a63df] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:text-indigo-300"
        >
          {t(showFull ? 'wlShowLess' : 'wlShowSentence')}
        </button>
      )}
    </div>
  );
}

const SAVE_STATES = {
  idle: { Icon: Plus, label: 'saveWord', iconClass: 'h-3 w-3 stroke-[2.5]' },
  saving: { Icon: LoaderCircle, label: 'wlSaving', iconClass: 'h-3 w-3 animate-spin' },
  saved: { Icon: Check, label: 'savedWord', iconClass: 'h-3 w-3 stroke-[2.5]' },
};

function saveState(word, savedTerms, savingTerms) {
  const key = vocabularyTermKey(word);
  if (savedTerms?.has(key)) return 'saved';
  return savingTerms?.has(key) ? 'saving' : 'idle';
}

function SaveWordButton({ t, word, state, onSave }) {
  const { Icon, label, iconClass } = SAVE_STATES[state];
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={state !== 'idle'}
      aria-label={`${state === 'saved' ? 'Saved' : 'Add'} “${word}” to your vocabulary list`}
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1 rounded-md border px-2 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
        state === 'saved'
          ? 'cursor-default border-[rgb(var(--signal-ok)/0.4)] bg-[rgb(var(--signal-ok)/0.1)] text-[rgb(var(--signal-ok))]'
          : 'cursor-pointer border-[#d2d7f8] bg-white text-[#5a63df] hover:bg-[#efedff] dark:border-white/10 dark:bg-white/10 dark:text-indigo-200'
      )}
    >
      <Icon className={iconClass} aria-hidden="true" />
      <span>{t(label)}</span>
    </button>
  );
}

const shownAlternatives = ({ alternatives }) =>
  Array.isArray(alternatives) ? alternatives.filter(Boolean).slice(0, 2) : [];

function Alternatives({ t, enhancement, saving }) {
  const words = shownAlternatives(enhancement);
  if (!words.length) return null;
  const { onSaveVocabularyWord, savedVocabularyTerms, savingVocabularyTerms } = saving;
  const save = (word) =>
    onSaveVocabularyWord({
      word,
      original: enhancement.original,
      context: enhancement.context,
      example: '',
    });
  return (
    <div className="mt-3">
      <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
        {t('wlInstead')}
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {words.map((word) => (
          <li
            key={word}
            className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-[#5a63df]/20 bg-[#5a63df]/[0.05] px-2.5 py-1.5 dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/10"
          >
            <span
              dir="ltr"
              className="min-w-0 flex-1 break-words text-[13px] font-bold text-slate-900 dark:text-white"
            >
              {word}
            </span>
            {onSaveVocabularyWord && (
              <SaveWordButton
                t={t}
                word={word}
                state={saveState(word, savedVocabularyTerms, savingVocabularyTerms)}
                onSave={() => save(word)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VocabularyCard({ t, enhancement, sourceSentence, ...saving }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#e4e2f0] bg-white p-3 dark:border-white/10 dark:bg-[#151518]">
      <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
        {t('wlYouWrote')}
      </p>
      <p className="mt-0.5 break-words text-[14px] font-bold text-slate-900 dark:text-white">
        {enhancement.original}
      </p>
      <SourceSentence t={t} sentence={sourceSentence} phrase={enhancement.original} />
      <Alternatives t={t} enhancement={enhancement} saving={saving} />
      {enhancement.context && (
        <p className="mt-2 text-[12px] leading-snug text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {t('wlWhyBetter')}:{' '}
          </span>
          {tidyServerCut(enhancement.context)}
        </p>
      )}
    </div>
  );
}

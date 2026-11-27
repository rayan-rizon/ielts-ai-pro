import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PANEL, WELL, NUM } from '@/features/dashboard/components/primitives';
import {
  LINKING_RELATIONS,
  plainWritingText,
} from '@/features/testing/writing/utils/writingCoaching';
import { adviceForRepeatedWord } from '@/features/testing/writing/utils/repeatedWordAdvice';
import { VocabularyCard, highlightPhrase } from './VocabularyCard';
import { ParagraphFlowSection } from './ParagraphFlow';

function AlsoSay({ t, words }) {
  if (!words.length) return null;
  return (
    <div className="mt-2">
      <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
        {t('wlAlsoSay')}
      </p>
      <ul className="mt-1 flex flex-wrap gap-1.5" dir="ltr">
        {words.map((alternative) => (
          <li
            key={alternative}
            className="rounded-md bg-[#5a63df]/10 px-2 py-0.5 text-[12px] font-semibold text-[#4b53c9] dark:bg-[#8f97ff]/15 dark:text-[#c3c7ff]"
          >
            {alternative}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WordUses({ t, word, examples }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!examples?.length) return null;
  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="inline-flex cursor-pointer items-center gap-1 rounded-sm text-[11.5px] font-semibold text-[#5a63df] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:text-indigo-300"
      >
        <ChevronRight
          className={cn(
            'h-3 w-3 transition-transform duration-200 ease-out',
            isOpen && 'rotate-90'
          )}
        />
        {t(isOpen ? 'wlHideUses' : 'wlShowUses')}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="mt-1.5 space-y-1 overflow-hidden"
            dir="ltr"
          >
            {examples.map((example, index) => (
              <li
                key={`${word}-${index}`}
                className={cn(
                  WELL,
                  'rounded-md px-2.5 py-1.5 font-serif text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-200'
                )}
              >
                {highlightPhrase(example, word)}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function vocabularySourceSentence(text, phrase) {
  if (!text || !phrase) return '';
  const source = plainWritingText(text);
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`\\b${escaped}\\b`, 'i'));
  if (!match) return '';
  const before = source.slice(0, match.index);
  const after = source.slice(match.index + match[0].length);
  const start = Math.max(
    before.lastIndexOf('. '),
    before.lastIndexOf('! '),
    before.lastIndexOf('? '),
    before.lastIndexOf('\n')
  );
  const endCandidates = [
    after.indexOf('. '),
    after.indexOf('! '),
    after.indexOf('? '),
    after.indexOf('\n'),
  ].filter((index) => index >= 0);
  const end = endCandidates.length
    ? Math.min(...endCandidates) + match.index + match[0].length + 1
    : source.length;
  return source.slice(start < 0 ? 0 : start + (source[start] === '\n' ? 1 : 2), end).trim();
}

function RepeatedWordCard({ t, word, count, examples, isVisualTask }) {
  const advice = adviceForRepeatedWord({ word, count });

  return (
    <li className="min-w-0 rounded-lg border border-[#e4e2f0] bg-white p-3 text-xs dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-baseline justify-between gap-2">
        <strong className="break-words text-[14px] font-bold text-slate-900 dark:text-white">
          {word}
        </strong>
        <span
          className={cn(
            NUM,
            'shrink-0 text-[11.5px] font-semibold',
            advice.severity === 'high'
              ? 'text-[rgb(var(--signal-warn))]'
              : 'text-slate-500 dark:text-slate-400'
          )}
        >
          {t('wlTimes', { count })}
        </span>
      </div>
      <p className="mt-1 text-[12px] leading-snug text-slate-600 dark:text-slate-300">
        {t(advice.severity === 'high' ? 'wlVerdictHigh' : 'wlVerdictSome', { word, count })}
      </p>

      <AlsoSay t={t} words={advice.alternatives} />
      <p className="mt-2 text-[11.5px] leading-snug text-slate-500 dark:text-slate-400">
        {t(advice.alternatives.length ? 'wlTipSwap' : 'wlTipRephrase')}
        {isVisualTask &&
          t.language === 'en' &&
          ` If “${word}” is a label in the chart, keep it exactly.`}
      </p>

      <WordUses t={t} word={word} examples={examples} />
    </li>
  );
}

const SUBHEADING = 'text-[13px] font-bold text-slate-800 dark:text-slate-100';

function BetterWords({ t, text, words, ...saving }) {
  if (!words.length) return null;
  return (
    <div>
      <h4 className={SUBHEADING}>{t('wlBetterWords')}</h4>
      <div className="mt-2 grid grid-cols-1 gap-2.5 xl:grid-cols-2">
        {words.map((enhancement, i) => (
          <VocabularyCard
            t={t}
            key={i}
            enhancement={enhancement}
            sourceSentence={vocabularySourceSentence(text, enhancement.original)}
            {...saving}
          />
        ))}
      </div>
    </div>
  );
}

function RepeatedWords({ t, words, isVisualTask }) {
  if (!words.length) return null;
  return (
    <div className="min-w-0">
      <h4 className={SUBHEADING}>{t('wlUsedALot')}</h4>
      <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {t(isVisualTask ? 'wlRepeatNoteChart' : 'wlRepeatNote')}
      </p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {words.map((item) => (
          <RepeatedWordCard
            t={t}
            key={item.word}
            isVisualTask={isVisualTask}
            word={item.word}
            count={item.count}
            examples={item.examples}
          />
        ))}
      </ul>
    </div>
  );
}

const relationLabel = (t, category) =>
  LINKING_RELATIONS[category] ? t(`link${category}`) : category;

function LinkingWords({ t, linking }) {
  return (
    <div className="min-w-0">
      <h4 className={SUBHEADING}>{t('wlLinkingTitle')}</h4>
      {linking.length > 0 ? (
        <dl className="mt-2 grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-[auto_minmax(0,1fr)]">
          {linking.map((item) => (
            <React.Fragment key={item.category}>
              <dt className="text-slate-500 dark:text-slate-400">
                {relationLabel(t, item.category)}
              </dt>
              <dd className="flex flex-wrap gap-1">
                {item.phrases.map((phrase) => (
                  <span
                    key={phrase}
                    dir="ltr"
                    className="rounded-md border border-[#e4e2f0] bg-white px-1.5 py-0.5 font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  >
                    {phrase}
                  </span>
                ))}
              </dd>
            </React.Fragment>
          ))}
        </dl>
      ) : (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('wlNoLinking')}</p>
      )}
    </div>
  );
}

/**
 * Word choice and linking beside the essay, in the report language. The labels
 * are fixed translations, so switching language here costs nothing.
 */
export default function WordsAndLinking({
  t,
  text,
  newWords,
  repeatedWords,
  writingAnalysis,
  isVisualTask,
  ...saving
}) {
  if (!newWords.length && !writingAnalysis) return null;
  return (
    <section
      className={cn(PANEL, 'space-y-3 p-3.5 sm:p-4')}
      lang={t.language}
      dir={t.rtl ? 'rtl' : 'ltr'}
    >
      <div>
        <h3 className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('wlTitle')}
        </h3>
        {newWords.length > 0 && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t('wlIntro')}</p>
        )}
      </div>
      <BetterWords t={t} text={text} words={newWords} {...saving} />
      {writingAnalysis && (
        <div className="space-y-4 border-t border-[#e4e2f0] pt-3 dark:border-white/[0.07]">
          <RepeatedWords t={t} words={repeatedWords} isVisualTask={isVisualTask} />
          <LinkingWords t={t} linking={writingAnalysis.linking} />
        </div>
      )}
      <ParagraphFlowSection t={t} writingAnalysis={writingAnalysis} />
    </section>
  );
}

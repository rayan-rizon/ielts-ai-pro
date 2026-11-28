import React, { useMemo } from 'react';
import { reportT } from '@/features/testing/writing/report/reportStrings';
import WordsAndLinking from './WordsAndLinking';

const stemsOf = (text) =>
  new Set(
    (
      String(text)
        .toLowerCase()
        .match(/[a-z]{3,}/g) || []
    ).map((word) => word.slice(0, 5))
  );

/**
 * Words from the question and labels from the chart must be repeated exactly
 * ("Very satisfied" can't become "happy"), and words the vocabulary ideas
 * already cover would say the same thing twice. Chart labels come from the
 * marker's own description of the visual, matched on the first five letters so
 * "satisfied" also catches "satisfaction".
 */
function overusedWords(analysis, vocabulary, chartText) {
  const covered = vocabulary.map((item) => String(item.original || '').toLowerCase());
  const chartStems = stemsOf(chartText);
  return (analysis?.repeated || []).filter((item) => {
    const word = item.word.toLowerCase();
    const required = item.inPrompt || chartStems.has(word.slice(0, 5));
    return !required && !covered.some((phrase) => phrase.includes(word));
  });
}

const ENGLISH_WORDS = reportT('en');
const NO_WORDS = [];

export default function EssayWords({
  t = ENGLISH_WORDS,
  text,
  writingAnalysis,
  vocabularyEnhancements = NO_WORDS,
  reportedVocabulary = NO_WORDS,
  chartText = '',
  ...props
}) {
  const repeatedWords = useMemo(
    () => overusedWords(writingAnalysis, vocabularyEnhancements || NO_WORDS, chartText),
    [writingAnalysis, vocabularyEnhancements, chartText]
  );
  // Words "Practise next" already shows in the report are not repeated here.
  const newWords = (vocabularyEnhancements || NO_WORDS).filter(
    (entry) => !reportedVocabulary.includes(String(entry?.original || '').trim())
  );
  return (
    <WordsAndLinking
      t={t}
      text={text}
      newWords={newWords}
      repeatedWords={repeatedWords}
      writingAnalysis={writingAnalysis}
      {...props}
    />
  );
}

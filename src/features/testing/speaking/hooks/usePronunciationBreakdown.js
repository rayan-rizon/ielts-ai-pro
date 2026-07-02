import { useMemo } from 'react';

function collectSounds(sample, sounds) {
  const items = sample.problematicSounds;
  if (!Array.isArray(items)) return;
  items.forEach((sound) => sounds.add(sound));
}

function collectWordIssues(sample, wordIssues) {
  const items = sample.wordLevelFeedback;
  if (!Array.isArray(items)) return;
  wordIssues.push(...items);
}

function collectClarityNotes(sample, clarityNotes) {
  if (!sample.overallClarity) return;
  clarityNotes.push(sample.overallClarity);
}

function processSample(sample, sounds, wordIssues, clarityNotes) {
  collectSounds(sample, sounds);
  collectWordIssues(sample, wordIssues);
  collectClarityNotes(sample, clarityNotes);
}

function collectPronunciationData(allPartsPronunciation) {
  const sounds = new Set();
  const wordIssues = [];
  const clarityNotes = [];

  for (const scores of Object.values(allPartsPronunciation)) {
    if (!Array.isArray(scores)) continue;
    scores.forEach((s) => processSample(s, sounds, wordIssues, clarityNotes));
  }

  return { sounds, wordIssues, clarityNotes };
}

function deduplicateWordIssues(wordIssues) {
  const seen = new Set();
  return wordIssues.filter((w) => {
    if (seen.has(w.word)) return false;
    seen.add(w.word);
    return true;
  });
}

export default function usePronunciationBreakdown(allPartsPronunciation) {
  return useMemo(() => {
    if (!allPartsPronunciation) return null;

    const { sounds, wordIssues, clarityNotes } = collectPronunciationData(allPartsPronunciation);

    if (sounds.size === 0 && wordIssues.length === 0) return null;

    return {
      problematicSounds: [...sounds],
      wordIssues: deduplicateWordIssues(wordIssues),
      clarityNotes,
    };
  }, [allPartsPronunciation]);
}

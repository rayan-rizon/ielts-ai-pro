import { plainReadingPassage } from './readingExplanations.js';

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])])
    );
  return value ?? null;
}

export function readingTrapFingerprint(question, source) {
  const explanation = structuredClone(question.explanation_data || null);
  const entries = explanation?.blanks ? Object.values(explanation.blanks) : [explanation];
  for (const entry of entries)
    if (entry) {
      delete entry.trap;
      delete entry.tempting_answer;
    }
  const text = JSON.stringify(
    stable([
      question.question_text,
      question.type,
      question.correct_answer,
      question.options,
      question.gap_fill,
      question.table_data,
      question.matching_features,
      question.flowchart,
      plainReadingPassage(source),
      explanation,
    ])
  );
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

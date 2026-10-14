import annotations from './readingTrapAnnotations.json';
import { readingTrapFingerprint } from './readingTrapFingerprint.js';

export function withReadingTraps(question, test, catalogue = annotations) {
  const reviewed = catalogue[question.id];
  if (!reviewed || !question.explanation_data) return question;
  const section = test.sections?.find((s) => Number(s.section_number) === Number(question.section));
  const source = section?.content || (test.sections?.length ? '' : test.content);
  if (!source || reviewed.fingerprint !== readingTrapFingerprint(question, source)) return question;
  const explanation = structuredClone(question.explanation_data);
  for (const [number, note] of Object.entries(reviewed.notes)) {
    const entry =
      explanation.blanks?.[number] ||
      (Number(number) === Number(question.question_number) ? explanation : null);
    if (entry) {
      entry.trap = note.trap;
      if (note.tempting_answer) entry.tempting_answer = note.tempting_answer;
      else delete entry.tempting_answer;
    }
  }
  return { ...question, explanation_data: explanation };
}

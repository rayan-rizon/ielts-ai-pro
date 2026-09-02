export type SpeakingQuestion = { id: string; text: string };

type SpeakingQuestionRow = {
  id: string;
  question_text?: string | null;
  correct_answer?: string | null;
};

function getQuestionLines(value: unknown) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean);
}

/**
 * Part 2's `question_text` is an internal label (usually "Long Turn"). The
 * cue-card body lives in `correct_answer`, so that is the learner-facing prompt
 * and must also be used by the repeat-question path.
 */
export function parseSpeakingQuestionRows(rows: SpeakingQuestionRow[], partNumber: number) {
  const questions: SpeakingQuestion[] = [];

  for (const row of rows || []) {
    const cueCard = String(row.correct_answer || '').trim();
    const fallback = String(row.question_text || '').trim();

    if (partNumber === 2) {
      const text = cueCard || fallback;
      if (text) questions.push({ id: row.id, text });
      break;
    }

    const lines = getQuestionLines(cueCard || fallback);
    for (const line of lines.length ? lines : [fallback]) {
      if (String(line || '').trim()) questions.push({ id: row.id, text: String(line).trim() });
    }
  }

  return questions;
}

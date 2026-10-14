import { getQuestionCount } from '@/lib/utils';
import { groupQuestions } from '@/features/testing/reading/components/ReadingTest/utils/helpers';

function normalizePreviewQuestion(raw, number, section, id) {
  const q = { ...structuredClone(raw), id: raw.id || id, question_number: number, section };
  if (q.table_data) {
    q.table_data.headers = q.table_data.headers || q.table_data.table_headers || [];
    q.table_data.rows = q.table_data.rows || q.table_data.table_rows || [];
    q.table_data.blanks = q.table_data.blanks || q.table_data.blank_positions || [];
  }
  return q;
}

// Preview receives an immutable snapshot. It never hydrates a session, calls a
// save hook, or reads/writes the learner's persisted Zustand store.
export function buildReadingPreview(sections, title = 'Reading test preview') {
  let number = 1;
  const allQuestions = [];
  const prepared = sections.map((section, s) => {
    const questions = [];
    (section.groups || section.question_groups || []).forEach((group, g) => {
      (group.questions || []).forEach((raw, index) => {
        const q = normalizePreviewQuestion(raw, number, s + 1, `preview_${s}_${g}_${index}`);
        q.group_instructions = group.instructions || q.group_instructions || '';
        number += getQuestionCount(q);
        questions.push(q);
        allQuestions.push(q);
      });
    });
    return {
      title: section.title,
      passage_name: section.passage_name || section.title,
      content: section.content || '',
      section_number: s + 1,
      questions: groupQuestions(questions),
    };
  });
  return { testData: { title, sections: prepared, total_questions: number - 1 }, allQuestions };
}

export function previewPassageEvidence(section, allQuestions) {
  const source = section.content;
  if (/\[answer\b|<\/?[a-z]/i.test(source)) return source;
  const ranges = [];
  for (const q of allQuestions.filter((question) => question.section === section.section_number)) {
    const entries = q.explanation_data?.blanks || { [q.question_number]: q.explanation_data };
    for (const [number, explanation] of Object.entries(entries)) {
      const quote = explanation?.passage_highlight;
      if (!quote) continue;
      const start = source.indexOf(quote);
      if (start >= 0) ranges.push({ start, end: start + quote.length, numbers: [number] });
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const merged = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range.start < previous.end) {
      previous.end = Math.max(previous.end, range.end);
      previous.numbers.push(...range.numbers);
    } else merged.push(range);
  }
  let output = source;
  for (const range of merged.reverse()) {
    output =
      output.slice(0, range.start) +
      `[answer q=${range.numbers.join(',')}]` +
      source.slice(range.start, range.end) +
      '[/answer]' +
      output.slice(range.end);
  }
  return output;
}

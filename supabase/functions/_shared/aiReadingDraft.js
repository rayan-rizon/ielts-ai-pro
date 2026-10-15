export { validateAiReadingDraft } from './aiReadingValidation.js';
import { markReadingSourceHighlights } from './readingSourceHighlights.js';
import {
  readingBoxTitle,
  readingNotesPresentation,
  readingInstructionParagraphs,
} from './readingQuestionPresentation.js';

const explanations = (items) =>
  items.length === 1
    ? items[0].explanation
    : {
        blanks: Object.fromEntries(items.map((item) => [item.number, item.explanation])),
      };
const rangeInstructions = (group) => {
  const first = group.items[0].number,
    last = group.items.at(-1).number;
  const label = first === last ? `Question ${first}` : `Questions ${first}–${last}`;
  return `${label}\n${readingInstructionParagraphs(group.instructions.replace(/^Questions?\s+\d+(?:\s*[–—-]\s*\d+)?[.:]?\s*/i, ''))}`;
};
const baseQuestion = (group, item) => ({
  question_number: item.number,
  question_text: item.text,
  type: group.type,
  options: [],
  correct_answer: item.answer,
  group_instructions: rangeInstructions(group),
  explanation_data: item.explanation,
  question_count: 1,
  allow_multiple: false,
});

function matchingQuestion(group) {
  const q = baseQuestion(group, group.items[0]);
  return {
    ...q,
    type: 'matching_features',
    question_text: '',
    correct_answer: '',
    explanation_data: explanations(group.items),
    matching_features: {
      style: group.style || 'ABC',
      mode: group.text ? 'paragraph' : 'list',
      box_title: readingBoxTitle(
        group.title,
        group.type === 'matching_headings' ? 'List of Headings' : ''
      ),
      options: group.options,
      ...(group.text
        ? {
            text: group.text,
            answers: Object.fromEntries(group.items.map((i) => [i.number, i.answer])),
          }
        : {
            questions: group.items.map((i) => ({
              id: `mq${i.number}`,
              questionNumber: i.number,
              text: i.text,
              answer: i.answer,
            })),
          }),
    },
  };
}

function tableQuestion(group) {
  const blanks = [];
  const rows = group.rows.map((row, r) =>
    row.map((cell, col) =>
      cell.replace(/\[(\d+)\]/g, (_, n) => {
        blanks.push({
          blankNumber: Number(n),
          row: r,
          col,
          answer: group.items.find((i) => i.number === Number(n)).answer,
        });
        return `__BLANK_${n}__`;
      })
    )
  );
  return {
    ...baseQuestion(group, group.items[0]),
    correct_answer: '',
    explanation_data: explanations(group.items),
    table_data: {
      title: group.title,
      headers: group.headers,
      rows,
      blanks,
      table_headers: group.headers,
      table_rows: rows,
      blank_positions: blanks,
      blanks_count: blanks.length,
    },
  };
}

function flowchartQuestion(group) {
  const steps = group.steps.map((value, index) => {
    const gap_numbers = [...value.matchAll(/\[(\d+)\]/g)].map((match) => Number(match[1]));
    return { id: `s${index}`, type: 'box', text: value.replace(/\[\d+\]/g, '[gap]'), gap_numbers };
  });
  return {
    ...baseQuestion(group, group.items[0]),
    correct_answer: '',
    explanation_data: explanations(group.items),
    flowchart: {
      box_title: group.title,
      style: group.style || 'ABC',
      answer_mode: group.options ? 'dropdown' : 'input',
      steps,
      options: group.options || [],
      answers: Object.fromEntries(group.items.map((i, index) => [index, i.answer])),
    },
  };
}

function groupQuestions(group) {
  if (['matching_features', 'matching_headings'].includes(group.type))
    return [matchingQuestion(group)];
  if (group.type === 'table_completion') return [tableQuestion(group)];
  if (group.type === 'flowchart') return [flowchartQuestion(group)];
  if (
    group.type === 'notes_completion' ||
    (group.type === 'summary_completion' && group.items.length > 1)
  ) {
    const notes = readingNotesPresentation(group.title, group.text);
    return [
      {
        ...baseQuestion(group, group.items[0]),
        type: 'notes_completion',
        correct_answer: '',
        question_text: notes.text,
        explanation_data: explanations(group.items),
        gap_fill: {
          title: notes.title,
          structured_text: notes.text,
          gap_count: group.items.length,
          answers: Object.fromEntries(group.items.map((i) => [i.number, i.answer])),
        },
      },
    ];
  }
  if (group.select_count > 1) {
    const options = group.options.map((option, i) => `${String.fromCharCode(65 + i)}. ${option}`);
    return [
      {
        ...baseQuestion(group, group.items[0]),
        options,
        allow_multiple: true,
        question_count: group.select_count,
        correct_answer: JSON.stringify(group.items.map((i) => i.answer.toUpperCase())),
        explanation_data: explanations(group.items),
      },
    ];
  }
  return group.items.map((item) => {
    const q = baseQuestion(group, item);
    if (group.type === 'multiple_choice') {
      q.options = (item.options || group.options).map(
        (option, i) => `${String.fromCharCode(65 + i)}. ${option}`
      );
      q.correct_answer = q.options[item.answer.toUpperCase().charCodeAt(0) - 65];
    }
    if (['sentence_completion', 'summary_completion', 'short_answer'].includes(group.type)) {
      q.question_text = item.text.replace(/\[\d+\]/g, '_____');
      if (group.type === 'short_answer' && !/_{2,}/.test(q.question_text))
        q.question_text += ' _____';
    }
    return q;
  });
}

// This is the only adapter to the existing learner/scoring contract. Neither
// generated database IDs nor publication status are accepted from the model.
export function aiReadingDraftSections(draft) {
  return draft.sections.map((section, s) => ({
    section_number: s + 1,
    title: section.title,
    passage_name: section.title,
    content: markReadingSourceHighlights(section.content, section.highlights),
    question_groups: section.groups.map((group, g) => ({
      id: `gai_${s}_${g}`,
      instructions: rangeInstructions(group),
      isCollapsed: false,
      questions: groupQuestions(group).map((q, index) => ({
        ...q,
        section: s + 1,
        id: `qai_${s}_${g}_${index}`,
      })),
    })),
  }));
}

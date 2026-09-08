import { calculateTestResults, scoreQuestion } from './reading.js';
import { calculateListeningTestResults } from './listening.js';
import { computeQuestionNumbers } from './questionProcessing.js';

export function prepareObjectiveSnapshot(passage, rows) {
  const type = passage.test_type;
  if (!['reading', 'listening'].includes(type) || !passage.is_active)
    throw new Error('Test unavailable');
  let content;
  try {
    content = typeof passage.content === 'string' ? JSON.parse(passage.content) : passage.content;
  } catch {
    throw new Error('A full test is required');
  }
  if (!Array.isArray(content) || content.length === 0)
    throw new Error('Test content is unavailable');
  const sections = content.map((s, i) => ({
    ...s,
    section_number: s.section_number || i + 1,
    title: s.title || `Part ${i + 1}`,
  }));
  let questions = rows
    .map((q) => {
      let correct = q.correct_answer;
      if (type === 'listening' && typeof correct === 'string' && correct.startsWith('[')) {
        try {
          correct = JSON.parse(correct);
        } catch {
          /* Keep literal answer. */
        }
      }
      return { ...q, section: Number(q.section || q.part_number || 1), correct_answer: correct };
    })
    .sort(
      (a, b) => a.section - b.section || parseInt(a.question_number) - parseInt(b.question_number)
    );
  for (const section of sections)
    for (const group of section.question_groups || []) {
      const first = questions.find((q) => q.id === group.questions?.[0]?.id);
      if (first && group.title && !first.mcq_title) first.mcq_title = group.title;
    }
  if (type === 'listening')
    questions = computeQuestionNumbers(questions).map((q) =>
      q.allow_multiple ? { ...q, question_count: q._displaySize } : q
    );
  if (type === 'reading')
    questions = questions.map((q) =>
      q.type === 'multiple_choice' ? { ...q, question_count: scoreQuestion(q, {}).total } : q
    );
  const snapshot = {
    testData: {
      ...passage,
      content: type === 'listening' ? sections : passage.content,
      sections: type === 'reading' ? sections : undefined,
    },
    questions,
  };
  return snapshot;
}

export function prepareSnapshot(passage, rows) {
  const snapshot = prepareObjectiveSnapshot(passage, rows);
  const sections =
    passage.test_type === 'reading' ? snapshot.testData.sections : snapshot.testData.content;
  if (sections.length !== (passage.test_type === 'reading' ? 3 : 4))
    throw new Error('A full test is required');
  const empty = gradeSnapshot(snapshot, {});
  if (
    empty.totalQuestions !== 40 ||
    empty.sectionStats.length !== sections.length ||
    empty.sectionStats.some((s) => s.total === 0)
  )
    throw new Error('This test is not eligible for paired practice');
  return snapshot;
}

export function gradeSnapshot(snapshot, answers) {
  return snapshot.testData.test_type === 'reading'
    ? calculateTestResults(snapshot.questions, answers, snapshot.testData.sections)
    : calculateListeningTestResults(snapshot.questions, answers, snapshot.testData.content);
}

// Neither shared summaries nor active test payloads carry answer keys or explanations.
const HIDDEN = new Set([
  'answer',
  'answers',
  'correct_answer',
  'correct_answers',
  'correctAnswer',
  'correct_heading',
  'explanation',
  'explanation_data',
  'transcript',
  'transcript_segments',
  'transcript_highlights',
  'srt_content',
  'why_correct',
  'other_accepted_answers',
  'sample_answer',
]);
export function withoutSolutions(value) {
  if (Array.isArray(value)) return value.map(withoutSolutions);
  if (typeof value === 'string') return value.replace(/\[\/?answer\b[^\]]*\]/gi, '');
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !HIDDEN.has(key))
      .map(([k, v]) => [k, withoutSolutions(v)])
  );
}

export function comparisonSummary(result) {
  return {
    bandScore: result.bandScore,
    correctAnswers: result.correctAnswers,
    totalQuestions: result.totalQuestions,
    percentage: result.percentage,
    sectionStats: result.sectionStats.map(({ title, correct, total, percentage }) => ({
      title,
      correct,
      total,
      percentage,
    })),
    typeStats: Object.fromEntries(
      Object.entries(result.typeStats).map(([type, s]) => [
        type,
        { correct: s.correct, total: s.total },
      ])
    ),
  };
}

export function validateAnswers(answers) {
  if (
    !answers ||
    Array.isArray(answers) ||
    typeof answers !== 'object' ||
    Object.keys(answers).length > 200
  )
    throw new Error('Invalid answers');
  for (const [key, value] of Object.entries(answers)) {
    if (key.length > 160 || ['__proto__', 'constructor', 'prototype'].includes(key))
      throw new Error('Invalid answer key');
    const values = Array.isArray(value) ? value : [value];
    if (values.length > 40 || values.some((v) => typeof v !== 'string' || v.length > 1000))
      throw new Error('Invalid answer value');
  }
  return answers;
}

export function audioPosition(durations, elapsed) {
  let offset = Math.max(0, elapsed);
  for (let part = 0; part < durations.length; part++) {
    if (offset < durations[part]) return { part, offset, review: false };
    offset -= durations[part];
  }
  return { part: Math.max(0, durations.length - 1), offset: 0, review: true };
}

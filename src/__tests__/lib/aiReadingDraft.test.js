import { describe, expect, it } from 'vitest';
import {
  validateAiReadingInput,
  parseAiReadingAnswers,
} from '../../../supabase/functions/_shared/aiReadingInput';
import {
  validateAiReadingDraft,
  aiReadingDraftSections,
} from '../../../supabase/functions/_shared/aiReadingDraft';
import { calculateTestResults } from '../../../supabase/functions/_shared/objective-scoring/reading';
import {
  validateReadingExplanation,
  readingAnswer,
} from '@/features/testing/reading/utils/readingExplanations';
import { aiReadingFixture, aiReadingInput } from '../helpers/aiReadingFixture';

describe('AI Reading import boundaries', () => {
  it('keeps years, numbers, Roman numerals and alternatives in the answer key', () => {
    expect(parseAiReadingAnswers('1. 1999\n2: 5 metres\n3) iii\n4. migration / movement')).toEqual({
      1: '1999',
      2: '5 metres',
      3: 'iii',
      4: 'migration / movement',
    });
    expect(() => parseAiReadingAnswers('1. A\n1. B')).toThrow('repeated');
    expect(() => parseAiReadingAnswers('A, B, C')).toThrow('numbered');
  });
  it('requires a complete supplied key and source for every part', () => {
    expect(validateAiReadingInput(aiReadingInput()).suppliedAnswers[12]).toBe('1999');
    expect(() => validateAiReadingInput({ ...aiReadingInput(), answerText: '1. TRUE' })).toThrow(
      'every'
    );
    expect(() => validateAiReadingInput({ ...aiReadingInput(), passageText: '' })).toThrow(
      'passage'
    );
    expect(() =>
      validateAiReadingInput({
        ...aiReadingInput(),
        images: [{ role: 'passage', dataUrl: 'https://evil.test/image' }],
      })
    ).toThrow('screenshots');
  });
  it('accepts no key and grounds inferred free answers within the word limit', () => {
    const input = validateAiReadingInput({ ...aiReadingInput(), answerText: '' });
    expect(input.answerSource).toBe('inferred');
    const draft = aiReadingFixture();
    expect(validateAiReadingDraft(draft, input).sections).toHaveLength(1);
    draft.sections[0].groups[6].items[0].answer = 'invention';
    expect(() => validateAiReadingDraft(draft, input)).toThrow('actual passage');
    draft.sections[0].groups[6].items[0].answer = 'glass jars';
    expect(() => validateAiReadingDraft(draft, input)).toThrow('word limit');
  });
  it('retains short traps but rejects accepted or invented distractors and long explanations', () => {
    const draft = aiReadingFixture();
    const explanation = draft.sections[0].groups[0].items[0].explanation;
    explanation.trap =
      'Separate what the passage actually states from details mentioned only in the question.';
    explanation.tempting_answer = 'FALSE';
    expect(
      validateAiReadingDraft(draft, { expectedQuestions: 13 }).sections[0].groups[0].items[0]
        .explanation
    ).toMatchObject({ trap: explanation.trap, tempting_answer: 'FALSE' });
    explanation.tempting_answer = 'TRUE';
    expect(() => validateAiReadingDraft(draft, { expectedQuestions: 13 })).toThrow(
      'available wrong choice'
    );
    delete explanation.tempting_answer;
    explanation.why_correct = 'word '.repeat(71);
    expect(() => validateAiReadingDraft(draft, { expectedQuestions: 13 })).toThrow('concise');
  });
  it('grounds typography and only repairs a quote using an exact same-question highlight', () => {
    const draft = aiReadingFixture();
    const item = draft.sections[0].groups[0].items[0];
    item.explanation.passage_highlight = 'the garden opened in 1999.';
    expect(
      validateAiReadingDraft(draft, { expectedQuestions: 13 }).sections[0].groups[0].items[0]
        .explanation.passage_highlight
    ).toBe('The garden opened in 1999.');
    item.explanation.passage_highlight = 'Invented source words';
    expect(() => validateAiReadingDraft(draft, { expectedQuestions: 13 })).toThrow(
      'actual passage'
    );
    draft.sections[0].highlights = [{ text: 'The garden opened in 1999.', question_numbers: [1] }];
    expect(
      validateAiReadingDraft(draft, { expectedQuestions: 13 }).sections[0].groups[0].items[0]
        .explanation.passage_highlight
    ).toBe('The garden opened in 1999.');
    draft.sections[0].highlights[0].question_numbers = [2];
    expect(() => validateAiReadingDraft(draft, { expectedQuestions: 13 })).toThrow(
      'actual passage'
    );
  });
  it.each(['question_number', 'passage_id', 'is_active'])(
    'does not accept model-controlled %s on output',
    (field) => {
      const draft = aiReadingFixture();
      draft[field] = field === 'is_active' ? true : 'existing-live-id';
      const clean = validateAiReadingDraft(draft, validateAiReadingInput(aiReadingInput()));
      expect(clean).not.toHaveProperty(field);
    }
  );
  it('rejects skipped questions, changed answers and fabricated evidence', () => {
    const input = validateAiReadingInput(aiReadingInput());
    const draft = aiReadingFixture();
    draft.sections[0].groups[0].items[0].number = 2;
    expect(() => validateAiReadingDraft(draft, input)).toThrow('Expected Q1');
    const changed = aiReadingFixture();
    changed.sections[0].groups[0].items[0].answer = 'FALSE';
    expect(() => validateAiReadingDraft(changed, input)).toThrow('answer key');
    const fake = aiReadingFixture();
    fake.sections[0].groups[0].items[0].explanation.passage_highlight =
      'A made-up source sentence.';
    expect(() => validateAiReadingDraft(fake, input)).toThrow('actual passage');
  });
  it('rejects accepted multi-select choices marked wrong and missing table/flowchart blanks', () => {
    const input = validateAiReadingInput(aiReadingInput());
    const draft = aiReadingFixture();
    draft.sections[0].groups[4].items[0].explanation.why_wrong = { C: 'This is wrong.' };
    expect(() => validateAiReadingDraft(draft, input)).toThrow('accepted answer');
    const table = aiReadingFixture();
    table.sections[0].groups[6].rows = [['Seeds', 'jars']];
    expect(() => validateAiReadingDraft(table, input)).toThrow('each numbered blank');
    const chart = aiReadingFixture();
    chart.sections[0].groups[7].steps = ['[11] then [10]'];
    expect(() => validateAiReadingDraft(chart, input)).toThrow('question order');
  });
  it('stops when the model flags an unreadable or unsupported source', () => {
    expect(() =>
      validateAiReadingDraft(
        { ...aiReadingFixture(), issues: ['Q3 is unreadable.'] },
        { expectedQuestions: 13 }
      )
    ).toThrow('unreadable');
  });
});

describe('existing Reading contract compatibility', () => {
  it('scores all 13 answers with the existing scorer, including composite rows and multi-select', () => {
    const clean = validateAiReadingDraft(
      aiReadingFixture(),
      validateAiReadingInput(aiReadingInput())
    );
    const sections = aiReadingDraftSections(clean);
    const questions = sections.flatMap((section) =>
      section.question_groups.flatMap((group) => group.questions)
    );
    const answers = {};
    for (const q of questions) {
      if (q.matching_features)
        q.matching_features.questions.forEach((i) => {
          answers[`${q.id}_${i.id}`] = i.answer;
        });
      else if (q.table_data)
        q.table_data.blanks.forEach((i, index) => {
          answers[`${q.id}_${index}`] = i.answer;
        });
      else if (q.flowchart)
        q.flowchart.steps.forEach((step) =>
          step.gap_numbers.forEach((n) => {
            answers[`${q.id}_gap_${n}`] = readingAnswer(q, n);
          })
        );
      else if (q.gap_fill)
        Object.entries(q.gap_fill.answers).forEach(([n, answer]) => {
          answers[`${q.id}_gap_${n}`] = answer;
        });
      else answers[q.id] = q.allow_multiple ? JSON.stringify(['C', 'A']) : q.correct_answer;
    }
    const result = calculateTestResults(questions, answers, sections);
    expect(result.correctAnswers).toBe(13);
    expect(result.totalQuestions).toBe(13);
    expect(result.responseDetails).toHaveLength(13);
    for (const q of questions) {
      const entries = q.explanation_data.blanks || { [q.question_number]: q.explanation_data };
      for (const [number, explanation] of Object.entries(entries)) {
        expect(() =>
          validateReadingExplanation(explanation, q, Number(number), sections[0].content)
        ).not.toThrow();
      }
    }
  });
  it('preserves existing inputs without mutation and gives new rows temporary editor IDs', () => {
    const original = aiReadingFixture();
    const before = JSON.stringify(original);
    const clean = validateAiReadingDraft(original, { expectedQuestions: 13 });
    const output = aiReadingDraftSections(clean);
    expect(JSON.stringify(original)).toBe(before);
    expect(output[0].question_groups[0].questions[0].id).toMatch(/^qai_/);
    expect(output[0].content).toBe(original.sections[0].content);
  });
});

import { describe, expect, it } from 'vitest';
import { mergeAnswers, parseBulkQuestions, validateBulkData } from '@/lib/bulkQuestionParser';

const FLOWCHART_INPUT = `Questions 8-10

Complete the flow-chart below.

Choose NO MORE THAN TWO WORDS from the passage for each answer.

Write your answers in boxes 8-10 on your answer sheet.

Generating biogas for domestic use in Dunga

First, place water hyacinth together with some 8. _____ into a digester

↓

Leave the mixture until the 9. _____ is completed

↓

Capture the gas emitted by the digester and use 10. _____ to transport it to individual homes

↓

Then use the gas for cooking as well as making water fit for human consumption`;

describe('reading bulk flow-chart parsing', () => {
  it('detects the flow-chart and preserves its boxed step sequence', () => {
    const questions = parseBulkQuestions(FLOWCHART_INPUT, 'Section 1');

    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatchObject({
      type: 'flowchart',
      question_number: 8,
      question_text: 'Generating biogas for domestic use in Dunga',
      section: 'Section 1',
      flowchart: {
        box_title: 'Generating biogas for domestic use in Dunga',
        answer_mode: 'input',
      },
    });
    expect(questions[0].flowchart.steps).toHaveLength(4);
    expect(questions[0].flowchart.steps.map((step) => step.gap_numbers)).toEqual([
      [8],
      [9],
      [10],
      [],
    ]);
    expect(questions[0].flowchart.steps.map((step) => step.text)).toEqual([
      'First, place water hyacinth together with some [gap] into a digester',
      'Leave the mixture until the [gap] is completed',
      'Capture the gas emitted by the digester and use [gap] to transport it to individual homes',
      'Then use the gas for cooking as well as making water fit for human consumption',
    ]);
    expect(questions[0].group_instructions).toContain('**NO MORE THAN TWO WORDS**');
    expect(questions[0].group_instructions).not.toContain('**NO MORE THAN **TWO WORDS****');
  });

  it('merges and validates answers by the original question numbers', () => {
    const [question] = parseBulkQuestions(FLOWCHART_INPUT, 'Section 1');
    const [merged] = mergeAnswers([{ ...question, id: 'flow-1' }], {
      8: 'cow dung',
      9: 'fermentation',
      10: 'pipes',
    });

    expect(merged.flowchart.answers).toEqual({
      0: 'cow dung',
      1: 'fermentation',
      2: 'pipes',
    });
    expect(validateBulkData([merged])).toEqual({ errors: [], suggestions: [] });
  });
});

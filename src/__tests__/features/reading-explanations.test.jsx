import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExplanationBody } from '@/features/testing/reading/components/DeepDivePopover';
import {
  answerChoices,
  readingAnswer,
  flattenExplanationImport,
  validateReadingExplanation,
  temptingAnswer,
} from '@/features/testing/reading/utils/readingExplanations';

const passage = 'Only one successful breeding attempt occurred in 1899.';
const question = { type: 'true_false_not_given', question_number: 7, correct_answer: 'FALSE' };
const explanation = {
  correct_answer: 'FALSE',
  passage_highlight: passage,
  why_correct: 'One successful attempt contradicts the claim that several animals were born.',
  synonym_map: [{ question_keyword: 'several', passage_keyword: 'Only one' }],
  why_wrong: {
    TRUE: 'The passage records one attempt, not several.',
    'NOT GIVEN': 'The passage gives an explicit number.',
  },
};

describe('reading explanation integrity', () => {
  it('maps old matching rows without explicit sub-question numbers positionally', () => {
    expect(
      readingAnswer(
        {
          question_number: 14,
          matching_features: { questions: [{ answer: 'A' }, { answer: 'D' }] },
        },
        15
      )
    ).toBe('D');
  });
  it('reads table, notes and flowchart answers for the actual scored number', () => {
    expect(
      readingAnswer(
        {
          question_number: 9,
          table_data: { blank_positions: [{ blankNumber: 10, answer: 'four sides' }] },
        },
        10
      )
    ).toBe('four sides');
    expect(readingAnswer({ question_number: 1, gap_fill: { answers: { 2: 'scent' } } }, 2)).toBe(
      'scent'
    );
    expect(
      readingAnswer({ question_number: 8, flowchart: { answers: { 1: 'fermentation' } } }, 9)
    ).toBe('fermentation');
  });
  it('recognises both accepted MCQ letters but not the first letter of a word', () => {
    expect(answerChoices('B/C')).toEqual(['B', 'C']);
    expect(answerChoices('["B. First answer","C. Second answer"]')).toEqual(['B', 'C']);
    expect(answerChoices('A. It leads the public to mistrust AI.')).toEqual(['A']);
    expect(answerChoices('carnivorous')).toEqual([]);
  });
  it('routes wrapped entries by their own number, avoiding neighbouring explanations on one row', () => {
    expect(
      flattenExplanationImport({
        9: {
          blanks: {
            9: explanation,
            10: { ...explanation, why_correct: 'A navigator steers a ship.' },
          },
        },
      })
    ).toHaveProperty('10.why_correct', 'A navigator steers a ship.');
    expect(() =>
      flattenExplanationImport({
        9: { blanks: { 10: explanation } },
        10: { ...explanation, why_correct: 'Different' },
      })
    ).toThrow('conflicting');
  });
  it('rejects fabricated evidence, answer-only reasoning and correct choices labelled wrong', () => {
    expect(() =>
      validateReadingExplanation(
        { ...explanation, note: 'Based on a simulated passage' },
        question,
        7,
        passage
      )
    ).toThrow('simulated');
    expect(() =>
      validateReadingExplanation(
        { ...explanation, why_correct: 'N/A - The statement is FALSE.' },
        question,
        7,
        passage
      )
    ).toThrow('answer label');
    expect(() =>
      validateReadingExplanation(
        { ...explanation, why_wrong: { FALSE: 'This is correct.' } },
        question,
        7,
        passage
      )
    ).toThrow('correct answer');
    expect(() =>
      validateReadingExplanation(
        { ...explanation, passage_highlight: 'None were born.' },
        question,
        7,
        passage
      )
    ).toThrow('exact excerpt');
  });
  it('takes the answer from the saved question instead of trusting generated metadata', () => {
    expect(
      validateReadingExplanation({ ...explanation, correct_answer: 'TRUE' }, question, 7, passage)
        .correct_answer
    ).toBe('FALSE');
  });
});

describe('learner explanation display', () => {
  it('shows a tempting wrong answer alongside a short trap', () => {
    render(
      <ExplanationBody
        entries={[
          {
            key: '7',
            data: {
              ...explanation,
              trap: 'Check “several” against “only one”.',
              tempting_answer: 'TRUE',
            },
          },
        ]}
      />
    );
    expect(screen.getByText('Tempting answer:')).toBeInTheDocument();
    expect(screen.getByText('Tempting answer:').parentElement).toHaveTextContent('TRUE');
  });
  it('rejects accepted, unavailable and unsupported tempting answers', () => {
    expect(temptingAnswer({ ...explanation, tempting_answer: 'FALSE' })).toBeNull();
    expect(temptingAnswer({ correct_answer: 'B/C', tempting_answer: 'C' })).toBeNull();
    for (const tempting_answer of ['FALSE', 'A'])
      expect(() =>
        validateReadingExplanation(
          { ...explanation, trap: 'Watch the quantity.', tempting_answer },
          question,
          7,
          passage
        )
      ).toThrow('available wrong choice');
    expect(() =>
      validateReadingExplanation({ ...explanation, tempting_answer: 'TRUE' }, question, 7, passage)
    ).toThrow('short trap');
    expect(
      validateReadingExplanation(
        { ...explanation, trap: 'Watch the quantity.', tempting_answer: 'TRUE' },
        question,
        7,
        passage
      ).tempting_answer
    ).toBe('TRUE');
  });
  it('uses scoring aliases to hide accepted words and only imports source-grounded distractor words', () => {
    expect(
      temptingAnswer({ correct_answer: '(sumatran) orangutan', tempting_answer: 'orangutan' })
    ).toBeNull();
    const q = { question_number: 1, type: 'short_answer', correct_answer: 'pouch' };
    const e = {
      correct_answer: 'pouch',
      why_correct: 'Young live in the pouch.',
      passage_highlight: 'Young live in a pouch, then a lair.',
      trap: 'The gap asks where newborns stay, not where older young hide.',
      tempting_answer: 'lair',
    };
    expect(validateReadingExplanation(e, q, 1, e.passage_highlight).tempting_answer).toBe('lair');
    expect(() =>
      validateReadingExplanation({ ...e, tempting_answer: 'air' }, q, 1, e.passage_highlight)
    ).toThrow('available wrong choice');
  });
  it('shows a short optional trap without changing legacy explanations', () => {
    const trap = 'A proposal does not tell you whether it worked.';
    const { rerender } = render(
      <ExplanationBody entries={[{ key: '10', data: { ...explanation, trap } }]} />
    );
    expect(screen.getByText('Common trap:')).toBeInTheDocument();
    expect(screen.getByText(trap, { exact: false })).toBeInTheDocument();
    rerender(<ExplanationBody entries={[{ key: '10', data: explanation }]} />);
    expect(screen.queryByText('Common trap:')).not.toBeInTheDocument();
    expect(() =>
      validateReadingExplanation({ ...explanation, trap: 'x'.repeat(181) }, question, 7, passage)
    ).toThrow('180 characters');
  });
  it('shows the reason first and keeps supporting details expandable', () => {
    const { container } = render(<ExplanationBody entries={[{ key: '7', data: explanation }]} />);
    expect(screen.getByText('Answer: FALSE')).toBeInTheDocument();
    expect(screen.getByText(explanation.why_correct)).toBeInTheDocument();
    const details = container.querySelectorAll('details');
    expect(details).toHaveLength(2);
    expect([...details].every((element) => !element.open)).toBe(true);
    fireEvent.click(screen.getByText('Key wording'));
    expect(container.querySelector('details').open).toBe(true);
  });
  it('puts the student’s chosen distractor beside the reason and never calls a correct option wrong', () => {
    render(
      <ExplanationBody
        userAnswer="TRUE"
        entries={[
          {
            key: '7',
            data: {
              ...explanation,
              why_wrong: { ...explanation.why_wrong, FALSE: 'Incorrectly labelled correct choice' },
            },
          },
        ]}
      />
    );
    expect(screen.getByText('Your answer: TRUE')).toBeInTheDocument();
    expect(screen.queryByText('Incorrectly labelled correct choice')).not.toBeInTheDocument();
  });
  it('excludes both accepted multi-select choices from distractor notes', () => {
    render(
      <ExplanationBody
        userAnswer={['B', 'C']}
        entries={[
          {
            key: '21',
            data: {
              ...explanation,
              correct_answer: 'B/C',
              why_wrong: {
                A: 'Membership growth is not described.',
                B: 'Accepted B',
                C: 'Accepted C',
              },
            },
          },
        ]}
      />
    );
    expect(screen.queryByText('Accepted B')).not.toBeInTheDocument();
    expect(screen.queryByText('Accepted C')).not.toBeInTheDocument();
    expect(screen.getByText('Answer: B / C')).toBeInTheDocument();
  });
});

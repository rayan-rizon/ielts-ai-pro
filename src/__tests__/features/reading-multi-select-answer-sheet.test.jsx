import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AnswerInputItem from '@/features/testing/reading/components/ReadingTestSheet/AnswerInputItem';
import { buildAnswerEntriesForQuestion } from '@/features/testing/reading/components/ReadingTestSheet/entryBuilders';
import { calculateTestResults } from '@/features/testing/reading/components/ReadingTest/utils/scoreCalculator';

const question = {
  id: 'stadium-advantages',
  type: 'multiple_choice',
  allow_multiple: true,
  question_count: 2,
  question_number: 23,
  correct_answer: JSON.stringify([
    'C. facilitating research into solar and wind energy solutions',
    'D. enabling local residents to reduce their consumption of electricity',
  ]),
};

describe('Reading multi-select answer sheet', () => {
  it('assigns each numbered box its own answer from imported correct_answer data', () => {
    expect(buildAnswerEntriesForQuestion(question, 23)).toMatchObject([
      {
        globalNum: 23,
        subId: 0,
        correctAnswer: 'C. facilitating research into solar and wind energy solutions',
      },
      {
        globalNum: 24,
        subId: 1,
        correctAnswer: 'D. enabling local residents to reduce their consumption of electricity',
      },
    ]);
  });

  it('shows individual selected and correct letters after the test is finished', () => {
    const entries = buildAnswerEntriesForQuestion(question, 23);
    const sharedProps = {
      question,
      answers: { [question.id]: 'C, D' },
      handleAnswerChange: vi.fn(),
      isFinished: true,
    };

    render(
      <>
        <AnswerInputItem {...sharedProps} {...entries[0]} />
        <AnswerInputItem {...sharedProps} {...entries[1]} />
      </>
    );

    expect(screen.getAllByText('C')).toHaveLength(2);
    expect(screen.getAllByText('D')).toHaveLength(2);
    expect(screen.queryByText('C, D')).not.toBeInTheDocument();
  });

  it('scores the two correct letters regardless of their order', () => {
    const result = calculateTestResults([{ ...question, section: 1 }], { [question.id]: 'D, C' });

    expect(result.correctAnswers).toBe(2);
    expect(result.responseDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userAnswer: 'D', isCorrect: true }),
        expect.objectContaining({ userAnswer: 'C', isCorrect: true }),
      ])
    );
  });
});

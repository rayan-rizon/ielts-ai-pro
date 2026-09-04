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
      { globalNum: 23, subId: 0, correctAnswer: 'C' },
      { globalNum: 24, subId: 1, correctAnswer: 'D' },
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

    expect(screen.getAllByText('C')).toHaveLength(1);
    expect(screen.getAllByText('D')).toHaveLength(1);
    expect(screen.queryByText('C, D')).not.toBeInTheDocument();
    // Both letters are right, so no "Correct:" hint should be rendered.
    expect(screen.queryByText('Correct:')).not.toBeInTheDocument();
  });

  it('marks correct letters green even when imported answers keep the full option text', () => {
    const entries = buildAnswerEntriesForQuestion(question, 23);
    const sharedProps = {
      question,
      answers: { [question.id]: 'C, D' },
      handleAnswerChange: vi.fn(),
      isFinished: true,
    };

    const { container } = render(
      <>
        <AnswerInputItem {...sharedProps} {...entries[0]} />
        <AnswerInputItem {...sharedProps} {...entries[1]} />
      </>
    );

    expect(container.querySelectorAll('.answer-correct')).toHaveLength(2);
    expect(container.querySelectorAll('.answer-incorrect')).toHaveLength(0);
  });

  it('grades multi-select boxes as a set, ignoring the order they were ticked in', () => {
    const entries = buildAnswerEntriesForQuestion(question, 23);
    const sharedProps = {
      question,
      answers: { [question.id]: 'D, C' },
      handleAnswerChange: vi.fn(),
      isFinished: true,
    };

    const { container } = render(
      <>
        <AnswerInputItem {...sharedProps} {...entries[0]} />
        <AnswerInputItem {...sharedProps} {...entries[1]} />
      </>
    );

    expect(container.querySelectorAll('.answer-correct')).toHaveLength(2);
  });

  it('points a wrong box at a letter that is actually still missing', () => {
    const entries = buildAnswerEntriesForQuestion(question, 23);
    const sharedProps = {
      question,
      answers: { [question.id]: 'D, E' },
      handleAnswerChange: vi.fn(),
      isFinished: true,
    };

    const { container } = render(
      <>
        <AnswerInputItem {...sharedProps} {...entries[0]} />
        <AnswerInputItem {...sharedProps} {...entries[1]} />
      </>
    );

    expect(container.querySelectorAll('.answer-correct')).toHaveLength(1);
    expect(container.querySelectorAll('.answer-incorrect')).toHaveLength(1);
    // D was already matched, so the wrong box must point at C, not at D.
    expect(screen.getByText('C')).toBeInTheDocument();
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

  // Regression: IELTS 18 Academic 2023 Test 4, questions 12-13.
  it('renders a partially correct group with one green and one red box', () => {
    const greenRoofs = {
      id: 'green-roofs-12-13',
      type: 'multiple_choice',
      allow_multiple: true,
      question_count: 2,
      question_number: 12,
      correct_answer: JSON.stringify([
        'A. to provide habitats for a wide range of species',
        'D. to generate power from a sustainable source',
      ]),
    };
    const entries = buildAnswerEntriesForQuestion(greenRoofs, 12);
    const sharedProps = {
      question: greenRoofs,
      answers: { [greenRoofs.id]: 'B, D' },
      handleAnswerChange: vi.fn(),
      isFinished: true,
    };

    const { container } = render(
      <>
        <AnswerInputItem {...sharedProps} {...entries[0]} />
        <AnswerInputItem {...sharedProps} {...entries[1]} />
      </>
    );

    expect(container.querySelectorAll('.answer-correct')).toHaveLength(1);
    expect(container.querySelectorAll('.answer-incorrect')).toHaveLength(1);
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});

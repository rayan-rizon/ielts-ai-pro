import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FlowchartRenderer from '@/features/testing/reading/components/ReadingTest/components/QuestionRenderers/FlowchartRenderer';
import { scoreQuestion } from '@/features/testing/reading/components/ReadingTest/utils/scoreCalculator';

const question = {
  id: 'flow-1',
  type: 'flowchart',
  question_number: 8,
  flowchart: {
    box_title: 'Generating biogas for domestic use in Dunga',
    answer_mode: 'input',
    answers: { 0: 'cow dung', 1: 'fermentation', 2: 'pipes' },
    steps: [
      { id: 's1', text: 'First, add [gap] to the digester', gap_numbers: [8] },
      { id: 's2', text: 'Wait until [gap] is completed', gap_numbers: [9] },
      { id: 's3', text: 'Transport the gas through [gap]', gap_numbers: [10] },
      { id: 's4', text: 'Use the gas for cooking', gap_numbers: [] },
    ],
  },
};

describe('reading flow-chart learner experience', () => {
  it('renders every step as a box with arrows and numbered answer inputs', () => {
    render(
      <FlowchartRenderer
        question={question}
        answers={{}}
        onAnswerChange={vi.fn()}
        flaggedQuestions={new Set()}
        onToggleFlag={vi.fn()}
      />
    );

    expect(screen.getByText('Generating biogas for domestic use in Dunga')).toBeInTheDocument();
    expect(screen.getAllByTestId('flowchart-step')).toHaveLength(4);
    expect(screen.getAllByTestId('flowchart-arrow')).toHaveLength(3);
    expect(screen.getAllByPlaceholderText('answer')).toHaveLength(3);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('scores each flow-chart gap independently', () => {
    const result = scoreQuestion(question, {
      'flow-1_gap_8': 'cow dung',
      'flow-1_gap_9': 'wrong',
      'flow-1_gap_10': 'pipes',
    });

    expect(result.total).toBe(3);
    expect(result.correct).toBe(2);
    expect(result.details.map((detail) => detail.questionNumber)).toEqual([8, 9, 10]);
  });
});

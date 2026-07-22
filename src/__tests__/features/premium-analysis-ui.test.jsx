import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { DetailedAnalysisTab } from '@/components/results/test-results-modal/DetailedAnalysisTab';

const result = {
  bandScore: 5.5,
  correctAnswers: 7,
  totalQuestions: 10,
  typeStats: {
    note_completion: { correct: 3, total: 6 },
    multiple_choice: { correct: 4, total: 4 },
  },
  sectionStats: [
    { correct: 3, total: 5 },
    { correct: 4, total: 5 },
  ],
  passageTimes: { 0: 1180, 1: 1220 },
  responseDetails: [
    {
      questionId: 'q1',
      questionNumber: 1,
      type: 'note_completion',
      sectionIndex: 0,
      userAnswer: 'enviroment',
      correctAnswer: 'environment',
      isCorrect: false,
    },
    {
      questionId: 'q2',
      questionNumber: 2,
      type: 'note_completion',
      sectionIndex: 0,
      userAnswer: '',
      correctAnswer: 'river',
      isCorrect: null,
    },
    {
      questionId: 'q3',
      questionNumber: 3,
      type: 'note_completion',
      sectionIndex: 0,
      userAnswer: 'hill',
      correctAnswer: 'mountain',
      isCorrect: false,
    },
    ...Array.from({ length: 7 }, (_, index) => ({
      questionId: `correct-${index}`,
      questionNumber: index + 4,
      type: index < 3 ? 'note_completion' : 'multiple_choice',
      sectionIndex: index < 2 ? 0 : 1,
      userAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
    })),
  ],
};

function renderAnalysis(props) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DetailedAnalysisTab
          testResults={result}
          testType="reading"
          onUpgrade={() => {}}
          onReviewQuestion={() => {}}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('premium analysis UI', () => {
  it('limits free users to the two approved teasers', () => {
    renderAnalysis({ isPremium: false });
    expect(screen.getByText('Largest lost-point area')).toBeInTheDocument();
    expect(screen.getByText('Next-band gap')).toBeInTheDocument();
    expect(screen.queryByText('Score recovery map')).not.toBeInTheDocument();
    expect(screen.queryByText('Priority mistake queue')).not.toBeInTheDocument();
  });

  it('renders the paid coaching flow and routes mistake review', () => {
    const onReviewQuestion = vi.fn();
    renderAnalysis({ isPremium: true, onReviewQuestion });

    expect(screen.getByText('Score recovery map')).toBeInTheDocument();
    expect(screen.getByText('Target band planner')).toBeInTheDocument();
    expect(screen.getByText('Seven-day recovery plan')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /Review/i })[0]);
    expect(onReviewQuestion).toHaveBeenCalledWith(1);
  });

  it('keeps legacy plans on-screen but disables saving', () => {
    renderAnalysis({ isPremium: true, sessionId: null });
    expect(screen.getByRole('button', { name: 'Use as my 7-day plan' })).toBeDisabled();
    expect(screen.getByText(/Legacy results can use this plan on-screen/)).toBeInTheDocument();
  });
});

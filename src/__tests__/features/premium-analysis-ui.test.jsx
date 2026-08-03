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
  it('keeps result diagnosis useful for free users and consolidates paid coaching', () => {
    const onUpgrade = vi.fn();
    renderAnalysis({ isPremium: false, onUpgrade });

    expect(screen.getByText('Where you lost marks')).toBeInTheDocument();
    expect(screen.getByText('Review these answers first')).toBeInTheDocument();
    expect(screen.getByText('Passage performance')).toBeInTheDocument();
    expect(screen.getByText('Turn this result into a longer-term plan')).toBeInTheDocument();
    expect(screen.queryByText('Your score trend')).not.toBeInTheDocument();
    expect(screen.queryByText('Your 7-day practice plan')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /See upgrade/i }));
    expect(onUpgrade).toHaveBeenCalledOnce();
  });

  it('renders the paid coaching flow and routes mistake review', () => {
    const onReviewQuestion = vi.fn();
    renderAnalysis({ isPremium: true, onReviewQuestion });

    expect(screen.getByText('Where you lost marks')).toBeInTheDocument();
    expect(screen.getByText('Target band')).toBeInTheDocument();
    expect(screen.getByText('Answer mix')).toBeInTheDocument();
    expect(screen.getByText('Best recovery opportunity')).toBeInTheDocument();
    expect(screen.getByText('Review these answers first')).toBeInTheDocument();
    expect(screen.getByText('Your 7-day practice plan')).toBeInTheDocument();
    expect(screen.getByText('Review 3 priority mistakes')).toBeInTheDocument();
    expect(screen.queryByText('Mini retest and result comparison')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show all 7 days' }));
    expect(screen.getByText('Mini retest and result comparison')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /Review/i })[0]);
    expect(onReviewQuestion).toHaveBeenCalledWith(1);
  });

  it('keeps legacy plans on-screen but disables saving', () => {
    renderAnalysis({ isPremium: true, sessionId: null });
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeDisabled();
    expect(screen.getByText(/This older result can show the plan/)).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnswerKeySection } from '@/components/results/test-results-modal/AnswerKeySection';
import { TargetMilestoneCard } from '@/components/results/test-results-modal/TargetMilestoneCard';
import { normalizeTestResults } from '@/components/results/test-results-modal/normalizeTestResults';
import { calculateListeningBandScore, calculateReadingBandScore } from '@/lib/ieltsBandScore';

describe('test result overview', () => {
  it('uses the Listening answers map when colouring the review matrix', () => {
    render(
      <AnswerKeySection
        testResults={{
          totalQuestions: 3,
          correctAnswers: 1,
          answersMap: {
            first: { questionNumber: 1, userAnswer: 'library', isCorrect: true },
            second: { questionNumber: 2, userAnswer: '', isCorrect: false },
            third: { questionNumber: 3, userAnswer: '7', isCorrect: false },
          },
        }}
      />
    );

    expect(screen.getByRole('button', { name: '1' })).toHaveClass('text-emerald-600');
    expect(screen.getByText('Incorrect (1)')).toBeInTheDocument();
    expect(screen.getByText('Skipped (1)')).toBeInTheDocument();
  });

  it('uses Listening-specific raw-score milestones', () => {
    render(
      <TargetMilestoneCard
        testType="listening"
        onReviewAnswers={() => {}}
        testResults={{
          bandScore: 5.5,
          correctAnswers: 22,
          totalQuestions: 40,
          typeStats: { gap_fill: { correct: 10, total: 20 } },
        }}
      />
    );

    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Your next milestone')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Review Gap Fill/i })).toBeInTheDocument();
    expect(screen.queryByText('Review this focus area')).not.toBeInTheDocument();
  });

  it('recalculates stale saved score fields from the scored answers', () => {
    const normalized = normalizeTestResults(
      {
        bandScore: 2,
        percentage: 45,
        correctAnswers: 0,
        totalQuestions: 40,
        sectionStats: [{ correct: 0, total: 10, percentage: 50 }],
      },
      'reading'
    );

    expect(normalized.bandScore).toBe(0);
    expect(normalized.percentage).toBe(0);
    expect(normalized.sectionStats[0].percentage).toBe(0);
  });

  it('uses the shared Reading and Listening score tables', () => {
    expect(calculateReadingBandScore(33, 40)).toBe(7.5);
    expect(calculateReadingBandScore(32, 40)).toBe(7);
    expect(calculateListeningBandScore(32, 40)).toBe(7.5);
    expect(calculateListeningBandScore(31, 40)).toBe(7);
    expect(calculateReadingBandScore(0, 40)).toBe(0);
    expect(calculateListeningBandScore(0, 40)).toBe(0);
  });
});

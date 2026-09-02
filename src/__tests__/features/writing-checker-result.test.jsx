import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DemoResultPanel from '@/features/core/pages/checker/DemoResultPanel';

describe('public writing checker result', () => {
  it('shows the Task 1 image evidence used by the evaluator', () => {
    render(
      <DemoResultPanel
        activeTask="Task 1"
        feedback={{
          overallBand: 6,
          criteriaScores: {
            TaskAchievement: 6,
            CoherenceAndCohesion: 6,
            LexicalResource: 6,
            GrammaticalRangeAndAccuracy: 6,
          },
          strengths: [],
          weaknesses: [],
          suggestions: [],
          corrections: [],
          vocabularyEnhancements: [],
          taskAnalysis: {
            visualType: 'pie chart',
            responseVisualType: 'pie chart',
            alignment: 'aligned',
            visualReadable: true,
            observedFeatures: [
              'Dinner has the largest sodium share.',
              'Snacks have the largest added-sugar share.',
            ],
            limitations: '',
          },
        }}
      />
    );

    expect(screen.getByText('Task 1 visual evidence')).toBeInTheDocument();
    expect(screen.getByText(/classified the image as a/i)).toHaveTextContent('pie chart');
    expect(screen.getByText('Response aligned')).toBeInTheDocument();
    expect(screen.getByText('Dinner has the largest sodium share.')).toBeInTheDocument();
  });
});

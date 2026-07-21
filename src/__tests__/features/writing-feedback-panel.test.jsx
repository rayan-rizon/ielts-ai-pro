import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { FeedbackPanel } from '@/features/testing/writing/components/WritingTest/components/FeedbackPanel';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';

const feedback = {
  overallBand: 6,
  taskType: 'Task 2',
  wordCount: 271,
  summary: 'Your position is clear, but sentence accuracy is the main score limiter.',
  criteriaScores: {
    TaskResponse: 6.5,
    CoherenceAndCohesion: 6,
    LexicalResource: 6,
    GrammaticalRangeAndAccuracy: 5.5,
  },
  annotations: [
    {
      originalText: 'people is',
      type: 'grammar',
      suggestion: 'people are',
      explanation: 'A plural subject needs a plural verb.',
      severity: 'error',
    },
    {
      originalText: 'public transport',
      type: 'positive',
      suggestion: 'Keep this precise phrase.',
      explanation: 'It names the topic directly.',
      severity: 'positive',
    },
  ],
  strengths: ['A clear position is maintained throughout the response.'],
  priorities: [
    {
      criterion: 'Grammar',
      issue: 'Agreement errors recur in key sentences.',
      action: 'Check each verb against its subject during proofreading.',
    },
    {
      criterion: 'Task Response',
      issue: 'The second idea needs fuller support.',
      action: 'Add one specific explanation or example.',
    },
    {
      criterion: 'Lexical Resource',
      issue: 'Several topic words repeat.',
      action: 'Replace only repeated words where a natural alternative fits.',
    },
  ],
  corrections: [
    {
      original: 'people is',
      correction: 'people are',
      explanation: 'A plural subject needs a plural verb.',
    },
  ],
};

describe('Writing feedback panel', () => {
  beforeEach(() => {
    useWritingTestStore.setState({
      feedbacks: { 'Task 1': null, 'Task 2': feedback },
      currentFeedback: feedback,
    });
  });

  it('presents the compact score-first hierarchy', () => {
    render(<FeedbackPanel feedback={feedback} />);

    expect(screen.getByText('AI feedback summary')).toBeInTheDocument();
    expect(screen.getByLabelText('Band 6 out of 9')).toBeInTheDocument();
    expect(screen.getAllByText('Task Response')).toHaveLength(2);
    expect(screen.getByText('Key strengths')).toBeInTheDocument();
    expect(screen.getByText('Top 3 priorities')).toBeInTheDocument();
    expect(screen.getByText('Agreement errors recur in key sentences.')).toBeInTheDocument();
    expect(screen.queryByText('Areas to Improve')).not.toBeInTheDocument();
    expect(screen.queryByText('Tips for Next Time')).not.toBeInTheDocument();
  });

  it('shows why each correction matters without another click', () => {
    render(<FeedbackPanel feedback={feedback} />);

    expect(screen.getByText('Why it matters:')).toBeInTheDocument();
    expect(screen.getByText('A plural subject needs a plural verb.')).toBeInTheDocument();
  });

  it('cleans markdown and compacts verbose legacy feedback', () => {
    const legacyFeedback = {
      ...feedback,
      summary: '',
      priorities: [],
      strengths: [
        '**Task Achievement:** The response provides a clear and comprehensive description of all nine stages of bamboo fabric manufacturing, accurately reporting every minor feature from the diagram.',
      ],
      weaknesses: [
        '**Coherence and Cohesion:** While the flow is excellent, presenting the entire detailed description in a single long paragraph makes the response difficult to scan.',
      ],
      suggestions: [
        '**Paragraphing for clarity:** Break the process into two body paragraphs and keep each stage grouped logically.',
      ],
    };

    const { container } = render(<FeedbackPanel feedback={legacyFeedback} />);

    expect(container.textContent).not.toContain('**');
    expect(
      screen.getByText('A competent response. Focus next on coherence & cohesion.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The response provides a clear and comprehensive description/)
    ).toBeInTheDocument();
    expect(container.textContent).not.toContain('accurately reporting every minor feature');
  });
});

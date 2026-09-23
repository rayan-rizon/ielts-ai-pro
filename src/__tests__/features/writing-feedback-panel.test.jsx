import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { fireEvent, render as renderComponent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedbackPanel } from '@/features/testing/writing/components/WritingTest/components/FeedbackPanel';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';

const render = (ui) => renderComponent(<MemoryRouter>{ui}</MemoryRouter>);

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
      evidenceText: 'people is',
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

    expect(screen.getByText('Writing assessment')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PDF' })).toBeInTheDocument();
    expect(screen.getByLabelText('Band 6 out of 9')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Solid Task 2 response' })).toBeInTheDocument();
    expect(screen.getByText(/Priority · Grammar/)).toBeInTheDocument();
    expect(screen.getAllByText('Task Response')).toHaveLength(2);
    expect(screen.getByText('Key strengths')).toBeInTheDocument();
    expect(screen.getByText('Top 3 priorities')).toBeInTheDocument();
    expect(screen.getByText('Agreement errors recur in key sentences.')).toBeInTheDocument();
    expect(screen.queryByText('Areas to Improve')).not.toBeInTheDocument();
    expect(screen.queryByText('Tips for Next Time')).not.toBeInTheDocument();
  });

  it('links grammar feedback to Grammar Lab without sending writing issues to Practice Lab', () => {
    render(<FeedbackPanel feedback={feedback} />);
    expect(screen.getAllByRole('link', { name: 'Open Grammar Lab' }).length).toBeGreaterThan(0);
    screen
      .getAllByRole('link', { name: 'Open Grammar Lab' })
      .forEach((link) => expect(link).toHaveAttribute('href', '/grammar'));
    expect(screen.queryByRole('link', { name: /Practise this skill/ })).not.toBeInTheDocument();
  });

  it('shows why each correction matters without another click', () => {
    render(<FeedbackPanel feedback={feedback} />);

    expect(screen.getByText('Why it matters:')).toBeInTheDocument();
    expect(screen.getByText('A plural subject needs a plural verb.')).toBeInTheDocument();
  });

  it('explains an already requested review without exposing the server error code', () => {
    const handleGetFeedback = vi.fn();
    render(
      <FeedbackPanel
        feedback={null}
        feedbackError="duplicate_request"
        handleGetFeedback={handleGetFeedback}
      />
    );

    expect(screen.getByText('Check your saved review')).toBeInTheDocument();
    expect(screen.getByText(/A review was already requested for this answer/)).toBeInTheDocument();
    expect(screen.queryByText('duplicate_request')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Check for saved review' }));
    expect(handleGetFeedback).toHaveBeenCalledTimes(1);
  });

  it('presents a pending review as in progress', () => {
    render(
      <FeedbackPanel
        feedback={null}
        feedbackError="Your feedback is still being prepared. Check again in a moment; it will appear here when ready."
        handleGetFeedback={vi.fn()}
      />
    );

    expect(screen.getByText('Your review is being prepared')).toBeInTheDocument();
    expect(screen.getByText('Review in progress')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check for saved review' })).toBeInTheDocument();
    expect(screen.queryByText('Review interrupted')).not.toBeInTheDocument();
  });

  it('opens the exact annotated evidence for a grounded priority', () => {
    const onShowInEssay = vi.fn();
    render(<FeedbackPanel feedback={feedback} onShowInEssay={onShowInEssay} />);

    fireEvent.click(screen.getByRole('button', { name: 'Show in my essay' }));

    expect(onShowInEssay).toHaveBeenCalledWith(
      expect.objectContaining({ originalText: 'people is', suggestion: 'people are' })
    );
  });

  it('shows annotation-based improvements when there are no direct corrections', () => {
    const suggestionOnlyFeedback = {
      ...feedback,
      corrections: [],
      annotations: [
        {
          originalText: 'public transport',
          type: 'vocabulary',
          suggestion: 'Use a more precise transport term where the context allows.',
          explanation: 'A more exact word can make your point clearer.',
          severity: 'suggestion',
        },
      ],
    };

    render(<FeedbackPanel feedback={suggestionOnlyFeedback} />);

    expect(screen.getByText('Corrections & improvements')).toBeInTheDocument();
    expect(screen.getByText('Try this')).toBeInTheDocument();
    expect(
      screen.getByText('Use a more precise transport term where the context allows.')
    ).toBeInTheDocument();
  });

  it('keeps the improvements section visible when no sentence-level change is needed', () => {
    render(<FeedbackPanel feedback={{ ...feedback, corrections: [], annotations: [] }} />);

    expect(screen.getByText('Corrections & improvements')).toBeInTheDocument();
    expect(screen.getByText(/No sentence-level change was needed/)).toBeInTheDocument();
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
    expect(screen.getByRole('heading', { name: 'Solid Task 2 response' })).toBeInTheDocument();
    expect(
      screen.getByText(/The response provides a clear and comprehensive description/)
    ).toBeInTheDocument();
    expect(container.textContent).not.toContain('accurately reporting every minor feature');
  });

  it('lets learners expand only the feedback item that was shortened', () => {
    const verboseFeedback = {
      ...feedback,
      strengths: [
        'The response directly addresses both parts of the prompt, providing a clear position and relevant support throughout the essay.',
      ],
      priorities: [
        {
          criterion: 'Task Response',
          issue:
            'The second body paragraph needs a fuller explanation of how the proposed policy would affect families in practice.',
          action:
            'Add one specific example that shows how families would benefit, then connect it clearly to your main position.',
        },
      ],
    };

    render(<FeedbackPanel feedback={verboseFeedback} />);

    expect(screen.getByRole('button', { name: 'Show full strength 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show full priority 1' })).toBeInTheDocument();
    expect(screen.queryByText(/relevant support throughout the essay/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show full priority 1' }));

    expect(
      screen.getByText(
        'The second body paragraph needs a fuller explanation of how the proposed policy would affect families in practice.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show less priority 1' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Show full strength 1' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });
});

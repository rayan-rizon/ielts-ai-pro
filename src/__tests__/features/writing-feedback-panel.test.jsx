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

  it('leads with the band, the reason for it, the scores and one next step', () => {
    render(<FeedbackPanel feedback={feedback} />);

    expect(screen.getByRole('heading', { name: 'Task 2 result' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Band 6.0 out of 9' })).toBeInTheDocument();
    expect(screen.getAllByText('6.0').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /PDF/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Why you got 6.0' })).toBeInTheDocument();
    expect(
      screen.getByText('Your position is clear, but sentence accuracy is the main score limiter.')
    ).toBeInTheDocument();
    // Plain names, with the lowest area flagged.
    expect(screen.getAllByText('Task Response').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Coherence and Cohesion').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lexical Resource').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Grammatical Range and Accuracy').length).toBeGreaterThan(0);
    expect(screen.getByText('Lowest area')).toBeInTheDocument();
    expect(screen.queryByText('TR/TA')).not.toBeInTheDocument();
    // The first priority is the next step, in full; the rest follow.
    expect(
      screen.getByRole('heading', { name: 'Agreement errors recur in key sentences.' })
    ).toBeInTheDocument();
    expect(screen.getByText('Also work on')).toBeInTheDocument();
    expect(screen.getByText('The second idea needs fuller support.')).toBeInTheDocument();
    expect(screen.queryByText('Solid Task 2 response')).not.toBeInTheDocument();
  });

  it('links grammar feedback to Grammar Lab without sending writing issues to Practice Lab', () => {
    render(<FeedbackPanel feedback={feedback} />);
    expect(screen.getAllByRole('link', { name: 'Practise grammar' }).length).toBeGreaterThan(0);
    screen
      .getAllByRole('link', { name: 'Practise grammar' })
      .forEach((link) => expect(link).toHaveAttribute('href', '/grammar'));
    expect(screen.queryByRole('link', { name: /Practise this skill/ })).not.toBeInTheDocument();
  });

  it('shows every fix in full with the reason for it', () => {
    render(<FeedbackPanel feedback={feedback} />);

    expect(screen.getByText('Fix these')).toBeInTheDocument();
    expect(screen.getByText('Grammar and spelling')).toBeInTheDocument();
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

  it('opens the exact essay passage for the next step', () => {
    const onShowInEssay = vi.fn();
    render(<FeedbackPanel feedback={feedback} onShowInEssay={onShowInEssay} />);

    fireEvent.click(screen.getAllByRole('button', { name: /Show in my essay|in my essay/ })[0]);

    expect(onShowInEssay).toHaveBeenCalledWith(
      expect.objectContaining({ originalText: 'people is' })
    );
  });

  it('puts the word limit first when the essay is too short', () => {
    render(
      <FeedbackPanel feedback={{ ...feedback, isBelowMinimumWordCount: true, wordCount: 196 }} />
    );

    expect(screen.getByRole('heading', { name: 'Write at least 250 words' })).toBeInTheDocument();
    expect(screen.getByText(/Your essay has 196 words/)).toBeInTheDocument();
    // All three priorities move to "Also work on".
    expect(screen.getByText('Agreement errors recur in key sentences.')).toBeInTheDocument();
  });

  it('offers to revise only when revision practice is available', () => {
    const onRevise = vi.fn();
    const { rerender } = render(<FeedbackPanel feedback={feedback} onRevise={onRevise} />);
    expect(screen.queryByRole('button', { name: 'Revise your answer' })).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <FeedbackPanel
          feedback={feedback}
          onRevise={onRevise}
          coachSession={{ id: 's1' }}
          coachTaskType="Task 2"
        />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Revise your answer' }));
    expect(onRevise).toHaveBeenCalledTimes(1);
  });

  it('explains Task 1 chart matching in plain words', () => {
    render(
      <FeedbackPanel
        feedback={{
          ...feedback,
          taskType: 'Task 1',
          criteriaScores: {
            ...feedback.criteriaScores,
            TaskAchievement: 5,
            TaskResponse: undefined,
          },
          taskAnalysis: {
            visualType: 'line graph',
            responseVisualType: 'bar chart',
            alignment: 'mismatched',
            visualReadable: true,
            observedFeatures: ['Sales rise steadily'],
            limitations: '',
          },
        }}
      />
    );
    expect(screen.getByText('Chart check')).toBeInTheDocument();
    expect(
      screen.getByText(/The task shows a line graph, but your answer describes a bar chart/)
    ).toBeInTheDocument();
    expect(screen.getAllByText('Task Achievement').length).toBeGreaterThan(0);
  });

  it('shows advice as advice, never as text to paste in', () => {
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

    expect(screen.getByText('Word choice')).toBeInTheDocument();
    expect(
      screen.getByText(/Use a more precise transport term where the context allows/)
    ).toBeInTheDocument();
  });

  it('says plainly when no sentence needed a fix', () => {
    render(<FeedbackPanel feedback={{ ...feedback, corrections: [], annotations: [] }} />);

    expect(screen.getByText('Fix these')).toBeInTheDocument();
    expect(screen.getByText(/No sentence needed a correction/)).toBeInTheDocument();
  });

  it('cleans markdown from older saved reports and shows them in full', () => {
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
    expect(container.textContent).toContain('accurately reporting every minor feature');
    expect(
      screen.getByRole('heading', { name: /presenting the entire detailed description/ })
    ).toBeInTheDocument();
  });

  it('never cuts long feedback short', () => {
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

    const { container } = render(<FeedbackPanel feedback={verboseFeedback} />);

    expect(container.textContent).not.toContain('…');
    expect(screen.getByText(/relevant support throughout the essay/)).toBeInTheDocument();
    expect(screen.getByText(/connect it clearly to your main position/)).toBeInTheDocument();
  });
});

import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import GrammarAttempt from '@/features/grammar/components/GrammarAttempt';
import GrammarResults from '@/features/grammar/components/GrammarResults';

const result = (overrides = {}) => ({
  accuracy: 33,
  correctCount: 1,
  totalQuestions: 3,
  results: [
    {
      itemId: 'a',
      skillCode: 'grammar_clause_control',
      isCorrect: false,
      prompt: '___ cities improve bus reliability, more drivers may leave their cars at home.',
      submittedAnswer: 'Unless',
      correctAnswer: 'If',
      explanation: 'A realistic future condition uses present simple in the if-clause.',
    },
    {
      itemId: 'b',
      skillCode: 'grammar_verb_forms',
      isCorrect: true,
      prompt: 'The rate ___ in 2010.',
      submittedAnswer: 'fell',
      correctAnswer: 'fell',
      explanation: '',
    },
    {
      itemId: 'c',
      skillCode: 'grammar_clause_control',
      isCorrect: true,
      prompt: 'It rose ___ prices fell.',
      submittedAnswer: 'because',
      correctAnswer: 'because',
      explanation: '',
    },
  ],
  ...overrides,
});

const renderResults = (value) =>
  render(
    <MemoryRouter>
      <GrammarResults result={value} onDashboard={vi.fn()} onPracticeAgain={vi.fn()} />
    </MemoryRouter>
  );

describe('GrammarResults', () => {
  it('uses plain language a new learner understands', () => {
    renderResults(result());

    expect(screen.getByText('Your score')).toBeInTheDocument();
    expect(screen.getByText('1 of 3 correct')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How you did by skill' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Questions to review' })).toBeInTheDocument();
    expect(screen.getByText('Correct answer')).toBeInTheDocument();
    expect(screen.getByText(/not your IELTS Grammar band/)).toBeInTheDocument();
    expect(screen.queryByText(/observations|evidence/i)).not.toBeInTheDocument();
  });

  it('links each missed skill back to the units that teach it', () => {
    renderResults(result());

    const lessons = screen.getByRole('heading', { name: 'Review the lesson' }).closest('section');
    expect(within(lessons).getByRole('link', { name: /Unit 12: Conditionals/ })).toHaveAttribute(
      'href',
      '/grammar/guides/conditionals'
    );
    expect(within(lessons).queryByText(/Review verb forms/)).not.toBeInTheDocument();
  });

  it('celebrates a perfect set without inventing work to do', () => {
    renderResults(
      result({
        accuracy: 100,
        correctCount: 3,
        results: result().results.map((item) => ({ ...item, isCorrect: true })),
      })
    );

    expect(screen.getByRole('heading', { name: 'Every answer correct' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Review the lesson' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Questions to review' })).not.toBeInTheDocument();
  });
});

const attempt = (questionFormat, options = null) => ({
  attempt: { id: 'p1', mode: 'practice', totalQuestions: 1 },
  items: [
    {
      id: 'q1',
      skillCode: 'grammar_clause_control',
      difficulty: 6,
      questionFormat,
      prompt:
        questionFormat === 'error_correction'
          ? 'Although both figures rose, but rail use grew more.'
          : '___ cities improve bus reliability, more drivers may leave their cars.',
      options,
      academicContext: { module: 'writing', task: 'task_2', scenario: 'policy' },
    },
  ],
});

const renderAttempt = (data, props = {}) =>
  render(
    <MemoryRouter>
      <GrammarAttempt
        attemptData={data}
        isSubmitting={false}
        isCompleting={false}
        onSubmit={vi.fn()}
        onComplete={vi.fn()}
        onExit={vi.fn()}
        {...props}
      />
    </MemoryRouter>
  );

describe('GrammarAttempt guidance', () => {
  it('offers "Reset to original" only when the learner is correcting a sentence', () => {
    const { unmount } = renderAttempt(attempt('error_correction'));
    expect(screen.getByRole('button', { name: /Reset to original/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue(
      'Although both figures rose, but rail use grew more.'
    );
    unmount();

    renderAttempt(attempt('sentence_completion'));
    expect(screen.queryByRole('button', { name: /Reset to original/ })).not.toBeInTheDocument();
  });

  it('states the instruction once and adds a different hint, not a repeat', () => {
    renderAttempt(attempt('sentence_completion'));
    expect(screen.getAllByText(/Type the missing word or phrase/i)).toHaveLength(1);
    expect(screen.getByText(/The missing word must fit the grammar around it/)).toBeInTheDocument();
  });

  it('sends a learner who misses a question to the lesson, in a new tab so the set is kept', async () => {
    renderAttempt(attempt('form_selection', ['If', 'Unless', 'Despite']), {
      onSubmit: vi.fn().mockResolvedValue({
        isCorrect: false,
        feedback: { correctAnswer: 'If', explanation: 'Use present simple after if.' },
      }),
    });

    fireEvent.click(screen.getByRole('radio', { name: /Unless/ }));
    fireEvent.click(screen.getByRole('button', { name: /Check answer/ }));

    const link = await waitFor(() => screen.getByRole('link', { name: /Unit 12: Conditionals/ }));
    expect(link).toHaveAttribute('href', '/grammar/guides/conditionals');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('labels difficulty as the band being targeted', () => {
    renderAttempt(attempt('sentence_completion'));
    expect(screen.getByText('Band focus')).toBeInTheDocument();
    expect(screen.getByText('Band 6')).toBeInTheDocument();
  });
});

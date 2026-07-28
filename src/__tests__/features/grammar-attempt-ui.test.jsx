import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GrammarAttempt from '@/features/grammar/components/GrammarAttempt';

const diagnosticAttempt = {
  attempt: {
    id: 'diagnostic-1',
    mode: 'diagnostic',
    totalQuestions: 2,
  },
  items: [
    {
      id: 'question-1',
      skillCode: 'grammar_sentence_boundaries',
      difficulty: 6,
      questionFormat: 'sentence_completion',
      prompt:
        'Complete this Academic IELTS Writing task 2 sentence about education policy with the missing grammatical form: “University education should remain affordable. ___, students can reasonably share some of the cost.”',
      options: ['However', 'Although', 'Because'],
      academicContext: {
        module: 'writing',
        task: 'task_2',
        scenario: 'education policy position',
      },
    },
    {
      id: 'question-2',
      skillCode: 'grammar_verb_forms',
      difficulty: 5,
      questionFormat: 'form_selection',
      prompt: 'The unemployment rate ___ from 8% to 5% between 2010 and 2015.',
      options: ['fell', 'has fallen', 'falls'],
      academicContext: {
        module: 'writing',
        task: 'task_1',
        scenario: 'finished line graph period',
      },
    },
  ],
};

describe('GrammarAttempt', () => {
  it('shows concise exercise hierarchy and never exposes diagnostic correctness early', async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      accepted: true,
      isCorrect: null,
      feedback: null,
    });
    render(
      <GrammarAttempt
        attemptData={diagnosticAttempt}
        isSubmitting={false}
        isCompleting={false}
        onSubmit={onSubmit}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText('Writing · Task 2')).toBeInTheDocument();
    expect(screen.getByText('Choose the option that completes the sentence.')).toBeInTheDocument();
    expect(screen.getByText(/University education should remain affordable/)).toBeInTheDocument();
    expect(
      screen.queryByText(/Complete this Academic IELTS Writing task 2/)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Grading ignores capitalization/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: /However/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save & continue' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        attemptId: 'diagnostic-1',
        itemId: 'question-1',
        answer: 'However',
      })
    );
    expect(screen.getByText('Writing · Task 1')).toBeInTheDocument();
    expect(screen.queryByText('That works')).not.toBeInTheDocument();
    expect(screen.queryByText('Let’s repair it')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Question 1, answer saved/ }));
    expect(screen.getByRole('radio', { name: /However/ })).toHaveAttribute('aria-checked', 'true');
  });

  it('shows immediate grounded feedback during practice', async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      accepted: true,
      isCorrect: false,
      feedback: {
        correctAnswer: 'fell',
        explanation: 'A finished period requires the past simple.',
      },
    });
    render(
      <GrammarAttempt
        attemptData={{
          attempt: { id: 'practice-1', mode: 'practice', totalQuestions: 1 },
          items: [diagnosticAttempt.items[1]],
        }}
        isSubmitting={false}
        isCompleting={false}
        onSubmit={onSubmit}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: /has fallen/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(await screen.findByText('Let’s repair it')).toBeInTheDocument();
    expect(screen.getByText('Correct answer: fell')).toBeInTheDocument();
    expect(screen.getByText('A finished period requires the past simple.')).toBeInTheDocument();
  });

  it('hydrates a resumed attempt without asking the learner to answer again', () => {
    render(
      <GrammarAttempt
        attemptData={{
          attempt: { id: 'resume-1', mode: 'diagnostic', totalQuestions: 1 },
          items: [
            {
              ...diagnosticAttempt.items[0],
              response: { submittedAnswer: 'However', isCorrect: null },
              feedback: null,
            },
          ],
        }}
        isSubmitting={false}
        isCompleting={false}
        onSubmit={vi.fn()}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /However/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save answer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Complete diagnostic' })).toBeEnabled();
  });
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import GrammarPracticeKitsPanel from '@/features/grammar/components/GrammarPracticeKitsPanel';

describe('GrammarPracticeKitsPanel', () => {
  it('connects every guide kit to a five-question measured practice set', () => {
    const onStart = vi.fn();
    render(
      <MemoryRouter>
        <GrammarPracticeKitsPanel
          user={{ subscription_tier: 'pro' }}
          access={{ isPaid: true, dailyRemaining: 5 }}
          isStarting={false}
          onStart={onStart}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: 'IELTS grammar practice kits' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start Verbs & Time guide' })).toHaveAttribute(
      'href',
      '/grammar/guides/essential-tense-control'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Practise Verbs & Time' }));
    expect(onStart).toHaveBeenCalledWith({
      mode: 'practice',
      targetSkills: ['grammar_verb_forms'],
      questionCount: 5,
    });
  });

  it('sends a free learner to plans for a paid practice kit', () => {
    render(
      <MemoryRouter>
        <GrammarPracticeKitsPanel
          access={{ isPaid: false, dailyRemaining: 0 }}
          isStarting={false}
          onStart={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Practise Sentence Foundations' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Unlock Sentence Foundations' })).toHaveAttribute(
      'href',
      '/pricing'
    );
  });

  it('marks only a submitted matching practice kit as completed', () => {
    render(
      <MemoryRouter>
        <GrammarPracticeKitsPanel
          user={{ subscription_tier: 'premium' }}
          access={{ isPaid: true, dailyRemaining: 5 }}
          isStarting={false}
          onStart={vi.fn()}
          completedPracticeSkillSets={[['grammar_verb_forms']]}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Completed')).toHaveLength(1);
    expect(screen.queryByText('Included')).not.toBeInTheDocument();
  });
});

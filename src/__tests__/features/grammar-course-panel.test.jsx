import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import GrammarGuidesPanel from '@/features/grammar/components/GrammarGuidesPanel';

const renderPanel = (props) =>
  render(
    <MemoryRouter>
      <GrammarGuidesPanel isStarting={false} onStart={vi.fn()} {...props} />
    </MemoryRouter>
  );

describe('GrammarGuidesPanel (the grammar course)', () => {
  it('organises every guide into its part, in learning order', () => {
    renderPanel({
      user: { subscription_tier: 'pro' },
      access: { isPaid: true, dailyRemaining: 5 },
    });

    expect(screen.getByRole('heading', { name: 'Learn it, then practise it' })).toBeInTheDocument();
    ['Start here', 'Sentence Foundations', 'Verbs & Time', 'Grammatical Range'].forEach((title) =>
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    );
    expect(screen.getByRole('heading', { name: 'IELTS Accuracy Lab' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Grammar by IELTS task' })).toBeInTheDocument();
    expect(screen.getByText('of 19 units done').previousSibling).toHaveTextContent('0');
    expect(screen.getByRole('link', { name: /19\. Word forms and word families/ })).toHaveAttribute(
      'href',
      '/grammar/guides/word-forms-and-word-families'
    );
  });

  it('tells a new learner exactly where to begin', () => {
    renderPanel({
      user: { subscription_tier: 'free' },
      access: { isPaid: false, dailyRemaining: 5 },
    });

    const upNext = screen.getByText('Up next').closest('a');
    expect(upNext).toHaveAttribute('href', '/grammar/guides/start-here-how-grammar-lab-works');
    expect(within(upNext).getByText(/Start here: How Grammar Lab works/)).toBeInTheDocument();
  });

  it('moves "Up next" along as units are completed', () => {
    renderPanel({
      user: { subscription_tier: 'pro' },
      access: { isPaid: true, dailyRemaining: 5 },
      completedGuideSlugs: ['start-here-how-grammar-lab-works', 'complete-sentences-and-clauses'],
    });

    expect(screen.getByText('Up next').closest('a')).toHaveAttribute(
      'href',
      '/grammar/guides/subject-verb-agreement'
    );
    expect(screen.getByText('of 19 units done').previousSibling).toHaveTextContent('1');
  });

  it('lets a free learner open the free units inside a part that also holds paid ones', () => {
    renderPanel({
      user: { subscription_tier: 'free' },
      access: { isPaid: false, dailyRemaining: 5 },
    });

    const unit1 = screen.getByRole('link', { name: /1\. Complete sentences and clauses/ });
    expect(within(unit1).getByText('Open')).toBeInTheDocument();
    expect(within(unit1).getByText('Free')).toBeInTheDocument();

    const unit4 = screen.getByRole('link', { name: /4\. Articles: a, an, the and zero article/ });
    expect(within(unit4).getByText('Unlock')).toBeInTheDocument();
  });

  it('starts a five-question practice set for the skills in a part', () => {
    const onStart = vi.fn();
    renderPanel({
      user: { subscription_tier: 'free' },
      access: { isPaid: false, dailyRemaining: 3 },
      onStart,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Practise Verbs & Time' }));
    expect(onStart).toHaveBeenCalledWith({
      mode: 'practice',
      targetSkills: ['grammar_verb_forms'],
      questionCount: 5,
    });
  });

  it('offers practice only where a part has skills, and disables it when the allowance is used', () => {
    renderPanel({
      user: { subscription_tier: 'free' },
      access: { isPaid: false, dailyRemaining: 0 },
    });

    expect(screen.queryByRole('button', { name: 'Practise Start here' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Practise Grammar by IELTS task' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Practise Sentence Foundations' })).toBeDisabled();
  });

  it('filters guides by a search for a rule and recovers from an empty search', () => {
    renderPanel({
      user: { subscription_tier: 'pro' },
      access: { isPaid: true, dailyRemaining: 5 },
    });

    fireEvent.change(screen.getByRole('textbox', { name: 'Search grammar guides' }), {
      target: { value: 'articles' },
    });
    expect(screen.getByRole('link', { name: /4\. Articles/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Conditionals/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Up next')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Search grammar guides' }), {
      target: { value: 'zzzz' },
    });
    expect(screen.getByText('No matching guide')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Show all guides/ }));
    expect(screen.getByRole('link', { name: /Conditionals/ })).toBeInTheDocument();
  });

  it('marks a completed part’s units and updates the part counter', () => {
    renderPanel({
      user: { subscription_tier: 'pro' },
      access: { isPaid: true, dailyRemaining: 5 },
      completedGuideSlugs: ['essential-tense-control', 'gerunds-and-infinitives'],
    });

    expect(screen.getByText('2/3 done')).toBeInTheDocument();
    expect(
      within(screen.getByRole('link', { name: /6\. Essential tense control/ })).getByText(
        'Completed'
      )
    ).toBeInTheDocument();
  });
});

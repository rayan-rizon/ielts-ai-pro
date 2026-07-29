import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import GrammarGuidePage from '@/features/grammar/components/GrammarGuidePage';
import { getGrammarGuide } from '@/features/grammar/data/grammarGuideCatalog';

const resource = {
  slug: 'verb-forms-across-ielts-tasks',
  skill_code: 'grammar_verb_forms',
  title: 'Control verb forms across IELTS tasks',
  summary: 'Choose tense and voice from the time and meaning of the sentence.',
  estimated_minutes: 7,
  content_markdown: `
## The rule in 30 seconds
- Use **past simple** for a finished period.
- Incorrect: *The city expanded rapidly, housing became unaffordable.*
- Correct: *The city expanded rapidly, and housing became unaffordable.*
> The rate fell between 2000 and 2010.
## Check yourself
1. The figure ___ between 2012 and 2016.
## Final check
- Circle every time marker.
`,
};

describe('GrammarGuidePage', () => {
  it('renders a semantic, addressable full-page guide with a practice action', () => {
    const onPractice = vi.fn();
    render(
      <MemoryRouter>
        <GrammarGuidePage
          resource={resource}
          isStarting={false}
          onBack={vi.fn()}
          onPractice={onPractice}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: resource.title })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Guide contents' })).toBeInTheDocument();
    expect(screen.getByText('past simple')).toHaveClass('font-extrabold');
    expect(screen.getByText('The rate fell between 2000 and 2010.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Incorrect example' })).toHaveClass('text-rose-500');
    expect(screen.getByRole('img', { name: 'Correct example' })).toHaveClass('text-emerald-500');
    expect(screen.getByRole('link', { name: 'AI Learning Path' })).toHaveAttribute(
      'href',
      '/learning-path'
    );

    fireEvent.click(screen.getByRole('button', { name: /Practise this skill/ }));
    expect(onPractice).toHaveBeenCalledWith('grammar_verb_forms');
  });

  it('shows a useful not-found state', () => {
    const onBack = vi.fn();
    render(
      <MemoryRouter>
        <GrammarGuidePage resource={null} isStarting={false} onBack={onBack} onPractice={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Guide not found' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to Grammar Lab' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders workbook tables, subsection navigation, and interactive answer checking', () => {
    render(
      <MemoryRouter>
        <GrammarGuidePage
          resource={getGrammarGuide('essential-tense-control')}
          isStarting={false}
          onBack={vi.fn()}
          onPractice={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Since and for/ })).toHaveAttribute(
      'href',
      '#since-and-for'
    );
    expect(screen.getByRole('heading', { name: 'Check your practice' })).toBeInTheDocument();
    expect(screen.queryByText('Answer key')).not.toBeInTheDocument();
    expect(screen.queryByText('Suggested answer 1')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Compare answer for question 1' }));
    expect(screen.getByText('Suggested answer 1')).toBeInTheDocument();

    const selfMark = screen.getByRole('button', { name: 'I got this' });
    fireEvent.click(selfMark);
    expect(selfMark).toHaveAttribute('aria-pressed', 'true');
  });
});

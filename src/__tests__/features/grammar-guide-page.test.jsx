import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import GrammarGuidePage from '@/features/grammar/components/GrammarGuidePage';

const resource = {
  slug: 'verb-forms-across-ielts-tasks',
  skill_code: 'grammar_verb_forms',
  title: 'Control verb forms across IELTS tasks',
  summary: 'Choose tense and voice from the time and meaning of the sentence.',
  estimated_minutes: 7,
  content_markdown: `
## The rule in 30 seconds
- Use **past simple** for a finished period.
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
});

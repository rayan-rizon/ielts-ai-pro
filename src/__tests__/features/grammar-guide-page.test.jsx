import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
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
    const onSetCompletion = vi.fn();
    render(
      <MemoryRouter>
        <GrammarGuidePage
          resource={resource}
          isStarting={false}
          onBack={vi.fn()}
          onPractice={onPractice}
          onSetCompletion={onSetCompletion}
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
    expect(onSetCompletion).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Mark guide complete' }));
    expect(onSetCompletion).toHaveBeenCalledWith(true);
  });

  it('lets a learner explicitly reverse a completion choice', () => {
    const onSetCompletion = vi.fn();
    render(
      <MemoryRouter>
        <GrammarGuidePage
          resource={resource}
          user={{ subscription_tier: 'free' }}
          isStarting={false}
          isCompleted
          onBack={vi.fn()}
          onPractice={vi.fn()}
          onSetCompletion={onSetCompletion}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mark as incomplete' }));
    expect(onSetCompletion).toHaveBeenCalledWith(false);
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

  it('renders workbook tables, subsection navigation, and an interactive exercise', () => {
    render(
      <MemoryRouter>
        <GrammarGuidePage
          resource={getGrammarGuide('essential-tense-control')}
          user={{ subscription_tier: 'pro' }}
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
    expect(screen.queryByText('Model answer')).not.toBeInTheDocument();
    expect(screen.getByText('0/5 checked')).toBeInTheDocument();

    // A multiple-choice item is checked the moment it is chosen.
    const group = screen.getByRole('radiogroup', { name: 'Choices for question 1' });
    fireEvent.click(within(group).getByRole('radio', { name: 'built' }));
    expect(screen.getByText('Not quite')).toBeInTheDocument();
    expect(screen.getByText('Model answer')).toBeInTheDocument();
    expect(screen.getByText('1/5 checked · 0 correct')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Choices for question 1' })).getByRole(
        'radio',
        { name: 'has built' }
      )
    );
    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(screen.getByText('1/5 checked · 1 correct')).toBeInTheDocument();
  });

  it('checks a typed correction fairly: exact models pass, other answers are compared', () => {
    render(
      <MemoryRouter>
        <GrammarGuidePage
          resource={getGrammarGuide('nouns-countability-and-quantity')}
          user={{ subscription_tier: 'free' }}
          isStarting={false}
          onBack={vi.fn()}
          onPractice={vi.fn()}
        />
      </MemoryRouter>
    );

    // Pressing Check on an untouched sentence asks the learner to edit it first.
    fireEvent.click(screen.getAllByRole('button', { name: 'Check answer' })[0]);
    expect(screen.getByRole('alert')).toHaveTextContent(/still the original sentence/);
    expect(screen.getByText('0/5 checked')).toBeInTheDocument();

    const first = screen.getByRole('textbox', { name: 'Your answer to question 1' });
    // Correction items start from the learner's own copy of the sentence.
    expect(first).toHaveValue('The report provides several useful advices.');
    fireEvent.change(first, { target: { value: 'the report provides useful advice' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Check answer' })[0]);
    expect(screen.getByText('Correct')).toBeInTheDocument();

    // Not an exact model: never called "wrong", the learner compares and decides.
    fireEvent.change(screen.getByRole('textbox', { name: 'Your answer to question 2' }), {
      target: { value: 'There were less accidents.' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Check answer' })[0]);
    expect(screen.getByText('Compare with the model')).toBeInTheDocument();
    expect(screen.queryByText('Not quite')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Mine is also correct/ }));
    expect(screen.getByText('Marked as correct')).toBeInTheDocument();
  });

  it('lets a learner reveal an answer without attempting it, and remembers progress on this device', () => {
    window.localStorage.clear();
    const view = (
      <MemoryRouter>
        <GrammarGuidePage
          resource={getGrammarGuide('subject-verb-agreement')}
          user={{ subscription_tier: 'free' }}
          isStarting={false}
          onBack={vi.fn()}
          onPractice={vi.fn()}
        />
      </MemoryRouter>
    );
    const { unmount } = render(view);

    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Choices for question 1' })).getByRole(
        'radio',
        { name: 'has' }
      )
    );
    expect(screen.getByText('1/5 checked · 1 correct')).toBeInTheDocument();
    unmount();

    render(view);
    expect(screen.getByText('1/5 checked · 1 correct')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show all answers' }));
    expect(screen.getByText('5/5 checked · 1 correct')).toBeInTheDocument();
    expect(screen.getByText(/1 of 5 correct/)).toBeInTheDocument();
    window.localStorage.clear();
  });

  it('shows an upgrade gate instead of a locked workbook unit', () => {
    render(
      <MemoryRouter>
        <GrammarGuidePage
          resource={getGrammarGuide('essential-tense-control')}
          user={{ subscription_tier: 'free' }}
          isStarting={false}
          onBack={vi.fn()}
          onPractice={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Pro grammar guide' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View plans' })).toHaveAttribute('href', '/pricing');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('does not treat an admin role as a paid learner subscription', () => {
    render(
      <MemoryRouter>
        <GrammarGuidePage
          resource={getGrammarGuide('essential-tense-control')}
          user={{ subscription_tier: 'free', role: 'admin' }}
          isStarting={false}
          onBack={vi.fn()}
          onPractice={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Pro grammar guide' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders underscore-delimited examples as styled italics without raw underscore characters', () => {
    render(
      <MemoryRouter>
        <GrammarGuidePage
          resource={getGrammarGuide('complete-sentences-and-clauses')}
          user={{ subscription_tier: 'free' }}
          isStarting={false}
          onBack={vi.fn()}
          onPractice={vi.fn()}
        />
      </MemoryRouter>
    );

    // Verify italic example is rendered inside an <em> element
    const italicExample = screen.getByText('Public transport reduces congestion.');
    expect(italicExample.tagName).toBe('EM');
    expect(italicExample).toHaveClass('italic');

    // Ensure raw underscores are not rendered around the text
    expect(screen.queryByText(/_Public transport reduces congestion._/)).not.toBeInTheDocument();
    expect(screen.queryByText(/_The policy failed._/)).not.toBeInTheDocument();

    const secondItalic = screen.getByText('The policy failed.');
    expect(secondItalic.tagName).toBe('EM');
  });

  it('renders unified practice cards with sentence prompts, choices, and clean 1-based numbering', () => {
    window.localStorage.clear();
    render(
      <MemoryRouter>
        <GrammarGuidePage
          resource={getGrammarGuide('complete-sentences-and-clauses')}
          user={{ subscription_tier: 'free' }}
          isStarting={false}
          onBack={vi.fn()}
          onPractice={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('Renewable energy creates jobs.')).toBeInTheDocument();
    expect(screen.queryByText('24')).not.toBeInTheDocument();

    const choices = within(screen.getByRole('radiogroup', { name: 'Choices for question 1' }));
    fireEvent.click(choices.getByRole('radio', { name: 'simple' }));
    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(choices.getByRole('radio', { name: 'simple' })).toBeDisabled();
    window.localStorage.clear();
  });

  it('shows every question in practices whose workbook key is written as one run of answers', () => {
    window.localStorage.clear();
    render(
      <MemoryRouter>
        <GrammarGuidePage
          resource={getGrammarGuide('subordination-and-logical-relationships')}
          user={{ subscription_tier: 'pro' }}
          isStarting={false}
          onBack={vi.fn()}
          onPractice={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('0/4 checked')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
  });

  it('tells a learner which units a practice set draws on, and uses plain step labels', () => {
    render(
      <MemoryRouter>
        <GrammarGuidePage
          resource={getGrammarGuide('conditionals')}
          user={{ subscription_tier: 'pro' }}
          isStarting={false}
          onBack={vi.fn()}
          onPractice={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('list', { name: 'How to use this unit' })).toBeInTheDocument();
    expect(screen.getByText(/Units 5, 10, 11, 12, 16, 17 all build/)).toBeInTheDocument();
  });

  it('renders the orientation guide for a brand-new learner, free of charge', () => {
    window.localStorage.clear();
    render(
      <MemoryRouter>
        <GrammarGuidePage
          resource={getGrammarGuide('start-here-how-grammar-lab-works')}
          user={{ subscription_tier: 'free' }}
          isStarting={false}
          onBack={vi.fn()}
          onPractice={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'How Grammar Lab works' })
    ).toBeInTheDocument();
    expect(screen.getByText('0/12 checked')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Start mixed practice/ })).toHaveLength(2);
  });

  it('renders every exercise of the mixed review, each with its own check card', () => {
    window.localStorage.clear();
    render(
      <MemoryRouter>
        <GrammarGuidePage
          resource={getGrammarGuide('mixed-ielts-review')}
          user={{ subscription_tier: 'pro' }}
          isStarting={false}
          onBack={vi.fn()}
          onPractice={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByRole('heading', { name: 'Check your practice' })).toHaveLength(4);
    expect(screen.getByText('0/12 checked')).toBeInTheDocument();
    expect(screen.getAllByText('0/6 checked')).toHaveLength(2);
    expect(screen.getByText('0/1 checked')).toBeInTheDocument();
  });

  it('lets wide tables scroll inside the guide instead of widening the phone layout', () => {
    render(
      <MemoryRouter>
        <GrammarGuidePage
          resource={getGrammarGuide('essential-tense-control')}
          user={{ subscription_tier: 'pro' }}
          isStarting={false}
          onBack={vi.fn()}
          onPractice={vi.fn()}
        />
      </MemoryRouter>
    );

    const article = screen.getByRole('table').closest('article');
    // A bare grid track grows to a table's min-width (556px inside a 351px phone).
    expect(article).toHaveClass('min-w-0');
    expect(article.parentElement).toHaveClass('grid-cols-[minmax(0,1fr)]');
    expect(screen.getByRole('table').parentElement).toHaveClass('overflow-x-auto');
  });
});

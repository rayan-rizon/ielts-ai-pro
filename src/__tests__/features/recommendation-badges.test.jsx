import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import GrammarGuidesPanel from '@/features/grammar/components/GrammarGuidesPanel';
import KitCard from '@/features/vocabulary/components/KitCard';
import { getVocabularyKit } from '@/features/vocabulary/data/vocabularyKits';

describe('result recommendation badges', () => {
  it('marks only the specifically recommended grammar guide', () => {
    render(
      <MemoryRouter>
        <GrammarGuidesPanel
          user={{ subscription_tier: 'premium' }}
          completedGuideSlugs={[]}
          recommendedSkill={{ skillCode: 'grammar_agreement_number' }}
          resultEvidenceCount={2}
          recommendations={[
            {
              slug: 'subject-verb-agreement',
              reason: 'Your Writing feedback flagged subject–verb agreement.',
            },
          ]}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByLabelText('Recommended: Your Writing feedback flagged subject–verb agreement.')
    ).toBeInTheDocument();
    expect(screen.getAllByText('Recommended')).toHaveLength(1);
    expect(screen.getByText(/based on 2 completed results/i)).toBeInTheDocument();
  });

  it('keeps the Grammar Lab selected skill visibly actionable when cross-test data is unavailable', () => {
    render(
      <MemoryRouter>
        <GrammarGuidesPanel
          user={{ subscription_tier: 'premium' }}
          completedGuideSlugs={[]}
          recommendedSkill={{
            skillCode: 'grammar_articles_determiners',
            label: 'Articles and determiners',
            observations: 5,
            mastery: 0.7,
          }}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByLabelText(
        'Recommended: Your Grammar Lab result shows 70% mastery in articles and determiners.'
      )
    ).toBeInTheDocument();
    expect(screen.getAllByText('Recommended')).toHaveLength(1);
  });

  it('adds an accessible badge to a recommended vocabulary kit card', () => {
    render(
      <MemoryRouter>
        <KitCard
          kit={getVocabularyKit('band-7-vocabulary-builder')}
          user={{ subscription_tier: 'pro' }}
          allVocabulary={[]}
          recommendation={{
            reason: 'Your Speaking Lexical Resource is Band 5.5 against a Band 7.0 target.',
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /recommended from your results/i })
    ).toBeInTheDocument();
  });
});

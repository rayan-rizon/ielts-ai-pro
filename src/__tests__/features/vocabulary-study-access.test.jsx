import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import VocabularyStudyView from '@/features/vocabulary/components/VocabularyStudyView';

const proKit = {
  access_tier: 'pro',
  title: 'Academic Collocations',
  description: 'High-value phrases for IELTS tasks.',
  content: JSON.stringify([
    {
      word: 'correlation',
      definition: 'A mutual relationship',
      example: 'A correlation appeared.',
    },
  ]),
};

describe('VocabularyStudyView entitlement', () => {
  it('locks a Pro kit for a free admin learner account', () => {
    render(
      <VocabularyStudyView resource={proKit} user={{ subscription_tier: 'free', role: 'admin' }} />
    );

    expect(screen.getByRole('heading', { name: 'Pro vocabulary kit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View plans' })).toBeInTheDocument();
    expect(screen.queryByText('correlation')).not.toBeInTheDocument();
  });
});

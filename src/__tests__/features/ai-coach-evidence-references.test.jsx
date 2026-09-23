import { describe, expect, it } from 'vitest';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { EvidenceRefs } from '@/features/ai-coach/components/EvidenceRefs';
import {
  formatEvidenceClaim,
  formatEvidenceReference,
} from '@/features/ai-coach/utils/evidenceReferences';

describe('AI Coach evidence presentation', () => {
  it('turns legacy result data into a readable source and details', () => {
    const evidence = formatEvidenceReference({
      id: 'result:latest',
      claim: 'reading practice result: {"score":1,"completedAt":"2026-09-09T20:21:20.498Z"}',
    });

    expect(evidence.title).toBe('Reading Practice Result');
    expect(evidence.details).toEqual(['score 1', 'completed Sep 9, 2026']);
  });

  it('keeps a skill name together and makes its sample count student readable', () => {
    const evidence = formatEvidenceReference({
      id: 'skill:reading_matching_features',
      claim: 'reading_matching_features: {"mastery":0.01,"observations":2147}',
    });

    expect(evidence.title).toBe('Reading · Matching Features');
    expect(evidence.details).toEqual(['mastery estimate 1%', '2,147 practice records']);
    expect(formatEvidenceClaim({ claim: 'reading_matching_features' })).toBe(
      'Reading · Matching Features'
    );
  });

  it('preserves a source-only citation without inventing details', () => {
    expect(formatEvidenceReference({ claim: 'Learning Path target' })).toEqual({
      claim: 'Learning Path target',
      title: 'Learning Path target',
      details: [],
    });
  });

  it('renders evidence as a labelled, responsive list with source details separated', () => {
    render(
      <EvidenceRefs
        refs={[
          {
            id: 'result:latest',
            claim: 'reading practice result: {"score":1,"completedAt":"2026-09-09T20:21:20.498Z"}',
          },
          {
            id: 'skill:reading_matching_features',
            claim: 'reading_matching_features: {"mastery":0.01,"observations":2147}',
          },
        ]}
      />
    );

    const region = screen.getByRole('region', { name: 'Evidence used' });
    const list = within(region).getByRole('list');
    expect(list).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(region).getByText('2 sources')).toBeInTheDocument();
    expect(within(region).getByText('Reading Practice Result')).toBeInTheDocument();
    expect(within(region).getByText('2,147 practice records')).toBeInTheDocument();
  });
});

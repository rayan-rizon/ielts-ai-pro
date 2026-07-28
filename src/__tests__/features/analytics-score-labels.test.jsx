import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatCards from '@/features/analytics/components/StatCards';

const baseStats = {
  scoredTests: 8,
  totalTests: 8,
  avgScore: '5.5',
  targetScore: 7,
  overallEstimate: 6,
  studyHours: 4,
  vocabCount: 12,
  improvement: '+0.5',
  efficiency: {},
};

describe('Analytics score labels', () => {
  it('labels a latest four-module score as an overall estimate', () => {
    render(<StatCards stats={{ ...baseStats, modulesWithData: 4 }} />);

    expect(screen.getByText('Overall estimate')).toBeInTheDocument();
    expect(screen.getByText('Latest score from all 4 modules • ▲ 0.5 bands')).toBeInTheDocument();
    expect(screen.getByText('1.0 band to target')).toBeInTheDocument();
  });

  it('does not present partial module data as an overall estimate', () => {
    render(<StatCards stats={{ ...baseStats, modulesWithData: 3 }} />);

    expect(screen.getByText('Practice average')).toBeInTheDocument();
    expect(screen.getByText('Completed-practice average • ▲ 0.5 bands')).toBeInTheDocument();
    expect(screen.queryByText('Overall estimate')).not.toBeInTheDocument();
  });

  it('uses the qualified overall estimate for the target gap without a negative label', () => {
    render(
      <StatCards
        stats={{ ...baseStats, avgScore: '3.0', overallEstimate: 2.5, modulesWithData: 4 }}
      />
    );

    expect(screen.getByText('4.5 bands to target')).toBeInTheDocument();
    expect(screen.queryByText(/Gap: -/)).not.toBeInTheDocument();
  });
});

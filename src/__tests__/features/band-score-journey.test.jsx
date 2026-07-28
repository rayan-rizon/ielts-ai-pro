import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import BandScoreJourney from '@/features/analytics/components/BandScoreJourney';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  CartesianGrid: () => null,
  Line: () => null,
  ReferenceLine: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const props = {
  targetScore: 7,
  moduleHistory: {
    reading: [
      { date: 'Jul 1', score: 5 },
      { date: 'Jul 8', score: 5.5 },
      { date: 'Jul 15', score: 6.5 },
    ],
    writing: [{ date: 'Jul 4', score: 6 }],
    listening: [],
    speaking: [{ date: 'Jul 6', score: 6.5 }],
  },
  overallProgress: {
    qualified: false,
    current: null,
    history: [],
    hasTrend: false,
  },
};

function renderProgress(nextProps = props) {
  return render(
    <MemoryRouter>
      <BandScoreJourney {...nextProps} />
    </MemoryRouter>
  );
}

describe('Band Progress interactions', () => {
  it('shows the real Reading history and latest same-module change', () => {
    renderProgress();

    expect(screen.getByRole('heading', { name: 'Band Progress' })).toBeInTheDocument();
    expect(screen.getByText('Change +1.0')).toBeInTheDocument();
    expect(screen.getByText('6.5')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('switches modules and reports when one result cannot form a trend', () => {
    renderProgress();

    fireEvent.click(screen.getByRole('tab', { name: 'Writing' }));
    expect(screen.getByText('More results needed for a trend')).toBeInTheDocument();
    expect(screen.getByText('6.0')).toBeInTheDocument();
  });

  it('locks Overall until every module has a scored result', () => {
    renderProgress();

    fireEvent.click(screen.getByRole('tab', { name: 'Overall' }));
    expect(screen.getByText('Overall needs all four modules')).toBeInTheDocument();
  });

  it('supports keyboard tab navigation', () => {
    renderProgress();

    const reading = screen.getByRole('tab', { name: 'Reading' });
    reading.focus();
    fireEvent.keyDown(reading, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Writing' })).toHaveAttribute('aria-selected', 'true');
  });

  it('shows a qualified Overall estimate without inventing a trend', () => {
    renderProgress({
      ...props,
      overallProgress: {
        qualified: true,
        current: 6.5,
        history: [{ date: 'Current', score: 6.5 }],
        hasTrend: false,
      },
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Overall' }));
    expect(screen.getByText('6.5')).toBeInTheDocument();
    expect(screen.getByText('More results needed for a trend')).toBeInTheDocument();
  });
});

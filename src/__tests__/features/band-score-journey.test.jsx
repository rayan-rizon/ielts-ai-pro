import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import BandScoreJourney from '@/features/analytics/components/BandScoreJourney';

const journeyProps = {
  currentScore: 6.5,
  targetScore: 7.5,
  testHistory: [
    { date: 'Jul 1', score: 5 },
    { date: 'Jul 8', score: 5.5 },
    { date: 'Jul 15', score: 6.5 },
  ],
  moduleStats: [{ type: 'reading', avg: 6, count: 3 }],
};

function renderJourney() {
  return render(
    <MemoryRouter>
      <BandScoreJourney {...journeyProps} />
    </MemoryRouter>
  );
}

describe('Band score journey interactions', () => {
  it('draws one continuous path after mounting', async () => {
    const { container } = renderJourney();
    const animatedPath = container.querySelector('path[stroke-dasharray="1"]');

    expect(animatedPath).toBeTruthy();
    await waitFor(() => expect(animatedPath).toHaveAttribute('stroke-dashoffset', '0'));
  });

  it('shows and toggles milestone details when a node is clicked', () => {
    renderJourney();
    const milestone = screen.getByRole('button', { name: /Band 5.5: Foundation/ });

    fireEvent.click(milestone);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Band 5.5');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Milestone completed');

    fireEvent.click(milestone);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import RecentPracticeHistory from '@/features/analytics/components/RecentPracticeHistory';

const writingSession = {
  id: 'writing-session-1',
  type: 'writing',
  title: 'Academic Task 2 practice',
  score: 6.5,
  accuracy: null,
  durationMinutes: 32,
  date: '2026-07-28T10:00:00.000Z',
  resultData: {},
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

describe('Recent practice history results', () => {
  it('opens the full annotated Writing result instead of the generic summary dialog', () => {
    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <LocationProbe />
        <RecentPracticeHistory sessions={[writingSession]} user={{ id: 'learner-1' }} />
      </MemoryRouter>
    );

    fireEvent.click(
      within(screen.getByTestId('recent-practice-mobile-list')).getByRole('button', {
        name: 'View result for Academic Task 2 practice',
      })
    );

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/writing-task?sessionId=writing-session-1&view=true'
    );
    expect(screen.queryByText('Writing completed result')).not.toBeInTheDocument();
  });
});

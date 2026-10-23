import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import FeatureRequestCard from '@/features/dashboard/components/FeatureRequestCard';

const renderCard = () =>
  render(
    <MemoryRouter>
      <FeatureRequestCard />
    </MemoryRouter>
  );

describe('FeatureRequestCard', () => {
  beforeEach(() => window.localStorage.clear());

  it('links to the feature request board', () => {
    renderCard();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/feature-requests');
  });

  it('stays hidden after being dismissed', () => {
    const { unmount } = renderCard();
    fireEvent.click(screen.getByRole('button', { name: /hide feature request card/i }));
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    unmount();
    renderCard();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

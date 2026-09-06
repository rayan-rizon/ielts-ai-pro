import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LearnerMarketingSurface from '@/features/marketing/components/LearnerMarketingSurface';
import MarketingDelivery from '@/features/marketing/services/MarketingDelivery';

vi.mock('@/features/marketing/services/MarketingDelivery', () => ({
  default: {
    listActive: vi.fn(),
    getPreferences: vi.fn(),
    record: vi.fn(),
    feedback: vi.fn(),
    savePreferences: vi.fn(),
    linkFor: vi.fn(() => '/learning-path'),
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

class TestIntersectionObserver {
  observe() {}
  disconnect() {}
}

describe('Learner marketing surface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IntersectionObserver = TestIntersectionObserver;
  });

  it('shows the optional check-in when no learner guidance is active', async () => {
    MarketingDelivery.listActive.mockResolvedValue([]);
    MarketingDelivery.getPreferences.mockResolvedValue({ feeling_recorded_at: null });

    render(<LearnerMarketingSurface user={{ id: 'learner-1' }} dashboardOnly />);

    expect(await screen.findByText('How does your practice feel today?')).toBeInTheDocument();
  });

  it('does not stack an optional check-in with an active in-app suggestion', async () => {
    MarketingDelivery.listActive.mockResolvedValue([
      {
        id: 'delivery-1',
        channel: 'in_app',
        content: {
          title: 'Your next practice is ready',
          message: 'Continue when you are ready.',
          cta_label: 'Open practice',
          cta_url: '/learning-path',
        },
        intervention: { playbook_key: 'next_practice' },
      },
    ]);
    MarketingDelivery.getPreferences.mockResolvedValue({ feeling_recorded_at: null });

    render(<LearnerMarketingSurface user={{ id: 'learner-1' }} dashboardOnly />);

    expect(await screen.findByText('Your next practice is ready')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText('How does your practice feel today?')).not.toBeInTheDocument()
    );
  });
});

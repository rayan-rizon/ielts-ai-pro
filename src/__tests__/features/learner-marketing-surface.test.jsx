import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LearnerMarketingSurface from '@/features/marketing/components/LearnerMarketingSurface';
import MarketingDelivery from '@/features/marketing/services/MarketingDelivery';

vi.mock('@/features/marketing/services/MarketingDelivery', () => ({
  default: {
    listActive: vi.fn(),
    record: vi.fn(),
    feedback: vi.fn(),
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

  it('renders nothing when no learner guidance is active', async () => {
    MarketingDelivery.listActive.mockResolvedValue([]);

    const { container } = render(
      <LearnerMarketingSurface user={{ id: 'learner-1' }} dashboardOnly />
    );

    await waitFor(() => expect(MarketingDelivery.listActive).toHaveBeenCalledWith('learner-1'));
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('How is your practice going?')).not.toBeInTheDocument();
  });

  it('renders an active in-app suggestion and records its click', async () => {
    const delivery = {
      id: 'delivery-1',
      campaign_id: 'campaign-1',
      user_id: 'learner-1',
      channel: 'in_app',
      content: {
        title: 'Your next practice is ready',
        message: 'Continue when you are ready.',
        cta_label: 'Open practice',
        cta_url: '/learning-path',
      },
      intervention: {
        playbook_key: 'next_practice',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    };
    MarketingDelivery.listActive.mockResolvedValue([delivery]);

    render(<LearnerMarketingSurface user={{ id: 'learner-1' }} dashboardOnly />);

    expect(await screen.findByText('Your next practice is ready')).toBeInTheDocument();
    expect(screen.getByTestId('learner-in-app-notification')).toHaveClass('fixed', 'md:right-4');
    expect(screen.queryByText('Why this fits')).not.toBeInTheDocument();
    expect(screen.queryByText('Based on your saved result')).not.toBeInTheDocument();
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open practice/i })).toHaveAttribute(
      'href',
      '/learning-path'
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: /Open practice/i }));
    });
    await waitFor(() => {
      expect(MarketingDelivery.record).toHaveBeenCalledWith(delivery, 'clicked', {
        destination: '/learning-path',
      });
      expect(MarketingDelivery.feedback).toHaveBeenCalledWith(delivery, 'clicked', {
        metadata: { destination: '/learning-path' },
      });
    });
  });

  it('renders announcement banner and allows dismissing it', async () => {
    const bannerDelivery = {
      id: 'banner-1',
      channel: 'banner',
      content: {
        title: 'Platform Maintenance Notice',
        message: 'Scheduled downtime tonight.',
        cta_label: 'Learn more',
        cta_url: '/status',
      },
    };
    MarketingDelivery.listActive.mockResolvedValue([bannerDelivery]);

    render(<LearnerMarketingSurface user={{ id: 'learner-1' }} dashboardOnly />);

    expect(await screen.findByText('Platform Maintenance Notice')).toBeInTheDocument();
    const dismissBtn = screen.getByRole('button', { name: 'Dismiss message' });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });

    await waitFor(() => {
      expect(MarketingDelivery.feedback).toHaveBeenCalledWith(bannerDelivery, 'dismissed', {
        snoozedUntil: null,
      });
    });
  });
});

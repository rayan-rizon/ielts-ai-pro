import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

const deferred = () => {
  let resolve;
  const promise = new Promise((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
};

describe('Learner marketing surface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IntersectionObserver = TestIntersectionObserver;
  });

  it('does not flash the optional check-in while learner data is loading', async () => {
    const deliveries = deferred();
    const preferences = deferred();
    MarketingDelivery.listActive.mockReturnValue(deliveries.promise);
    MarketingDelivery.getPreferences.mockReturnValue(preferences.promise);

    render(<LearnerMarketingSurface user={{ id: 'learner-1' }} dashboardOnly />);

    expect(screen.queryByText('How is your practice going?')).not.toBeInTheDocument();

    deliveries.resolve([]);
    preferences.resolve({ feeling_recorded_at: new Date().toISOString() });
    await waitFor(() =>
      expect(screen.queryByText('How is your practice going?')).not.toBeInTheDocument()
    );
  });

  it('shows the optional check-in when no learner guidance is active', async () => {
    MarketingDelivery.listActive.mockResolvedValue([]);
    MarketingDelivery.getPreferences.mockResolvedValue({ feeling_recorded_at: null });

    render(<LearnerMarketingSurface user={{ id: 'learner-1' }} dashboardOnly />);

    expect(await screen.findByText('How is your practice going?')).toBeInTheDocument();
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
    expect(screen.getByTestId('learner-in-app-notification')).toHaveClass('fixed', 'md:right-4');
    expect(screen.getByText('Based on your saved result')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open practice/i })).toHaveAttribute(
      'href',
      '/learning-path'
    );
    await waitFor(() =>
      expect(screen.queryByText('How is your practice going?')).not.toBeInTheDocument()
    );
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
    MarketingDelivery.getPreferences.mockResolvedValue({ feeling_recorded_at: null });

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

  it('saves practice feeling when clicking a check-in option', async () => {
    MarketingDelivery.listActive.mockResolvedValue([]);
    MarketingDelivery.getPreferences.mockResolvedValue({ feeling_recorded_at: null });
    MarketingDelivery.savePreferences.mockResolvedValue({ ok: true });

    render(<LearnerMarketingSurface user={{ id: 'learner-1' }} dashboardOnly />);

    const goingWellBtn = await screen.findByRole('button', { name: 'Going well' });
    await act(async () => {
      fireEvent.click(goingWellBtn);
    });

    await waitFor(() => {
      expect(MarketingDelivery.savePreferences).toHaveBeenCalledWith(
        'learner-1',
        expect.objectContaining({ feeling: 'going_well' })
      );
    });
  });
});

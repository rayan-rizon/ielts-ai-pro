import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminOperationsPanel from '@/components/admin/marketing/AdminOperationsPanel';
import MarketingService from '@/features/admin/services/MarketingService';
vi.mock('@/features/admin/services/MarketingService', () => ({
  default: { adminReport: vi.fn() },
}));
const window = { since: '2026-08-07T00:00:00Z', until: '2026-09-06T00:00:00Z' };
const openWorkspace = () => fireEvent.click(screen.getByRole('button', { name: /Open/i }));
describe('Admin operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MarketingService.adminReport.mockImplementation(async (action) =>
      action === 'admin_briefing' ? { items: [], last_analysis: null } : {}
    );
  });
  it('does not present no recommendations as proof of health', async () => {
    render(<AdminOperationsPanel />);
    openWorkspace();
    expect(await screen.findByText('No new findings')).toBeInTheDocument();
    expect(screen.getByTitle(/not a full health check/)).toBeInTheDocument();
  });
  it('shows server counts and the reporting source after a question', async () => {
    MarketingService.adminReport.mockImplementation(async (action) =>
      action === 'admin_briefing'
        ? { items: [] }
        : {
            title: 'Checkout status',
            window,
            source: 'marketing_checkout_intents',
            facts: [{ id: 'settled', label: 'Settled', value: 42 }],
            limitation: 'Attempts, not subscribers',
            model: 'test',
          }
    );
    render(<AdminOperationsPanel />);
    openWorkspace();
    fireEvent.change(screen.getByRole('textbox', { name: 'Your question' }), {
      target: { value: 'What is the status of checkout attempts?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask', exact: true }));
    expect((await screen.findAllByText('42')).length).toBeGreaterThan(0);
    expect(screen.getByText('marketing_checkout_intents')).toBeInTheDocument();
  });
  it('clears previous results and exposes a failed question', async () => {
    MarketingService.adminReport.mockImplementation(async (action) => {
      if (action === 'admin_briefing') return { items: [] };
      throw new Error('Report unavailable');
    });
    render(<AdminOperationsPanel />);
    openWorkspace();
    fireEvent.change(screen.getByRole('textbox', { name: 'Your question' }), {
      target: { value: 'How many checkouts?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask', exact: true }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Report unavailable');
  });
  it('loads learner-specific history and previews saved content without sending', async () => {
    MarketingService.adminReport.mockImplementation(async (action) => {
      if (action === 'admin_briefing') return { items: [] };
      if (action === 'admin_learners')
        return { learners: [{ id: 'u', full_name: 'Test Learner', email: 'test@example.com' }] };
      return {
        window,
        truncated_sources: [],
        items: [
          {
            id: 'd',
            kind: 'deliveries',
            channel: 'in_app',
            status: 'delivered',
            at: window.until,
            content: { title: 'Saved practice', message: 'Your practice is ready' },
          },
        ],
      };
    });
    render(<AdminOperationsPanel />);
    openWorkspace();
    fireEvent.click(screen.getByRole('button', { name: 'Learner history' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Find learner' }), {
      target: { value: 'Test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Find learner' }));
    fireEvent.click(await screen.findByRole('button', { name: /Test Learner/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Preview message' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('Your practice is ready');
    await waitFor(() =>
      expect(MarketingService.adminReport).toHaveBeenCalledWith('admin_timeline', {
        user_id: 'u',
        days: 30,
      })
    );
    expect(
      MarketingService.adminReport.mock.calls.every(([action]) => action.startsWith('admin_'))
    ).toBe(true);
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('@/features/admin/services/BillingService', async () => {
  const actual = await vi.importActual('@/features/admin/services/BillingService');
  return {
    ...actual,
    BillingService: {
      ...actual.BillingService,
      getCustomerProfile: vi.fn().mockResolvedValue({
        user: {
          fullName: 'Victor Diaz',
          email: 'victor@example.com',
          createdAt: '2026-08-23T00:00:00Z',
        },
        subscription: { tier: 'premium', endDate: '2026-10-23T00:00:00Z' },
        payments: [],
        refunds: [],
        usage: {},
      }),
      endPaidAccess: vi.fn().mockResolvedValue({}),
    },
  };
});

import CustomerBillingSheet from '@/components/admin/billing/CustomerBillingSheet';
import { TooltipProvider } from '@/components/ui/tooltip';

describe('CustomerBillingSheet close controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a close button in the sticky header and fires onOpenChange(false)', async () => {
    const onOpenChange = vi.fn();
    render(
      <TooltipProvider>
        <CustomerBillingSheet
          userId="user-12345678"
          open={true}
          onOpenChange={onOpenChange}
          onChanged={vi.fn()}
        />
      </TooltipProvider>
    );

    const closeButtons = screen.getAllByRole('button', { name: /close review/i });
    expect(closeButtons.length).toBeGreaterThan(0);

    // Click the header close button
    fireEvent.click(closeButtons[0]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders a mobile dismiss button that closes the sheet', async () => {
    const onOpenChange = vi.fn();
    render(
      <TooltipProvider>
        <CustomerBillingSheet
          userId="user-12345678"
          open={true}
          onOpenChange={onOpenChange}
          onChanged={vi.fn()}
        />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Victor Diaz')).toBeInTheDocument();
    });

    const closeButtons = screen.getAllByRole('button', { name: /close review/i });
    // Header button + mobile bottom button
    expect(closeButtons.length).toBe(2);

    // Click the bottom mobile close button
    fireEvent.click(closeButtons[1]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not auto-focus the copy button on open', async () => {
    render(
      <TooltipProvider>
        <CustomerBillingSheet
          userId="user-12345678"
          open={true}
          onOpenChange={vi.fn()}
          onChanged={vi.fn()}
        />
      </TooltipProvider>
    );

    const copyIdBtn = screen.getByRole('button', { name: /copy user id/i });
    expect(document.activeElement).not.toBe(copyIdBtn);
  });
});

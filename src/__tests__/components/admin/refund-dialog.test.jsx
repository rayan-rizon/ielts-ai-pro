import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('@/features/admin/services/BillingService', async () => {
  const actual = await vi.importActual('@/features/admin/services/BillingService');
  return {
    ...actual,
    BillingService: {
      refundStripePayment: vi.fn().mockResolvedValue({ refund: { status: 'succeeded' } }),
      recordManualRefund: vi.fn().mockResolvedValue({ id: 'refund-1' }),
      endPaidAccess: vi.fn().mockResolvedValue({}),
    },
  };
});

import RefundDialog from '@/components/admin/billing/RefundDialog';
import { BillingService } from '@/features/admin/services/BillingService';
import {
  formatElapsed,
  formatMoney,
  verdictMeta,
  windowRemaining,
} from '@/components/admin/billing/billingFormat';

const payment = (overrides = {}) => ({
  id: 'payment-1',
  provider: 'stripe',
  amount: 14.99,
  currency: 'USD',
  status: 'approved',
  evidence: { verdict: 'eligible', refundableAmount: 14.99 },
  ...overrides,
});

const renderDialog = (props = {}) =>
  render(
    <RefundDialog
      payment={payment()}
      userId="user-1"
      open
      onOpenChange={vi.fn()}
      onDone={vi.fn()}
      {...props}
    />
  );

describe('RefundDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('asks for a second click before refunding through Stripe', async () => {
    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Refund through Stripe' }));
    expect(BillingService.refundStripePayment).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm $14.99 refund' }));
    await waitFor(() =>
      expect(BillingService.refundStripePayment).toHaveBeenCalledWith({
        paymentRequestId: 'payment-1',
        amount: 14.99,
        reason: 'unused_purchase',
        note: '',
        endAccess: true,
      })
    );
  });

  it('will not offer the unused-purchase reason when the evidence shows use', () => {
    renderDialog({ payment: payment({ evidence: { verdict: 'used', refundableAmount: 14.99 } }) });

    expect(screen.getByText('Evidence: Used after purchase')).toBeInTheDocument();
    expect(screen.getByText('Choose why this is being refunded.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refund through Stripe' })).toBeDisabled();
  });

  it('requires the bKash transaction ID before recording a manual refund', async () => {
    renderDialog({
      payment: payment({
        provider: 'bkash',
        currency: 'BDT',
        amount: 499,
        evidence: { verdict: 'eligible', refundableAmount: 499 },
      }),
    });

    const record = screen.getByRole('button', { name: 'Record refund' });
    expect(record).toBeDisabled();
    expect(screen.getByText(/Enter the bKash transaction ID/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Refund transaction ID'), {
      target: { value: 'BKR12345' },
    });
    fireEvent.click(record);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm ৳499 refund' }));

    await waitFor(() =>
      expect(BillingService.recordManualRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentRequestId: 'payment-1',
          amount: 499,
          providerRefundRef: 'BKR12345',
        })
      )
    );
    await waitFor(() =>
      expect(BillingService.endPaidAccess).toHaveBeenCalledWith({
        userId: 'user-1',
        refundId: 'refund-1',
      })
    );
    expect(BillingService.refundStripePayment).not.toHaveBeenCalled();
  });

  it('caps the amount at what is still refundable', () => {
    renderDialog({ payment: payment({ evidence: { verdict: 'eligible', refundableAmount: 5 } }) });

    fireEvent.change(screen.getByLabelText('Refund amount'), { target: { value: '9' } });
    expect(screen.getByText('At most $5.00 can be refunded.')).toBeInTheDocument();
  });
});

describe('billing formatting', () => {
  it('formats money, elapsed time and the remaining window', () => {
    expect(formatMoney(14.99, 'USD')).toBe('$14.99');
    expect(formatMoney(499, 'BDT')).toBe('৳499');
    expect(formatElapsed(63)).toBe('1h 3m');
    expect(formatElapsed(3000)).toBe('2d 2h');
    expect(windowRemaining('2026-01-01T00:00:00Z', Date.parse('2026-01-02T00:00:00Z'))).toBeNull();
    expect(windowRemaining('2026-01-01T01:00:00Z', Date.parse('2026-01-01T00:30:00Z'))).toBe('30m');
  });

  it('falls back safely for an unknown verdict', () => {
    expect(verdictMeta('something-new').label).toBe('Not paid');
    expect(verdictMeta('eligible').tone).toBe('ok');
  });
});

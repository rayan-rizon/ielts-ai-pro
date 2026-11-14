import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PaymentOverviewPanel from '@/components/admin/billing/PaymentOverviewPanel';
const row = {
  id: 'sub_1',
  userId: 'user-1',
  name: 'Learner One',
  email: 'one@example.com',
  tier: 'pro',
  provider: 'stripe',
  status: 'past_due',
  amount: 9.99,
  currency: 'USD',
  interval: 'month',
  periodEnd: '2026-12-08T00:00:00Z',
  invoice: {
    id: 'in_1',
    amountDue: 9.99,
    currency: 'USD',
    attempts: 3,
    nextRetryAt: '2026-11-16T01:17:25Z',
    failure: 'Your card number is incorrect.',
  },
};
const data = {
  subscriptions: [
    row,
    {
      ...row,
      id: 'sub_2',
      status: 'active',
      name: 'Active Learner',
      invoice: null,
      cancelAtPeriodEnd: true,
    },
  ],
  summary: { active: 1, manual: 0, attention: 1, ending: 1, unverified: 0, pending: 0 },
  complete: true,
  observedAt: '2026-11-14T10:00:00Z',
};
describe('payment overview panel', () => {
  it('shows failure evidence and a review action alongside accurate subscription states', () => {
    const review = vi.fn();
    render(<PaymentOverviewPanel data={data} onReview={review} onRefresh={vi.fn()} />);
    expect(screen.getByText('Your card number is incorrect.')).toBeInTheDocument();
    expect(screen.getByText(/3 attempts/)).toBeInTheDocument();
    expect(screen.getAllByText('Ends at period end').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Review failed payment for Learner One' }));
    expect(review).toHaveBeenCalledWith('user-1');
    fireEvent.click(screen.getByRole('button', { name: 'Active subscriptions' }));
    expect(screen.getAllByText('Active Learner').length).toBeGreaterThan(0);
    expect(within(screen.getByRole('table')).queryByText('Past due')).not.toBeInTheDocument();
  });
  it('does not show zero subscriptions while loading or after an error', () => {
    const { rerender } = render(<PaymentOverviewPanel loading onRefresh={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading subscription overview');
    rerender(<PaymentOverviewPanel error="Could not load billing overview" onRefresh={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load billing overview');
    expect(screen.queryByText('No subscriptions match')).not.toBeInTheDocument();
  });
});

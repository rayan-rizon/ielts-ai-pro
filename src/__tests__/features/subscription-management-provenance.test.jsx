import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SubscriptionSection from '@/features/settings/components/Sections/SubscriptionSection';
import PricingCard from '@/features/subscription/components/PricingCard';

const baseUser = {
  subscription_tier: 'premium',
  stripe_customer_id: 'cus_abandoned',
  subscription_end_date: '2026-10-01T00:00:00Z',
  subscription_amount: 15.99,
};

function show(user, showCancelDialog = false) {
  const props = {
    user,
    isOpeningPortal: false,
    isCancelling: false,
    showCancelDialog,
    setShowCancelDialog: vi.fn(),
    handleOpenCustomerPortal: vi.fn(),
    handleToggleCancellation: vi.fn(),
    navigate: vi.fn(),
  };
  render(<SubscriptionSection {...props} />);
  return props;
}

describe('billing provenance in settings', () => {
  it('does not offer Stripe actions for a manual or admin grant with an abandoned checkout customer', () => {
    const props = show({ ...baseUser, cancel_at_period_end: true });
    expect(screen.getByRole('heading', { name: 'Premium' })).toBeInTheDocument();
    expect(screen.getByText('Access until')).toBeInTheDocument();
    expect(screen.queryByText('Next charge')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancelling')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Manage Stripe billing' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request to end access' })).toBeInTheDocument();
    expect(props.handleToggleCancellation).not.toHaveBeenCalled();
  });

  it('preserves portal and cancellation controls for Stripe subscriptions', () => {
    const props = show({
      ...baseUser,
      stripe_subscription_id: 'sub_real',
      cancel_at_period_end: false,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Manage Stripe billing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel subscription' }));
    expect(props.handleOpenCustomerPortal).toHaveBeenCalledOnce();
    expect(props.setShowCancelDialog).toHaveBeenCalledWith(true);
    expect(screen.getByText('Next charge')).toBeInTheDocument();
  });

  it('explains the manual-access request without invoking Stripe cancellation', () => {
    const props = show(baseUser, true);
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'access stays unchanged until we confirm it'
    );
    expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:support@ieltsai.pro')
    );
    expect(props.handleToggleCancellation).not.toHaveBeenCalled();
  });
});

it('offers a Free-plan action for paid learners without claiming it already changed', () => {
  const onUpgrade = vi.fn();
  render(
    <PricingCard
      plan={{
        tier: 'free',
        name: 'Free',
        features: [],
        limitations: [],
        buttonText: 'Current Plan',
      }}
      displayPrice={0}
      isActive={false}
      isSubscribed
      isLoading={false}
      isPricingLoading={false}
      onUpgrade={onUpgrade}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Move to Free' }));
  expect(onUpgrade).toHaveBeenCalledWith('free');
  expect(screen.queryByRole('button', { name: 'Current plan' })).not.toBeInTheDocument();
});

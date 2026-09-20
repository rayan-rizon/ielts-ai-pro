import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GrowthDecisionPanel from '@/components/admin/marketing/GrowthDecisionPanel';

describe('GrowthDecisionPanel', () => {
  const growth = {
    stages: [
      { key: 'signed_up', label: 'Signed up', value: 100 },
      { key: 'onboarded', label: 'Onboarded', value: 70 },
      { key: 'practiced', label: 'Practiced', value: 50 },
      { key: 'pricing_interest', label: 'Pricing interest', value: 36 },
      { key: 'checkout_started', label: 'Checkout', value: 5 },
      { key: 'paid', label: 'Paid', value: 1 },
    ],
    cohorts: [
      {
        key: 'high_intent_free',
        label: 'High-intent free',
        count: 12,
        timing: 'Next active session',
        channel: 'in_app',
        action: 'Show value',
      },
    ],
    coverage: { note: 'Intent tracking has a known start date.' },
  };

  it('names the largest measured loss and a relevant review queue', () => {
    render(
      <GrowthDecisionPanel
        currentSubscriptions={{ total: 5, pro: 3, premium: 2 }}
        growth={growth}
      />
    );

    expect(screen.getByText('Subscription decision loop')).toBeInTheDocument();
    expect(screen.getByText(/Largest measured loss:/).closest('p')).toHaveTextContent(
      'Pricing interest → Checkout. 31 learners, 86%'
    );
    expect(screen.getByText(/current paying/i).closest('span')).toHaveTextContent(
      '5 current paying'
    );
    expect(screen.getByText('New paid')).toBeInTheDocument();
    expect(screen.getByText(/Pricing follow-up/).closest('p')).toHaveTextContent(
      '31 did not start checkout'
    );
    expect(screen.getByText('High-intent free')).toBeInTheDocument();
    expect(screen.getByText(/single benefit that removes their next limit/i)).toBeInTheDocument();
    expect(screen.getByText(/AI proposes/)).toBeInTheDocument();
  });

  it('uses a concise opportunity strip on the Copilot tab', () => {
    render(
      <GrowthDecisionPanel
        compact
        currentSubscriptions={{ total: 5, pro: 3, premium: 2 }}
        growth={growth}
      />
    );

    expect(screen.getByText('Pricing follow-up')).toBeInTheDocument();
    expect(screen.getByText('31').closest('p')).toHaveTextContent('31 interested learners');
    expect(screen.getByText('5').parentElement).toHaveTextContent('5 paying now');
    expect(screen.queryByText('Account lifecycle')).not.toBeInTheDocument();
  });
});

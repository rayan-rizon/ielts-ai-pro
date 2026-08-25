import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AnalyticsHeader from '@/features/analytics/components/AnalyticsHeader';
import AnalyticsReport from '@/features/analytics/components/AnalyticsReport';
import PaidFeatureGate from '@/features/subscription/components/PaidFeatureGate';
import { hasContentAccess, hasPaidAccess } from '@/features/subscription/config/contentAccess';
import { AiBadge, TierBadge } from '@/features/dashboard/components/primitives';

describe('paid analytics entitlements', () => {
  it('grants advanced access from subscription tier, not admin role', () => {
    expect(hasPaidAccess({ subscription_tier: 'free' })).toBe(false);
    expect(hasPaidAccess({ subscription_tier: null })).toBe(false);
    expect(hasPaidAccess({ subscription_tier: 'pro' })).toBe(true);
    expect(hasPaidAccess({ subscription_tier: 'premium' })).toBe(true);
    expect(hasPaidAccess({ subscription_tier: 'free', role: 'admin' })).toBe(false);
    expect(hasContentAccess({ subscription_tier: 'free', role: 'admin' }, 'premium')).toBe(false);
    expect(hasContentAccess({ subscription_tier: 'pro' }, 'premium')).toBe(false);
  });

  it('does not mount personalised values inside a locked gate', () => {
    render(
      <MemoryRouter>
        <PaidFeatureGate
          hasAccess={false}
          label="Question types"
          title="Find the formats costing you marks"
          description="Rank formats from saved results."
        >
          <div>Private mastery: 17%</div>
        </PaidFeatureGate>
      </MemoryRouter>
    );

    expect(screen.queryByText('Private mastery: 17%')).not.toBeInTheDocument();
    expect(screen.getByText('Find the formats costing you marks')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see upgrade/i })).toHaveAttribute('href', '/upgrade');
  });

  it('uses the animated plan marker for both paid tiers', () => {
    render(
      <>
        <TierBadge tier="pro" />
        <TierBadge tier="premium" />
      </>
    );

    expect(screen.getByLabelText('Pro plan')).toHaveClass('dashboard-tier-badge--pro');
    expect(screen.getByLabelText('Premium plan')).toHaveClass('dashboard-tier-badge--premium');
  });

  it('uses the same tier marker in the analytics header', () => {
    render(
      <MemoryRouter>
        <AnalyticsHeader
          isPremium
          tier="premium"
          selectedTimeframe="30d"
          setSelectedTimeframe={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Premium plan')).toBeInTheDocument();
  });

  it('renders the compact AI capability marker with an active state', () => {
    render(<AiBadge active />);

    expect(screen.getByLabelText('AI feature')).toHaveClass('dashboard-ai-badge--active');
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('renders the real feature without upgrade chrome for paid users', () => {
    render(
      <MemoryRouter>
        <PaidFeatureGate
          hasAccess
          label="Question types"
          title="Find the formats costing you marks"
          description="Rank formats from saved results."
        >
          <div>Mastery report</div>
        </PaidFeatureGate>
      </MemoryRouter>
    );

    expect(screen.getByText('Mastery report')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /see upgrade/i })).not.toBeInTheDocument();
  });

  it('keeps short-term analytics free and routes longer ranges to upgrade', () => {
    const setSelectedTimeframe = vi.fn();
    render(
      <MemoryRouter>
        <AnalyticsHeader
          isPremium={false}
          tier="free"
          selectedTimeframe="30d"
          setSelectedTimeframe={setSelectedTimeframe}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '7 days' }));
    expect(setSelectedTimeframe).toHaveBeenCalledWith('7d');
    expect(screen.queryByText(/^Pro$/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '90 days' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /unlock 90-day and all-time/i })).toHaveAttribute(
      'href',
      '/upgrade'
    );
  });

  it('shows every advanced analytics card as an upgrade preview for free users', () => {
    render(
      <MemoryRouter>
        <AnalyticsReport
          headerProps={{
            isPremium: false,
            tier: 'free',
            selectedTimeframe: '30d',
            setSelectedTimeframe: vi.fn(),
          }}
          stats={{ moduleStats: [], enhancedMetrics: {} }}
          chartData={{ moduleHistory: {}, overallProgress: {}, recentPractice: [] }}
          user={{ subscription_tier: 'free', role: 'admin' }}
          isPremium={false}
          aiLoading={false}
          progressToTarget={0}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByLabelText(/requires Pro$/)).toHaveLength(6);
    expect(screen.getAllByRole('link', { name: /See upgrade/i })).toHaveLength(6);
    expect(screen.getByText('Know when your evidence is exam-ready')).toBeInTheDocument();
    expect(screen.getByText('Find the formats costing you marks')).toBeInTheDocument();
    expect(screen.getByText('Trace why each mark was lost')).toBeInTheDocument();
    expect(screen.getByText('Turn evidence into a focused plan')).toBeInTheDocument();
    expect(screen.getByText('Track the criteria behind your band')).toBeInTheDocument();
    expect(screen.getByText('See where performance drops inside a test')).toBeInTheDocument();
  });
});

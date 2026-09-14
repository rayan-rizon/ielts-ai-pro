import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

globalThis.ResizeObserver ||= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock('react-svg-worldmap', () => ({
  __esModule: true,
  default: () => <svg data-testid="world-map" />,
  regions: [{ code: 'BD' }],
}));

const { AdminOverviewSections } = await import('@/components/admin/overview/AdminOverviewSections');
const { TooltipProvider } = await import('@/components/ui/tooltip');

const signup = (overrides) => ({
  id: overrides.id,
  full_name: overrides.id,
  email: `${overrides.id}@example.com`,
  country: 'BD',
  created_at: new Date().toISOString(),
  subscription_tier: 'free',
  ...overrides,
});

const renderOverview = (data) =>
  render(
    <TooltipProvider>
      <AdminOverviewSections
        data={{ recentSignups: [], markets: [], marketMap: [], geoSummary: {}, ...data }}
        days={7}
        dateLabel="Sep 14"
        greeting="Morning"
        onDaysChange={() => {}}
        hourly={[]}
        maxHourly={0}
        peakHour={null}
      />
    </TooltipProvider>
  );

const renderSignups = (recentSignups) => renderOverview({ recentSignups });

describe('latest signups onboarding status', () => {
  it('does not call a learner who just signed up a failure', () => {
    renderSignups([
      signup({ id: 'fresh', onboarding_completed: false }),
      signup({
        id: 'stale',
        onboarding_completed: false,
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      }),
    ]);

    expect(screen.getByText(/BD · Signing up/)).toBeInTheDocument();
    expect(screen.getByText(/BD · Not onboarded/)).toBeInTheDocument();
  });

  it('separates a finished questionnaire from a skipped one', () => {
    renderSignups([
      signup({ id: 'answered', onboarding_completed: true, onboarding_outcome: 'answered' }),
      signup({ id: 'skipper', onboarding_completed: true, onboarding_outcome: 'skipped' }),
    ]);

    expect(screen.getByText(/BD · Onboarded/)).toBeInTheDocument();
    expect(screen.getByText(/BD · Skipped setup/)).toBeInTheDocument();
  });

  it('reads a legacy row with no recorded outcome as onboarded', () => {
    renderSignups([signup({ id: 'legacy', onboarding_completed: true })]);

    expect(screen.getByText(/BD · Onboarded/)).toBeInTheDocument();
  });
});

describe('plan offer summary inside the signup card', () => {
  it('names missing history instead of drawing it as a zero', () => {
    renderOverview({ onboardingOffer: { answered: 12, sawOffer: 0 } });

    expect(
      screen.getByText(/no data yet — 12 onboarded before tracking started/)
    ).toBeInTheDocument();
  });

  it('summarises the offer above the arrivals it describes', () => {
    renderOverview({
      onboardingOffer: {
        answered: 20,
        sawOffer: 18,
        clickedPro: 6,
        clickedPremium: 3,
        continuedFree: 7,
        leftUndecided: 2,
      },
    });

    expect(screen.getByText(/of 20 reached a price/)).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    ['Pro', 'Premium', 'free', 'undecided'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('says nobody reached it rather than reporting an empty funnel', () => {
    renderOverview({ onboardingOffer: { answered: 0 } });

    expect(screen.getByText(/nobody finished onboarding in 7d/)).toBeInTheDocument();
  });

  it('shows each learner what they did with the price', () => {
    renderOverview({
      recentSignups: [
        signup({ id: 'a', onboarding_completed: true, onboarding_plan_clicked: 'pro' }),
        signup({ id: 'b', onboarding_completed: true, onboarding_plan_clicked: 'premium' }),
        signup({ id: 'c', onboarding_completed: true, onboarding_offer_exit: 'free' }),
      ],
    });

    expect(screen.getByText(/BD · Chose Pro/)).toBeInTheDocument();
    expect(screen.getByText(/BD · Chose Premium/)).toBeInTheDocument();
    expect(screen.getByText(/BD · Stayed free/)).toBeInTheDocument();
  });
});

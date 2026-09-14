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

describe('onboarding plan offer panel', () => {
  it('names missing history instead of drawing it as a zero', () => {
    renderOverview({
      onboardingOffer: {
        answered: 12,
        notRecorded: 12,
        missedOffer: 0,
        sawOffer: 0,
        clickedPro: 0,
        clickedPremium: 0,
        continuedFree: 0,
        leftUndecided: 0,
      },
    });

    expect(screen.getByText('No offer data yet for this window')).toBeInTheDocument();
    expect(screen.getByText(/missing data, not a zero/)).toBeInTheDocument();
  });

  it('breaks the offer down once learners have actually seen a price', () => {
    renderOverview({
      onboardingOffer: {
        answered: 20,
        notRecorded: 0,
        missedOffer: 2,
        sawOffer: 18,
        clickedPro: 6,
        clickedPremium: 3,
        continuedFree: 7,
        leftUndecided: 2,
      },
    });

    expect(screen.getByText(/reached a price · 90% of 20 who finished setup/)).toBeInTheDocument();
    expect(screen.getByText('Went to checkout · Pro')).toBeInTheDocument();
    expect(screen.getByText('Went to checkout · Premium')).toBeInTheDocument();
    expect(screen.getByText('Continued on free')).toBeInTheDocument();
    expect(screen.getByText('Left without choosing')).toBeInTheDocument();
    expect(screen.getByText('2 left before the offer finished loading.')).toBeInTheDocument();
  });

  it('says the offer was never shown rather than reporting an empty funnel', () => {
    renderOverview({ onboardingOffer: { answered: 0 } });

    expect(screen.getByText(/Nobody finished onboarding in the last 7 days/)).toBeInTheDocument();
  });
});

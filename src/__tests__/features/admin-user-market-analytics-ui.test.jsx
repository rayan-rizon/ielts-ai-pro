import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import UserAnalytics from '@/components/admin/UserAnalytics';
import { describe, expect, it, vi } from 'vitest';

vi.mock('recharts', () => ({
  AreaChart: () => <div data-testid="growth-chart" />,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

const renderAnalytics = () =>
  render(
    <TooltipProvider>
      <UserAnalytics
        selectedRange="30D"
        onRangeChange={() => {}}
        stats={{
          totalUsers: 120,
          newUsers: 17,
          activeUsers: 54,
          testers: 22,
          completedTests: 31,
          conversionRate: 8.3,
          activationRate: 64.7,
          engagement: {
            activeRate: 45,
            repeatRate: 36.4,
            repeatTesters: 8,
          },
          geoSummary: {
            identifiedSignups: 15,
            unknownSignups: 2,
            coverageRate: 88.2,
            countries: 2,
          },
        }}
        analyticsData={{
          userGrowthData: [{ date: 'Aug 31', signups: 17, testers: 8, completions: 6 }],
          funnel: [
            { label: 'Signed up', users: 17 },
            { label: 'Finished onboarding', users: 11 },
            { label: 'Started practice', users: 8 },
            { label: 'Paid', users: 2 },
          ],
          geography: [
            {
              country: 'BD',
              signups: 10,
              share: 58.8,
              activationRate: 70,
              practiceRate: 60,
              paidRate: 10,
            },
            {
              country: 'US',
              signups: 5,
              share: 29.4,
              activationRate: 60,
              practiceRate: 40,
              paidRate: 20,
            },
            {
              country: 'unknown',
              signups: 2,
              share: 11.8,
              activationRate: 50,
              practiceRate: 0,
              paidRate: 0,
            },
          ],
          acquisitionChannels: [
            {
              channel: 'paid_search',
              signups: 8,
              activationRate: 75,
              practiceRate: 62.5,
              paidRate: 12.5,
            },
          ],
          recentSignups: [
            {
              id: 'learner-1',
              full_name: 'Ayesha Rahman',
              email: 'ayesha@example.com',
              created_at: '2026-08-31T12:00:00.000Z',
              subscription_tier: 'free',
              country: 'BD',
              signup_channel: 'paid_search',
              signup_utm_source: 'google',
            },
          ],
        }}
      />
    </TooltipProvider>
  );

describe('admin user market analytics UI', () => {
  it('renders country coverage, cohort quality, and guarded operator analysis', () => {
    renderAnalytics();

    expect(screen.getByText('Bangladesh')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('Unknown country')).toBeInTheDocument();
    expect(screen.getByText(/88.2% covered/i)).toBeInTheDocument();
    expect(screen.getByText('Acquisition quality')).toBeInTheDocument();
    expect(screen.getByText('Paid search (Google ads)')).toBeInTheDocument();
    expect(screen.getByText('Largest observed market')).toBeInTheDocument();
    expect(screen.getByText(/markets with at least 5 signups/i)).toBeInTheDocument();
    expect(screen.getByText(/2 remain unknown/i)).toBeInTheDocument();
  });
});

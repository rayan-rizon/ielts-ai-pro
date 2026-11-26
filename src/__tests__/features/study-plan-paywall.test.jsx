import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StudyPlanPaywall from '@/features/learning/components/dashboard/StudyPlanPaywall';
import LearningPath from '@/features/learning/pages/LearningPath';
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar';
import { UserSidebar } from '@/features/core/components/Sidebar/UserSidebar';
import * as usePricingModule from '@/features/subscription/hooks/usePricing';

const authState = vi.hoisted(() => ({
  user: null,
  isAdmin: false,
}));

const learningPathDataMock = vi.hoisted(() =>
  vi.fn(() => ({
    learningPath: null,
    stats: { moduleAverages: {}, moduleTrends: {}, totalTests: 0, sessions: [] },
    skillMap: { byModule: {}, totals: { skills: 0, due: 0 } },
    isLoading: false,
    activityByKey: {},
    toggleActivity: vi.fn(),
    rescheduleActivity: vi.fn(),
    hasError: false,
    retry: vi.fn(),
  }))
);

vi.mock('@/features/subscription/hooks/usePricing');
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => authState,
}));
vi.mock('@/features/learning/hooks/useLearningPathData', () => ({
  default: learningPathDataMock,
  useLearningPathData: learningPathDataMock,
}));
vi.mock('@/features/learning/components/dashboard/StudyPlanDashboard', () => ({
  default: ({ user }) => <div data-testid="study-plan-dashboard">{user?.subscription_tier}</div>,
}));

function renderWithRouter(ui, initialEntry = '/learning-path') {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>
    </HelmetProvider>
  );
}

describe('StudyPlanPaywall and LearningPath gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    authState.user = {
      id: 'learner-free',
      subscription_tier: 'free',
      target_band_score: 7.5,
      test_date: '2027-01-15',
    };
    authState.isAdmin = false;
    usePricingModule.usePricing.mockReturnValue({
      plans: [
        { tier: 'pro', basePrice: 499, currencySymbol: '৳', currency: 'BDT' },
        { tier: 'premium', basePrice: 799, currencySymbol: '৳', currency: 'BDT' },
      ],
      pricingConfig: {
        userCountry: 'BD',
        pricingCountry: 'BD',
        tierLimits: {
          pro: { writing_monthly_limit: 50, speaking_monthly_limit: 25 },
          premium: { writing_monthly_limit: 100, speaking_monthly_limit: 50 },
        },
      },
      pricingCountry: 'BD',
      isLoading: false,
    });
  });

  it('renders the interactive live reschedule preview and 7-day risk-free paywall', () => {
    renderWithRouter(<StudyPlanPaywall user={authState.user} />);

    expect(screen.getByText(/How your plan bridges to Band/i)).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
    expect(screen.getByText('4-Skill target bridge')).toBeInTheDocument();
    expect(screen.getByText('Roadmap phases')).toBeInTheDocument();
    expect(screen.getByText('Unlock your Study Plan')).toBeInTheDocument();
    expect(screen.getAllByText('Balanced · 45 min/day').length).toBeGreaterThanOrEqual(1);

    // Clicking a day slot updates the session detail bar
    fireEvent.click(screen.getByRole('button', { name: /TUE/i }));
    expect(screen.getByText(/TUE: Writing Task 2 Coherence Drill/i)).toBeInTheDocument();

    // Simulate skipping Wednesday and confirm rebalancing updates Thu & Fri
    const simBtn = screen.getByRole('button', { name: /Simulate: Skip Wed/i });
    fireEvent.click(simBtn);
    expect(screen.getByText('Rebalanced! Wed shifted to Thu & Fri')).toBeInTheDocument();
    expect(screen.getByText('Skipped')).toBeInTheDocument();
    expect(screen.getByText('Listen + P2')).toBeInTheDocument();

    // Pro selected by default, switching to Premium updates CTA & pricing link
    const ctaLink = screen.getByRole('link', { name: /Continue with Pro · ৳499\/mo/i });
    expect(ctaLink).toHaveAttribute('href', expect.stringContaining('/pricing?plan=pro'));

    fireEvent.click(screen.getByRole('radio', { name: /Premium/i }));
    const premLink = screen.getByRole('link', {
      name: /Continue with Premium · ৳799\/mo/i,
    });
    expect(premLink).toHaveAttribute('href', expect.stringContaining('/pricing?plan=premium'));
  });

  it('renders StudyPlanPaywall for free learners on /learning-path without querying paid path data', () => {
    renderWithRouter(<LearningPath />);

    expect(learningPathDataMock).toHaveBeenCalledWith({ enabled: false });
    expect(screen.queryByTestId('study-plan-dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('Unlock your Study Plan')).toBeInTheDocument();
  });

  it('renders StudyPlanDashboard for paid learners on /learning-path', () => {
    authState.user = { id: 'learner-pro', subscription_tier: 'pro' };
    renderWithRouter(<LearningPath />);

    expect(learningPathDataMock).toHaveBeenCalledWith({ enabled: true });
    expect(screen.getByTestId('study-plan-dashboard')).toHaveTextContent('pro');
  });

  it('keeps the Study plan sidebar link pointing directly to /learning-path for free users', () => {
    renderWithRouter(
      <SidebarProvider open={true}>
        <Sidebar collapsible="icon">
          <UserSidebar
            user={{ full_name: 'Free Student', subscription_tier: 'free' }}
            location={{ pathname: '/dashboard' }}
            handleLogout={vi.fn()}
          />
        </Sidebar>
      </SidebarProvider>
    );

    const studyPlanLink = screen.getByRole('link', { name: /Study plan/i });
    expect(studyPlanLink).toHaveAttribute('href', '/learning-path');
  });
});

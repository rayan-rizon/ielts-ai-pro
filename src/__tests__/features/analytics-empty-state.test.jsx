import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EmptyAnalyticsView from '@/features/analytics/components/EmptyAnalyticsView';

const mockHeaderProps = {
  user: { email: 'test@example.com', subscription_tier: 'free' },
  stats: {},
  isPremium: false,
  tier: 'free',
  role: 'user',
  selectedTimeframe: '30d',
  setSelectedTimeframe: () => {},
};

function renderEmptyAnalytics(props = {}) {
  return render(
    <MemoryRouter>
      <EmptyAnalyticsView
        headerProps={mockHeaderProps}
        stats={{
          totalTests: 0,
          measuredTests: 0,
          avgScore: null,
          targetScore: 7.0,
          studyHours: 0,
          vocabCount: 0,
          efficiency: {},
          ...props.stats,
        }}
        user={{
          test_date: '2026-11-15T00:00:00.000Z',
          ...props.user,
        }}
        progressToTarget={props.progressToTarget ?? 0}
      />
    </MemoryRouter>
  );
}

describe('EmptyAnalyticsView', () => {
  it('renders top StatCards with zero-state placeholders', () => {
    renderEmptyAnalytics();

    expect(screen.getByText('Practice average')).toBeInTheDocument();
    expect(screen.getAllByText('--').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('No score yet')).toBeInTheDocument();
    expect(screen.getByText('Tests Counted')).toBeInTheDocument();
    expect(screen.getByText('0 sessions in this period')).toBeInTheDocument();
    expect(screen.getByText('Study Effort')).toBeInTheDocument();
    expect(screen.getByText('0.0h')).toBeInTheDocument();
  });

  it('renders the performance analytics pipeline and 3 analytical preview engines', () => {
    renderEmptyAnalytics();

    expect(screen.getByText('Performance analytics pipeline')).toBeInTheDocument();
    expect(screen.getByText('Awaiting baseline test')).toBeInTheDocument();
    expect(screen.getByText('Unlock your IELTS performance intelligence')).toBeInTheDocument();
    expect(screen.getByText('Band trajectory engine')).toBeInTheDocument();
    expect(screen.getByText('Examiner criteria rubric')).toBeInTheDocument();
    expect(screen.getByText('Weak-spot diagnostic radar')).toBeInTheDocument();
  });

  it('renders direct 4-module starter paper links instead of a dashboard loop', () => {
    renderEmptyAnalytics();

    const readingLink = screen.getByRole('link', {
      name: /academic reading · diagnostic set/i,
    });
    expect(readingLink).toHaveAttribute('href', '/reading-test');

    const listeningLink = screen.getByRole('link', {
      name: /listening section 1 · everyday social/i,
    });
    expect(listeningLink).toHaveAttribute('href', '/listening-test');

    const writingLink = screen.getByRole('link', {
      name: /writing task 2 · essay prompt/i,
    });
    expect(writingLink).toHaveAttribute('href', '/writing-task');

    const speakingLink = screen.getByRole('link', {
      name: /speaking part 1 · interview flow/i,
    });
    expect(speakingLink).toHaveAttribute('href', '/speaking-test');
  });

  it('renders readiness benchmarks and target schedule card with onboarding links', () => {
    renderEmptyAnalytics({
      stats: { targetScore: 7.5 },
      user: { test_date: '2026-12-01T00:00:00.000Z' },
    });

    expect(screen.getByText('Readiness benchmarks')).toBeInTheDocument();
    expect(screen.getByText('0 of 3 active')).toBeInTheDocument();
    expect(screen.getByText('4-Module Baseline')).toBeInTheDocument();
    expect(screen.getByText('Score Consistency')).toBeInTheDocument();
    expect(screen.getByText('Target Proximity')).toBeInTheDocument();

    expect(screen.getByText('Target & schedule')).toBeInTheDocument();
    expect(screen.getAllByText('7.5').length).toBeGreaterThanOrEqual(1);

    const adjustLinks = screen.getAllByRole('link', {
      name: /adjust|update preparation schedule/i,
    });
    expect(adjustLinks.length).toBeGreaterThanOrEqual(1);
    adjustLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/onboarding');
    });
  });
});

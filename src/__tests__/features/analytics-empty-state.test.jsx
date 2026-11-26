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
        headerProps={{ ...mockHeaderProps, isPremium: props.isPremium ?? false }}
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
    expect(screen.getAllByText('0 sessions in this period')[0]).toBeInTheDocument();
    expect(screen.getByText('Study Effort')).toBeInTheDocument();
    expect(screen.getByText('0.0h')).toBeInTheDocument();
  });

  it('previews the report with the learner target and no invented data', () => {
    renderEmptyAnalytics();

    expect(screen.getByText('Band progress')).toBeInTheDocument();
    expect(screen.getByText('No scores yet')).toBeInTheDocument();
    expect(screen.getByText('Target 7.0')).toBeInTheDocument();
    [
      'Band by module',
      'Exam readiness',
      'Question types',
      'Answer analysis',
      'Practise next',
      'Examiner criteria',
      'Accuracy by position',
      'Practice log',
    ].forEach((title) => expect(screen.getByText(title)).toBeInTheDocument());
  });

  it('marks the gated previews as Pro for free learners only', () => {
    const free = renderEmptyAnalytics();
    expect(free.container.querySelectorAll('.lucide-lock')).toHaveLength(6);
    free.unmount();

    const premium = renderEmptyAnalytics({ isPremium: true });
    expect(premium.container.querySelectorAll('.lucide-lock')).toHaveLength(0);
  });

  it('offers a start link for each of the four modules', () => {
    renderEmptyAnalytics();

    ['reading', 'listening', 'writing', 'speaking'].forEach((module) => {
      const href = module === 'writing' ? '/writing-task' : `/${module}-test`;
      expect(
        screen.getByRole('link', { name: new RegExp(`${module}.*start`, 'i') })
      ).toHaveAttribute('href', href);
    });
  });

  it('lets the learner adjust the target shown on the chart', () => {
    renderEmptyAnalytics({ stats: { targetScore: 7.5 } });

    expect(screen.getByText('Target 7.5')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /adjust target/i })).toHaveAttribute(
      'href',
      '/onboarding'
    );
  });

  it('draws no target line when no target is set', () => {
    renderEmptyAnalytics({ stats: { targetScore: null } });

    expect(screen.queryByText(/^Target \d/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /set target/i })).toBeInTheDocument();
  });
});

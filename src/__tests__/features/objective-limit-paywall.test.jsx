import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  capture: vi.fn(),
  quotaData: undefined,
  invalidate: vi.fn(),
}));

vi.mock('@/lib/posthog', () => ({ captureProductEvent: mocks.capture }));
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));
vi.mock('@/features/auth/hooks/useUserProfile', () => ({
  useUserProfile: () => ({ data: { id: 'user-1', subscription_tier: 'free' } }),
}));
vi.mock('@/features/subscription/hooks/usePricing', () => ({
  usePricing: () => ({
    isLoading: false,
    plans: [{ tier: 'pro', currencySymbol: '৳', basePrice: 499, oldPrice: 799 }],
  }),
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: mocks.quotaData, isLoading: false }),
  useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
}));

import ObjectiveLimitPaywall from '@/features/testing/shared/components/ObjectiveLimitPaywall';
import {
  ObjectiveQuotaStrip,
  ObjectiveStartNote,
} from '@/features/testing/shared/components/ObjectiveQuotaControls';
import { summariseObjectiveQuota } from '@/features/testing/shared/quota/objectiveQuota';

const status = (limit, used) => ({ limit, used });

const renderInRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('ObjectiveLimitPaywall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows what was used, what stays free and what Pro changes', () => {
    renderInRouter(
      <ObjectiveLimitPaywall
        testType="reading"
        quota={summariseObjectiveQuota(status(5, 5))}
        testTitle="IELTS 21 Reading 2026 Test 2"
      />
    );

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: "You've used all 5 of your free Reading tests",
      })
    ).toBeInTheDocument();
    expect(screen.getByText('IELTS 21 Reading 2026 Test 2')).toBeInTheDocument();
    // Nothing resets, so the paywall must not promise a wait.
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(screen.queryByText(/next free test/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText('5 of 5 used')).toBeInTheDocument();
    expect(screen.getByText(/resume a test you've already started/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to reading tests/i })).toHaveAttribute(
      'href',
      '/reading'
    );
    expect(screen.getByRole('link', { name: /go unlimited with pro/i })).toHaveAttribute(
      'href',
      '/pricing?plan=pro'
    );
    expect(screen.getByText('৳499')).toBeInTheDocument();
    expect(screen.getByText('Unlimited AI Reading Assistant')).toBeInTheDocument();
  });

  it('uses the singular when only one free test was allowed', () => {
    renderInRouter(
      <ObjectiveLimitPaywall testType="listening" quota={summariseObjectiveQuota(status(1, 1))} />
    );
    expect(
      screen.getByRole('heading', { name: "You've used your free Listening test" })
    ).toBeInTheDocument();
    // Listening does not promise the Reading assistant.
    expect(screen.queryByText('Unlimited AI Reading Assistant')).not.toBeInTheDocument();
    expect(screen.getByText('AI Writing and Speaking feedback')).toBeInTheDocument();
  });

  it('is honest when the plan has no free tests at all', () => {
    renderInRouter(
      <ObjectiveLimitPaywall testType="reading" quota={summariseObjectiveQuota(status(0, 0))} />
    );
    expect(
      screen.getByRole('heading', { name: 'Reading tests are part of Pro' })
    ).toBeInTheDocument();
    expect(screen.getByText(/doesn't include Reading tests/i)).toBeInTheDocument();
  });

  it('records one impression and the upgrade click', () => {
    renderInRouter(
      <ObjectiveLimitPaywall
        testType="reading"
        surface="start_refused"
        quota={summariseObjectiveQuota(status(5, 5))}
      />
    );
    expect(mocks.capture).toHaveBeenCalledTimes(1);
    expect(mocks.capture).toHaveBeenCalledWith('test_limit_paywall_viewed', {
      test_type: 'reading',
      source: 'start_refused',
      current_tier: 'free',
    });

    fireEvent.click(screen.getByRole('link', { name: /go unlimited with pro/i }));
    expect(mocks.capture).toHaveBeenLastCalledWith('test_limit_upgrade_clicked', {
      test_type: 'reading',
      source: 'start_refused',
      current_tier: 'free',
    });
  });

  it('lets the dialog be dismissed without leaving the library', () => {
    const onClose = vi.fn();
    renderInRouter(
      <ObjectiveLimitPaywall
        variant="dialog"
        surface="library"
        testType="reading"
        quota={summariseObjectiveQuota(status(5, 5))}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /not now/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('library allowance strip and start note', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing for learners without a limit', () => {
    mocks.quotaData = { reading: status(-1, 4) };
    const { container } = renderInRouter(<ObjectiveQuotaStrip testType="reading" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows how many free tests are left', () => {
    mocks.quotaData = { reading: status(5, 2) };
    renderInRouter(<ObjectiveQuotaStrip testType="reading" />);
    expect(screen.getByText('3 free Reading tests left')).toBeInTheDocument();
    expect(screen.getByText('2 of 5 used')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go unlimited/i })).toBeInTheDocument();
  });

  it('calls out the last free test', () => {
    mocks.quotaData = { reading: status(5, 4) };
    renderInRouter(<ObjectiveQuotaStrip testType="reading" />);
    expect(screen.getByText('Last free Reading test')).toBeInTheDocument();
  });

  it('turns into an upgrade prompt that opens the paywall when the total is used', () => {
    mocks.quotaData = { listening: status(3, 3) };
    renderInRouter(<ObjectiveQuotaStrip testType="listening" />);
    expect(screen.getByText('Free Listening tests used')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go unlimited/i })).toHaveAttribute(
      'aria-haspopup',
      'dialog'
    );
  });

  it('tells the learner a start spends one free test, but only while one is left', () => {
    mocks.quotaData = { reading: status(5, 1) };
    const { unmount } = renderInRouter(<ObjectiveStartNote testType="reading" />);
    expect(screen.getByText(/starting uses 1 of your 5 free reading tests/i)).toBeInTheDocument();
    expect(screen.getByText('4 left.')).toBeInTheDocument();
    unmount();

    mocks.quotaData = { reading: status(5, 4) };
    const last = renderInRouter(<ObjectiveStartNote testType="reading" />);
    expect(screen.getByText('This is your last one.')).toBeInTheDocument();
    last.unmount();

    mocks.quotaData = { reading: status(5, 5) };
    const spent = renderInRouter(<ObjectiveStartNote testType="reading" />);
    expect(spent.container).toBeEmptyDOMElement();
  });
});

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({ list: vi.fn(), upsert: vi.fn() }));
vi.mock('@/features/admin/services/TierRateLimit', () => ({
  TierRateLimit: { list: mocks.list, upsert: mocks.upsert },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import TierRateLimitsSettings from '@/components/admin/settings/TierRateLimitsSettings';

describe('admin objective test limits', () => {
  it('lets an admin save a Free Reading limit while paid tiers remain unlimited', async () => {
    const base = {
      currency: 'ALL',
      daily_limit: 0,
      monthly_limit: 3,
      burst_limit: 3,
      writing_daily_limit: 3,
      writing_monthly_limit: 3,
      speaking_daily_limit: 2,
      speaking_monthly_limit: 2,
      reading_test_limit: -1,
      listening_test_limit: -1,
    };
    mocks.list.mockResolvedValue(
      ['free', 'pro', 'premium', 'admin'].map((tier) => ({ ...base, tier }))
    );
    mocks.upsert.mockResolvedValue({});
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <TierRateLimitsSettings />
      </QueryClientProvider>
    );

    const freeHeading = await screen.findByText('free tier');
    const freeCard = freeHeading.closest('.overflow-hidden');
    expect(freeCard).not.toBeNull();
    const free = within(freeCard);
    expect(screen.queryByText('General API')).toBeNull();
    expect(screen.queryByText('Burst/min')).toBeNull();
    expect(free.getByText('Reading & Listening free tests')).toBeTruthy();
    expect(free.getByText(/for the life of the account/)).toBeTruthy();
    expect(free.queryByLabelText('Daily free tests')).toBeNull();
    const [readingLimit, listeningLimit] = free.getAllByLabelText('Free tests limit');
    expect(readingLimit.disabled).toBe(true);
    expect(listeningLimit.disabled).toBe(true);
    fireEvent.click(free.getAllByLabelText('Free tests unlimited')[0]);
    fireEvent.change(readingLimit, { target: { value: '5' } });
    fireEvent.click(free.getByRole('button', { name: /^save$/i }));
    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenCalledWith(
        'free',
        'ALL',
        expect.objectContaining({
          reading_test_limit: 5,
          listening_test_limit: -1,
          daily_limit: 0,
          monthly_limit: 3,
          burst_limit: 3,
        })
      )
    );

    const proCard = screen.getByText('pro tier').closest('.overflow-hidden');
    expect(within(proCard).getAllByText('Unlimited test starts')).toHaveLength(2);
    expect(within(proCard).queryByLabelText('Free tests limit')).toBeNull();
  });
});

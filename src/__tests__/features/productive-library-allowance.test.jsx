import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  describeProductiveQuota,
  markAllowanceUpgrade,
} from '@/features/testing/shared/quota/useProductiveAllowance';
import ProductiveAllowancePanel from '@/features/testing/shared/components/ProductiveAllowancePanel';

vi.mock('@/lib/supabase', () => ({ supabase: {} }));

const writing = { allowed: true, monthly_used: 1, monthly_remaining: 5, daily_remaining: 5 };
const speaking = { allowed: false, monthly_used: 2, monthly_remaining: 0, daily_remaining: 0 };

describe('Library evaluation and start allowances', () => {
  it('shows half evaluations against the configured monthly Writing allowance', () => {
    const usage = describeProductiveQuota('writing', writing);
    render(
      <MemoryRouter>
        <ProductiveAllowancePanel skill="writing" allowance={{ usage, canUpgrade: true }} />
      </MemoryRouter>
    );
    expect(screen.getByText('0.5 of 3 used')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Unlock with Pro' })).toHaveAttribute(
      'href',
      '/pricing?plan=pro'
    );
  });

  it('keeps monthly usage separate from the daily gate and does not offer a paid user Pro again', () => {
    const usage = describeProductiveQuota('speaking', { ...speaking, monthly_remaining: 3 });
    render(
      <MemoryRouter>
        <ProductiveAllowancePanel skill="speaking" allowance={{ usage, canUpgrade: false }} />
      </MemoryRouter>
    );
    expect(screen.getByText('Daily limit reached · 3 left this month')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Unlock with Pro' })).toBeNull();
  });

  it('marks exhausted Free accounts without reclassifying tests for other learners', () => {
    const tests = [{ id: 'free-speaking' }];
    const usage = describeProductiveQuota('speaking', speaking);
    expect(markAllowanceUpgrade(tests, { usage, canUpgrade: true })).toEqual([
      { id: 'free-speaking', upgradeForAllowance: true },
    ]);
    expect(markAllowanceUpgrade(tests, { usage, canUpgrade: false })).toBe(tests);
  });
});
